/**
 * 🧠 ANALYZE PROJECT V4 — FASE 20
 *
 * Análisis estratégico IA en 3 niveles progresivos:
 *   Nivel 1 (día 14+): Executive Summary + Phase Fit + Urgent Decisions
 *   Nivel 2 (+1 integración, 30d+): + Financial Pulse + Pipeline Traction
 *   Nivel 3 (2+ integraciones, 60d+, 5+ decisions): + Cross Signals + Hard Truths
 *
 * Rate limit: 1 análisis/nivel/24h (bypass si isStale)
 * Stale: max(updated_at) de fuentes > cache.generated_at
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';
import { enforceAICallLimit } from '../_shared/aiLimitCheck.ts';

// ── TTL por nivel ─────────────────────────────────────────────────────────────

const TTL_DAYS: Record<number, number> = { 1: 7, 2: 3, 3: 2 };

// ── Prompt del sistema ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres Optimus, el motor de inteligencia estratégica de Optimus-K.
Tu función es generar un análisis estratégico honesto, directo y accionable para un founder.

PRINCIPIOS:
- Sé directo. No suavices la realidad. Los founders necesitan verdades, no validación.
- Cada afirmación debe ser proporcional a la calidad de los datos disponibles.
- Si los datos son escasos, dilo — no inventes patrones donde no los hay.
- Las "Hard Truths" son el output más valioso: lo que el founder no quiere ver pero necesita saber.

CALIBRACIÓN PARA DATOS ESCASOS (F20.V2.5):
- Si el proyecto lleva menos de 30 días activo O no tiene integraciones activas:
  * Usa confidence_overall ≤ 0.5
  * En executive_summary.paragraph menciona explícitamente que el análisis es preliminar por falta de datos operativos
  * En phase_fit.benchmark_note incluye nota sobre la limitación de datos
  * NO generes hard_truths ni cross_signals con reliability > 0.5 en estos casos
  * No inventes tendencias que no están en los datos — es mejor decir "insuficiente data" que inferir
- Si hay integraciones activas con datos recientes (< 3 días): puedes usar confidence_overall hasta 0.85
- Nunca uses confidence_overall = 1.0 — siempre hay incertidumbre

RESPONDE ÚNICAMENTE con JSON válido. Sin markdown, sin texto fuera del JSON.
Sigue exactamente el schema de output especificado en el prompt.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function expiresAt(level: number): string {
  const d = new Date();
  d.setDate(d.getDate() + TTL_DAYS[level]);
  return d.toISOString();
}

function within24h(isoDate: string): boolean {
  return Date.now() - new Date(isoDate).getTime() < 24 * 3_600_000;
}

// ── Edge function ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const headers = getCorsHeaders(req);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);

    // Rate limit global (costoso — usar RateLimitPresets.AI_GENERATION)
    const rl = await checkRateLimit(supabase, user.id, 'analyze-project-v4', RateLimitPresets.AI_GENERATION);
    if (!rl.allowed) return createRateLimitResponse(rl, headers);

    const body = await req.json() as {
      mode?: 'generate' | 'followup';
      project_id: string;
      level?: 1 | 2 | 3;
      additional_context?: string;
      focus_area?: string;
      question?: string;
      analysis_context?: Record<string, unknown>;
    };

    const { project_id, mode = 'generate' } = body;

    // AI call limit check
    if (project_id) {
      await enforceAICallLimit(supabase, project_id, req.headers.get('Origin'));
    }

    // Sanitize free-text user inputs
    if (body.additional_context) {
      const s = sanitizePromptInput(body.additional_context, SanitizerPresets.LONG_INPUT);
      if (s.blocked) return new Response(JSON.stringify({ error: s.reason }), { status: 400, headers });
      body.additional_context = s.sanitized;
    }
    if (body.question) {
      const s = sanitizePromptInput(body.question, SanitizerPresets.LONG_INPUT);
      if (s.blocked) return new Response(JSON.stringify({ error: s.reason }), { status: 400, headers });
      body.question = s.sanitized;
    }
    if (body.focus_area) {
      const s = sanitizePromptInput(body.focus_area, SanitizerPresets.MEDIUM_INPUT);
      if (!s.blocked) body.focus_area = s.sanitized;
    }

    // ── Follow-up chat mode ──────────────────────────────────────────────
    if (mode === 'followup') {
      const { question, analysis_context } = body;
      if (!project_id || !question || !analysis_context) {
        return new Response(JSON.stringify({ error: 'project_id, question y analysis_context son requeridos para followup' }), {
          status: 400, headers,
        });
      }

      // Verify membership
      const { data: membership } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', project_id)
        .eq('member_id', user.id)
        .maybeSingle();
      if (!membership) {
        const { data: proj } = await supabase
          .from('projects')
          .select('id')
          .eq('id', project_id)
          .eq('created_by', user.id)
          .maybeSingle();
        if (!proj) {
          return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers });
        }
      }

      const anthropic = new Anthropic({
        apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
      });

      const followupStart = Date.now();
      const followupMessage = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `Eres Optimus, el motor de inteligencia estrategica de Optimus-K.
El usuario tiene un analisis generado de su proyecto y hace una pregunta de seguimiento.
Responde directamente en 2-3 oraciones. Se conciso, honesto y accionable.
No repitas el analisis completo. Si no tienes datos suficientes para responder, dilo.`,
        messages: [{
          role: 'user',
          content: `Contexto del analisis:\n${JSON.stringify(analysis_context, null, 2).slice(0, 3000)}\n\nPregunta del founder: ${question}`,
        }],
      });

      const answerText = followupMessage.content[0].type === 'text' ? followupMessage.content[0].text : '';

      await logAICall({
        supabaseClient: supabase,
        projectId: project_id,
        userId: user.id,
        functionName: 'analyze-project-v4-followup',
        inputData: { project_id, question: question?.slice(0, 200) },
        outputData: answerText?.slice(0, 500),
        success: true,
        executionTimeMs: Date.now() - followupStart,
        tokensUsed: (followupMessage.usage?.input_tokens ?? 0) + (followupMessage.usage?.output_tokens ?? 0),
        modelUsed: 'claude-haiku-4-5-20251001',
      });

      return new Response(JSON.stringify({ answer: answerText }), { status: 200, headers });
    }

    // ── Standard generation mode ─────────────────────────────────────────
    const { level, additional_context, focus_area } = body as {
      level: 1 | 2 | 3;
      additional_context?: string;
      focus_area?: string;
      project_id: string;
    };

    if (!project_id || ![1, 2, 3].includes(level)) {
      return new Response(JSON.stringify({ error: 'project_id y level (1/2/3) son requeridos' }), {
        status: 400, headers,
      });
    }

    // ── 1. B2.B — Use shared verifyProjectMembership ───────────────────────
    await verifyProjectMembership(supabase, user.id, project_id, req.headers.get('Origin'));

    // ── 2. Leer caché y evaluar stale ─────────────────────────────────────
    const { data: cached } = await supabase
      .from('ai_analysis_cache')
      .select('*')
      .eq('project_id', project_id)
      .eq('analysis_level', level)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Máximo updated_at de fuentes externas (para stale detection)
    const { data: lastSync } = await supabase
      .from('integration_connections')
      .select('last_sync_at')
      .eq('project_id', project_id)
      .eq('status', 'active')
      .order('last_sync_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestSync = lastSync?.last_sync_at ?? null;
    const isStale = cached
      ? (latestSync && latestSync > cached.generated_at) || new Date() > new Date(cached.expires_at)
      : false;

    // Devolver caché si válido y no stale y dentro de 24h
    if (cached && !isStale && within24h(cached.generated_at)) {
      return new Response(JSON.stringify({
        ...cached.output,
        cached: true,
        generated_at: cached.generated_at,
        is_stale: false,
      }), { status: 200, headers });
    }

    // ── 3. Recopilar datos según nivel ────────────────────────────────────
    const [
      { data: project },
      { data: phaseState },
      { data: riskScore },
      { data: probability },
      { data: decisionEvents },
    ] = await Promise.all([
      supabase.from('projects').select('nombre, descripcion, onboarding_data, created_at').eq('id', project_id).single(),
      supabase.from('project_phase_state').select('current_phase, sub_state, computed_at').eq('project_id', project_id).maybeSingle(),
      supabase.from('project_risk_score').select('total_score, risk_level, computed_at').eq('project_id', project_id).maybeSingle(),
      supabase.from('project_probability').select('probability, factors, computed_at').eq('project_id', project_id).maybeSingle(),
      supabase.from('decision_events').select('event_type, payload, created_at').eq('project_id', project_id).order('created_at', { ascending: false }).limit(10),
    ]);

    // Máximo updated_at de Level 1 (para registrar en caché)
    const level1Dates = [
      project?.created_at,
      phaseState?.computed_at,
      riskScore?.computed_at,
      probability?.computed_at,
    ].filter(Boolean) as string[];
    let lastDataUpdatedAt = level1Dates.reduce((a, b) => (a > b ? a : b), '1970-01-01');

    const projectContext = {
      nombre: project?.nombre,
      descripcion: project?.descripcion,
      onboarding: project?.onboarding_data,
      fase_actual: phaseState?.current_phase ?? 1,
      sub_estado: phaseState?.sub_state,
      risk_score: riskScore?.total_score,
      risk_level: riskScore?.risk_level,
      probability: probability?.probability,
      probability_factors: probability?.factors,
      decision_events: decisionEvents ?? [],
    };

    // Datos Level 2
    let level2Context: Record<string, unknown> = {};
    if (level >= 2) {
      const [
        { data: connections },
        { data: recentInsights },
        { data: metrics },
      ] = await Promise.all([
        supabase.from('integration_connections').select('provider, status, last_sync_at').eq('project_id', project_id).eq('status', 'active'),
        supabase.from('integration_insights').select('agent_type, insight_type, payload, confidence, created_at').eq('project_id', project_id).eq('status', 'approved').order('created_at', { ascending: false }).limit(10),
        supabase.from('key_metrics').select('date, mrr, burn_rate, runway_months, cash_balance, churn_rate, total_customers').eq('project_id', project_id).order('date', { ascending: false }).limit(12),
      ]);

      const l2Dates = [
        ...(connections ?? []).map(c => c.last_sync_at).filter(Boolean),
        ...(metrics ?? []).map(m => m.date).filter(Boolean),
      ] as string[];
      if (l2Dates.length) {
        const l2Max = l2Dates.reduce((a, b) => (a > b ? a : b));
        if (l2Max > lastDataUpdatedAt) lastDataUpdatedAt = l2Max;
      }

      // AUD.A.3: top-3 insights de mayor confianza para anclar el análisis
      const topAgentInsights = (recentInsights ?? [])
        .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
        .slice(0, 3);

      level2Context = {
        integraciones_activas: connections ?? [],
        insights_aprobados: recentInsights ?? [],
        // AUD.A.3: top-3 destacados — el prompt los prioriza sobre otras señales
        top_agent_insights: topAgentInsights,
        metricas: metrics ?? [],
      };
    }

    // Datos Level 3
    let level3Context: Record<string, unknown> = {};
    if (level >= 3) {
      const [
        { data: economicProfile },
        { data: probabilityHistory },
        { data: strategicBlocks },
      ] = await Promise.all([
        supabase.from('project_economic_profile').select('model_type, avg_ticket, sales_cycle_days, retention_rate, margin_percent, incoherences, computed_at').eq('project_id', project_id).maybeSingle(),
        supabase.from('project_probability_history').select('probability, computed_at').eq('project_id', project_id).gte('computed_at', new Date(Date.now() - 90 * 86_400_000).toISOString()).order('computed_at', { ascending: true }),
        supabase.from('strategic_blocks').select('block_type, severity, description, resolution_hint, created_at').eq('project_id', project_id).is('resolved_at', null).order('created_at', { ascending: false }).limit(10),
      ]);

      const l3Dates = [
        economicProfile?.computed_at,
        ...(strategicBlocks ?? []).map(b => b.created_at),
      ].filter(Boolean) as string[];
      if (l3Dates.length) {
        const l3Max = l3Dates.reduce((a, b) => (a > b ? a : b));
        if (l3Max > lastDataUpdatedAt) lastDataUpdatedAt = l3Max;
      }

      level3Context = {
        perfil_economico: economicProfile,
        historial_probabilidad: probabilityHistory ?? [],
        bloques_estrategicos: strategicBlocks ?? [],
      };
    }

    // ── 4. Construir prompt ───────────────────────────────────────────────
    // F20.V2.5: calcular días activos para calibración de datos escasos
    const createdAt = project?.created_at ? new Date(project.created_at) : new Date();
    const daysActive = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);

    const dataPayload = {
      nivel: level,
      dias_activo: daysActive,  // F20.V2.5 — explícito para calibración
      proyecto: projectContext,
      ...(level >= 2 ? { datos_externos: level2Context } : {}),
      ...(level >= 3 ? { datos_avanzados: level3Context } : {}),
      contexto_adicional: additional_context ?? null,
    };

    const outputSchema = buildOutputSchema(level);
    // AUD.A.3: extraer top_agent_insights del payload para destacarlos en el prompt
    const topInsightsSummary = level >= 2 && (dataPayload as Record<string, unknown>).datos_externos
      ? ((dataPayload as Record<string, unknown>).datos_externos as Record<string, unknown>)?.top_agent_insights as Array<{agent_type?: string; payload?: Record<string, unknown>; confidence?: number}> ?? []
      : [];

    const topInsightsBlock = topInsightsSummary.length > 0
      ? `\nINSIGHTS DE MAYOR CONFIANZA (no contradecir sin evidencia explícita):
${topInsightsSummary.map((ins, i) => `${i + 1}. [${ins.agent_type ?? 'agente'}] ${JSON.stringify(ins.payload ?? {}).slice(0, 200)} (confianza: ${ins.confidence ?? 'n/a'})`).join('\n')}\n`
      : '';

    // F20 Upgrade 4: focus area deepening
    const FOCUS_AREA_PROMPTS: Record<string, string> = {
      finanzas: 'Profundiza especialmente en: runway, burn rate, MRR trends, pricing strategy, unit economics. Da recomendaciones financieras concretas.',
      equipo: 'Profundiza especialmente en: estructura del equipo, roles faltantes, velocidad de ejecucion, skills gaps, contrataciones criticas.',
      producto: 'Profundiza especialmente en: product-market fit, iteracion, feedback loops, feature prioritization, metricas de uso.',
      ventas: 'Profundiza especialmente en: pipeline health, conversion rates, sales cycle, customer acquisition cost, deal velocity.',
      ejecucion: 'Profundiza especialmente en: velocidad de iteracion, cumplimiento de deadlines, bloqueos, deuda tecnica, ritmo de sprints.',
    };
    const focusBlock = focus_area && FOCUS_AREA_PROMPTS[focus_area]
      ? `\nFOCO ESPECIAL SOLICITADO POR EL FOUNDER:\n${FOCUS_AREA_PROMPTS[focus_area]}\n`
      : '';

    const userPrompt = `Analiza este proyecto y genera el informe estratégico nivel ${level}.

DATOS DEL PROYECTO:
${JSON.stringify(dataPayload, null, 2)}
${topInsightsBlock}${focusBlock}
SCHEMA DE SALIDA REQUERIDO:
${JSON.stringify(outputSchema, null, 2)}

Genera el análisis siguiendo exactamente ese schema. Sé honesto, directo y útil.
Cada campo de "reliability" debe ser 0-1 según la calidad del dato subyacente.
Los "data_sources" deben listar exactamente qué fuente respaldó cada sección.

REGLAS PARA "contradictions":
- Solo incluye contradicciones explícitas: una decisión pasada que directamente choca con el estado actual.
- Cita la decisión previa con sus propias palabras (o paráfrasis breve) y su fecha si está disponible.
- NO inventes contradicciones débiles o especulativas — mejor dejar el array vacío.
- Máximo 3 contradicciones; si no hay ninguna clara, devuelve [].
- Cada contradicción debe ser accionable: el founder debe poder hacer algo al respecto.`;

    // ── 5. Llamar a Claude ────────────────────────────────────────────────
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
    });

    const analysisStart = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: level === 3 ? 4096 : level === 2 ? 3000 : 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const analysisDurationMs = Date.now() - analysisStart;

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    let analysisOutput: Record<string, unknown>;
    try {
      // Claude a veces envuelve en ``json ... ``
      const clean = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      analysisOutput = JSON.parse(clean);
    } catch {
      return new Response(JSON.stringify({ error: 'Error parseando respuesta de IA' }), {
        status: 500, headers,
      });
    }

    // Log AI call
    await logAICall({
      supabaseClient: supabase,
      projectId: project_id,
      userId: user.id,
      functionName: 'analyze-project-v4',
      inputData: { project_id, level },
      outputData: null,
      success: true,
      executionTimeMs: analysisDurationMs,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      modelUsed: 'claude-sonnet-4-6',
    });

    // ── 6. Calcular data_sources para transparencia ───────────────────────
    const dataSources = buildDataSources(level, projectContext, level2Context, level3Context);

    // ── 7. Guardar en caché (upsert) ──────────────────────────────────────
    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;
    const now = new Date().toISOString();

    // Insert (not upsert) — keeps history for AnalysisDiff comparison
    await supabase.from('ai_analysis_cache').insert({
      project_id,
      analysis_level: level,
      generated_at: now,
      expires_at: expiresAt(level),
      last_data_updated_at: lastDataUpdatedAt,
      data_sources: dataSources,
      output: analysisOutput,
      tokens_used: tokensUsed,
      model: 'claude-sonnet-4-6',
      additional_context: additional_context ?? null,
    });

    // ── AUD.M.7: auto-crear hasta 3 tareas desde urgent_decisions ─────────
    // Cada urgent_decision con action_plan genera una tarea con el day=1 action como título.
    // Solo se crean si la decisión tiene action_plan con al menos 1 entrada.
    try {
      const urgentDecisions = (
        (analysisOutput as Record<string, unknown>)?.sections as Record<string, unknown>
      )?.urgent_decisions as Array<{
        title?: string;
        action_plan?: Array<{ day: number; action: string }>;
      }> | undefined;

      if (Array.isArray(urgentDecisions) && urgentDecisions.length > 0) {
        const tasksToInsert = urgentDecisions
          .slice(0, 3)
          .map(dec => {
            const day1Action = dec.action_plan?.find(ap => ap.day === 1)?.action;
            if (!day1Action) return null;
            return {
              project_id,
              titulo: day1Action.slice(0, 250),  // columna real: titulo
              descripcion: dec.title ?? null,     // columna real: descripcion
              status: 'todo',                     // task_status enum: 'todo'
              source: 'optimus',                  // M18.14: nuevo valor de source
              ai_generated: true,
            };
          })
          .filter((t): t is NonNullable<typeof t> => t !== null);

        if (tasksToInsert.length > 0) {
          await supabase.from('tasks').insert(tasksToInsert);
          // Silently ignore insert errors — task creation is best-effort
        }
      }
    } catch {
      // Non-critical: auto-task creation failure must NOT abort the analysis response
    }

    return new Response(JSON.stringify({
      ...analysisOutput,
      cached: false,
      generated_at: now,
      is_stale: false,
      data_sources: dataSources,
      tokens_used: tokensUsed,
    }), { status: 200, headers });

  } catch (err) {
    console.error('analyze-project-v4 error:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
});

// ── Schema builder ────────────────────────────────────────────────────────────

function buildOutputSchema(level: number): Record<string, unknown> {
  const base = {
    confidence_overall: '0.0-1.0 (confianza global del análisis)',
    sections: {
      executive_summary: {
        paragraph: 'string — 3-5 líneas sobre el estado del proyecto',
        strengths: ['string x3 — fortalezas concretas'],
        risks: ['string x3 — riesgos inmediatos'],
        momentum_score: '1-10 — puntuación de momentum actual',
      },
      phase_fit: {
        verdict: '"Sí" | "No" | "Parcialmente"',
        reasons: [{ text: 'string', reliability: '0-1' }],
        recommendation: 'string — qué debería enfocar esta semana',
        benchmark_note: 'string — comparación con proyectos en fase similar',
      },
      urgent_decisions: [
        {
          title: 'string',
          context: 'string — 1 línea de por qué es urgente',
          consequence: 'string — qué pasa si no se decide',
          cta: { label: 'string — ej: Ir a OBVs', view: 'string — nombre de vista de app' },
          // AUD.M.7: plan de acción en 3 horizontes temporales
          action_plan: [
            { day: 1,  action: 'string — qué hacer en las próximas 24h' },
            { day: 3,  action: 'string — qué hacer en los próximos 3 días' },
            { day: 7,  action: 'string — qué hacer en los próximos 7 días' },
          ],
        },
      ],
      contradictions: [
        {
          past_decision: 'string — decisión tomada antes, citada textualmente o parafraseada',
          decided_at: 'string ISO | null — fecha aproximada si está en los datos',
          current_reality: 'string — cómo está la situación hoy',
          tension: 'string — por qué hay contradicción y qué implica',
        },
      ],
    },
  };

  if (level >= 2) {
    (base.sections as Record<string, unknown>).financial_pulse = {
      mrr_current: 'number | null',
      mrr_trend: '"subiendo" | "estable" | "bajando" | null',
      runway_months: 'number | null',
      burn_signal: 'string | null — observación sobre cash',
      data_freshness_note: 'string | null — si los datos tienen más de 3 días',
    };
    (base.sections as Record<string, unknown>).pipeline_traction = {
      deals_count: 'number | null',
      close_rate_note: 'string | null',
      at_risk_count: 'number | null',
      revenue_potential: 'number | null',
      source: '"stripe" | "hubspot" | "obvs" | null',
    };
  }

  if (level >= 3) {
    (base.sections as Record<string, unknown>).cross_signals = [
      {
        signal: 'string — descripción de la correlación cruzada',
        sources: ['string — fuentes involucradas'],
        reliability: '0-1',
        implication: 'string — qué significa para el negocio',
      },
    ];
    (base.sections as Record<string, unknown>).hard_truths = [
      {
        truth: 'string — la verdad incómoda, sin suavizar',
        data_support: 'string — el dato concreto que la respalda',
        source: 'string',
        risk_if_ignored: 'string — consecuencia de no actuar',
        reliability: '0-1',
      },
    ];
  }

  return base;
}

// ── Data sources builder ──────────────────────────────────────────────────────

function buildDataSources(
  level: number,
  l1: Record<string, unknown>,
  l2: Record<string, unknown>,
  _l3: Record<string, unknown>,
): Array<{ name: string; type: string; updated_at: string | null }> {
  const sources: Array<{ name: string; type: string; updated_at: string | null }> = [
    { name: 'Datos de onboarding', type: 'declared', updated_at: null },
    { name: 'Motor de fases', type: 'estimated', updated_at: (l1.decision_events as Array<{ created_at: string }>)?.[0]?.created_at ?? null },
    { name: 'Score de riesgo', type: 'estimated', updated_at: null },
  ];

  if (level >= 2) {
    const conns = (l2.integraciones_activas as Array<{ provider: string; last_sync_at: string }>) ?? [];
    for (const c of conns) {
      sources.push({ name: c.provider, type: 'observed', updated_at: c.last_sync_at });
    }
    sources.push({ name: 'Métricas financieras', type: 'declared', updated_at: null });
  }

  if (level >= 3) {
    sources.push({ name: 'Perfil económico', type: 'estimated', updated_at: null });
    sources.push({ name: 'Histórico de probabilidad', type: 'estimated', updated_at: null });
    sources.push({ name: 'Bloques estratégicos', type: 'observed', updated_at: null });
  }

  return sources;
}
