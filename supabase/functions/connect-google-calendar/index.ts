/**
 * connect-google-calendar — Edge Function
 *
 * Maneja el flujo OAuth 2.0 de Google Calendar en dos pasos:
 *
 * PASO 1 — Generar auth_url (action: 'get_auth_url'):
 *   Input:  { project_id, action: 'get_auth_url', redirect_uri }
 *   Output: { auth_url } — el frontend redirige aquí para el consent de Google
 *
 * PASO 2 — Exchange code por tokens (action: 'exchange_code'):
 *   Input:  { project_id, action: 'exchange_code', code, state }
 *   Output: { ok: true, connection_id, account_email }
 *
 * Credenciales almacenadas (cifradas via upsert_integration_credential):
 *   - 'refresh_token' — token permanente para renovar acceso
 *   - 'access_token'  — token de sesión (se renueva en cada sync)
 *
 * Metadatos en integration_connections.metadata:
 *   { account_email, token_expires_at }
 *
 * Variables de entorno requeridas (Supabase secrets):
 *   GOOGLE_OAUTH_CLIENT_ID     — client_id de la app OAuth en GCP
 *   GOOGLE_OAUTH_CLIENT_SECRET — client_secret de la app OAuth en GCP
 *
 * Scope requerido: https://www.googleapis.com/auth/calendar.readonly
 *
 * Auth: JWT del usuario (Authorization header)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts'

const GOOGLE_TOKEN_URL    = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const GCAL_SCOPE          = 'https://www.googleapis.com/auth/calendar.readonly'

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin)
  }

  try {
    const { user } = await validateAuth(req)
    const body = await req.json() as {
      project_id: string
      action: 'get_auth_url' | 'exchange_code'
      redirect_uri?: string
      code?: string
      state?: string
    }

    const { project_id, action } = body

    if (!project_id || !action) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    const clientId     = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      console.error('Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET')
      return new Response(
        JSON.stringify({ ok: false, reason: 'google_oauth_not_configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PASO 1 — Generar auth_url
    // ──────────────────────────────────────────────────────────────────────────
    if (action === 'get_auth_url') {
      const redirectUri = body.redirect_uri
      if (!redirectUri) {
        return new Response(
          JSON.stringify({ ok: false, reason: 'missing_redirect_uri' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }

      // state = base64(project_id) — para recuperarlo en el exchange step
      const state = btoa(project_id)

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id',     clientId)
      authUrl.searchParams.set('redirect_uri',  redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope',         GCAL_SCOPE)
      authUrl.searchParams.set('access_type',   'offline')   // ← necesario para refresh_token
      authUrl.searchParams.set('prompt',        'consent')   // ← forzar refresh_token en cada auth
      authUrl.searchParams.set('state',         state)

      return new Response(
        JSON.stringify({ auth_url: authUrl.toString() }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PASO 2 — Exchange code por tokens
    // ──────────────────────────────────────────────────────────────────────────
    if (action === 'exchange_code') {
      const { code, state } = body
      const redirectUri = body.redirect_uri

      if (!code || !state || !redirectUri) {
        return new Response(
          JSON.stringify({ ok: false, reason: 'missing_exchange_params' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }

      // Validar state — debe decodificar al mismo project_id
      let stateProjectId = ''
      try {
        stateProjectId = atob(state)
      } catch {
        return new Response(
          JSON.stringify({ ok: false, reason: 'invalid_state' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }

      if (stateProjectId !== project_id) {
        return new Response(
          JSON.stringify({ ok: false, reason: 'state_mismatch' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }

      // Exchange code → tokens
      let accessToken  = ''
      let refreshToken = ''
      let expiresAt    = ''

      try {
        const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id:     clientId,
            client_secret: clientSecret,
            redirect_uri:  redirectUri,
            grant_type:    'authorization_code',
          }),
        })

        if (!tokenRes.ok) {
          const errBody = await tokenRes.text()
          console.error('Google token exchange error:', errBody)
          throw new Error(`token_exchange_failed: ${tokenRes.status}`)
        }

        const tokenData = await tokenRes.json() as {
          access_token:  string
          refresh_token: string
          expires_in:    number
        }

        if (!tokenData.refresh_token) {
          // Puede ocurrir si el usuario ya autorizó antes y revocó el prompt=consent
          throw new Error('no_refresh_token — vuelve a autorizar en Google')
        }

        accessToken  = tokenData.access_token
        refreshToken = tokenData.refresh_token
        expiresAt    = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      } catch (err) {
        return new Response(
          JSON.stringify({ ok: false, reason: String(err) }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }

      // Obtener email de la cuenta Google para metadata
      let accountEmail = ''
      try {
        const userRes = await fetch(GOOGLE_USERINFO_URL, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        if (userRes.ok) {
          const userData = await userRes.json() as { email?: string }
          accountEmail = userData.email ?? ''
        }
      } catch {
        // Non-blocking — si falla, seguimos sin email
      }

      // Upsert integration_connections
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
            provider:     'google_calendar',
            status:       'active',
            connected_at: new Date().toISOString(),
            connected_by: profile.id,
            metadata:     {
              account_email:    accountEmail,
              token_expires_at: expiresAt,
            },
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

      // Guardar access_token cifrado
      const { error: atError } = await serviceClient.rpc('upsert_integration_credential', {
        p_connection_id:        connection_id,
        p_project_id:           project_id,
        p_provider:             'google_calendar',
        p_credential_key:       'access_token',
        p_credential_plaintext: accessToken,
        p_app_secret:           appSecret,
      })
      if (atError) console.error('Error storing access_token:', atError)

      // Guardar refresh_token cifrado (clave para todos los syncs futuros)
      const { error: rtError } = await serviceClient.rpc('upsert_integration_credential', {
        p_connection_id:        connection_id,
        p_project_id:           project_id,
        p_provider:             'google_calendar',
        p_credential_key:       'refresh_token',
        p_credential_plaintext: refreshToken,
        p_app_secret:           appSecret,
      })

      if (rtError) {
        console.error('Error storing refresh_token:', rtError)
        return new Response(
          JSON.stringify({ ok: false, reason: 'credential_error', detail: rtError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }

      return new Response(
        JSON.stringify({ ok: true, connection_id, account_email: accountEmail }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    return new Response(
      JSON.stringify({ ok: false, reason: 'unknown_action' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('connect-google-calendar error:', err)
    return new Response(
      JSON.stringify({ ok: false, reason: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
