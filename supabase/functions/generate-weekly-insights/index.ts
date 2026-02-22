/**
 * GENERATE WEEKLY INSIGHTS (Cron Job)
 *
 * Runs every Monday morning to generate weekly insights email:
 * - Summary of last week
 * - Highlights (good news)
 * - Concerns (red flags)
 * - Competitor changes detected
 * - AI recommendations
 * - Next week priorities
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    console.log('📧 Generating weekly insights for all projects');

    // Get all active projects
    const { data: projects } = await supabaseClient
      .from('projects')
      .select('id, created_by, metadata')
      .eq('status', 'active');

    let totalGenerated = 0;

    for (const project of projects || []) {
      try {
        // Get data from last week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weekEnd = new Date();

        const context = await gatherWeeklyContext(supabaseClient, project.id, weekStart, weekEnd);

        // Generate insights with AI
        const insights = await generateInsights(anthropic, context, project);

        // Save to database
        await supabaseClient.from('weekly_insights').insert({
          project_id: project.id,
          week_start: weekStart.toISOString().split('T')[0],
          week_end: weekEnd.toISOString().split('T')[0],
          summary: insights.summary,
          highlights: insights.highlights,
          concerns: insights.concerns,
          competitor_changes: insights.competitor_changes,
          recommendations: insights.recommendations,
          next_week_priorities: insights.next_week_priorities,
          sent_at: new Date().toISOString(),
        });

        // TODO: Send email (integrate with send-email-real function)

        totalGenerated++;
      } catch (error) {
        console.error(`Error generating insights for project ${project.id}:`, error);
      }
    }

    console.log(`✅ Generated ${totalGenerated} weekly insights`);

    return new Response(
      JSON.stringify({
        success: true,
        generated: totalGenerated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Weekly insights cron failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherWeeklyContext(supabaseClient: any, projectId: string, weekStart: Date, weekEnd: Date) {
  const [metricsThisWeek, metricsLastWeek, competitorChanges, newRecommendations, okrs] = await Promise.all([
    supabaseClient
      .from('key_metrics')
      .select('*')
      .eq('project_id', projectId)
      .gte('date', weekStart.toISOString())
      .lte('date', weekEnd.toISOString())
      .order('date', { ascending: false })
      .limit(1)
      .single(),

    supabaseClient
      .from('key_metrics')
      .select('*')
      .eq('project_id', projectId)
      .lt('date', weekStart.toISOString())
      .order('date', { ascending: false })
      .limit(1)
      .single(),

    supabaseClient
      .from('competitor_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .gte('captured_at', weekStart.toISOString())
      .neq('changes_detected', '[]'),

    supabaseClient
      .from('ai_recommendations')
      .select('*')
      .eq('project_id', projectId)
      .gte('created_at', weekStart.toISOString())
      .order('priority', { ascending: true }),

    supabaseClient.from('okrs').select('*').eq('project_id', projectId),
  ]);

  return {
    metrics_this_week: metricsThisWeek.data,
    metrics_last_week: metricsLastWeek.data,
    competitor_changes: competitorChanges.data || [],
    new_recommendations: newRecommendations.data || [],
    okrs: okrs.data || [],
  };
}

async function generateInsights(anthropic: Anthropic, context: any, project: any) {
  const thisWeek = context.metrics_this_week;
  const lastWeek = context.metrics_last_week;

  const mrrGrowth = thisWeek && lastWeek ? ((thisWeek.mrr - lastWeek.mrr) / lastWeek.mrr) * 100 : 0;
  const customerGrowth =
    thisWeek && lastWeek ? ((thisWeek.total_customers - lastWeek.total_customers) / lastWeek.total_customers) * 100 : 0;

  const prompt = `Eres un business advisor. Genera un weekly insight email para este founder.

PROYECTO: ${project.metadata?.business_name || 'Startup'}

MÉTRICAS ESTA SEMANA:
MRR: $${thisWeek?.mrr || 0} (${mrrGrowth > 0 ? '+' : ''}${mrrGrowth.toFixed(1)}% vs last week)
Customers: ${thisWeek?.total_customers || 0} (${customerGrowth > 0 ? '+' : ''}${customerGrowth.toFixed(1)}%)
Churn: ${thisWeek?.churn_rate || 0}%
Runway: ${thisWeek?.runway_months || 0} months

CAMBIOS DE COMPETIDORES:
${context.competitor_changes.map((c: any) => `- ${JSON.stringify(c.changes_detected)}`).join('\n') || 'None'}

NUEVAS RECOMENDACIONES IA:
${context.new_recommendations.map((r: any) => `- ${r.title}`).join('\n') || 'None'}

OKRs:
${context.okrs.map((o: any) => `- ${o.objective} (${o.status})`).join('\n') || 'None'}

Genera un weekly insights JSON con:

1. **summary** (1-2 frases): Resumen ejecutivo de la semana
2. **highlights** (2-3 good news): Qué salió bien
3. **concerns** (1-2 red flags): Qué necesita atención
4. **competitor_changes**: Array de {competitor, change, impact}
5. **recommendations**: Top 3 actions para la próxima semana
6. **next_week_priorities**: 3-5 prioridades

ESTÁNDARES:

✅ GOOD:
- "MRR grew 12% ($2,340 → $2,621) - strongest week this quarter"
- "Churn spiked to 8% (vs 5% avg) - interview the 3 churned customers this week to identify pattern"

❌ BAD:
- "Good week"
- "Focus on growth"

Devuelve SOLO el JSON:
{
  "summary": "...",
  "highlights": [...],
  "concerns": [...],
  "competitor_changes": [{competitor: "X", change: "...", impact: "high/medium/low"}],
  "recommendations": [...],
  "next_week_priorities": [...]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as any).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse insights');
  }

  return JSON.parse(jsonMatch[0]);
}
