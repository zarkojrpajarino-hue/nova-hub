/**
 * connect-notion — Edge Function
 *
 * Valida un Notion Internal Integration Token, obtiene info del workspace,
 * crea/actualiza la integration_connection y almacena la credencial cifrada.
 *
 * Input:  { project_id: string, api_key: string }
 * Auth:   JWT del usuario (Authorization header)
 * Output: { ok: true, connection_id: string, workspace_name: string }
 *         { ok: false, reason: 'invalid_token' | 'no_access' | 'unauthorized' | string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin)
  }

  try {
    const { user } = await validateAuth(req)
    const { project_id, api_key } = await req.json()

    if (!project_id || !api_key) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // 1. Validar token contra Notion API — obtener bot info
    let workspaceName = 'Notion Workspace'

    try {
      // Validar con /users/me — devuelve info del bot
      const meRes = await fetch(`${NOTION_API}/users/me`, {
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Notion-Version': NOTION_VERSION,
        }
      })
      if (!meRes.ok) throw new Error(`Notion API error: ${meRes.status}`)
      const meData = await meRes.json()

      // Extraer workspace name del bot owner si disponible
      if (meData?.bot?.owner?.workspace === true || meData?.bot?.owner?.type === 'workspace') {
        workspaceName = meData?.name ?? 'Notion Workspace'
      }

      // Verificar acceso a paginas con search
      const searchRes = await fetch(`${NOTION_API}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_size: 1 }),
      })
      if (!searchRes.ok) throw new Error(`Notion search error: ${searchRes.status}`)

      // Si el search responde OK, el token tiene acceso
      const searchData = await searchRes.json()
      if (!searchData?.results) {
        return new Response(
          JSON.stringify({ ok: false, reason: 'no_access' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }
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
          provider:     'notion',
          status:       'active',
          connected_at: new Date().toISOString(),
          connected_by: profile.id,
          metadata:     { workspace_name: workspaceName },
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

    // 3. Guardar token cifrado via RPC
    const { error: credError } = await serviceClient.rpc('upsert_integration_credential', {
      p_connection_id:        connection_id,
      p_project_id:           project_id,
      p_provider:             'notion',
      p_credential_key:       'api_key',
      p_credential_plaintext: api_key,
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
      JSON.stringify({ ok: true, connection_id, workspace_name: workspaceName }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  } catch (err) {
    if (err instanceof Response) return err
    console.error('connect-notion error:', err)
    return new Response(
      JSON.stringify({ ok: false, reason: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
