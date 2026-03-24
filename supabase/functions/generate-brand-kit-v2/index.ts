/**
 * generate-brand-kit-v2 — F21.7a
 *
 * Genera propuesta de valor, mensajes clave, tono y headline basándose en:
 *   - onboarding_data del proyecto
 *   - Buyer Persona generada
 *   - Pitches enviados (integration_insights tipo email_pitch)
 * TTL: 30 días.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';

const TOOL_TYPE = 'brand_kit';
const TTL_DAYS = 30;
const AI_CACHE_TTL_DAYS = 180; // V5.6.3 — Brand kit is long-lived

function expiresAt(): string { const d = new Date(); d.setDate(d.getDate() + TTL_DAYS); return d.toISOString(); }

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const headers = getCorsHeaders(req);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);
    // V5.6.14 — Per-function rate limit with function-specific key
    const rl = await checkRateLimit(`ai_fn_brand_kit_${user.id}`, 'generate-brand-kit-v2', RateLimitPresets.AI_GENERATION);
    if (!rl.allowed) return createRateLimitResponse(rl, headers);

    const { project_id } = await req.json() as { project_id: string };
    if (!project_id) return new Response(JSON.stringify({ error: 'project_id requerido' }), { status: 400, headers });

    const [{ data: membership }, { data: proj }] = await Promise.all([
      supabase.from('project_members').select('id').eq('project_id', project_id).eq('member_id', user.id).maybeSingle(),
      supabase.from('projects').select('id, nombre, descripcion, onboarding_data, created_by').eq('id', project_id).maybeSingle(),
    ]);
    if (!proj || (!membership && (proj as Record<string, unknown>).created_by !== user.id)) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers });
    }

    // V5.6.3 — Check ai_analysis_cache first (TTL 180 days)
    const { data: aiCached } = await supabase.from('ai_analysis_cache')
      .select('output, generated_at, data_sources')
      .eq('project_id', project_id).eq('cache_key', 'brand_kit').maybeSingle();
    const aiCacheAge = aiCached ? (Date.now() - new Date(aiCached.generated_at).getTime()) / 86_400_000 : Infinity;
    if (aiCached && aiCacheAge < AI_CACHE_TTL_DAYS) {
      return new Response(JSON.stringify({ ...aiCached.output, cached: true, generated_at: aiCached.generated_at, cache_age_days: Math.round(aiCacheAge) }), { status: 200, headers });
    }

    // Legacy founder_tool_cache check
    const { data: cached } = await supabase.from('founder_tool_cache').select('*')
      .eq('project_id', project_id).eq('tool_type', TOOL_TYPE).maybeSingle();
    const isStale = cached ? new Date() > new Date(cached.expires_at) : false;
    const within24h = cached ? Date.now() - new Date(cached.generated_at).getTime() < 24 * 3_600_000 : false;
    if (cached && !isStale && within24h) {
      return new Response(JSON.stringify({ ...cached.output, cached: true, generated_at: cached.generated_at }), { status: 200, headers });
    }

    const [{ data: bpCache }, { data: pitches }] = await Promise.all([
      supabase.from('founder_tool_cache').select('output').eq('project_id', project_id).eq('tool_type', 'buyer_persona').maybeSingle(),
      supabase.from('integration_insights').select('payload, created_at').eq('project_id', project_id).eq('insight_type', 'email_pitch').order('created_at', { ascending: false }).limit(5),
    ]);

    const outputSchema = {
      propuesta_valor: 'string — en 1 frase clara: [para quién] + [qué hace] + [diferenciador]',
      mensajes_clave: ['string x3 — mensajes nucleares de la marca'],
      tono: '"formal" | "cercano" | "técnico" | "inspirador"',
      palabras_usar: ['string x5 — términos que refuerzan la marca'],
      palabras_evitar: ['string x3 — términos que debilitan o confunden'],
      headline_web: 'string — headline principal para la home (máx 10 palabras)',
      tagline: 'string — tagline memorable (máx 6 palabras)',
    };

    const userPrompt = `Genera el Brand Kit para este proyecto.

PROYECTO: ${proj.nombre}
DESCRIPCIÓN: ${proj.descripcion ?? 'N/A'}
ONBOARDING: ${JSON.stringify(proj.onboarding_data)}

BUYER PERSONA:
${bpCache?.output ? JSON.stringify(bpCache.output, null, 2) : 'No disponible'}

PITCHES ENVIADOS (${pitches?.length ?? 0}):
${pitches?.length ? JSON.stringify(pitches.map(p => (p.payload as Record<string, unknown>)?.subject ?? p.payload), null, 2) : 'Ninguno'}

SCHEMA: ${JSON.stringify(outputSchema, null, 2)}

REGLAS:
- La propuesta de valor debe ser específica para ESTE negocio, no genérica.
- Los mensajes clave deben resonar con la Buyer Persona detectada.
- El tono debe surgir del análisis de los pitches si los hay.
- Responde SOLO con JSON válido.`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 1500,
      system: 'Eres Optimus, motor de inteligencia estratégica. Generas Brand Kits honestos y específicos. Responde ÚNICAMENTE con JSON válido.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const durationMs = Date.now() - startTime;
    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    let output: Record<string, unknown>;
    try { output = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()); }
    catch { return new Response(JSON.stringify({ error: 'Error parseando respuesta de IA' }), { status: 500, headers }); }

    await logAICall({
      supabaseClient: supabase, projectId: project_id, userId: user.id,
      functionName: 'generate-brand-kit-v2', inputData: { project_id },
      outputData: rawText?.slice(0, 500), success: true, executionTimeMs: durationMs,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens, modelUsed: 'claude-sonnet-4-6',
    });

    const dataSources = [
      { name: 'Onboarding del proyecto', type: 'declared', updated_at: null },
      ...(bpCache?.output ? [{ name: 'Buyer Persona', type: 'inferred', updated_at: null }] : []),
      ...(pitches?.length ? [{ name: `${pitches.length} pitches`, type: 'observed', updated_at: pitches[0]?.created_at ?? null }] : []),
    ];

    const now = new Date().toISOString();
    await supabase.from('founder_tool_cache').upsert({ project_id, tool_type: TOOL_TYPE, generated_at: now, expires_at: expiresAt(), data_sources: dataSources, output, tokens_used: message.usage.input_tokens + message.usage.output_tokens }, { onConflict: 'project_id,tool_type' });

    // V5.6.3 — Store in ai_analysis_cache (180d TTL)
    const brandCacheExpires = new Date(); brandCacheExpires.setDate(brandCacheExpires.getDate() + AI_CACHE_TTL_DAYS);
    await supabase.from('ai_analysis_cache').upsert({
      project_id, cache_key: 'brand_kit', analysis_level: 1,
      generated_at: now, expires_at: brandCacheExpires.toISOString(),
      data_sources: dataSources, output,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    }, { onConflict: 'project_id,cache_key' }).catch(() => {});

    return new Response(JSON.stringify({ ...output, cached: false, generated_at: now, data_sources: dataSources }), { status: 200, headers });

  } catch (err) {
    console.error('generate-brand-kit-v2 error:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
});
