/**
 * EXTRACT BUSINESS INFO EDGE FUNCTION
 *
 * Extrae información de una URL usando web scraping + IA
 * Para pre-rellenar el onboarding del proyecto
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';

interface RequestBody {
  url: string;
  project_phase: 'idea' | 'problema_validado' | 'solucion_validada' | 'mvp' | 'traccion' | 'crecimiento';
  context_type: 'own_business' | 'competitor' | 'reference';
}

interface BusinessInfo {
  nombre_sugerido?: string;
  descripcion?: string;
  industria?: string;
  problema_detectado?: string;
  solucion_propuesta?: string;
  publico_objetivo?: string;
  propuesta_valor?: string;
  canales_distribucion?: string[];
  competidores?: string[];
  tecnologias?: string[];
  modelo_negocio?: string;
  fase_sugerida?: string;
  insights?: string[];
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
    // CORS headers
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    const { user } = await validateAuth(req);
    const rateLimitResult = await checkRateLimit(user.id, 'extract-business-info', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }
    const { url, project_phase, context_type }: RequestBody = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    // Validar URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // 1. Fetch webpage content
    console.log(`Fetching content from: ${url}`);

    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NovaHub/1.0; +https://novahub.com)',
      },
      redirect: 'follow',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch URL: ${fetchResponse.status}`);
    }

    const html = await fetchResponse.text();

    // 2. Extract basic info from HTML
    const extractText = (regex: RegExp, defaultValue = ''): string => {
      const match = html.match(regex);
      return match ? match[1].replace(/<[^>]*>/g, '').trim() : defaultValue;
    };

    const title = extractText(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescription = extractText(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogDescription = extractText(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const h1 = extractText(/<h1[^>]*>([^<]+)<\/h1>/i);

    // Extract all text content (simplified)
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 3000); // Limit to 3000 chars

    // 3. Use Claude AI to analyze content
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      // Fallback: Return basic extraction without AI
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            nombre_sugerido: title,
            descripcion: metaDescription || ogDescription,
            insights: ['Información extraída sin IA. Configura ANTHROPIC_API_KEY para análisis completo.'],
          },
          ai_used: false,
        }),
        {
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
          status: 200,
        }
      );
    }

    const prompt = buildPrompt(project_phase, context_type, {
      url: parsedUrl.hostname,
      title,
      description: metaDescription || ogDescription,
      h1,
      bodyText,
    });

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
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
    const aiContent = aiData.content[0].text;

    // Parse AI response (should be JSON)
    let businessInfo: BusinessInfo;
    try {
      businessInfo = JSON.parse(aiContent);
    } catch {
      // If AI didn't return valid JSON, create structured response
      businessInfo = {
        nombre_sugerido: title,
        descripcion: metaDescription || ogDescription,
        insights: [aiContent],
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: businessInfo,
        ai_used: true,
        source_url: url,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );

  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error extracting business info:', error);

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

function buildPrompt(
  phase: string,
  contextType: string,
  webData: {
    url: string;
    title: string;
    description: string;
    h1: string;
    bodyText: string;
  }
): string {
  const contextInstructions = {
    own_business: 'El usuario está describiendo SU PROPIO negocio/proyecto.',
    competitor: 'El usuario está mostrando un COMPETIDOR para analizar y diferenciarse.',
    reference: 'El usuario está mostrando un negocio REFERENTE como inspiración.',
  };

  const phaseInstructions = {
    idea: 'El proyecto está en fase de IDEA. Extrae el problema que resuelven y cómo lo hacen.',
    problema_validado: 'Han validado el problema. Enfócate en la solución que proponen.',
    solucion_validada: 'Tienen solución validada. Analiza el modelo de negocio y estrategia.',
    mvp: 'Tienen un MVP. Analiza funcionalidades, tech stack y propuesta de valor.',
    traccion: 'Tienen tracción. Analiza métricas, casos de uso y escalabilidad.',
    crecimiento: 'Están en crecimiento. Analiza estrategia de expansión y mercado.',
  };

  return `Analiza esta página web y extrae información para pre-rellenar un onboarding de proyecto.

CONTEXTO:
- ${contextInstructions[contextType as keyof typeof contextInstructions] || contextInstructions.own_business}
- Fase del proyecto del usuario: ${phaseInstructions[phase as keyof typeof phaseInstructions] || phaseInstructions.idea}

DATOS DE LA WEB:
URL: ${webData.url}
Título: ${webData.title}
Descripción: ${webData.description}
H1: ${webData.h1}
Contenido: ${webData.bodyText}

INSTRUCCIONES:
Devuelve un JSON con la siguiente estructura (omite campos si no tienes suficiente info):

{
  "nombre_sugerido": "Nombre del negocio/proyecto",
  "descripcion": "Descripción clara en 2-3 frases",
  "industria": "Industria o sector (ej: SaaS, E-commerce, FinTech)",
  "problema_detectado": "¿Qué problema resuelven?",
  "solucion_propuesta": "¿Cómo lo resuelven?",
  "publico_objetivo": "¿A quién va dirigido?",
  "propuesta_valor": "Propuesta de valor única",
  "canales_distribucion": ["canal1", "canal2"],
  "competidores": ["competidor1", "competidor2"],
  "tecnologias": ["React", "Python", etc],
  "modelo_negocio": "SaaS/Marketplace/etc",
  "fase_sugerida": "mvp|traccion|crecimiento",
  "insights": [
    "Insight clave 1",
    "Insight clave 2"
  ]
}

IMPORTANTE:
- Devuelve SOLO el JSON, sin markdown ni texto adicional
- Sé conciso pero preciso
- Si es un competidor/referente, sugiere cómo diferenciarse en "insights"
- Si no encuentras info para un campo, no lo incluyas`;
}
