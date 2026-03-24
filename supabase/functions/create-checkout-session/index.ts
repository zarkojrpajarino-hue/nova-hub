/**
 * V4.5.1 — Create Stripe Checkout Session
 *
 * Receives: plan_id ('pro' | 'scale'), project_id, user_id
 * Creates a Stripe Checkout Session and returns the checkout URL.
 *
 * Auth: validateAuth + verifyProjectMembership
 * Env: STRIPE_SECRET_KEY (required)
 */

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';

// Placeholder Stripe price IDs — replace with real IDs from Stripe Dashboard
const STRIPE_PRICE_CONFIG: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: 'price_pro_monthly_placeholder',
    yearly: 'price_pro_yearly_placeholder',
  },
  scale: {
    monthly: 'price_scale_monthly_placeholder',
    yearly: 'price_scale_yearly_placeholder',
  },
};

interface CheckoutRequest {
  plan_id: 'pro' | 'scale';
  project_id: string;
  user_id: string;
  billing_cycle?: 'monthly' | 'yearly';
  success_url?: string;
  cancel_url?: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  try {
    // 1. Auth validation
    const { user, serviceClient } = await validateAuth(req);

    // 2. Parse body
    const body: CheckoutRequest = await req.json();
    const { plan_id, project_id, billing_cycle = 'monthly', success_url, cancel_url } = body;

    // 3. Validate inputs
    if (!plan_id || !project_id) {
      return new Response(
        JSON.stringify({ error: 'plan_id and project_id are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    if (!STRIPE_PRICE_CONFIG[plan_id]) {
      return new Response(
        JSON.stringify({ error: `Invalid plan_id: ${plan_id}. Must be 'pro' or 'scale'` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 4. Verify project membership
    await verifyProjectMembership(serviceClient, user.id, project_id, origin);

    // 5. Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 6. Resolve price ID
    const priceId = STRIPE_PRICE_CONFIG[plan_id][billing_cycle];

    // 7. Check if project already has a Stripe customer
    const { data: subscription } = await serviceClient
      .from('project_subscriptions')
      .select('stripe_customer_id')
      .eq('project_id', project_id)
      .maybeSingle();

    // 8. Build Checkout Session params
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', success_url || `${origin || 'http://localhost:5173'}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', cancel_url || `${origin || 'http://localhost:5173'}/settings?checkout=cancelled`);
    params.append('metadata[project_id]', project_id);
    params.append('metadata[plan_id]', plan_id);
    params.append('metadata[user_id]', user.id);
    params.append('client_reference_id', project_id);

    if (subscription?.stripe_customer_id) {
      params.append('customer', subscription.stripe_customer_id);
    } else if (user.email) {
      params.append('customer_email', user.email);
    }

    // 9. Create Stripe Checkout Session via REST API
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error('Stripe error:', session);
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session', details: session.error?.message }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 10. Return checkout URL
    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );

  } catch (error) {
    // If it's a Response (thrown by auth/membership checks), return it
    if (error instanceof Response) return error;

    console.error('Checkout session error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});
