/**
 * FEATURE FLAGS - Sistema de Control de Funcionalidades
 *
 * Este archivo controla qué funcionalidades están activas en la aplicación.
 * Cambia estos valores cuando quieras activar/desactivar features.
 */

// ============================================================================
// 💳 SISTEMA DE PAGOS Y SUSCRIPCIONES
// ============================================================================

/**
 * ENABLE_PAYMENTS: Controla si el sistema de pagos está activo
 *
 * - false: TODO es GRATIS y ABIERTO (modo testing/beta)
 *   - No hay limitaciones
 *   - No hay candados en features premium
 *   - No se muestran modales de upgrade
 *   - Acceso completo a todas las funcionalidades
 *
 * - true: Sistema de pagos ACTIVO (modo producción)
 *   - Se aplican límites por plan (Free, Pro, Enterprise)
 *   - Features premium bloqueadas para usuarios Free
 *   - Modales de upgrade visibles
 *   - FeatureGate aplicando restricciones
 *
 * ESTADO ACTUAL: true (Pagos activos)
 *
 * Para activar pagos: Cambia a `true` cuando estés listo para monetizar
 */
export const ENABLE_PAYMENTS = true;

/**
 * DEMO_MODE: Controla si se muestran datos demo en lugar de datos reales
 *
 * - true: Muestra datos demo pre-generados (útil para presentaciones)
 * - false: Usa datos reales del usuario
 */
export const DEMO_MODE = false;

/**
 * SHOW_UPGRADE_HINTS: Muestra hints sutiles de upgrade sin bloquear
 *
 * - true: Muestra badges "Pro", "Enterprise" en el UI (sin bloquear)
 * - false: Oculta completamente referencias a planes premium
 */
export const SHOW_UPGRADE_HINTS = true;

// ============================================================================
// 🚀 FEATURES EN DESARROLLO (Beta Features)
// ============================================================================

/**
 * ENABLE_AI_FEATURES: Funcionalidades de IA generativa
 */
export const ENABLE_AI_FEATURES = true;

/**
 * ENABLE_ANALYTICS: Sistema de analytics avanzado
 */
export const ENABLE_ANALYTICS = true;

/**
 * ENABLE_INTEGRATIONS: Integraciones con servicios externos
 */
export const ENABLE_INTEGRATIONS = true;

// ============================================================================
// PLAN TIERS — Canonical tier definitions for monetization
// ============================================================================

/**
 * PLAN_TIERS: Single source of truth for plan pricing, limits, and feature gates.
 *
 * Prices are in cents (USD). -1 means unlimited.
 * These tiers are used by:
 *   - PlanSelectionModal (display)
 *   - FeatureGate (access control)
 *   - useSubscription (limit checking)
 *   - PLAN_LIMITS (legacy shape, derived below)
 *
 * NOTE: Stripe product/price IDs are NOT included here.
 * They must be configured by the developer in Stripe Dashboard
 * and mapped via environment variables when ENABLE_PAYMENTS = true.
 */
export const PLAN_TIERS = {
  free: {
    name: 'Starter',
    price: 0, // cents/month
    priceAnnual: 0, // cents/year
    projects: 3,
    members: 7,
    aiCalls: 50,
    analyticsWindow: 90, // days
    integrations: false,
    meetingIntelligence: false,
    benchmarking: false,
    api: false,
  },
  pro: {
    name: 'Pro',
    price: 2900, // $29/month
    priceAnnual: 27800, // $278/year (20% discount)
    projects: 5,
    members: 10,
    aiCalls: 100,
    analyticsWindow: 365, // days
    integrations: true,
    meetingIntelligence: true,
    benchmarking: false,
    api: false,
  },
  scale: {
    name: 'Scale',
    price: 7900, // $79/month
    priceAnnual: 75800, // $758/year (20% discount)
    projects: -1, // unlimited
    members: -1, // unlimited
    aiCalls: 500,
    analyticsWindow: -1, // unlimited
    integrations: true,
    meetingIntelligence: true,
    benchmarking: true,
    api: true,
  },
} as const;

export type PlanTierKey = keyof typeof PLAN_TIERS;
export type PlanTier = (typeof PLAN_TIERS)[PlanTierKey];

// ============================================================================
// PLAN_LIMITS — Legacy shape derived from PLAN_TIERS
// ============================================================================

/**
 * PLAN_LIMITS: Legacy shape derived from PLAN_TIERS (the authoritative source above).
 *
 * Mapping: FREE -> free, PRO -> pro, ENTERPRISE -> scale.
 * StorageGB has no equivalent in PLAN_TIERS, so it keeps its own defaults.
 * If you need to change limits, edit PLAN_TIERS -- this object follows automatically.
 */
export const PLAN_LIMITS = {
  FREE: {
    maxProjects: PLAN_TIERS.free.projects,
    maxTeamMembers: PLAN_TIERS.free.members,
    maxStorageGB: 5,
    aiRequestsPerMonth: PLAN_TIERS.free.aiCalls,
    analyticsHistory: PLAN_TIERS.free.analyticsWindow,
  },
  PRO: {
    maxProjects: PLAN_TIERS.pro.projects,
    maxTeamMembers: PLAN_TIERS.pro.members,
    maxStorageGB: 100,
    aiRequestsPerMonth: PLAN_TIERS.pro.aiCalls,
    analyticsHistory: PLAN_TIERS.pro.analyticsWindow,
  },
  ENTERPRISE: {
    maxProjects: PLAN_TIERS.scale.projects,
    maxTeamMembers: PLAN_TIERS.scale.members,
    maxStorageGB: -1, // unlimited
    aiRequestsPerMonth: PLAN_TIERS.scale.aiCalls,
    analyticsHistory: PLAN_TIERS.scale.analyticsWindow,
  },
};

// ============================================================================
// 📝 NOTAS PARA EL FUTURO
// ============================================================================

/**
 * CÓMO ACTIVAR EL SISTEMA DE PAGOS:
 *
 * 1. Cambia ENABLE_PAYMENTS = true
 * 2. Configura las API keys de Stripe en .env:
 *    VITE_STRIPE_PUBLISHABLE_KEY=pk_...
 *    STRIPE_SECRET_KEY=sk_...
 * 3. Crea los productos en Stripe Dashboard
 * 4. Implementa el backend de webhooks (tareas #18-#22)
 * 5. Testea el flujo de pago completo
 * 6. Activa SHOW_UPGRADE_HINTS = true si quieres hints sutiles
 *
 * TODO EL CÓDIGO YA ESTÁ LISTO - Solo necesitas cambiar el flag!
 */

/**
 * Helper function: Check if payments are enabled
 */
export const isPaymentsEnabled = () => ENABLE_PAYMENTS;

/**
 * Helper function: Check if user should see upgrade hints
 */
export const shouldShowUpgradeHints = () => ENABLE_PAYMENTS && SHOW_UPGRADE_HINTS;

/**
 * Helper function: Check if demo mode is active
 */
export const isDemoMode = () => DEMO_MODE;
