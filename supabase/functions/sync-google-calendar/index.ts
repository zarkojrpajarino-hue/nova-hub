/**
 * sync-google-calendar — Edge Function
 *
 * Orquestador puro: refresca el access_token via refresh_token,
 * descarga eventos del calendario primario de Google Calendar,
 * normaliza via ContractEntity (gcal-calendar.ts), almacena en
 * integration_entities.
 *
 * Ventana de sync:
 *   - timeMin: NOW - 30 días (histórico reciente para Calendar Agent)
 *   - timeMax: NOW + 30 días (próximas reuniones)
 *   Ventana fija — no hay incremental en v1. Los eventos se upsertean
 *   en cada run (UNIQUE constraint en connection_id+provider+entity_type+external_id).
 *
 * Token management:
 *   - Siempre refresca access_token al inicio del sync via refresh_token.
 *   - Actualiza access_token cifrado y token_expires_at en metadata.
 *
 * Motor writes:
 *   - NO en v1 — calendar_events van solo a integration_entities.
 *   - Calendar Agent (I15.82) leerá de integration_entities.
 *   - No run_probability_engine (reuniones no afectan motor financiero en v1).
 *
 * Variables de entorno requeridas:
 *   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
 *
 * Input:  { project_id: string, connection_id: string }
 * Output: { ok, entities_synced, entities_written, entities_rejected,
 *           pre_engine_snapshot, post_engine_snapshot }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'
import { normalizeGCalEvent } from '../_shared/normalizers/gcal-calendar.ts'
import type { ContractEntity } from '../_shared/normalizers/gcal-calendar.ts'

const GCAL_BASE       = 'https://www.googleapis.com/calendar/v3'
const TOKEN_URL       = 'https://oauth2.googleapis.com/token'
const ADAPTER_VERSION = '1.0'
const CONTRACT_VERSION = '1.0'
const PAGE_SIZE       = 250  // Google Calendar máximo por página
const MAX_PAGES       = 4    // ~1000 eventos máximo por run
// Ventana: 30 días atrás + 30 días adelante
const WINDOW_DAYS_PAST   = 30
const WINDOW_DAYS_FUTURE = 30

// ──────────────────────────────────────────────────────────────────────────────
// refreshAccessToken — intercambia refresh_token por nuevo access_token
// ──────────────────────────────────────────────────────────────────────────────

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{ access_token: string; expires_at: string }> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`token_refresh_failed: ${res.status} — ${body}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  return {
    access_token: data.access_token,
    expires_at:   new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }
}

// ──────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin)

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const appSecret      = Deno.env.get('APP_ENCRYPTION_SECRET')!
  const clientId       = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
  const clientSecret   = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')
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

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'google_oauth_not_configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 1: Descifrar refresh_token y renovar access_token
    // ──────────────────────────────────────────────────────────────────────────
    const { data: rtData, error: rtError } = await serviceClient.rpc(
      'decrypt_integration_credential',
      { p_connection_id: connection_id, p_credential_key: 'refresh_token', p_app_secret: appSecret }
    )

    if (rtError || !rtData) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'refresh_token_not_found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    let accessToken: string
    let tokenExpiresAt: string
    try {
      const refreshed = await refreshAccessToken(rtData as string, clientId, clientSecret)
      accessToken    = refreshed.access_token
      tokenExpiresAt = refreshed.expires_at
    } catch (err) {
      // Refresh token revocado o expirado — marcar conexión como error
      await serviceClient
        .from('integration_connections')
        .update({ status: 'error', error_message: String(err) })
        .eq('id', connection_id)
      return new Response(
        JSON.stringify({ ok: false, reason: 'token_refresh_failed', detail: String(err) }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // Actualizar access_token cifrado y expires_at en metadata
    await serviceClient.rpc('upsert_integration_credential', {
      p_connection_id:        connection_id,
      p_project_id:           project_id,
      p_provider:             'google_calendar',
      p_credential_key:       'access_token',
      p_credential_plaintext: accessToken,
      p_app_secret:           appSecret,
    })

    // Actualizar token_expires_at en metadata (merge — no sobreescribir account_email)
    const { data: connMeta } = await serviceClient
      .from('integration_connections')
      .select('metadata')
      .eq('id', connection_id)
      .single()

    const existingMeta = (connMeta?.metadata ?? {}) as Record<string, unknown>
    await serviceClient
      .from('integration_connections')
      .update({ metadata: { ...existingMeta, token_expires_at: tokenExpiresAt } })
      .eq('id', connection_id)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 2: Crear sync_run status='running'
    // ──────────────────────────────────────────────────────────────────────────
    const { data: syncRun, error: syncRunError } = await serviceClient
      .from('integration_sync_runs')
      .insert({
        connection_id,
        project_id,
        provider:        'google_calendar',
        trigger_type:    'manual',
        status:          'running',
        adapter_version: ADAPTER_VERSION,
      })
      .select('id')
      .single()

    if (syncRunError || !syncRun) {
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
    // Paso 4: Descargar eventos del calendario primario
    //
    // Ventana fija: NOW - WINDOW_DAYS_PAST → NOW + WINDOW_DAYS_FUTURE
    // Paginación: pageToken cursor, máx MAX_PAGES páginas.
    // ──────────────────────────────────────────────────────────────────────────
    const now = new Date()
    const timeMin = new Date(now.getTime() - WINDOW_DAYS_PAST * 24 * 60 * 60 * 1000).toISOString()
    const timeMax = new Date(now.getTime() + WINDOW_DAYS_FUTURE * 24 * 60 * 60 * 1000).toISOString()
    const nowIso  = now.toISOString()

    const rawEvents: unknown[] = []
    let pageToken:   string | null = null
    let savedToken:  string | null = null
    let pageCount = 0
    let isPartial = false

    do {
      const params = new URLSearchParams({
        calendarId:   'primary',
        timeMin,
        timeMax,
        maxResults:   String(PAGE_SIZE),
        singleEvents: 'true',  // expand recurring events
        orderBy:      'startTime',
        ...(pageToken ? { pageToken } : {}),
      })

      const eventsRes = await fetch(
        `${GCAL_BASE}/calendars/primary/events?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )

      if (!eventsRes.ok) {
        const body = await eventsRes.text()
        throw new Error(`Google Calendar API ${eventsRes.status}: ${body}`)
      }

      const page = await eventsRes.json() as {
        items?: unknown[]
        nextPageToken?: string
      }

      rawEvents.push(...(page.items ?? []))
      pageCount++
      pageToken = page.nextPageToken ?? null

      if (pageCount >= MAX_PAGES && pageToken) {
        isPartial   = true
        savedToken  = pageToken
        pageToken   = null
      }
    } while (pageToken)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 5: Normalizar + almacenar en integration_entities
    // ──────────────────────────────────────────────────────────────────────────
    const ctx = { connection_id, sync_run_id, project_id, source_timestamp: nowIso }
    const acceptedEntities: ContractEntity[] = []
    let entitiesRejected = 0
    let entitiesWritten  = 0

    for (const raw of rawEvents) {
      // deno-lint-ignore no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entity = normalizeGCalEvent(raw as any, ctx)

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
        console.error(`Error upserting event ${entity.external_id}:`, entityError)
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 6: Post-engine snapshot
    // (sin write_integration_to_engine_table ni run_probability_engine en v1 —
    //  calendar_events van a integration_entities, no al motor financiero.
    //  Calendar Agent (I15.82): leerá de integration_entities.)
    // ──────────────────────────────────────────────────────────────────────────
    const { data: postSnapshot } = await serviceClient.rpc('get_engine_snapshot', {
      p_project_id: project_id,
    })

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 7: Actualizar sync_run
    // ──────────────────────────────────────────────────────────────────────────
    const finalStatus = isPartial ? 'partial' : 'completed'

    await serviceClient
      .from('integration_sync_runs')
      .update({
        status:               finalStatus,
        entities_processed:   rawEvents.length,
        entities_written:     entitiesWritten,
        entities_skipped:     0,
        entities_rejected:    entitiesRejected,
        post_engine_snapshot: postSnapshot ?? null,
        completed_at:         new Date().toISOString(),
        ...(isPartial && { pagination_cursor: savedToken, is_partial: true }),
      })
      .eq('id', sync_run_id)

    await serviceClient
      .from('integration_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection_id)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 8: Respuesta
    // ──────────────────────────────────────────────────────────────────────────
// Agent post-sync: generate insights automatically    let agentResult = { insights_emitted: 0, insights_skipped: 0, agent_type: 'google_calendar' }    try {      const { runPostSyncAgents } = await import('../_shared/agent-runner.ts')      agentResult = await runPostSyncAgents(serviceClient, project_id, connection_id, 'google_calendar', sync_run_id!)    } catch (agentErr) { console.error('[sync-google-calendar] Agent error (non-blocking):', agentErr) }
    return new Response(
      JSON.stringify({
        ok:                   true,
        entities_synced:      rawEvents.length,
        entities_written:     entitiesWritten,
        entities_rejected:    entitiesRejected,
        is_partial:           isPartial,
        pre_engine_snapshot:  preSnapshot ?? null,
        post_engine_snapshot: postSnapshot ?? null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('sync-google-calendar error:', err)

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
