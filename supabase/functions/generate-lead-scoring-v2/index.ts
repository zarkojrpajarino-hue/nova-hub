/**
 * generate-lead-scoring-v2 — F21.5
 *
 * Genera criterios de Lead Scoring y puntúa los leads actuales basándose en:
 *   - OBVs con pipeline del CRM nativo
 *   - Deals de HubSpot via integration_entities
 *   - Buyer Persona generada (si existe en founder_tool_cache)
 * TTL: 7 días.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import { logAICall } from '../_shared/aiLogger.ts';

const TOOL_TYPE = 'lead_scoring';
const TTL_DAYS = 7;

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

    const rl = await checkRateLimit(supabase, user.id, 'generate-lead-scoring-v2', RateLimitPresets.AI_GENERATION);
    if (!rl.allowed) return createRateLimitResponse(rl, headers);

    const { project_id } = await req.json() as { project_id: string };
    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id requerido' }), { status: 400, headers });
    }

    // Verificar pertenencia (miembro O creador)
    const [{ data: membership }, { data: proj }] = await Promise.all([
      supabase.from('project_members').select('id').eq('project_id', project_id).eq('member_id', user.id).maybeSingle(),
      supabase.from('projects').select('id, nombre, created_by').eq('id', project_id).maybeSingle(),
    ]);
    if (!proj || (!membership && (proj as Record<string, unknown>).created_by !== user.id)) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers });
    }

    // Caché
    const { data: cached } = await supabase
      .from('founder_tool_cache')
      .select('*')
      .eq('project_id', project_id)
      .eq('tool_type', TOOL_TYPE)
      .maybeSingle();

    const isStale = cached ? new Date() > new Date(cached.expires_at) : false;
    const within24h = cached ? Date.now() - new Date(cached.generated_at).getTime() < 24 * 3_600_000 : false;

    if (cached && !isStale && within24h) {
      return new Response(JSON.stringify({ ...cached.output, cached: true, generated_at: cached.generated_at }), { status: 200, headers });
    }

    // Datos
    const [{ data: obvs }, { data: hubspotDeals }, { data: buyerPersonaCache }] = await Promise.all([
      supabase
        .from('obvs')
        .select('titulo, nombre_contacto, empresa, pipeline_status, valor_potencial, notas, created_at')
        .eq('project_id', project_id)
        .not('pipeline_status', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('integration_entities')
        .select('payload, occurred_at')
        .eq('project_id', project_id)
        .eq('entity_type', 'deal')
        .order('occurred_at', { ascending: false })
        .limit(30),
      supabase
        .from('founder_tool_cache')
        .select('output')
        .eq('project_id', project_id)
        .eq('tool_type', 'buyer_persona')
        .maybeSingle(),
    ]);

    const leads = [
      ...(obvs ?? []).map(o => ({
        id: o.nombre_contacto ?? o.titulo,
        empresa: o.empresa,
        estado: o.pipeline_status,
        valor: o.valor_potencial,
        notas: o.notas,
        fuente: 'CRM',
      })),
      ...(hubspotDeals ?? []).map(d => ({
        id: (d.payload as Record<string, unknown>)?.dealname,
        empresa: (d.payload as Record<string, unknown>)?.company,
        estado: (d.payload as Record<string, unknown>)?.dealstage,
        valor: (d.payload as Record<string, unknown>)?.amount,
        fuente: 'HubSpot',
      })),
    ];

    const outputSchema = {
      criterios: [{
        nombre: 'string — nombre del criterio (ej: Fit de sector)',
        descripcion: 'string — qué mide este criterio',
        peso: '0.0-1.0 — importancia relativa',
        senales_positivas: ['string — señales que aumentan el score'],
      }],
      leads_scored: [{
        nombre: 'string — nombre del lead',
        empresa: 'string | null',
        score: '0-100',
        tier: '"hot" | "warm" | "cold"',
        razon_principal: 'string — por qué tiene este score',
      }],
      top_hot: [{
        nombre: 'string',
        score: 'number',
        next_action: 'string — acción concreta recomendada',
      }],
    };

    const sf = (val: unknown) => val ? sanitizePromptInput(String(val), SanitizerPresets.MEDIUM_INPUT).sanitized : '';
    // Sanitize free-text fields in leads before sending to LLM
    const sanitizedLeads = leads.slice(0, 20).map(l => ({
      ...l,
      id: sf(l.id),
      empresa: sf(l.empresa),
      notas: l.notas ? sf(l.notas) : undefined,
    }));

    const userPrompt = `Genera un sistema de Lead Scoring para este proyecto.

LEADS (${leads.length} contactos):
${JSON.stringify(sanitizedLeads, null, 2)}

BUYER PERSONA (si existe):
${buyerPersonaCache?.output ? JSON.stringify(buyerPersonaCache.output, null, 2) : 'No generada aún'}

SCHEMA DE SALIDA:
${JSON.stringify(outputSchema, null, 2)}

REGLAS:
- Los criterios deben surgir de los patrones reales observados en los leads, no de teoría genérica.
- Puntúa solo los leads que tengan suficientes datos. Si hay pocos datos, indícalo en razon_principal.
- top_hot: máximo 3 leads, ordenados por score descendente.
- Responde SOLO con JSON válido.`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: 'Eres Optimus, motor de inteligencia estratégica de Optimus-K. Generas sistemas de lead scoring basados en datos reales. Responde ÚNICAMENTE con JSON válido.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = safeJsonParse<Record<string, unknown>>(rawText);
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: 'Invalid AI response' }), { status: 500, headers });
    }
    const output = parsed.data;

    const dataSources = [
      ...(leads.length > 0 ? [{ name: `${leads.length} leads`, type: 'observed', updated_at: new Date().toISOString() }] : []),
      ...(buyerPersonaCache?.output ? [{ name: 'Buyer Persona', type: 'inferred', updated_at: null }] : []),
    ];

    const now = new Date().toISOString();
    await supabase.from('founder_tool_cache').upsert({
      project_id, tool_type: TOOL_TYPE,
      generated_at: now, expires_at: expiresAt(),
      data_sources: dataSources, output,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    }, { onConflict: 'project_id,tool_type' });

    return new Response(JSON.stringify({ ...output, cached: false, generated_at: now, data_sources: dataSources }), { status: 200, headers });

  } catch (err) {
    console.error('generate-lead-scoring-v2 error:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
});
