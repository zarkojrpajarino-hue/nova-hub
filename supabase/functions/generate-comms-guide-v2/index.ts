/**
 * generate-comms-guide-v2 — F21.7b
 *
 * Genera la Guía de Comunicación por canal basándose en:
 *   - Brand Kit generado
 *   - Pitches enviados (integration_insights tipo email_pitch)
 * TTL: 30 días.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { sanitizePromptInput, SanitizerPresets } from '../_shared/ai-prompt-sanitizer.ts';
import { logAICall } from '../_shared/aiLogger.ts';

const TOOL_TYPE = 'comms_guide';
const TTL_DAYS = 30;

function expiresAt(): string { const d = new Date(); d.setDate(d.getDate() + TTL_DAYS); return d.toISOString(); }

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const headers = getCorsHeaders(req);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);
    const rl = await checkRateLimit(supabase, user.id, 'generate-comms-guide-v2', RateLimitPresets.AI_GENERATION);
    if (!rl.allowed) return createRateLimitResponse(rl, headers);

    const { project_id } = await req.json() as { project_id: string };
    if (!project_id) return new Response(JSON.stringify({ error: 'project_id requerido' }), { status: 400, headers });

    const [{ data: membership }, { data: proj }] = await Promise.all([
      supabase.from('project_members').select('id').eq('project_id', project_id).eq('member_id', user.id).maybeSingle(),
      supabase.from('projects').select('id, nombre, created_by').eq('id', project_id).maybeSingle(),
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

    const [{ data: bkCache }, { data: pitches }] = await Promise.all([
      supabase.from('founder_tool_cache').select('output').eq('project_id', project_id).eq('tool_type', 'brand_kit').maybeSingle(),
      supabase.from('integration_insights').select('payload, created_at').eq('project_id', project_id).eq('insight_type', 'email_pitch').order('created_at', { ascending: false }).limit(5),
    ]);

    const outputSchema = {
      canales: [{
        canal: '"email" | "linkedin" | "whatsapp"',
        tono_especifico: 'string — cómo adaptar el tono del Brand Kit a este canal',
        plantilla_primer_contacto: 'string — mensaje completo listo para usar (con [variables] donde corresponda)',
        senales_funcionando: ['string x2 — señales de que el mensaje está resonando'],
      }],
    };

    const sf = (val: unknown) => val ? sanitizePromptInput(String(val), SanitizerPresets.MEDIUM_INPUT).sanitized : '';
    // Sanitize pitch payloads (user-generated content from email pitches)
    const sanitizedPitches = pitches?.length
      ? pitches.map(p => {
          const payload = p.payload as Record<string, unknown> | null;
          if (!payload) return {};
          return Object.fromEntries(
            Object.entries(payload).map(([k, v]) => [k, typeof v === 'string' ? sf(v) : v])
          );
        })
      : [];

    const userPrompt = `Genera la Guía de Comunicación por canal para este proyecto.

BRAND KIT:
${bkCache?.output ? JSON.stringify(bkCache.output, null, 2) : 'No disponible (genera Brand Kit primero)'}

PITCHES ANTERIORES (${pitches?.length ?? 0}):
${sanitizedPitches.length ? JSON.stringify(sanitizedPitches, null, 2) : 'Ninguno'}

SCHEMA: ${JSON.stringify(outputSchema, null, 2)}

REGLAS:
- Las plantillas deben ser reales y usables tal cual, no genéricas con [inserta texto aquí].
- Adapta el tono del Brand Kit a la naturaleza de cada canal (email = más formal, WhatsApp = más directo).
- Cubre los 3 canales: email, linkedin, whatsapp.
- Responde SOLO con JSON válido.`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 2000,
      system: 'Eres Optimus, motor de inteligencia estratégica. Generas guías de comunicación accionables y específicas. Responde ÚNICAMENTE con JSON válido.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    let output: Record<string, unknown>;
    try { output = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()); }
    catch { return new Response(JSON.stringify({ error: 'Error parseando respuesta de IA' }), { status: 500, headers }); }

    const dataSources = [
      ...(bkCache?.output ? [{ name: 'Brand Kit', type: 'inferred', updated_at: null }] : []),
      ...(pitches?.length ? [{ name: `${pitches.length} pitches enviados`, type: 'observed', updated_at: pitches[0]?.created_at ?? null }] : []),
    ];

    const now = new Date().toISOString();
    await supabase.from('founder_tool_cache').upsert({ project_id, tool_type: TOOL_TYPE, generated_at: now, expires_at: expiresAt(), data_sources: dataSources, output, tokens_used: message.usage.input_tokens + message.usage.output_tokens }, { onConflict: 'project_id,tool_type' });

    return new Response(JSON.stringify({ ...output, cached: false, generated_at: now, data_sources: dataSources }), { status: 200, headers });

  } catch (err) {
    console.error('generate-comms-guide-v2 error:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers });
  }
});
