/**
 * V4.5.7 — Create Stripe Customer Portal Session
 *
 * Creates a Stripe Billing Portal session for the authenticated user's project.
 * Returns the portal URL for redirect.
 *
 * Auth: validateAuth + verifyProjectMembership
 * Env: STRIPE_SECRET_KEY (required)
 */

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';

interface PortalRequest {
  project_id: string;
  return_url?: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  try {
    // 1. Auth
    const { user, serviceClient } = await validateAuth(req);

    // 2. Parse body
    const body: PortalRequest = await req.json();
    const { project_id, return_url } = body;

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 3. Verify membership
    await verifyProjectMembership(serviceClient, user.id, project_id, origin);

    // 4. Get Stripe customer ID from subscription
    const { data: subscription } = await serviceClient
      .from('project_subscriptions')
      .select('stripe_customer_id')
      .eq('project_id', project_id)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found for this project' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 5. Get Stripe key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 6. Create portal session via Stripe REST API
    const params = new URLSearchParams();
    params.append('customer', subscription.stripe_customer_id);
    params.append('return_url', return_url || `${origin || 'http://localhost:5173'}/settings`);

    const stripeResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error('Stripe portal error:', session);
      return new Response(
        JSON.stringify({ error: 'Failed to create portal session', details: session.error?.message }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );

  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Portal session error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});
