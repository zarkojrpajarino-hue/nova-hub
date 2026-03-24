/**
 * F22.4 — analyze-expansion-v1
 *
 * Genera análisis de 3 mercados ideales para expansión.
 * Por cada mercado: score, 6 dimensiones, plan de 5 días, costes, tips culturales.
 * Guarda en expansion_analysis_cache (TTL 14 días).
 * Rate limit: 1 análisis / 14 días por proyecto (enforced by cache check).
 */

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { requireEnv } from '../_shared/env-validation.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';
import { logAICall } from '../_shared/aiLogger.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);

    const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

    // Rate limit
    const rateLimitResult = await checkRateLimit(user.id, 'analyze-expansion-v1', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    const body = await req.json();
    const { projectId } = body as { projectId: string };
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    // B2.B — Use shared verifyProjectMembership
    await verifyProjectMembership(supabase, user.id, projectId, origin);

    // Check cache (rate limit: 1 per 14 days)
    const { data: cached } = await supabase
      .from('expansion_analysis_cache')
      .select('id, expires_at, markets')
      .eq('project_id', projectId)
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ success: true, cached: true, markets: cached.markets }),
        { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    // Gather context
    const [projectResult, metricsResult, phaseResult] = await Promise.all([
      supabase.from('projects').select('nombre, descripcion, country, onboarding_data').eq('id', projectId).single(),
      supabase.from('key_metrics').select('mrr, total_customers').eq('project_id', projectId).order('date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('project_phase_state').select('current_phase').eq('project_id', projectId).maybeSingle(),
    ]);

    const project = projectResult.data;
    const metrics = metricsResult.data;
    const onboarding = (project?.onboarding_data ?? {}) as Record<string, unknown>;

    const inputSnapshot = {
      project_name: project?.nombre,
      country: project?.country ?? 'España',
      mrr: metrics?.mrr ?? 0,
      customers: metrics?.total_customers ?? 0,
      phase: phaseResult.data?.current_phase ?? 3,
      sector: onboarding.selected_industry ?? onboarding.sector ?? 'general',
      business_model: onboarding.monetization_type ?? 'unknown',
    };

    // Call Claude for market analysis
    const systemPrompt = `Eres un experto en expansión internacional de startups. Analiza los 3 mejores mercados para este negocio.

RESPONDE SOLO con JSON válido:
{
  "markets": [
    {
      "country": "string",
      "city": "string (ciudad principal recomendada)",
      "overall_score": number (0-100),
      "dimensions": {
        "market_size_fit": number (1-5),
        "regulatory_ease": number (1-5),
        "cultural_proximity": number (1-5),
        "startup_ecosystem": number (1-5),
        "cost_of_exploration": number (1-5),
        "synergy_potential": number (1-5)
      },
      "why_for_your_business": "string (1-2 frases, data-driven)",
      "cultural_tips": ["string (2-3 consejos de negocio)"],
      "five_day_plan": [
        {
          "day": 1,
          "title": "string",
          "activities": ["string"],
          "hypothesis": "string (qué validar ese día)",
          "estimated_cost_eur": number
        }
      ],
      "total_trip_cost": { "min": number, "max": number, "currency": "EUR" }
    }
  ],
  "runner_ups": [
    {
      "country": "string",
      "overall_score": number,
      "excluded_reason": "string"
    }
  ]
}

REGLAS:
- Exactamente 3 mercados en "markets" y 2 en "runner_ups".
- Scores de dimensiones 1-5 (1=peor, 5=mejor).
- Plan de 5 días EXACTOS por mercado.
- Costes en EUR. Incluir vuelo + alojamiento + comidas + transporte local.
- "why_for_your_business" debe referenciar datos ESPECÍFICOS del negocio (sector, MRR, modelo).
- Responde SOLO con JSON válido.`;

    const startTime = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Analiza los 3 mejores mercados de expansión para este negocio:\n\nProyecto: ${inputSnapshot.project_name}\nPaís actual: ${inputSnapshot.country}\nSector: ${inputSnapshot.sector}\nModelo: ${inputSnapshot.business_model}\nMRR: €${inputSnapshot.mrr}/mes\nClientes: ${inputSnapshot.customers}\n\nGenera el análisis completo con plan de 5 días por mercado.`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return new Response(JSON.stringify({ error: 'Error generating analysis' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    const aiResult = await response.json();
    const durationMs = Date.now() - startTime;
    const content = aiResult.content?.[0]?.text ?? '';

    await logAICall({
      supabaseClient: supabase, projectId: projectId, userId: user.id,
      functionName: 'analyze-expansion-v1', inputData: { projectId },
      outputData: content?.slice(0, 500), success: true, executionTimeMs: durationMs,
      tokensUsed: (aiResult.usage?.input_tokens ?? 0) + (aiResult.usage?.output_tokens ?? 0),
      modelUsed: 'claude-sonnet-4-20250514',
    });

    const parsed = safeJsonParse<{ markets: unknown[]; runner_ups?: unknown[] }>(content);
    if (!parsed.ok) {
      console.error('Parse error:', content);
      return new Response(JSON.stringify({ error: 'Error parsing analysis' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }
    const analysisData = parsed.data;

    // Validate: must have 3 markets
    if (!analysisData.markets || analysisData.markets.length < 2) {
      return new Response(JSON.stringify({ error: 'AI generated fewer than 2 markets' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
    }

    // Save to cache
    const expiresAt = new Date(Date.now() + 14 * 86_400_000).toISOString();
    const { error: insertErr } = await supabase
      .from('expansion_analysis_cache')
      .insert({
        project_id: projectId,
        expires_at: expiresAt,
        input_snapshot: inputSnapshot,
        output: analysisData,
        markets: analysisData.markets,
      });

    if (insertErr) {
      console.error('Cache insert error:', insertErr);
    }

    return new Response(JSON.stringify({ success: true, cached: false, ...analysisData }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });

  } catch (error: unknown) {
    if (error instanceof Response) return error;
    console.error('Error in analyze-expansion-v1:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } });
  }
});
