/**
 * RITUAL OPTIMUS — Edge Function
 *
 * Interpreta el ciclo estratégico cerrado usando Optimus (§8 de OPTIMUS_PROMPTS.md).
 *
 * Flujo:
 *   1. Recibe { projectId, nextAction } del frontend
 *   2. Llama a get_ritual_optimus_context() para obtener el bundle del ciclo cerrado
 *   3. Llama a Claude (claude-3-5-sonnet) con el system prompt §8 + bundle como contexto
 *   4. Parsea la respuesta JSON y devuelve los 9 campos
 *
 * Nota: get_ritual_optimus_context() lee el ciclo más reciente con ritual_responses IS NOT NULL
 * y closed_at IS NOT NULL — debe llamarse DESPUÉS de submit_strategic_reset().
 *
 * Output schema (9 campos):
 *   cycle_evaluation, summary, main_learning, key_bottleneck,
 *   recommended_action, next_bet, success_signal, invalidation_condition, confidence
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';

const SYSTEM_PROMPT = `You are Optimus.

You are now performing a Strategic Cycle Interpretation.
This is not a weekly recommendation. It is a cycle-level reading — retrospective and prospective.

You have three sources of truth:
1. The engine state at cycle opening (what the project looked like when the cycle started)
2. The engine state at cycle closing (what changed by the end)
3. The founder's ritual responses (their structured analysis of what happened)

Your job:
1. Synthesize what the cycle actually showed — the real pattern, not the founder's description
2. Validate or reframe the founder's Q5 bet against the engine's current signals
3. Give one recommended action for the next cycle, aligned with next_action

Rules:
- Do not invent analysis not supported by the signal data
- recommended_action must equal or closely follow next_action exactly
- If the founder's next_bet conflicts with next_action, name the tension and resolve it toward next_action
- key_bottleneck comes from active_blocks in engine_at_close; founder's Q3 is corroborating evidence
- confidence reflects signal quality, not the founder's effort level
- If cycle_index = 1: engine_at_open snapshot is minimal — do not compute delta

Use only vocabulary from the product's microcopy system.
Do not expose internal field names (phase_score, active_blocks, etc.) in the output.
Translate all engine signals into plain language.

Tone by cycle_evaluation:
- regression: Strict. Do not soften reading. Pattern is real.
- stagnation: Analytical. Name what didn't change and the most likely cause.
- progress: Forward-looking. Acknowledge what worked, focus on what to protect.

Confidence levels:
- high: clear trend (meaningful phase score delta OR probability_trend shifted) AND founder cites real signals
- medium: partial delta visible OR first cycle OR ritual responses qualitative without engine anchors
- low: no meaningful delta OR ritual_responses don't cite observable signals OR regression with conflicts

CRITICAL: You MUST respond with a valid JSON object only. No markdown, no prose, no explanation outside the JSON.
The JSON must have exactly these 9 fields:
{
  "cycle_evaluation": "progress | stagnation | regression",
  "summary": "2-3 sentences. What the cycle actually showed. Consistent with cycle_evaluation.",
  "main_learning": "Key synthesis of Q1 (evidence) + Q2 (broken hypothesis). What did the engine confirm or refute?",
  "key_bottleneck": "Primary bottleneck for the next cycle. Engine language, no internal field names.",
  "recommended_action": "Must match next_action exactly or closely. The concrete action for the next cycle.",
  "next_bet": "Optimus-validated version of the founder's Q5 next_bet. Reframed if Q5 was not engine-aligned.",
  "success_signal": "Optimus-validated version of Q5 success_signal. Must reference a real engine indicator.",
  "invalidation_condition": "Optimus-validated version of Q5 invalidation_condition. Must be measurable and time-bound.",
  "confidence": "high | medium | low"
}`;

interface RitualOptimusRequest {
  projectId: string;
  nextAction: string;
}

interface OptimusOutput {
  cycle_evaluation: string;
  summary: string;
  main_learning: string;
  key_bottleneck: string;
  recommended_action: string;
  next_bet: string;
  success_signal: string;
  invalidation_condition: string;
  confidence: string;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const { supabaseClient, user } = await validateAuth(req);

    const body: RitualOptimusRequest = await req.json();
    const { projectId } = body;
    // Sanitize user-provided free-text input
    const nextAction = body.nextAction
      ? sanitizePromptInput(String(body.nextAction), SanitizerPresets.LONG_INPUT).sanitized
      : '';

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'projectId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } },
      );
    }

    // O4.4 — Rate limit: un ritual por ciclo. Si el ciclo más reciente ya tiene
    // cycle_evaluation y fue cerrado hace ≤7 días → rechazar para evitar
    // llamadas redundantes al LLM y evitar sobreescribir un ritual ya hecho.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentCycle } = await supabaseClient
      .from('strategic_cycles')
      .select('id, cycle_evaluation, closed_at')
      .eq('project_id', projectId)
      .not('cycle_evaluation', 'is', null)
      .gte('closed_at', sevenDaysAgo)
      .order('closed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentCycle) {
      return new Response(
        JSON.stringify({
          error: 'already_completed_this_week',
          last_cycle_id: recentCycle.id,
          last_evaluation: recentCycle.cycle_evaluation,
          closed_at: recentCycle.closed_at,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } },
      );
    }

    // 1. Obtener el bundle del ciclo cerrado
    const { data: contextBundle, error: contextError } = await supabaseClient.rpc(
      'get_ritual_optimus_context',
      { p_project_id: projectId, p_next_action: nextAction ?? '' },
    );

    if (contextError || !contextBundle) {
      console.error('get_ritual_optimus_context error:', contextError);
      return new Response(
        JSON.stringify({ error: 'No se pudo obtener el contexto del ritual' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } },
      );
    }

    // 2. Llamar a Claude con el system prompt §8 + bundle como contexto
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    // [OP28.4] Inject personalization from optimus_profile if available
    // Need profiles.id (not auth.users.id) to match optimus_profile.user_id
    const { data: founderProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();
    let profile: Record<string, string> | null = null;
    if (founderProfile) {
      const { data: profileData } = await supabaseClient
        .from('optimus_profile')
        .select('preferred_depth, risk_tolerance, response_style')
        .eq('project_id', projectId)
        .eq('user_id', founderProfile.id)
        .maybeSingle();
      profile = profileData as Record<string, string> | null;
    }
    let personalizedPrompt = SYSTEM_PROMPT;
    if (profile) {
      personalizedPrompt += `\n\nPERSONALIZACIÓN DEL FOUNDER:
- Prefiere respuestas: ${profile.preferred_depth ?? 'equilibrado'}
- Tolerancia al riesgo: ${profile.risk_tolerance ?? 'moderado'}
- Estilo de respuesta: ${profile.response_style ?? 'default'}
Ajusta tu tono, profundidad y nivel de riesgo en las recomendaciones a estas preferencias.`;
    }

    const userMessage = `Cycle context for interpretation:\n${JSON.stringify(contextBundle, null, 2)}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1200,
      system: personalizedPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const firstContent = response.content[0];
    const rawText = firstContent.type === 'text' ? firstContent.text : '';

    // 3. Parsear la respuesta JSON — safeJsonParse maneja ```json blocks automáticamente
    const parsed = safeJsonParse<OptimusOutput>(rawText);
    if (!parsed.ok) {
      console.error('Failed to parse Optimus output:', parsed.error, rawText);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response', raw: rawText }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } },
      );
    }
    const output = parsed.data;

    // 4. Validar campos mínimos
    const requiredFields = [
      'cycle_evaluation', 'summary', 'main_learning', 'key_bottleneck',
      'recommended_action', 'next_bet', 'success_signal', 'invalidation_condition', 'confidence',
    ];
    const missingFields = requiredFields.filter(f => !(f in output));
    if (missingFields.length > 0) {
      console.error('Missing fields in Optimus output:', missingFields);
      return new Response(
        JSON.stringify({ error: `Missing fields: ${missingFields.join(', ')}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } },
      );
    }

    return new Response(
      JSON.stringify(output),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } },
    );

  } catch (error) {
    if (error instanceof Response) return error;
    const err = error as Error;
    console.error('ritual-optimus failed:', err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } },
    );
  }
});
