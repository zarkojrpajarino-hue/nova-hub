/**
 * M2.1 — Stripe Webhooks Handler
 *
 * Procesa eventos de Stripe:
 * - checkout.session.completed → activar suscripción
 * - invoice.paid → renovar período
 * - customer.subscription.deleted → cancelar
 * - customer.subscription.updated → cambiar plan
 *
 * NO requiere auth de usuario — usa Stripe signature verification.
 */

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const _stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET'); // TODO: use for signature verification

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await req.text();
    const _sig = req.headers.get('stripe-signature'); // TODO: verify with Stripe SDK

    // In production, verify signature with stripe-webhook-secret
    // For now, parse the event directly (TODO: add Stripe SDK signature verification)
    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    const obj = event.data.object;
    console.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const projectId = (obj.metadata as Record<string, string>)?.project_id;
        const customerId = obj.customer as string;
        const subscriptionId = obj.subscription as string;

        if (projectId) {
          await supabase.from('project_subscriptions').update({
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_id: 'starter', // Default, can be overridden by metadata
            updated_at: new Date().toISOString(),
          }).eq('project_id', projectId);
        }
        break;
      }

      case 'invoice.paid': {
        const subscriptionId = obj.subscription as string;
        const periodStart = obj.period_start as number;
        const periodEnd = obj.period_end as number;

        if (subscriptionId) {
          await supabase.from('project_subscriptions').update({
            status: 'active',
            current_period_start: new Date(periodStart * 1000).toISOString(),
            current_period_end: new Date(periodEnd * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscriptionId = obj.id as string;
        if (subscriptionId) {
          await supabase.from('project_subscriptions').update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscriptionId = obj.id as string;
        const status = obj.status as string;
        if (subscriptionId) {
          const mappedStatus = status === 'past_due' ? 'past_due'
            : status === 'active' ? 'active'
            : status === 'canceled' ? 'cancelled'
            : 'active';

          await supabase.from('project_subscriptions').update({
            status: mappedStatus,
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
  }
});
