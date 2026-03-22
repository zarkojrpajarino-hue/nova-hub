/**
 * executionAgentService — I15.80 (DB interface para Execution Agent)
 *
 * Lee integration_entities[entity_type='task', provider='asana'],
 * ejecuta el Execution Agent puro, aplica anti-spam,
 * escribe integration_insights y devuelve resumen.
 *
 * Sin motor writes en v1 — Execution Agent escribe `execution_health`
 * al Phase Engine en v2 (AGENTS_CONTRACT.md §3). Compatible con post-sync
 * a diferencia del Finance Agent (I15.DEBT.5 no aplica aquí porque
 * el Execution Agent no necesita sync_run activo para emitir insights).
 */

import { supabase } from '@/integrations/supabase/client'
import {
  runExecutionAgentLocal,
  type TaskEntityRow,
  type ExecutionInsightData,
} from '@/lib/execution-agent'
import { hasSignificantValueChange, extractSignalValue } from '@/lib/agent-antispam'

export interface RunExecutionAgentResult {
  insights_emitted:      number
  insights_skipped_dedup: number
  insight_types:         string[]
}

type RawTaskEntity = {
  id:         string
  confidence: number
  payload:    Record<string, unknown>
}

function toTaskEntityRow(raw: RawTaskEntity): TaskEntityRow {
  const p = raw.payload
  return {
    id:         raw.id,
    confidence: raw.confidence,
    payload: {
      task_name:  typeof p['task_name'] === 'string' ? p['task_name'] : '',
      status:     (p['status'] === 'completed' ? 'completed' : 'open') as 'open' | 'completed',
      ...(typeof p['due_date'] === 'string'              && { due_date:             p['due_date'] as string }),
      ...(typeof p['completed_at'] === 'string'          && { completed_at:         p['completed_at'] as string }),
      ...(typeof p['section'] === 'string'               && { section:              p['section'] as string }),
      ...(typeof p['project_external_id'] === 'string'   && { project_external_id:  p['project_external_id'] as string }),
      ...(typeof p['assignee_external_id'] === 'string'  && { assignee_external_id: p['assignee_external_id'] as string }),
    },
  }
}

/**
 * Ejecuta el Execution Agent para un proyecto y connection_id.
 * Llamar tras un sync exitoso desde AsanaIntegration.
 *
 * Flujo:
 * 1. Leer entidades de tipo 'task' del proyecto
 * 2. Obtener sync_run_id del último sync completado
 * 3. Computar insights (pure function)
 * 4. Filtrar los ya existentes y no expirados (anti-spam §10)
 * 5. Insertar los nuevos en integration_insights
 */
export async function runExecutionAgent(
  projectId:    string,
  connectionId: string,
): Promise<RunExecutionAgentResult> {
  // ── 1. Leer entidades de tarea ───────────────────────────────────────────────
  const { data: rawEntities, error: entitiesErr } = await supabase
    .from('integration_entities')
    .select('id, confidence, payload')
    .eq('project_id', projectId)
    .eq('entity_type', 'task')
    .eq('provider', 'asana')
    .neq('status', 'rejected')

  if (entitiesErr) throw new Error(`Execution Agent: error leyendo entidades — ${entitiesErr.message}`)

  const entities = (rawEntities ?? []).map(toTaskEntityRow)
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
  const candidates: ExecutionInsightData[] = runExecutionAgentLocal(entities)
  if (candidates.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: 0, insight_types: [] }
  }

  // ── 4. Anti-spam §10: TTL + 15% value-change threshold ─────────────────────
  const candidateTypes = candidates.map((c) => c.insight_type)
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from('integration_insights')
    .select('id, insight_type, payload')
    .eq('project_id', projectId)
    .eq('agent_type', 'execution')
    .in('insight_type', candidateTypes)
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  const latestByType = new Map<string, { id: string; payload: Record<string, unknown> | null }>()
  for (const row of existing ?? []) {
    if (!latestByType.has(row.insight_type)) {
      latestByType.set(row.insight_type, { id: row.id, payload: row.payload as Record<string, unknown> | null })
    }
  }

  const toEmit: ExecutionInsightData[] = []
  const idsToExpire: string[] = []

  for (const candidate of candidates) {
    const prev = latestByType.get(candidate.insight_type)
    if (!prev) {
      toEmit.push(candidate)
    } else {
      const prevValue = extractSignalValue(prev.payload)
      const currValue = candidate.signal.current_value
      if (prevValue !== null && hasSignificantValueChange(currValue, prevValue)) {
        toEmit.push(candidate)
        idsToExpire.push(prev.id)
      }
    }
  }

  const skipped = candidates.length - toEmit.length

  if (toEmit.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: skipped, insight_types: [] }
  }

  if (idsToExpire.length > 0) {
    await supabase
      .from('integration_insights')
      .update({ expires_at: now })
      .in('id', idsToExpire)
  }

  // ── 5. Insertar insights nuevos ──────────────────────────────────────────────
  const generatedAt = new Date()
  const rows = toEmit.map((insight) => {
    const expiresAt = new Date(generatedAt.getTime() + insight.expires_hours * 3_600_000)
    return {
      sync_run_id:        syncRunId,
      project_id:         projectId,
      agent_type:         'execution',
      insight_type:       insight.insight_type,
      entity_ids:         insight.entity_ids,
      payload: {
        signal:      insight.signal,
        content:     insight.content,
        motor_write: null,  // sin motor writes en v1
      },
      confidence:         insight.confidence,
      source_timestamp:   generatedAt.toISOString(),
      generated_at:       generatedAt.toISOString(),
      expires_at:         expiresAt.toISOString(),
      include_in_context: insight.include_in_context,
      status:             'pending',
      // T17.15 — metadata de evidencia
      evidence_type:        insight.evidence_type,
      sources_used:         insight.sources_used,
      sources_discarded:    insight.sources_discarded,
      low_evidence_quality: insight.confidence < 0.5 && insight.entity_ids.length === 0,
    }
  })

  const { error: insertErr } = await supabase.from('integration_insights').insert(rows)
  if (insertErr) throw new Error(`Execution Agent: error escribiendo insights — ${insertErr.message}`)

  return {
    insights_emitted:       toEmit.length,
    insights_skipped_dedup: skipped,
    insight_types:          toEmit.map((c) => c.insight_type),
  }
}

/**
 * Lee los insights activos (no expirados) del Execution Agent para un proyecto.
 * Usado por ExecutionInsightsCard para mostrar insights persistentes.
 */
export async function getActiveExecutionInsights(projectId: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('integration_insights')
    .select('id, insight_type, payload, confidence, generated_at, expires_at, evidence_type, sources_used, sources_discarded')
    .eq('project_id', projectId)
    .eq('agent_type', 'execution')
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  if (error) throw new Error(`Execution Agent: error leyendo insights — ${error.message}`)
  return data ?? []
}
