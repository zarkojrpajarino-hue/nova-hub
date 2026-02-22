/**
 * GENERATE BUSINESS OPTIONS (ONBOARDING GENERATIVO - CAPA 2)
 *
 * Genera 3 opciones de negocio personalizadas basadas en:
 * - Background del founder
 * - Skills
 * - Constraints (capital, tiempo, ubicación)
 * - Preferencias
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateOptionsRequest {
  project_id: string;
  founder_profile: {
    background: string; // 'corporate', 'freelancer', 'student', 'serial_entrepreneur'
    skills: string[];
    experience_years?: number;
    industries_of_interest: string[];
  };
  constraints: {
    available_capital: number; // en EUR/USD
    time_availability: string; // 'full_time', 'part_time', 'weekends'
    must_be_remote: boolean;
  };
  preferences: {
    goal: string; // 'passive_income', 'scalable_business', 'quick_revenue', 'impact'
    risk_tolerance: string; // 'low', 'medium', 'high'
  };
  location: {
    city: string;
    country: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: GenerateOptionsRequest = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    console.log('🚀 Generating business options for project:', requestData.project_id);

    // Get geo intelligence for location
    const locationKey = `${requestData.location.city.toLowerCase()}_${requestData.location.country.toLowerCase()}`.replace(
      /\s+/g,
      '_'
    );

    const { data: geoData } = await supabaseClient
      .from('geo_intelligence_cache')
      .select('*')
      .eq('location_key', locationKey)
      .single();

    // Generate business options with AI
    const options = await generateOptions(anthropic, requestData, geoData as GeoDataRecord | null);

    // Save to database
    const { data: saved } = await supabaseClient
      .from('generated_business_options')
      .insert({
        project_id: requestData.project_id,
        options,
        founder_profile: requestData.founder_profile,
        constraints: requestData.constraints,
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        data: saved,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

interface GeoDataRecord {
  operational_costs?: { dev_salary_min?: number; dev_salary_max?: number };
  cost_of_living?: number;
  market_size?: { description?: string };
  insights?: string[];
}

async function generateOptions(anthropic: Anthropic, request: GenerateOptionsRequest, geoData: GeoDataRecord | null) {
  const prompt = `Eres un experto en generación de ideas de negocio personalizadas.

PERFIL DEL FOUNDER:
- Background: ${request.founder_profile.background}
- Skills: ${request.founder_profile.skills.join(', ')}
- Experiencia: ${request.founder_profile.experience_years || 0} años
- Industrias de interés: ${request.founder_profile.industries_of_interest.join(', ')}

CONSTRAINTS:
- Capital disponible: €${request.constraints.available_capital}
- Disponibilidad: ${request.constraints.time_availability}
- ¿Debe ser remoto?: ${request.constraints.must_be_remote ? 'Sí' : 'No'}

PREFERENCIAS:
- Objetivo: ${request.preferences.goal}
- Tolerancia al riesgo: ${request.preferences.risk_tolerance}

UBICACIÓN:
- ${request.location.city}, ${request.location.country}

${
  geoData
    ? `
DATOS LOCALES:
- Costos operativos: Dev €${geoData.operational_costs?.dev_salary_min}-${geoData.operational_costs?.dev_salary_max}/año
- Cost of living index: ${geoData.cost_of_living}
- Ecosistema: ${geoData.market_size?.description || 'N/A'}
- Oportunidades detectadas: ${geoData.insights?.slice(0, 2).join('; ')}
`
    : ''
}

TAREA:
Genera 3 opciones de negocio ESPECÍFICAS y VIABLES para este founder.

REGLAS CRÍTICAS:
1. **Alineadas con sus skills** - No sugieras SaaS a quien no programa
2. **Dentro de su presupuesto** - Inversión inicial ≤ capital disponible
3. **Compatibles con su tiempo** - Part-time = no requiere equipo grande
4. **Específicas, no genéricas** - "SaaS de X para Y" NO "Crear un SaaS"
5. **Oportunidades reales** - Basadas en mercado actual, no fantasías
6. **Scores justificados** - Fit score basado en match con perfil

EJEMPLOS BUENOS:
✅ "Micro-SaaS de facturación electrónica para PYMEs españolas (nueva regulación 2024)"
✅ "Newsletter de fintech para CFOs, monetizada con sponsors B2B (€500/mo por sponsor)"
✅ "Marketplace de freelance developers españoles para empresas LATAM (timezone advantage)"

EJEMPLOS MALOS:
❌ "Crear un SaaS" (muy genérico)
❌ "E-commerce de productos varios" (sin nicho)
❌ "Consultora" (demasiado obvio y genérico)

Para CADA opción, incluye:
- Roadmap de implementación (fases con timeline real)
- Proyecciones financieras (inversión, breakeven, revenue año 1)
- Pros y contras honestos

Devuelve JSON:
{
  "options": [
    {
      "title": "Título específico del negocio",
      "description": "Descripción de 2-3 frases explicando el negocio",
      "fit_score": 95,
      "reasoning": "Por qué es perfecto para este founder (3-4 bullets específicos)",

      "business_model": {
        "type": "saas" | "ecommerce" | "marketplace" | "service" | "content",
        "target_customer": "Descripción específica",
        "value_proposition": "Qué problema resuelve",
        "revenue_model": "Cómo monetiza"
      },

      "pros": [
        "Pro específico 1",
        "Pro específico 2",
        "Pro específico 3"
      ],

      "cons": [
        "Contra honesto 1",
        "Contra honesto 2"
      ],

      "financial_projections": {
        "initial_investment": 2000,
        "monthly_costs": 500,
        "breakeven_months": 6,
        "year_1_revenue": 50000,
        "year_1_profit": 20000,
        "scalability": "high" | "medium" | "low"
      },

      "implementation_roadmap": [
        {
          "phase": "MVP",
          "duration_weeks": 4,
          "key_tasks": ["Tarea 1", "Tarea 2", "Tarea 3"],
          "deliverable": "Qué se logra"
        },
        {
          "phase": "Validation",
          "duration_weeks": 6,
          "key_tasks": ["Tarea 1", "Tarea 2"],
          "deliverable": "Qué se logra"
        },
        {
          "phase": "Launch & Scale",
          "duration_weeks": 12,
          "key_tasks": ["Tarea 1", "Tarea 2"],
          "deliverable": "Qué se logra"
        }
      ],

      "competitive_landscape": {
        "main_competitors": ["Competidor 1", "Competidor 2"],
        "your_differentiation": "Cómo te diferencias"
      },

      "risks": [
        {
          "risk": "Descripción del riesgo",
          "severity": "high" | "medium" | "low",
          "mitigation": "Cómo mitigarlo"
        }
      ],

      "first_steps": [
        "Paso accionable 1 (próximos 7 días)",
        "Paso accionable 2",
        "Paso accionable 3"
      ]
    }
  ],

  "comparison_matrix": {
    "headers": ["Opción 1", "Opción 2", "Opción 3"],
    "rows": [
      {
        "metric": "Inversión inicial",
        "values": ["€2K", "€500", "€0"]
      },
      {
        "metric": "Time to first €",
        "values": ["90 días", "30 días", "7 días"]
      },
      {
        "metric": "Escalabilidad",
        "values": ["⭐⭐⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐"]
      },
      {
        "metric": "Riesgo",
        "values": ["Medio", "Bajo", "Bajo"]
      },
      {
        "metric": "Revenue año 1",
        "values": ["€50K", "€20K", "€60K"]
      }
    ]
  },

  "recommendation": {
    "primary_choice": 0,
    "reasoning": "Explicación de por qué esta es la mejor opción",
    "alternative_strategy": "Si quieres minimizar riesgo, empieza con opción 3 para generar cash flow, luego invierte en opción 1"
  }
}

Sé ULTRA específico y basado en DATOS REALES del mercado 2024-2026.
Devuelve SOLO el JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse business options response');
  }

  return JSON.parse(jsonMatch[0]);
}
