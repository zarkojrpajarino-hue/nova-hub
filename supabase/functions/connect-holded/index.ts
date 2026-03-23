/**
 * connect-holded — Edge Function
 *
 * Valida una API Key de Holded llamando al endpoint de facturas,
 * crea/actualiza la integration_connection y almacena la credencial cifrada.
 *
 * Input:  { project_id: string, api_key: string }
 * Auth:   JWT del usuario (Authorization header)
 * Output: { ok: true, connection_id: string }
 *         { ok: false, reason: 'invalid_api_key' | 'unauthorized' | string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'

const HOLDED_API = 'https://api.holded.com/api'

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

    // 1. Validar API Key contra Holded API — llamar endpoint de facturas con limit=1
    let accountInfo: Record<string, unknown> = {}

    try {
      // Validación directa sin retry — queremos fallo rápido en 401 (API key inválida)
      const testRes = await fetch(`${HOLDED_API}/invoicing/v1/documents/invoice?limit=1`, {
        headers: { 'key': api_key }
      })
      if (!testRes.ok) throw new Error(`Holded API error: ${testRes.status}`)

      // Si la respuesta es OK, la key es válida
      // Holded no tiene un endpoint /me directo; almacenamos que la validación fue exitosa
      accountInfo = { validated: true, validated_at: new Date().toISOString() }
    } catch (_err) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'invalid_api_key' }),
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
          provider:     'holded',
          status:       'active',
          connected_at: new Date().toISOString(),
          connected_by: profile.id,
          metadata:     accountInfo,
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

    // 3. Guardar API Key cifrada via RPC
    const { error: credError } = await serviceClient.rpc('upsert_integration_credential', {
      p_connection_id:        connection_id,
      p_project_id:           project_id,
      p_provider:             'holded',
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
      JSON.stringify({ ok: true, connection_id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  } catch (err) {
    if (err instanceof Response) return err
    console.error('connect-holded error:', err)
    return new Response(
      JSON.stringify({ ok: false, reason: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
