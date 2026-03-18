/**
 * calendarAgentService — I15.82 (DB interface para Calendar Agent)
 *
 * Lee integration_entities[entity_type='calendar_event', provider='google_calendar'],
 * ejecuta el Calendar Agent puro, aplica anti-spam,
 * escribe integration_insights y devuelve resumen.
 *
 * Sin motor writes en v1 — I15.DEBT.5 aplica igual que Finance/Sales/Execution Agent.
 * Calendar Agent escribe meeting_pressure al Phase Engine en v2.
 */

import { supabase } from '@/integrations/supabase/client'
import {
  runCalendarAgentLocal,
  type CalendarEventEntityRow,
  type CalendarInsightData,
} from '@/lib/calendar-agent'

export interface RunCalendarAgentResult {
  insights_emitted:       number
  insights_skipped_dedup: number
  insight_types:          string[]
}

type RawCalendarEntity = {
  id:          string
  confidence:  number
  occurred_at: string
  payload:     Record<string, unknown>
}

function toCalendarEventEntityRow(raw: RawCalendarEntity): CalendarEventEntityRow {
  const p = raw.payload
  return {
    id:          raw.id,
    confidence:  raw.confidence,
    occurred_at: raw.occurred_at,
    payload: {
      title:    typeof p['title']    === 'string' ? p['title']    : '',
      start_at: typeof p['start_at'] === 'string' ? p['start_at'] : raw.occurred_at,
      end_at:   typeof p['end_at']   === 'string' ? p['end_at']   : raw.occurred_at,
      ...(typeof p['attendee_count']  === 'number' && { attendee_count:  p['attendee_count'] as number }),
      ...(typeof p['organizer_email'] === 'string' && { organizer_email: p['organizer_email'] as string }),
      ...(typeof p['location']        === 'string' && { location:        p['location'] as string }),
    },
  }
}

/**
 * Ejecuta el Calendar Agent para un proyecto y connection_id.
 * Llamar tras un sync exitoso desde GoogleCalendarIntegration.
 *
 * Flujo:
 * 1. Leer entidades de tipo 'calendar_event' del proyecto
 * 2. Obtener sync_run_id del último sync completado
 * 3. Computar insights (pure function, con now = fecha actual)
 * 4. Filtrar los ya existentes y no expirados (anti-spam §10)
 * 5. Insertar los nuevos en integration_insights
 */
export async function runCalendarAgent(
  projectId: string,
  connectionId: string,
): Promise<RunCalendarAgentResult> {
  // ── 1. Leer entidades de calendar_event ─────────────────────────────────────
  const { data: rawEntities, error: entitiesErr } = await supabase
    .from('integration_entities')
    .select('id, confidence, occurred_at, payload')
    .eq('project_id', projectId)
    .eq('entity_type', 'calendar_event')
    .eq('provider', 'google_calendar')
    .neq('status', 'rejected')

  if (entitiesErr) throw new Error(`Calendar Agent: error leyendo entidades — ${entitiesErr.message}`)

  const entities = (rawEntities ?? []).map(toCalendarEventEntityRow)
  if (entities.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: 0, insight_types: [] }
  }

  // ── 2. Obtener sync_run_id del último sync completado ─────────────────────
  const { data: lastRun } = await supabase
    .from('integration_sync_runs')
    .select('id')
    .eq('connection_id', connectionId)
    .in('status', ['completed', 'partial'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastRun) {
    return { insights_emitted: 0, insights_skipped_dedup: 0, insight_types: [] }
  }
  const syncRunId = lastRun.id

  // ── 3. Computar insights (pure) ─────────────────────────────────────────────
  const now = new Date()
  const candidates: CalendarInsightData[] = runCalendarAgentLocal(entities, now)
  if (candidates.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: 0, insight_types: [] }
  }

  // ── 4. Anti-spam: excluir tipos que aún no han expirado (§10) ───────────────
  const candidateTypes = candidates.map((c) => c.insight_type)
  const nowIso = now.toISOString()

  const { data: existing } = await supabase
    .from('integration_insights')
    .select('insight_type')
    .eq('project_id', projectId)
    .eq('agent_type', 'calendar')
    .in('insight_type', candidateTypes)
    .gt('expires_at', nowIso)

  const existingTypes = new Set((existing ?? []).map((r: { insight_type: string }) => r.insight_type))
  const toEmit = candidates.filter((c) => !existingTypes.has(c.insight_type))
  const skipped = candidates.length - toEmit.length

  if (toEmit.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: skipped, insight_types: [] }
  }

  // ── 5. Insertar insights nuevos ──────────────────────────────────────────────
  const generatedAt = new Date()
  const rows = toEmit.map((insight) => {
    const expiresAt = new Date(generatedAt.getTime() + insight.expires_hours * 3_600_000)
    return {
      sync_run_id:        syncRunId,
      project_id:         projectId,
      agent_type:         'calendar',
      insight_type:       insight.insight_type,
      entity_ids:         insight.entity_ids,
      payload: {
        signal:      insight.signal,
        content:     insight.content,
        motor_write: null,  // I15.DEBT.5 — no motor writes en v1
      },
      confidence:         insight.confidence,
      source_timestamp:   generatedAt.toISOString(),
      generated_at:       generatedAt.toISOString(),
      expires_at:         expiresAt.toISOString(),
      include_in_context: insight.include_in_context,
      status:             'pending',
      // T17.16 — metadata de evidencia
      evidence_type:        insight.evidence_type,
      sources_used:         insight.sources_used,
      sources_discarded:    insight.sources_discarded,
      low_evidence_quality: insight.confidence < 0.5 && insight.entity_ids.length === 0,
    }
  })

  const { error: insertErr } = await supabase.from('integration_insights').insert(rows)
  if (insertErr) throw new Error(`Calendar Agent: error escribiendo insights — ${insertErr.message}`)

  return {
    insights_emitted:       toEmit.length,
    insights_skipped_dedup: skipped,
    insight_types:          toEmit.map((c) => c.insight_type),
  }
}

/**
 * Lee los insights activos (no expirados) del Calendar Agent para un proyecto.
 * Usado por CalendarInsightsCard para mostrar insights persistentes (surviven reload).
 */
export async function getActiveCalendarInsights(projectId: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('integration_insights')
    .select('id, insight_type, payload, confidence, generated_at, expires_at, evidence_type, sources_used, sources_discarded')
    .eq('project_id', projectId)
    .eq('agent_type', 'calendar')
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  if (error) throw new Error(`Calendar Agent: error leyendo insights — ${error.message}`)
  return data ?? []
}
