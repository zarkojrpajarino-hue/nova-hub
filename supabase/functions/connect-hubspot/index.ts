/**
 * connect-hubspot — Edge Function
 *
 * Valida un Private App Token de HubSpot, obtiene el portalId
 * via /account-info/v3/details, crea/actualiza la integration_connection
 * y almacena la credencial cifrada.
 *
 * Input:  { project_id: string, access_token: string }
 * Auth:   JWT del usuario (Authorization header)
 * Output: { ok: true, connection_id: string, portal_id: string }
 *         { ok: false, reason: 'invalid_token' | 'unauthorized' | string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'

const HUBSPOT_API = 'https://api.hubapi.com'

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin)
  }

  try {
    const { user } = await validateAuth(req)
    const { project_id, access_token } = await req.json()

    if (!project_id || !access_token) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // 1. Validar token contra HubSpot API — obtener portalId
    let portalId = ''
    try {
      const res = await fetch(`${HUBSPOT_API}/account-info/v3/details`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      })
      if (!res.ok) throw new Error(`HubSpot API error: ${res.status}`)
      const data = await res.json() as { portalId?: number }
      portalId = String(data.portalId ?? '')
      if (!portalId || portalId === 'undefined') throw new Error('no portal_id in response')
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
          provider:     'hubspot',
          status:       'active',
          connected_at: new Date().toISOString(),
          connected_by: profile.id,
          metadata:     { portal_id: portalId },
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
      p_provider:             'hubspot',
      p_credential_key:       'access_token',
      p_credential_plaintext: access_token,
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
      JSON.stringify({ ok: true, connection_id, portal_id: portalId }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  } catch (err) {
    if (err instanceof Response) return err
    console.error('connect-hubspot error:', err)
    return new Response(
      JSON.stringify({ ok: false, reason: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
