/**
 * generate-sales-playbook-v2 — F21.6
 *
 * Genera el proceso de venta + objeciones + señales de cierre basándose en:
 *   - OBVs cerradas ganadas
 *   - Deals HubSpot cerrados (dealstage won)
 *   - Buyer Persona (si existe)
 * TTL: 14 días.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const TOOL_TYPE = 'sales_playbook';
const TTL_DAYS = 14;

function expiresAt(): string {
  const d = new Date(); d.setDate(d.getDate() + TTL_DAYS); return d.toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const headers = getCorsHeaders(req);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);
    const rl = await checkRateLimit(supabase, user.id, 'generate-sales-playbook-v2', RateLimitPresets.AI_GENERATION);
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

    const [{ data: closedObvs }, { data: closedHubspot }, { data: allObvs }, { data: bpCache }] = await Promise.all([
      supabase.from('obvs').select('titulo, nombre_contacto, empresa, valor_potencial, notas, proxima_accion, created_at, updated_at')
        .eq('project_id', project_id).eq('pipeline_status', 'cerrado_ganado')
        .order('updated_at', { ascending: false }).limit(15),
      supabase.from('integration_entities').select('payload, occurred_at')
        .eq('project_id', project_id).eq('entity_type', 'deal')
        .ilike('payload->>dealstage', '%won%').limit(15),
      supabase.from('obvs').select('pipeline_status, notas').eq('project_id', project_id)
        .not('pipeline_status', 'is', null).limit(30),
      supabase.from('founder_tool_cache').select('output')
        .eq('project_id', project_id).eq('tool_type', 'buyer_persona').maybeSingle(),
    ]);

    const deals_ganados = [
      ...(closedObvs ?? []).map(o => ({ nombre: o.nombre_contacto ?? o.titulo, empresa: o.empresa, valor: o.valor_potencial, notas: o.notas, fuente: 'CRM' })),
      ...(closedHubspot ?? []).map(d => ({ nombre: (d.payload as Record<string, unknown>)?.dealname, valor: (d.payload as Record<string, unknown>)?.amount, fuente: 'HubSpot' })),
    ];

    const objeciones_detectadas = (allObvs ?? [])
      .filter(o => o.notas && o.pipeline_status === 'cerrado_perdido')
      .map(o => o.notas).slice(0, 10);

    const outputSchema = {
      pasos: [{ numero: 1, nombre: 'string', descripcion: 'string — qué hacer en este paso', duracion_dias: 'number', accion_clave: 'string — la acción que avanza el deal' }],
      objeciones: [{ objecion: 'string', respuesta: 'string — cómo responder' }],
      momento_cierre: 'string — señal concreta de que el cliente está listo para cerrar',
      senales_compra: ['string x3 — señales de que el lead quiere comprar'],
    };

    const userPrompt = `Genera un Sales Playbook basado en los deals reales ganados.

PROYECTO: ${proj.nombre}
ONBOARDING: ${JSON.stringify(proj.onboarding_data)}

DEALS GANADOS (${deals_ganados.length}):
${JSON.stringify(deals_ganados, null, 2)}

OBJECIONES DETECTADAS EN PERDIDOS:
${JSON.stringify(objeciones_detectadas, null, 2)}

BUYER PERSONA:
${bpCache?.output ? JSON.stringify(bpCache.output, null, 2) : 'No generada'}

SCHEMA: ${JSON.stringify(outputSchema, null, 2)}

REGLAS:
- Los pasos deben reflejar cómo se cerraron ESTOS deals específicos, no un proceso genérico.
- Si hay pocos deals cerrados, indica en cada paso que es una estimación.
- Máximo 7 pasos, mínimo 4. Responde SOLO con JSON válido.`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 2000,
      system: 'Eres Optimus, motor de inteligencia estratégica. Generas Sales Playbooks basados en datos reales. Responde ÚNICAMENTE con JSON válido.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    let output: Record<string, unknown>;
    try { output = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()); }
    catch { return new Response(JSON.stringify({ error: 'Error parseando respuesta de IA' }), { status: 500, headers }); }

    const dataSources = [
      ...(deals_ganados.length > 0 ? [{ name: `${deals_ganados.length} deals cerrados`, type: 'observed', updated_at: new Date().toISOString() }] : []),
      ...(bpCache?.output ? [{ name: 'Buyer Persona', type: 'inferred', updated_at: null }] : []),
    ];

    const now = new Date().toISOString();
    await supabase.from('founder_tool_cache').upsert({ project_id, tool_type: TOOL_TYPE, generated_at: now, expires_at: expiresAt(), data_sources: dataSources, output, tokens_used: message.usage.input_tokens + message.usage.output_tokens }, { onConflict: 'project_id,tool_type' });

    return new Response(JSON.stringify({ ...output, cached: false, generated_at: now, data_sources: dataSources }), { status: 200, headers });

  } catch (err) {
    console.error('generate-sales-playbook-v2 error:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
});
