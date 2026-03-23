/**
 * sync-slack — Edge Function
 *
 * Orquestador puro: descarga canales publicos y su actividad reciente de Slack,
 * normaliza via ContractEntity (slack-communication.ts), almacena en
 * integration_entities.
 *
 * Estrategia de sync:
 *   - Lista canales publicos no archivados (max 20)
 *   - Para cada canal: ultimos 100 mensajes de los ultimos 7 dias
 *   - Una entidad por canal (agregado: message_count, unique_authors, latest_message_at)
 *   - No motor write en v1 (comunicacion no tiene tabla destino)
 *   - Agents post-sync generan insights
 *
 * Paginacion: cursor-based para canales. Para historial, solo 100 mensajes recientes.
 *
 * Input:  { project_id: string, connection_id: string }
 * Output: { ok, entities_synced, channels_synced, total_messages, is_partial }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'
import { withRetry } from '../_shared/retry.ts'
import { normalizeSlackChannel } from '../_shared/normalizers/slack-communication.ts'
import type { ContractEntity, RawSlackChannelData } from '../_shared/normalizers/slack-communication.ts'

const SLACK_API         = 'https://slack.com/api'
const ADAPTER_VERSION   = '1.0'
const CONTRACT_VERSION  = '1.0'
const MAX_CHANNELS      = 20
const HISTORY_LIMIT     = 100
const SYNC_WINDOW_DAYS  = 7

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
    // Paso 1: Descifrar bot_token y obtener metadata de la conexion
    // ──────────────────────────────────────────────────────────────────────────
    const { data: tokenData, error: decryptError } = await serviceClient.rpc(
      'decrypt_integration_credential',
      { p_connection_id: connection_id, p_credential_key: 'bot_token', p_app_secret: appSecret }
    )

    if (decryptError || !tokenData) {
      console.error('Error decrypting credential:', decryptError)
      return new Response(
        JSON.stringify({ ok: false, reason: 'credential_not_found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    const botToken = tokenData as string

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 2: Crear sync_run status='running'
    // ──────────────────────────────────────────────────────────────────────────
    const { data: syncRun, error: syncRunError } = await serviceClient
      .from('integration_sync_runs')
      .insert({
        connection_id,
        project_id,
        provider:        'slack',
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
    // Paso 4: Descargar canales publicos con paginacion cursor-based
    // ──────────────────────────────────────────────────────────────────────────
    const now = new Date().toISOString()
    const oldestTs = String(Math.floor((Date.now() - SYNC_WINDOW_DAYS * 86400 * 1000) / 1000))

    interface SlackChannel {
      id: string
      name: string
      num_members: number
    }

    const allChannels: SlackChannel[] = []
    let channelCursor: string | undefined = undefined
    let isPartial = false

    do {
      const params = new URLSearchParams({
        types:            'public_channel',
        exclude_archived: 'true',
        limit:            '200',
      })
      if (channelCursor) params.set('cursor', channelCursor)

      const { result: channelPage } = await withRetry(() =>
        fetch(`${SLACK_API}/conversations.list?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${botToken}` },
        }).then(async (r) => {
          if (!r.ok) throw new Error(`Slack API ${r.status}: ${await r.text()}`)
          return r.json()
        })
      )

      if (!channelPage?.ok) {
        throw new Error(`Slack conversations.list failed: ${channelPage?.error ?? 'unknown'}`)
      }

      const channels = (channelPage.channels ?? []) as SlackChannel[]
      allChannels.push(...channels)

      // Cursor-based pagination
      channelCursor = channelPage.response_metadata?.next_cursor || undefined

      // Cap at MAX_CHANNELS
      if (allChannels.length >= MAX_CHANNELS) {
        allChannels.splice(MAX_CHANNELS)
        if (channelCursor) isPartial = true
        channelCursor = undefined
      }
    } while (channelCursor)

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 5: Para cada canal, obtener historial reciente (ultimos 7 dias)
    // ──────────────────────────────────────────────────────────────────────────
    const rawChannelData: RawSlackChannelData[] = []
    let totalMessages = 0

    for (const channel of allChannels) {
      try {
        const histParams = new URLSearchParams({
          channel: channel.id,
          limit:   String(HISTORY_LIMIT),
          oldest:  oldestTs,
        })

        const { result: histPage } = await withRetry(() =>
          fetch(`${SLACK_API}/conversations.history?${histParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${botToken}` },
          }).then(async (r) => {
            if (!r.ok) throw new Error(`Slack API ${r.status}: ${await r.text()}`)
            return r.json()
          })
        )

        if (!histPage?.ok) {
          // Channel may not be accessible — skip silently
          console.warn(`[sync-slack] Skipping channel ${channel.name}: ${histPage?.error}`)
          continue
        }

        const messages = (histPage.messages ?? []) as Array<{ user?: string; ts?: string; subtype?: string }>

        // Filter out bot messages and subtypes (join/leave/etc)
        const realMessages = messages.filter((m) => m.user && !m.subtype)

        const uniqueAuthors = new Set(realMessages.map((m) => m.user)).size
        const latestTs = realMessages.length > 0
          ? realMessages.reduce((max, m) => (m.ts && m.ts > max ? m.ts : max), '0')
          : null
        const latestMessageAt = latestTs && latestTs !== '0'
          ? new Date(parseFloat(latestTs) * 1000).toISOString()
          : null

        totalMessages += realMessages.length

        rawChannelData.push({
          channel_id:        channel.id,
          channel_name:      channel.name,
          message_count:     realMessages.length,
          unique_authors:    uniqueAuthors,
          latest_message_at: latestMessageAt,
          member_count:      channel.num_members ?? 0,
        })
      } catch (chanErr) {
        console.error(`[sync-slack] Error fetching history for ${channel.name}:`, chanErr)
        // Non-blocking — continue with next channel
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 6: Normalizar + almacenar en integration_entities (ContractEntity)
    // ──────────────────────────────────────────────────────────────────────────
    const ctx = { connection_id, sync_run_id: sync_run_id!, project_id, source_timestamp: now }
    const acceptedEntities: ContractEntity[] = []
    let entitiesRejected = 0

    for (const raw of rawChannelData) {
      const entity = normalizeSlackChannel(raw, ctx)

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
        .select('id')
        .single()
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Paso 7: Post-engine snapshot (no motor write en v1 — comunicacion no tiene tabla destino)
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
        entities_processed:   rawChannelData.length,
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
    // Paso 9: Agents post-sync
    // ──────────────────────────────────────────────────────────────────────────
    let agentResult = { insights_emitted: 0, insights_skipped: 0, agent_type: 'slack' }
    try {
      const { runPostSyncAgents } = await import('../_shared/agent-runner.ts')
      agentResult = await runPostSyncAgents(serviceClient, project_id, connection_id, 'slack', sync_run_id!)
    } catch (agentErr) {
      console.error('[sync-slack] Agent error (non-blocking):', agentErr)
    }

    return new Response(
      JSON.stringify({
        ok:               true,
        entities_synced:  acceptedEntities.length,
        channels_synced:  acceptedEntities.length,
        total_messages:   totalMessages,
        is_partial:       isPartial,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('sync-slack error:', err)

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
