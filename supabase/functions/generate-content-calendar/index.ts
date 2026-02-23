/**
 * GENERATE CONTENT CALENDAR + AI WRITER
 *
 * Genera un calendar de contenido completo con:
 * - 50 ideas de contenido SEO-optimizadas
 * - Priorización por search volume + difficulty
 * - Calendar de 6 meses de publicación
 * - AI writer que escribe drafts completos (800-1200 palabras)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';


interface ContentCalendarRequest {
  projectId: string;
  businessIdea: string;
  targetCustomer: string;
  industry: string;
  keywords?: string[]; // Optional seed keywords
  numIdeas?: number; // Default: 50
}

interface ContentIdea {
  title: string;
  type: 'blog_post' | 'twitter_thread' | 'linkedin_post' | 'video_script';
  keywords: string[];
  search_volume: number; // Estimated
  seo_difficulty: 'easy' | 'medium' | 'hard';
  relevance_score: number; // 0-100
  outline: string[];
  scheduled_date: string; // YYYY-MM-DD
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  const startTime = Date.now();

  try {
        const { serviceClient: supabaseClient } = await validateAuth(req);

    const body: ContentCalendarRequest = await req.json();
    const { projectId, businessIdea, targetCustomer, industry, keywords = [], numIdeas = 50 } = body;

    if (!projectId || !businessIdea || !targetCustomer) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log(`📅 Generating content calendar with ${numIdeas} ideas`);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    // Generate content ideas
    const ideas = await generateContentIdeas(anthropic, {
      businessIdea,
      targetCustomer,
      industry,
      keywords,
      numIdeas,
    });

    // Create calendar with scheduling
    const calendar = scheduleContent(ideas);

    // Save to database
    const { data: calendarData, error: calendarError } = await supabaseClient
      .from('content_calendars')
      .insert({
        project_id: projectId,
        ideas: calendar,
      })
      .select()
      .single();

    if (calendarError) {
      console.error('Error saving calendar:', calendarError);
    }

    // Also save individual pieces for easier querying
    if (calendarData) {
      const pieces = calendar.map((idea) => ({
        project_id: projectId,
        calendar_id: calendarData.id,
        title: idea.title,
        type: idea.type,
        keywords: idea.keywords,
        search_volume: idea.search_volume,
        seo_difficulty: idea.seo_difficulty,
        relevance_score: idea.relevance_score,
        outline: idea.outline,
        scheduled_date: idea.scheduled_date,
        status: 'idea',
      }));

      await supabaseClient.from('content_pieces').insert(pieces);
    }

    const executionTimeMs = Date.now() - startTime;

    await logAICall({
      supabaseClient,
      projectId,
      userId: undefined,
      functionName: 'generate-content-calendar',
      inputData: { businessIdea, targetCustomer, numIdeas },
      outputData: calendar,
      success: true,
      executionTimeMs,
      tokensUsed: ideas.tokensUsed,
      modelUsed: 'claude-3-5-sonnet-20241022',
    });

    console.log(`✅ Content calendar generated in ${executionTimeMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        calendar,
        summary: {
          total_ideas: calendar.length,
          by_type: {
            blog_post: calendar.filter((i) => i.type === 'blog_post').length,
            twitter_thread: calendar.filter((i) => i.type === 'twitter_thread').length,
            linkedin_post: calendar.filter((i) => i.type === 'linkedin_post').length,
          },
          first_date: calendar[0]?.scheduled_date,
          last_date: calendar[calendar.length - 1]?.scheduled_date,
        },
      }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('❌ Error generating content calendar:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate content calendar',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});

/**
 * Generate content ideas with AI
 */
async function generateContentIdeas(
  anthropic: Anthropic,
  params: {
    businessIdea: string;
    targetCustomer: string;
    industry: string;
    keywords: string[];
    numIdeas: number;
  }
): Promise<{ ideas: ContentIdea[]; tokensUsed: number }> {
  const { businessIdea, targetCustomer, industry, keywords, numIdeas } = params;

  const prompt = `Eres un experto en content marketing y SEO. Genera ${numIdeas} ideas de contenido para este negocio.

NEGOCIO: ${businessIdea}
TARGET CUSTOMER: ${targetCustomer}
INDUSTRIA: ${industry}
SEED KEYWORDS: ${keywords.join(', ') || 'N/A'}

TASK: Genera ${numIdeas} ideas de contenido que:

1. **Attraen a tu target customer** (${targetCustomer})
2. **Rankean bien en SEO** (keywords con search volume)
3. **Mix de tipos**:
   - 60% blog posts (long-form, SEO focus)
   - 20% Twitter threads (viral potential)
   - 15% LinkedIn posts (thought leadership)
   - 5% video scripts

4. **Mix de dificultades SEO**:
   - 40% "easy" (baja competencia, quick wins)
   - 40% "medium" (competencia moderada)
   - 20% "hard" (high value, long-term bet)

ESTÁNDARES DE CALIDAD:

✅ BUENOS TÍTULOS (specific, SEO-friendly):
- "How to Find Your First 10 Customers as a SaaS Founder (Without Paid Ads)"
- "Project Management Tools Comparison 2026: Notion vs Jira vs ClickUp"
- "I Built a $10K MRR SaaS in 6 Months - Here's What I Learned"

❌ MALOS TÍTULOS (vague, not SEO):
- "Tips for Startups"
- "Project Management Guide"
- "My Journey"

KEYWORDS: Debe incluir keywords que tu target customer REALMENTE busca en Google.

OUTLINE: 3-5 secciones principales del artículo.

RELEVANCE SCORE: 0-100, qué tan relevante es para tu ICP (Ideal Customer Profile).

Devuelve SOLO un JSON array con este formato exacto (${numIdeas} items):
[
  {
    "title": "How to Validate Your SaaS Idea in 48 Hours (Step-by-Step Guide)",
    "type": "blog_post",
    "keywords": ["validate saas idea", "saas validation", "startup validation"],
    "search_volume": 2400,
    "seo_difficulty": "medium",
    "relevance_score": 95,
    "outline": [
      "Why 90% of SaaS ideas fail (validation problem)",
      "The 48-hour validation framework",
      "Step 1: Customer interviews (10 people)",
      "Step 2: Landing page + ads test ($50)",
      "Step 3: Analyze results (go/no-go decision)",
      "Real example: How I validated [Product] in 2 days"
    ]
  }
]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = (message.content[0] as { type: string; text: string }).text;
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse content ideas response');
  }

  const ideas = JSON.parse(jsonMatch[0]);

  return { ideas, tokensUsed };
}

/**
 * Schedule content over 6 months (2-3 posts per week)
 */
function scheduleContent(ideas: ContentIdea[]): ContentIdea[] {
  const today = new Date();
  const scheduled = ideas.map((idea, index) => {
    // 2-3 posts per week = roughly every 2-3 days
    const daysToAdd = Math.floor(index * 2.5);
    const scheduledDate = new Date(today);
    scheduledDate.setDate(scheduledDate.getDate() + daysToAdd);

    // Skip weekends
    if (scheduledDate.getDay() === 0) scheduledDate.setDate(scheduledDate.getDate() + 1); // Sunday → Monday
    if (scheduledDate.getDay() === 6) scheduledDate.setDate(scheduledDate.getDate() + 2); // Saturday → Monday

    return {
      ...idea,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
    };
  });

  // Sort by relevance and SEO difficulty (prioritize easy + high relevance first)
  return scheduled.sort((a, b) => {
    const scoreA = a.relevance_score + (a.seo_difficulty === 'easy' ? 20 : a.seo_difficulty === 'medium' ? 10 : 0);
    const scoreB = b.relevance_score + (b.seo_difficulty === 'easy' ? 20 : b.seo_difficulty === 'medium' ? 10 : 0);
    return scoreB - scoreA;
  });
}
