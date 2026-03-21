/**
 * PI27.3 — phase-runway-estimator.ts
 *
 * Estima cuántas semanas faltan para alcanzar la siguiente fase.
 * Lógica pura — sin queries, sin side effects.
 *
 * Algoritmo:
 * 1. Calcular score_velocity (pendiente lineal de últimos N puntos)
 * 2. points_needed = max(0, 75 - currentScore)
 * 3. weeks_to_75 = points_needed / score_velocity
 * 4. Ajustes: +2 si falta hard signal, +1 si velocity < 2
 */

export interface PhaseRunwayInput {
  currentPhase: number;
  currentScore: number;
  scoreHistory: number[];  // últimas 8 semanas de phase_score (más reciente al final)
  hardSignalMet: boolean;
  iterationVelocity: number;  // 0-10
}

export interface PhaseRunwayEstimate {
  weeksEstimate: number | 'stalled' | 'ready';
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
}

/**
 * Calcula la pendiente lineal (least squares) de una serie temporal.
 * Retorna puntos por semana.
 */
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;

  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Calcula R² (coefficient of determination) para la pendiente lineal.
 */
function rSquared(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0;

  const slope = linearSlope(values);
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  const intercept = meanY - slope * (n - 1) / 2;

  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - meanY) ** 2;
  }

  if (ssTot === 0) return 1; // All values same = perfect fit
  return 1 - ssRes / ssTot;
}

export function estimatePhaseRunway(input: PhaseRunwayInput): PhaseRunwayEstimate {
  const { currentPhase, currentScore, scoreHistory, hardSignalMet, iterationVelocity } = input;

  // Phase 4 or graduated — no "next phase"
  if (currentPhase >= 4) {
    return {
      weeksEstimate: 'ready',
      confidence: 'high',
      explanation: 'Estás en la fase final del bootcamp.',
    };
  }

  // Already meets score threshold
  if (currentScore >= 75 && hardSignalMet) {
    return {
      weeksEstimate: 'ready',
      confidence: 'high',
      explanation: `Cumples los requisitos para avanzar a Fase ${currentPhase + 1}.`,
    };
  }

  const dataPoints = scoreHistory.length;

  // Not enough data
  if (dataPoints < 2) {
    return {
      weeksEstimate: 'stalled',
      confidence: 'low',
      explanation: 'No hay suficiente historial para estimar. Necesitas al menos 2 semanas de datos.',
    };
  }

  const slope = linearSlope(scoreHistory);
  const r2 = rSquared(scoreHistory);

  // Stalled or declining
  if (slope <= 0) {
    return {
      weeksEstimate: 'stalled',
      confidence: dataPoints >= 4 ? 'medium' : 'low',
      explanation: slope < -1
        ? 'Tu score está bajando. Enfócate en las acciones prioritarias antes de pensar en avanzar.'
        : 'Tu progreso está estancado. Revisa qué te bloquea para mejorar tu score.',
    };
  }

  // Estimate weeks
  const pointsNeeded = Math.max(0, 75 - currentScore);
  let weeks = pointsNeeded / slope;

  // Adjustments
  if (!hardSignalMet) weeks += 2;
  if (iterationVelocity < 2) weeks += 1;

  weeks = Math.max(1, Math.round(weeks));

  // Confidence
  const confidence: PhaseRunwayEstimate['confidence'] =
    dataPoints >= 6 && r2 > 0.7 ? 'high' :
    dataPoints >= 4 ? 'medium' : 'low';

  // Explanation
  let explanation: string;
  if (weeks <= 2) {
    explanation = `¡Estás muy cerca de Fase ${currentPhase + 1}! Solo ${!hardSignalMet ? 'falta la señal dura' : 'necesitas subir el score a 75'}.`;
  } else if (weeks <= 4) {
    explanation = `A este ritmo, podrías avanzar a Fase ${currentPhase + 1} en ~${weeks} semanas.`;
  } else {
    explanation = `Estimamos ~${weeks} semanas para Fase ${currentPhase + 1}. Busca las acciones de mayor impacto.`;
  }

  return { weeksEstimate: weeks, confidence, explanation };
}
