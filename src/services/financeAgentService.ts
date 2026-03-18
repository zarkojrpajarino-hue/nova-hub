/**
 * financeAgentService — I15.78 (DB interface para Finance Agent)
 *
 * Lee integration_entities, ejecuta el Finance Agent puro, aplica anti-spam,
 * escribe integration_insights y devuelve resumen.
 *
 * Sin motor writes en v1 — I15.DEBT.5:
 *   write_integration_to_engine_table() requiere sync_run.status='running'.
 *   El Finance Agent corre post-sync (status='completed'). Incompatible.
 *   En v2: crear sync_run de tipo 'agent_analysis' o modificar el guard
 *   para aceptar el sync_run del agente (diferente al del proveedor).
 */

import { supabase } from '@/integrations/supabase/client'
import {
  runFinanceAgentLocal,
  type SubscriptionEntityRow,
  type FinanceInsightData,
} from '@/lib/finance-agent'

export interface RunFinanceAgentResult {
  insights_emitted: number
  insights_skipped_dedup: number
  insight_types: string[]
}

type RawEntity = {
  id: string
  confidence: number
  payload: Record<string, unknown>
}

function toSubscriptionRow(raw: RawEntity): SubscriptionEntityRow {
  const p = raw.payload
  return {
    id: raw.id,
    confidence: raw.confidence,
    payload: {
      status: (p['status'] as SubscriptionEntityRow['payload']['status']) ?? 'cancelled',
      mrr_contribution: typeof p['mrr_contribution'] === 'number' ? p['mrr_contribution'] : 0,
      customer_id: typeof p['customer_id'] === 'string' ? p['customer_id'] : undefined,
    },
  }
}

/**
 * Ejecuta el Finance Agent para un proyecto y connection_id.
 * Llamar tras un sync exitoso desde StripeIntegration.
 *
 * Flujo:
 * 1. Leer entidades de tipo 'subscription' del proyecto
 * 2. Obtener sync_run_id del último sync completado
 * 3. Computar insights (pure function)
 * 4. Filtrar los ya existentes y no expirados (anti-spam §10)
 * 5. Insertar los nuevos en integration_insights
 */
export async function runFinanceAgent(
  projectId: string,
  connectionId: string,
): Promise<RunFinanceAgentResult> {
  // ── 1. Leer entidades de suscripción ────────────────────────────────────────
  const { data: rawEntities, error: entitiesErr } = await supabase
    .from('integration_entities')
    .select('id, confidence, payload')
    .eq('project_id', projectId)
    .eq('entity_type', 'subscription')
    .eq('provider', 'stripe')
    .neq('status', 'rejected')  // excluir entidades rechazadas por el normalizer

  if (entitiesErr) throw new Error(`Finance Agent: error leyendo entidades — ${entitiesErr.message}`)

  const entities = (rawEntities ?? []).map(toSubscriptionRow)
  if (entities.length === 0) {
    return { insights_emitted: 0, insights_skipped_dedup: 0, insight_types: [] }
  }

  // ── 2. Obtener sync_run_id del último sync completado ─────────────────────
  const { data: lastRun } = await supabase
    .from('integration_sync_runs')
    .select('id')
    .eq('connection_id', connectionId)
    .in('status', ['completed', 'partial'])  // aceptar parciales también
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastRun) {
    return { insights_emitted: 0, insights_skipped_dedup: 0, insight_types: [] }
  }
  const syncRunId = lastRun.id

  // ── 3. Computar insights (pure) ─────────────────────────────────────────────
  const candidates: FinanceInsightData[] = runFinanceAgentLocal(entities)
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
    .eq('agent_type', 'finance')
    .in('insight_type', candidateTypes)
    .gt('expires_at', now)  // aún vigentes

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
      agent_type:         'finance',
      insight_type:       insight.insight_type,
      entity_ids:         insight.entity_ids,
      payload: {
        signal:       insight.signal,
        content:      insight.content,
        motor_write:  null,  // I15.DEBT.5 — no motor writes en v1
      },
      confidence:         insight.confidence,
      source_timestamp:   generatedAt.toISOString(),
      generated_at:       generatedAt.toISOString(),
      expires_at:         expiresAt.toISOString(),
      include_in_context: insight.include_in_context,
      status:             'pending',
    }
  })

  const { error: insertErr } = await supabase.from('integration_insights').insert(rows)
  if (insertErr) throw new Error(`Finance Agent: error escribiendo insights — ${insertErr.message}`)

  return {
    insights_emitted: toEmit.length,
    insights_skipped_dedup: skipped,
    insight_types: toEmit.map((c) => c.insight_type),
  }
}

/**
 * Lee los insights activos (no expirados) del Finance Agent para un proyecto.
 * Usado por FinanceInsightsCard para mostrar insights persistentes (surviven reload).
 */
export async function getActiveFinanceInsights(projectId: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('integration_insights')
    .select('id, insight_type, payload, confidence, generated_at, expires_at')
    .eq('project_id', projectId)
    .eq('agent_type', 'finance')
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  if (error) throw new Error(`Finance Agent: error leyendo insights — ${error.message}`)
  return data ?? []
}
