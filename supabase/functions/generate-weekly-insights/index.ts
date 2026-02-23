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
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';


interface WeeklyMetrics {
  mrr?: number;
  total_customers?: number;
  churn_rate?: number;
  runway_months?: number;
}

interface CompetitorChange {
  changes_detected: unknown;
}

interface AIRecommendation {
  title: string;
}

interface OKR {
  objective: string;
  status: string;
}

interface WeeklyContext {
  metrics_this_week: WeeklyMetrics | null;
  metrics_last_week: WeeklyMetrics | null;
  competitor_changes: CompetitorChange[];
  new_recommendations: AIRecommendation[];
  okrs: OKR[];
}

interface ProjectRecord {
  id: string;
  created_by: string;
  metadata: Record<string, unknown> | null;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
        const { serviceClient: supabaseClient } = await validateAuth(req);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    console.log('Generating weekly insights for all projects');

    // Get all active projects
    const { data: projects } = await supabaseClient
      .from('projects')
      .select('id, created_by, metadata')
      .eq('status', 'active');

    let totalGenerated = 0;

    for (const project of (projects as ProjectRecord[]) || []) {
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
            if (error instanceof Response) return error;
console.error(`Error generating insights for project ${project.id}:`, error);
      }
    }

    console.log(`Generated ${totalGenerated} weekly insights`);

    return new Response(
      JSON.stringify({
        success: true,
        generated: totalGenerated,
      }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
const err = error as Error;
    console.error('Weekly insights cron failed:', err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});

async function gatherWeeklyContext(
  supabaseClient: ReturnType<typeof createClient>,
  projectId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyContext> {
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
    metrics_this_week: metricsThisWeek.data as WeeklyMetrics | null,
    metrics_last_week: metricsLastWeek.data as WeeklyMetrics | null,
    competitor_changes: (competitorChanges.data || []) as CompetitorChange[],
    new_recommendations: (newRecommendations.data || []) as AIRecommendation[],
    okrs: (okrs.data || []) as OKR[],
  };
}

async function generateInsights(
  anthropic: Anthropic,
  context: WeeklyContext,
  project: ProjectRecord
) {
  const thisWeek = context.metrics_this_week;
  const lastWeek = context.metrics_last_week;

  const mrrGrowth = thisWeek && lastWeek && lastWeek.mrr
    ? (((thisWeek.mrr ?? 0) - lastWeek.mrr) / lastWeek.mrr) * 100
    : 0;
  const customerGrowth =
    thisWeek && lastWeek && lastWeek.total_customers
      ? (((thisWeek.total_customers ?? 0) - lastWeek.total_customers) / lastWeek.total_customers) * 100
      : 0;

  const prompt = `Eres un business advisor. Genera un weekly insight email para este founder.

PROYECTO: ${(project.metadata as Record<string, unknown>)?.business_name || 'Startup'}

METRICAS ESTA SEMANA:
MRR: $${thisWeek?.mrr || 0} (${mrrGrowth > 0 ? '+' : ''}${mrrGrowth.toFixed(1)}% vs last week)
Customers: ${thisWeek?.total_customers || 0} (${customerGrowth > 0 ? '+' : ''}${customerGrowth.toFixed(1)}%)
Churn: ${thisWeek?.churn_rate || 0}%
Runway: ${thisWeek?.runway_months || 0} months

CAMBIOS DE COMPETIDORES:
${context.competitor_changes.map((c: CompetitorChange) => `- ${JSON.stringify(c.changes_detected)}`).join('\n') || 'None'}

NUEVAS RECOMENDACIONES IA:
${context.new_recommendations.map((r: AIRecommendation) => `- ${r.title}`).join('\n') || 'None'}

OKRs:
${context.okrs.map((o: OKR) => `- ${o.objective} (${o.status})`).join('\n') || 'None'}

Genera un weekly insights JSON con:

1. **summary** (1-2 frases): Resumen ejecutivo de la semana
2. **highlights** (2-3 good news): Que salio bien
3. **concerns** (1-2 red flags): Que necesita atencion
4. **competitor_changes**: Array de {competitor, change, impact}
5. **recommendations**: Top 3 actions para la proxima semana
6. **next_week_priorities**: 3-5 prioridades

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

  const text = (message.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse insights');
  }

  return JSON.parse(jsonMatch[0]);
}
