/**
 * Shared Auth Middleware for Nova Hub Edge Functions
 *
 * Validates that requests come from authenticated users and optionally
 * verifies that the user_id in the request body matches the authenticated user.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthResult {
  user: { id: string; email?: string };
  supabaseClient: SupabaseClient;
  serviceClient: SupabaseClient;
}

/**
 * Validates the Authorization header and returns authenticated user.
 * Throws a Response with 401 if auth fails.
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    throw new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Client using user's JWT (respects RLS)
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    throw new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Service client for operations that need to bypass RLS (use carefully)
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  return { user, supabaseClient, serviceClient };
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
