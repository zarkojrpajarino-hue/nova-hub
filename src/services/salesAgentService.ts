/**
 * salesAgentService — I15.79 (DB interface para Sales Agent)
 *
 * Lee integration_entities[entity_type='deal', provider='hubspot'],
 * ejecuta el Sales Agent puro, aplica anti-spam,
 * escribe integration_insights y devuelve resumen.
 *
 * Sin motor writes en v1 — I15.DEBT.5 aplica igual que Finance Agent.
 * Sales Agent escribe revenue_momentum al Phase Engine en v2.
 */

import { supabase } from '@/integrations/supabase/client'
import {
  runSalesAgentLocal,
  type DealEntityRow,
  type SalesInsightData,
} from '@/lib/sales-agent'

export interface RunSalesAgentResult {
  insights_emitted:       number
  insights_skipped_dedup: number
  insight_types:          string[]
}

type RawDealEntity = {
  id:         string
  confidence: number
  payload:    Record<string, unknown>
}

function toDealEntityRow(raw: RawDealEntity): DealEntityRow {
  const p = raw.payload
  const validStages = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
  const stage = validStages.includes(p['stage'] as string)
    ? (p['stage'] as DealEntityRow['payload']['stage'])
    : 'prospect'

  return {
    id:         raw.id,
    confidence: raw.confidence,
    payload: {
      deal_name:    typeof p['deal_name']    === 'string' ? p['deal_name']    : '',
      stage,
      amount_cents: typeof p['amount_cents'] === 'number' ? p['amount_cents'] : 0,
      ...(typeof p['owner_id']    === 'string' && { owner_id:    p['owner_id'] as string }),
      ...(typeof p['close_date']  === 'string' && { close_date:  p['close_date'] as string }),
      ...(typeof p['pipeline_id'] === 'string' && { pipeline_id: p['pipeline_id'] as string }),
      ...(typeof p['currency']    === 'string' && { currency:    p['currency'] as string }),
    },
  }
}

/**
 * Ejecuta el Sales Agent para un proyecto y connection_id.
 * Llamar tras un sync exitoso desde HubSpotIntegration.
 *
 * Flujo:
 * 1. Leer entidades de tipo 'deal' del proyecto
 * 2. Obtener sync_run_id del último sync completado
 * 3. Computar insights (pure function)
 * 4. Filtrar los ya existentes y no expirados (anti-spam §10)
 * 5. Insertar los nuevos en integration_insights
 */
export async function runSalesAgent(
  projectId: string,
  connectionId: string,
): Promise<RunSalesAgentResult> {
  // ── 1. Leer entidades de deal ────────────────────────────────────────────────
  const { data: rawEntities, error: entitiesErr } = await supabase
    .from('integration_entities')
    .select('id, confidence, payload')
    .eq('project_id', projectId)
    .eq('entity_type', 'deal')
    .eq('provider', 'hubspot')
    .neq('status', 'rejected')

  if (entitiesErr) throw new Error(`Sales Agent: error leyendo entidades — ${entitiesErr.message}`)

  const entities = (rawEntities ?? []).map(toDealEntityRow)
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
  const candidates: SalesInsightData[] = runSalesAgentLocal(entities)
  if (candidates.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: 0, insight_types: [] }
  }

  // ── 4. Anti-spam: excluir tipos que aún no han expirado (§10) ───────────────
  const candidateTypes = candidates.map((c) => c.insight_type)
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from('integration_insights')
    .select('insight_type')
    .eq('project_id', projectId)
    .eq('agent_type', 'sales')
    .in('insight_type', candidateTypes)
    .gt('expires_at', now)

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
      agent_type:         'sales',
      insight_type:       insight.insight_type,
      entity_ids:         insight.entity_ids,
      payload: {
        signal:      insight.signal,
        content:     insight.content,
        // I15.DEBT.5: deals → obvs se ejecuta en sync-hubspot (server-side).
        // Este campo documenta el target para auditabilidad en integration_insights.
        motor_write: { target: 'obvs', field: 'pipeline_status+valor_potencial', executed_in: 'sync-hubspot' },
      },
      confidence:         insight.confidence,
      source_timestamp:   generatedAt.toISOString(),
      generated_at:       generatedAt.toISOString(),
      expires_at:         expiresAt.toISOString(),
      include_in_context: insight.include_in_context,
      status:             'pending',
      // T17.14 — metadata de evidencia
      evidence_type:        insight.evidence_type,
      sources_used:         insight.sources_used,
      sources_discarded:    insight.sources_discarded,
      low_evidence_quality: insight.confidence < 0.5 && insight.entity_ids.length === 0,
    }
  })

  const { error: insertErr } = await supabase.from('integration_insights').insert(rows)
  if (insertErr) throw new Error(`Sales Agent: error escribiendo insights — ${insertErr.message}`)

  return {
    insights_emitted:       toEmit.length,
    insights_skipped_dedup: skipped,
    insight_types:          toEmit.map((c) => c.insight_type),
  }
}

/**
 * Lee los insights activos (no expirados) del Sales Agent para un proyecto.
 * Usado por SalesInsightsCard para mostrar insights persistentes (surviven reload).
 */
export async function getActiveSalesInsights(projectId: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('integration_insights')
    .select('id, insight_type, payload, confidence, generated_at, expires_at, evidence_type, sources_used, sources_discarded')
    .eq('project_id', projectId)
    .eq('agent_type', 'sales')
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  if (error) throw new Error(`Sales Agent: error leyendo insights — ${error.message}`)
  return data ?? []
}
