/**
 * agent-synthesis — I15.86 + I15.87 + I15.88 (pure computation layer)
 *
 * Funciones puras para priorizar, sintetizar y detectar conflictos entre
 * insights de múltiples agentes. Sin efectos secundarios. Sin llamadas a DB.
 *
 * Fuentes de insights activas en v1: Finance Agent + Execution Agent.
 * Sales/Team/Calendar agents diferidos hasta sus providers.
 *
 * I15.86 — Priorización: AGENTS_CONTRACT.md §7.3
 *   severity: critical(4) > warning(3) > attention(2) > info(1)
 *   agente:   finance(5) > sales(4) > execution(3) > team(2) > calendar(1)
 *   desempate: confidence descendente
 *
 * I15.87 — Síntesis: top N insights priorizados para contexto del motor.
 *
 * I15.88 — Conflictos: Finance + Execution son dominios ortogonales → sin
 *   conflictos en v1. La estructura está preparada para v2 cuando Sales Agent
 *   (pipeline vs cashflow) pueda contradecir a Finance Agent.
 */

export interface SynthesizedInsight {
  id:           string
  agent_type:   'finance' | 'execution' | 'sales' | 'team' | 'calendar'
  insight_type: string
  content: {
    summary:      string
    implication:  string
    severity:     'info' | 'attention' | 'warning' | 'critical'
    action_hint?: string
  }
  confidence:   number
  generated_at: string
}

export interface InsightConflict {
  insight_a:    string  // id
  agent_a:      string
  type_a:       string
  insight_b:    string  // id
  agent_b:      string
  type_b:       string
  reason:       string
}

// ──────────────────────────────────────────────────────────────────────────────
// Pesos de prioridad — AGENTS_CONTRACT.md §7.3
// ──────────────────────────────────────────────────────────────────────────────

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  warning:  3,
  attention: 2,
  info:     1,
}

const AGENT_WEIGHT: Record<string, number> = {
  finance:   5,
  sales:     4,
  execution: 3,
  team:      2,
  calendar:  1,
}

function priorityScore(insight: SynthesizedInsight): number {
  const sev  = SEVERITY_WEIGHT[insight.content.severity] ?? 1
  const agt  = AGENT_WEIGHT[insight.agent_type] ?? 1
  // severity domina, agente es desempate, confidence es sub-desempate
  return sev * 100 + agt * 10 + Math.round(insight.confidence * 9)
}

// ──────────────────────────────────────────────────────────────────────────────
// I15.86 — prioritizeInsights
//
// Ordena los insights por importancia decreciente.
// Devuelve una nueva lista (no muta la original).
// ──────────────────────────────────────────────────────────────────────────────

export function prioritizeInsights(
  insights: SynthesizedInsight[],
): SynthesizedInsight[] {
  return [...insights].sort((a, b) => priorityScore(b) - priorityScore(a))
}

// ──────────────────────────────────────────────────────────────────────────────
// I15.87 — synthesizeAgentContext
//
// Devuelve los top N insights priorizados, excluyendo los conflictivos
// (si un par de insights tiene conflicto, se retiene el de mayor prioridad).
// En v1 con Finance + Execution no hay conflictos → filtra solo por prioridad.
// ──────────────────────────────────────────────────────────────────────────────

export function synthesizeAgentContext(
  insights: SynthesizedInsight[],
  maxInsights = 3,
): SynthesizedInsight[] {
  if (insights.length === 0) return []

  const conflicts = detectConflicts(insights)

  // IDs a excluir: el de menor prioridad de cada par conflictivo
  const excludeIds = new Set<string>()
  for (const conflict of conflicts) {
    const a = insights.find(i => i.id === conflict.insight_a)
    const b = insights.find(i => i.id === conflict.insight_b)
    if (a && b) {
      // Excluir el de menor prioridad (el de mayor se retiene)
      const loser = priorityScore(a) >= priorityScore(b) ? b : a
      excludeIds.add(loser.id)
    }
  }

  const nonConflicting = insights.filter(i => !excludeIds.has(i.id))
  return prioritizeInsights(nonConflicting).slice(0, maxInsights)
}

// ──────────────────────────────────────────────────────────────────────────────
// I15.88 — detectConflicts
//
// Detecta contradicciones entre insights de agentes distintos.
//
// Regla por dominio (AGENTS_CONTRACT.md §conflict_resolution):
//   - Finance ↔ Execution: dominios ortogonales (financiero vs operativo) →
//     nunca contradictorios. Ambos pueden ser ciertos simultáneamente.
//   - Finance ↔ Sales (v2): pipeline alto + cashflow negativo → posible
//     contradicción si los deals vendidos no aparecen en Stripe.
//   - Execution ↔ Calendar (v2): completion_rate alto + meeting_overload →
//     posible: buena tasa pero saturación temporal.
//
// En v1: Finance + Execution son los únicos agentes activos.
// Resultado siempre []. Estructura preparada para v2.
// ──────────────────────────────────────────────────────────────────────────────

// Dominios de insight — insights del mismo dominio pueden contradicirse
const INSIGHT_DOMAIN: Record<string, string> = {
  cash_flow_signal:      'financial_health',
  revenue_concentration: 'financial_health',
  mrr_trend:             'financial_health',
  runway_estimate:       'financial_health',
  expense_spike:         'financial_health',
  pipeline_velocity:     'sales_pipeline',
  pipeline_value:        'sales_pipeline',
  conversion_rate:       'sales_pipeline',
  deal_stagnation:       'sales_pipeline',
  task_completion_rate:  'execution_ops',
  overdue_ratio:         'execution_ops',
  execution_drop:        'execution_ops',
  milestone_at_risk:     'execution_ops',
  meeting_load:          'calendar_load',
  no_focus_time:         'calendar_load',
  communication_drop:    'team_signals',
  response_lag:          'team_signals',
}

export function detectConflicts(
  insights: SynthesizedInsight[],
): InsightConflict[] {
  const conflicts: InsightConflict[] = []

  for (let i = 0; i < insights.length; i++) {
    for (let j = i + 1; j < insights.length; j++) {
      const a = insights[i]
      const b = insights[j]

      // Misma fuente nunca conflicto (anti-spam ya previene duplicados del mismo tipo)
      if (a.agent_type === b.agent_type) continue

      const domainA = INSIGHT_DOMAIN[a.insight_type]
      const domainB = INSIGHT_DOMAIN[b.insight_type]

      // Dominios distintos → nunca conflicto (pueden coexistir)
      if (!domainA || !domainB || domainA !== domainB) continue

      // Mismo dominio, agentes distintos → conflicto si severidades divergen fuertemente
      // Heurística v1: info ↔ warning/critical en el mismo dominio = contradicción
      const sevA = SEVERITY_WEIGHT[a.content.severity] ?? 1
      const sevB = SEVERITY_WEIGHT[b.content.severity] ?? 1
      const delta = Math.abs(sevA - sevB)

      if (delta >= 2) {  // info(1) ↔ warning(3) = delta 2 → conflicto
        conflicts.push({
          insight_a: a.id,
          agent_a:   a.agent_type,
          type_a:    a.insight_type,
          insight_b: b.id,
          agent_b:   b.agent_type,
          type_b:    b.insight_type,
          reason:    `${a.agent_type}/${a.insight_type}(${a.content.severity}) contradice ${b.agent_type}/${b.insight_type}(${b.content.severity}) en dominio '${domainA}'`,
        })
      }
    }
  }

  return conflicts
}

// ──────────────────────────────────────────────────────────────────────────────
// I15.90 — computeAgentRiskModifier
//
// Calcula el delta de riesgo sugerido por los insights activos.
// No modifica project_risk_score (DB) — es una señal complementaria
// que se muestra junto al score del motor.
//
// Mapping insight_type × severity → delta (escala 0–100, igual que risk_score):
//   cash_flow_signal     warning  → +10  (runway comprometida)
//   cash_flow_signal     critical → +20
//   revenue_concentration warning  → +8   (dependencia de cliente)
//   revenue_concentration critical → +15
//   task_completion_rate  warning  → +5   (ejecución degradada)
//   task_completion_rate  critical → +10
//   overdue_ratio         warning  → +5   (tareas vencidas)
//   overdue_ratio         critical → +8
//
// Retorna null si delta total es 0 (sin presión de agentes).
// ──────────────────────────────────────────────────────────────────────────────

const RISK_DELTA: Record<string, Partial<Record<string, number>>> = {
  cash_flow_signal:       { warning: 10, critical: 20 },
  revenue_concentration:  { warning:  8, critical: 15 },
  task_completion_rate:   { warning:  5, critical: 10 },
  overdue_ratio:          { warning:  5, critical:  8 },
}

export interface AgentRiskModifier {
  delta:   number    // positivo = más riesgo, negativo = menos riesgo
  drivers: string[]  // insight_types que contribuyen
}

export function computeAgentRiskModifier(
  insights: SynthesizedInsight[],
): AgentRiskModifier | null {
  let delta = 0
  const drivers: string[] = []

  for (const insight of insights) {
    const severityMap = RISK_DELTA[insight.insight_type]
    if (!severityMap) continue
    const d = severityMap[insight.content.severity]
    if (!d) continue
    delta += d
    drivers.push(insight.insight_type)
  }

  if (delta === 0) return null
  return { delta, drivers }
}
