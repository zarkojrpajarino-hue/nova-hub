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
  | 'first_obv'
  | 'first_task_completed'
  | 'first_obv_validated'
  | 'first_team_member'
  | 'fifth_obv'
  | 'tenth_task'
  | 'stagnation_warning'
  | 'hard_signal_close'
  | 'cycle_ending_soon'
  | 'regression_risk'
  | 'bottleneck_alert'
  | 'low_runway_alert'
  | 'upgrade_ai_limit'
  | 'upgrade_team_limit'
  | 'upgrade_project_limit'
  | 'trajectory_warning'   // V5.2.10
  | 'coverage_gap'         // V5.2.11
  | 'churn_risk';          // V5.2.12

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
  // Micro-celebrations
  totalOBVs: number;               // total OBVs in project
  totalTasksCompleted: number;     // total tasks with status=done
  totalOBVsValidated: number;      // total OBVs with status='validated'
  hasTeamMembers: boolean;         // teamSize >= 2 (founder + 1 member)
  // F30: Financial runway
  runwayMonths: number | null;     // from key_metrics or stress test (null if unknown)
  // Upgrade nudge data
  aiCallsUsed: number;           // from ai_generations_log count this month
  projectCount: number;          // user's total projects
  // Currency symbol (e.g. '€', '$', '£') — optional, omitted = no symbol
  currency?: string;
  // V5.2.11 — Function type coverage for coverage_gap detection
  functionCoverage?: {
    demand: boolean;             // has tasks/obvs for demand
    delivery: boolean;           // has tasks/obvs for delivery
    cash: boolean;               // has tasks/obvs for cash
  };
  // V5.2.12 — MRR history for churn_risk detection
  mrrChange4wPct?: number;       // % change in MRR over 4 weeks (e.g. 2.5 = +2.5%)
  previousTeamSize?: number;     // team size 4 weeks ago (to detect decrease)
  // Previously seen moments (to avoid repeating)
  seenMoments: string[];         // array of moment types already shown
}

const MRR_MILESTONES = [1000, 5000, 10000, 50000];

/** Format a number as currency. Uses symbol if provided, falls back to locale-agnostic format. */
function formatCurrency(amount: number, currency?: string, shortLabel?: string): string {
  const symbol = currency || '';
  const value = shortLabel || String(Math.round(amount));
  return symbol ? `${symbol}${value}` : value;
}

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
      message: `Tu MRR es ${formatCurrency(input.currentMrr, input.currency)}. El modelo genera dinero.`,
      data: { mrr: input.currentMrr },
    });
  }

  // Revenue milestones (1k, 5k, 10k, 50k — currency-agnostic)
  for (const milestone of MRR_MILESTONES) {
    const milestoneKey = `revenue_milestone_${milestone}`;
    if (input.currentMrr >= milestone && input.previousMrr < milestone && !input.seenMoments.includes(milestoneKey)) {
      const label = milestone >= 1000 ? `${milestone / 1000}k` : String(milestone);
      moments.push({
        type: 'revenue_milestone',
        severity: 'celebration',
        title: `¡MRR cruzó ${formatCurrency(milestone, input.currency, label)}!`,
        message: `Tu MRR alcanzó ${formatCurrency(input.currentMrr, input.currency)}. Sigue escalando.`,
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

  // First OBV created
  if (input.totalOBVs === 1 && !input.seenMoments.includes('first_obv')) {
    moments.push({
      type: 'first_obv',
      severity: 'celebration',
      title: '¡Primera OBV registrada!',
      message: 'Has creado tu primera validación. Cada OBV es evidencia real de progreso.',
    });
  }

  // First task completed
  if (input.totalTasksCompleted === 1 && !input.seenMoments.includes('first_task_completed')) {
    moments.push({
      type: 'first_task_completed',
      severity: 'celebration',
      title: '¡Primera tarea completada!',
      message: 'Has ejecutado tu primera acción. El motor de fases ahora tiene datos para calcular tu velocidad.',
    });
  }

  // [V4.8.4] First OBV validated
  if (input.totalOBVsValidated === 1 && !input.seenMoments.includes('first_obv_validated')) {
    moments.push({
      type: 'first_obv_validated',
      severity: 'celebration',
      title: '¡Primera OBV validada!',
      message: 'Tu equipo ha validado tu primera evidencia. Las validaciones son el corazón del sistema de fases.',
    });
  }

  // [V4.8.4] First team member (teamSize >= 2)
  if (input.hasTeamMembers && !input.seenMoments.includes('first_team_member')) {
    moments.push({
      type: 'first_team_member',
      severity: 'celebration',
      title: '¡Primer miembro del equipo!',
      message: 'Ya no estás solo. Los equipos con 2+ miembros avanzan un 40% más rápido en promedio.',
    });
  }

  // [V4.8.4] 5th OBV milestone
  if (input.totalOBVs === 5 && !input.seenMoments.includes('fifth_obv')) {
    moments.push({
      type: 'fifth_obv',
      severity: 'celebration',
      title: '¡5 OBVs registradas!',
      message: 'Llevas 5 validaciones. Estás construyendo un historial sólido de evidencia.',
      data: { totalOBVs: 5 },
    });
  }

  // [V4.8.4] 10th task completed
  if (input.totalTasksCompleted === 10 && !input.seenMoments.includes('tenth_task')) {
    moments.push({
      type: 'tenth_task',
      severity: 'celebration',
      title: '¡10 tareas completadas!',
      message: 'Has ejecutado 10 acciones. Tu velocidad de ejecución ya es medible y consistente.',
      data: { totalTasks: 10 },
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

  // Stagnation warning — threshold is more lenient in Phase 0 (12 weeks) vs later phases (8 weeks)
  const stagnationWeeks = input.currentPhase === 0 ? 12 : 8;
  if (input.weeksInPhase >= stagnationWeeks && input.scoreChange4w < 10 && input.currentPhase < 4
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
      type: 'bottleneck_alert',
      severity: 'warning',
      title: 'Bloqueo activo prolongado',
      message: `Tienes un bloqueo activo desde hace ${input.activeBlockDays} días. Los bloqueos >14 días correlacionan con regresión de fase.`,
      data: { blockDays: input.activeBlockDays },
    });
  }

  // [FI30.10] Low runway alert (<4 months)
  if (input.runwayMonths !== null && input.runwayMonths < 4
    && !input.seenMoments.includes(`low_runway_alert_${weekKey}`)) {
    moments.push({
      type: 'low_runway_alert',
      severity: 'warning',
      title: 'Alerta de runway',
      message: `Tu runway es de ${Math.round(input.runwayMonths)} meses. Revisa tu estrategia financiera.`,
      data: { runwayMonths: input.runwayMonths },
    });
  }

  // ── V5.2.10 — Trajectory warning ─────────────────────────────
  // If phase_score < 50 AND weeksInPhase > (expected_weeks / 2), fire warning
  const EXPECTED_WEEKS: Record<number, number> = { 0: 4, 1: 8, 2: 12, 3: 16 };
  const expectedWeeks = EXPECTED_WEEKS[input.currentPhase];
  if (
    expectedWeeks !== undefined
    && input.phaseScore < 50
    && input.weeksInPhase > expectedWeeks / 2
    && input.currentPhase < 4
    && !input.seenMoments.includes(`trajectory_warning_${weekKey}`)
  ) {
    const remaining = expectedWeeks - input.weeksInPhase;
    moments.push({
      type: 'trajectory_warning',
      severity: 'warning',
      title: 'Trayectoria en riesgo',
      message: `Llevas ${input.weeksInPhase} de ${expectedWeeks} semanas esperadas en Fase ${input.currentPhase} con score ${Math.round(input.phaseScore)}%. ${remaining > 0 ? `Quedan ~${remaining} semanas.` : 'Ya superaste el tiempo esperado.'} Revisa tus prioridades.`,
      data: { weeksInPhase: input.weeksInPhase, expectedWeeks, phaseScore: input.phaseScore },
    });
  }

  // ── V5.2.11 — Coverage gap ─────────────────────────────────
  // If in a phase >2 weeks and any core function_type coverage is missing
  if (
    input.functionCoverage
    && input.weeksInPhase > 2
    && input.currentPhase >= 1
    && input.currentPhase < 4
  ) {
    const gaps: string[] = [];
    if (!input.functionCoverage.demand) gaps.push('demanda');
    if (!input.functionCoverage.delivery) gaps.push('entrega');
    if (!input.functionCoverage.cash) gaps.push('monetización');
    if (gaps.length > 0 && !input.seenMoments.includes(`coverage_gap_${weekKey}`)) {
      moments.push({
        type: 'coverage_gap',
        severity: 'warning',
        title: 'Área sin cubrir',
        message: `Llevas ${input.weeksInPhase} semanas en Fase ${input.currentPhase} sin actividad en: ${gaps.join(', ')}. Las startups que cubren las 3 áreas avanzan más rápido.`,
        data: { gaps, weeksInPhase: input.weeksInPhase },
      });
    }
  }

  // ── V5.2.12 — Churn risk ──────────────────────────────────
  // If hasFirstSale AND MRR stagnant (<5% change in 4w) AND team shrank
  if (
    input.hasFirstSale
    && input.mrrChange4wPct !== undefined
    && Math.abs(input.mrrChange4wPct) < 5
    && input.previousTeamSize !== undefined
    && input.teamSize < input.previousTeamSize
    && !input.seenMoments.includes(`churn_risk_${weekKey}`)
  ) {
    moments.push({
      type: 'churn_risk',
      severity: 'warning',
      title: 'Riesgo de churn',
      message: `Tu MRR lleva 4 semanas estancado (${input.mrrChange4wPct > 0 ? '+' : ''}${input.mrrChange4wPct.toFixed(1)}%) y el equipo se redujo de ${input.previousTeamSize} a ${input.teamSize}. Revisa retención de clientes y equipo.`,
      data: { mrrChange4wPct: input.mrrChange4wPct, teamSize: input.teamSize, previousTeamSize: input.previousTeamSize },
    });
  }

  // ── Upgrade nudges ───────────────────────────────────────────

  // AI calls approaching free-tier limit (18/20 = 90%)
  if (input.aiCallsUsed >= 18 && !input.seenMoments.includes('upgrade_ai_limit')) {
    moments.push({
      type: 'upgrade_ai_limit',
      severity: 'info',
      title: 'Casi al límite de IA',
      message: `Has usado ${input.aiCallsUsed}/20 llamadas IA este mes. Actualiza a Pro para 100 llamadas.`,
    });
  }

  // Team size hitting free-tier boundary
  if (input.teamSize >= 3 && !input.seenMoments.includes('upgrade_team_limit')) {
    moments.push({
      type: 'upgrade_team_limit',
      severity: 'info',
      title: 'Equipo creciendo',
      message: 'Tu equipo tiene 3+ miembros. Pro te da hasta 10 miembros + roles avanzados.',
    });
  }

  // Multiple projects
  if (input.projectCount >= 2 && !input.seenMoments.includes('upgrade_project_limit')) {
    moments.push({
      type: 'upgrade_project_limit',
      severity: 'info',
      title: 'Segundo proyecto',
      message: 'Gestiona hasta 5 proyectos con Pro. Cada proyecto tiene su propio motor de fases.',
    });
  }

  return moments;
}
