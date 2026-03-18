/**
 * engine-delta.ts
 *
 * Calcula el delta entre dos snapshots de motores (pre/post sync).
 * Función pura, sin dependencias externas.
 *
 * Referencia: INTEGRATION_ARCHITECTURE.md §14
 */

export interface EngineSnapshot {
  probability: { value: number | null; status: string }
  phase: { current_phase: number; phase_score: number }
  risk: { level: string; score: number | null }
  economic_profile: { mrr: number; runway_months: number }
}

export interface EngineDeltaItem {
  metric: string
  label: string
  before: number | string | null
  after: number | string | null
  direction: 'up' | 'down' | 'unchanged' | 'new'
  isBusinessImprovement: boolean
  narrative: string
}

interface MetricDef {
  metric: string
  label: string
  extract: (s: EngineSnapshot) => number | string | null
}

const METRICS: MetricDef[] = [
  {
    metric: 'probability.value',
    label: 'Probabilidad',
    extract: (s) => s.probability?.value ?? null,
  },
  {
    metric: 'phase.phase_score',
    label: 'Puntuación de fase',
    extract: (s) => s.phase?.phase_score ?? null,
  },
  {
    metric: 'risk.score',
    label: 'Riesgo',
    extract: (s) => s.risk?.score ?? null,
  },
  {
    metric: 'economic_profile.mrr',
    label: 'MRR',
    extract: (s) => s.economic_profile?.mrr ?? null,
  },
  {
    metric: 'economic_profile.runway_months',
    label: 'Runway',
    extract: (s) => s.economic_profile?.runway_months ?? null,
  },
]

function resolveDirection(
  before: number | string | null,
  after: number | string | null
): 'up' | 'down' | 'unchanged' | 'new' {
  if (before === null && after !== null) return 'new'
  if (typeof before === 'number' && typeof after === 'number') {
    if (after > before) return 'up'
    if (after < before) return 'down'
  }
  return 'unchanged'
}

export function computeEngineDelta(
  pre: EngineSnapshot | null,
  post: EngineSnapshot
): EngineDeltaItem[] {
  return METRICS.map((def) => {
    const before = pre !== null ? def.extract(pre) : null
    const after = def.extract(post)
    const direction = resolveDirection(before, after)

    // isBusinessImprovement — simplificación v1:
    // true si hay snapshot previo (no es first_calc) Y el MRR post > MRR pre.
    const isBusinessImprovement =
      def.metric === 'economic_profile.mrr' &&
      pre !== null &&
      typeof after === 'number' &&
      typeof before === 'number' &&
      after > before

    let narrative: string
    if (isBusinessImprovement) {
      narrative = `Tu MRR creció de ${before} a ${after}`
    } else if (direction === 'new') {
      narrative = `La evaluación de ${def.label} se calculó por primera vez: ${after}`
    } else {
      narrative = `La evaluación de ${def.label} pasó de ${before} a ${after}`
    }

    return {
      metric: def.metric,
      label: def.label,
      before,
      after,
      direction,
      isBusinessImprovement,
      narrative,
    }
  })
}
