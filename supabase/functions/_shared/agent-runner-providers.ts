/**
 * agent-runner-providers.ts — Sales, Execution, Calendar agents (server-side)
 *
 * Split from agent-runner.ts for maintainability.
 * Each agent: reads entities → computes insights (pure) → writes via shared function.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { PostSyncResult } from './agent-runner.ts'

// ── Anti-spam (shared) ─────────────────────────────────────────

function hasSignificantValueChange(current: number, previous: number): boolean {
  if (previous === 0 && current === 0) return false
  if (previous === 0 || current === 0) return true
  return Math.abs(current - previous) / Math.abs(previous) >= 0.15
}

function extractSignalValue(payload: Record<string, unknown> | null): number | null {
  if (!payload) return null
  const signal = payload['signal']
  if (typeof signal !== 'object' || signal === null) return null
  const value = (signal as Record<string, unknown>)['current_value']
  return typeof value === 'number' ? value : null
}

// ── Insight type ────────────────────────────────────────────────

interface InsightData {
  insight_type: string
  signal: { metric_name: string; current_value: number; period_days: number; data_points: number }
  content: { summary: string; implication: string; severity: string; action_hint?: string }
  confidence: number
  entity_ids: string[]
  include_in_context: boolean
  expires_hours: number
  evidence_type: string
  sources_used: Array<{ source: string; confidence: number; timestamp: string; entity_count: number }>
  sources_discarded: unknown[]
}

// ── Generic insight writer with anti-spam ────────────────────────

async function writeInsights(
  client: SupabaseClient, projectId: string, syncRunId: string,
  agentType: string, candidates: InsightData[],
): Promise<PostSyncResult> {
  if (candidates.length === 0) return { insights_emitted: 0, insights_skipped: 0, agent_type: agentType }

  const now = new Date().toISOString()
  const { data: existing } = await client
    .from('integration_insights')
    .select('id, insight_type, payload')
    .eq('project_id', projectId)
    .eq('agent_type', agentType)
    .in('insight_type', candidates.map(c => c.insight_type))
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  const latest = new Map<string, { id: string; payload: Record<string, unknown> | null }>()
  for (const row of existing ?? []) {
    if (!latest.has(row.insight_type))
      latest.set(row.insight_type, { id: row.id, payload: row.payload as Record<string, unknown> | null })
  }

  const toEmit: InsightData[] = []
  const toExpire: string[] = []
  for (const c of candidates) {
    const prev = latest.get(c.insight_type)
    if (!prev) { toEmit.push(c) }
    else {
      const pv = extractSignalValue(prev.payload)
      if (pv !== null && hasSignificantValueChange(c.signal.current_value, pv)) {
        toEmit.push(c); toExpire.push(prev.id)
      }
    }
  }

  if (toEmit.length === 0) return { insights_emitted: 0, insights_skipped: candidates.length, agent_type: agentType }
  if (toExpire.length > 0) await client.from('integration_insights').update({ expires_at: now }).in('id', toExpire)

  const gen = new Date()
  await client.from('integration_insights').insert(toEmit.map(i => ({
    sync_run_id: syncRunId, project_id: projectId, agent_type: agentType,
    insight_type: i.insight_type, entity_ids: i.entity_ids,
    payload: { signal: i.signal, content: i.content },
    confidence: i.confidence, source_timestamp: gen.toISOString(),
    generated_at: gen.toISOString(),
    expires_at: new Date(gen.getTime() + i.expires_hours * 3_600_000).toISOString(),
    include_in_context: i.include_in_context, status: 'active',
    evidence_type: i.evidence_type, sources_used: i.sources_used,
    sources_discarded: i.sources_discarded,
    low_evidence_quality: i.confidence < 0.5 && i.entity_ids.length === 0,
  })))

  console.log(`[agent-runner] ${agentType}: ${toEmit.length} insights emitted`)
  return { insights_emitted: toEmit.length, insights_skipped: candidates.length - toEmit.length, agent_type: agentType }
}

// ══════════════════════════════════════════════════════════════════
// Sales Agent (HubSpot deals) — 5 insights
// ══════════════════════════════════════════════════════════════════

const ACTIVE_STAGES = new Set(['prospect', 'qualified', 'proposal', 'negotiation'])
const STAGE_PROBABILITY: Record<string, number> = { prospect: 0.1, qualified: 0.3, proposal: 0.5, negotiation: 0.7, closed_won: 1.0, closed_lost: 0 }

export async function runSalesAgentServer(
  client: SupabaseClient, projectId: string, syncRunId: string,
): Promise<PostSyncResult> {
  const { data: raw } = await client
    .from('integration_entities').select('id, confidence, payload, occurred_at')
    .eq('project_id', projectId).eq('entity_type', 'deal').eq('provider', 'hubspot').neq('status', 'rejected')

  const entities = (raw ?? []).map(r => ({
    id: r.id, confidence: r.confidence,
    occurred_at: r.occurred_at as string | null,
    payload: {
      stage: String((r.payload as Record<string, unknown>)['stage'] ?? 'prospect'),
      amount_cents: Number((r.payload as Record<string, unknown>)['amount_cents'] ?? 0),
      close_date: (r.payload as Record<string, unknown>)['close_date'] as string | undefined,
    },
  }))
  if (entities.length === 0) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'sales' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()
  const now = new Date()
  const conf = entities.reduce((s, e) => s + e.confidence, 0) / entities.length

  // 1. Open pipeline value
  const active = entities.filter(e => ACTIVE_STAGES.has(e.payload.stage))
  if (active.length >= 1 && conf >= 0.5) {
    const euros = active.reduce((s, e) => s + e.payload.amount_cents, 0) / 100
    candidates.push({
      insight_type: 'open_pipeline_value',
      signal: { metric_name: 'open_pipeline_euros', current_value: euros, period_days: 0, data_points: active.length },
      content: { summary: `Pipeline activo: \u20AC${euros.toFixed(0)} en ${active.length} deals.`, implication: 'Valor de pipeline disponible para forecasting.', severity: 'info' },
      confidence: conf, entity_ids: active.map(e => e.id), include_in_context: true, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'hubspot', confidence: conf, timestamp: ts, entity_count: active.length }], sources_discarded: [],
    })
  }

  // 2. Conversion rate
  const closed = entities.filter(e => e.payload.stage === 'closed_won' || e.payload.stage === 'closed_lost')
  const won = closed.filter(e => e.payload.stage === 'closed_won')
  const lost = closed.filter(e => e.payload.stage === 'closed_lost')
  if (closed.length >= 3 && lost.length > 0 && conf >= 0.5) {
    const rate = Math.round((won.length / closed.length) * 100)
    candidates.push({
      insight_type: 'pipeline_conversion_rate',
      signal: { metric_name: 'win_rate_pct', current_value: rate, period_days: 0, data_points: closed.length },
      content: { summary: `Win rate: ${rate}% (${won.length}/${closed.length}).`, implication: rate >= 50 ? 'Conversión saludable.' : 'Conversión baja.', severity: rate >= 50 ? 'info' : rate >= 25 ? 'attention' : 'warning', action_hint: rate < 50 ? `Revisa ${lost.length} deals perdidos.` : undefined },
      confidence: conf, entity_ids: closed.map(e => e.id), include_in_context: rate < 50, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'hubspot', confidence: conf, timestamp: ts, entity_count: closed.length }], sources_discarded: [],
    })
  }

  // 3. Weighted pipeline (probability × amount)
  if (active.length >= 2 && conf >= 0.5) {
    const weightedEuros = active.reduce((s, e) => s + (e.payload.amount_cents * (STAGE_PROBABILITY[e.payload.stage] ?? 0.1)), 0) / 100
    candidates.push({
      insight_type: 'weighted_pipeline',
      signal: { metric_name: 'weighted_pipeline_euros', current_value: Math.round(weightedEuros), period_days: 0, data_points: active.length },
      content: { summary: `Pipeline ponderado: \u20AC${Math.round(weightedEuros)} (ajustado por probabilidad de cierre).`, implication: 'Estimación realista del pipeline — más precisa que el valor bruto.', severity: 'info' },
      confidence: conf, entity_ids: active.map(e => e.id), include_in_context: true, expires_hours: 24,
      evidence_type: 'estimated', sources_used: [{ source: 'hubspot', confidence: conf, timestamp: ts, entity_count: active.length }], sources_discarded: [],
    })
  }

  // 4. Average deal size (won deals)
  if (won.length >= 2 && conf >= 0.5) {
    const avgDealEuros = Math.round(won.reduce((s, e) => s + e.payload.amount_cents, 0) / won.length) / 100
    candidates.push({
      insight_type: 'avg_deal_size',
      signal: { metric_name: 'avg_deal_euros', current_value: avgDealEuros, period_days: 0, data_points: won.length },
      content: { summary: `Deal medio ganado: \u20AC${avgDealEuros.toFixed(0)} (${won.length} deals cerrados).`, implication: 'Ticket medio de venta. Útil para forecast y objetivos de pipeline.', severity: 'info' },
      confidence: conf, entity_ids: won.map(e => e.id), include_in_context: true, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'hubspot', confidence: conf, timestamp: ts, entity_count: won.length }], sources_discarded: [],
    })
  }

  // 5. Stale deals (active deals with close_date in the past or no activity in 14+ days)
  const staleDays = 14
  const staleDeals = active.filter(e => {
    if (e.payload.close_date && new Date(e.payload.close_date) < now) return true
    if (e.occurred_at && (now.getTime() - new Date(e.occurred_at).getTime()) > staleDays * 86_400_000) return true
    return false
  })
  if (staleDeals.length > 0 && conf >= 0.5) {
    const staleValue = staleDeals.reduce((s, e) => s + e.payload.amount_cents, 0) / 100
    candidates.push({
      insight_type: 'stale_deals',
      signal: { metric_name: 'stale_deals_count', current_value: staleDeals.length, period_days: staleDays, data_points: active.length },
      content: { summary: `${staleDeals.length} deals estancados (\u20AC${staleValue.toFixed(0)}). Sin movimiento en ${staleDays}+ días.`, implication: 'Pipeline muerto que infla el forecast.', severity: staleDeals.length > 3 ? 'warning' : 'attention', action_hint: `Actualiza o cierra ${staleDeals.length} deals estancados. No infles el pipeline.` },
      confidence: conf, entity_ids: staleDeals.map(e => e.id), include_in_context: true, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'hubspot', confidence: conf, timestamp: ts, entity_count: staleDeals.length }], sources_discarded: [],
    })
  }

  return writeInsights(client, projectId, syncRunId, 'sales', candidates)
}

// ══════════════════════════════════════════════════════════════════
// Execution Agent (Asana tasks) — 4 insights
// ══════════════════════════════════════════════════════════════════

export async function runExecutionAgentServer(
  client: SupabaseClient, projectId: string, syncRunId: string,
): Promise<PostSyncResult> {
  const { data: raw } = await client
    .from('integration_entities').select('id, confidence, payload')
    .eq('project_id', projectId).eq('entity_type', 'task').eq('provider', 'asana').neq('status', 'rejected')

  const entities = (raw ?? []).map(r => ({
    id: r.id, confidence: r.confidence,
    payload: {
      status: String((r.payload as Record<string, unknown>)['status'] ?? 'open'),
      due_date: (r.payload as Record<string, unknown>)['due_date'] as string | undefined,
      assignee_external_id: (r.payload as Record<string, unknown>)['assignee_external_id'] as string | undefined,
      completed_at: (r.payload as Record<string, unknown>)['completed_at'] as string | undefined,
      section: (r.payload as Record<string, unknown>)['section'] as string | undefined,
    },
  }))
  if (entities.length < 5) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'execution' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()
  const now = new Date()
  const completed = entities.filter(e => e.payload.status === 'completed')
  const open = entities.filter(e => e.payload.status === 'open')
  const conf = entities.reduce((s, e) => s + e.confidence, 0) / entities.length

  // 1. Completion rate
  if (conf >= 0.5) {
    const rate = Math.round((completed.length / entities.length) * 100)
    candidates.push({
      insight_type: 'task_completion_rate',
      signal: { metric_name: 'completion_rate_pct', current_value: rate, period_days: 0, data_points: entities.length },
      content: { summary: `Completitud: ${rate}% (${completed.length}/${entities.length}).`, implication: rate >= 70 ? 'Ejecución saludable.' : 'Ejecución baja.', severity: rate >= 70 ? 'info' : rate >= 40 ? 'attention' : 'warning', action_hint: rate < 40 ? `Prioriza las top 3 de ${open.length} tareas abiertas.` : undefined },
      confidence: conf, entity_ids: entities.map(e => e.id), include_in_context: rate < 70, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'asana', confidence: conf, timestamp: ts, entity_count: entities.length }], sources_discarded: [],
    })
  }

  // 2. Overdue ratio
  const withDue = open.filter(e => e.payload.due_date)
  const overdue = withDue.filter(e => new Date(e.payload.due_date!) < now)
  if (withDue.length >= 3 && conf >= 0.5) {
    const ratio = Math.round((overdue.length / withDue.length) * 100)
    candidates.push({
      insight_type: 'overdue_ratio',
      signal: { metric_name: 'overdue_ratio_pct', current_value: ratio, period_days: 0, data_points: withDue.length },
      content: { summary: `${overdue.length}/${withDue.length} tareas vencidas (${ratio}%).`, implication: ratio > 50 ? 'Más de la mitad vencidas.' : 'Deuda controlada.', severity: ratio > 50 ? 'warning' : ratio > 25 ? 'attention' : 'info', action_hint: ratio > 25 ? `Cierra o replanifica ${overdue.length} tareas vencidas.` : undefined },
      confidence: conf, entity_ids: overdue.map(e => e.id), include_in_context: ratio > 25, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'asana', confidence: conf, timestamp: ts, entity_count: withDue.length }], sources_discarded: [],
    })
  }

  // 3. Unassigned tasks — work that might fall through cracks
  const unassigned = open.filter(e => !e.payload.assignee_external_id)
  if (unassigned.length > 0 && conf >= 0.5) {
    const pct = Math.round((unassigned.length / open.length) * 100)
    candidates.push({
      insight_type: 'unassigned_tasks',
      signal: { metric_name: 'unassigned_pct', current_value: pct, period_days: 0, data_points: open.length },
      content: { summary: `${unassigned.length} tareas abiertas sin asignar (${pct}%).`, implication: pct > 30 ? 'Muchas tareas sin dueño — riesgo de que no se ejecuten.' : 'Pocas tareas sin asignar.', severity: pct > 30 ? 'warning' : pct > 15 ? 'attention' : 'info', action_hint: pct > 15 ? `Asigna ${unassigned.length} tareas sin dueño.` : undefined },
      confidence: conf, entity_ids: unassigned.map(e => e.id), include_in_context: pct > 15, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'asana', confidence: conf, timestamp: ts, entity_count: unassigned.length }], sources_discarded: [],
    })
  }

  // 4. Backlog growth — completed recently vs open (proxy for velocity balance)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000)
  const recentlyCompleted = completed.filter(e => e.payload.completed_at && new Date(e.payload.completed_at) > sevenDaysAgo)
  if (open.length > 0 && conf >= 0.5) {
    const backlogRatio = open.length / Math.max(1, recentlyCompleted.length)
    candidates.push({
      insight_type: 'backlog_health',
      signal: { metric_name: 'open_to_completed_7d_ratio', current_value: Math.round(backlogRatio * 10) / 10, period_days: 7, data_points: entities.length },
      content: {
        summary: `${open.length} abiertas vs ${recentlyCompleted.length} completadas (7d). Ratio: ${backlogRatio.toFixed(1)}x.`,
        implication: backlogRatio > 5 ? 'Backlog creciendo mucho más rápido que la ejecución.' : backlogRatio > 2 ? 'Backlog creciendo — velocidad insuficiente.' : 'Backlog bajo control.',
        severity: backlogRatio > 5 ? 'warning' : backlogRatio > 2 ? 'attention' : 'info',
        action_hint: backlogRatio > 2 ? `Completando ${recentlyCompleted.length}/semana pero hay ${open.length} abiertas. Prioriza o reduce scope.` : undefined,
      },
      confidence: conf, entity_ids: entities.map(e => e.id), include_in_context: backlogRatio > 2, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'asana', confidence: conf, timestamp: ts, entity_count: entities.length }], sources_discarded: [],
    })
  }

  return writeInsights(client, projectId, syncRunId, 'execution', candidates)
}

// ══════════════════════════════════════════════════════════════════
// Calendar Agent (Google Calendar) — 4 insights
// ══════════════════════════════════════════════════════════════════

export async function runCalendarAgentServer(
  client: SupabaseClient, projectId: string, syncRunId: string,
): Promise<PostSyncResult> {
  const { data: raw } = await client
    .from('integration_entities').select('id, confidence, payload')
    .eq('project_id', projectId).eq('entity_type', 'calendar_event').eq('provider', 'google_calendar').neq('status', 'rejected')

  const events = (raw ?? []).map(r => ({
    id: r.id, confidence: r.confidence,
    payload: {
      start_at: String((r.payload as Record<string, unknown>)['start_at'] ?? ''),
      end_at: String((r.payload as Record<string, unknown>)['end_at'] ?? ''),
      attendee_count: Number((r.payload as Record<string, unknown>)['attendee_count'] ?? 0),
    },
  }))

  const now = new Date()
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000)
  const future = events.filter(e => { const s = new Date(e.payload.start_at); return s > now && s < weekEnd })
  if (future.length < 1) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'calendar' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()
  const conf = future.reduce((s, e) => s + e.confidence, 0) / future.length
  const mins = future.reduce((s, e) => s + Math.max(0, (new Date(e.payload.end_at).getTime() - new Date(e.payload.start_at).getTime()) / 60_000), 0)
  const hours = Math.round(mins / 60 * 10) / 10

  // 1. Meeting load
  candidates.push({
    insight_type: 'meeting_load',
    signal: { metric_name: 'meeting_hours_7d', current_value: hours, period_days: 7, data_points: future.length },
    content: { summary: `${hours}h de reuniones en 7 días (${future.length} eventos).`, implication: hours > 20 ? 'Carga muy alta.' : hours > 10 ? 'Carga moderada.' : 'Carga ligera.', severity: hours > 20 ? 'warning' : hours > 10 ? 'attention' : 'info', action_hint: hours > 20 ? 'Cancela o reagrupa reuniones.' : undefined },
    confidence: conf, entity_ids: future.map(e => e.id), include_in_context: hours > 10, expires_hours: 24,
    evidence_type: 'observed', sources_used: [{ source: 'google_calendar', confidence: conf, timestamp: ts, entity_count: future.length }], sources_discarded: [],
  })

  // 2. Meeting density
  if (future.length >= 3) {
    const density = Math.round((hours / 40) * 100)
    candidates.push({
      insight_type: 'meeting_density',
      signal: { metric_name: 'meeting_density_pct', current_value: density, period_days: 7, data_points: future.length },
      content: { summary: `${density}% de la semana en reuniones.`, implication: density > 50 ? 'Riesgo de baja productividad.' : 'Proporción aceptable.', severity: density > 50 ? 'warning' : density > 30 ? 'attention' : 'info' },
      confidence: conf, entity_ids: future.map(e => e.id), include_in_context: density > 30, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'google_calendar', confidence: conf, timestamp: ts, entity_count: future.length }], sources_discarded: [],
    })
  }

  // 3. Focus time — blocks of 2+ hours without meetings (maker time)
  if (future.length >= 2 && conf >= 0.5) {
    // Sort events by start time and count gaps ≥ 2h in working hours (9-18)
    const sorted = [...future].sort((a, b) => new Date(a.payload.start_at).getTime() - new Date(b.payload.start_at).getTime())
    // Group by day, count focus blocks (gap between meetings or before first / after last)
    const byDay = new Map<string, typeof sorted>()
    for (const e of sorted) {
      const day = new Date(e.payload.start_at).toISOString().slice(0, 10)
      const arr = byDay.get(day) ?? []
      arr.push(e)
      byDay.set(day, arr)
    }
    let focusBlocks = 0
    for (const [, dayEvents] of byDay) {
      const starts = dayEvents.map(e => new Date(e.payload.start_at).getHours())
      const ends = dayEvents.map(e => new Date(e.payload.end_at).getHours())
      // Check for 2h gap before first meeting (from 9am)
      if (starts.length > 0 && starts[0] >= 11) focusBlocks++
      // Check for 2h gap after last meeting (until 18)
      if (ends.length > 0 && ends[ends.length - 1] <= 16) focusBlocks++
      // Check gaps between meetings
      for (let i = 1; i < dayEvents.length; i++) {
        const gapMs = new Date(dayEvents[i].payload.start_at).getTime() - new Date(dayEvents[i - 1].payload.end_at).getTime()
        if (gapMs >= 2 * 3_600_000) focusBlocks++
      }
    }
    const workDays = byDay.size || 1
    const avgFocusPerDay = Math.round((focusBlocks / workDays) * 10) / 10
    candidates.push({
      insight_type: 'focus_time',
      signal: { metric_name: 'focus_blocks_per_day', current_value: avgFocusPerDay, period_days: 7, data_points: future.length },
      content: {
        summary: `${focusBlocks} bloques de foco (≥2h) en ${workDays} días (~${avgFocusPerDay}/día).`,
        implication: avgFocusPerDay < 1 ? 'Casi sin tiempo de foco — la semana está fragmentada por reuniones.' : avgFocusPerDay >= 2 ? 'Buen balance de foco y reuniones.' : 'Foco limitado.',
        severity: avgFocusPerDay < 1 ? 'warning' : avgFocusPerDay < 2 ? 'attention' : 'info',
        action_hint: avgFocusPerDay < 1 ? 'Agrupa reuniones para liberar bloques de foco de 2+ horas.' : undefined,
      },
      confidence: conf, entity_ids: future.map(e => e.id), include_in_context: avgFocusPerDay < 2, expires_hours: 24,
      evidence_type: 'estimated', sources_used: [{ source: 'google_calendar', confidence: conf, timestamp: ts, entity_count: future.length }], sources_discarded: [],
    })
  }

  // 4. Large meetings (many attendees = high coordination cost)
  const largeMeetings = future.filter(e => e.payload.attendee_count >= 5)
  if (largeMeetings.length > 0 && conf >= 0.5) {
    const largeMins = largeMeetings.reduce((s, e) => s + Math.max(0, (new Date(e.payload.end_at).getTime() - new Date(e.payload.start_at).getTime()) / 60_000), 0)
    const largeHours = Math.round(largeMins / 60 * 10) / 10
    const avgAttendees = Math.round(largeMeetings.reduce((s, e) => s + e.payload.attendee_count, 0) / largeMeetings.length)
    candidates.push({
      insight_type: 'large_meetings',
      signal: { metric_name: 'large_meeting_hours', current_value: largeHours, period_days: 7, data_points: largeMeetings.length },
      content: {
        summary: `${largeMeetings.length} reuniones grandes (5+ personas, ~${avgAttendees} media): ${largeHours}h.`,
        implication: largeHours > 5 ? 'Alto coste de coordinación. ¿Todas necesitan tantas personas?' : 'Coste de coordinación moderado.',
        severity: largeHours > 5 ? 'attention' : 'info',
        action_hint: largeHours > 5 ? 'Revisa si todas las reuniones grandes necesitan todos los asistentes.' : undefined,
      },
      confidence: conf, entity_ids: largeMeetings.map(e => e.id), include_in_context: largeHours > 5, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'google_calendar', confidence: conf, timestamp: ts, entity_count: largeMeetings.length }], sources_discarded: [],
    })
  }

  return writeInsights(client, projectId, syncRunId, 'calendar', candidates)
}

// ══════════════════════════════════════════════════════════════════
// Holded Finance Agent (invoices) — 4 insights
// ══════════════════════════════════════════════════════════════════

export async function runHoldedFinanceAgentServer(
  client: SupabaseClient, projectId: string, syncRunId: string,
): Promise<PostSyncResult> {
  const { data: raw } = await client
    .from('integration_entities').select('id, confidence, payload')
    .eq('project_id', projectId).eq('entity_type', 'invoice').eq('provider', 'holded').neq('status', 'rejected')

  const entities = (raw ?? []).map(r => ({
    id: r.id, confidence: r.confidence,
    payload: {
      status: String((r.payload as Record<string, unknown>)['status'] ?? 'draft'),
      total_cents: Number((r.payload as Record<string, unknown>)['total_cents'] ?? 0),
      due_at: (r.payload as Record<string, unknown>)['due_at'] as string | undefined,
      issued_at: (r.payload as Record<string, unknown>)['issued_at'] as string | undefined,
      contact_name: (r.payload as Record<string, unknown>)['contact_name'] as string | undefined,
    },
  }))
  if (entities.length < 1) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'holded_finance' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()
  const now = new Date()
  const conf = entities.reduce((s, e) => s + e.confidence, 0) / entities.length
  const paid = entities.filter(e => e.payload.status === 'paid')
  const pending = entities.filter(e => e.payload.status === 'pending')
  const overdue = entities.filter(e => e.payload.status === 'overdue')

  // 1. Invoice status breakdown
  if (conf >= 0.5) {
    const totalInvoicedEuros = entities.reduce((s, e) => s + e.payload.total_cents, 0) / 100
    const totalPaidEuros = paid.reduce((s, e) => s + e.payload.total_cents, 0) / 100
    const totalOverdueEuros = overdue.reduce((s, e) => s + e.payload.total_cents, 0) / 100
    candidates.push({
      insight_type: 'invoice_status',
      signal: { metric_name: 'total_invoiced_euros', current_value: totalInvoicedEuros, period_days: 0, data_points: entities.length },
      content: { summary: `${entities.length} facturas: \u20AC${totalPaidEuros.toFixed(0)} cobrado, \u20AC${totalOverdueEuros.toFixed(0)} vencido, ${pending.length} pendientes.`, implication: overdue.length > 0 ? `${overdue.length} facturas vencidas afectan el cash flow.` : 'Cobros al día.', severity: overdue.length > 3 ? 'warning' : overdue.length > 0 ? 'attention' : 'info', action_hint: overdue.length > 0 ? `Gestiona ${overdue.length} facturas vencidas (\u20AC${totalOverdueEuros.toFixed(0)}).` : undefined },
      confidence: conf, entity_ids: entities.map(e => e.id), include_in_context: overdue.length > 0, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'holded', confidence: conf, timestamp: ts, entity_count: entities.length }], sources_discarded: [],
    })
  }

  // 2. Payment health
  if (entities.length >= 3 && conf >= 0.5) {
    const paidPct = Math.round((paid.length / entities.length) * 100)
    candidates.push({
      insight_type: 'payment_health',
      signal: { metric_name: 'paid_ratio_pct', current_value: paidPct, period_days: 0, data_points: entities.length },
      content: { summary: `${paidPct}% de facturas cobradas (${paid.length}/${entities.length}).`, implication: paidPct >= 80 ? 'Salud de cobros buena.' : paidPct >= 50 ? 'Cobros moderados.' : 'Cobros bajos — riesgo de liquidez.', severity: paidPct >= 80 ? 'info' : paidPct >= 50 ? 'attention' : 'warning', action_hint: paidPct < 80 ? `Revisa las ${pending.length + overdue.length} facturas sin cobrar.` : undefined },
      confidence: conf, entity_ids: entities.map(e => e.id), include_in_context: paidPct < 80, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'holded', confidence: conf, timestamp: ts, entity_count: entities.length }], sources_discarded: [],
    })
  }

  // 3. Aging analysis — overdue buckets: 30/60/90 days
  if (overdue.length > 0 && conf >= 0.5) {
    const bucket30 = overdue.filter(e => e.payload.due_at && (now.getTime() - new Date(e.payload.due_at).getTime()) <= 30 * 86_400_000)
    const bucket60 = overdue.filter(e => e.payload.due_at && (now.getTime() - new Date(e.payload.due_at).getTime()) > 30 * 86_400_000 && (now.getTime() - new Date(e.payload.due_at).getTime()) <= 60 * 86_400_000)
    const bucket90 = overdue.filter(e => e.payload.due_at && (now.getTime() - new Date(e.payload.due_at).getTime()) > 60 * 86_400_000)
    const critical = bucket60.length + bucket90.length
    candidates.push({
      insight_type: 'invoice_aging',
      signal: { metric_name: 'overdue_90plus_count', current_value: bucket90.length, period_days: 90, data_points: overdue.length },
      content: { summary: `Aging: ${bucket30.length} facturas <30d, ${bucket60.length} 30-60d, ${bucket90.length} >60d vencidas.`, implication: bucket90.length > 0 ? `${bucket90.length} facturas con 60+ días de retraso — probablemente incobrables.` : 'Sin facturas críticamente vencidas.', severity: bucket90.length > 0 ? 'critical' : critical > 0 ? 'warning' : 'attention', action_hint: critical > 0 ? `Prioriza cobro: ${critical} facturas con 30+ días de retraso.` : undefined },
      confidence: conf, entity_ids: overdue.map(e => e.id), include_in_context: critical > 0, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'holded', confidence: conf, timestamp: ts, entity_count: overdue.length }], sources_discarded: [],
    })
  }

  // 4. Client concentration (top client % of total invoiced)
  const withClient = entities.filter(e => e.payload.contact_name && e.payload.contact_name !== '')
  if (withClient.length >= 3 && conf >= 0.5) {
    const byClient = new Map<string, number>()
    for (const e of withClient) byClient.set(e.payload.contact_name!, (byClient.get(e.payload.contact_name!) ?? 0) + e.payload.total_cents)
    const totalCents = Array.from(byClient.values()).reduce((s, v) => s + v, 0)
    if (totalCents > 0) {
      const topCents = Math.max(...byClient.values())
      const topPct = Math.round((topCents / totalCents) * 100)
      const topClient = [...byClient.entries()].find(([, v]) => v === topCents)?.[0] ?? '?'
      candidates.push({
        insight_type: 'client_concentration',
        signal: { metric_name: 'top_client_invoice_pct', current_value: topPct, period_days: 0, data_points: byClient.size },
        content: { summary: `${topClient}: ${topPct}% de la facturación total (${byClient.size} clientes).`, implication: topPct > 50 ? 'Concentración alta — dependencia de un solo cliente.' : topPct > 30 ? 'Concentración moderada.' : 'Facturación diversificada.', severity: topPct > 50 ? 'warning' : topPct > 30 ? 'attention' : 'info', action_hint: topPct > 30 ? 'Diversifica la cartera de clientes.' : undefined },
        confidence: conf, entity_ids: withClient.map(e => e.id), include_in_context: topPct > 30, expires_hours: 7 * 24,
        evidence_type: 'observed', sources_used: [{ source: 'holded', confidence: conf, timestamp: ts, entity_count: withClient.length }], sources_discarded: [],
      })
    }
  }

  return writeInsights(client, projectId, syncRunId, 'finance', candidates)
}

// ══════════════════════════════════════════════════════════════════
// Trello Execution Agent (cards) — 4 insights
// ══════════════════════════════════════════════════════════════════

export async function runTrelloExecutionAgentServer(
  client: SupabaseClient, projectId: string, syncRunId: string,
): Promise<PostSyncResult> {
  const { data: raw } = await client
    .from('integration_entities').select('id, confidence, payload, source_timestamp')
    .eq('project_id', projectId).eq('entity_type', 'card').eq('provider', 'trello').neq('status', 'rejected')

  const entities = (raw ?? []).map(r => ({
    id: r.id, confidence: r.confidence,
    source_timestamp: r.source_timestamp as string | null,
    payload: {
      status: String((r.payload as Record<string, unknown>)['status'] ?? 'open'),
      due_date: (r.payload as Record<string, unknown>)['due_date'] as string | undefined,
      is_overdue: Boolean((r.payload as Record<string, unknown>)['is_overdue']),
      board_name: (r.payload as Record<string, unknown>)['board_name'] as string | undefined,
      member_count: Number((r.payload as Record<string, unknown>)['member_count'] ?? 0),
      labels: ((r.payload as Record<string, unknown>)['labels'] as string[]) ?? [],
    },
  }))
  if (entities.length < 5) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'trello_execution' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()
  const completed = entities.filter(e => e.payload.status === 'completed')
  const open = entities.filter(e => e.payload.status === 'open')
  const conf = entities.reduce((s, e) => s + e.confidence, 0) / entities.length

  // 1. Card completion rate
  if (conf >= 0.5) {
    const rate = Math.round((completed.length / entities.length) * 100)
    candidates.push({
      insight_type: 'card_completion_rate',
      signal: { metric_name: 'trello_completion_rate_pct', current_value: rate, period_days: 0, data_points: entities.length },
      content: { summary: `Completitud Trello: ${rate}% (${completed.length}/${entities.length}).`, implication: rate >= 70 ? 'Ejecución saludable.' : 'Ejecución baja.', severity: rate >= 70 ? 'info' : rate >= 40 ? 'attention' : 'warning', action_hint: rate < 40 ? `Prioriza las top 3 de ${open.length} cards abiertas.` : undefined },
      confidence: conf, entity_ids: entities.map(e => e.id), include_in_context: rate < 70, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'trello', confidence: conf, timestamp: ts, entity_count: entities.length }], sources_discarded: [],
    })
  }

  // 2. Overdue ratio
  const overdue = entities.filter(e => e.payload.is_overdue && e.payload.status === 'open')
  const withDue = open.filter(e => e.payload.due_date)
  if (withDue.length >= 3 && conf >= 0.5) {
    const ratio = Math.round((overdue.length / withDue.length) * 100)
    candidates.push({
      insight_type: 'trello_overdue_ratio',
      signal: { metric_name: 'trello_overdue_ratio_pct', current_value: ratio, period_days: 0, data_points: withDue.length },
      content: { summary: `${overdue.length}/${withDue.length} cards vencidas en Trello (${ratio}%).`, implication: ratio > 50 ? 'Más de la mitad vencidas.' : 'Deuda controlada.', severity: ratio > 50 ? 'warning' : ratio > 25 ? 'attention' : 'info', action_hint: ratio > 25 ? `Cierra o replanifica ${overdue.length} cards vencidas.` : undefined },
      confidence: conf, entity_ids: overdue.map(e => e.id), include_in_context: ratio > 25, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'trello', confidence: conf, timestamp: ts, entity_count: withDue.length }], sources_discarded: [],
    })
  }

  // 3. Unmanaged cards — open cards without due date (invisible work)
  const noDue = open.filter(e => !e.payload.due_date)
  if (noDue.length > 0 && open.length >= 5 && conf >= 0.5) {
    const noDuePct = Math.round((noDue.length / open.length) * 100)
    candidates.push({
      insight_type: 'trello_unmanaged_cards',
      signal: { metric_name: 'cards_without_due_pct', current_value: noDuePct, period_days: 0, data_points: open.length },
      content: { summary: `${noDue.length} cards abiertas sin fecha límite (${noDuePct}%).`, implication: noDuePct > 50 ? 'La mitad del trabajo no tiene deadline — difícil de priorizar.' : 'Mayoría de cards con fecha.', severity: noDuePct > 50 ? 'warning' : noDuePct > 30 ? 'attention' : 'info', action_hint: noDuePct > 30 ? `Añade fecha límite a las ${noDue.length} cards sin deadline.` : undefined },
      confidence: conf, entity_ids: noDue.map(e => e.id), include_in_context: noDuePct > 30, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'trello', confidence: conf, timestamp: ts, entity_count: noDue.length }], sources_discarded: [],
    })
  }

  // 4. Board health — completion rate per board (identify lagging projects)
  const boards = new Map<string, { open: number; completed: number; total: number }>()
  for (const e of entities) {
    const b = e.payload.board_name ?? 'Sin board'
    const cur = boards.get(b) ?? { open: 0, completed: 0, total: 0 }
    cur.total++
    if (e.payload.status === 'completed') cur.completed++
    else cur.open++
    boards.set(b, cur)
  }
  if (boards.size >= 2 && conf >= 0.5) {
    let worst = '', worstRate = 100
    for (const [name, stats] of boards) {
      if (stats.total < 3) continue
      const rate = Math.round((stats.completed / stats.total) * 100)
      if (rate < worstRate) { worstRate = rate; worst = name }
    }
    if (worst && worstRate < 40) {
      const worstStats = boards.get(worst)!
      candidates.push({
        insight_type: 'trello_board_health',
        signal: { metric_name: 'worst_board_completion_pct', current_value: worstRate, period_days: 0, data_points: worstStats.total },
        content: { summary: `Board "${worst}": solo ${worstRate}% completado (${worstStats.open} cards abiertas).`, implication: 'Este proyecto necesita atención — avanza más lento que los demás.', severity: worstRate < 20 ? 'warning' : 'attention', action_hint: `Revisa "${worst}": ${worstStats.open} cards abiertas vs ${worstStats.completed} completadas.` },
        confidence: conf, entity_ids: entities.filter(e => e.payload.board_name === worst).map(e => e.id), include_in_context: true, expires_hours: 7 * 24,
        evidence_type: 'observed', sources_used: [{ source: 'trello', confidence: conf, timestamp: ts, entity_count: worstStats.total }], sources_discarded: [],
      })
    }
  }

  return writeInsights(client, projectId, syncRunId, 'execution', candidates)
}

// ══════════════════════════════════════════════════════════════════
// Slack Communication Agent (channel activity) — 4 insights
// ══════════════════════════════════════════════════════════════════

export async function runSlackCommunicationAgentServer(
  client: SupabaseClient, projectId: string, syncRunId: string,
): Promise<PostSyncResult> {
  const { data: raw } = await client
    .from('integration_entities').select('id, confidence, payload')
    .eq('project_id', projectId).eq('entity_type', 'channel_activity').eq('provider', 'slack').neq('status', 'rejected')

  const entities = (raw ?? []).map(r => ({
    id: r.id, confidence: r.confidence,
    payload: {
      message_count: Number((r.payload as Record<string, unknown>)['message_count'] ?? 0),
      unique_authors: Number((r.payload as Record<string, unknown>)['unique_authors'] ?? 0),
      messages_per_day: Number((r.payload as Record<string, unknown>)['messages_per_day'] ?? 0),
      channel_name: String((r.payload as Record<string, unknown>)['channel_name'] ?? ''),
      member_count: Number((r.payload as Record<string, unknown>)['member_count'] ?? 0),
      latest_message_at: (r.payload as Record<string, unknown>)['latest_message_at'] as string | undefined,
    },
  }))
  if (entities.length < 1) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'slack_communication' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()
  const now = new Date()
  const conf = entities.reduce((s, e) => s + e.confidence, 0) / entities.length
  const totalMessages = entities.reduce((s, e) => s + e.payload.message_count, 0)
  const avgMsgsPerDay = entities.reduce((s, e) => s + e.payload.messages_per_day, 0)

  // 1. Team activity
  if (conf >= 0.5 && totalMessages > 0) {
    candidates.push({
      insight_type: 'team_activity',
      signal: { metric_name: 'total_messages_7d', current_value: totalMessages, period_days: 7, data_points: entities.length },
      content: { summary: `${totalMessages} mensajes en ${entities.length} canales (7 días). ~${Math.round(avgMsgsPerDay)} msgs/día.`, implication: avgMsgsPerDay > 50 ? 'Equipo muy activo.' : avgMsgsPerDay > 10 ? 'Actividad moderada.' : 'Actividad baja.', severity: avgMsgsPerDay < 5 ? 'attention' : 'info', action_hint: avgMsgsPerDay < 5 ? 'Pocas interacciones. Revisa si el equipo usa otro canal.' : undefined },
      confidence: conf, entity_ids: entities.map(e => e.id), include_in_context: avgMsgsPerDay < 10, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'slack', confidence: conf, timestamp: ts, entity_count: entities.length }], sources_discarded: [],
    })
  }

  // 2. Channel concentration
  if (entities.length >= 3 && conf >= 0.5 && totalMessages > 0) {
    const topChannel = entities.reduce((max, e) => e.payload.message_count > max.payload.message_count ? e : max, entities[0])
    const concentrationPct = Math.round((topChannel.payload.message_count / totalMessages) * 100)
    candidates.push({
      insight_type: 'channel_concentration',
      signal: { metric_name: 'top_channel_pct', current_value: concentrationPct, period_days: 7, data_points: entities.length },
      content: { summary: `#${topChannel.payload.channel_name}: ${concentrationPct}% de todos los mensajes.`, implication: concentrationPct > 70 ? 'Comunicación concentrada en un canal.' : 'Comunicación distribuida.', severity: concentrationPct > 70 ? 'attention' : 'info' },
      confidence: conf, entity_ids: entities.map(e => e.id), include_in_context: concentrationPct > 70, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'slack', confidence: conf, timestamp: ts, entity_count: entities.length }], sources_discarded: [],
    })
  }

  // 3. Participation breadth — what % of members are actively writing?
  const totalMembers = entities.reduce((s, e) => s + e.payload.member_count, 0)
  const totalAuthors = entities.reduce((s, e) => s + e.payload.unique_authors, 0)
  if (totalMembers > 0 && conf >= 0.5) {
    const participationPct = Math.min(100, Math.round((totalAuthors / totalMembers) * 100))
    candidates.push({
      insight_type: 'participation_breadth',
      signal: { metric_name: 'participation_pct', current_value: participationPct, period_days: 7, data_points: entities.length },
      content: { summary: `${totalAuthors} personas escribieron de ${totalMembers} miembros (${participationPct}%).`, implication: participationPct < 30 ? 'Solo un grupo pequeño participa — riesgo de silos de información.' : participationPct < 60 ? 'Participación moderada.' : 'Participación amplia.', severity: participationPct < 30 ? 'warning' : participationPct < 60 ? 'attention' : 'info', action_hint: participationPct < 30 ? 'Muchos miembros silenciosos. Incentiva la participación o verifica que están activos en otro canal.' : undefined },
      confidence: conf, entity_ids: entities.map(e => e.id), include_in_context: participationPct < 60, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'slack', confidence: conf, timestamp: ts, entity_count: entities.length }], sources_discarded: [],
    })
  }

  // 4. Silent channels — channels with 0 messages in 7 days
  const silent = entities.filter(e => e.payload.message_count === 0)
  if (silent.length > 0 && entities.length >= 3 && conf >= 0.5) {
    candidates.push({
      insight_type: 'silent_channels',
      signal: { metric_name: 'silent_channel_count', current_value: silent.length, period_days: 7, data_points: entities.length },
      content: { summary: `${silent.length} canales sin mensajes en 7 días: ${silent.slice(0, 3).map(e => '#' + e.payload.channel_name).join(', ')}${silent.length > 3 ? '...' : ''}.`, implication: 'Canales muertos generan ruido. Archivarlos simplifica la comunicación.', severity: silent.length > 5 ? 'attention' : 'info', action_hint: `Archiva o revisa ${silent.length} canales silenciosos.` },
      confidence: conf, entity_ids: silent.map(e => e.id), include_in_context: silent.length > 3, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'slack', confidence: conf, timestamp: ts, entity_count: silent.length }], sources_discarded: [],
    })
  }

  return writeInsights(client, projectId, syncRunId, 'slack_communication', candidates)
}

// ══════════════════════════════════════════════════════════════════
// Notion Knowledge Agent (pages/databases) — 4 insights
// ══════════════════════════════════════════════════════════════════

export async function runNotionKnowledgeAgentServer(
  client: SupabaseClient, projectId: string, syncRunId: string,
): Promise<PostSyncResult> {
  const { data: raw } = await client
    .from('integration_entities').select('id, confidence, payload, entity_type')
    .eq('project_id', projectId).eq('provider', 'notion').in('entity_type', ['page', 'database']).neq('status', 'rejected')

  const entities = (raw ?? []).map(r => ({
    id: r.id, confidence: r.confidence,
    entity_type: String(r.entity_type ?? 'page'),
    payload: {
      title: String((r.payload as Record<string, unknown>)['title'] ?? 'Untitled'),
      days_since_edit: Number((r.payload as Record<string, unknown>)['days_since_edit'] ?? 0),
      is_archived: Boolean((r.payload as Record<string, unknown>)['is_archived']),
      created_at: (r.payload as Record<string, unknown>)['created_at'] as string | undefined,
      last_edited_at: (r.payload as Record<string, unknown>)['last_edited_at'] as string | undefined,
      parent_type: (r.payload as Record<string, unknown>)['parent_type'] as string | undefined,
      property_count: Number((r.payload as Record<string, unknown>)['property_count'] ?? 0),
    },
  }))
  if (entities.length < 1) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'notion_knowledge' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()
  const now = new Date()
  const conf = entities.reduce((s, e) => s + e.confidence, 0) / entities.length
  const pages = entities.filter(e => e.entity_type === 'page' && !e.payload.is_archived)
  const databases = entities.filter(e => e.entity_type === 'database')

  // 1. Documentation coverage
  if (conf >= 0.5) {
    candidates.push({
      insight_type: 'documentation_coverage',
      signal: { metric_name: 'total_pages', current_value: pages.length, period_days: 0, data_points: entities.length },
      content: { summary: `${pages.length} páginas activas + ${databases.length} databases en Notion.`, implication: pages.length > 20 ? 'Documentación extensa.' : pages.length > 5 ? 'Documentación básica.' : 'Poca documentación — riesgo de conocimiento no capturado.', severity: pages.length < 5 ? 'attention' : 'info', action_hint: pages.length < 5 ? 'Documenta decisiones y procesos clave.' : undefined },
      confidence: conf, entity_ids: entities.map(e => e.id), include_in_context: pages.length < 10, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'notion', confidence: conf, timestamp: ts, entity_count: entities.length }], sources_discarded: [],
    })
  }

  // 2. Staleness
  const stale = pages.filter(p => p.payload.days_since_edit > 30)
  if (pages.length >= 5 && conf >= 0.5) {
    const stalePct = Math.round((stale.length / pages.length) * 100)
    candidates.push({
      insight_type: 'documentation_staleness',
      signal: { metric_name: 'stale_pages_pct', current_value: stalePct, period_days: 30, data_points: pages.length },
      content: { summary: `${stalePct}% de páginas sin editar en 30+ días (${stale.length}/${pages.length}).`, implication: stalePct > 50 ? 'Más de la mitad desactualizada.' : 'Documentación razonablemente actualizada.', severity: stalePct > 50 ? 'warning' : stalePct > 30 ? 'attention' : 'info', action_hint: stalePct > 30 ? `Revisa ${stale.length} páginas desactualizadas.` : undefined },
      confidence: conf, entity_ids: stale.map(e => e.id), include_in_context: stalePct > 30, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'notion', confidence: conf, timestamp: ts, entity_count: pages.length }], sources_discarded: [],
    })
  }

  // 3. Recently active — pages edited in last 7 days (momentum signal)
  const recentlyActive = pages.filter(p => p.payload.days_since_edit <= 7)
  if (pages.length >= 3 && conf >= 0.5) {
    const activePct = Math.round((recentlyActive.length / pages.length) * 100)
    candidates.push({
      insight_type: 'knowledge_momentum',
      signal: { metric_name: 'recently_active_pct', current_value: activePct, period_days: 7, data_points: pages.length },
      content: { summary: `${recentlyActive.length} páginas editadas esta semana (${activePct}% del total).`, implication: activePct > 30 ? 'Equipo documentando activamente.' : activePct > 10 ? 'Documentación con actividad moderada.' : 'Poca actividad de documentación esta semana.', severity: activePct < 10 ? 'attention' : 'info', action_hint: activePct < 10 ? 'El equipo no está documentando. ¿Se están tomando decisiones sin registrar?' : undefined },
      confidence: conf, entity_ids: recentlyActive.map(e => e.id), include_in_context: activePct < 15, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'notion', confidence: conf, timestamp: ts, entity_count: recentlyActive.length }], sources_discarded: [],
    })
  }

  // 4. Untitled/orphan pages — pages without meaningful title (knowledge debt)
  const untitled = pages.filter(p => p.payload.title === 'Untitled' || p.payload.title === '' || p.payload.title.length < 3)
  if (untitled.length > 0 && pages.length >= 5 && conf >= 0.5) {
    const untitledPct = Math.round((untitled.length / pages.length) * 100)
    candidates.push({
      insight_type: 'knowledge_debt',
      signal: { metric_name: 'untitled_pages_count', current_value: untitled.length, period_days: 0, data_points: pages.length },
      content: { summary: `${untitled.length} páginas sin título o vacías (${untitledPct}%).`, implication: 'Páginas sin título son indetectables — conocimiento perdido.', severity: untitled.length > 5 ? 'attention' : 'info', action_hint: `Nombra o elimina ${untitled.length} páginas sin título en Notion.` },
      confidence: conf, entity_ids: untitled.map(e => e.id), include_in_context: untitled.length > 3, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'notion', confidence: conf, timestamp: ts, entity_count: untitled.length }], sources_discarded: [],
    })
  }

  return writeInsights(client, projectId, syncRunId, 'notion_knowledge', candidates)
}

// ══════════════════════════════════════════════════════════════════
// Team Agent (internal data — project_members + tasks) — 3 insights
// Runs proactively after ANY sync (not just specific provider).
// ══════════════════════════════════════════════════════════════════

export async function runTeamAgentServer(
  client: SupabaseClient, projectId: string, syncRunId: string,
): Promise<PostSyncResult> {
  // Read team members with activity stats
  const { data: raw } = await client.rpc('get_project_task_stats', { p_project_id: projectId })
  const stats = raw as { overdue_count: number; done_this_week: number; total_open: number } | null

  const { data: members } = await client
    .from('project_members')
    .select('member_id, is_lead')
    .eq('project_id', projectId)
    .eq('role_accepted', true)

  if (!members || members.length < 2) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'team' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()
  const conf = 0.85

  // 1. Team overdue tasks
  const overdueCount = stats?.overdue_count ?? 0
  if (overdueCount >= 3) {
    candidates.push({
      insight_type: 'team_overdue_tasks',
      signal: { metric_name: 'team_overdue_count', current_value: overdueCount, period_days: 0, data_points: members.length },
      content: {
        summary: `${overdueCount} tareas vencidas en el equipo (${members.length} miembros).`,
        implication: overdueCount >= 5 ? 'Deuda de ejecución alta — el equipo no da abasto.' : 'Tareas acumulándose — priorizar antes de crear nuevas.',
        severity: overdueCount >= 5 ? 'warning' : 'attention',
        action_hint: `Prioriza ${overdueCount} tareas vencidas antes de crear nuevas.`,
      },
      confidence: conf, entity_ids: [], include_in_context: true, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'internal', confidence: 0.9, timestamp: ts, entity_count: members.length }], sources_discarded: [],
    })
  }

  // 2. Execution velocity
  const doneThisWeek = stats?.done_this_week ?? 0
  const totalOpen = stats?.total_open ?? 0
  if (totalOpen > 0) {
    const weeklyRate = doneThisWeek
    const weeksToClose = weeklyRate > 0 ? Math.round(totalOpen / weeklyRate) : 999
    candidates.push({
      insight_type: 'team_velocity',
      signal: { metric_name: 'tasks_done_7d', current_value: doneThisWeek, period_days: 7, data_points: members.length },
      content: {
        summary: `${doneThisWeek} tareas/semana. ${totalOpen} abiertas. ${weeksToClose < 999 ? weeksToClose + ' semanas para cerrar backlog.' : 'Sin velocidad.'}`,
        implication: doneThisWeek === 0 ? 'Sin actividad esta semana.' : weeksToClose > 8 ? 'Backlog creciendo más rápido que la ejecución.' : 'Ritmo aceptable.',
        severity: doneThisWeek === 0 ? 'warning' : weeksToClose > 8 ? 'attention' : 'info',
        action_hint: doneThisWeek === 0 ? 'El equipo no completó tareas esta semana. Verifica si hay bloqueos.' : undefined,
      },
      confidence: conf, entity_ids: [], include_in_context: doneThisWeek === 0 || weeksToClose > 8, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'internal', confidence: 0.9, timestamp: ts, entity_count: members.length }], sources_discarded: [],
    })
  }

  // 3. Team size signal
  if (members.length >= 2) {
    const leads = members.filter(m => m.is_lead).length
    candidates.push({
      insight_type: 'team_composition',
      signal: { metric_name: 'team_size', current_value: members.length, period_days: 0, data_points: members.length },
      content: {
        summary: `Equipo: ${members.length} miembros (${leads} lead${leads !== 1 ? 's' : ''}).`,
        implication: members.length > 5 ? 'Equipo grande — asegura que los roles están bien definidos.' : 'Equipo compacto.',
        severity: 'info',
      },
      confidence: conf, entity_ids: [], include_in_context: false, expires_hours: 7 * 24,
      evidence_type: 'observed', sources_used: [{ source: 'internal', confidence: 0.95, timestamp: ts, entity_count: members.length }], sources_discarded: [],
    })
  }

  return writeInsights(client, projectId, syncRunId, 'team', candidates)
}
