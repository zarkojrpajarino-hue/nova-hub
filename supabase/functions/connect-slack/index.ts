/**
 * connect-slack — Edge Function
 *
 * Valida un Bot User OAuth Token (xoxb-), obtiene team info,
 * crea/actualiza la integration_connection y almacena la credencial cifrada.
 *
 * Input:  { project_id: string, bot_token: string }
 * Auth:   JWT del usuario (Authorization header)
 * Output: { ok: true, connection_id: string, team_name: string }
 *         { ok: false, reason: 'invalid_token' | 'unauthorized' | string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts'

const SLACK_API = 'https://slack.com/api'

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin)
  }

  try {
    const { user, serviceClient } = await validateAuth(req)
    const { project_id, bot_token } = await req.json()

    if (!project_id || !bot_token) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // B2.B — Verify project membership
    await verifyProjectMembership(serviceClient, user.id, project_id, origin)

    // 1. Validar bot_token contra Slack API — auth.test
    let teamName = 'Slack Workspace'
    let teamId = ''

    try {
      const authRes = await fetch(`${SLACK_API}/auth.test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bot_token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!authRes.ok) throw new Error(`Slack API error: ${authRes.status}`)
      const authData = await authRes.json() as { ok: boolean; team?: string; team_id?: string; error?: string }

      if (!authData.ok) {
        return new Response(
          JSON.stringify({ ok: false, reason: 'invalid_token', detail: authData.error }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }

      teamName = authData.team ?? 'Slack Workspace'
      teamId   = authData.team_id ?? ''
    } catch (_err) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'invalid_token' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // 2. Upsert integration_connections
    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const appSecret      = Deno.env.get('APP_ENCRYPTION_SECRET')!
    const serviceClient  = createClient(supabaseUrl, serviceRoleKey)

    // profiles.id != auth.users.id — buscar por auth_id
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'profile_not_found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    const { data: conn, error: connError } = await serviceClient
      .from('integration_connections')
      .upsert(
        {
          project_id,
          provider:     'slack',
          status:       'active',
          connected_at: new Date().toISOString(),
          connected_by: profile.id,
          metadata:     { team_name: teamName, team_id: teamId },
        },
        { onConflict: 'project_id,provider' }
      )
      .select('id')
      .single()

    if (connError || !conn) {
      console.error('Error upserting integration_connections:', connError)
      return new Response(
        JSON.stringify({ ok: false, reason: 'db_error', detail: connError?.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    const connection_id: string = conn.id

    // 3. Guardar bot_token cifrado via RPC
    const { error: credError } = await serviceClient.rpc('upsert_integration_credential', {
      p_connection_id:        connection_id,
      p_project_id:           project_id,
      p_provider:             'slack',
      p_credential_key:       'bot_token',
      p_credential_plaintext: bot_token,
      p_app_secret:           appSecret,
    })

    if (credError) {
      console.error('Error storing credential:', credError)
      return new Response(
        JSON.stringify({ ok: false, reason: 'credential_error', detail: credError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    return new Response(
      JSON.stringify({ ok: true, connection_id, team_name: teamName }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  } catch (err) {
    if (err instanceof Response) return err
    console.error('connect-slack error:', err)
    return new Response(
      JSON.stringify({ ok: false, reason: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
