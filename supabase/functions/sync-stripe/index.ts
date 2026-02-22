/**
 * SYNC STRIPE - Edge Function
 *
 * Sincroniza transacciones de Stripe con Nova Hub
 * - Descarga últimas transacciones
 * - Las guarda en synced_transactions
 * - Auto-actualiza financial_metrics via trigger
 * - Sincroniza suscripciones y calcula MRR/ARR
 *
 * Input:
 * - user_id: UUID del usuario
 * - integration_id: UUID de la integración de Stripe
 * - sync_type: 'manual' | 'scheduled' (default: manual)
 * - since_date: Fecha desde la cual sincronizar (opcional)
 *
 * Output:
 * - synced_count: Número de transacciones sincronizadas
 * - total_revenue: Total de ingresos sincronizados
 * - subscriptions_synced: Número de suscripciones sincronizadas
 * - mrr: MRR calculado
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const { user_id, integration_id, sync_type, since_date } = await req.json();

    if (!user_id || !integration_id) {
      throw new Error('user_id and integration_id are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Obtener credenciales de Stripe
    const { data: integration } = await supabaseClient
      .from('financial_integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('provider', 'stripe')
      .single();

    if (!integration) {
      throw new Error('Stripe integration not found');
    }

    // 2. Simular descarga de transacciones de Stripe
    // En producción: usar Stripe API real
    // const stripe = new Stripe(integration.access_token);
    // const charges = await stripe.charges.list({ created: { gte: sinceTimestamp } });

    const mockTransactions = generateMockStripeTransactions(
      since_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    );

    let syncedCount = 0;
    let totalRevenue = 0;

    // 3. Guardar transacciones
    for (const transaction of mockTransactions) {
      const { error } = await supabaseClient.from('synced_transactions').upsert({
        integration_id,
        user_id,
        external_transaction_id: transaction.id,
        transaction_type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        transaction_date: transaction.created_at,
        customer_email: transaction.customer_email,
        customer_name: transaction.customer_name,
        metadata: transaction.metadata,
      });

      if (!error) {
        syncedCount++;
        if (transaction.type === 'income') {
          totalRevenue += transaction.amount;
        }
      }
    }

    // 4. Sincronizar suscripciones
    const mockSubscriptions = generateMockSubscriptions();
    let subscriptionsSynced = 0;
    let mrr = 0;

    for (const sub of mockSubscriptions) {
      if (sub.status === 'active') {
        mrr += sub.amount;
      }
    }

    // Guardar métricas de suscripción
    await supabaseClient.from('subscription_metrics').upsert({
      user_id,
      integration_id,
      metric_date: new Date().toISOString().split('T')[0],
      mrr,
      arr: mrr * 12,
      active_subscriptions: mockSubscriptions.filter((s) => s.status === 'active').length,
      new_subscriptions: mockSubscriptions.filter((s) => s.is_new).length,
      churned_subscriptions: mockSubscriptions.filter((s) => s.status === 'canceled').length,
      churn_rate: calculateChurnRate(mockSubscriptions),
    });

    // 5. Actualizar última sincronización
    await supabaseClient
      .from('financial_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration_id);

    return new Response(
      JSON.stringify({
        synced_count: syncedCount,
        total_revenue: totalRevenue,
        subscriptions_synced: mockSubscriptions.length,
        mrr,
        arr: mrr * 12,
        sync_type: sync_type || 'manual',
        synced_at: new Date().toISOString(),
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error syncing Stripe:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// MOCK DATA GENERATORS (En producción usar Stripe API real)
// ============================================================================

function generateMockStripeTransactions(sinceDate: string) {
  const transactions: any[] = [];
  const since = new Date(sinceDate).getTime();
  const now = Date.now();

  // Generar 10-20 transacciones aleatorias
  const count = Math.floor(Math.random() * 10) + 10;

  for (let i = 0; i < count; i++) {
    const timestamp = since + Math.random() * (now - since);
    const isIncome = Math.random() > 0.3; // 70% ingresos, 30% reembolsos

    transactions.push({
      id: `ch_${Math.random().toString(36).substring(7)}`,
      type: isIncome ? 'income' : 'refund',
      amount: Math.round((Math.random() * 500 + 50) * 100) / 100,
      currency: 'EUR',
      description: isIncome
        ? `Payment from customer #${Math.floor(Math.random() * 1000)}`
        : `Refund for order #${Math.floor(Math.random() * 1000)}`,
      created_at: new Date(timestamp).toISOString(),
      customer_email: `customer${Math.floor(Math.random() * 100)}@example.com`,
      customer_name: `Customer ${Math.floor(Math.random() * 100)}`,
      metadata: {
        source: 'stripe',
        payment_method: ['card', 'sepa_debit', 'paypal'][Math.floor(Math.random() * 3)],
      },
    });
  }

  return transactions;
}

function generateMockSubscriptions() {
  const subscriptions: any[] = [];
  const statuses = ['active', 'active', 'active', 'canceled', 'past_due'];

  for (let i = 0; i < 15; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    subscriptions.push({
      id: `sub_${Math.random().toString(36).substring(7)}`,
      status,
      amount: [9.99, 19.99, 49.99, 99.99][Math.floor(Math.random() * 4)],
      is_new: Math.random() > 0.8,
      customer_email: `customer${i}@example.com`,
    });
  }

  return subscriptions;
}

function calculateChurnRate(subscriptions: any[]) {
  const total = subscriptions.length;
  const churned = subscriptions.filter((s) => s.status === 'canceled').length;
  return total > 0 ? (churned / total) * 100 : 0;
}
