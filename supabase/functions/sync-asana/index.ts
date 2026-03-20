/**
 * sync-asana — Edge Function
 *
 * Orquestador puro: descarga tareas de Asana (workspace del usuario),
 * normaliza via ContractEntity (asana-operational.ts), almacena en
 * integration_entities y escribe en la tabla `tasks` vía
 * write_integration_to_engine_table().
 *
 * Estrategia de sync:
 *   - Primer run (last_sync_at = null): full scan del workspace
 *   - Siguientes runs: incremental via modified_since = last_sync_at
 *
 * Paginación: cursor-based (Asana offset), máx 10 páginas / 1000 tareas por run.
 * Si se supera el límite → status='partial', cursor guardado en pagination_cursor.
 *
 * Motor writes:
 *   - Escribe a tabla `tasks` via write_integration_to_engine_table(target='tasks')
 *   - Solo entidades con confidence >= 0.8 (ambos campos requeridos: task_name + status)
 *   - No llama a run_probability_engine (Asana no afecta al engine financiero)
 *
 * Input:  { project_id: string, connection_id: string }
 * Output: { ok, entities_synced, tasks_written, tasks_skipped, tasks_rejected,
 *           is_partial, pre_engine_snapshot, post_engine_snapshot }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import md5 from 'https://esm.sh/md5'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'
import { withRetry } from '../_shared/retry.ts'
import { normalizeAsanaTask } from '../_shared/normalizers/asana-operational.ts'
import type { ContractEntity } from '../_shared/normalizers/asana-operational.ts'

const ASANA_API       = 'https://app.asana.com/api/1.0'
const ADAPTER_VERSION = '1.0'
const CONTRACT_VERSION = '1.0'
const PAGE_SIZE       = 100
const MAX_PAGES       = 10  // 1000 tareas máximo por run

// Campos requeridos por normalizeAsanaTask
const TASK_OPT_FIELDS = [
  'gid', 'name', 'completed', 'created_at', 'completed_at',
  'due_at', 'due_on',
  'assignee.gid',
  'memberships.section.gid', 'memberships.section.name',
  'projects.gid',
  'modified_at',
].join(',')

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
    await validateAuth(req)
    const { project_id, connection_id } = await req.json()

    if (!project_id || !connection_id) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 1: Descifrar PAT y obtener metadata de la conexión
    // ──────────────────────────────────────────────────────────────────────────
    const { data: patData, error: decryptError } = await serviceClient.rpc(
      'decrypt_integration_credential',
      { p_connection_id: connection_id, p_credential_key: 'pat', p_app_secret: appSecret }
    )

    if (decryptError || !patData) {
      console.error('Error decrypting credential:', decryptError)
      return new Response(
        JSON.stringify({ ok: false, reason: 'credential_not_found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    const pat = patData as string

    // Leer workspace_gid y last_sync_at de la conexión
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

    const workspaceGid = (connData.metadata as Record<string, string>)?.workspace_gid
    if (!workspaceGid) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'no_workspace_gid' }),
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
        provider:        'asana',
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
    // Paso 4: Descargar tareas de Asana con paginación (máx MAX_PAGES páginas)
    // Incremental: si last_sync_at existe, usar modified_since.
    // ──────────────────────────────────────────────────────────────────────────
    const now = new Date().toISOString()

    const rawTasks: unknown[] = []
    let offsetCursor: string | null = null
    let savedCursor: string | null = null  // cursor guardado antes de detener paginación parcial
    let pageCount = 0
    let isPartial = false

    do {
      const params = new URLSearchParams({
        workspace:  workspaceGid,
        assignee:   'me',
        limit:      String(PAGE_SIZE),
        opt_fields: TASK_OPT_FIELDS,
      })

      // Sync incremental: filtrar por tareas modificadas desde el último sync
      if (lastSyncAt) {
        params.set('modified_since', lastSyncAt)
      }

      // Cursor de paginación
      if (offsetCursor) {
        params.set('offset', offsetCursor)
      }

      const { result: page } = await withRetry(() =>
        fetch(`${ASANA_API}/tasks?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${pat}` }
        }).then(async (r) => {
          if (!r.ok) {
            const body = await r.text()
            throw new Error(`Asana API ${r.status}: ${body}`)
          }
          return r.json()
        })
      )

      const pageTasks = page?.data ?? []
      rawTasks.push(...pageTasks)
      pageCount++

      // Asana devuelve next_page.offset si hay más resultados
      const nextOffset = page?.next_page?.offset
      offsetCursor = nextOffset ?? null

      if (pageCount >= MAX_PAGES && offsetCursor) {
        isPartial = true
        savedCursor = offsetCursor  // guardar antes de detener
        offsetCursor = null
      }
    } while (offsetCursor)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 5: Normalizar + almacenar en integration_entities (ContractEntity)
    // ──────────────────────────────────────────────────────────────────────────
    const ctx = { connection_id, sync_run_id, project_id, source_timestamp: now }
    const acceptedEntities: ContractEntity[] = []
    // Map external_id (Asana GID) → DB UUID de integration_entities
    const entityDbIdMap = new Map<string, string>()
    let entitiesRejected = 0

    for (const raw of rawTasks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entity = normalizeAsanaTask(raw as any, ctx)

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
    // Paso 6: Escribir tareas en motor via write_integration_to_engine_table
    // Solo entidades con confidence >= 0.8 (ambos campos requeridos presentes).
    // Un call por tarea — idempotente via (sync_run_id, payload_hash).
    // ──────────────────────────────────────────────────────────────────────────
    let tasksWritten  = 0
    let tasksSkipped  = 0
    let tasksRejected = 0

    const highConfEntities = acceptedEntities.filter((e) => e.confidence >= 0.8)

    for (const entity of highConfEntities) {
      const taskPayload = entity.payload

      // Mapeo del status del contrato (open|completed) al enum task_status
      const taskStatus = taskPayload.status === 'completed' ? 'done' : 'todo'

      const writePayload: Record<string, unknown> = {
        external_id:  entity.external_id,
        titulo:       taskPayload.task_name,
        status:       taskStatus,
        ...(taskPayload.due_date    && { fecha_limite: taskPayload.due_date }),
        ...(taskPayload.completed_at && { completed_at: taskPayload.completed_at }),
        metadata: {
          asana_gid:            entity.external_id,
          section:              taskPayload.section              ?? null,
          project_external_id:  taskPayload.project_external_id ?? null,
          assignee_external_id: taskPayload.assignee_external_id ?? null,
        },
      }

      const payloadHash = md5(canonicalJson(writePayload))

      const { data: writeResult, error: writeError } = await serviceClient.rpc(
        'write_integration_to_engine_table',
        {
          p_project_id:       project_id,
          p_sync_run_id:      sync_run_id,
          p_insight_id:       null,
          p_agent_type:       'execution',
          p_target:           'tasks',
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
        console.error(`Error writing task ${entity.external_id}:`, writeError)
        tasksRejected++
      } else if (writeResult?.ok === true) {
        if (writeResult?.reason === 'duplicate_skipped') {
          tasksSkipped++
        } else {
          tasksWritten++
        }
      } else {
        tasksRejected++
        console.warn(`Task ${entity.external_id} write rejected: ${writeResult?.reason}`)
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 7: Post-engine snapshot (sin run_probability_engine — tasks no afectan motor financiero)
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
        entities_processed:   rawTasks.length,
        entities_written:     tasksWritten,
        entities_skipped:     tasksSkipped,
        entities_rejected:    entitiesRejected + tasksRejected,
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
        entities_synced:      rawTasks.length,
        tasks_written:        tasksWritten,
        tasks_skipped:        tasksSkipped,
        tasks_rejected:       entitiesRejected + tasksRejected,
        is_partial:           isPartial,
        pre_engine_snapshot:  preSnapshot ?? null,
        post_engine_snapshot: postSnapshot ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('sync-asana error:', err)

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
