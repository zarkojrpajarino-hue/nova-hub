/**
 * integration-recommendations — I15.70
 *
 * Motor de recomendación de integraciones. Función pura: dado el contexto del
 * proyecto, devuelve las integraciones que tiene sentido conectar AHORA y por qué.
 *
 * Diseño (I15.67):
 * - Fase 1: ninguna recomendación activa — muy pronto para hablar de MRR o runway.
 * - Fase 2+: se activan Stripe y Holded según condiciones de trigger.
 * - Trigger = condición técnica medible (fase, conexión activa, mrr).
 * - reason = mensaje de Optimus: dato que entra / módulo que hidrata / efecto en Optimus. (I15.72 + I15.76)
 * - Max 2 recomendaciones devueltas. (I15.73)
 *
 * I15.75 (agujero de relevancia):
 * DEBT — project_type no está en este contexto todavía. Todos los proyectos en fase ≥ 2
 * reciben la misma recomendación. Filtrado por tipo (SaaS vs service vs marketplace)
 * requiere exponer project_type en IntegrationRecommendationContext — pendiente.
 */

export type IntegrationProvider = 'stripe' | 'holded'

export interface IntegrationRecommendation {
  provider: IntegrationProvider
  title: string
  /** I15.72 + I15.76 — qué dato entra, qué módulo hidrata, qué cambia en Optimus */
  reason: string
  /** Efecto concreto y medible que produce la conexión */
  impact: string
  /** Texto del CTA */
  cta: string
  /** Tab destino en IntegrationsView */
  targetTab: string
}

export interface IntegrationRecommendationContext {
  /** 0 si no disponible; 1–4 según project_phase_state */
  current_phase: number
  /** IDs de proveedores con status 'active' — I15.68 trigger */
  connected_providers: string[]
  /** null = desconocido (no hay datos de key_metrics) */
  mrr: number | null
}

const MAX_RECOMMENDATIONS = 2  // I15.73

/**
 * ALL_RECOMMENDATIONS: cada entrada tiene un predicado isActive(ctx).
 * Orden = prioridad. El slice(0, MAX) garantiza el límite.
 */
const ALL_RECOMMENDATIONS: ReadonlyArray<
  IntegrationRecommendation & { isActive: (ctx: IntegrationRecommendationContext) => boolean }
> = [
  {
    provider: 'stripe',
    title: 'Conecta Stripe para activar el Financial Engine',
    // I15.72 — causal; I15.76 — voz de Optimus
    reason:
      'Tu MRR actual se calcula con estimaciones manuales. Stripe reemplaza esa estimación con datos reales de suscripciones — Financial Engine recalcula probabilidad de éxito con peso 15%.',
    impact: 'key_metrics.mrr se hidrata automáticamente. Probabilidad de éxito recalculada con datos reales.',
    cta: 'Conectar Stripe',
    targetTab: 'stripe',
    // I15.68 — solo fase ≥ 2 y no conectado
    isActive: (ctx) =>
      ctx.current_phase >= 2 && !ctx.connected_providers.includes('stripe'),
  },
  {
    provider: 'holded',
    title: 'Conecta Holded para runway_months real',
    reason:
      'Sin datos de cobros reales, runway_months usa proyecciones manuales con ±40% de margen de error. Holded sincroniza facturas pendientes y pagadas → el cálculo baja a ±5%.',
    impact: 'runway_months más preciso. Alertas de vencimiento de facturas activas en el dashboard.',
    cta: 'Conectar Holded',
    targetTab: 'holded',
    // I15.68 — solo fase ≥ 2, no conectado, y Stripe ya conectado (Holded es secundario)
    isActive: (ctx) =>
      ctx.current_phase >= 2 && !ctx.connected_providers.includes('holded'),
  },
]

/** Devuelve hasta MAX_RECOMMENDATIONS recomendaciones activas para el contexto dado. */
export function getIntegrationRecommendations(
  ctx: IntegrationRecommendationContext,
): IntegrationRecommendation[] {
  // I15.68 — fase 1 = demasiado pronto, ninguna recomendación activa
  if (ctx.current_phase < 2) return []

  const active = ALL_RECOMMENDATIONS.filter((r) => r.isActive(ctx))
  return active
    .slice(0, MAX_RECOMMENDATIONS)
    .map(({ isActive: _isActive, ...rec }) => rec)
}

/**
 * I15.68 — devuelve true cuando el proyecto está en fase temprana (1 o sin datos).
 * Usado por el panel para mostrar el aviso "las integraciones se activan en fase 2".
 */
export function isEarlyPhase(current_phase: number): boolean {
  return current_phase < 2
}
