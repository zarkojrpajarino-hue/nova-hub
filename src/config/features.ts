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
 * ESTADO ACTUAL: false (Testing con conocidos - TODO GRATIS)
 *
 * Para activar pagos: Cambia a `true` cuando estés listo para monetizar
 */
export const ENABLE_PAYMENTS = false;

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
export const SHOW_UPGRADE_HINTS = false;

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
// 📊 CONFIGURACIÓN DE LÍMITES (Solo aplica si ENABLE_PAYMENTS = true)
// ============================================================================

/**
 * Límites por plan de suscripción
 * Estos límites solo se aplican cuando ENABLE_PAYMENTS = true
 */
export const PLAN_LIMITS = {
  FREE: {
    maxProjects: 3,
    maxTeamMembers: 5,
    maxStorageGB: 5,
    aiRequestsPerMonth: 50,
    analyticsHistory: 30, // days
  },
  PRO: {
    maxProjects: 25,
    maxTeamMembers: 25,
    maxStorageGB: 100,
    aiRequestsPerMonth: 1000,
    analyticsHistory: 365, // days
  },
  ENTERPRISE: {
    maxProjects: -1, // unlimited
    maxTeamMembers: -1, // unlimited
    maxStorageGB: -1, // unlimited
    aiRequestsPerMonth: -1, // unlimited
    analyticsHistory: -1, // unlimited
  },
};

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
 *
 * NOTE: Stripe product/price IDs are NOT included here.
 * They must be configured by the developer in Stripe Dashboard
 * and mapped via environment variables when ENABLE_PAYMENTS = true.
 */
export const PLAN_TIERS = {
  free: {
    name: 'Starter',
    price: 0, // cents/month
    projects: 1,
    members: 3,
    aiCalls: 10,
    analyticsWindow: 30, // days
    integrations: false,
    meetingIntelligence: false,
    benchmarking: false,
    api: false,
  },
  pro: {
    name: 'Pro',
    price: 2900, // $29/month
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
