/**
 * COFOUNDER ALIGNMENT ANALYZER (CAPA 7)
 *
 * Analiza alineamiento entre co-founders basado en sus respuestas de onboarding:
 * - Detecta desalineamientos en visión, estrategia, commitment, valores
 * - Genera preguntas para discutir
 * - Da recomendaciones (continuar juntos vs split)
 * - Calcula alignment score
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlignmentAnalysisRequest {
  project_id: string;
  founder_a_session_id: string;
  founder_b_session_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, founder_a_session_id, founder_b_session_id }: AlignmentAnalysisRequest =
      await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    console.log('🤝 Analyzing cofounder alignment for project:', project_id);

    // Get both sessions
    const { data: sessionA } = await supabaseClient
      .from('onboarding_sessions')
      .select('*')
      .eq('id', founder_a_session_id)
      .single();

    const { data: sessionB } = await supabaseClient
      .from('onboarding_sessions')
      .select('*')
      .eq('id', founder_b_session_id)
      .single();

    if (!sessionA || !sessionB) {
      throw new Error('One or both sessions not found');
    }

    // Analyze alignment with AI
    const alignment = await analyzeAlignment(anthropic, sessionA.answers, sessionB.answers);

    // Save to database
    const { data: saved } = await supabaseClient
      .from('cofounder_alignment')
      .insert({
        project_id,
        founder_a_session_id,
        founder_b_session_id,
        alignment_score: alignment.alignment_score,
        vision_alignment: alignment.vision_alignment,
        strategy_alignment: alignment.strategy_alignment,
        commitment_alignment: alignment.commitment_alignment,
        values_alignment: alignment.values_alignment,
        misalignments: alignment.misalignments,
        discussion_topics: alignment.discussion_topics,
        recommendations: alignment.recommendations,
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
  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeAlignment(anthropic: Anthropic, answersA: any, answersB: any) {
  const prompt = `Eres un experto en co-founder dynamics y prevención de conflictos en startups.

FOUNDER A - Respuestas:
${JSON.stringify(answersA, null, 2)}

FOUNDER B - Respuestas:
${JSON.stringify(answersB, null, 2)}

TAREA:
Analiza el alineamiento entre estos co-founders y detecta DESALINEAMIENTOS que pueden causar problemas.

CONTEXTO IMPORTANTE:
- El 65% de startups fracasan por conflictos entre co-founders
- Los desalineamientos más peligrosos son: visión, equity split, commitment, timing de monetización
- Pequeñas diferencias ahora se magnifican con stress/presión
- Es MEJOR descubrir desalineamientos ANTES de empezar

CATEGORÍAS DE ANÁLISIS:
1. **VISION** - ¿Quieren construir lo mismo?
2. **STRATEGY** - ¿Cómo llegar ahí? (pricing, GTM, prioridades)
3. **COMMITMENT** - ¿Mismo nivel de dedicación?
4. **VALUES** - ¿Cómo toman decisiones?

Para CADA categoría:
- Score 0-100 (100 = perfectamente alineados)
- Listar específicos desalineamientos si existen

SEVERIDAD DE DESALINEAMIENTOS:
- **CRITICAL** - Deal-breakers, muy difícil continuar juntos (ej: uno quiere VC-backed exit, otro lifestyle business)
- **IMPORTANT** - Deben resolverse antes de empezar (ej: pricing strategy muy diferente)
- **MINOR** - Discutibles, no blockers (ej: preferencia de stack técnico)

Devuelve JSON:
{
  "alignment_score": 75,

  "vision_alignment": 90,
  "strategy_alignment": 60,
  "commitment_alignment": 70,
  "values_alignment": 85,

  "misalignments": [
    {
      "category": "vision" | "strategy" | "commitment" | "values",
      "severity": "critical" | "important" | "minor",
      "topic": "Pricing strategy",
      "founder_a_position": "Freemium, €49/mo Pro",
      "founder_b_position": "Paid only, €99/mo",
      "impact": "Afecta directamente revenue projections y go-to-market",
      "why_it_matters": "Diferencia de 2x en pricing puede determinar éxito/fracaso. Necesitan alinearse con DATOS, no opiniones."
    }
  ],

  "discussion_topics": [
    {
      "topic": "Pricing strategy",
      "question": "¿Qué evidencia tienen para cada precio?",
      "sub_questions": [
        "¿Hicieron willingness-to-pay research?",
        "¿Qué dicen los competidores?",
        "¿Pueden A/B testear ambos precios?"
      ],
      "priority": "critical" | "high" | "medium" | "low",
      "reasoning": "Esto debe resolverse ANTES de construir porque afecta posicionamiento y features"
    }
  ],

  "recommendations": {
    "overall_verdict": "proceed_with_caution" | "strong_partnership" | "high_risk" | "recommend_split",
    "reasoning": "Explicación del veredicto",

    "if_proceed": {
      "immediate_actions": [
        "Acción 1: Tener meeting de 2 horas para discutir pricing (con agenda específica)",
        "Acción 2: Escribir founder agreement document"
      ],
      "topics_to_codify": [
        "Decision-making process cuando disagreen",
        "Equity split y vesting schedule",
        "Expectations de time commitment"
      ]
    },

    "red_flags": [
      {
        "flag": "Descripción del red flag",
        "severity": "high" | "medium" | "low",
        "what_to_watch": "Qué monitorear going forward"
      }
    ],

    "green_flags": [
      "Aspecto positivo del partnership 1",
      "Aspecto positivo 2"
    ]
  },

  "compatibility_strengths": [
    "Área donde están muy alineados (ej: ambos quieren producto excelente, no shortcuts)",
    "Otra fortaleza"
  ],

  "suggested_exercises": [
    {
      "exercise": "Nombre del ejercicio",
      "description": "Qué hacer",
      "goal": "Qué descubrirán",
      "duration": "1 hora"
    }
  ]
}

EJEMPLOS DE BUENOS ANÁLISIS:
✅ "CRITICAL misalignment: A quiere exit en 5 años (VC-backed), B quiere lifestyle business. Incompatible. Recomendación: Discutir si uno puede cambiar visión, o es mejor split ahora."

✅ "MINOR misalignment: A prefiere React, B prefiere Vue. Impact bajo, pueden flip a coin o A decide (si es CTO)."

✅ "GREEN FLAG: Ambos committed full-time, mismo equity split (50/50), vesting 4 años. Buena base."

EJEMPLOS MALOS:
❌ "Tienen algunas diferencias" (muy vago)
❌ "Deberían hablar" (no específico)
❌ "Todo está bien" (probablemente no es verdad)

Sé HONESTO y ESPECÍFICO. Mejor prevenir ahora que fracasar después.
Devuelve SOLO el JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 5000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as any).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to parse alignment analysis response');
  }

  return JSON.parse(jsonMatch[0]);
}
