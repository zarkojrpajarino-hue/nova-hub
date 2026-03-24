/**
 * sync-trello — Edge Function
 *
 * Orquestador puro: descarga cards de Trello (boards abiertos del usuario),
 * normaliza via ContractEntity (trello-operational.ts), almacena en
 * integration_entities.
 *
 * Estrategia de sync:
 *   - Full scan: obtiene todos los boards abiertos, luego cards por board
 *   - Trello no soporta modified_since nativo — siempre full scan
 *   - Max 10 boards, 1000 cards por board
 *
 * No hay motor write en v1 (Trello cards no se escriben a tabla tasks).
 *
 * Input:  { project_id: string, connection_id: string }
 * Output: { ok, entities_synced, boards_synced, is_partial }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import md5 from 'https://esm.sh/md5'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts'
import { withRetry } from '../_shared/retry.ts'
import { normalizeTrelloCard } from '../_shared/normalizers/trello-operational.ts'
import type { ContractEntity, RawTrelloCard } from '../_shared/normalizers/trello-operational.ts'

const TRELLO_API        = 'https://api.trello.com/1'
const ADAPTER_VERSION   = '1.0'
const CONTRACT_VERSION  = '1.0'
const MAX_BOARDS        = 10

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
    let authUser: { id: string } | null = null
    if (!isServiceRole) {
      const authResult = await validateAuth(req)
      authUser = authResult.user
    }
    const { project_id, connection_id } = await req.json()

    if (!project_id || !connection_id) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // B2.B — Verify project membership (skip for service role/cron)
    if (authUser) {
      await verifyProjectMembership(serviceClient, authUser.id, project_id, origin)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 1: Descifrar credencial y parsear JSON {key, token}
    // ──────────────────────────────────────────────────────────────────────────
    const { data: credData, error: decryptError } = await serviceClient.rpc(
      'decrypt_integration_credential',
      { p_connection_id: connection_id, p_credential_key: 'api_key', p_app_secret: appSecret }
    )

    if (decryptError || !credData) {
      console.error('Error decrypting credential:', decryptError)
      return new Response(
        JSON.stringify({ ok: false, reason: 'credential_not_found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    let apiKey: string
    let apiToken: string
    try {
      const parsed = JSON.parse(credData as string) as { key: string; token: string }
      apiKey   = parsed.key
      apiToken = parsed.token
    } catch {
      return new Response(
        JSON.stringify({ ok: false, reason: 'invalid_credential_format' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // Leer metadata de la conexion
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
        provider:        'trello',
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
    // Paso 4: Descargar boards abiertos, luego cards por board
    // ──────────────────────────────────────────────────────────────────────────
    const now = new Date().toISOString()
    const authParams = `key=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(apiToken)}`

    // Get all open boards
    const { result: boardsResult } = await withRetry(() =>
      fetch(`${TRELLO_API}/members/me/boards?${authParams}&filter=open&fields=id,name`).then(async (r) => {
        if (!r.ok) {
          const body = await r.text()
          throw new Error(`Trello API ${r.status}: ${body}`)
        }
        return r.json()
      })
    )

    const allBoards = (boardsResult as Array<{ id: string; name: string }>) ?? []
    const boards = allBoards.slice(0, MAX_BOARDS)
    const isPartial = allBoards.length > MAX_BOARDS

    const rawCards: Array<RawTrelloCard & { _boardName?: string }> = []
    const globalListNameMap = new Map<string, string>()
    let boardsSynced = 0

    for (const board of boards) {
      // Get lists for this board (to map list IDs to names)
      const { result: listsResult } = await withRetry(() =>
        fetch(`${TRELLO_API}/boards/${board.id}/lists?${authParams}&fields=id,name`).then(async (r) => {
          if (!r.ok) {
            const body = await r.text()
            throw new Error(`Trello API lists ${r.status}: ${body}`)
          }
          return r.json()
        })
      )

      const lists = (listsResult as Array<{ id: string; name: string }>) ?? []
      for (const list of lists) {
        globalListNameMap.set(list.id, list.name)
      }

      // Get cards for this board
      const { result: cardsResult } = await withRetry(() =>
        fetch(
          `${TRELLO_API}/boards/${board.id}/cards?${authParams}&fields=id,name,closed,due,dueComplete,dateLastActivity,idList,idMembers,labels&limit=1000`
        ).then(async (r) => {
          if (!r.ok) {
            const body = await r.text()
            throw new Error(`Trello API cards ${r.status}: ${body}`)
          }
          return r.json()
        })
      )

      const cards = (cardsResult as RawTrelloCard[]) ?? []
      for (const card of cards) {
        rawCards.push({ ...card, _boardName: board.name })
      }
      boardsSynced++
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 5: Normalizar + almacenar en integration_entities (ContractEntity)
    // ──────────────────────────────────────────────────────────────────────────
    const ctx = { connection_id, sync_run_id, project_id, source_timestamp: now }
    const acceptedEntities: ContractEntity[] = []
    const entityDbIdMap = new Map<string, string>()
    let entitiesRejected = 0

    for (const raw of rawCards) {
      const boardName = raw._boardName
      // Remove internal field before normalizing
      const { _boardName, ...cleanRaw } = raw

      const entity = normalizeTrelloCard(cleanRaw as RawTrelloCard, ctx, globalListNameMap, boardName)

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
    // Paso 6: Post-engine snapshot (sin motor write en v1 — cards no se escriben a tasks)
    // ──────────────────────────────────────────────────────────────────────────
    const { data: postSnapshot } = await serviceClient.rpc('get_engine_snapshot', {
      p_project_id: project_id,
    })

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 7: Actualizar sync_run con resultado final
    // ──────────────────────────────────────────────────────────────────────────
    const finalStatus = isPartial ? 'partial' : 'completed'

    await serviceClient
      .from('integration_sync_runs')
      .update({
        status:               finalStatus,
        entities_processed:   rawCards.length,
        entities_written:     acceptedEntities.length,
        entities_skipped:     0,
        entities_rejected:    entitiesRejected,
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
    // Paso 8: Agent post-sync
    // ──────────────────────────────────────────────────────────────────────────
    let agentResult = { insights_emitted: 0, insights_skipped: 0, agent_type: 'trello' }
    try {
      const { runPostSyncAgents } = await import('../_shared/agent-runner.ts')
      agentResult = await runPostSyncAgents(serviceClient, project_id, connection_id, 'trello', sync_run_id!)
    } catch (agentErr) {
      console.error('[sync-trello] Agent error (non-blocking):', agentErr)
    }

    return new Response(
      JSON.stringify({
        ok:                   true,
        entities_synced:      acceptedEntities.length,
        boards_synced:        boardsSynced,
        is_partial:           isPartial,
        pre_engine_snapshot:  preSnapshot ?? null,
        post_engine_snapshot: postSnapshot ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('sync-trello error:', err)

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
