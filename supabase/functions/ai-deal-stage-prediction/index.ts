/**
 * ai-deal-stage-prediction — V5.6.6
 *
 * Analyzes lead history + engagement patterns to predict next likely
 * pipeline stage for each lead.
 * Takes project_id + lead_ids, returns predictions per lead.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';
import { logAICall } from '../_shared/aiLogger.ts';
import { enforceAICallLimit } from '../_shared/aiLimitCheck.ts';

interface DealPrediction {
  lead_id: string;
  current_stage: string;
  predicted_next_stage: string;
  confidence: number;
  reasoning: string;
  days_to_move: number | null;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);

    // V5.6.14 — Per-function rate limit
    const rl = await checkRateLimit(`ai_fn_deal_prediction_${user.id}`, 'ai-deal-stage-prediction', RateLimitPresets.AI_GENERATION);
    if (!rl.allowed) return createRateLimitResponse(rl, getCorsHeaders(origin));

    const { project_id, lead_ids } = await req.json() as { project_id: string; lead_ids?: string[] };
    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    await verifyProjectMembership(supabase, user.id, project_id, origin);
    await enforceAICallLimit(supabase, project_id, origin);

    // Fetch leads (OBVs with pipeline)
    let leadsQuery = supabase
      .from('obvs')
      .select('id, titulo, nombre_contacto, empresa, pipeline_status, valor_potencial, notas, proxima_accion, created_at, updated_at')
      .eq('project_id', project_id)
      .not('pipeline_status', 'is', null)
      .order('updated_at', { ascending: false });

    if (lead_ids?.length) {
      leadsQuery = leadsQuery.in('id', lead_ids);
    } else {
      leadsQuery = leadsQuery.limit(15);
    }

    const [{ data: leads }, { data: pipelineHistory }] = await Promise.all([
      leadsQuery,
      supabase.from('obv_pipeline_history')
        .select('obv_id, from_status, to_status, created_at')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (!leads?.length) {
      return new Response(JSON.stringify({ predictions: [], message: 'No leads found' }), {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    const prompt = `Eres un experto en ventas B2B. Analiza estos leads y predice a qué etapa del pipeline se moverán próximamente.

LEADS ACTUALES:
${JSON.stringify(leads, null, 2)}

HISTORIAL DE MOVIMIENTOS EN PIPELINE:
${JSON.stringify(pipelineHistory ?? [], null, 2)}

ETAPAS DEL PIPELINE (en orden): frio → tibio → caliente → negociacion → cerrado_ganado / cerrado_perdido

REGLAS:
- Basa tus predicciones en el historial real de movimientos, no en suposiciones.
- Si un lead lleva >30 días sin moverse, es señal de estancamiento.
- Confidence: 0-1 basado en cantidad de evidencia disponible.
- days_to_move: estimación en días, null si no hay evidencia suficiente.

Responde SOLO con JSON:
{
  "predictions": [
    {
      "lead_id": "uuid",
      "current_stage": "string",
      "predicted_next_stage": "string",
      "confidence": number,
      "reasoning": "string breve",
      "days_to_move": number | null
    }
  ]
}`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: 'Eres un analista de pipeline CRM. Predices movimientos de deals basándote en patrones reales. Responde SOLO JSON.',
      messages: [{ role: 'user', content: prompt }],
    });

    const durationMs = Date.now() - startTime;
    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = safeJsonParse<{ predictions: DealPrediction[] }>(rawText);

    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    await logAICall({
      supabaseClient: supabase, projectId: project_id, userId: user.id,
      functionName: 'ai-deal-stage-prediction', inputData: { project_id, lead_count: leads.length },
      outputData: rawText?.slice(0, 500), success: true, executionTimeMs: durationMs,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      modelUsed: 'claude-sonnet-4-6',
    });

    return new Response(JSON.stringify(parsed.data), {
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    });

  } catch (error) {
    if (error instanceof Response) return error;
    console.error('ai-deal-stage-prediction error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin ?? '') },
    });
  }
});
