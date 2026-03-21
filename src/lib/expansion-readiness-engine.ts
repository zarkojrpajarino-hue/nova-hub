/**
 * F22.1 — expansion-readiness-engine.ts
 *
 * Lógica pura de condiciones de readiness para Expansion Intelligence.
 * Sin side effects, sin queries — recibe datos, retorna estado.
 *
 * Condiciones:
 * 1. current_phase >= 3
 * 2. MRR trend estable o creciente en últimos 60 días (slope >= -0.05, no crash >20%)
 * 3. risk_level != 'critical'
 * 4. >= 1 integración activa
 */

export interface MrrDataPoint {
  date: string;
  mrr: number;
}

export interface ExpansionReadinessInput {
  currentPhase: number;
  mrrHistory: MrrDataPoint[];  // últimos 60 días, ordenados por fecha ASC
  riskLevel: string | null;     // 'low' | 'medium' | 'high' | 'critical' | null
  activeIntegrations: number;
}

export interface ExpansionReadinessState {
  isReady: boolean;
  missingConditions: string[];
  readinessScore: number;  // 0-100
  readinessLabel: string;
  conditions: {
    phaseOk: boolean;
    mrrTrendOk: boolean | 'stale';  // 'stale' = insufficient data
    riskOk: boolean;
    integrationOk: boolean;
  };
}

/**
 * Calcula MRR trend stability.
 * - slope >= -0.05 (permite caída ≤5%)
 * - Ningún mes con caída >20% respecto al anterior
 * - Si <4 puntos: 'stale' (no bloquea, no confirma)
 */
function computeMrrTrend(history: MrrDataPoint[]): boolean | 'stale' {
  if (history.length < 4) return 'stale';

  const first = history[0].mrr;
  const last = history[history.length - 1].mrr;

  // Slope normalizada
  if (first > 0) {
    const slope = (last - first) / first;
    if (slope < -0.05) return false;
  }

  // Detector de crash: ninguna caída >20% entre puntos consecutivos
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].mrr;
    const curr = history[i].mrr;
    if (prev > 0 && curr < prev * 0.8) {
      return false;  // Caída >20%
    }
  }

  return true;
}

export function computeExpansionReadiness(input: ExpansionReadinessInput): ExpansionReadinessState {
  const { currentPhase, mrrHistory, riskLevel, activeIntegrations } = input;

  const phaseOk = currentPhase >= 3;
  const mrrTrendResult = computeMrrTrend(mrrHistory);
  const mrrTrendOk = mrrTrendResult;
  const riskOk = riskLevel !== 'critical';
  const integrationOk = activeIntegrations >= 1;

  const missingConditions: string[] = [];
  if (!phaseOk) missingConditions.push('Necesitas estar en Fase 3 o superior');
  if (mrrTrendOk === false) missingConditions.push('Tu MRR muestra una tendencia negativa en los últimos 60 días');
  if (mrrTrendOk === 'stale') missingConditions.push('Necesitas al menos 4 semanas de historial de MRR');
  if (!riskOk) missingConditions.push('Tu nivel de riesgo es crítico — estabiliza primero');
  if (!integrationOk) missingConditions.push('Necesitas al menos 1 integración activa con datos reales');

  // Score: cada condición vale 25 puntos. MRR stale = 12.5 (medio punto)
  let score = 0;
  if (phaseOk) score += 25;
  if (mrrTrendOk === true) score += 25;
  if (mrrTrendOk === 'stale') score += 12.5;
  if (riskOk) score += 25;
  if (integrationOk) score += 25;

  const isReady = phaseOk && mrrTrendOk === true && riskOk && integrationOk;

  const readinessLabel = isReady
    ? 'Listo para analizar mercados'
    : score >= 50
      ? 'Casi listo — completa las condiciones pendientes'
      : 'Aún no es momento — enfócate en tu mercado actual';

  return {
    isReady,
    missingConditions,
    readinessScore: Math.round(score),
    readinessLabel,
    conditions: {
      phaseOk,
      mrrTrendOk,
      riskOk,
      integrationOk,
    },
  };
}
