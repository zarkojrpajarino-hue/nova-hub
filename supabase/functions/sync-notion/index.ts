/**
 * sync-notion — Edge Function
 *
 * Orquestador puro: descarga paginas y databases de Notion,
 * normaliza via ContractEntity (notion-knowledge.ts), almacena en
 * integration_entities.
 *
 * Estrategia de sync:
 *   - Busca todas las paginas accesibles via POST /search
 *   - Busca todas las databases accesibles via POST /search
 *   - Cursor-based pagination via start_cursor
 *
 * No motor write en v1 — Notion es conocimiento, no tareas ejecutables.
 *
 * Max 500 paginas + 100 databases por sync.
 * Si se supera el limite -> status='partial'.
 *
 * Input:  { project_id: string, connection_id: string }
 * Output: { ok, entities_synced, pages_synced, databases_synced, is_partial }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts'
import { withRetry } from '../_shared/retry.ts'
import { normalizeNotionPage, normalizeNotionDatabase } from '../_shared/normalizers/notion-knowledge.ts'
import type { ContractEntity, RawNotionPage, RawNotionDatabase } from '../_shared/normalizers/notion-knowledge.ts'

const NOTION_API       = 'https://api.notion.com/v1'
const NOTION_VERSION   = '2022-06-28'
const ADAPTER_VERSION  = '1.0'
const CONTRACT_VERSION = '1.0'
const MAX_PAGES        = 500  // max paginas por sync
const MAX_DATABASES    = 100  // max databases por sync
const PAGE_SIZE        = 100  // Notion max per request

// ──────────────────────────────────────────────────────────────────────────────
// notionHeaders — headers comunes para todas las llamadas a Notion API
// ──────────────────────────────────────────────────────────────────────────────

function notionHeaders(token: string): Record<string, string> {
  return {
    'Authorization':  `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type':   'application/json',
  }
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

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 2: Crear sync_run status='running'
    // ──────────────────────────────────────────────────────────────────────────
    const { data: syncRun, error: syncRunError } = await serviceClient
      .from('integration_sync_runs')
      .insert({
        connection_id,
        project_id,
        provider:        'notion',
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
    // Paso 4: Descargar paginas de Notion con paginacion (max MAX_PAGES)
    // ──────────────────────────────────────────────────────────────────────────
    const now = new Date().toISOString()

    const rawPages: RawNotionPage[] = []
    let startCursor: string | undefined = undefined
    let isPartial = false

    // Fetch pages
    do {
      const body: Record<string, unknown> = {
        filter: { value: 'page', property: 'object' },
        page_size: PAGE_SIZE,
      }
      if (startCursor) body.start_cursor = startCursor

      const { result: searchResult } = await withRetry(() =>
        fetch(`${NOTION_API}/search`, {
          method: 'POST',
          headers: notionHeaders(apiKey),
          body: JSON.stringify(body),
        }).then(async (r) => {
          if (!r.ok) {
            const text = await r.text()
            throw new Error(`Notion API ${r.status}: ${text}`)
          }
          return r.json()
        })
      )

      const results = searchResult?.results ?? []
      rawPages.push(...results)

      startCursor = searchResult?.has_more ? searchResult.next_cursor : undefined

      if (rawPages.length >= MAX_PAGES) {
        isPartial = true
        startCursor = undefined  // stop pagination
      }
    } while (startCursor)

    // Trim to max
    if (rawPages.length > MAX_PAGES) {
      rawPages.length = MAX_PAGES
      isPartial = true
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 5: Descargar databases de Notion (max MAX_DATABASES)
    // ──────────────────────────────────────────────────────────────────────────
    const rawDatabases: RawNotionDatabase[] = []
    let dbStartCursor: string | undefined = undefined

    do {
      const body: Record<string, unknown> = {
        filter: { value: 'database', property: 'object' },
        page_size: PAGE_SIZE,
      }
      if (dbStartCursor) body.start_cursor = dbStartCursor

      const { result: searchResult } = await withRetry(() =>
        fetch(`${NOTION_API}/search`, {
          method: 'POST',
          headers: notionHeaders(apiKey),
          body: JSON.stringify(body),
        }).then(async (r) => {
          if (!r.ok) {
            const text = await r.text()
            throw new Error(`Notion API ${r.status}: ${text}`)
          }
          return r.json()
        })
      )

      const results = searchResult?.results ?? []
      rawDatabases.push(...results)

      dbStartCursor = searchResult?.has_more ? searchResult.next_cursor : undefined

      if (rawDatabases.length >= MAX_DATABASES) {
        isPartial = true
        dbStartCursor = undefined
      }
    } while (dbStartCursor)

    if (rawDatabases.length > MAX_DATABASES) {
      rawDatabases.length = MAX_DATABASES
      isPartial = true
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 6: Normalizar + almacenar en integration_entities (ContractEntity)
    // ──────────────────────────────────────────────────────────────────────────
    const ctx = { connection_id, sync_run_id, project_id, source_timestamp: now }
    const acceptedEntities: ContractEntity[] = []
    let entitiesRejected = 0

    // Normalizar paginas
    for (const raw of rawPages) {
      const entity = normalizeNotionPage(raw, ctx)

      if (!entity) {
        entitiesRejected++
        continue
      }

      acceptedEntities.push(entity)

      await serviceClient
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
    }

    // Normalizar databases
    for (const raw of rawDatabases) {
      const entity = normalizeNotionDatabase(raw, ctx)

      if (!entity) {
        entitiesRejected++
        continue
      }

      acceptedEntities.push(entity)

      await serviceClient
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
    }

    const pagesSynced = acceptedEntities.filter((e) => e.entity_type === 'page').length
    const databasesSynced = acceptedEntities.filter((e) => e.entity_type === 'database').length

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 7: Post-engine snapshot (sin motor write — Notion es knowledge, no tasks)
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
        entities_processed:   rawPages.length + rawDatabases.length,
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
    // Paso 9: Agent post-sync
    // ──────────────────────────────────────────────────────────────────────────
    let agentResult = { insights_emitted: 0, insights_skipped: 0, agent_type: 'notion' }
    try {
      const { runPostSyncAgents } = await import('../_shared/agent-runner.ts')
      agentResult = await runPostSyncAgents(serviceClient, project_id, connection_id, 'notion', sync_run_id!)
    } catch (agentErr) {
      console.error('[sync-notion] Agent error (non-blocking):', agentErr)
    }

    return new Response(
      JSON.stringify({
        ok:                   true,
        entities_synced:      acceptedEntities.length,
        pages_synced:         pagesSynced,
        databases_synced:     databasesSynced,
        is_partial:           isPartial,
        pre_engine_snapshot:  preSnapshot ?? null,
        post_engine_snapshot: postSnapshot ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('sync-notion error:', err)

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
