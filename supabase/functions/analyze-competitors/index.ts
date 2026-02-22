/**
 * ANALYZE COMPETITORS - Edge Function
 *
 * Analiza competidores en una industria específica
 *
 * Input:
 * - startupUrl: URL del startup del usuario (para entender su propuesta)
 * - industry: Industria/sector (opcional, se puede inferir)
 *
 * Output:
 * - competitors: Array de competidores con análisis detallado
 * - marketGaps: Oportunidades de diferenciación
 * - positioningRecommendations: Recomendaciones estratégicas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface RequestBody {
  startupUrl: string;
  industry?: string;
}

interface Competitor {
  name: string;
  url: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  pricing: string;
  targetAudience: string;
  differentiationOpportunities: string[];
}

interface AnalysisResult {
  competitors: Competitor[];
  marketGaps: string[];
  positioningRecommendations: string[];
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const { startupUrl, industry }: RequestBody = await req.json();

    if (!startupUrl) {
      throw new Error('startupUrl is required');
    }

    console.log('Analyzing competitors for:', startupUrl);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // 1. Fetch user's startup info
    let userStartupContext = '';
    try {
      const response = await fetch(startupUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OptimusK/1.0)',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        const html = await response.text();

        // Extract basic info
        const extractText = (regex: RegExp, defaultValue = ''): string => {
          const match = html.match(regex);
          return match ? match[1].replace(/<[^>]*>/g, '').trim() : defaultValue;
        };

        const title = extractText(/<title[^>]*>([^<]+)<\/title>/i);
        const metaDescription = extractText(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const h1 = extractText(/<h1[^>]*>([^<]+)<\/h1>/i);

        userStartupContext = `
Website: ${startupUrl}
Title: ${title}
Description: ${metaDescription}
H1: ${h1}
`;
      }
    } catch (error) {
      console.warn('Could not fetch startup URL:', error);
      userStartupContext = `Website: ${startupUrl} (no se pudo acceder)`;
    }

    // 2. Use Claude to find and analyze competitors
    const prompt = `Eres un analista de mercado experto con 10+ años de experiencia en análisis competitivo. Analiza competidores para este startup:

${userStartupContext}
${industry ? `Industria: ${industry}` : ''}

CONTEXTO CRÍTICO:
Este análisis será usado por un emprendedor para:
1. Identificar oportunidades de diferenciación REALES
2. Entender el landscape competitivo actual
3. Tomar decisiones estratégicas de posicionamiento y pricing

TAREA:
1. Identifica 5-7 competidores directos que operan actualmente (2024-2026):
   - Prioriza startups y empresas que sean directamente comparables
   - Incluye al menos 1-2 competidores emergentes (no solo los gigantes)
   - Menciona al menos 1 competidor internacional si es relevante

2. Para CADA competidor, analiza en profundidad:
   - Nombre y URL real (búscalo si no lo conoces)
   - Qué hacen en 2 frases (no genérico, específico)
   - 3 fortalezas CONCRETAS (ej: "UX excepcional con onboarding de 2 minutos", NO "buena UX")
   - 3 debilidades ESPECÍFICAS (ej: "Pricing 40% más caro que el mercado", NO "pricing alto")
   - Pricing real con cifras (ej: "$49/mes tier Pro, $199/mes Enterprise")
   - Target específico (ej: "Equipos remotos 10-50 personas en tech", NO "PyMEs")
   - 2 oportunidades ACCIONABLES de diferenciación

3. Identifica 3-5 gaps del mercado que NADIE está resolviendo bien

4. Da 3-4 recomendaciones de posicionamiento ULTRA específicas:
   - NO digas "diferénciate por precio" → DI "Posiciónate 30% más barato apuntando a startups pre-seed"
   - NO digas "mejor UX" → DI "Enfócate en onboarding automático vs competidores que requieren setup manual"

ESTÁNDARES DE CALIDAD:
❌ MAL: "Competitor X es líder del mercado con buena reputación"
✅ BIEN: "Competitor X tiene 50K usuarios, $5M ARR, pero usuarios se quejan de complejidad (4.2★ en G2)"

❌ MAL: "Oportunidad: mejor servicio al cliente"
✅ BIEN: "Gap: Ningún competidor ofrece soporte en español para LATAM, mercado de $2B sin atender"

FORMATO DE RESPUESTA (JSON):
{
  "competitors": [
    {
      "name": "Nombre del competidor",
      "url": "https://competitor.com o N/A",
      "description": "Qué hacen en 1-2 frases",
      "strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
      "weaknesses": ["Debilidad 1", "Debilidad 2", "Debilidad 3"],
      "pricing": "Freemium desde $29/mes" o "N/A",
      "targetAudience": "A quién se dirigen",
      "differentiationOpportunities": ["Oportunidad 1", "Oportunidad 2"]
    }
  ],
  "marketGaps": [
    "Gap 1 del mercado",
    "Gap 2 del mercado",
    "Gap 3 del mercado"
  ],
  "positioningRecommendations": [
    "Recomendación 1",
    "Recomendación 2",
    "Recomendación 3"
  ]
}

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
        temperature: 0.7,
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
    } catch (e) {
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
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error analyzing competitors:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
