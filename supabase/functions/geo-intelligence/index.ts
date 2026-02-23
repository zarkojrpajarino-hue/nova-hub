/**
 * GEO-INTELLIGENCE (CAPA 1)
 *
 * Obtiene datos locales basados en la ubicación del founder:
 * - Competidores locales
 * - Inversores en la zona
 * - Costos operativos
 * - Regulaciones
 * - Eventos y aceleradoras
 * - Grants disponibles
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';


interface GeoIntelRequest {
  city: string;
  country: string;
  industry?: string;
  business_type?: string;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const { city, country, industry, business_type }: GeoIntelRequest = await req.json();

        const { serviceClient: supabaseClient } = await validateAuth(req);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    const locationKey = `${city.toLowerCase()}_${country.toLowerCase()}`.replace(/\s+/g, '_');

    // Check cache first
    const { data: cached } = await supabaseClient
      .from('geo_intelligence_cache')
      .select('*')
      .eq('location_key', locationKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('✅ Cache hit for', locationKey);
      return new Response(JSON.stringify({ success: true, data: cached, from_cache: true }), {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    console.log('🔍 Generating geo intelligence for', city, country);

    // Generate with AI (simulating API calls with comprehensive knowledge)
    const geoData = await generateGeoIntelligence(anthropic, city, country, industry, business_type);

    // Save to cache
    const { data: savedCache } = await supabaseClient
      .from('geo_intelligence_cache')
      .upsert({
        location_key: locationKey,
        ...geoData,
        last_updated: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        data: savedCache,
        from_cache: false,
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

async function generateGeoIntelligence(
  anthropic: Anthropic,
  city: string,
  country: string,
  industry?: string,
  businessType?: string
) {
  const prompt = `Eres un experto en ecosistemas de startups y análisis de mercado local.

UBICACIÓN: ${city}, ${country}
INDUSTRIA: ${industry || 'General/Tech'}
TIPO DE NEGOCIO: ${businessType || 'Startup'}

Genera un análisis GEO-INTELLIGENCE completo y ULTRA ESPECÍFICO para esta ubicación.

IMPORTANTE:
- Usa datos REALES y actuales (2024-2026)
- Sé ESPECÍFICO, no genérico
- Incluye nombres reales de empresas, inversores, aceleradoras
- Da números concretos (salarios, costos, market size)

Devuelve un JSON con esta estructura:

{
  "local_competitors": [
    {
      "name": "Nombre empresa",
      "description": "Qué hace",
      "size": "employees/revenue",
      "funding": "Series A, €10M raised",
      "url": "https://..."
    }
  ],

  "local_investors": [
    {
      "name": "Nombre VC/Angel",
      "type": "VC" | "Angel" | "Accelerator",
      "fund_size": "€100M",
      "notable_investments": ["Company A", "Company B"],
      "focus_areas": ["B2B SaaS", "FinTech"],
      "contact": "info o URL"
    }
  ],

  "operational_costs": {
    "dev_salary_min": 40000,
    "dev_salary_max": 70000,
    "marketing_salary_min": 30000,
    "marketing_salary_max": 50000,
    "sales_salary_min": 35000,
    "sales_salary_max": 55000,
    "coworking_monthly": 300,
    "office_sqm_monthly": 20,
    "currency": "EUR" | "USD"
  },

  "regulations": [
    {
      "title": "Regulación importante",
      "description": "Qué significa",
      "impact": "critical" | "important" | "minor",
      "deadline": "2024-12-31" (si aplica)
    }
  ],

  "local_events": [
    {
      "name": "Nombre evento",
      "type": "conference" | "meetup" | "hackathon",
      "frequency": "monthly" | "quarterly" | "annual",
      "url": "https://..."
    }
  ],

  "accelerators": [
    {
      "name": "Nombre aceleradora",
      "ticket_size": "€50K equity-free",
      "duration": "3 months",
      "focus": "Early stage B2B",
      "application_url": "https://..."
    }
  ],

  "grants": [
    {
      "name": "Nombre grant",
      "amount": "up to €200K",
      "type": "non-dilutive" | "loan" | "equity",
      "eligibility": "Startups <2 años",
      "url": "https://..."
    }
  ],

  "market_size": {
    "population": 1600000,
    "gdp_per_capita": 35000,
    "startup_ecosystem_rank": 15,
    "description": "Breve descripción del mercado local"
  },

  "cost_of_living": 75,

  "insights": [
    "Insight específico sobre oportunidades en esta ciudad",
    "Otro insight relevante",
    "Recomendación accionable"
  ]
}

EJEMPLOS DE BUENOS INSIGHTS:
✅ "${city} tiene 3 unicornios tech (Glovo, TravelPerk, Typeform) - fuerte ecosistema de talento disponible"
✅ "El gobierno ofrece tax breaks del 50% para startups tech primeros 2 años"
✅ "Competencia en ${industry} es baja vs Madrid/Barcelona - oportunidad"

EJEMPLOS MALOS:
❌ "Es una ciudad grande"
❌ "Hay oportunidades"
❌ "Considera el mercado local"

Devuelve SOLO el JSON, sin explicaciones adicionales.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse geo intelligence response');
  }

  return JSON.parse(jsonMatch[0]);
}
