// ZOMBIE: not referenced from frontend. Safe to delete. (Audit: 2026-03-23)
/**
 * GROWTH PLAYBOOK GENERATOR (ONBOARDING EXISTENTE - CAPA 4)
 *
 * Genera playbook de crecimiento personalizado para negocios existentes:
 * - Diagnóstico basado en métricas actuales
 * - Identifica bottleneck principal
 * - Plan de acción priorizado
 * - Proyecciones de escenarios (status quo vs optimizado)
 * - Benchmarking vs competidores
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';


interface GrowthPlaybookRequest {
  project_id: string;
  current_state: {
    phase: string; // 'pre_revenue', 'first_revenue', 'growth', 'scale'
    mrr: number;
    customers: number;
    churn_rate: number; // monthly %
    nps?: number;
    cac?: number;
    ltv?: number;
    burn_rate?: number;
    runway_months?: number;
    team_size: number;
  };
  business_info: {
    description: string;
    business_type: string;
    target_customer: string;
  };
  main_problem: string; // What user thinks is the main issue
  location: {
    city: string;
    country: string;
  };
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const requestData: GrowthPlaybookRequest = await req.json();

        const { user, serviceClient: supabaseClient } = await validateAuth(req);

    await verifyProjectMembership(supabaseClient, user.id, requestData.project_id, origin);

    const rateLimitResult = await checkRateLimit(user.id, 'growth-playbook-generator', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    console.log('📈 Generating growth playbook for MRR:', requestData.current_state.mrr);

    // Get competitive analysis if exists
    const { data: competitiveData } = await supabaseClient
      .from('competitive_analysis')
      .select('*')
      .eq('project_id', requestData.project_id)
      .single();

    // Generate playbook with AI
    const playbook = await generateGrowthPlaybook(anthropic, requestData, competitiveData);

    // Save to database
    const { data: saved } = await supabaseClient
      .from('growth_playbooks')
      .upsert({
        project_id: requestData.project_id,
        diagnosis: playbook.diagnosis,
        action_plan: playbook.action_plan,
        scenarios: playbook.scenarios,
        key_metrics: playbook.key_metrics,
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

async function generateGrowthPlaybook(
  anthropic: Anthropic,
  request: GrowthPlaybookRequest,
  competitiveData: Record<string, unknown> | null
) {
  const { current_state: metrics, main_problem: rawMainProblem } = request;
  const sf = (val: unknown) => val ? sanitizePromptInput(String(val), SanitizerPresets.LONG_INPUT).sanitized : '';
  const business_info = {
    description: sf(request.business_info.description),
    business_type: sf(request.business_info.business_type),
    target_customer: sf(request.business_info.target_customer),
  };
  const main_problem = sf(rawMainProblem);

  // Calculate unit economics
  const ltvCacRatio = metrics.ltv && metrics.cac ? metrics.ltv / metrics.cac : null;
  const monthlyChurnRate = metrics.churn_rate;
  const retentionRate12Months = Math.pow(1 - monthlyChurnRate / 100, 12) * 100;

  const prompt = `Eres un experto en growth strategy y scaling de startups.

NEGOCIO:
${business_info.description}
Tipo: ${business_info.business_type}
Cliente objetivo: ${business_info.target_customer}

MÉTRICAS ACTUALES:
- Fase: ${metrics.phase}
- MRR: €${metrics.mrr}
- Customers: ${metrics.customers}
- Churn mensual: ${metrics.churn_rate}% (Retention 12 meses: ${retentionRate12Months.toFixed(1)}%)
${metrics.nps ? `- NPS: ${metrics.nps}` : ''}
${metrics.cac ? `- CAC: €${metrics.cac}` : ''}
${metrics.ltv ? `- LTV: €${metrics.ltv}` : ''}
${ltvCacRatio ? `- LTV/CAC Ratio: ${ltvCacRatio.toFixed(2)}` : ''}
${metrics.burn_rate ? `- Burn rate: €${metrics.burn_rate}/mes` : ''}
${metrics.runway_months ? `- Runway: ${metrics.runway_months} meses` : ''}
- Team: ${metrics.team_size} personas

LO QUE EL FOUNDER PIENSA QUE ES EL PROBLEMA:
"${main_problem}"

${
  competitiveData
    ? `
BENCHMARKING (vs competidores):
${JSON.stringify(competitiveData.benchmarks, null, 2)}
`
    : ''
}

TAREA:
Genera un GROWTH PLAYBOOK personalizado y accionable.

REGLAS CRÍTICAS:
1. **Diagnóstico honesto** - Si el founder está wrong sobre el problema, DÍSELO
2. **Basado en números** - Usa las métricas para identificar el real bottleneck
3. **Priorización clara** - Focus en 1-2 cosas, no 10
4. **Accionable** - Cada acción debe tener pasos concretos
5. **Timeline realista** - No prometas 10x growth en 1 mes
6. **Proyecciones conservadoras** - Mejor sorprender positivamente

FRAMEWORK DE DIAGNÓSTICO:
1. Si churn >8% → Problema de producto/PMF, NO de adquisición
2. Si LTV/CAC <3 → Problema de unit economics
3. Si NPS <40 → Problema de producto
4. Si runway <6 meses → Problema de fundraising urgente
5. Si MRR creciendo pero churn alto → Agujero en el balde

Devuelve JSON:
{
  "diagnosis": {
    "actual_bottleneck": "El bottleneck REAL (puede ser distinto de lo que el founder piensa)",
    "founder_was_right": true | false,
    "explanation": "Por qué este es el bottleneck real (basado en las métricas)",
    "health_score": 75,
    "critical_issues": [
      {
        "issue": "Descripción del issue",
        "severity": "critical" | "important" | "minor",
        "impact": "Qué pasa si no se arregla",
        "evidence": "Qué métrica lo demuestra"
      }
    ],
    "current_phase_assessment": "Evaluación de si están ready para crecer o necesitan arreglar primero"
  },

  "action_plan": [
    {
      "priority": 1,
      "category": "retention" | "acquisition" | "product" | "ops" | "fundraising",
      "action": "Título de la acción",
      "reasoning": "Por qué esta es la prioridad #1",
      "expected_impact": "Qué mejora esperar (con números)",
      "timeline": "2-4 semanas",
      "steps": [
        {
          "step": "Paso específico 1",
          "owner": "Quién debería hacerlo (CEO/CTO/etc)",
          "duration": "3 días",
          "deliverable": "Qué se entrega"
        }
      ],
      "resources_needed": {
        "budget": 5000,
        "people": "1 dev part-time",
        "tools": ["Tool 1", "Tool 2"]
      },
      "success_metrics": ["Métrica 1 mejora de X a Y", "Métrica 2"]
    }
  ],

  "scenarios": {
    "status_quo": {
      "description": "Si no cambias nada",
      "month_3_mrr": 18000,
      "month_6_mrr": 21000,
      "month_12_mrr": 25000,
      "key_assumption": "Churn se mantiene en 8%"
    },
    "fix_retention": {
      "description": "Si reduces churn de 8% a 5%",
      "month_3_mrr": 19000,
      "month_6_mrr": 27000,
      "month_12_mrr": 42000,
      "key_assumption": "Mismo adquisición, mejor retención",
      "value_vs_status_quo": "+€17K MRR en 12 meses"
    },
    "growth_mode": {
      "description": "Si doblas adquisición (SOLO después de fix retention)",
      "month_3_mrr": 28000,
      "month_6_mrr": 48000,
      "month_12_mrr": 85000,
      "required_investment": 50000,
      "key_assumption": "Churn <6%, CAC se mantiene",
      "warning": "No hacer esto antes de fix churn"
    }
  },

  "benchmarks_vs_industry": {
    "your_metrics": {
      "churn": "${metrics.churn_rate}%",
      "nps": ${metrics.nps || 'N/A'},
      "ltv_cac": ${ltvCacRatio ? ltvCacRatio.toFixed(2) : 'N/A'}
    },
    "industry_average": {
      "churn": "5-7%",
      "nps": "50-60",
      "ltv_cac": "3-5"
    },
    "best_in_class": {
      "churn": "<3%",
      "nps": ">70",
      "ltv_cac": ">5"
    },
    "your_standing": "Below average" | "Average" | "Above average" | "Best in class"
  },

  "key_metrics": [
    "churn_rate",
    "mrr_growth",
    "nps",
    "customer_acquisition",
    "ltv_cac_ratio"
  ],

  "quick_wins": [
    {
      "win": "Acción rápida que puede hacerse en <1 semana",
      "impact": "Impacto esperado",
      "effort": "low" | "medium" | "high"
    }
  ],

  "when_to_fundraise": {
    "ready_now": true | false,
    "reasoning": "Por qué sí o no",
    "milestones_needed": ["Milestone 1", "Milestone 2"],
    "recommended_amount": "€150K-200K",
    "what_to_use_it_for": "Específicamente en qué invertir"
  }
}

Sé BRUTALMENTE HONESTO. Si el founder necesita arreglar producto antes de crecer, DÍSELO.
Devuelve SOLO el JSON.`;

  const startTime = Date.now();
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });
  const durationMs = Date.now() - startTime;

  const text = (message.content[0] as { type: string; text: string }).text;

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supaLog = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  await logAICall({
    supabaseClient: supaLog,
    projectId: request.project_id,
    functionName: 'growth-playbook-generator',
    inputData: { project_id: request.project_id, mrr: metrics.mrr },
    outputData: text?.slice(0, 500),
    success: true,
    executionTimeMs: durationMs,
    tokensUsed: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
    modelUsed: 'claude-3-5-sonnet-20241022',
  });
  const { safeJsonParse } = await import('../_shared/safe-json-parse.ts');
  const result = safeJsonParse(text);
  if (!result.ok) throw new Error(`Failed to parse growth playbook: ${result.error}`);
  return result.data;
}
