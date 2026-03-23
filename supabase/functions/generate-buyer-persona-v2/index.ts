/**
 * generate-buyer-persona-v2 — F21.4
 *
 * Genera el perfil de Buyer Persona a partir de:
 *   - onboarding_data del proyecto (sector, mercado, canal)
 *   - OBVs con pipeline (contactos/leads del CRM nativo)
 *   - Deals de HubSpot via integration_entities
 * TTL: 30 días.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const TOOL_TYPE = 'buyer_persona';
const TTL_DAYS = 30;

function expiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + TTL_DAYS);
  return d.toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const headers = getCorsHeaders(req);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);

    const rl = await checkRateLimit(supabase, user.id, 'generate-buyer-persona-v2', RateLimitPresets.AI_GENERATION);
    if (!rl.allowed) return createRateLimitResponse(rl, headers);

    const { project_id } = await req.json() as { project_id: string };
    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id requerido' }), { status: 400, headers });
    }

    // Verificar pertenencia (miembro O creador)
    const [{ data: membership }, { data: proj }] = await Promise.all([
      supabase.from('project_members').select('id').eq('project_id', project_id).eq('member_id', user.id).maybeSingle(),
      supabase.from('projects').select('id, nombre, descripcion, onboarding_data, created_by').eq('id', project_id).maybeSingle(),
    ]);

    if (!proj || (!membership && (proj as Record<string, unknown>).created_by !== user.id)) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers });
    }

    // Leer caché
    const { data: cached } = await supabase
      .from('founder_tool_cache')
      .select('*')
      .eq('project_id', project_id)
      .eq('tool_type', TOOL_TYPE)
      .maybeSingle();

    const isStale = cached ? new Date() > new Date(cached.expires_at) : false;
    const within24h = cached
      ? Date.now() - new Date(cached.generated_at).getTime() < 24 * 3_600_000
      : false;

    if (cached && !isStale && within24h) {
      return new Response(JSON.stringify({ ...cached.output, cached: true, generated_at: cached.generated_at }), {
        status: 200, headers,
      });
    }

    // Recopilar datos
    const [
      { data: obvs },
      { data: hubspotDeals },
    ] = await Promise.all([
      supabase
        .from('obvs')
        .select('titulo, nombre_contacto, empresa, pipeline_status, valor_potencial, notas, proxima_accion')
        .eq('project_id', project_id)
        .not('pipeline_status', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('integration_entities')
        .select('payload, occurred_at')
        .eq('project_id', project_id)
        .eq('entity_type', 'deal')
        .order('occurred_at', { ascending: false })
        .limit(20),
    ]);

    const contactos = [
      ...(obvs ?? []).map(o => ({
        nombre: o.nombre_contacto,
        empresa: o.empresa,
        estado: o.pipeline_status,
        valor: o.valor_potencial,
        notas: o.notas,
        proxima_accion: o.proxima_accion,
      })),
      ...(hubspotDeals ?? []).map(d => ({
        nombre: (d.payload as Record<string, unknown>)?.dealname,
        empresa: (d.payload as Record<string, unknown>)?.company,
        estado: (d.payload as Record<string, unknown>)?.dealstage,
        valor: (d.payload as Record<string, unknown>)?.amount,
        fuente: 'HubSpot',
      })),
    ];

    const outputSchema = {
      persona: {
        nombre: 'string — nombre ficticio representativo',
        edad_media: 'string — rango de edad estimado',
        cargo: 'string — título/rol más común entre los contactos',
        sector: 'string — sector de la empresa del cliente',
        pain_points: ['string x3 — problemas principales que resuelve este negocio'],
        motivaciones: ['string x3 — por qué compran / qué les mueve'],
        canal_preferido: 'string — cómo prefieren ser contactados',
        objeciones: ['string x2-3 — objeciones típicas antes de cerrar'],
        quote: 'string — frase representativa en primera persona del cliente',
      },
    };

    const userPrompt = `Genera una Buyer Persona para este proyecto basándote en los datos reales de contactos.

PROYECTO:
${JSON.stringify({ nombre: proj.nombre, descripcion: proj.descripcion, onboarding: proj.onboarding_data }, null, 2)}

CONTACTOS/LEADS (${contactos.length} registros):
${JSON.stringify(contactos.slice(0, 15), null, 2)}

SCHEMA DE SALIDA:
${JSON.stringify(outputSchema, null, 2)}

REGLAS:
- Basa el perfil en patrones reales de los contactos, no en suposiciones genéricas.
- Si hay pocos datos, dilo en el quote o en las notas del cargo.
- El nombre debe ser ficticio pero representativo del perfil.
- Responde SOLO con JSON válido siguiendo el schema exacto.`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: 'Eres Optimus, el motor de inteligencia estratégica de Optimus-K. Generas perfiles de Buyer Persona honestos basados en datos reales. Responde ÚNICAMENTE con JSON válido.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    let output: Record<string, unknown>;
    try {
      output = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim());
    } catch {
      return new Response(JSON.stringify({ error: 'Error parseando respuesta de IA' }), { status: 500, headers });
    }

    const dataSources = [
      { name: 'Datos de onboarding', type: 'declared', updated_at: null },
      ...(contactos.length > 0 ? [{ name: `${contactos.length} contactos CRM`, type: 'observed', updated_at: new Date().toISOString() }] : []),
    ];

    const now = new Date().toISOString();
    await supabase.from('founder_tool_cache').upsert({
      project_id,
      tool_type: TOOL_TYPE,
      generated_at: now,
      expires_at: expiresAt(),
      data_sources: dataSources,
      output,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    }, { onConflict: 'project_id,tool_type' });

    return new Response(JSON.stringify({ ...output, cached: false, generated_at: now, data_sources: dataSources }), {
      status: 200, headers,
    });

  } catch (err) {
    console.error('generate-buyer-persona-v2 error:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
});
