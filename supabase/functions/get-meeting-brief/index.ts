/**
 * GET-MEETING-BRIEF — M18.7
 *
 * Genera el brief pre-reunión usando el estado del motor + señales de agentes +
 * historial de reuniones del mismo tipo.
 *
 * Input:  { project_id, meeting_type, objectives?, estimated_duration_min? }
 * Output: { headline, engine_status, key_signals, suggested_topics, risk_flags, confidence }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts'
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'
import { safeJsonParse } from '../_shared/safe-json-parse.ts'

const SYSTEM_PROMPT = `You are Optimus, a strategic advisor for startup founders.
You are preparing a pre-meeting brief for the founder.

You have access to:
1. The current engine state (phase, probability, risk, blockers, optimus_mode)
2. Recent meeting history for this meeting type (what was discussed before)
3. Active agent signals (finance, sales, execution, meeting insights)
4. The meeting type and declared objectives

Your job:
- Write a concise, actionable brief that helps the founder arrive prepared
- Identify the 2-3 most relevant signals for THIS type of meeting
- Suggest concrete topics based on engine state — not generic advice
- Flag risks the founder should handle carefully in this specific meeting

Rules:
- key_signals: max 3 items, each ≤ 15 words, tied to a real engine signal
- suggested_topics: max 4 items, each ≤ 20 words, ordered by priority
- risk_flags: only include if there's a real active risk — leave empty array if none
- confidence: high if engine has fresh data (<48h), medium if stale, low if no data
- headline: 1 sentence, ≤ 18 words, specific to this meeting and current state

CRITICAL: Respond ONLY with a valid JSON object. No markdown, no explanation.
{
  "headline": "string",
  "engine_status": "string (1 sentence, plain language, no internal field names)",
  "key_signals": ["string", ...],
  "suggested_topics": ["string", ...],
  "risk_flags": ["string", ...],
  "confidence": "high | medium | low"
}`

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin)

  const corsHeaders = getCorsHeaders(origin)
  const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders }

  try {
    const body = await req.json()
    const { project_id, meeting_type, objectives, estimated_duration_min } = body

    if (!project_id || !meeting_type) {
      return new Response(
        JSON.stringify({ error: 'project_id and meeting_type are required' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const { user, serviceClient: supabase } = await validateAuth(req)

    // B2.B — Verify project membership
    await verifyProjectMembership(supabase, user.id, project_id, origin)

    const rateLimitResult = await checkRateLimit(user.id, 'get-meeting-brief', RateLimitPresets.AI_GENERATION)
    if (!rateLimitResult.allowed) return createRateLimitResponse(rateLimitResult, corsHeaders)

    // 1. Estado del motor
    const { data: engineContext } = await supabase
      .rpc('get_optimus_context_enriched', { p_project_id: project_id, p_user_id: user.id })

    // AUD.M.5: delta_probability — comparar probabilidad actual vs hace 7 días
    const { data: probHistory } = await supabase
      .from('project_probability_history')
      .select('probability_score, calculated_at')
      .eq('project_id', project_id)
      .gte('calculated_at', new Date(Date.now() - 14 * 86_400_000).toISOString())
      .order('calculated_at', { ascending: false })
      .limit(5)

    // AUD.M.5: pending_decisions — meeting_insights tipo decision sin aplicar
    const { data: pendingDecisions } = await supabase
      .from('meeting_insights')
      .select('content, created_at')
      .eq('insight_type', 'decision')
      .eq('review_status', 'approved')
      .eq('applied', false)
      .in('meeting_id',
        // subquery via join — obtener meeting_ids del proyecto
        (await supabase
          .from('meetings')
          .select('id')
          .eq('project_id', project_id)
          .limit(20)
        ).data?.map(m => m.id) ?? []
      )
      .order('created_at', { ascending: false })
      .limit(5)

    // Calcular delta_probability: más reciente vs el anterior
    const probScores = (probHistory ?? []).map(p => p.probability_score).filter(s => s != null)
    const deltaProbability = probScores.length >= 2
      ? Math.round((probScores[0] - probScores[probScores.length - 1]) * 10) / 10
      : null

    // 2. Últimas 3 reuniones del mismo tipo
    const { data: recentMeetings } = await supabase
      .from('meetings')
      .select('id, title, created_at, transcript')
      .eq('project_id', project_id)
      .eq('meeting_type', meeting_type)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(3)

    // 3. Integration insights activos (no expirados, todos los agentes)
    const { data: agentSignals } = await supabase
      .from('integration_insights')
      .select('agent_type, insight_type, payload, confidence, generated_at')
      .eq('project_id', project_id)
      .gt('expires_at', new Date().toISOString())
      .order('confidence', { ascending: false })
      .limit(10)

    // Resumir transcripts anteriores (solo primeros 300 chars para no inflar el prompt)
    const meetingHistory = (recentMeetings ?? []).map((m) => ({
      title: m.title,
      date: m.created_at,
      excerpt: m.transcript
        ? (m.transcript as string).slice(0, 300) + '…'
        : null,
    }))

    const userMessage = JSON.stringify({
      meeting_type,
      objectives: objectives ?? null,
      estimated_duration_min: estimated_duration_min ?? 60,
      engine_state: engineContext ?? null,
      meeting_history: meetingHistory,
      active_agent_signals: agentSignals ?? [],
      // AUD.M.5 — datos estructurados explícitos para el brief
      delta_probability: deltaProbability,   // cambio de prob. en los últimos días (null si sin datos)
      pending_decisions: (pendingDecisions ?? []).map(d => d.content?.['title'] ?? d.content),
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    })

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    const parsed = safeJsonParse<Record<string, unknown>>(rawText)
    let brief: Record<string, unknown>
    if (parsed.ok) {
      brief = parsed.data
    } else {
      // Fallback si Claude no devuelve JSON puro
      brief = {
        headline: 'Brief no disponible — estado del motor cargado',
        engine_status: 'Datos del proyecto cargados correctamente.',
        key_signals: [],
        suggested_topics: [],
        risk_flags: [],
        confidence: 'low',
      }
    }

    // AUD.M.5 — añadir campos estructurados junto al brief generado por LLM
    return new Response(JSON.stringify({
      ok: true,
      brief,
      delta_probability: deltaProbability,
      pending_decisions_count: (pendingDecisions ?? []).length,
    }), { status: 200, headers: jsonHeaders })
  } catch (err) {
    console.error('get-meeting-brief error:', err)
    return new Response(
      JSON.stringify({ error: (err instanceof Error ? err.message : String(err)) }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
