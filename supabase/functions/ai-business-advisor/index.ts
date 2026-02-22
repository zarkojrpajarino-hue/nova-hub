/**
 * AI BUSINESS ADVISOR (Chat with RAG)
 *
 * Chat inteligente con contexto completo del proyecto:
 * - Responde preguntas usando datos reales del proyecto
 * - Recommendations basadas en métricas actuales
 * - Comparaciones con competencia
 * - Predictions y strategic advice
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvisorRequest {
  projectId: string;
  chatId?: string; // Resume existing chat
  message: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
  sources?: ProjectContextSource[];
}

interface ChatRecord {
  id: string;
  project_id: string;
  messages: ChatMessage[];
}

interface ProjectContextSource {
  type: string;
  data: unknown;
}

interface MetricRecord {
  mrr?: number;
  total_customers?: number;
  churn_rate?: number;
  cash_balance?: number;
  runway_months?: number;
  [key: string]: unknown;
}

interface OkrRecord {
  objective?: string;
  status?: string;
  [key: string]: unknown;
}

interface CompetitorRecord {
  changes_detected?: unknown;
  [key: string]: unknown;
}

interface RecommendationRecord {
  title?: string;
  category?: string;
  priority?: string;
  [key: string]: unknown;
}

interface ProjectRecord {
  metadata?: {
    business_name?: string;
    industry?: string;
    stage?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ProjectContext {
  project: ProjectRecord | null;
  latest_metrics: MetricRecord | null;
  metrics_history: MetricRecord[] | null;
  financial_projections: unknown[] | null;
  recent_competitor_changes: CompetitorRecord[] | null;
  okrs: OkrRecord[] | null;
  active_recommendations: RecommendationRecord[] | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { projectId, chatId, message }: AdvisorRequest = await req.json();

    if (!projectId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing projectId or message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🤖 AI Advisor: "${message}"`);

    // Get or create chat
    let chat: ChatRecord | null = null;
    if (chatId) {
      const { data } = await supabaseClient
        .from('advisor_chats')
        .select('*')
        .eq('id', chatId)
        .single();
      chat = data;
    }

    if (!chat) {
      const { data } = await supabaseClient
        .from('advisor_chats')
        .insert({
          project_id: projectId,
          messages: [],
        })
        .select()
        .single();
      chat = data;
    }

    if (!chat) {
      throw new Error('Failed to create or retrieve chat');
    }

    // Gather project context (RAG)
    const context = await gatherProjectContext(supabaseClient, projectId);

    // Generate response with context
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });
    const response = await generateAdvisorResponse(anthropic, message, context, chat.messages);

    // Update chat history
    const updatedMessages = [
      ...chat.messages,
      { id: crypto.randomUUID(), role: 'user', content: message, created_at: new Date().toISOString() },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text,
        created_at: new Date().toISOString(),
        sources: response.sources,
      },
    ];

    await supabaseClient
      .from('advisor_chats')
      .update({ messages: updatedMessages })
      .eq('id', chat.id);

    const executionTimeMs = Date.now() - startTime;

    console.log(`✅ AI Advisor responded in ${executionTimeMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        chatId: chat.id,
        response: response.text,
        sources: response.sources,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ AI Advisor error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Gather all relevant project context (RAG)
 */
async function gatherProjectContext(supabaseClient: SupabaseClient, projectId: string): Promise<ProjectContext> {
  // Fetch all relevant data in parallel
  const [project, metrics, financials, competitors, okrs, recommendations] = await Promise.all([
    supabaseClient.from('projects').select('*').eq('id', projectId).single(),
    supabaseClient
      .from('key_metrics')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(12), // Last 12 data points
    supabaseClient
      .from('financial_projections')
      .select('*')
      .eq('project_id', projectId)
      .order('year, month')
      .limit(36),
    supabaseClient
      .from('competitor_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .order('captured_at', { ascending: false })
      .limit(10),
    supabaseClient.from('okrs').select('*').eq('project_id', projectId),
    supabaseClient
      .from('ai_recommendations')
      .select('*')
      .eq('project_id', projectId)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return {
    project: project.data,
    latest_metrics: metrics.data?.[0],
    metrics_history: metrics.data,
    financial_projections: financials.data,
    recent_competitor_changes: competitors.data,
    okrs: okrs.data,
    active_recommendations: recommendations.data,
  };
}

/**
 * Generate response using Claude with full context
 */
async function generateAdvisorResponse(
  anthropic: Anthropic,
  userMessage: string,
  context: ProjectContext,
  chatHistory: ChatMessage[]
): Promise<{ text: string; sources: ProjectContextSource[] }> {
  // Build context string
  const contextStr = `
PROJECT INFO:
Business: ${context.project?.metadata?.business_name || 'N/A'}
Industry: ${context.project?.metadata?.industry || 'N/A'}
Stage: ${context.project?.metadata?.stage || 'Early stage'}

CURRENT METRICS (Latest):
MRR: $${context.latest_metrics?.mrr || 0}
Total Customers: ${context.latest_metrics?.total_customers || 0}
Churn Rate: ${context.latest_metrics?.churn_rate || 0}%
Cash Balance: $${context.latest_metrics?.cash_balance || 0}
Runway: ${context.latest_metrics?.runway_months || 0} months

OKRS:
${context.okrs?.map((okr: OkrRecord) => `- ${okr.objective} (${okr.status})`).join('\n') || 'No OKRs set'}

RECENT COMPETITOR CHANGES:
${context.recent_competitor_changes?.slice(0, 3).map((c: CompetitorRecord) => `- ${JSON.stringify(c.changes_detected)}`).join('\n') || 'None'}

ACTIVE RECOMMENDATIONS:
${context.active_recommendations?.slice(0, 5).map((r: RecommendationRecord) => `- ${r.title} (${r.category}, priority: ${r.priority})`).join('\n') || 'None'}
`;

  // Build chat history for context
  const recentHistory = chatHistory.slice(-6); // Last 3 exchanges

  const systemPrompt = `Eres un experto business advisor para startups. Tienes acceso a TODOS los datos del proyecto del founder.

Tu rol:
- Responder preguntas con DATA (usa los números del contexto)
- Dar recommendations accionables (no genéricas)
- Ser directo y honesto (si algo está mal, dilo)
- Comparar con best practices y benchmarks
- Identificar red flags early

CONTEXT DEL PROYECTO:
${contextStr}

GUIDELINES:
- SIEMPRE cita números específicos del contexto
- Si no tienes data suficiente, di "Necesito más info sobre X"
- Sé conciso (2-3 párrafos máximo)
- Prioriza ACTIONABLE advice vs theory

EJEMPLOS:

❌ MAL (genérico):
"Deberías mejorar tu tasa de churn. El churn alto es malo para SaaS."

✅ BIEN (específico + actionable):
"Tu churn de 8% está 2x arriba del benchmark SaaS (<5%). Esto significa que pierdes $${(context.latest_metrics?.mrr || 0) * 0.08}/mo. Prioridad: entrevista a los 3 últimos churned customers esta semana para identificar patrón. Tu OKR de reducir churn a 5% en Q1 es crítico."

❌ MAL:
"Fundraising is important."

✅ BIEN:
"Con $${context.latest_metrics?.cash_balance || 0} cash y ${context.latest_metrics?.runway_months || 0} meses runway, necesitas levantar en los próximos 3 meses (idealmente antes de <6 meses runway). Target: $250K para llegar a 18 meses runway. Milestones antes de fundraise: hit $10K MRR (estás en $${context.latest_metrics?.mrr || 0}), reduce churn a <5% (actual: ${context.latest_metrics?.churn_rate || 0}%)."`;

  const messages = [
    ...recentHistory.map((m: ChatMessage) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  });

  const firstContent = response.content[0];
  const text = firstContent.type === 'text' ? firstContent.text : '';

  // Extract sources (what data was used)
  const sources: ProjectContextSource[] = [];
  if (text.includes('MRR') || text.includes('churn') || text.includes('customers')) {
    sources.push({ type: 'metric', data: context.latest_metrics });
  }
  if (text.includes('competitor')) {
    sources.push({ type: 'competitor', data: context.recent_competitor_changes?.[0] });
  }
  if (text.includes('OKR')) {
    sources.push({ type: 'okr', data: context.okrs });
  }

  return { text, sources };
}
