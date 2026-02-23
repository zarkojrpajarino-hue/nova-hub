/**
 * AI CONTENT WRITER
 *
 * Escribe drafts completos de contenido (800-1200 palabras):
 * - Blog posts SEO-optimized
 * - Twitter threads virales
 * - LinkedIn posts thought leadership
 * - Video scripts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';


interface WriteContentRequest {
  contentPieceId: string;
  projectId: string;
  // Or provide directly:
  title?: string;
  type?: 'blog_post' | 'twitter_thread' | 'linkedin_post' | 'video_script';
  keywords?: string[];
  outline?: string[];
  targetCustomer?: string;
  businessContext?: string;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  const startTime = Date.now();

  try {
        const { user, serviceClient: supabaseClient } = await validateAuth(req);

    const rateLimitResult = await checkRateLimit(user.id, 'write-content-piece', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    const body: WriteContentRequest = await req.json();
    const { contentPieceId, projectId } = body;

    let contentData = body;

    // If contentPieceId provided, fetch from database
    if (contentPieceId) {
      const { data: piece, error: pieceError } = await supabaseClient
        .from('content_pieces')
        .select('*')
        .eq('id', contentPieceId)
        .single();

      if (pieceError) throw pieceError;

      contentData = {
        ...contentData,
        title: piece.title,
        type: piece.type,
        keywords: piece.keywords,
        outline: piece.outline,
      };
    }

    if (!contentData.title || !contentData.type) {
      return new Response(
        JSON.stringify({ error: 'Missing title or type' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log(`✍️ Writing ${contentData.type}: ${contentData.title}`);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    // Write content based on type
    const content = await writeContent(anthropic, contentData as ContentData);

    // Save draft to database
    if (contentPieceId) {
      await supabaseClient
        .from('content_pieces')
        .update({
          ai_draft: content.text,
          status: 'draft',
        })
        .eq('id', contentPieceId);
    }

    const executionTimeMs = Date.now() - startTime;

    await logAICall({
      supabaseClient,
      projectId,
      userId: undefined,
      functionName: 'write-content-piece',
      inputData: { title: contentData.title, type: contentData.type },
      outputData: { text: content.text, wordCount: content.wordCount },
      success: true,
      executionTimeMs,
      tokensUsed: content.tokensUsed,
      modelUsed: 'claude-3-5-sonnet-20241022',
    });

    console.log(`✅ Content written in ${executionTimeMs}ms (${content.wordCount} words)`);

    return new Response(
      JSON.stringify({
        success: true,
        content: content.text,
        wordCount: content.wordCount,
        readingTime: Math.ceil(content.wordCount / 200), // minutes
      }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('❌ Error writing content:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write content',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});

/**
 * Write content using AI
 */
interface ContentData {
  title?: string;
  type?: string;
  keywords?: string[];
  outline?: string[];
  targetCustomer?: string;
  businessContext?: string;
}

async function writeContent(
  anthropic: Anthropic,
  data: ContentData
): Promise<{ text: string; wordCount: number; tokensUsed: number }> {
  const { title, type, keywords, outline, targetCustomer, businessContext } = data;

  let prompt = '';

  if (type === 'blog_post') {
    prompt = `Eres un content writer experto en SEO y storytelling. Escribe un blog post COMPLETO.

TÍTULO: ${title}

KEYWORDS: ${(keywords || []).join(', ')}

OUTLINE SUGERIDO:
${(outline || []).map((section: string, i: number) => `${i + 1}. ${section}`).join('\n')}

TARGET READER: ${targetCustomer || 'Startup founders'}

BUSINESS CONTEXT: ${businessContext || 'N/A'}

REQUIREMENTS:
- 800-1200 palabras
- Tono: conversational pero professional
- Incluye ejemplos concretos con números
- Secciones claras con H2/H3
- Intro que enganche (pain point → promise)
- Conclusión con clear CTA
- SEO-optimized (keywords naturalmente integradas)
- Formato markdown

ESTÁNDARES DE CALIDAD:

✅ BUENO:
- "In 2024, 73% of SaaS startups fail within their first year (CB Insights). The #1 reason? Building products nobody wants. Here's how to avoid becoming a statistic..."
- Ejemplos específicos: "When I launched [Product], I made 50 cold calls in my first week. 47 said no. But the 3 who said yes? They became my first paying customers and provided feedback that shaped the product."

❌ MALO:
- "Validation is important for startups."
- "You should talk to customers."
- Genericidades sin números ni ejemplos

Estructura recomendada:

# ${title}

[Hook inicial - pain point visceral]

## [Section 1 from outline]
[Content...]

## [Section 2 from outline]
[Content...]

[Etc.]

## Conclusion
[Recap + clear CTA]

Escribe el artículo COMPLETO ahora (no outlines, el texto final listo para publicar):`;
  } else if (type === 'twitter_thread') {
    prompt = `Escribe un Twitter thread viral sobre: ${title}

TARGET AUDIENCE: ${targetCustomer || 'Startup founders'}

KEYWORDS: ${(keywords || []).join(', ')}

REQUIREMENTS:
- 8-12 tweets
- Primer tweet: hook que para scroll
- Cada tweet: 1 idea clara, max 280 chars
- Incluye números y datos específicos
- Último tweet: CTA
- Formato:
  1/ [Tweet]
  2/ [Tweet]
  etc.

EJEMPLOS DE HOOKS:

✅ GOOD:
"I spent $50K on ads before learning this simple truth about customer acquisition. Thread 🧵"
"73% of SaaS startups die in Year 1. Here's the playbook the 27% use to survive (saved me $100K) 👇"

❌ BAD:
"Here are some tips for startups"
"Thread about marketing"

Escribe el thread COMPLETO:`;
  } else if (type === 'linkedin_post') {
    prompt = `Escribe un LinkedIn post thought leadership sobre: ${title}

TARGET AUDIENCE: ${targetCustomer || 'Startup founders and VCs'}

REQUIREMENTS:
- 150-300 palabras
- Tono: thought leadership pero accesible
- Incluye un hook fuerte (primera línea)
- Personal story o insight único
- Datos/números que respalden
- Clear CTA al final

ESTRUCTURA:

[Hook - primera línea que para scroll]

[Story o context]

[Insight/learning con datos]

[Actionable takeaway]

[CTA]

Escribe el post COMPLETO:`;
  } else if (type === 'video_script') {
    prompt = `Escribe un script de video para: ${title}

TARGET AUDIENCE: ${targetCustomer || 'Startup founders'}

DURACIÓN: 3-5 minutos

ESTRUCTURA:
[INTRO - 0:00-0:15]
[Hook visual + promise]

[SETUP - 0:15-0:45]
[Context/problem]

[MAIN CONTENT - 0:45-3:00]
[3-5 puntos clave con ejemplos]

[CONCLUSION - 3:00-3:30]
[Recap + CTA]

REQUIREMENTS:
- Casual, conversational tone
- Visual cues [mostrar pantalla], [B-roll de...]
- Ritmo rápido (no dead air)
- Ejemplos concretos
- Clear CTA

Escribe el script COMPLETO con timecodes:`;
  }

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: type === 'blog_post' ? 4000 : type === 'twitter_thread' ? 2000 : 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;
  const wordCount = text.split(/\s+/).length;

  return { text, wordCount, tokensUsed };
}
