/**
 * connect-stripe — Edge Function
 *
 * Valida una Stripe Secret Key, crea/actualiza la integration_connection
 * y almacena la credencial cifrada.
 *
 * Input:  { project_id: string, api_key: string }
 * Auth:   JWT del usuario (Authorization header)
 * Output: { ok: true, connection_id: string }
 *         { ok: false, reason: 'invalid_key' | 'unauthorized' | string }
 */

import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'
import { withRetry } from '../_shared/retry.ts'

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

    // 1. Validar api_key contra Stripe (con retry para transient errors)
    const stripe = new Stripe(api_key, { apiVersion: '2023-10-16' })
    try {
      await withRetry(() => stripe.subscriptions.list({ limit: 1 }))
    } catch (_err) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'invalid_key' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // 2. Upsert integration_connections
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const appSecret = Deno.env.get('APP_ENCRYPTION_SECRET')!

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    // profiles.id != auth.users.id — need to look up via auth_id
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
          provider: 'stripe',
          status: 'active',
          connected_at: new Date().toISOString(),
          connected_by: profile.id,
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

    // 3. Guardar credencial cifrada via RPC
    const { error: credError } = await serviceClient.rpc('upsert_integration_credential', {
      p_connection_id: connection_id,
      p_project_id: project_id,
      p_provider: 'stripe',
      p_credential_key: 'api_key',
      p_credential_plaintext: api_key,
      p_app_secret: appSecret,
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
    console.error('connect-stripe error:', err)
    return new Response(
      JSON.stringify({ ok: false, reason: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
