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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // 4. Guardar ideas en base de datos
    const savedIdeas = [];
    for (const idea of ideas) {
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
        message: `✨ ${savedIdeas.length} ideas de negocio generadas personalizadas para ti`,
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

const SYSTEM_PROMPT = `Eres un experto en generación de ideas de negocio y emprendimiento.

Tu especialidad es tomar personas que quieren emprender pero no saben QUÉ y generarles ideas VIABLES y PERSONALIZADAS.

PRINCIPIOS:
1. VIABLE: Ideas que se pueden validar en 1-3 meses con poco presupuesto
2. PERSONALIZADA: Alineada con hobbies, skills y recursos del usuario
3. ESPECÍFICA: No genérica - problema real, solución clara, target definido
4. ACCIONABLE: Primeros pasos claros tipo Lean Startup
5. REALISTA: No unicornios imposibles - negocios reales que funcionan

CRITERIOS DE BUENA IDEA:
- Problema claro y dolor real
- Solución simple de validar (landing page, entrevistas, MVP mínimo)
- Target customer accesible (no corporaciones Fortune 500)
- Modelo de negocio probado (no inventar la rueda)
- Tiempo a primer revenue: 1-6 meses
- Inversión inicial: €0-€5,000

FORMATO DE RESPUESTA (JSON válido):
{
  "ideas": [
    {
      "idea_name": "string (max 60 chars)",
      "tagline": "string (max 100 chars)",
      "idea_description": "string (max 300 chars)",
      "problem_statement": "string - Problema específico",
      "solution_approach": "string - Cómo lo resuelves",
      "target_customer": "string - Cliente ideal específico",
      "estimated_difficulty": "easy|medium|hard",
      "time_to_first_revenue": "string - ej: 1-3 meses",
      "required_investment_min": number,
      "required_investment_max": number,
      "market_size_estimate": "string - ej: €50M en España",
      "competition_level": "low|medium|high",
      "differentiation_angle": "string - Por qué tú eres diferente",
      "business_model": "string - Modelo de negocio específico",
      "revenue_streams": [{"stream": "string", "estimated_price": number}],
      "validation_experiments": [
        {
          "step": number,
          "action": "string - Acción específica",
          "cost": number,
          "time": "string - ej: 2 días",
          "success_metric": "string - Cómo sabes si funcionó"
        }
      ],
      "mvp_scope": "string - MVP mínimo para validar",
      "first_customers_strategy": "string - Cómo conseguir primeros 10 clientes",
      "opportunity_score": number (0-100),
      "fit_score": number (0-100)
    }
  ]
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
**Evitar**: ${interests.avoid_industries?.join(', ') || 'Ninguna restricción'}

### Tipo de Negocio Preferido
**Target market**: ${interests.target_market_preference || 'B2C o B2B'}
**Modelos de negocio que le interesan**: ${interests.business_model_preference?.join(', ') || 'Abierto'}

### Recursos Disponibles
- **Presupuesto inicial**: €${interests.available_budget || 0} - €${(interests.available_budget || 0) + 1000}
- **Tiempo disponible**: ${interests.available_time_hours_week || 10} horas/semana
- **Skills técnicas**: ${interests.technical_skills_level || 'basic'}
- **¿Tiene cofundador?**: ${interests.has_cofounder ? 'Sí' : 'No'}

### Objetivos
- **Revenue objetivo mensual**: €${interests.revenue_goal_monthly || 3000}
- **Lifestyle goal**: ${interests.lifestyle_goal || 'freedom'}
- **Tolerancia al riesgo**: ${interests.risk_tolerance || 'medium'}

---

## INSTRUCCIONES

Genera **exactamente 5 ideas de negocio** que:

1. **Aprovechen** los hobbies, background y skills del usuario
2. **Se puedan validar** con el presupuesto y tiempo disponible
3. **Estén alineadas** con sus preferencias de industria y modelo
4. **Alcancen** su objetivo de revenue en 6-12 meses
5. **Respeten** su tolerancia al riesgo

### Distribución sugerida:
- 2 ideas "easy" (baja barrera, rápido a revenue)
- 2 ideas "medium" (más upside, más esfuerzo)
- 1 idea "hard" (alto potencial, mayor riesgo)

### Cada idea debe incluir:
- 3-5 **validation experiments** concretos tipo Lean Startup
- **MVP scope** ultra-mínimo para validar rápido
- **First customers strategy** específica (no "ads en Facebook")

Responde SOLO con JSON válido.
`;
}
