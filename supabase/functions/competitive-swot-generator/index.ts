/**
 * COMPETITIVE SWOT GENERATOR (ONBOARDING IDEA - CAPA 4)
 *
 * Genera análisis competitivo SWOT personalizado para una idea específica:
 * - Identifica competidores directos e indirectos
 * - SWOT analysis profundo
 * - Market gaps
 * - Estrategia de diferenciación
 * - Go-to-market recomendado
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';


interface CompetitiveAnalysisRequest {
  project_id: string;
  idea: {
    description: string;
    target_customer: string;
    problem_solved: string;
    solution: string;
  };
  business_type: string;
  location: {
    city: string;
    country: string;
  };
  target_market: string; // 'local', 'national', 'regional', 'global'
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const requestData: CompetitiveAnalysisRequest = await req.json();

        const { user, serviceClient: supabaseClient } = await validateAuth(req);

    const rateLimitResult = await checkRateLimit(user.id, 'competitive-swot-generator', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    console.log('🎯 Generating competitive SWOT for:', requestData.idea.description);

    // Get geo intelligence if available
    const locationKey = `${requestData.location.city.toLowerCase()}_${requestData.location.country.toLowerCase()}`.replace(
      /\s+/g,
      '_'
    );

    const { data: geoData } = await supabaseClient
      .from('geo_intelligence_cache')
      .select('*')
      .eq('location_key', locationKey)
      .single();

    // Generate SWOT with AI
    const analysis = await generateCompetitiveSWOT(anthropic, requestData, geoData as GeoDataRecord | null);

    // Save to database
    const { data: saved } = await supabaseClient
      .from('competitive_analysis')
      .upsert({
        project_id: requestData.project_id,
        competitors: analysis.competitors,
        swot: analysis.swot,
        market_gaps: analysis.market_gaps,
        recommended_strategy: analysis.recommended_strategy,
        benchmarks: analysis.benchmarks || {},
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        data: saved,
      }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('❌ Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    });
  }
});

interface GeoDataRecord {
  local_competitors?: Array<{ name: string }>;
  market_size?: { description?: string };
}

async function generateCompetitiveSWOT(
  anthropic: Anthropic,
  request: CompetitiveAnalysisRequest,
  geoData: GeoDataRecord | null
) {
  const prompt = `Eres un experto en análisis competitivo y estrategia de negocio.

TU IDEA:
Descripción: ${request.idea.description}
Cliente objetivo: ${request.idea.target_customer}
Problema que resuelve: ${request.idea.problem_solved}
Solución: ${request.idea.solution}

CONTEXTO:
- Tipo de negocio: ${request.business_type}
- Ubicación: ${request.location.city}, ${request.location.country}
- Mercado objetivo: ${request.target_market}

${
  geoData
    ? `
CONTEXTO LOCAL:
- Competidores locales: ${geoData.local_competitors?.slice(0, 3).map((c) => c.name).join(', ') || 'N/A'}
- Ecosistema: ${geoData.market_size?.description || 'N/A'}
`
    : ''
}

TAREA:
Genera un análisis competitivo PROFUNDO y ACCIONABLE.

REGLAS:
1. Identifica 3-5 competidores REALES (no inventes nombres)
2. Para cada competidor, analiza strengths Y weaknesses ESPECÍFICOS
3. SWOT debe ser HONESTO - incluye tus debilidades reales
4. Market gaps deben ser OPORTUNIDADES REALES, no wishful thinking
5. Estrategia debe ser ACCIONABLE con pasos concretos
6. Pricing y positioning basados en DATOS del mercado

EJEMPLOS BUENOS:
✅ "Notion ($10B valuation) - Strengths: Brand, features, integrations. Weaknesses: Slow, no mobile-first, complejo onboarding (30% churn primeros 7 días)"
✅ "Gap: No existe tool de PM mobile-first. 60% workers usan móvil como primary device pero todas las tools son desktop-first"
✅ "Estrategia: David vs Goliat - enfocarte en nicho (startups <10 personas) donde Notion es overkill"

EJEMPLOS MALOS:
❌ "Competidor X - Strengths: buenos productos. Weaknesses: algunos problemas"
❌ "Gap: mercado grande"
❌ "Estrategia: hacer marketing"

Devuelve JSON:
{
  "competitors": [
    {
      "name": "Nombre competidor",
      "type": "direct" | "indirect" | "substitute",
      "url": "https://...",
      "description": "Qué hace (1 línea)",
      "size": {
        "valuation": "$10B",
        "employees": "1000+",
        "customers": "50M users",
        "revenue": "$100M ARR" (si es público)
      },
      "pricing": {
        "model": "freemium" | "subscription" | "usage_based",
        "price_range": "$0-20/mo",
        "details": "Free + $10/mo Pro"
      },
      "strengths": [
        "Strength específico 1 con impacto",
        "Strength específico 2",
        "Strength específico 3"
      ],
      "weaknesses": [
        "Weakness específico 1 que puedes explotar",
        "Weakness específico 2",
        "Weakness específico 3"
      ],
      "market_position": "Leader" | "Challenger" | "Niche player",
      "threat_level": "high" | "medium" | "low"
    }
  ],

  "swot": {
    "strengths": [
      "Tu strength 1 (REALISTA, basado en lo que describiste)",
      "Tu strength 2",
      "Tu strength 3"
    ],
    "weaknesses": [
      "Tu weakness HONESTA 1 (no bullshit, debilidades reales)",
      "Tu weakness 2",
      "Tu weakness 3"
    ],
    "opportunities": [
      "Oportunidad de mercado 1 (basada en gaps reales)",
      "Oportunidad 2",
      "Oportunidad 3"
    ],
    "threats": [
      "Amenaza realista 1",
      "Amenaza 2",
      "Amenaza 3"
    ]
  },

  "market_gaps": [
    {
      "gap": "Descripción específica del gap",
      "opportunity_score": 85,
      "reasoning": "Por qué es un gap real (con datos)",
      "how_to_exploit": "Cómo puedes aprovecharlo",
      "validation_needed": "Qué debes validar antes de asumir que es real"
    }
  ],

  "competitive_positioning": {
    "your_unique_value": "Qué haces diferente (1-2 frases)",
    "target_segment": "Nicho específico donde puedes ganar",
    "why_customers_will_switch": "Por qué dejarían al incumbente por ti",
    "pricing_strategy": "Cómo deberías pricear vs competidores",
    "barriers_to_entry": [
      "Barrera que protege tu negocio",
      "Otra barrera"
    ]
  },

  "recommended_strategy": {
    "positioning": "Cómo te posicionas (ej: 'El Notion mobile-first para Gen Z')",
    "differentiation": [
      "Diferenciador clave 1",
      "Diferenciador clave 2",
      "Diferenciador clave 3"
    ],
    "go_to_market": {
      "phase_1": {
        "focus": "Qué hacer primero",
        "channels": ["Canal 1", "Canal 2"],
        "timeline": "Primeros 3-6 meses",
        "success_metrics": ["Métrica 1", "Métrica 2"]
      },
      "phase_2": {
        "focus": "Después de PMF",
        "channels": ["Canal 1", "Canal 2"],
        "timeline": "Meses 6-12"
      }
    },
    "david_vs_goliath_tactics": [
      "Táctica específica para competir vs players grandes",
      "Otra táctica"
    ]
  },

  "red_flags": [
    {
      "flag": "Descripción del red flag",
      "severity": "critical" | "important" | "minor",
      "what_to_do": "Acción recomendada"
    }
  ],

  "key_questions_to_validate": [
    "Pregunta crítica 1 que debes responder antes de continuar",
    "Pregunta crítica 2",
    "Pregunta crítica 3"
  ]
}

Sé HONESTO, ESPECÍFICO y ACCIONABLE. Basado en el mercado REAL 2024-2026.
Devuelve SOLO el JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const { safeJsonParse } = await import('../_shared/safe-json-parse.ts');
  const result = safeJsonParse(text);
  if (!result.ok) throw new Error(`Failed to parse competitive SWOT: ${result.error}`);
  return result.data;
}
