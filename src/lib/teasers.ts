export type TeaserBlockedBy = 'phase' | 'mode' | 'viability' | 'missing_data';

export interface FeatureTeaser {
  featureId: string;
  title: string;
  description: string;
  blockedBy: TeaserBlockedBy;
  unlockCondition: string;
  surface: 'engine' | 'weekly' | 'reset' | 'history';
}

interface TeaserContext {
  viabilityStatus: string;
  closedCyclesCount: number;
  hasWeeklyReview: boolean;
  ritualPending: boolean;
}

const ALL_TEASERS: ReadonlyArray<{
  featureId: string;
  title: string;
  description: string;
  blockedBy: TeaserBlockedBy;
  unlockCondition: string;
  surface: FeatureTeaser['surface'];
  isActive: (ctx: TeaserContext) => boolean;
}> = [
  {
    featureId: 'strategic_reset',
    title: 'Reset estratégico',
    description: 'Cierre y retrospectiva al final de cada ciclo de 4 semanas.',
    blockedBy: 'missing_data',
    unlockCondition: 'Cuando completes tu primer ciclo de 4 semanas',
    surface: 'reset',
    isActive: (ctx) => ctx.closedCyclesCount === 0,
  },
  {
    featureId: 'cycle_history',
    title: 'Historial de ciclos',
    description: 'Tendencias y evolución a través de múltiples ciclos.',
    blockedBy: 'missing_data',
    unlockCondition: 'Cuando completes al menos 2 ciclos estratégicos',
    surface: 'history',
    isActive: (ctx) => ctx.closedCyclesCount === 1,
  },
  {
    featureId: 'weekly_review',
    title: 'Revisión semanal',
    description: 'Análisis automático del progreso de cada semana.',
    blockedBy: 'missing_data',
    unlockCondition: 'Cuando el proyecto tenga actividad suficiente para generarla',
    surface: 'weekly',
    isActive: (ctx) => !ctx.hasWeeklyReview,
  },
  {
    featureId: 'rescue_playbooks',
    title: 'Playbooks de rescate',
    description: 'Planes de acción para recuperar estabilidad ante señales de riesgo.',
    blockedBy: 'viability',
    unlockCondition: 'Cuando la viabilidad pase a seguimiento, estancamiento o crítico',
    surface: 'engine',
    isActive: (ctx) => ctx.viabilityStatus === 'healthy',
  },
];

export function getFeatureTeasers(ctx: TeaserContext): FeatureTeaser[] {
  const active = ALL_TEASERS.filter((t) => t.isActive(ctx));
  return active.slice(0, 2).map(({ isActive: _isActive, ...teaser }) => teaser);
}
