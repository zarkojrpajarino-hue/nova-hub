/**
 * finance-agent — I15.78 (pure computation layer)
 *
 * Funciones puras: dada una lista de integration_entities de tipo 'subscription',
 * computa AgentInsight siguiendo AGENTS_CONTRACT.md.
 *
 * Sin efectos secundarios. Sin llamadas a DB.
 *
 * v1 insight_types disponibles con datos Stripe:
 *   - cash_flow_signal   — señal de flujo positivo/negativo (min 1 sub activa)
 *   - revenue_concentration — % MRR de top cliente (min 3 subs con customer_id)
 *
 * Deferred (requieren datos que no existen aún en v1):
 *   - mrr_trend          — requiere 2+ syncs históricos para comparar (I15.DEBT.5)
 *   - runway_estimate    — requiere datos Holded (no implementado)
 *   - expense_spike      — requiere entidades de tipo 'expense' (no sincronizadas)
 *
 * Motor writes (§4.4): no en v1 — write_integration_to_engine_table() requiere
 * sync_run con status='running', incompatible con ejecución post-sync.
 * Registrado como I15.DEBT.5.
 */

export type FinanceInsightType = 'cash_flow_signal' | 'revenue_concentration'

export interface SubscriptionEntityRow {
  id: string                     // integration_entities.id (UUID)
  confidence: number
  payload: {
    status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused'
    mrr_contribution: number     // centavos/mes (entero >= 0)
    customer_id?: string         // ID externo en Stripe
  }
}

export interface FinanceInsightData {
  insight_type: FinanceInsightType
  /** AGENTS_CONTRACT.md §4.2 */
  signal: {
    metric_name: string
    current_value: number
    period_days: number
    data_points: number
  }
  /** AGENTS_CONTRACT.md §4.3 */
  content: {
    summary: string
    implication: string
    severity: 'info' | 'attention' | 'warning' | 'critical'
    action_hint?: string
  }
  confidence: number
  entity_ids: string[]
  include_in_context: boolean
  /** En horas — el servicio calcula expires_at = generated_at + expires_hours */
  expires_hours: number
}

// Statuses que generan revenue real
const REVENUE_STATUSES = new Set<string>(['active', 'trialing'])

// ──────────────────────────────────────────────────────────────────────────────
// computeCashFlowSignal
//
// Señal del flujo de caja actual. Siempre emitible tras el primer sync.
// Min: 1 suscripción activa (§5 — data_points_min=1 para snapshots).
// expires_at: 24h (§10 — severity='attention'|'info').
// ──────────────────────────────────────────────────────────────────────────────

export function computeCashFlowSignal(
  entities: SubscriptionEntityRow[],
): FinanceInsightData | null {
  const active = entities.filter((e) => REVENUE_STATUSES.has(e.payload.status))

  // §5 — min data_points
  if (active.length < 1) return null

  const avgConf = active.reduce((s, e) => s + e.confidence, 0) / active.length
  if (avgConf < 0.5) return null  // §5 minimum confidence

  const totalMrrCents = active.reduce((s, e) => s + e.payload.mrr_contribution, 0)
  const mrrEuros = totalMrrCents / 100

  const isPositive = totalMrrCents > 0
  const severity = isPositive ? 'info' : 'attention'

  return {
    insight_type: 'cash_flow_signal',
    signal: {
      metric_name: 'mrr_total_euros',
      current_value: mrrEuros,
      period_days: 0,  // snapshot
      data_points: active.length,
    },
    content: {
      summary: isPositive
        ? `MRR activo: €${mrrEuros.toFixed(2)} de ${active.length} suscripción${active.length > 1 ? 'es' : ''}.`
        : `Sin revenue activo. ${entities.length} suscripción${entities.length !== 1 ? 'es' : ''} en Stripe sin MRR generado.`,
      implication: isPositive
        ? 'Financial Engine usa este MRR real en lugar de estimaciones manuales (peso 15% en probabilidad).'
        : 'Financial Engine sigue usando estimaciones manuales de MRR. Activa suscripciones en Stripe para resolver esto.',
      severity,
    },
    confidence: avgConf,
    entity_ids: active.map((e) => e.id),
    include_in_context: true,
    expires_hours: 24,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// computeRevenueConcentration
//
// % del MRR que proviene del cliente principal. Riesgo de concentración.
// Min: 3 suscripciones activas con customer_id (§5).
// expires_at: 7 días (§10 — severity='info'|'attention').
// ──────────────────────────────────────────────────────────────────────────────

export function computeRevenueConcentration(
  entities: SubscriptionEntityRow[],
): FinanceInsightData | null {
  const active = entities.filter(
    (e) => REVENUE_STATUSES.has(e.payload.status) && e.payload.customer_id,
  )

  // §5 — min 3 para que la concentración tenga significado estadístico
  if (active.length < 3) return null

  const avgConf = active.reduce((s, e) => s + e.confidence, 0) / active.length
  // completeness_factor = min(1.0, data_points / min_data_points) = min(1.0, n/3)
  const completeness = Math.min(1.0, active.length / 3)
  const confidence = avgConf * completeness

  if (confidence < 0.5) return null

  // Agrupar MRR por customer_id
  const byCustomer = new Map<string, number>()
  for (const e of active) {
    const cid = e.payload.customer_id!
    byCustomer.set(cid, (byCustomer.get(cid) ?? 0) + e.payload.mrr_contribution)
  }

  const totalMrr = Array.from(byCustomer.values()).reduce((s, v) => s + v, 0)
  if (totalMrr === 0) return null

  const topMrr = Math.max(...byCustomer.values())
  const concentrationPct = Math.round((topMrr / totalMrr) * 100)
  const uniqueCustomers = byCustomer.size

  const severity = concentrationPct > 50 ? 'warning' : concentrationPct > 30 ? 'attention' : 'info'

  return {
    insight_type: 'revenue_concentration',
    signal: {
      metric_name: 'top_customer_mrr_pct',
      current_value: concentrationPct,
      period_days: 0,
      data_points: uniqueCustomers,
    },
    content: {
      summary: `Cliente principal: ${concentrationPct}% del MRR total (${uniqueCustomers} clientes).`,
      implication:
        concentrationPct > 50
          ? 'Riesgo de concentración alto. Perder ese cliente reduciría el MRR más del 50%.'
          : concentrationPct > 30
            ? 'Concentración moderada. Diversificar la base de clientes reduciría riesgo financiero.'
            : 'Revenue bien distribuido. La concentración está dentro de niveles saludables.',
      severity,
      action_hint:
        concentrationPct > 30 ? 'Considera diversificar la base de clientes.' : undefined,
    },
    confidence,
    entity_ids: active.map((e) => e.id),
    include_in_context: concentrationPct > 30,
    expires_hours: 7 * 24,
  }
}

/** Ejecuta todos los cómputos del Finance Agent v1 sobre un conjunto de entidades. */
export function runFinanceAgentLocal(
  entities: SubscriptionEntityRow[],
): FinanceInsightData[] {
  return [
    computeCashFlowSignal(entities),
    computeRevenueConcentration(entities),
  ].filter((x): x is FinanceInsightData => x !== null)
}
