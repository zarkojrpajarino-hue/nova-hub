/**
 * sync-stripe — Edge Function
 *
 * Orquestador puro: descarga suscripciones de Stripe, normaliza via ContractEntity,
 * almacena en integration_entities, ejecuta Finance Agent (suma MRR en centavos),
 * escribe en key_metrics vía write_integration_to_engine_table(), captura snapshots.
 *
 * Convención monetaria: MRR en CENTAVOS en toda la tubería. UI divide por 100.
 *
 * Input:  { project_id: string, connection_id: string }
 * Output: { ok, pre_engine_snapshot, post_engine_snapshot, mrr, entities_synced, log_id, write_status }
 *         mrr en CENTAVOS (el frontend divide por 100 para mostrar en euros)
 */

import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import md5 from 'https://esm.sh/md5'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'
import { withRetry } from '../_shared/retry.ts'
import { normalizeStripeSubscription } from '../_shared/normalizers/stripe-financial.ts'
import type { ContractEntity } from '../_shared/normalizers/stripe-financial.ts'

const ADAPTER_VERSION  = '1.0'
const CONTRACT_VERSION = '1.0'

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
    // Allow service_role key for cron/internal calls
    // Decode JWT payload to check role claim instead of comparing raw keys
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    let isServiceRole = false
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1] ?? ''))
      isServiceRole = payload?.role === 'service_role'
    } catch { /* not a valid JWT — will fail validateAuth below */ }

    if (!isServiceRole) {
      await validateAuth(req)
    }
    const { project_id, connection_id } = await req.json()

    if (!project_id || !connection_id) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 1: Descifrar API key
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

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 2: Crear sync_run status='running'
    // ──────────────────────────────────────────────────────────────────────────
    const { data: syncRun, error: syncRunError } = await serviceClient
      .from('integration_sync_runs')
      .insert({
        connection_id,
        project_id,
        provider:        'stripe',
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
    // Paso 4: Descargar suscripciones activas de Stripe (con retry/backoff)
    // ──────────────────────────────────────────────────────────────────────────
    const stripe = new Stripe(apiKeyData as string, { apiVersion: '2023-10-16' })

    const { result: subscriptionList, attempts: stripeAttempts } = await withRetry(
      () => stripe.subscriptions.list({ status: 'active', limit: 100, expand: ['data.items'] })
    )

    const rawSubscriptions = subscriptionList.data
    const retryCount = stripeAttempts - 1
    const now = new Date().toISOString()

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 5: Normalizar + almacenar en integration_entities (ContractEntity)
    // ──────────────────────────────────────────────────────────────────────────
    const ctx = { connection_id, sync_run_id, project_id, source_timestamp: now }
    const entityIds: string[] = []
    const acceptedEntities: ContractEntity[] = []
    // I15.DEBT.2: solo entidades cuyo upsert fue exitoso contribuyen al MRR.
    // acceptedEntities = normalizadas en memoria; persistedEntities = confirmadas en DB.
    const persistedEntities: ContractEntity[] = []
    let entitiesRejected = 0      // normalization failures
    let entitiesUpsertFailed = 0  // AUD.B.7: normalizadas pero no persistidas en DB

    for (const raw of rawSubscriptions) {
      // Normalización pura — Stripe payload → ContractEntity
      // deno-lint-ignore no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entity = normalizeStripeSubscription(raw as any, ctx)

      if (!entity) {
        // normalizeStripeSubscription devolvió null: schema_score < 0.5 o external_id ausente
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
        entityIds.push(inserted.id)
        persistedEntities.push(entity)  // I15.DEBT.2: solo contar si persistió en DB
      } else if (entityError) {
        entitiesUpsertFailed++  // AUD.B.7: contar pérdidas de DB para is_partial
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 6: Finance Agent — sumar mrr_contribution (CENTAVOS/mes)
    //
    // I15.DEBT.2 resuelto: usa persistedEntities (upsert confirmado en DB)
    // en lugar de acceptedEntities (solo normalizadas en memoria).
    // Esto garantiza que el MRR escrito en key_metrics ≡ entidades en integration_entities.
    // ──────────────────────────────────────────────────────────────────────────
    const totalMrrCents = persistedEntities.reduce(
      (sum, entity) => sum + entity.payload.mrr_contribution,
      0
    )

    const payload = { mrr: totalMrrCents }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 7: canonicalJson + md5 → payload_hash
    // ──────────────────────────────────────────────────────────────────────────
    const payload_hash = md5(canonicalJson(payload))

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 8: write_integration_to_engine_table (MRR en centavos → key_metrics)
    // ──────────────────────────────────────────────────────────────────────────
    const { data: writeResult, error: writeError } = await serviceClient.rpc(
      'write_integration_to_engine_table',
      {
        p_project_id:       project_id,
        p_sync_run_id:      sync_run_id,
        p_insight_id:       null,
        p_agent_type:       'finance',
        p_target:           'key_metrics',
        p_operation:        'upsert',
        p_payload:          payload,
        p_logical_period:   now,
        p_payload_hash:     payload_hash,
        p_entity_ids:       entityIds,
        p_confidence:       1.0,
        p_source_timestamp: now,
      }
    )

    if (writeError) console.error('Error writing to engine table:', writeError)

    const log_id      = writeResult?.log_id ?? null
    const write_status = writeResult?.ok === true ? 'written' : (writeResult?.reason ?? 'error')

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 8b: Finance Agent — revenue_concentration → project_economic_profile
    //          I15.DEBT.5: motor write del agente hecho aquí (server-side, sync_run
    //          todavía 'running') en lugar de cliente (que no tiene acceso service_role).
    // ──────────────────────────────────────────────────────────────────────────
    // Filtrar suscripciones activas con customer_id (min 3 para que la concentración tenga sentido)
    // I15.DEBT.2: usar persistedEntities — solo entidades confirmadas en DB
    const activeWithCustomer = persistedEntities.filter(
      (e) => (e.payload.status === 'active' || e.payload.status === 'trialing') && e.payload.customer_id
    )

    if (activeWithCustomer.length >= 3) {
      const byCustomer = new Map<string, number>()
      for (const e of activeWithCustomer) {
        const cid = e.payload.customer_id!
        byCustomer.set(cid, (byCustomer.get(cid) ?? 0) + e.payload.mrr_contribution)
      }

      const totalRevenueCents = Array.from(byCustomer.values()).reduce((s, v) => s + v, 0)
      if (totalRevenueCents > 0) {
        const topRevenueCents = Math.max(...byCustomer.values())
        const concentrationPct = Math.round((topRevenueCents / totalRevenueCents) * 100)

        const avgConf = activeWithCustomer.reduce((s, e) => s + e.confidence, 0) / activeWithCustomer.length
        const completeness = Math.min(1.0, activeWithCustomer.length / 3)
        const writeConf = avgConf * completeness

        if (writeConf >= 0.8) {
          const profilePayload = { top_client_revenue_percent: concentrationPct }
          const profileHash = md5(canonicalJson(profilePayload))

          const { error: profileWriteError } = await serviceClient.rpc(
            'write_integration_to_engine_table',
            {
              p_project_id:       project_id,
              p_sync_run_id:      sync_run_id,
              p_insight_id:       null,
              p_agent_type:       'finance',
              p_target:           'project_economic_profile',
              p_operation:        'upsert',
              p_payload:          profilePayload,
              p_logical_period:   null,
              p_payload_hash:     profileHash,
              p_entity_ids:       entityIds,
              p_confidence:       writeConf,
              p_source_timestamp: now,
            }
          )

          if (profileWriteError) {
            console.error('Error writing revenue_concentration to economic_profile:', profileWriteError)
          }
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 9: run_probability_engine
    // ──────────────────────────────────────────────────────────────────────────
    await serviceClient.rpc('run_probability_engine', {
      p_project_id:    project_id,
      p_trigger_source: 'integration',
    })

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 10: Post-engine snapshot
    // ──────────────────────────────────────────────────────────────────────────
    const { data: postSnapshot } = await serviceClient.rpc('get_engine_snapshot', {
      p_project_id: project_id,
    })

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 11: Actualizar sync_run con resultado final
    // AUD.B.7: is_partial = true si algún upsert falló O si el motor write falló.
    // Esto da feedback real al usuario (SyncHealthCard muestra "Parcial") y al motor.
    // ──────────────────────────────────────────────────────────────────────────
    const isPartial = entitiesUpsertFailed > 0
      || (write_status !== 'written' && write_status !== 'duplicate_skipped')

    await serviceClient
      .from('integration_sync_runs')
      .update({
        status:             'completed',
        is_partial:         isPartial,
        entities_processed: rawSubscriptions.length,
        entities_written:   write_status === 'written'          ? 1 : 0,
        entities_skipped:   write_status === 'duplicate_skipped' ? 1 : 0,
        entities_rejected:  entitiesRejected + entitiesUpsertFailed,
        retry_count:        retryCount,
        post_engine_snapshot: postSnapshot ?? null,
        completed_at:       new Date().toISOString(),
      })
      .eq('id', sync_run_id)

    await serviceClient
      .from('integration_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection_id)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 11b: Run Finance Agent post-sync → generate insights
    // Previously agents only ran client-side (browser). Now they run
    // server-side automatically after every sync.
    // ──────────────────────────────────────────────────────────────────────────
    let agentResult = { insights_emitted: 0, insights_skipped: 0, agent_type: 'finance' }
    try {
      const { runPostSyncAgents } = await import('../_shared/agent-runner.ts')
      agentResult = await runPostSyncAgents(
        serviceClient,
        project_id,
        connection_id,
        'stripe',
        sync_run_id!,
      )
      console.log(`[sync-stripe] Agent result: ${agentResult.insights_emitted} insights emitted`)
    } catch (agentErr) {
      // Agent failure is non-blocking — sync data is already persisted
      console.error('[sync-stripe] Agent error (non-blocking):', agentErr)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 12: Respuesta — mrr en CENTAVOS. Frontend divide por 100 para display.
    // ──────────────────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        ok: true,
        pre_engine_snapshot:  preSnapshot ?? null,
        post_engine_snapshot: postSnapshot ?? null,
        mrr:                  totalMrrCents,   // CENTAVOS — frontend divide por 100
        entities_synced:      rawSubscriptions.length,
        log_id,
        write_status,
        agent: agentResult,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('sync-stripe error:', err)

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
