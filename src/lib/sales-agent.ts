/**
 * sales-agent — I15.79 (pure computation layer)
 *
 * Funciones puras: dada una lista de integration_entities de tipo 'deal',
 * computa SalesInsight siguiendo AGENTS_CONTRACT.md.
 *
 * Sin efectos secundarios. Sin llamadas a DB.
 *
 * v1 insight_types disponibles con datos HubSpot:
 *   - open_pipeline_value      — valor total del pipeline abierto (min 1 deal activo)
 *   - pipeline_conversion_rate — % win rate sobre deals cerrados (min 3 deals cerrados)
 *
 * Deferred (requieren datos que no existen aún en v1):
 *   - pipeline_velocity       — días promedio por stage (requiere fechas de transición)
 *   - deal_stagnation         — deals sin movimiento (requiere historial de stage)
 *
 * Fuente de datos: integration_entities[entity_type='deal', provider='hubspot']
 * Destino: integration_insights (NO motor tables en v1 — Sales Agent escribe
 *          revenue_momentum al Phase Engine en v2, AGENTS_CONTRACT.md §3)
 */

import type { EvidenceType, SourceUsed, SourceDiscarded } from '@/lib/evidence'

export type SalesInsightType = 'open_pipeline_value' | 'pipeline_conversion_rate'

export type DealStage =
  | 'prospect'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface DealEntityRow {
  id: string
  confidence: number
  payload: {
    deal_name:    string
    stage:        DealStage
    amount_cents: number     // centavos, entero > 0
    owner_id?:    string
    close_date?:  string     // ISO 8601
    pipeline_id?: string
    currency?:    string
  }
}

export interface SalesInsightData {
  insight_type: SalesInsightType
  /** AGENTS_CONTRACT.md §4.2 */
  signal: {
    metric_name:   string
    current_value: number
    period_days:   number   // 0 = snapshot
    data_points:   number
  }
  /** AGENTS_CONTRACT.md §4.3 */
  content: {
    summary:      string
    implication:  string
    severity:     'info' | 'attention' | 'warning' | 'critical'
    action_hint?: string
  }
  confidence:         number
  entity_ids:         string[]
  include_in_context: boolean
  /** En horas — el servicio calcula expires_at = generated_at + expires_hours */
  expires_hours:      number
  /** T17.14 — metadata de evidencia */
  evidence_type:     EvidenceType
  sources_used:      SourceUsed[]
  sources_discarded: SourceDiscarded[]
}

// Stages que representan pipeline activo (deals en juego)
const ACTIVE_STAGES = new Set<DealStage>([
  'prospect', 'qualified', 'proposal', 'negotiation',
])

// ──────────────────────────────────────────────────────────────────────────────
// computeOpenPipelineValue
//
// Valor total del pipeline activo en euros (centavos / 100).
// Min: 1 deal activo (§5 — data_points_min=1 para snapshots).
// Señal siempre positiva — captura oportunidad en juego.
// expires_at: 24h (§10 — severity='info').
// ──────────────────────────────────────────────────────────────────────────────

export function computeOpenPipelineValue(
  entities: DealEntityRow[],
): SalesInsightData | null {
  const active = entities.filter((e) => ACTIVE_STAGES.has(e.payload.stage))

  // §5 — min 1 deal activo
  if (active.length < 1) return null

  const avgConf = active.reduce((s, e) => s + e.confidence, 0) / active.length
  if (avgConf < 0.5) return null

  const totalCents = active.reduce((s, e) => s + e.payload.amount_cents, 0)
  const totalEuros = totalCents / 100

  // Stage breakdown para el summary
  const byStage = new Map<string, number>()
  for (const e of active) {
    byStage.set(e.payload.stage, (byStage.get(e.payload.stage) ?? 0) + 1)
  }

  const stageDesc = Array.from(byStage.entries())
    .map(([stage, count]) => `${count} ${stage}`)
    .join(', ')

  return {
    insight_type: 'open_pipeline_value',
    signal: {
      metric_name:   'open_pipeline_euros',
      current_value: totalEuros,
      period_days:   0,  // snapshot
      data_points:   active.length,
    },
    content: {
      summary: `Pipeline activo: €${totalEuros.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} en ${active.length} deal${active.length !== 1 ? 's' : ''} abiertos (${stageDesc}).`,
      implication: 'Financial Engine puede contrastar este pipeline con el MRR actual para estimar el impacto potencial en revenue.',
      severity: 'info',
    },
    confidence:         avgConf,
    entity_ids:         active.map((e) => e.id),
    include_in_context: true,
    expires_hours:      24,
    evidence_type:     'observed',
    sources_used:      [{ source: 'hubspot', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: active.length }],
    sources_discarded: [],
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// computePipelineConversionRate
//
// % de deals closed_won sobre el total de deals cerrados (won + lost).
// Min: 3 deals cerrados para que el ratio sea estadísticamente significativo.
// Solo emite si hay deals perdidos (win rate=100% → silencio, no hay problema).
// expires_at: 7 días (§10 — severity='info'|'attention'|'warning').
// ──────────────────────────────────────────────────────────────────────────────

export function computePipelineConversionRate(
  entities: DealEntityRow[],
): SalesInsightData | null {
  const closed = entities.filter(
    (e) => e.payload.stage === 'closed_won' || e.payload.stage === 'closed_lost',
  )

  // §5 — min 3 deals cerrados
  if (closed.length < 3) return null

  const won  = closed.filter((e) => e.payload.stage === 'closed_won')
  const lost = closed.filter((e) => e.payload.stage === 'closed_lost')

  // Silencio si win rate = 100% — ejecución perfecta, no hay señal útil
  if (lost.length === 0) return null

  const winRatePct = Math.round((won.length / closed.length) * 100)

  const avgConf = closed.reduce((s, e) => s + e.confidence, 0) / closed.length
  const completeness = Math.min(1.0, closed.length / 3)
  const confidence = avgConf * completeness

  if (confidence < 0.5) return null

  const severity =
    winRatePct >= 50 ? 'info' :
    winRatePct >= 25 ? 'attention' :
    'warning'

  // Valor promedio de deals ganados para contexto
  const wonValueCents = won.reduce((s, e) => s + e.payload.amount_cents, 0)
  const avgWonEuros = won.length > 0 ? Math.round(wonValueCents / won.length / 100) : 0

  return {
    insight_type: 'pipeline_conversion_rate',
    signal: {
      metric_name:   'win_rate_pct',
      current_value: winRatePct,
      period_days:   0,  // snapshot — no hay ventana histórica en v1
      data_points:   closed.length,
    },
    content: {
      summary: `Win rate: ${winRatePct}% (${won.length} ganados / ${closed.length} cerrados).${avgWonEuros > 0 ? ` Ticket medio ganado: €${avgWonEuros.toLocaleString('es-ES')}.` : ''}`,
      implication:
        winRatePct >= 50
          ? 'Conversión saludable. Más de la mitad de los deals cerrados se ganaron.'
          : winRatePct >= 25
            ? 'Conversión baja. Más de la mitad de los deals cerrados se perdieron. Revisar objeciones recurrentes.'
            : 'Conversión crítica. Solo 1 de cada 4 deals se cierra. Posible desajuste entre propuesta de valor y mercado.',
      severity,
      action_hint:
        winRatePct < 25
          ? `Revisa los ${lost.length} deals perdidos en HubSpot esta semana: identifica el patrón de rechazo principal e incorpora una objeción concreta en tu próxima propuesta.`
          : winRatePct < 50
            ? `Analiza los ${lost.length} deals perdidos en HubSpot este mes: elige el top 3 de objeciones recurrentes y añade respuestas a tu playbook de ventas.`
            : undefined,
    },
    confidence,
    entity_ids:         closed.map((e) => e.id),
    include_in_context: winRatePct < 50,  // solo relevante si hay problema de conversión
    expires_hours:      7 * 24,
    evidence_type:     'observed',
    sources_used:      [{ source: 'hubspot', confidence: avgConf, timestamp: new Date().toISOString(), entity_count: closed.length }],
    sources_discarded: [],
  }
}

/** Ejecuta todos los cómputos del Sales Agent v1 sobre un conjunto de entidades. */
export function runSalesAgentLocal(
  entities: DealEntityRow[],
): SalesInsightData[] {
  return [
    computeOpenPipelineValue(entities),
    computePipelineConversionRate(entities),
  ]
    .filter((x): x is SalesInsightData => x !== null)
    // T17.29 — §12 política de silencio: dato estimado con baja confianza y sin entidades → no emitir
    .filter(x => !(x.confidence < 0.5 && x.entity_ids.length === 0))
}
