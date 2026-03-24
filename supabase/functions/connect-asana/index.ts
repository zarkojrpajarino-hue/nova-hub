/**
 * connect-asana — Edge Function
 *
 * Valida un Asana Personal Access Token (PAT), obtiene el primer workspace GID,
 * crea/actualiza la integration_connection y almacena la credencial cifrada.
 *
 * Input:  { project_id: string, pat: string }
 * Auth:   JWT del usuario (Authorization header)
 * Output: { ok: true, connection_id: string, workspace_name: string }
 *         { ok: false, reason: 'invalid_pat' | 'no_workspace' | 'unauthorized' | string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts'

const ASANA_API = 'https://app.asana.com/api/1.0'

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin)
  }

  try {
    const { user, serviceClient } = await validateAuth(req)
    const { project_id, pat } = await req.json()

    if (!project_id || !pat) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'missing_params' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // B2.B — Verify project membership
    await verifyProjectMembership(serviceClient, user.id, project_id, origin)

    // 1. Validar PAT contra Asana API — obtener usuario y primer workspace
    let workspaceGid = ''
    let workspaceName = 'Asana Workspace'

    try {
      // Validación directa sin retry — queremos fallo rápido en 401 (PAT inválido)
      const meRes = await fetch(`${ASANA_API}/users/me?opt_fields=gid,name,workspaces.gid,workspaces.name`, {
        headers: { 'Authorization': `Bearer ${pat}` }
      })
      if (!meRes.ok) throw new Error(`Asana API error: ${meRes.status}`)
      const meData = await meRes.json()

      const workspaces = (meData as { data?: { workspaces?: Array<{ gid: string; name: string }> } })?.data?.workspaces
      if (!workspaces || workspaces.length === 0) {
        return new Response(
          JSON.stringify({ ok: false, reason: 'no_workspace' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
        )
      }

      workspaceGid  = workspaces[0].gid
      workspaceName = workspaces[0].name ?? 'Asana Workspace'
    } catch (_err) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'invalid_pat' }),
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
          provider:     'asana',
          status:       'active',
          connected_at: new Date().toISOString(),
          connected_by: profile.id,
          metadata:     { workspace_gid: workspaceGid, workspace_name: workspaceName },
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

    // 3. Guardar PAT cifrado via RPC
    const { error: credError } = await serviceClient.rpc('upsert_integration_credential', {
      p_connection_id:        connection_id,
      p_project_id:           project_id,
      p_provider:             'asana',
      p_credential_key:       'pat',
      p_credential_plaintext: pat,
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
    console.error('connect-asana error:', err)
    return new Response(
      JSON.stringify({ ok: false, reason: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
