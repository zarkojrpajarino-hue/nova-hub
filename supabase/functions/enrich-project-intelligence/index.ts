/**
 * ENRICH PROJECT INTELLIGENCE
 *
 * AI-assisted population of Project Intelligence data:
 * - Takes basic project info (name, description, industry, target customer)
 * - AI generates: buyer personas, value propositions, brand guidelines, competitors
 * - User reviews and approves
 * - Everything saved to DB
 *
 * This solves the problem: "How do Project Intelligence tables get populated?"
 * Answer: User provides basics → AI enriches → User approves → Data saved
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

    const { project_id, user_id, project_info } = await req.json();

    if (!project_id || !user_id || !project_info) {
      throw new Error('project_id, user_id, and project_info are required');
    }

        const { serviceClient: supabaseClient } = await validateAuthWithUserId(req, user_id);

    console.log('Enriching project intelligence for:', project_id);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    // 1. Build enrichment prompt
    const prompt = buildEnrichmentPrompt(project_info);

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
        temperature: 0.7,
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

    // 2. Parse AI response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let enrichedData;
    try {
      enrichedData = JSON.parse(cleanContent);
    } catch (_e) {
          if (error instanceof Response) return error;
console.error('Parse error');
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response');
    }

    // 3. Save to generation_previews for approval
    const { data: preview } = await supabaseClient
      .from('generation_previews')
      .insert({
        project_id,
        user_id,
        generation_type: 'complete_business',
        generated_options: [
          {
            option: 1,
            buyer_personas: enrichedData.buyer_personas,
            value_propositions: enrichedData.value_propositions,
            brand_guidelines: enrichedData.brand_guidelines,
            competitors: enrichedData.competitors,
          },
        ],
        status: 'pending',
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        preview_id: preview?.id,
        message: '✨ Project Intelligence enriquecido - Revisa y aprueba',
        enriched: {
          buyer_personas: enrichedData.buyer_personas.length,
          value_propositions: enrichedData.value_propositions.length,
          brand_guidelines: enrichedData.brand_guidelines ? 1 : 0,
          competitors: enrichedData.competitors.length,
        },
        next_step: 'Review and approve via frontend',
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error enriching project intelligence:', error);
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

const SYSTEM_PROMPT = `Eres un experto en análisis de mercado y estrategia de negocio.

Tu trabajo es tomar información BÁSICA de un proyecto y ENRIQUECERLA con datos profundos sobre:
- Buyer personas (con pain points, presupuesto, proceso de decisión, objeciones)
- Value propositions (con USPs, beneficios, ROI, historias de éxito)
- Brand guidelines (con tone, atributos, ejemplos)
- Competitors (con battle cards para defender nuestra posición)

IMPORTANTE:
- Datos basados en investigación real de mercado
- Pain points específicos (no genéricos)
- Battle cards concretas (qué decir cuando mencionan competitor X)
- Value prop cuantificada cuando sea posible (ROI, ahorros, etc.)

FORMATO DE RESPUESTA: JSON válido`;

function buildEnrichmentPrompt(projectInfo: Record<string, unknown>): string {
  return `
# ENRIQUECER PROJECT INTELLIGENCE

## INFORMACIÓN BÁSICA DEL PROYECTO

**Nombre**: ${projectInfo.project_name}

**Descripción**: ${projectInfo.description}

**Industria**: ${projectInfo.industry || 'General'}

**Cliente objetivo**: ${projectInfo.target_customer}

**Problema que resuelve**: ${projectInfo.problem || 'No especificado'}

**Solución**: ${projectInfo.solution || 'No especificado'}

---

## INSTRUCCIONES

Genera datos enriquecidos para este proyecto siguiendo este formato JSON:

\`\`\`json
{
  "buyer_personas": [
    {
      "persona_name": "...",
      "age_range": "25-35",
      "role": "...",
      "industry": "...",
      "pain_points": [
        {
          "pain": "Pain point específico",
          "severity": "high|medium|low",
          "frequency": "daily|weekly|monthly",
          "current_solution": "Qué hacen ahora para resolverlo",
          "cost_of_pain": "€X/mes en pérdidas o tiempo perdido"
        }
      ],
      "budget_min": 100,
      "budget_max": 500,
      "budget_frequency": "monthly",
      "decision_process": {
        "steps": ["Research", "Compare", "Trial", "Decide"],
        "timeline": "2-4 weeks",
        "decision_makers": ["Role 1", "Role 2"],
        "approval_required": true
      },
      "common_objections": [
        {
          "objection": "Es muy caro",
          "response": "Cómo responder efectivamente",
          "success_rate": 75
        }
      ],
      "preferred_channels": [
        {"channel": "LinkedIn", "effectiveness": "high"},
        {"channel": "Email", "effectiveness": "medium"}
      ],
      "buying_triggers": [
        "Situación que los lleva a comprar",
        "Evento que genera urgencia"
      ]
    }
  ],
  "value_propositions": [
    {
      "headline": "...",
      "subheadline": "...",
      "unique_selling_points": [
        {
          "usp": "USP específico",
          "explanation": "Por qué importa",
          "proof_point": "Dato o métrica que lo respalda"
        }
      ],
      "benefits": [
        {
          "benefit": "Ahorra tiempo",
          "quantified": "10 horas/semana",
          "annual_value": "€5,200 en productividad"
        }
      ],
      "roi_examples": [
        {
          "scenario": "Cliente tipo X",
          "investment": 99,
          "annual_return": 5000,
          "roi_percentage": 5000,
          "payback_period": "2 meses"
        }
      ],
      "success_stories": [
        {
          "customer_profile": "Empresa tipo Y",
          "challenge": "Problema que tenían",
          "solution": "Qué implementaron",
          "results": "Resultados cuantificados"
        }
      ]
    }
  ],
  "brand_guidelines": {
    "tone_attributes": ["professional", "friendly", "innovative"],
    "preferred_words": ["transform", "optimize", "empower"],
    "avoid_words": ["cheap", "try", "maybe"],
    "example_good": {
      "context": "Email de prospección",
      "text": "Ejemplo de buen mensaje alineado al tono"
    },
    "example_bad": {
      "context": "Email de prospección",
      "text": "Ejemplo de mal mensaje (qué evitar)",
      "why_bad": "Por qué no funciona"
    }
  },
  "competitors": [
    {
      "competitor_name": "Competitor A",
      "website": "https://...",
      "features": ["Feature 1", "Feature 2"],
      "pricing": {
        "model": "subscription",
        "tiers": [
          {"tier": "Basic", "price": 49, "features": ["F1", "F2"]}
        ]
      },
      "target_market": "Mercado que atacan",
      "strengths": ["Fortaleza 1", "Fortaleza 2"],
      "weaknesses": ["Debilidad 1", "Debilidad 2"],
      "our_advantage": [
        "Por qué somos mejores en X",
        "Diferenciador clave"
      ],
      "battle_card": {
        "when_mentioned": "Qué decir cuando cliente compara",
        "positioning": "Cómo posicionarnos vs ellos",
        "win_strategy": "Estrategia para ganar el deal",
        "key_differentiators": [
          {"diff": "Diferenciador", "impact": "Por qué importa"}
        ]
      }
    }
  ]
}
\`\`\`

**IMPORTANTE**:
- Genera 2-3 buyer personas si hay segmentos distintos
- Identifica 3-5 competidores REALES (investiga)
- Battle cards específicas (no "somos mejores" - CÓMO somos mejores)
- ROI cuantificado con números realistas

Responde SOLO con JSON válido.
`;
}
