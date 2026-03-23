/**
 * sync-holded — Edge Function
 *
 * Orquestador puro: descarga facturas de Holded,
 * normaliza via ContractEntity (holded-financial.ts), almacena en
 * integration_entities y escribe en key_metrics via
 * write_integration_to_engine_table().
 *
 * Estrategia de sync:
 *   - Full scan: descarga todas las facturas (Holded no soporta modified_since nativo)
 *   - Deduplicacion via upsert on (connection_id, provider, entity_type, external_id)
 *
 * Paginacion: page-based (?page=N&limit=50), max 10 paginas / 500 facturas por run.
 * Si se supera el limite -> status='partial'.
 *
 * Motor writes:
 *   - Escribe a key_metrics via write_integration_to_engine_table(target='key_metrics')
 *   - Agent aggregation: total_invoiced, total_paid, total_overdue (in cents)
 *   - Llama a run_probability_engine (Holded afecta al engine financiero)
 *
 * Input:  { project_id: string, connection_id: string }
 * Output: { ok, entities_synced, invoices_written, invoices_skipped, invoices_rejected,
 *           is_partial, pre_engine_snapshot, post_engine_snapshot }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import md5 from 'https://esm.sh/md5'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'
import { withRetry } from '../_shared/retry.ts'
import { normalizeHoldedInvoice } from '../_shared/normalizers/holded-financial.ts'
import type { ContractEntity } from '../_shared/normalizers/holded-financial.ts'

const HOLDED_API       = 'https://api.holded.com/api'
const ADAPTER_VERSION  = '1.0'
const CONTRACT_VERSION = '1.0'
const PAGE_SIZE        = 50
const MAX_PAGES        = 10  // 500 facturas maximo por run

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

// ──────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin)

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const appSecret      = Deno.env.get('APP_ENCRYPTION_SECRET')!
  const serviceClient  = createClient(supabaseUrl, serviceRoleKey)
  let sync_run_id: string | null = null

  try {
    // Service role bypass for cron calls
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    let isServiceRole = false
    try { const p = JSON.parse(atob(authToken.split('.')[1] ?? '')); isServiceRole = p?.role === 'service_role' } catch {}
    if (!isServiceRole) { await validateAuth(req) }
    const { project_id, connection_id } = await req.json()

    if (!project_id || !connection_id) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 1: Descifrar api_key y obtener metadata de la conexion
    // ──────────────────────────────────────────────────────────────────────────
    const { data: apiKeyData, error: decryptError } = await serviceClient.rpc(
      'decrypt_integration_credential',
      { p_connection_id: connection_id, p_credential_key: 'api_key', p_app_secret: appSecret }
    )

    if (decryptError || !apiKeyData) {
      console.error('Error decrypting credential:', decryptError)
      return new Response(
        JSON.stringify({ ok: false, reason: 'credential_not_found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    const apiKey = apiKeyData as string

    // Leer last_sync_at de la conexion
    const { data: connData, error: connErr } = await serviceClient
      .from('integration_connections')
      .select('metadata, last_sync_at')
      .eq('id', connection_id)
      .single()

    if (connErr || !connData) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'connection_not_found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 2: Crear sync_run status='running'
    // ──────────────────────────────────────────────────────────────────────────
    const { data: syncRun, error: syncRunError } = await serviceClient
      .from('integration_sync_runs')
      .insert({
        connection_id,
        project_id,
        provider:        'holded',
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
    // Paso 4: Descargar facturas de Holded con paginacion (max MAX_PAGES paginas)
    // Holded usa paginacion por pagina: ?page=1&limit=50
    // ──────────────────────────────────────────────────────────────────────────
    const now = new Date().toISOString()

    const rawInvoices: unknown[] = []
    let currentPage = 1
    let isPartial = false

    for (; currentPage <= MAX_PAGES; currentPage++) {
      const { result: pageData } = await withRetry(() =>
        fetch(`${HOLDED_API}/invoicing/v1/documents/invoice?page=${currentPage}&limit=${PAGE_SIZE}`, {
          headers: { 'key': apiKey }
        }).then(async (r) => {
          if (!r.ok) {
            const body = await r.text()
            throw new Error(`Holded API ${r.status}: ${body}`)
          }
          return r.json()
        })
      )

      const pageInvoices = Array.isArray(pageData) ? pageData : []
      rawInvoices.push(...pageInvoices)

      if (pageInvoices.length < PAGE_SIZE) break
    }
    if (currentPage > MAX_PAGES) isPartial = true

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 5: Normalizar + almacenar en integration_entities (ContractEntity)
    // ──────────────────────────────────────────────────────────────────────────
    const ctx = { connection_id, sync_run_id, project_id, source_timestamp: now }
    const acceptedEntities: ContractEntity[] = []
    // Map external_id → DB UUID de integration_entities
    const entityDbIdMap = new Map<string, string>()
    let entitiesRejected = 0

    for (const raw of rawInvoices) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entity = normalizeHoldedInvoice(raw as any, ctx)

      if (!entity) {
        entitiesRejected++
        continue
      }

      acceptedEntities.push(entity)

      const { data: inserted, error: entityError } = await serviceClient
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
        .select('id')
        .single()

      if (!entityError && inserted) {
        entityDbIdMap.set(entity.external_id, inserted.id)
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 6: Agent aggregation — computar metricas financieras
    // Solo entidades con confidence >= 0.8
    // ──────────────────────────────────────────────────────────────────────────
    let invoicesWritten  = 0
    let invoicesSkipped  = 0
    let invoicesRejected = 0

    const highConfEntities = acceptedEntities.filter((e) => e.confidence >= 0.8)

    // Compute aggregates for key_metrics
    let totalInvoiced = 0
    let totalPaid     = 0
    let totalOverdue  = 0

    for (const entity of highConfEntities) {
      const inv = entity.payload
      totalInvoiced += inv.total_cents
      if (inv.status === 'paid')    totalPaid    += inv.total_cents
      if (inv.status === 'overdue') totalOverdue += inv.total_cents
    }

    // Write each invoice to engine table
    for (const entity of highConfEntities) {
      const inv = entity.payload

      const writePayload: Record<string, unknown> = {
        external_id:    entity.external_id,
        invoice_number: inv.invoice_number,
        contact_name:   inv.contact_name,
        total_cents:    inv.total_cents,
        currency:       inv.currency,
        status:         inv.status,
        issued_at:      inv.issued_at,
        ...(inv.due_at && { due_at: inv.due_at }),
        items_count:    inv.items_count,
        metadata: {
          holded_id:    entity.external_id,
          provider:     'holded',
        },
      }

      const payloadHash = md5(canonicalJson(writePayload))

      const { data: writeResult, error: writeError } = await serviceClient.rpc(
        'write_integration_to_engine_table',
        {
          p_project_id:       project_id,
          p_sync_run_id:      sync_run_id,
          p_insight_id:       null,
          p_agent_type:       'finance',
          p_target:           'key_metrics',
          p_operation:        'upsert',
          p_payload:          writePayload,
          p_logical_period:   null,
          p_payload_hash:     payloadHash,
          p_entity_ids:       entityDbIdMap.has(entity.external_id) ? [entityDbIdMap.get(entity.external_id)!] : [],
          p_confidence:       entity.confidence,
          p_source_timestamp: now,
        }
      )

      if (writeError) {
        console.error(`Error writing invoice ${entity.external_id}:`, writeError)
        invoicesRejected++
      } else if (writeResult?.ok === true) {
        if (writeResult?.reason === 'duplicate_skipped') {
          invoicesSkipped++
        } else {
          invoicesWritten++
        }
      } else {
        invoicesRejected++
        console.warn(`Invoice ${entity.external_id} write rejected: ${writeResult?.reason}`)
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 7: Run probability engine (Holded afecta motor financiero)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      await serviceClient.rpc('run_probability_engine', { p_project_id: project_id })
    } catch (engineErr) {
      console.error('[sync-holded] run_probability_engine error (non-blocking):', engineErr)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 8: Post-engine snapshot
    // ──────────────────────────────────────────────────────────────────────────
    const { data: postSnapshot } = await serviceClient.rpc('get_engine_snapshot', {
      p_project_id: project_id,
    })

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 9: Actualizar sync_run con resultado final
    // ──────────────────────────────────────────────────────────────────────────
    const finalStatus = isPartial ? 'partial' : 'completed'

    await serviceClient
      .from('integration_sync_runs')
      .update({
        status:               finalStatus,
        entities_processed:   rawInvoices.length,
        entities_written:     invoicesWritten,
        entities_skipped:     invoicesSkipped,
        entities_rejected:    entitiesRejected + invoicesRejected,
        post_engine_snapshot: postSnapshot ?? null,
        completed_at:         new Date().toISOString(),
        ...(isPartial && { is_partial: true }),
      })
      .eq('id', sync_run_id)

    await serviceClient
      .from('integration_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection_id)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 10: Agent post-sync — generate insights automatically
    // ──────────────────────────────────────────────────────────────────────────
    let agentResult = { insights_emitted: 0, insights_skipped: 0, agent_type: 'holded' }
    try {
      const { runPostSyncAgents } = await import('../_shared/agent-runner.ts')
      agentResult = await runPostSyncAgents(serviceClient, project_id, connection_id, 'holded', sync_run_id!)
    } catch (agentErr) {
      console.error('[sync-holded] Agent error (non-blocking):', agentErr)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 11: Respuesta
    // ──────────────────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        ok:                   true,
        entities_synced:      rawInvoices.length,
        invoices_written:     invoicesWritten,
        invoices_skipped:     invoicesSkipped,
        invoices_rejected:    entitiesRejected + invoicesRejected,
        is_partial:           isPartial,
        pre_engine_snapshot:  preSnapshot ?? null,
        post_engine_snapshot: postSnapshot ?? null,
        aggregates: {
          total_invoiced_cents: totalInvoiced,
          total_paid_cents:     totalPaid,
          total_overdue_cents:  totalOverdue,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('sync-holded error:', err)

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
