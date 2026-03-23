/**
 * GENERATE BUSINESS IDEAS - KILLER FEATURE 🦄
 *
 * Toma a una persona que NO sabe qué emprender y le genera 5-10 ideas
 * de negocio VIABLES y PERSONALIZADAS basadas en:
 * - Sus hobbies e intereses
 * - Su background profesional
 * - Sus recursos (tiempo, dinero, skills)
 * - Sus preferencias (industrias, modelos de negocio)
 * - Su tolerancia al riesgo
 *
 * Input:
 * - user_id: UUID del usuario
 * - interests_id: UUID del registro de user_interests (opcional)
 *
 * Output:
 * - ideas: Array de 5-10 ideas de negocio generadas
 * - cada idea incluye: problema, solución, target, modelo negocio, primeros pasos
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuthWithUserId } from '../_shared/auth.ts';

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    const { user_id, interests_id: _interests_id } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

        const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);

    // 1. Obtener interests del usuario
    const { data: interests } = await supabaseClient
      .from('user_interests')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!interests) {
      throw new Error('User interests not found. Complete onboarding first.');
    }

    // 2. Generar ideas con GPT-4
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    const prompt = buildIdeaGenerationPrompt(interests as UserInterests);

    console.log('Generating business ideas for user:', user_id);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8, // Más creatividad
      }),
    });

    if (!response.ok) {
      throw new Error('AI API error');
    }

    const aiData = await response.json();
    const content = aiData.content?.[0]?.text;

    if (!content) {
      throw new Error('No response from AI');
    }

    // 3. Parse ideas
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsedIdeas;
    try {
      parsedIdeas = JSON.parse(cleanContent);
    } catch (_e) {
          if (error instanceof Response) return error;
console.error('Parse error');
      throw new Error('Failed to parse AI response');
    }

    const ideas = parsedIdeas.ideas || [];
    const ideasFilteredOut = parsedIdeas.ideas_filtered_out || 0;
    const filterReasons = parsedIdeas.filter_reasons || [];

    // O5.7 — Server-side double filter (backup — AI should have filtered, but we enforce)
    const budget = interests.available_budget || 0;
    const filteredIdeas = ideas.filter((idea: Record<string, unknown>) => {
      // Level 1 hard filters
      if ((idea.opportunity_score as number) < 30) return false;
      if ((idea.fit_score as number) < 25) return false;
      if ((idea.required_investment_max as number) > budget * 3 && budget > 0) return false;
      return true;
    });

    // Level 2 warnings (add to idea)
    for (const idea of filteredIdeas) {
      const warnings: string[] = idea.warnings || [];
      if (idea.competition_level === 'high' && !warnings.includes('Mercado muy competido')) {
        warnings.push('Mercado muy competido');
      }
      if ((idea.required_investment_max as number) > budget && budget > 0 && !warnings.includes('Requiere mas inversion de la disponible')) {
        warnings.push('Requiere mas inversion de la disponible');
      }
      idea.warnings = warnings.length > 0 ? warnings : null;
    }

    // 4. Guardar ideas en base de datos
    const savedIdeas = [];
    for (const idea of filteredIdeas) {
      const { data: savedIdea } = await supabaseClient
        .from('generated_business_ideas')
        .insert({
          user_id,
          idea_name: idea.idea_name,
          idea_description: idea.idea_description,
          tagline: idea.tagline,
          problem_statement: idea.problem_statement,
          solution_approach: idea.solution_approach,
          target_customer: idea.target_customer,
          estimated_difficulty: idea.estimated_difficulty,
          time_to_first_revenue: idea.time_to_first_revenue,
          required_investment_min: idea.required_investment_min || 0,
          required_investment_max: idea.required_investment_max || 1000,
          market_size_estimate: idea.market_size_estimate,
          competition_level: idea.competition_level,
          differentiation_angle: idea.differentiation_angle,
          business_model: idea.business_model,
          revenue_streams: idea.revenue_streams || [],
          validation_experiments: idea.validation_experiments || [],
          mvp_scope: idea.mvp_scope,
          first_customers_strategy: idea.first_customers_strategy,
          opportunity_score: idea.opportunity_score || 70,
          fit_score: idea.fit_score || 75,
          // O5.4 — New fields
          metadata: {
            founder_profile_fit: idea.founder_profile_fit || null,
            key_risks: idea.key_risks || [],
            seven_day_experiment: idea.seven_day_experiment || null,
            warnings: idea.warnings || null,
          },
          status: 'generated',
          generated_by_ai: true,
          ai_prompt_used: prompt,
        })
        .select()
        .single();

      if (savedIdea) {
        savedIdeas.push(savedIdea);
      }
    }

    return new Response(
      JSON.stringify({
        ideas: savedIdeas,
        total_generated: savedIdeas.length,
        ideas_filtered_out: ideasFilteredOut + (ideas.length - filteredIdeas.length),
        filter_reasons: filterReasons,
        message: `${savedIdeas.length} ideas de negocio generadas personalizadas para ti`,
        next_step: 'select_idea',
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error generating business ideas:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});

// ============================================================================
// AI PROMPTS
// ============================================================================

// O5.4 — Enhanced format: profile summary + risks + 7-day experiment per idea
// O5.7 — Double filter: hard filter (discard non-viable) + warning filter (flag risky but keep)
const SYSTEM_PROMPT = `Eres un experto en generacion de ideas de negocio y emprendimiento.

Tu especialidad es tomar personas que quieren emprender pero no saben QUE y generarles ideas VIABLES y PERSONALIZADAS.

PRINCIPIOS:
1. VIABLE: Ideas que se pueden validar en 1-3 meses con poco presupuesto
2. PERSONALIZADA: Alineada con hobbies, skills y recursos del usuario
3. ESPECIFICA: No generica - problema real, solucion clara, target definido
4. ACCIONABLE: Primeros pasos claros tipo Lean Startup
5. REALISTA: No unicornios imposibles - negocios reales que funcionan

CRITERIOS DE BUENA IDEA:
- Problema claro y dolor real
- Solucion simple de validar (landing page, entrevistas, MVP minimo)
- Target customer accesible (no corporaciones Fortune 500)
- Modelo de negocio probado (no inventar la rueda)
- Tiempo a primer revenue: 1-6 meses
- Inversion inicial: EUR 0-EUR 5,000

O5.4 — CAMPOS OBLIGATORIOS NUEVOS POR IDEA:
- "founder_profile_fit": string — resumen de por que ESTA idea encaja con ESTE perfil
- "key_risks": array de 2-3 riesgos principales con mitigacion
- "seven_day_experiment": objeto con el experimento de validacion de 7 dias

O5.7 — DOUBLE FILTER (aplica ANTES de devolver ideas):
NIVEL 1 (hard filter - DESCARTA la idea):
  - opportunity_score < 30 → descartar
  - fit_score < 25 → descartar
  - Requiere inversion > presupuesto del usuario × 3 → descartar
  - No hay forma de validar en < 30 dias → descartar

NIVEL 2 (warning - MANTIENE la idea pero marca riesgos):
  - competition_level = "high" → warning: "Mercado muy competido"
  - required_investment_max > presupuesto del usuario → warning: "Requiere mas inversion de la disponible"
  - estimated_difficulty = "hard" + technical_skills_level = "basic" → warning: "Requiere skills que no tienes"

FORMATO DE RESPUESTA (JSON valido):
{
  "ideas": [
    {
      "idea_name": "string (max 60 chars)",
      "tagline": "string (max 100 chars)",
      "idea_description": "string (max 300 chars)",
      "problem_statement": "string - Problema especifico",
      "solution_approach": "string - Como lo resuelves",
      "target_customer": "string - Cliente ideal especifico",
      "estimated_difficulty": "easy|medium|hard",
      "time_to_first_revenue": "string - ej: 1-3 meses",
      "required_investment_min": number,
      "required_investment_max": number,
      "market_size_estimate": "string - ej: EUR 50M en Espana",
      "competition_level": "low|medium|high",
      "differentiation_angle": "string - Por que tu eres diferente",
      "business_model": "string - Modelo de negocio especifico",
      "revenue_streams": [{"stream": "string", "estimated_price": number}],
      "validation_experiments": [
        {
          "step": number,
          "action": "string - Accion especifica",
          "cost": number,
          "time": "string - ej: 2 dias",
          "success_metric": "string - Como sabes si funciono"
        }
      ],
      "mvp_scope": "string - MVP minimo para validar",
      "first_customers_strategy": "string - Como conseguir primeros 10 clientes",
      "opportunity_score": number (0-100),
      "fit_score": number (0-100),
      "founder_profile_fit": "string - Por que esta idea encaja con este perfil especifico",
      "key_risks": [
        {"risk": "string", "severity": "low|medium|high", "mitigation": "string"}
      ],
      "seven_day_experiment": {
        "day_1_2": "string - Que hacer dias 1-2",
        "day_3_4": "string - Que hacer dias 3-4",
        "day_5_7": "string - Que hacer dias 5-7",
        "success_criteria": "string - Como saber si vale la pena seguir",
        "total_cost": number,
        "tools_needed": ["string"]
      },
      "warnings": ["string"] | null
    }
  ],
  "ideas_filtered_out": number,
  "filter_reasons": ["string"]
}`;

interface UserInterests {
  hobbies?: string[];
  professional_background?: string;
  skills?: string[];
  preferred_industries?: string[];
  avoid_industries?: string[];
  target_market_preference?: string;
  business_model_preference?: string[];
  available_budget?: number;
  available_time_hours_week?: number;
  technical_skills_level?: string;
  has_cofounder?: boolean;
  revenue_goal_monthly?: number;
  lifestyle_goal?: string;
  risk_tolerance?: string;
}

function buildIdeaGenerationPrompt(interests: UserInterests): string {
  const budget = interests.available_budget || 0;
  return `
# GENERAR IDEAS DE NEGOCIO PERSONALIZADAS

## PERFIL DEL USUARIO

### Hobbies e Intereses
${interests.hobbies?.join(', ') || 'No especificado'}

### Background Profesional
${interests.professional_background || 'No especificado'}

### Skills
${interests.skills?.join(', ') || 'No especificado'}

### Preferencias de Industria
**Quiere trabajar en**: ${interests.preferred_industries?.join(', ') || 'Abierto a cualquier industria'}
**Evitar**: ${interests.avoid_industries?.join(', ') || 'Ninguna restriccion'}

### Tipo de Negocio Preferido
**Target market**: ${interests.target_market_preference || 'B2C o B2B'}
**Modelos de negocio que le interesan**: ${interests.business_model_preference?.join(', ') || 'Abierto'}

### Recursos Disponibles
- **Presupuesto inicial**: EUR ${budget} - EUR ${budget + 1000}
- **Tiempo disponible**: ${interests.available_time_hours_week || 10} horas/semana
- **Skills tecnicas**: ${interests.technical_skills_level || 'basic'}
- **Tiene cofundador?**: ${interests.has_cofounder ? 'Si' : 'No'}

### Objetivos
- **Revenue objetivo mensual**: EUR ${interests.revenue_goal_monthly || 3000}
- **Lifestyle goal**: ${interests.lifestyle_goal || 'freedom'}
- **Tolerancia al riesgo**: ${interests.risk_tolerance || 'medium'}

---

## INSTRUCCIONES

Genera **exactamente 7 ideas de negocio** (genera 7, el filtro descartara las no viables y quedaran ~5).

Cada idea DEBE incluir:
1. **Aproveche** los hobbies, background y skills del usuario
2. **Se pueda validar** con el presupuesto y tiempo disponible
3. **Este alineada** con sus preferencias de industria y modelo
4. **Alcance** su objetivo de revenue en 6-12 meses
5. **Respete** su tolerancia al riesgo

### Distribucion sugerida:
- 2 ideas "easy" (baja barrera, rapido a revenue)
- 3 ideas "medium" (mas upside, mas esfuerzo)
- 2 ideas "hard" (alto potencial, mayor riesgo)

### O5.4 — Campos obligatorios nuevos por idea:
- **founder_profile_fit**: 1-2 frases explicando por que ESTA idea encaja con ESTE perfil concreto
- **key_risks**: 2-3 riesgos principales con severity (low/medium/high) y mitigacion concreta
- **seven_day_experiment**: plan dia a dia para validar la idea en 7 dias con coste minimo

### O5.7 — DOUBLE FILTER (aplica antes de devolver):
**NIVEL 1 (hard filter — descarta):**
- opportunity_score < 30
- fit_score < 25
- required_investment_max > ${budget * 3} (3x presupuesto)
- No se puede validar en < 30 dias

**NIVEL 2 (warning — mantiene pero marca):**
- competition_level = "high" → warning
- required_investment_max > ${budget} → warning
- estimated_difficulty = "hard" + skills tecnicas = "${interests.technical_skills_level || 'basic'}" → warning

Incluye en la respuesta:
- "ideas_filtered_out": numero de ideas descartadas por hard filter
- "filter_reasons": motivos de descarte

### Cada idea debe incluir:
- 3-5 **validation experiments** concretos tipo Lean Startup
- **MVP scope** ultra-minimo para validar rapido
- **First customers strategy** especifica (no "ads en Facebook")
- **seven_day_experiment** con plan dia a dia

Responde SOLO con JSON valido.
`;
}
