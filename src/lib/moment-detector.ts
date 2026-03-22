/**
 * PI27.1 — moment-detector.ts
 *
 * Detección de momentos clave del proyecto.
 * Lógica pura — sin queries, sin side effects.
 *
 * Momentos positivos: first_customer, first_revenue, revenue_milestone, team_growth, phase_speed
 * Momentos de atención: stagnation_warning, hard_signal_close, cycle_ending_soon, regression_risk
 */

export type MomentType =
  | 'first_customer'
  | 'first_revenue'
  | 'revenue_milestone'
  | 'team_growth'
  | 'phase_speed'
  | 'stagnation_warning'
  | 'hard_signal_close'
  | 'cycle_ending_soon'
  | 'regression_risk';

export type MomentSeverity = 'celebration' | 'info' | 'warning';

export interface Moment {
  type: MomentType;
  severity: MomentSeverity;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface MomentDetectorInput {
  // OBV data
  hasFirstSale: boolean;          // any OBV with tipo='venta' and outcome='success'
  // Revenue
  currentMrr: number;
  previousMrr: number;           // MRR from previous period (to detect first revenue)
  // Phase
  currentPhase: number;
  phaseScore: number;
  hardSignalMet: boolean;
  weeksInPhase: number;          // weeks since phase_entered_at
  scoreChange4w: number;         // score change in last 4 weeks (current - 4w ago)
  consecutiveLowScore: number;   // from project_phase_state
  // Team
  teamSize: number;
  newMembersThisWeek: number;    // members with joined_at in last 7 days
  // Cycle
  activeCycleDaysRemaining: number | null;  // null if no active cycle
  activeCycleScore: number | null;
  // Bottleneck
  activeBlockDays: number;         // days of oldest active strategic_block (0 if none)
  // Previously seen moments (to avoid repeating)
  seenMoments: string[];         // array of moment types already shown
}

const MRR_MILESTONES = [1000, 5000, 10000, 50000];

export function detectMoments(input: MomentDetectorInput): Moment[] {
  const moments: Moment[] = [];

  // ── Celebraciones ──────────────────────────────────────────────

  // First customer (first sale OBV)
  if (input.hasFirstSale && !input.seenMoments.includes('first_customer')) {
    moments.push({
      type: 'first_customer',
      severity: 'celebration',
      title: '¡Primer cliente!',
      message: 'Has registrado tu primera venta. Esto es un hito enorme — validaste que alguien paga por tu solución.',
    });
  }

  // First revenue (MRR > 0 for first time)
  if (input.currentMrr > 0 && input.previousMrr === 0 && !input.seenMoments.includes('first_revenue')) {
    moments.push({
      type: 'first_revenue',
      severity: 'celebration',
      title: '¡Primer ingreso registrado!',
      message: `Tu MRR es €${Math.round(input.currentMrr)}. El modelo genera dinero.`,
      data: { mrr: input.currentMrr },
    });
  }

  // Revenue milestones (€1k, €5k, €10k, €50k)
  for (const milestone of MRR_MILESTONES) {
    const milestoneKey = `revenue_milestone_${milestone}`;
    if (input.currentMrr >= milestone && input.previousMrr < milestone && !input.seenMoments.includes(milestoneKey)) {
      moments.push({
        type: 'revenue_milestone',
        severity: 'celebration',
        title: `¡MRR cruzó €${milestone >= 1000 ? `${milestone / 1000}k` : milestone}!`,
        message: `Tu MRR alcanzó €${Math.round(input.currentMrr)}. Sigue escalando.`,
        data: { milestone, mrr: input.currentMrr },
      });
    }
  }

  // Team growth
  if (input.newMembersThisWeek > 0 && !input.seenMoments.includes('team_growth')) {
    moments.push({
      type: 'team_growth',
      severity: 'celebration',
      title: '¡Equipo creciendo!',
      message: `${input.newMembersThisWeek} nuevo${input.newMembersThisWeek > 1 ? 's' : ''} miembro${input.newMembersThisWeek > 1 ? 's' : ''} se unió al proyecto. Ahora sois ${input.teamSize}.`,
      data: { newMembers: input.newMembersThisWeek, totalSize: input.teamSize },
    });
  }

  // Phase speed (advanced in < 4 weeks)
  if (input.weeksInPhase < 4 && input.weeksInPhase > 0 && input.phaseScore >= 75 && input.hardSignalMet
    && !input.seenMoments.includes('phase_speed')) {
    moments.push({
      type: 'phase_speed',
      severity: 'celebration',
      title: '¡Avance rápido!',
      message: `Llevas solo ${input.weeksInPhase} semana${input.weeksInPhase > 1 ? 's' : ''} en Fase ${input.currentPhase} y ya cumples los requisitos para avanzar.`,
    });
  }

  // ── Atención / Coaching ────────────────────────────────────────
  // Warnings use weekly keys to avoid spamming on every visit
  // but reappear each new week until resolved.
  const weekKey = Math.floor(Date.now() / (7 * 86_400_000));

  // Stagnation warning (≥8 weeks, score didn't improve ≥10 pts in 4 weeks)
  if (input.weeksInPhase >= 8 && input.scoreChange4w < 10 && input.currentPhase < 4
    && !input.seenMoments.includes(`stagnation_warning_${weekKey}`)) {
    moments.push({
      type: 'stagnation_warning',
      severity: 'warning',
      title: 'Progreso estancado',
      message: `Llevas ${input.weeksInPhase} semanas en Fase ${input.currentPhase} sin mejora significativa. Revisa qué te bloquea.`,
      data: { weeksInPhase: input.weeksInPhase, scoreChange: input.scoreChange4w },
    });
  }

  // Hard signal close (score OK but missing hard signal for ≥2 weeks)
  if (input.phaseScore >= 75 && !input.hardSignalMet && input.weeksInPhase >= 2 && input.currentPhase < 4
    && !input.seenMoments.includes(`hard_signal_close_${weekKey}`)) {
    moments.push({
      type: 'hard_signal_close',
      severity: 'info',
      title: 'Casi listo para avanzar',
      message: `Tu score es ${Math.round(input.phaseScore)}% (≥75) pero falta la señal dura. Estás muy cerca.`,
    });
  }

  // Cycle ending soon (≤14 days, score < 75)
  if (input.activeCycleDaysRemaining !== null && input.activeCycleDaysRemaining <= 14
    && input.activeCycleDaysRemaining > 0 && (input.activeCycleScore ?? 0) < 75
    && !input.seenMoments.includes(`cycle_ending_soon_${weekKey}`)) {
    moments.push({
      type: 'cycle_ending_soon',
      severity: 'warning',
      title: 'Tu ciclo termina pronto',
      message: `Quedan ${input.activeCycleDaysRemaining} días y tu score es ${Math.round(input.activeCycleScore ?? 0)}%. Enfócate en los objetivos pendientes.`,
      data: { daysRemaining: input.activeCycleDaysRemaining, cycleScore: input.activeCycleScore },
    });
  }

  // Regression risk (3+ weeks of low score)
  if (input.consecutiveLowScore >= 3 && input.currentPhase > 1
    && !input.seenMoments.includes(`regression_risk_${weekKey}`)) {
    moments.push({
      type: 'regression_risk',
      severity: 'warning',
      title: 'Riesgo de regresión',
      message: `Tu score lleva ${input.consecutiveLowScore} semanas por debajo de 50. Si continúa, podrías regresar de fase.`,
      data: { consecutiveWeeks: input.consecutiveLowScore },
    });
  }

  // [D5.3] Bottleneck duration alert (strategic_block active >14 days)
  if (input.activeBlockDays >= 14
    && !input.seenMoments.includes(`bottleneck_alert_${weekKey}`)) {
    moments.push({
      type: 'regression_risk',
      severity: 'warning',
      title: 'Bloqueo activo prolongado',
      message: `Tienes un bloqueo activo desde hace ${input.activeBlockDays} días. Los bloqueos >14 días correlacionan con regresión de fase.`,
      data: { blockDays: input.activeBlockDays },
    });
  }

  return moments;
}
