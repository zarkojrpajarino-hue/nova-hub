/**
 * EQ26.11 — generate-hiring-guidance
 *
 * Genera guía de contratación para un rol específico:
 * - Rango salarial por mercado
 * - Equity guidance por stage
 * - Canales de hiring
 * - Preguntas de entrevista
 * - Red flags
 * - Alternativas (freelancer/herramienta)
 */

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';
import { logAICall } from '../_shared/aiLogger.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);

    const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

    // Rate limit
    const rateLimitResult = await checkRateLimit(user.id, 'generate-hiring-guidance', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    const body = await req.json();
    const { projectId, roleName } = body as { projectId: string; roleName: string };

    if (!projectId || !roleName) {
      return new Response(JSON.stringify({ error: 'projectId and roleName required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    // Sanitize user input
    const roleNameSanitized = sanitizePromptInput(roleName, SanitizerPresets.SHORT_INPUT);
    if (roleNameSanitized.blocked) {
      return new Response(JSON.stringify({ error: roleNameSanitized.reason }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    // B2.B — Use shared verifyProjectMembership
    await verifyProjectMembership(supabase, user.id, projectId, origin);

    const { data: project } = await supabase
      .from('projects')
      .select('nombre, country, onboarding_data')
      .eq('id', projectId)
      .single();

    const { data: phaseState } = await supabase
      .from('project_phase_state')
      .select('current_phase')
      .eq('project_id', projectId)
      .maybeSingle();

    const country = project?.country || 'España';
    const phase = phaseState?.current_phase ?? 1;
    const stageLabel = phase <= 1 ? 'pre-seed/seed' : phase <= 3 ? 'early-stage' : 'growth';

    const systemPrompt = `Eres un experto en hiring y talent acquisition para startups en ${country}.

CONTEXTO:
- Stage del proyecto: ${stageLabel}
- País: ${country}
- Fase del motor: ${phase}/4

REGLAS:
- salary_range SIEMPRE en EUR mensuales brutos. Rango realista para ${country} y el stage ${stageLabel}.
- Para pre-seed/seed: priorizar alternativas (freelancers, herramientas) sobre contratación full-time.
- interview_questions: máximo 5, específicas para el rol, no genéricas.
- red_flags: señales concretas de mala contratación para este rol en una startup.
- DISCLAIMER: Esto es orientativo. Consultar con un asesor laboral para condiciones contractuales.

RESPONDE SOLO con JSON válido:
{
  "salary_range": { "min": number, "max": number, "currency": "EUR", "period": "monthly" },
  "equity_guidance": "string (% típico para este stage)",
  "hiring_channels": ["string (máximo 5, ordenados por efectividad para startups)"],
  "interview_questions": ["string (máximo 5, específicas para el rol)"],
  "red_flags": ["string (máximo 5)"],
  "alternative": "string (qué hacer si no puede contratar: freelancer, herramienta, o reorganizar equipo)",
  "disclaimer": "Orientativo. Consultar asesor laboral para condiciones contractuales."
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',  // [SCALE] Updated to Haiku 4.5
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Proyecto: ${project?.nombre}. País: ${country}. Stage: ${stageLabel}. Rol a contratar: ${roleNameSanitized.sanitized}. Genera la guía de contratación.`,
        }],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Error generating guidance' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text ?? '';

    const parsed = safeJsonParse(content);
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Error parsing AI response' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }
    const guidance = parsed.data as Record<string, unknown>;

    // [B10] Validate salary_range is reasonable
    const salary = guidance?.salary_range;
    if (salary) {
      if (salary.min < 500 || salary.max > 30000) {
        salary.min = Math.max(500, salary.min);
        salary.max = Math.min(30000, salary.max);
      }
      if (salary.min > salary.max) {
        const tmp = salary.min;
        salary.min = salary.max;
        salary.max = tmp;
      }
    }

    return new Response(JSON.stringify({ success: true, guidance }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });

  } catch (error: unknown) {
    if (error instanceof Response) return error;
    console.error('Error in generate-hiring-guidance:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
  }
});
