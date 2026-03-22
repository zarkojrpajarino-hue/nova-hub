/**
 * Shared Auth Middleware for Nova Hub Edge Functions
 *
 * Validates that requests come from authenticated users and optionally
 * verifies that the user_id in the request body matches the authenticated user.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from './cors-config.ts';

export interface AuthResult {
  user: { id: string; email?: string };
  supabaseClient: SupabaseClient;
  serviceClient: SupabaseClient;
}

/**
 * Validates the Authorization header and returns authenticated user.
 * Throws a Response with 401 if auth fails.
 * CORS headers are always included so the browser can read the error body.
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  const origin = req.headers.get('Origin');

  if (!authHeader) {
    throw new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Check if the caller is using the service_role key (cron/internal calls)
  const token = authHeader.replace('Bearer ', '');
  if (token === serviceRoleKey) {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    // Service role calls use a synthetic user with id 'service_role'
    return {
      user: { id: 'service_role', email: 'cron@internal' },
      supabaseClient: serviceClient,
      serviceClient,
    };
  }

  // Client using user's JWT (respects RLS)
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    throw new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }

  // Service client for operations that need to bypass RLS (use carefully)
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  return { user, supabaseClient, serviceClient };
}

/**
 * B1 — Verifies that the authenticated user is a member of the given project.
 * Uses service client to bypass RLS (checks project_members directly).
 * Throws Response(403) if not a member.
 */
export async function verifyProjectMembership(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  projectId: string,
  origin: string | null
): Promise<void> {
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('auth_id', userId)
    .single();

  if (!profile) {
    throw new Response(
      JSON.stringify({ error: 'User profile not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }

  const { data: membership } = await serviceClient
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('member_id', profile.id)
    .maybeSingle();

  if (!membership) {
    throw new Response(
      JSON.stringify({ error: 'Not a member of this project' }),
      { status: 403, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
}

/**
 * Validates auth AND verifies the user_id in the body matches the authenticated user.
 * Prevents users from impersonating others in API calls.
 */
export async function validateAuthWithUserId(
  req: Request,
  requestUserId: string
): Promise<AuthResult> {
  const authResult = await validateAuth(req);

  if (requestUserId && authResult.user.id !== requestUserId) {
    throw new Response(
      JSON.stringify({ error: 'Forbidden: user_id mismatch' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return authResult;
}
