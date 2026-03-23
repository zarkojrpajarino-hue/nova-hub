/**
 * ANALYZE COMPETITOR URLS - Edge Function
 *
 * Analiza visualmente URLs de competidores proporcionadas por el usuario
 *
 * Input:
 * - urls: Array de URLs de competidores
 * - myIdea: Descripción de la idea del usuario (para comparación)
 *
 * Output:
 * - competitors: Array con análisis detallado de cada competidor
 * - differentiationStrategies: Estrategias para diferenciarse
 * - pricingInsights: Insights sobre pricing del mercado
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';

interface RequestBody {
  urls: string[];
  myIdea: string;
}

interface CompetitorAnalysis {
  url: string;
  name: string;
  mainFeatures: string[];
  pricing: { plan: string; price: string }[];
  strengths: string[];
  weaknesses: string[];
}

interface AnalysisResult {
  competitors: CompetitorAnalysis[];
  differentiationStrategies: string[];
  pricingInsights: string;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
    // CORS headers
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    await validateAuth(req);
    const { urls, myIdea }: RequestBody = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new Error('urls array is required and must not be empty');
    }

    if (urls.length > 10) {
      throw new Error('Maximum 10 URLs allowed');
    }

    console.log(`Analyzing ${urls.length} competitor URLs`);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Fetch content from each URL
    const competitorContents: { url: string; content: string }[] = [];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; OptimusK/1.0)',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(10000), // 10s timeout per URL
        });

        if (!response.ok) {
          console.warn(`Failed to fetch ${url}: ${response.status}`);
          competitorContents.push({
            url,
            content: `Error: Could not access (${response.status})`,
          });
          continue;
        }

        const html = await response.text();

        // Extract useful info from HTML
        const extractText = (regex: RegExp, defaultValue = ''): string => {
          const match = html.match(regex);
          return match ? match[1].replace(/<[^>]*>/g, '').trim() : defaultValue;
        };

        const title = extractText(/<title[^>]*>([^<]+)<\/title>/i);
        const metaDescription = extractText(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const h1 = extractText(/<h1[^>]*>([^<]+)<\/h1>/i);

        // Extract some body text (simplified)
        const bodyText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .substring(0, 2000);

        const content = `
URL: ${url}
Título: ${title}
Descripción: ${metaDescription}
H1: ${h1}
Contenido destacado: ${bodyText}
`;

        competitorContents.push({ url, content });

      } catch (error) {
            if (error instanceof Response) return error;
console.error(`Error fetching ${url}:`, error);
        competitorContents.push({
          url,
          content: `Error: ${error.message}`,
        });
      }
    }

    // Use Claude to analyze all competitors
    const competitorsText = competitorContents
      .map((c, i) => `\n=== COMPETIDOR ${i + 1} ===\n${c.content}`)
      .join('\n\n');

    const prompt = `Eres un analista competitivo senior. Tu cliente es un emprendedor que necesita entender el mercado para posicionarse estratégicamente.

MI IDEA DE NEGOCIO:
${myIdea}

COMPETIDORES A ANALIZAR:
${competitorsText}

CONTEXTO CRÍTICO:
Este análisis determinará:
1. Cómo el emprendedor se diferencia
2. Qué pricing establecer
3. Qué features priorizar en el MVP

TU TAREA - 3 SECCIONES:

═══════════════════════════════════
SECCIÓN 1: ANÁLISIS POR COMPETIDOR
═══════════════════════════════════

Para CADA competidor extraído:

1. NOMBRE (desde título/URL)
   - Si no cargó: indicar "URL inaccesible"

2. FEATURES PRINCIPALES (3-5):
   - NO genérico: "Gestión de proyectos" ❌
   - SÍ específico: "Kanban boards con límites WIP automáticos" ✅
   - Enfócate en features diferenciadores, no básicos

3. PRICING (extraer de web):
   - Formato: [{plan: "Free", price: "$0"}, {plan: "Pro", price: "$29/mes"}]
   - Si no visible: indicar "No visible en web"
   - Incluir límites de cada plan si están

4. STRENGTHS (2-3):
   - Basado en lo visto en la web
   - Ej: "UI minimalista con curva aprendizaje <30min vs competidores complejos"

5. WEAKNESSES (2-3):
   - Gaps visibles en features
   - Quejas/limitaciones evidentes
   - Ej: "No tiene app móvil, solo web"

═══════════════════════════════════
SECCIÓN 2: ESTRATEGIAS DE DIFERENCIACIÓN
═══════════════════════════════════

Proporciona 3-5 estrategias ACCIONABLES:

❌ MAL: "Ofrece mejor UX"
✅ BIEN: "Todos requieren 5+ pasos de onboarding. Hazlo en 1 paso con IA que auto-configura basándose en industria"

❌ MAL: "Mejora el soporte"
✅ BIEN: "Ninguno ofrece chat en vivo. Añade Intercom con respuesta <1min para startups (<$100k ARR) como ventaja clave"

Enfoque:
- ¿Qué hace TODOS los competidores? → Hacer lo opuesto puede ser oro
- ¿Qué feature falta en TODOS? → Oportunidad única
- ¿Qué segmento ignoran TODOS? → Nicho desatendido

═══════════════════════════════════
SECCIÓN 3: PRICING INSIGHTS
═══════════════════════════════════

Proporciona UN párrafo (150-200 palabras) con:
1. Rango de precios del mercado (min-max)
2. Patrón dominante (freemium vs pago directo vs enterprise-only)
3. Recomendación específica de pricing:
   - Cifra exacta sugerida
   - Estructura de planes
   - Justificación basada en competencia

Ejemplo de insight premium:
"El mercado cobra $25-99/mes (rango de 4x). Patrón dominante: freemium con límite agresivo en plan gratuito (ej: 3 proyectos). RECOMENDACIÓN: Posiciónate en $39/mes (52% del rango) con plan gratuito MÁS generoso (10 proyectos vs 3 competidores). Esto te da margen para crecer precios luego Y captura early adopters sensibles a precio. Añade tier Enterprise $199/mes con white-label + SSO para capturar 5-10% de usuarios que escalaron."

FORMATO DE RESPUESTA (JSON):
{
  "competitors": [
    {
      "url": "https://...",
      "name": "Nombre del competidor",
      "mainFeatures": ["Feature 1", "Feature 2", "Feature 3"],
      "pricing": [
        { "plan": "Free", "price": "$0" },
        { "plan": "Pro", "price": "$29/mes" }
      ],
      "strengths": ["Fortaleza 1", "Fortaleza 2"],
      "weaknesses": ["Debilidad 1", "Debilidad 2"]
    }
  ],
  "differentiationStrategies": [
    "Estrategia accionable 1",
    "Estrategia accionable 2",
    "Estrategia accionable 3"
  ],
  "pricingInsights": "Análisis del pricing del mercado y recomendación para el usuario (2-3 frases)"
}

Si no pudiste acceder a una URL, incluye el competitor con:
"mainFeatures": ["No se pudo acceder"],
"pricing": [],
"strengths": [],
"weaknesses": ["URL inaccesible"]

Devuelve SOLO el JSON, sin markdown.`;

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.6,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.content[0].text;

    // Parse response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let analysis: AnalysisResult;

    try {
      analysis = JSON.parse(cleanContent);

      // Validate structure
      if (!analysis.competitors || !Array.isArray(analysis.competitors)) {
        throw new Error('Invalid response structure');
      }

    } catch (e) {
          if (error instanceof Response) return error;
console.error('Parse error:', e);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...analysis,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );

  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error analyzing competitor URLs:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});
