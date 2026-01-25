// SECURITY: Admin secret is now MANDATORY (not optional) - deploy trigger
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets, getIdentifier } from '../_shared/rate-limiter-persistent.ts';
import { SeedUsersRequestSchema, validateRequestSafe } from '../_shared/validation-schemas.ts';

// Users are seeded WITHOUT passwords in code
// Passwords should be set via environment/secrets or manual setup
const NOVA_USERS = [
  { email: 'zarko@nova.com', nombre: 'ZARKO', color: '#8B5CF6' },
  { email: 'fernandos@nova.com', nombre: 'FERNANDO S', color: '#10B981' },
  { email: 'angel@nova.com', nombre: 'ÁNGEL', color: '#F59E0B' },
  { email: 'miguelangel@nova.com', nombre: 'MIGUEL ÁNGEL', color: '#3B82F6' },
  { email: 'manuel@nova.com', nombre: 'MANUEL', color: '#EC4899' },
  { email: 'fernandog@nova.com', nombre: 'FERNANDO G', color: '#EF4444' },
  { email: 'carla@nova.com', nombre: 'CARLA', color: '#F472B6' },
  { email: 'diego@nova.com', nombre: 'DIEGO', color: '#84CC16' },
  { email: 'luis@nova.com', nombre: 'LUIS', color: '#06B6D4' },
]

// Generate a secure random password
function generateSecurePassword(): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => charset[byte % charset.length]).join('')
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin)
  }

  try {
    // Check for admin authorization via internal secret
    // SECURITY: Admin secret is MANDATORY - fail if not configured
    const expectedSecret = requireEnv('SEED_ADMIN_SECRET')
    const adminSecret = req.headers.get('x-admin-secret')

    if (!adminSecret || adminSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - valid admin secret required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting - Admin operations are sensitive
    const identifier = getIdentifier(req);
    const rateLimitResult = await checkRateLimit(
      identifier,
      'seed-users',
      RateLimitPresets.ADMIN
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Validate request body
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const validation = await validateRequestSafe(SeedUsersRequestSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Note: validation.data contains organizationId, count, roles if provided
    // For now, we ignore them as the function seeds a fixed set of users

    const supabaseAdmin = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const results = []

    for (const user of NOVA_USERS) {
      // Generate a secure random password for each user
      const securePassword = generateSecurePassword()
      
      // Create user in auth with random password
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: securePassword,
        email_confirm: true,
        user_metadata: { nombre: user.nombre }
      })

      if (authError) {
        // User might already exist
        if (authError.message.includes('already been registered')) {
          results.push({ email: user.email, status: 'already exists' })
        } else {
          results.push({ email: user.email, status: 'error', error: 'Failed to create user' })
        }
        continue
      }

      // Update the profile with the correct color
      if (authData.user) {
        await supabaseAdmin
          .from('profiles')
          .update({ color: user.color })
          .eq('auth_id', authData.user.id)
      }

      // Note: In production, send password reset email instead of exposing password
      // Users should reset their password on first login
      results.push({ 
        email: user.email, 
        status: 'created',
        note: 'User created with random password. Password reset required.' 
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Users created. Send password reset emails for users to set their passwords.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Seed users error:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred during user seeding' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
