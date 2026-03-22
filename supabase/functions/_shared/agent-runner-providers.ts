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
// Sales Agent (HubSpot deals)
// ══════════════════════════════════════════════════════════════════

const ACTIVE_STAGES = new Set(['prospect', 'qualified', 'proposal', 'negotiation'])

export async function runSalesAgentServer(
  client: SupabaseClient, projectId: string, syncRunId: string,
): Promise<PostSyncResult> {
  const { data: raw } = await client
    .from('integration_entities').select('id, confidence, payload')
    .eq('project_id', projectId).eq('entity_type', 'deal').eq('provider', 'hubspot').neq('status', 'rejected')

  const entities = (raw ?? []).map(r => ({
    id: r.id, confidence: r.confidence,
    payload: {
      stage: String((r.payload as Record<string, unknown>)['stage'] ?? 'prospect'),
      amount_cents: Number((r.payload as Record<string, unknown>)['amount_cents'] ?? 0),
    },
  }))
  if (entities.length === 0) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'sales' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()

  // Open pipeline value
  const active = entities.filter(e => ACTIVE_STAGES.has(e.payload.stage))
  if (active.length >= 1) {
    const conf = active.reduce((s, e) => s + e.confidence, 0) / active.length
    if (conf >= 0.5) {
      const euros = active.reduce((s, e) => s + e.payload.amount_cents, 0) / 100
      candidates.push({
        insight_type: 'open_pipeline_value',
        signal: { metric_name: 'open_pipeline_euros', current_value: euros, period_days: 0, data_points: active.length },
        content: { summary: `Pipeline activo: \u20AC${euros.toFixed(0)} en ${active.length} deals.`, implication: 'Valor de pipeline disponible para forecasting.', severity: 'info' },
        confidence: conf, entity_ids: active.map(e => e.id), include_in_context: true, expires_hours: 24,
        evidence_type: 'observed', sources_used: [{ source: 'hubspot', confidence: conf, timestamp: ts, entity_count: active.length }], sources_discarded: [],
      })
    }
  }

  // Conversion rate
  const closed = entities.filter(e => e.payload.stage === 'closed_won' || e.payload.stage === 'closed_lost')
  const won = closed.filter(e => e.payload.stage === 'closed_won')
  const lost = closed.filter(e => e.payload.stage === 'closed_lost')
  if (closed.length >= 3 && lost.length > 0) {
    const rate = Math.round((won.length / closed.length) * 100)
    const conf = closed.reduce((s, e) => s + e.confidence, 0) / closed.length
    if (conf >= 0.5) {
      candidates.push({
        insight_type: 'pipeline_conversion_rate',
        signal: { metric_name: 'win_rate_pct', current_value: rate, period_days: 0, data_points: closed.length },
        content: { summary: `Win rate: ${rate}% (${won.length}/${closed.length}).`, implication: rate >= 50 ? 'Conversión saludable.' : 'Conversión baja.', severity: rate >= 50 ? 'info' : rate >= 25 ? 'attention' : 'warning', action_hint: rate < 50 ? `Revisa ${lost.length} deals perdidos.` : undefined },
        confidence: conf, entity_ids: closed.map(e => e.id), include_in_context: rate < 50, expires_hours: 7 * 24,
        evidence_type: 'observed', sources_used: [{ source: 'hubspot', confidence: conf, timestamp: ts, entity_count: closed.length }], sources_discarded: [],
      })
    }
  }

  return writeInsights(client, projectId, syncRunId, 'sales', candidates)
}

// ══════════════════════════════════════════════════════════════════
// Execution Agent (Asana tasks)
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
    },
  }))
  if (entities.length < 5) return { insights_emitted: 0, insights_skipped: 0, agent_type: 'execution' }

  const candidates: InsightData[] = []
  const ts = new Date().toISOString()
  const completed = entities.filter(e => e.payload.status === 'completed')
  const open = entities.filter(e => e.payload.status === 'open')
  const conf = entities.reduce((s, e) => s + e.confidence, 0) / entities.length

  // Completion rate
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

  // Overdue ratio
  const now = new Date()
  const withDue = open.filter(e => e.payload.due_date)
  const overdue = withDue.filter(e => new Date(e.payload.due_date!) < now)
  if (withDue.length >= 3) {
    const ratio = Math.round((overdue.length / withDue.length) * 100)
    candidates.push({
      insight_type: 'overdue_ratio',
      signal: { metric_name: 'overdue_ratio_pct', current_value: ratio, period_days: 0, data_points: withDue.length },
      content: { summary: `${overdue.length}/${withDue.length} tareas vencidas (${ratio}%).`, implication: ratio > 50 ? 'Más de la mitad vencidas.' : 'Deuda controlada.', severity: ratio > 50 ? 'warning' : ratio > 25 ? 'attention' : 'info', action_hint: ratio > 25 ? `Cierra o replanifica ${overdue.length} tareas vencidas.` : undefined },
      confidence: conf, entity_ids: overdue.map(e => e.id), include_in_context: ratio > 25, expires_hours: 24,
      evidence_type: 'observed', sources_used: [{ source: 'asana', confidence: conf, timestamp: ts, entity_count: withDue.length }], sources_discarded: [],
    })
  }

  return writeInsights(client, projectId, syncRunId, 'execution', candidates)
}

// ══════════════════════════════════════════════════════════════════
// Calendar Agent (Google Calendar)
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

  // Meeting load
  candidates.push({
    insight_type: 'meeting_load',
    signal: { metric_name: 'meeting_hours_7d', current_value: hours, period_days: 7, data_points: future.length },
    content: { summary: `${hours}h de reuniones en 7 días (${future.length} eventos).`, implication: hours > 20 ? 'Carga muy alta.' : hours > 10 ? 'Carga moderada.' : 'Carga ligera.', severity: hours > 20 ? 'warning' : hours > 10 ? 'attention' : 'info', action_hint: hours > 20 ? 'Cancela o reagrupa reuniones.' : undefined },
    confidence: conf, entity_ids: future.map(e => e.id), include_in_context: hours > 10, expires_hours: 24,
    evidence_type: 'observed', sources_used: [{ source: 'google_calendar', confidence: conf, timestamp: ts, entity_count: future.length }], sources_discarded: [],
  })

  // Meeting density
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

  return writeInsights(client, projectId, syncRunId, 'calendar', candidates)
}
