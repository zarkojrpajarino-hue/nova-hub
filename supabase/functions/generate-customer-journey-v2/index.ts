/**
 * generate-customer-journey-v2 — F21.8
 *
 * Genera el mapa de etapas del Customer Journey basándose en:
 *   - Stripe subscriptions via integration_entities
 *   - OBVs cerradas ganadas
 *   - Buyer Persona (si existe)
 *   - onboarding_data
 * TTL: 14 días.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import { logAICall } from '../_shared/aiLogger.ts';

const TOOL_TYPE = 'customer_journey';
const TTL_DAYS = 14;

function expiresAt(): string { const d = new Date(); d.setDate(d.getDate() + TTL_DAYS); return d.toISOString(); }

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const headers = getCorsHeaders(req);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);
    const rl = await checkRateLimit(supabase, user.id, 'generate-customer-journey-v2', RateLimitPresets.AI_GENERATION);
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

    const { data: cached } = await supabase.from('founder_tool_cache').select('*')
      .eq('project_id', project_id).eq('tool_type', TOOL_TYPE).maybeSingle();
    const isStale = cached ? new Date() > new Date(cached.expires_at) : false;
    const within24h = cached ? Date.now() - new Date(cached.generated_at).getTime() < 24 * 3_600_000 : false;
    if (cached && !isStale && within24h) {
      return new Response(JSON.stringify({ ...cached.output, cached: true, generated_at: cached.generated_at }), { status: 200, headers });
    }

    const [{ data: stripeSubscriptions }, { data: closedObvs }, { data: bpCache }] = await Promise.all([
      supabase.from('integration_entities').select('payload, occurred_at, source_timestamp')
        .eq('project_id', project_id).eq('entity_type', 'subscription').eq('provider', 'stripe')
        .order('occurred_at', { ascending: false }).limit(20),
      supabase.from('obvs').select('titulo, nombre_contacto, empresa, notas, valor_potencial, updated_at')
        .eq('project_id', project_id).eq('pipeline_status', 'cerrado_ganado')
        .order('updated_at', { ascending: false }).limit(15),
      supabase.from('founder_tool_cache').select('output').eq('project_id', project_id).eq('tool_type', 'buyer_persona').maybeSingle(),
    ]);

    const has_stripe_data = (stripeSubscriptions?.length ?? 0) > 0;

    const outputSchema = {
      etapas: [{
        orden: '1-6',
        nombre: 'string — nombre de la etapa (ej: Descubrimiento)',
        punto_contacto: 'string — cómo el cliente llega a esta etapa',
        emocion_cliente: 'string — qué siente el cliente aquí',
        friccion_principal: 'string — el mayor obstáculo en esta etapa',
        accion_equipo: 'string — qué debe hacer el equipo',
        datos_origen: '"observed" | "declared" | "estimated"',
      }],
      nota_datos: 'string | null — nota si los datos son escasos y el journey es estimado',
    };

    const sf = (val: unknown) => val ? sanitizePromptInput(String(val), SanitizerPresets.MEDIUM_INPUT).sanitized : '';
    const userPrompt = `Genera el Customer Journey para este proyecto.

PROYECTO: ${sf(proj.nombre)}
ONBOARDING: ${JSON.stringify(proj.onboarding_data)}

SUBSCRIPCIONES STRIPE (${stripeSubscriptions?.length ?? 0}):
${has_stripe_data ? JSON.stringify(stripeSubscriptions?.slice(0, 10).map(s => ({ status: (s.payload as Record<string, unknown>)?.status, plan: (s.payload as Record<string, unknown>)?.plan, started: s.occurred_at })), null, 2) : 'Sin datos de Stripe'}

CLIENTES GANADOS EN CRM (${closedObvs?.length ?? 0}):
${JSON.stringify((closedObvs ?? []).map(o => ({ empresa: o.empresa, notas: o.notas })).slice(0, 10), null, 2)}

BUYER PERSONA:
${bpCache?.output ? JSON.stringify(bpCache.output, null, 2) : 'No disponible'}

SCHEMA: ${JSON.stringify(outputSchema, null, 2)}

REGLAS:
- Genera 5-6 etapas: Descubrimiento, Consideración, Decisión, Onboarding, Retención, y opcionalmente Expansión.
- Los datos de Stripe son "observed"; los del CRM son "declared"; los inferidos son "estimated".
- Si los datos son escasos, añade nota_datos explicándolo. No inventes etapas sin respaldo.
- Responde SOLO con JSON válido.`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 2000,
      system: 'Eres Optimus, motor de inteligencia estratégica. Generas Customer Journeys honestos con datos reales. Responde ÚNICAMENTE con JSON válido.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    let output: Record<string, unknown>;
    try { output = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()); }
    catch { return new Response(JSON.stringify({ error: 'Error parseando respuesta de IA' }), { status: 500, headers }); }

    const dataSources = [
      ...(has_stripe_data ? [{ name: `${stripeSubscriptions!.length} subscripciones Stripe`, type: 'observed', updated_at: stripeSubscriptions![0]?.occurred_at ?? null }] : []),
      ...(closedObvs?.length ? [{ name: `${closedObvs.length} clientes ganados`, type: 'declared', updated_at: closedObvs[0]?.updated_at ?? null }] : []),
      ...(bpCache?.output ? [{ name: 'Buyer Persona', type: 'inferred', updated_at: null }] : []),
      { name: 'Onboarding del proyecto', type: 'declared', updated_at: null },
    ];

    const now = new Date().toISOString();
    await supabase.from('founder_tool_cache').upsert({ project_id, tool_type: TOOL_TYPE, generated_at: now, expires_at: expiresAt(), data_sources: dataSources, output, tokens_used: message.usage.input_tokens + message.usage.output_tokens }, { onConflict: 'project_id,tool_type' });

    return new Response(JSON.stringify({ ...output, cached: false, generated_at: now, data_sources: dataSources }), { status: 200, headers });

  } catch (err) {
    console.error('generate-customer-journey-v2 error:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
});
