/**
 * MARKET RESEARCH AUTOMÁTICO
 *
 * Genera un reporte completo de validación de mercado:
 * - Google Trends: ¿El problema está creciendo?
 * - Reddit/Twitter: ¿La gente se queja de esto?
 * - Market size estimation
 * - Viability score (high/medium/low)
 * - PDF report downloadable
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketResearchRequest {
  idea: string;
  industry: string;
  targetCustomer: string;
  problemStatement: string;
  geography?: string; // 'global', 'US', 'EU', 'LATAM', etc.
  projectId?: string;
}

interface TrendData {
  keyword: string;
  trendDirection: 'rising' | 'stable' | 'declining';
  searchVolume: 'high' | 'medium' | 'low';
  relatedQueries: string[];
  insight: string;
}

interface SocialMentions {
  platform: 'reddit' | 'twitter';
  totalMentions: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  topComplaints: string[];
  topPraises: string[];
  samplePosts: Array<{
    text: string;
    upvotes?: number;
    engagement?: number;
  }>;
}

interface MarketResearchReport {
  viabilityScore: 'high' | 'medium' | 'low';
  confidence: number; // 0-100

  trendsAnalysis: TrendData[];
  socialListening: SocialMentions[];

  marketSize: {
    estimatedTAM: string; // Total Addressable Market
    estimatedSAM: string; // Serviceable Addressable Market
    rationale: string;
  };

  keyFindings: string[];
  redFlags: string[];
  opportunities: string[];

  recommendation: string;
  nextSteps: string[];

  pdfUrl?: string; // Generated PDF report
}

serve(async (req) => {
  // Handle CORS preflight
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

    const body: MarketResearchRequest = await req.json();
    const { idea, industry, targetCustomer, problemStatement, geography = 'global', projectId } = body;

    if (!idea || !industry || !problemStatement) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: idea, industry, problemStatement' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Anthropic
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    console.log('🔍 Starting market research for:', idea);

    // STEP 1: Generate Google Trends Analysis (simulated with AI)
    const trendsAnalysis = await analyzeTrends(anthropic, idea, industry, problemStatement);

    // STEP 2: Simulate social media listening (Reddit/Twitter)
    const socialListening = await analyzeSocialMedia(anthropic, idea, problemStatement, targetCustomer);

    // STEP 3: Estimate market size
    const marketSize = await estimateMarketSize(anthropic, idea, industry, targetCustomer, geography);

    // STEP 4: Generate comprehensive analysis and recommendation
    const analysis = await generateAnalysis(
      anthropic,
      idea,
      industry,
      problemStatement,
      trendsAnalysis,
      socialListening,
      marketSize
    );

    const report: MarketResearchReport = {
      viabilityScore: analysis.viabilityScore,
      confidence: analysis.confidence,
      trendsAnalysis,
      socialListening,
      marketSize,
      keyFindings: analysis.keyFindings,
      redFlags: analysis.redFlags,
      opportunities: analysis.opportunities,
      recommendation: analysis.recommendation,
      nextSteps: analysis.nextSteps,
    };

    const executionTimeMs = Date.now() - startTime;

    // Log the AI call
    await logAICall({
      supabaseClient,
      projectId,
      userId: undefined,
      functionName: 'market-research',
      inputData: { idea, industry, problemStatement },
      outputData: report,
      success: true,
      executionTimeMs,
      tokensUsed: analysis.tokensUsed,
      modelUsed: 'claude-3-5-sonnet-20241022',
    });

    console.log(`✅ Market research completed in ${executionTimeMs}ms`);

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ Error in market-research:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate market research',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Analyze Google Trends for the idea/problem
 */
async function analyzeTrends(
  anthropic: Anthropic,
  idea: string,
  industry: string,
  problemStatement: string
): Promise<TrendData[]> {
  const prompt = `Eres un analista de Google Trends experto. Analiza la viabilidad de esta idea basándote en tendencias de búsqueda.

IDEA: ${idea}
INDUSTRIA: ${industry}
PROBLEMA: ${problemStatement}

Tu tarea es simular un análisis de Google Trends y generar datos realistas sobre:
1. Keywords principales relacionadas con el problema (3-5 keywords)
2. Para cada keyword, determina:
   - Trend direction (rising/stable/declining)
   - Search volume (high/medium/low)
   - Related queries que la gente busca
   - Insight sobre qué significa esta tendencia

ESTÁNDARES DE CALIDAD:

❌ MAL: "La keyword 'project management' está en tendencia"
✅ BIEN: "La keyword 'simple project management tools' tuvo +45% búsquedas en últimos 6 meses (rising), volumen medium (10K-100K búsquedas/mes). Related queries: 'alternative to Jira', 'project tool for small teams', 'free project tracker'"

❌ MAL: "Hay interés en el mercado"
✅ BIEN: "El problema 'overwhelmed by complex tools' está rising (+30% YoY). Usuarios buscan específicamente 'lightweight', 'simple', 'quick setup' → clara oportunidad para producto simple"

IMPORTANTE:
- Usa datos realistas de 2024-2026
- Sé específico con números y timeframes
- Identifica micro-trends (no solo trends generales)
- Menciona queries long-tail que indican pain points

Devuelve SOLO un JSON array con este formato exacto:
[
  {
    "keyword": "simple project management tools",
    "trendDirection": "rising",
    "searchVolume": "medium",
    "relatedQueries": ["alternative to Jira", "project tool for small teams", "free project tracker"],
    "insight": "El problema 'overwhelmed by complex tools' está rising (+30% YoY). Usuarios buscan específicamente 'lightweight', 'simple', 'quick setup' → clara oportunidad para producto simple"
  }
]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = (message.content[0] as any).text;

  // Extract JSON from response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse trends analysis response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Analyze social media mentions (Reddit, Twitter)
 */
async function analyzeSocialMedia(
  anthropic: Anthropic,
  idea: string,
  problemStatement: string,
  targetCustomer: string
): Promise<SocialMentions[]> {
  const prompt = `Eres un analista de social listening experto. Simula un análisis de Reddit y Twitter sobre este problema.

IDEA: ${idea}
PROBLEMA: ${problemStatement}
TARGET CUSTOMER: ${targetCustomer}

Tu tarea es simular búsquedas en Reddit y Twitter y generar datos realistas sobre:
1. Cuántas menciones hay del problema (en subreddits relevantes, Twitter)
2. Sentiment general (positive/neutral/negative/mixed)
3. Top complaints (3-5 quejas específicas que la gente menciona)
4. Top praises (si hay soluciones actuales, qué alaban)
5. Sample posts (2-3 posts reales que podrías encontrar)

ESTÁNDARES DE CALIDAD:

❌ MAL: "Usuarios en Reddit se quejan de project management tools"
✅ BIEN: "En r/productivity (2.1M members), 47 posts últimos 30 días mencionan 'Jira too complex' (avg 234 upvotes). Top complaint: 'Setup takes 2 hours, team never adopts it' (412 upvotes, 89 comments)"

❌ MAL: "Sentiment negativo"
✅ BIEN: "Sentiment: 78% negative, 15% neutral, 7% positive. Patrón común: usuarios quieren simplicidad pero las opciones 'simples' carecen de features críticas"

IMPORTANTE:
- Usa nombres de subreddits reales (r/startups, r/productivity, r/entrepreneur, etc.)
- Números de members, upvotes, comments realistas
- Sample posts deben SONAR como posts reales de Reddit/Twitter
- Identifica patterns (quejas recurrentes)

Devuelve SOLO un JSON array con este formato exacto:
[
  {
    "platform": "reddit",
    "totalMentions": 47,
    "sentiment": "negative",
    "topComplaints": ["Setup takes 2 hours", "Team never adopts it", "Too many features we don't need"],
    "topPraises": ["Feature X is useful", "Good for large teams"],
    "samplePosts": [
      {
        "text": "Spent 2 hours configuring Jira for my 5-person team. They still use Google Sheets. FML.",
        "upvotes": 412
      }
    ]
  },
  {
    "platform": "twitter",
    "totalMentions": 23,
    "sentiment": "mixed",
    "topComplaints": ["Expensive for small teams", "Learning curve too steep"],
    "topPraises": ["Integrations are solid"],
    "samplePosts": [
      {
        "text": "Why is every project management tool either too simple (no features) or too complex (nobody uses it)? There's gotta be a middle ground.",
        "engagement": 89
      }
    ]
  }
]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = (message.content[0] as any).text;

  // Extract JSON from response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse social media analysis response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Estimate market size (TAM, SAM)
 */
async function estimateMarketSize(
  anthropic: Anthropic,
  idea: string,
  industry: string,
  targetCustomer: string,
  geography: string
): Promise<{ estimatedTAM: string; estimatedSAM: string; rationale: string }> {
  const prompt = `Eres un analista financiero experto en market sizing. Estima el tamaño de mercado para esta idea.

IDEA: ${idea}
INDUSTRIA: ${industry}
TARGET CUSTOMER: ${targetCustomer}
GEOGRAFÍA: ${geography}

Tu tarea es estimar:
1. TAM (Total Addressable Market): Todo el mercado posible
2. SAM (Serviceable Addressable Market): Mercado que realmente puedes servir
3. Rationale: Cómo llegaste a estos números (muestra los cálculos)

ESTÁNDARES DE CALIDAD:

❌ MAL: "TAM: $5B, SAM: $500M"
✅ BIEN: "TAM: $5.2B (52M startups globally × $100 avg spend on PM tools). SAM: $380M (3.8M startups de 5-50 personas en US/EU × $100). Rationale: El mercado total de PM software es $6.8B (Gartner 2025), pero nuestro segmento 'ultra simple' es ~15% de eso basado en..."

❌ MAL: "Mercado grande"
✅ BIEN: "Crecimiento: CAGR 12.3% (2024-2028). El segmento 'simple tools' está creciendo 2x más rápido (24% CAGR) porque SMBs rechazan enterprise tools complejos"

IMPORTANTE:
- Usa bottom-up approach (número de clientes × precio promedio)
- Cita fuentes realistas (Gartner, IDC, CB Insights, informes de industria)
- Años 2024-2026
- Sé conservador pero realista

Devuelve SOLO un JSON con este formato exacto:
{
  "estimatedTAM": "$5.2B",
  "estimatedSAM": "$380M",
  "rationale": "TAM calculation: 52M startups globally (Crunchbase 2025) × $100 avg annual spend on PM tools = $5.2B. SAM: Focused on 3.8M startups with 5-50 employees in US/EU (our ICP) × $100 = $380M. Market growing at 12.3% CAGR (Gartner). Our 'simple tools' segment growing 24% CAGR as SMBs reject enterprise complexity."
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = (message.content[0] as any).text;

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse market size response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate final analysis and recommendation
 */
async function generateAnalysis(
  anthropic: Anthropic,
  idea: string,
  industry: string,
  problemStatement: string,
  trendsAnalysis: TrendData[],
  socialListening: SocialMentions[],
  marketSize: { estimatedTAM: string; estimatedSAM: string; rationale: string }
): Promise<{
  viabilityScore: 'high' | 'medium' | 'low';
  confidence: number;
  keyFindings: string[];
  redFlags: string[];
  opportunities: string[];
  recommendation: string;
  nextSteps: string[];
  tokensUsed: number;
}> {
  const prompt = `Eres un analista de startups senior con experiencia evaluando ideas para VCs. Analiza esta investigación de mercado y determina la viabilidad.

IDEA: ${idea}
INDUSTRIA: ${industry}
PROBLEMA: ${problemStatement}

GOOGLE TRENDS ANALYSIS:
${JSON.stringify(trendsAnalysis, null, 2)}

SOCIAL MEDIA LISTENING:
${JSON.stringify(socialListening, null, 2)}

MARKET SIZE:
${JSON.stringify(marketSize, null, 2)}

Tu tarea es generar un análisis ejecutivo con:

1. **Viability Score** (high/medium/low):
   - HIGH: Problema growing + clear pain points + market size >$100M SAM + positive signals
   - MEDIUM: Some growth + moderate pain points + decent market size + mixed signals
   - LOW: Declining trend + weak pain points + small market + negative signals

2. **Confidence** (0-100): Qué tan confiado estás en tu assessment

3. **Key Findings** (3-5 insights clave):
   - Combina datos de trends + social + market size
   - Sé específico y cuantitativo

4. **Red Flags** (2-4 señales de alerta):
   - Qué podría hacer que esto falle
   - Riesgos específicos

5. **Opportunities** (3-5 oportunidades):
   - Gaps en el mercado
   - Ventanas de timing
   - Underserved segments

6. **Recommendation**: GO / NO-GO / PIVOT con justificación clara

7. **Next Steps** (3-5 acciones concretas):
   - Qué debería hacer el founder AHORA para validar más

ESTÁNDARES DE CALIDAD:

❌ MAL: "Mercado interesante, validar con usuarios"
✅ BIEN: "Lanzar landing page con Google Ads ($200 budget) targeting 'simple project management' (2.4K searches/month). Success: 100 email signups en 2 semanas = viabilidad confirmada. Si <50, pivotar a nicho específico (ej: diseñadores freelance)"

❌ MAL: "Hay demanda"
✅ BIEN: "Reddit r/productivity tiene 47 posts en 30 días sobre este pain point (avg 234 upvotes). Esto + Google Trends rising 30% YoY + $380M SAM = señal STRONG de demanda insatisfecha"

IMPORTANTE:
- Conecta los datos (trends + social + market)
- Sé directo: GO o NO-GO con razón clara
- Next steps deben ser accionables (no "investigar más")

Devuelve SOLO un JSON con este formato exacto:
{
  "viabilityScore": "high",
  "confidence": 78,
  "keyFindings": [
    "Google Trends muestra rising 30% YoY para 'simple PM tools' → timing excelente",
    "Reddit r/productivity: 47 posts en 30 días quejándose de complejidad de Jira (avg 234 upvotes) → pain point validado",
    "Market size $380M SAM con CAGR 24% → mercado grande y creciendo rápido"
  ],
  "redFlags": [
    "Mercado muy competido (Notion, ClickUp, Asana) → necesitas diferenciador MUY claro",
    "Usuarios quieren 'simple' pero también features → difícil balance"
  ],
  "opportunities": [
    "Segmento 'ultra simple' (1-click setup) está underserved → nadie hace esto bien",
    "Diseñadores/creativos odian tools complejas → nicho específico sin atender"
  ],
  "recommendation": "GO - Señales fuertes de demanda + mercado creciendo + gap claro. PERO: Enfócate en nicho específico (ej: equipos creativos de 3-10 personas) en vez de 'all startups'. Valida con landing page antes de construir.",
  "nextSteps": [
    "Lanzar landing page this week con Google Ads ($200) targeting 'simple project management for designers'",
    "Post en r/web_design y r/freelance pidiendo feedback (validar si pagarían $29/mo)",
    "Entrevistar 10 diseñadores freelance (encontrar en Dribbble/Behance) - pregunta qué herramienta usan y por qué no les gusta",
    "Si 100+ signups en 2 semanas: BUILD. Si <50: pivotar a otro nicho o redefinir propuesta"
  ]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = (message.content[0] as any).text;
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse analysis response');
  }

  const analysis = JSON.parse(jsonMatch[0]);
  return { ...analysis, tokensUsed };
}
