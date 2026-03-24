/**
 * connect-trello — Edge Function
 *
 * Valida credenciales de Trello (API Key + Token), obtiene los boards abiertos,
 * crea/actualiza la integration_connection y almacena la credencial cifrada.
 *
 * Input:  { project_id: string, api_key: string, token: string }
 * Auth:   JWT del usuario (Authorization header)
 * Output: { ok: true, connection_id: string, board_count: number, username: string }
 *         { ok: false, reason: 'invalid_credentials' | 'no_boards' | 'unauthorized' | string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts'

const TRELLO_API = 'https://api.trello.com/1'

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin)
  }

  try {
    const { user, serviceClient } = await validateAuth(req)
    const { project_id, api_key, token } = await req.json()

    if (!project_id || !api_key || !token) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // B2.B — Verify project membership
    await verifyProjectMembership(serviceClient, user.id, project_id, origin)

    // 1. Validar credenciales contra Trello API — obtener boards y username
    let boardCount = 0
    let username = 'trello_user'

    try {
      // Validar obteniendo boards abiertos — fallo rapido en 401 (credenciales invalidas)
      const boardsRes = await fetch(
        `${TRELLO_API}/members/me/boards?key=${encodeURIComponent(api_key)}&token=${encodeURIComponent(token)}&filter=open&fields=id,name`,
      )
      if (!boardsRes.ok) throw new Error(`Trello API error: ${boardsRes.status}`)
      const boards = await boardsRes.json() as Array<{ id: string; name: string }>
      boardCount = boards.length

      if (boardCount === 0) {
        return new Response(
          JSON.stringify({ ok: false, reason: 'no_boards' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }

      // Obtener username
      const meRes = await fetch(
        `${TRELLO_API}/members/me?key=${encodeURIComponent(api_key)}&token=${encodeURIComponent(token)}&fields=username`,
      )
      if (meRes.ok) {
        const meData = await meRes.json() as { username?: string }
        username = meData.username ?? 'trello_user'
      }
    } catch (_err) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'invalid_credentials' }),
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
          provider:     'trello',
          status:       'active',
          connected_at: new Date().toISOString(),
          connected_by: profile.id,
          metadata:     { board_count: boardCount, username },
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

    // 3. Guardar credencial cifrada via RPC — JSON {key, token}
    const credentialValue = JSON.stringify({ key: api_key, token })
    const { error: credError } = await serviceClient.rpc('upsert_integration_credential', {
      p_connection_id:        connection_id,
      p_project_id:           project_id,
      p_provider:             'trello',
      p_credential_key:       'api_key',
      p_credential_plaintext: credentialValue,
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
      JSON.stringify({ ok: true, connection_id, board_count: boardCount, username }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  } catch (err) {
    if (err instanceof Response) return err
    console.error('connect-trello error:', err)
    return new Response(
      JSON.stringify({ ok: false, reason: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
