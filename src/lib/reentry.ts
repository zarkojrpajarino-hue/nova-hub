/**
 * REENTRY PAYLOAD — V11.0
 *
 * Computación del payload de re-entry.
 * Funciones puras: sin hooks, sin side effects.
 * Recibe datos ya cargados por los hooks de ProjectPage/ReentrySurface.
 *
 * El payload es derivado, no almacenado.
 * Especificación: SURFACES_V1.md §Re-entry navigation order
 */

import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TriggerReason = 'inactive_7d' | 'inactive_14d' | 'inactive_21d' | 'inactive_60d';
export type ProbabilityTrend = 'growing' | 'stable' | 'declining';
export type PrimaryBlock = 'clarity_block' | 'traction_block' | 'structural_block' | 'none';
export type UrgencySeverity = 'critical' | 'high' | 'medium';

export interface ReentryChanges {
  phaseChanged: boolean;
  phaseRegressed: boolean;
  viabilityWorsened: boolean;  // v1: aproximación desde estado actual (sin historial)
  riskWorsened: boolean;
  newBlockDetected: boolean;   // v1: aproximación desde estado actual
  cycleClosedWhileAway: boolean;
  ritualMissed: boolean;
}

export interface ReentryUrgency {
  type: string;
  severity: UrgencySeverity;
  reason: string;
}

export interface ReentryCurrentState {
  phase: number;
  phaseScore: number;
  viabilityStatus: string;
  riskLevel: string;
  probabilityTrend: ProbabilityTrend;
  primaryBlock: PrimaryBlock;
}

export interface ReentryResume {
  headline: string;
  summary: string;
  recommendedAction: string;
  signalBasis: string;
}

export interface ReentryPayload {
  absenceDays: number;
  triggerReason: TriggerReason;
  currentState: ReentryCurrentState;
  changes: ReentryChanges;
  urgencies: ReentryUrgency[];  // ya ordenadas por severidad, máx 3
  resume: ReentryResume;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const RISK_LEVEL_ORDER: Record<string, number> = {
  low: 0, medium: 1, high: 2, critical: 3,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerReason(absenceDays: number): TriggerReason {
  if (absenceDays >= 60) return 'inactive_60d';
  if (absenceDays >= 21) return 'inactive_21d';
  if (absenceDays >= 14) return 'inactive_14d';
  return 'inactive_7d';
}

function deriveProbabilityTrend(
  history: { probability_score: number }[],
): ProbabilityTrend {
  if (history.length < 2) return 'stable';
  const delta = history[0].probability_score - history[1].probability_score;
  if (delta > 5) return 'growing';
  if (delta < -5) return 'declining';
  return 'stable';
}

// AUD.B.2 / DEUDA.PE.8: primary_block ahora viene de SQL (migration 20260326000008).
// derivePrimaryBlock() se mantiene como fallback client-side por si engineData.phaseState
// está disponible antes de que la migración se haya aplicado (proyectos sin fila aún).
function derivePrimaryBlock(engineData: ProjectEngineData): PrimaryBlock {
  // Fast-path: leer desde SQL si ya está disponible
  const sqlBlock = engineData.phaseState?.primary_block as PrimaryBlock | undefined;
  if (sqlBlock && sqlBlock !== 'none') return sqlBlock;
  if (sqlBlock === 'none') return 'none';

  // Fallback client-side (proyectos sin migración aplicada aún)
  const coverageLevel = (type: string) =>
    engineData.coverage?.find(c => c.function_type === type)?.coverage_level ?? 'none';

  const riskLevel = engineData.risk?.risk_level ?? 'low';
  const demand    = coverageLevel('demand');
  const delivery  = coverageLevel('delivery');
  const cash      = coverageLevel('cash');

  if (riskLevel === 'critical' || riskLevel === 'high') return 'traction_block';
  if (demand === 'none' || demand === 'basic') return 'clarity_block';
  if (delivery === 'none' || delivery === 'basic' || cash === 'none' || cash === 'basic')
    return 'structural_block';
  return 'none';
}

function computeChanges(params: {
  lastSeenAt: string;
  engineData: ProjectEngineData;
  viabilityStatus: string;
  cycleClosedWhileAway: boolean;
  ritualMissed: boolean;
}): ReentryChanges {
  const { lastSeenAt, engineData, viabilityStatus, cycleClosedWhileAway, ritualMissed } = params;
  const since = new Date(lastSeenAt).getTime();

  // Phase changes since lastSeenAt
  const recentPhase = engineData.phaseHistory.filter(
    h => new Date(h.calculated_at).getTime() > since,
  );
  const baseline = engineData.phaseHistory.find(
    h => new Date(h.calculated_at).getTime() <= since,
  );
  const phaseChanged =
    recentPhase.length > 0 &&
    baseline != null &&
    recentPhase[recentPhase.length - 1].phase !== baseline.phase;
  const phaseRegressed =
    recentPhase.some(h => h.change_reason?.toLowerCase().includes('regress')) ||
    (phaseChanged && baseline != null && recentPhase[recentPhase.length - 1].phase < baseline.phase);

  // Risk changes since lastSeenAt
  const recentRisk = engineData.riskHistory.filter(
    h => new Date(h.calculated_at).getTime() > since,
  );
  const baselineRisk = engineData.riskHistory.find(
    h => new Date(h.calculated_at).getTime() <= since,
  );
  const riskWorsened =
    recentRisk.length > 0 &&
    baselineRisk != null &&
    (RISK_LEVEL_ORDER[recentRisk[0].risk_level] ?? 0) >
      (RISK_LEVEL_ORDER[baselineRisk.risk_level] ?? 0);

  // v1 approximations (no dedicated history for viability / blocks)
  // viabilityStatus enum: 'healthy' | 'monitoring' | 'stagnation' | 'critical'
  const viabilityWorsened = viabilityStatus !== 'healthy';
  const newBlockDetected  = derivePrimaryBlock(engineData) !== 'none';

  return {
    phaseChanged,
    phaseRegressed,
    viabilityWorsened,
    riskWorsened,
    newBlockDetected,
    cycleClosedWhileAway,
    ritualMissed,
  };
}

function computeUrgencies(params: {
  viabilityStatus: string;
  riskLevel: string;
  riskStatus: string;
  ritualMissed: boolean;
}): ReentryUrgency[] {
  const { viabilityStatus, riskLevel, riskStatus, ritualMissed } = params;
  const list: ReentryUrgency[] = [];

  if (viabilityStatus === 'critical')
    list.push({ type: 'viability', severity: 'critical', reason: 'El proyecto está en viabilidad crítica' });

  if (riskStatus === 'active' && riskLevel === 'critical')
    list.push({ type: 'risk', severity: 'critical', reason: 'Riesgo crítico activo que bloquea el progreso' });

  if (ritualMissed)
    list.push({ type: 'ritual', severity: 'high', reason: 'El ciclo estratégico se cerró sin revisión ritual' });

  if (riskStatus === 'active' && riskLevel === 'high')
    list.push({ type: 'risk', severity: 'high', reason: 'El riesgo principal puede afectar la progresión de fase' });

  if (viabilityStatus === 'stagnation' || viabilityStatus === 'monitoring')
    list.push({ type: 'viability', severity: 'medium', reason: 'La viabilidad está en zona de riesgo' });

  const order: Record<UrgencySeverity, number> = { critical: 0, high: 1, medium: 2 };
  return list.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 3);
}

function deriveHeadline(params: {
  absenceDays: number;
  hasCritical: boolean;
  viabilityWorsened: boolean;
  riskWorsened: boolean;
  cycleClosedWhileAway: boolean;
}): string {
  if (params.absenceDays >= 60)
    return 'Tu proyecto lleva más de 60 días sin actividad';
  if (params.hasCritical)
    return 'Has vuelto a un proyecto en estado crítico';
  if (params.viabilityWorsened || params.riskWorsened)
    return 'Mientras no estabas, el proyecto perdió estabilidad';
  if (params.cycleClosedWhileAway)
    return 'Tu proyecto siguió avanzando sin revisión estratégica';
  return 'Te ponemos al día antes de seguir';
}

function deriveSummary(params: {
  changes: ReentryChanges;
  viabilityStatus: string;
  riskLevel: string;
  primaryBlock: PrimaryBlock;
}): string {
  const { changes, viabilityStatus, riskLevel, primaryBlock } = params;

  let s1: string;
  if (viabilityStatus === 'critical' && changes.riskWorsened)
    s1 = 'La viabilidad empeoró y el riesgo principal aumentó.';
  else if (viabilityStatus === 'critical')
    s1 = 'El proyecto entró en estado de viabilidad crítica.';
  else if (changes.phaseRegressed)
    s1 = 'Hubo una regresión de fase mientras no estabas.';
  else if (changes.riskWorsened)
    s1 = 'El riesgo del proyecto empeoró durante tu ausencia.';
  else if (changes.newBlockDetected && primaryBlock !== 'none')
    s1 = `Apareció un bloqueo activo: ${primaryBlock.replace('_', ' ')}.`;
  else if (changes.cycleClosedWhileAway)
    s1 = changes.ritualMissed
      ? 'El ciclo anterior se cerró sin revisión estratégica.'
      : 'Se completó un ciclo estratégico mientras no estabas.';
  else
    s1 = 'No hubo cambios críticos durante tu ausencia.';

  let s2: string;
  if (viabilityStatus === 'critical' || riskLevel === 'critical')
    s2 = 'Lo primero es recuperar estabilidad antes de continuar construyendo.';
  else if (changes.phaseRegressed || changes.riskWorsened)
    s2 = 'Antes de seguir avanzando, conviene revisar el estado actual del proyecto.';
  else if (changes.ritualMissed)
    s2 = 'Conviene hacer una revisión estratégica antes de seguir ejecutando.';
  else
    s2 = 'Retoma la prioridad activa y continúa desde donde lo dejaste.';

  return `${s1} ${s2}`;
}

// ─── Función principal ────────────────────────────────────────────────────────

export function computeReentryPayload(params: {
  lastSeenAt: string;
  engineData: ProjectEngineData;
  viabilityStatus: string;
  cycleClosedWhileAway: boolean;
  ritualMissed: boolean;
  nextActionTitle: string | null;
  nextActionDescription: string | null;
}): ReentryPayload {
  const {
    lastSeenAt, engineData, viabilityStatus,
    cycleClosedWhileAway, ritualMissed,
    nextActionTitle, nextActionDescription,
  } = params;

  const absenceDays = Math.floor(
    (Date.now() - new Date(lastSeenAt).getTime()) / (24 * 60 * 60 * 1000),
  );

  const currentPhase    = engineData.phaseState?.current_phase ?? 1;
  const currentScore    = engineData.phaseState?.phase_score    ?? 0;
  const riskLevel       = engineData.risk?.risk_level            ?? 'low';
  const riskStatus      = engineData.risk?.risk_status           ?? 'insufficient_data';
  const probabilityTrend = deriveProbabilityTrend(engineData.probabilityHistory ?? []);
  const primaryBlock     = derivePrimaryBlock(engineData);

  const changes = computeChanges({
    lastSeenAt, engineData, viabilityStatus, cycleClosedWhileAway, ritualMissed,
  });

  const urgencies = computeUrgencies({ viabilityStatus, riskLevel, riskStatus, ritualMissed });
  const hasCritical = urgencies.some(u => u.severity === 'critical');

  const headline = deriveHeadline({
    absenceDays,
    hasCritical,
    viabilityWorsened: changes.viabilityWorsened,
    riskWorsened: changes.riskWorsened,
    cycleClosedWhileAway,
  });

  const summary = deriveSummary({ changes, viabilityStatus, riskLevel, primaryBlock });

  return {
    absenceDays,
    triggerReason: triggerReason(absenceDays),
    currentState: {
      phase: currentPhase,
      phaseScore: currentScore,
      viabilityStatus,
      riskLevel,
      probabilityTrend,
      primaryBlock,
    },
    changes,
    urgencies,
    resume: {
      headline,
      summary,
      recommendedAction: nextActionTitle ?? 'Revisa el estado actual del proyecto',
      signalBasis: nextActionDescription ?? '',
    },
  };
}

// ─── Labels de UI ────────────────────────────────────────────────────────────

export const CHANGE_LABELS: Partial<Record<keyof ReentryChanges, string>> = {
  viabilityWorsened:      'La viabilidad empeoró',
  riskWorsened:           'El riesgo aumentó',
  phaseRegressed:         'Hubo una regresión de fase',
  newBlockDetected:       'Apareció un nuevo bloqueo',
  cycleClosedWhileAway:   'Se cerró un ciclo mientras no estabas',
  ritualMissed:           'El ciclo se cerró sin revisión ritual',
  phaseChanged:           'La fase del proyecto cambió',
};

// Orden de prioridad de cambios (mayor prioridad primero)
export const CHANGE_PRIORITY: Array<keyof ReentryChanges> = [
  'viabilityWorsened',
  'riskWorsened',
  'phaseRegressed',
  'newBlockDetected',
  'cycleClosedWhileAway',
  'ritualMissed',
  'phaseChanged',
];

export const PHASE_LABEL: Record<number, string> = {
  1: 'Fase 1 — Validación del problema',
  2: 'Fase 2 — Validación de la solución',
  3: 'Fase 3 — Revenue',
  4: 'Fase 4 — Escala',
};

export const VIABILITY_LABEL: Record<string, string> = {
  healthy:    'Viabilidad saludable',
  monitoring: 'Viabilidad en seguimiento',
  stagnation: 'Viabilidad estancada',
  critical:   'Viabilidad crítica',
};

export const TREND_LABEL: Record<string, string> = {
  growing:  'Probabilidad creciendo',
  stable:   'Probabilidad estable',
  declining: 'Probabilidad bajando',
};

export const BLOCK_LABEL: Record<string, string> = {
  clarity_block:    'Bloqueo de claridad',
  traction_block:   'Bloqueo de tracción',
  structural_block: 'Bloqueo estructural',
  none:             '',
};
