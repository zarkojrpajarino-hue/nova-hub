/**
 * sync-hubspot — Edge Function
 *
 * Orquestador puro: descarga deals de HubSpot CRM,
 * normaliza via ContractEntity (hubspot-commercial.ts), almacena en
 * integration_entities.
 *
 * Estrategia de sync:
 *   - Primer run (last_sync_at = null): full scan paginado de todos los deals
 *   - Siguientes runs: incremental via hs_lastmodifieddate >= last_sync_at
 *
 * Paginación: cursor-based (HubSpot `after`), máx 10 páginas / 1000 deals por run.
 * Si se supera el límite → status='partial', cursor guardado en pagination_cursor.
 *
 * Motor writes:
 *   - NO en v1 — deals van solo a integration_entities.
 *   - Hidratación a `obvs` pendiente: BLOQUE D/E (I15.45).
 *   - Sin run_probability_engine (deals no afectan motor financiero directamente en v1).
 *   - Sales Agent (I15.79) se llamará desde el frontend una vez implementado.
 *
 * Input:  { project_id: string, connection_id: string }
 * Output: { ok, entities_synced, entities_written, entities_rejected,
 *           is_partial, pre_engine_snapshot, post_engine_snapshot }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import md5 from 'https://esm.sh/md5'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'
import { withRetry } from '../_shared/retry.ts'
import { normalizeHubSpotDeal } from '../_shared/normalizers/hubspot-commercial.ts'
import type { ContractEntity } from '../_shared/normalizers/hubspot-commercial.ts'

// ──────────────────────────────────────────────────────────────────────────────
// canonicalJson — replica de src/lib/canonical-hash.ts (sin import Node crypto)
// ──────────────────────────────────────────────────────────────────────────────

function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']'
  if (typeof value === 'object') {
    const sorted = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`)
      .join(',')
    return '{' + sorted + '}'
  }
  return JSON.stringify(value)
}

// Mapeo HubSpot deal stage → lead_status ENUM (I15.DEBT.5)
// lead_status: 'frio' | 'tibio' | 'hot' | 'propuesta' | 'negociacion' | 'cerrado_ganado' | 'cerrado_perdido'
function dealStageToLeadStatus(stage: string): string {
  switch (stage) {
    case 'prospect':    return 'frio'
    case 'qualified':   return 'tibio'
    case 'proposal':    return 'propuesta'
    case 'negotiation': return 'negociacion'
    case 'closed_won':  return 'cerrado_ganado'
    case 'closed_lost': return 'cerrado_perdido'
    default:            return 'frio'
  }
}

const HUBSPOT_API      = 'https://api.hubapi.com'
const ADAPTER_VERSION  = '1.0'
const CONTRACT_VERSION = '1.0'
const PAGE_SIZE        = 100
const MAX_PAGES        = 10  // 1000 deals máximo por run

// Propiedades que pedimos a HubSpot
const DEAL_PROPERTIES = [
  'dealname', 'amount', 'dealstage', 'closedate',
  'hubspot_owner_id', 'pipeline', 'currency', 'createdate',
  'hs_lastmodifieddate',
].join(',')

// ──────────────────────────────────────────────────────────────────────────────
// Tipos HubSpot API v3
// ──────────────────────────────────────────────────────────────────────────────

interface HubSpotDealPage {
  results: Array<{
    id: string
    properties: {
      dealname:         string | null
      amount:           string | null
      dealstage:        string | null
      closedate:        string | null
      hubspot_owner_id: string | null
      pipeline:         string | null
      currency:         string | null
      createdate:       string | null
      hs_lastmodifieddate: string | null
    }
  }>
  paging?: {
    next?: {
      after: string
    }
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin)

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const appSecret      = Deno.env.get('APP_ENCRYPTION_SECRET')!
  const serviceClient  = createClient(supabaseUrl, serviceRoleKey)
  let sync_run_id: string | null = null

  try {
    await validateAuth(req)
    const { project_id, connection_id } = await req.json()

    if (!project_id || !connection_id) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 1: Descifrar token y obtener metadata de la conexión
    // ──────────────────────────────────────────────────────────────────────────
    const { data: tokenData, error: decryptError } = await serviceClient.rpc(
      'decrypt_integration_credential',
      { p_connection_id: connection_id, p_credential_key: 'access_token', p_app_secret: appSecret }
    )

    if (decryptError || !tokenData) {
      console.error('Error decrypting credential:', decryptError)
      return new Response(
        JSON.stringify({ ok: false, reason: 'credential_not_found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    const accessToken = tokenData as string

    // Leer last_sync_at para incremental
    const { data: connData, error: connErr } = await serviceClient
      .from('integration_connections')
      .select('last_sync_at')
      .eq('id', connection_id)
      .single()

    if (connErr || !connData) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'connection_not_found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    const lastSyncAt: string | null = connData.last_sync_at

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 2: Crear sync_run status='running'
    // ──────────────────────────────────────────────────────────────────────────
    const { data: syncRun, error: syncRunError } = await serviceClient
      .from('integration_sync_runs')
      .insert({
        connection_id,
        project_id,
        provider:        'hubspot',
        trigger_type:    'manual',
        status:          'running',
        adapter_version: ADAPTER_VERSION,
      })
      .select('id')
      .single()

    if (syncRunError || !syncRun) {
      console.error('Error creating sync_run:', syncRunError)
      return new Response(
        JSON.stringify({ ok: false, reason: 'sync_run_error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    sync_run_id = syncRun.id

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 3: Pre-engine snapshot
    // ──────────────────────────────────────────────────────────────────────────
    const { data: preSnapshot } = await serviceClient.rpc('get_engine_snapshot', {
      p_project_id: project_id,
    })

    await serviceClient
      .from('integration_sync_runs')
      .update({ pre_engine_snapshot: preSnapshot ?? null })
      .eq('id', sync_run_id)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 4: Descargar deals de HubSpot con paginación (máx MAX_PAGES páginas)
    //
    // Full sync: GET /crm/v3/objects/deals?properties=...&limit=100&after=cursor
    // Incremental: POST /crm/v3/objects/deals/search con filtro hs_lastmodifieddate >= lastSyncAt
    // ──────────────────────────────────────────────────────────────────────────
    const now = new Date().toISOString()
    // Convertir lastSyncAt ISO → unix ms para el filtro HubSpot
    const lastSyncMs = lastSyncAt ? new Date(lastSyncAt).getTime() : null

    const rawDeals: HubSpotDealPage['results'] = []
    let afterCursor: string | null = null
    let savedCursor: string | null = null
    let pageCount = 0
    let isPartial = false

    do {
      let page: HubSpotDealPage

      if (lastSyncMs) {
        // Incremental — search API con filtro de fecha
        const searchBody: Record<string, unknown> = {
          filterGroups: [{
            filters: [{
              propertyName: 'hs_lastmodifieddate',
              operator:     'GTE',
              value:        String(lastSyncMs),
            }],
          }],
          properties: DEAL_PROPERTIES.split(','),
          limit:      PAGE_SIZE,
          ...(afterCursor && { after: afterCursor }),
        }

        const { result } = await withRetry(() =>
          fetch(`${HUBSPOT_API}/crm/v3/objects/deals/search`, {
            method:  'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type':  'application/json',
            },
            body: JSON.stringify(searchBody),
          }).then(async (r) => {
            if (!r.ok) {
              const body = await r.text()
              throw new Error(`HubSpot search API ${r.status}: ${body}`)
            }
            return r.json() as Promise<HubSpotDealPage>
          })
        )
        page = result
      } else {
        // Full scan — GET con paginación
        const params = new URLSearchParams({
          properties: DEAL_PROPERTIES,
          limit:      String(PAGE_SIZE),
          ...(afterCursor ? { after: afterCursor } : {}),
        })

        const { result } = await withRetry(() =>
          fetch(`${HUBSPOT_API}/crm/v3/objects/deals?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }).then(async (r) => {
            if (!r.ok) {
              const body = await r.text()
              throw new Error(`HubSpot deals API ${r.status}: ${body}`)
            }
            return r.json() as Promise<HubSpotDealPage>
          })
        )
        page = result
      }

      rawDeals.push(...(page.results ?? []))
      pageCount++

      const nextAfter = page.paging?.next?.after ?? null
      afterCursor = nextAfter

      if (pageCount >= MAX_PAGES && afterCursor) {
        isPartial = true
        savedCursor = afterCursor
        afterCursor = null
      }
    } while (afterCursor)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 5: Normalizar + almacenar en integration_entities (ContractEntity)
    // ──────────────────────────────────────────────────────────────────────────
    const ctx = { connection_id, sync_run_id, project_id, source_timestamp: now }
    const acceptedEntities: ContractEntity[] = []
    let entitiesRejected = 0
    let entitiesWritten  = 0

    for (const raw of rawDeals) {
      const entity = normalizeHubSpotDeal(raw, ctx)

      if (!entity) {
        entitiesRejected++
        continue
      }

      acceptedEntities.push(entity)

      const { error: entityError } = await serviceClient
        .from('integration_entities')
        .upsert(
          {
            connection_id:    entity.connection_id,
            sync_run_id:      entity.sync_run_id,
            project_id:       entity.project_id,
            provider:         entity.provider,
            entity_type:      entity.entity_type,
            external_id:      entity.external_id,
            occurred_at:      entity.occurred_at,
            source_timestamp: entity.source_timestamp,
            confidence:       entity.confidence,
            payload:          entity.payload,
            status:           'pending',
            contract_version: CONTRACT_VERSION,
          },
          { onConflict: 'connection_id,provider,entity_type,external_id' }
        )

      if (!entityError) {
        entitiesWritten++
      } else {
        console.error(`Error upserting deal ${entity.external_id}:`, entityError)
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 6: Sales Agent motor write — deals → obvs (I15.DEBT.5)
    //
    // Hidrata HubSpot deals como OBVs en el CRM interno.
    // Solo deals con confidence >= 0.8 (guard lo requiere).
    // Sin run_probability_engine — deals no afectan motor financiero directamente.
    // ──────────────────────────────────────────────────────────────────────────
    let obvsWritten  = 0
    let obvsSkipped  = 0
    let _obvsMissed   = 0

    const highConfDeals = acceptedEntities.filter((e) => e.confidence >= 0.8)

    for (const entity of highConfDeals) {
      const dealPayload = entity.payload
      const valorPotencial = dealPayload.amount_cents > 0
        ? Math.round(dealPayload.amount_cents) / 100
        : null

      const obvPayload: Record<string, unknown> = {
        external_id:     entity.external_id,
        titulo:          dealPayload.deal_name || 'Deal sin nombre',
        tipo:            'venta',  // HubSpot deals → tipo 'venta' (obv_type ENUM)
        pipeline_status: dealStageToLeadStatus(dealPayload.stage),
        fecha:           dealPayload.close_date ?? now.slice(0, 10),
        ...(valorPotencial !== null && { valor_potencial: valorPotencial }),
      }

      const obvHash = md5(canonicalJson(obvPayload))

      const { data: obvResult, error: obvError } = await serviceClient.rpc(
        'write_integration_to_engine_table',
        {
          p_project_id:       project_id,
          p_sync_run_id:      sync_run_id,
          p_insight_id:       null,
          p_agent_type:       'sales',
          p_target:           'obvs',
          p_operation:        'upsert',
          p_payload:          obvPayload,
          p_logical_period:   null,
          p_payload_hash:     obvHash,
          p_entity_ids:       [],
          p_confidence:       entity.confidence,
          p_source_timestamp: now,
        }
      )

      if (obvError) {
        console.error(`Error writing deal ${entity.external_id} to obvs:`, obvError)
        _obvsMissed++
      } else if (obvResult?.ok === true) {
        if (obvResult?.reason === 'duplicate_skipped') {
          obvsSkipped++
        } else {
          obvsWritten++
        }
      } else {
        _obvsMissed++
        console.warn(`Deal ${entity.external_id} obv write rejected: ${obvResult?.reason}`)
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 7: Post-engine snapshot
    // ──────────────────────────────────────────────────────────────────────────
    const { data: postSnapshot } = await serviceClient.rpc('get_engine_snapshot', {
      p_project_id: project_id,
    })

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 8: Actualizar sync_run con resultado final
    // ──────────────────────────────────────────────────────────────────────────
    const finalStatus = isPartial ? 'partial' : 'completed'

    await serviceClient
      .from('integration_sync_runs')
      .update({
        status:               finalStatus,
        entities_processed:   rawDeals.length,
        entities_written:     entitiesWritten,
        entities_skipped:     obvsSkipped,
        entities_rejected:    entitiesRejected,
        post_engine_snapshot: postSnapshot ?? null,
        completed_at:         new Date().toISOString(),
        ...(isPartial && { pagination_cursor: savedCursor, is_partial: true }),
      })
      .eq('id', sync_run_id)

    await serviceClient
      .from('integration_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection_id)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 9: Respuesta
    // ──────────────────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        ok:                   true,
        entities_synced:      rawDeals.length,
        entities_written:     entitiesWritten,
        entities_rejected:    entitiesRejected,
        is_partial:           isPartial,
        obvs_written:         obvsWritten,
        obvs_skipped:         obvsSkipped,
        pre_engine_snapshot:  preSnapshot ?? null,
        post_engine_snapshot: postSnapshot ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('sync-hubspot error:', err)

    if (sync_run_id) {
      await serviceClient
        .from('integration_sync_runs')
        .update({
          status:        'failed',
          error_message: String(err),
          completed_at:  new Date().toISOString(),
        })
        .eq('id', sync_run_id)
    }

    return new Response(
      JSON.stringify({ ok: false, reason: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
