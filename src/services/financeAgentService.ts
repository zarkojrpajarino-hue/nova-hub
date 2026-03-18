/**
 * financeAgentService — I15.78 (DB interface para Finance Agent)
 *
 * Lee integration_entities, ejecuta el Finance Agent puro, aplica anti-spam,
 * escribe integration_insights y devuelve resumen.
 *
 * Motor writes (I15.DEBT.5 cerrado):
 *   - revenue_concentration → project_economic_profile.top_client_revenue_percent
 *     Escrito en sync-stripe (server-side, sync_run='running'), no aquí.
 *     Razón: write_integration_to_engine_table es SECURITY DEFINER GRANT TO service_role —
 *     el cliente (JWT de usuario) no puede llamarla. Motor writes van en edge functions.
 *   El campo motor_write en integration_insights documenta el target para auditabilidad.
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
        // I15.DEBT.5: motor write para revenue_concentration se ejecuta en sync-stripe (server-side).
        // Este campo documenta el target para auditabilidad en integration_insights.
        motor_write: insight.insight_type === 'revenue_concentration'
          ? { target: 'project_economic_profile', field: 'top_client_revenue_percent', executed_in: 'sync-stripe' }
          : null,
      },
      confidence:         insight.confidence,
      source_timestamp:   generatedAt.toISOString(),
      generated_at:       generatedAt.toISOString(),
      expires_at:         expiresAt.toISOString(),
      include_in_context: insight.include_in_context,
      status:             'pending',
      // T17.13 — metadata de evidencia
      evidence_type:        insight.evidence_type,
      sources_used:         insight.sources_used,
      sources_discarded:    insight.sources_discarded,
      low_evidence_quality: insight.confidence < 0.5 && insight.entity_ids.length === 0,
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
    .select('id, insight_type, payload, confidence, generated_at, expires_at, evidence_type, sources_used, sources_discarded')
    .eq('project_id', projectId)
    .eq('agent_type', 'finance')
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  if (error) throw new Error(`Finance Agent: error leyendo insights — ${error.message}`)
  return data ?? []
}
