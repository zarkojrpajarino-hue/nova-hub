/**
 * EVALUATE-MEETING-ALIGNMENT — M18.21
 *
 * Post-meeting: Claude evalúa si la reunión avanzó las prioridades del motor.
 * Llamada fire-and-forget desde apply-meeting-insights.
 *
 * Input:  { meeting_id }
 * Output: { alignment_score, aligned_insights, distraction_insights, summary }
 * Guarda en meetings.alignment_data JSONB.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth } from '../_shared/auth.ts'
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres Optimus, el motor estratégico de una plataforma para founders de startups.

Tu tarea: evaluar si una reunión que acaba de completarse avanzó las prioridades reales del proyecto en este momento.

Tienes acceso a:
1. El estado actual del motor (fase, probabilidad, riesgo, bloqueos, modo Optimus)
2. Los insights aprobados de la reunión (tareas creadas, decisiones tomadas, leads, blockers)
3. El tipo de reunión y sus objetivos declarados

CRITERIOS DE ALINEACIÓN:
- Un insight ESTÁ ALINEADO si directamente avanza la prioridad de la fase actual del motor
  (ej: en fase 1, hablar de validación de demanda está alineado; hablar de escala no lo está)
- Un insight es una DISTRACCIÓN si no está relacionado con la prioridad actual
  (ej: en fase 2, invertir tiempo en configurar herramientas internas en lugar de cerrar ventas)
- alignment_score: 1.0 = reunión perfectamente alineada, 0 = reunión completamente desalineada

IMPORTANTE: Responde ÚNICAMENTE con JSON válido. Sin markdown, sin texto fuera del JSON.`

// ── Edge function ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin)

  const corsHeaders = getCorsHeaders(origin)
  const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders }

  try {
    const body = await req.json()
    const { meeting_id } = body as { meeting_id: string }

    if (!meeting_id) {
      return new Response(
        JSON.stringify({ error: 'meeting_id is required' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    console.log('🧭 Evaluating alignment for meeting:', meeting_id)

    const { user, serviceClient: supabase } = await validateAuth(req)

    const rateLimitResult = await checkRateLimit(user.id, 'evaluate-meeting-alignment', RateLimitPresets.AI_GENERATION)
    if (!rateLimitResult.allowed) return createRateLimitResponse(rateLimitResult, corsHeaders)

    // 1. Obtener reunión + insights aprobados
    const { data: meeting, error: meetingErr } = await supabase
      .from('meetings')
      .select('id, project_id, meeting_type, objectives, estimated_duration_min, title')
      .eq('id', meeting_id)
      .single()

    if (meetingErr || !meeting) {
      return new Response(
        JSON.stringify({ error: 'Meeting not found' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    const { data: insights } = await supabase
      .from('meeting_insights')
      .select('insight_type, content, review_status')
      .eq('meeting_id', meeting_id)
      .eq('review_status', 'approved')

    // 2. Obtener contexto del motor
    const { data: optimusCtx } = await supabase
      .rpc('get_optimus_context_enriched', {
        p_project_id: (meeting as Record<string, unknown>).project_id,
        p_user_id:    user.id,
      })
      .single()

    const engineContext = optimusCtx as Record<string, unknown> | null

    // 3. Construir prompt
    const insightsSummary = (insights ?? []).map((i: Record<string, unknown>) => {
      const c = i.content as Record<string, unknown>
      return `- [${i.insight_type}] ${c.title ?? c.name ?? JSON.stringify(c).slice(0, 80)}`
    }).join('\n')

    const phase = (engineContext?.phase_state as Record<string, unknown>)?.current_phase ?? '?'
    const riskLevel = (engineContext?.risk as Record<string, unknown>)?.risk_level ?? '?'
    const nextAction = engineContext?.next_action ?? 'No disponible'
    const blockers = (engineContext?.strategic_blocks as unknown[])?.length ?? 0

    const userPrompt = `## ESTADO DEL MOTOR
Fase actual: ${phase}
Nivel de riesgo: ${riskLevel}
Siguiente acción recomendada: ${JSON.stringify(nextAction)}
Bloqueos estratégicos activos: ${blockers}

## REUNIÓN
Tipo: ${(meeting as Record<string, unknown>).meeting_type}
Objetivos declarados: ${(meeting as Record<string, unknown>).objectives ?? 'No especificados'}
Duración estimada: ${(meeting as Record<string, unknown>).estimated_duration_min ?? '?'} min

## INSIGHTS APROBADOS (lo que se decidió/comprometió)
${insightsSummary || 'Sin insights aprobados'}

## TU TAREA
Evalúa cuánto avanzó esta reunión la prioridad actual del proyecto.

Responde en este formato JSON exacto:
{
  "alignment_score": 0.75,
  "aligned_insights": ["descripción breve de cada insight alineado"],
  "distraction_insights": ["descripción breve de cada distracción"],
  "summary": "Esta reunión avanzó X pero generó distracción en Y"
}`

    // 4. Llamar a Claude
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: jsonHeaders },
      )
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    console.log('🤖 Calling Claude for alignment evaluation...')

    const response = await anthropic.messages.create({
      model:       'claude-sonnet-4-6',
      max_tokens:  1024,
      temperature: 0.3,
      system:      SYSTEM_PROMPT,
      messages:    [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // 5. Parsear — fallback si Claude envuelve en ```json
    let alignmentData: Record<string, unknown>
    try {
      alignmentData = JSON.parse(text)
    } catch {
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenced) {
        try { alignmentData = JSON.parse(fenced[1]) }
        catch {
          return new Response(
            JSON.stringify({ error: 'parse_error', raw: text.slice(0, 200) }),
            { status: 422, headers: jsonHeaders },
          )
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'parse_error', raw: text.slice(0, 200) }),
          { status: 422, headers: jsonHeaders },
        )
      }
    }

    // 6. Guardar en meetings.alignment_data
    const toSave = {
      ...alignmentData,
      evaluated_at: new Date().toISOString(),
    }

    const { error: saveErr } = await supabase
      .from('meetings')
      .update({ alignment_data: toSave })
      .eq('id', meeting_id)

    if (saveErr) {
      console.error('Error saving alignment_data:', saveErr)
      return new Response(
        JSON.stringify({ error: 'Failed to save alignment_data', details: saveErr }),
        { status: 500, headers: jsonHeaders },
      )
    }

    console.log('✅ Alignment evaluated and saved. score:', alignmentData.alignment_score)

    return new Response(
      JSON.stringify({ success: true, meeting_id, ...toSave }),
      { status: 200, headers: jsonHeaders },
    )
  } catch (err) {
    if (err instanceof Response) return err
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (err as Error).message }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
