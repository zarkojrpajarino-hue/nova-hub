/**
 * ai-phase-graduation-advisor — V5.6.5
 *
 * Analyzes decision_events + cycle performance to recommend phase graduation.
 * Returns { recommended: boolean, confidence: number, reasons: string[] }.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';
import { logAICall } from '../_shared/aiLogger.ts';
import { enforceAICallLimit } from '../_shared/aiLimitCheck.ts';

interface GraduationAdvice {
  recommended: boolean;
  confidence: number;
  reasons: string[];
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);

    // V5.6.14 — Per-function rate limit
    const rl = await checkRateLimit(`ai_fn_phase_graduation_${user.id}`, 'ai-phase-graduation-advisor', RateLimitPresets.AI_GENERATION);
    if (!rl.allowed) return createRateLimitResponse(rl, getCorsHeaders(origin));

    const { project_id } = await req.json() as { project_id: string };
    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    await verifyProjectMembership(supabase, user.id, project_id, origin);
    await enforceAICallLimit(supabase, project_id, origin);

    // Gather context data
    const [
      { data: phaseState },
      { data: decisions },
      { data: cycles },
    ] = await Promise.all([
      supabase.from('project_phase_state')
        .select('current_phase, phase_score, phase_status, hard_signal_met, graduation_eligible_since, graduated')
        .eq('project_id', project_id).maybeSingle(),
      supabase.from('decision_events')
        .select('event_type, payload, created_at')
        .eq('project_id', project_id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('strategic_cycles')
        .select('cycle_index, cycle_evaluation, closed_at')
        .eq('project_id', project_id)
        .not('closed_at', 'is', null)
        .order('closed_at', { ascending: false })
        .limit(5),
    ]);

    if (!phaseState) {
      return new Response(JSON.stringify({ error: 'No phase state found' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    const prompt = `Eres Optimus, motor de inteligencia estratégica. Analiza si este proyecto está listo para graduarse a la siguiente fase.

ESTADO DE FASE ACTUAL:
${JSON.stringify(phaseState, null, 2)}

DECISION EVENTS (últimos 20):
${JSON.stringify(decisions ?? [], null, 2)}

CICLOS ESTRATÉGICOS (últimos 5):
${JSON.stringify(cycles ?? [], null, 2)}

REGLAS:
- Si phase_score < 60 y hard_signal_met = false: NO recomendar graduación.
- Si hay ≥2 ciclos con cycle_evaluation = "regression": NO recomendar.
- Si phase_score ≥ 75 y hard_signal_met = true y último ciclo = "progress": recomendar.
- Confidence: 0-1. Alta si hay datos claros, baja si los ciclos son ambiguos.
- Reasons: 2-4 razones concretas basadas en los datos, no genéricas.

Responde SOLO con JSON válido:
{
  "recommended": boolean,
  "confidence": number (0-1),
  "reasons": ["string", ...]
}`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: 'Eres Optimus. Evalúas graduación de fase basándote en evidencia. Responde SOLO JSON.',
      messages: [{ role: 'user', content: prompt }],
    });

    const durationMs = Date.now() - startTime;
    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = safeJsonParse<GraduationAdvice>(rawText);

    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    await logAICall({
      supabaseClient: supabase, projectId: project_id, userId: user.id,
      functionName: 'ai-phase-graduation-advisor', inputData: { project_id },
      outputData: parsed.data, success: true, executionTimeMs: durationMs,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      modelUsed: 'claude-sonnet-4-6',
    });

    return new Response(JSON.stringify(parsed.data), {
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    });

  } catch (error) {
    if (error instanceof Response) return error;
    console.error('ai-phase-graduation-advisor error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin ?? '') },
    });
  }
});
