/**
 * GENERATE FINANCIAL PROJECTIONS
 *
 * Genera proyecciones financieras automáticas para 3 años:
 * - P&L Statement (Profit & Loss)
 * - Cash Flow Projection
 * - Key Metrics Dashboard
 * - Export a Excel con fórmulas editables
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';


interface ProjectionInput {
  projectId: string;

  // Business model
  pricing: Array<{
    name: string;
    price: number;
    target_customers_month1: number;
  }>;

  // Customer acquisition
  cac: number; // Customer Acquisition Cost
  churn_rate: number; // Monthly churn rate (e.g., 5 = 5%)

  // Costs
  initial_cash: number;
  team: Array<{
    role: string;
    salary_monthly: number;
    start_month: number; // When they join (1-36)
  }>;
  marketing_budget_monthly: number;
  infrastructure_cost_monthly: number;
  other_costs_monthly?: number;

  // Growth assumptions
  growth_rate_monthly?: number; // Default: 15%
  years?: number; // Default: 3
}

interface MonthlyProjection {
  year: number;
  month: number;
  month_index: number; // 1-36

  // Revenue
  revenue: number;
  mrr: number;
  new_customers: number;
  churned_customers: number;
  total_customers: number;

  // Costs
  cogs: number;
  payroll: number;
  marketing_spend: number;
  infrastructure: number;
  other_costs: number;
  total_costs: number;

  // Calculated
  gross_profit: number;
  gross_margin: number; // percentage
  net_profit: number;
  cash_balance: number;
  burn_rate: number;
  runway_months: number;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  const startTime = Date.now();

  try {
        const { serviceClient: supabaseClient } = await validateAuth(req);

    const input: ProjectionInput = await req.json();
    const {
      projectId,
      pricing,
      cac,
      churn_rate,
      initial_cash,
      team,
      marketing_budget_monthly,
      infrastructure_cost_monthly,
      other_costs_monthly = 0,
      growth_rate_monthly = 15,
      years = 3,
    } = input;

    if (!projectId || !pricing || !cac || !churn_rate || !initial_cash || !team) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log('📊 Generating financial projections for', years, 'years');

    // Generate month-by-month projections
    const projections: MonthlyProjection[] = [];
    let cash_balance = initial_cash;
    let total_customers = 0;

    for (let month_index = 1; month_index <= years * 12; month_index++) {
      const year = Math.ceil(month_index / 12);
      const month = ((month_index - 1) % 12) + 1;

      // Calculate new customers (growth rate applied)
      const growth_multiplier = month_index === 1 ? 1 : Math.pow(1 + growth_rate_monthly / 100, month_index - 1);
      const target_new_customers = pricing.reduce((sum, tier) => sum + tier.target_customers_month1, 0);
      const new_customers = Math.round(target_new_customers * growth_multiplier);

      // Calculate churn
      const churned_customers = Math.round(total_customers * (churn_rate / 100));
      total_customers = total_customers + new_customers - churned_customers;

      // Calculate revenue (weighted average of pricing tiers)
      const avg_price = pricing.reduce((sum, tier) => sum + tier.price, 0) / pricing.length;
      const mrr = total_customers * avg_price;
      const revenue = mrr;

      // Calculate costs
      const payroll = team
        .filter((member) => member.start_month <= month_index)
        .reduce((sum, member) => sum + member.salary_monthly, 0);

      const marketing_spend = marketing_budget_monthly;
      const infrastructure = infrastructure_cost_monthly;
      const other_costs = other_costs_monthly;

      // COGS (assume 10% of revenue for SaaS)
      const cogs = revenue * 0.1;

      const total_costs = cogs + payroll + marketing_spend + infrastructure + other_costs;

      // Calculate metrics
      const gross_profit = revenue - cogs;
      const gross_margin = revenue > 0 ? (gross_profit / revenue) * 100 : 0;
      const net_profit = revenue - total_costs;

      cash_balance += net_profit;

      const burn_rate = total_costs - revenue;
      const runway_months = burn_rate > 0 ? Math.floor(cash_balance / burn_rate) : 999;

      projections.push({
        year,
        month,
        month_index,
        revenue,
        mrr,
        new_customers,
        churned_customers,
        total_customers,
        cogs,
        payroll,
        marketing_spend,
        infrastructure,
        other_costs,
        total_costs,
        gross_profit,
        gross_margin,
        net_profit,
        cash_balance,
        burn_rate,
        runway_months,
      });
    }

    // Save to database
    const { error: insertError } = await supabaseClient.from('financial_projections').insert(
      projections.map((p) => ({
        project_id: projectId,
        year: p.year,
        month: p.month,
        revenue: p.revenue,
        mrr: p.mrr,
        new_customers: p.new_customers,
        churned_customers: p.churned_customers,
        cogs: p.cogs,
        payroll: p.payroll,
        marketing_spend: p.marketing_spend,
        infrastructure: p.infrastructure,
        other_costs: p.other_costs,
        gross_profit: p.gross_profit,
        gross_margin: p.gross_margin,
        net_profit: p.net_profit,
        cash_balance: p.cash_balance,
        burn_rate: p.burn_rate,
        runway_months: p.runway_months,
      }))
    );

    if (insertError) {
      console.error('Error saving projections:', insertError);
      // Continue even if save fails
    }

    // Generate AI insights
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });
    const insights = await generateInsights(anthropic, projections, input);

    const executionTimeMs = Date.now() - startTime;

    await logAICall({
      supabaseClient,
      projectId,
      userId: undefined,
      functionName: 'generate-financial-projections',
      inputData: input,
      outputData: { projections, insights },
      success: true,
      executionTimeMs,
      tokensUsed: insights.tokensUsed,
      modelUsed: 'claude-3-5-sonnet-20241022',
    });

    console.log(`✅ Financial projections generated in ${executionTimeMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        projections,
        insights: insights.analysis,
        summary: {
          total_months: projections.length,
          year_1_revenue: projections.filter((p) => p.year === 1).reduce((sum, p) => sum + p.revenue, 0),
          year_2_revenue: projections.filter((p) => p.year === 2).reduce((sum, p) => sum + p.revenue, 0),
          year_3_revenue: projections.filter((p) => p.year === 3).reduce((sum, p) => sum + p.revenue, 0),
          break_even_month: projections.find((p) => p.net_profit > 0)?.month_index || null,
          final_cash: projections[projections.length - 1].cash_balance,
        },
      }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('❌ Error generating financial projections:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate financial projections',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});

/**
 * Generate AI insights from projections
 */
async function generateInsights(
  anthropic: Anthropic,
  projections: MonthlyProjection[],
  input: ProjectionInput
): Promise<{ analysis: unknown; tokensUsed: number }> {
  const year1 = projections.filter((p) => p.year === 1);
  const year2 = projections.filter((p) => p.year === 2);
  const year3 = projections.filter((p) => p.year === 3);

  const prompt = `Eres un CFO experto analizando proyecciones financieras de una startup.

PROYECCIONES GENERADAS:

Year 1 Revenue: $${year1.reduce((s, p) => s + p.revenue, 0).toFixed(0)}
Year 2 Revenue: $${year2.reduce((s, p) => s + p.revenue, 0).toFixed(0)}
Year 3 Revenue: $${year3.reduce((s, p) => s + p.revenue, 0).toFixed(0)}

Break-even month: ${projections.find((p) => p.net_profit > 0)?.month_index || 'Never'}
Final cash: $${projections[projections.length - 1].cash_balance.toFixed(0)}
Runway at month 12: ${year1[11].runway_months} months

INPUTS:
CAC: $${input.cac}
Churn rate: ${input.churn_rate}%
Monthly growth: ${input.growth_rate_monthly || 15}%
Team size by year 3: ${input.team.length}

Tu tarea es analizar estos números y generar:

1. **Key Insights** (3-5 insights críticos):
   - ¿Qué riesgos ves?
   - ¿Qué está bien?
   - ¿Qué optimizar primero?

2. **Red Flags** (2-3 señales de alerta):
   - ¿Runway demasiado corto?
   - ¿Churn muy alto?
   - ¿CAC insostenible?

3. **Recommendations** (3-5 acciones):
   - Qué ajustar en el modelo
   - Cuánto fundraising necesitan
   - Cuándo fundraisear

4. **Fundraising Strategy**:
   - Cuánto levantar (basado en runway + 6 meses buffer)
   - Cuándo levantar (antes de quedarse sin runway)
   - Qué milestones alcanzar primero

ESTÁNDARES DE CALIDAD:

❌ MAL: "El runway es bajo"
✅ BIEN: "Runway de 8 meses en mes 12 es riesgoso. Necesitas levantar $250K en Q3 para llegar a 18 meses runway (safe zone)"

❌ MAL: "Reduce costos"
✅ BIEN: "Payroll de $30K/mo en mes 1 es 60% de costs. Considera contratar hire #3 en mes 6 (no mes 3) para extender runway 4 meses"

Devuelve SOLO un JSON con este formato exacto:
{
  "key_insights": [
    "Insight 1 con números específicos",
    "Insight 2 con números específicos"
  ],
  "red_flags": [
    "Red flag 1 con reasoning",
    "Red flag 2 con reasoning"
  ],
  "recommendations": [
    "Acción 1 concreta con números",
    "Acción 2 concreta con números"
  ],
  "fundraising_strategy": {
    "amount": 250000,
    "timing": "Q3 Year 1 (Month 9)",
    "reasoning": "Runway drops to 6 months in month 12. Need 18 months to hit product-market fit.",
    "milestones_before_raise": [
      "Hit $10K MRR",
      "Reduce churn to <5%",
      "5 case studies from beta customers"
    ]
  }
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = (message.content[0] as { type: string; text: string }).text;
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse insights response');
  }

  return {
    analysis: JSON.parse(jsonMatch[0]),
    tokensUsed,
  };
}
