/**
 * 🔒 FEATURE GATE
 *
 * Componente que controla el acceso a features premium basado en el plan de suscripción.
 * Envuelve cualquier feature y automáticamente la bloquea si el plan no lo permite.
 *
 * Uso básico:
 * <FeatureGate feature="ai_role_generation" projectId={projectId}>
 *   <GenerateRolesButton />
 * </FeatureGate>
 *
 * Con overlay visual:
 * <FeatureGate feature="ai_task_generation" projectId={projectId} mode="overlay">
 *   <TaskGenerator />
 * </FeatureGate>
 *
 * Modo replace (solo muestra el lock):
 * <FeatureGate feature="advanced_analytics" projectId={projectId} mode="replace">
 *   <AnalyticsDashboard />
 * </FeatureGate>
 */

import { ReactNode, cloneElement, isValidElement } from 'react';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { LockedFeatureOverlay } from './LockedFeatureOverlay';
import { DemoBanner } from './DemoBanner';
import type { SubscriptionPlan } from '@/hooks/useSubscription';
import { isPaymentsEnabled } from '@/config/features';

// Features que se pueden gatear
type GateableFeature = keyof Pick<
  SubscriptionPlan,
  | 'ai_role_generation'
  | 'ai_task_generation'
  | 'ai_logo_generation'
  | 'ai_buyer_persona'
  | 'advanced_analytics'
  | 'custom_branding'
  | 'api_access'
  | 'priority_support'
  | 'white_label'
  | 'custom_domain'
>;

interface FeatureGateProps {
  /** ID del proyecto para verificar el plan */
  projectId: string | undefined;

  /** Feature a verificar (debe existir en SubscriptionPlan) */
  feature: GateableFeature;

  /** Contenido a mostrar si la feature está desbloqueada */
  children: ReactNode;

  /** Overlay personalizado cuando está bloqueada (opcional) */
  fallback?: ReactNode;

  /** Nombre legible de la feature para mostrar en el overlay */
  featureName?: string;

  /** Plan mínimo requerido (se auto-detecta si no se provee) */
  requiredPlan?: 'starter' | 'pro' | 'advanced' | 'enterprise';

  /** Descripción de la feature para el overlay */
  description?: string;

  /**
   * Modo de bloqueo:
   * - 'demo': Muestra vista completa con datos demo + banner arriba (RECOMENDADO para percepción de valor)
   * - 'overlay': Muestra children con overlay encima (semi-transparente)
   * - 'replace': Reemplaza completamente children con el lock
   * - 'hide': Simplemente no renderiza nada
   */
  mode?: 'demo' | 'overlay' | 'replace' | 'hide';

  /** Clase CSS adicional para el wrapper */
  className?: string;

  /** Si true, muestra loading skeleton mientras carga */
  showLoadingSkeleton?: boolean;
}

/**
 * Información de display para cada feature
 * Define el nombre, descripción y plan mínimo requerido
 */
const FEATURE_INFO: Record<
  GateableFeature,
  {
    name: string;
    description: string;
    requiredPlan: 'starter' | 'pro' | 'advanced' | 'enterprise';
  }
> = {
  ai_role_generation: {
    name: 'Generación de Roles con IA',
    description: 'Crea roles de equipo automáticamente basados en tu modelo de negocio usando inteligencia artificial',
    requiredPlan: 'starter',
  },
  ai_task_generation: {
    name: 'Generación de Tareas con IA',
    description: 'Genera tareas inteligentes y estructuradas para tu equipo automáticamente',
    requiredPlan: 'pro',
  },
  ai_logo_generation: {
    name: 'Generación de Logo con IA',
    description: 'Crea logos profesionales y únicos para tu proyecto con inteligencia artificial',
    requiredPlan: 'pro',
  },
  ai_buyer_persona: {
    name: 'Buyer Persona con IA',
    description: 'Análisis inteligente de tu mercado objetivo y perfiles de cliente ideal detallados',
    requiredPlan: 'pro',
  },
  advanced_analytics: {
    name: 'Analytics Avanzados',
    description: 'Dashboards detallados con métricas avanzadas, reportes personalizados y exportación de datos',
    requiredPlan: 'advanced',
  },
  custom_branding: {
    name: 'Branding Personalizado',
    description: 'Personaliza colores, logos y toda la apariencia de tu espacio de trabajo',
    requiredPlan: 'advanced',
  },
  api_access: {
    name: 'Acceso a API',
    description: 'Integra Nova Hub con tus herramientas favoritas a través de nuestra API REST completa',
    requiredPlan: 'advanced',
  },
  priority_support: {
    name: 'Soporte Prioritario',
    description: 'Respuestas garantizadas en menos de 2 horas y canal de soporte dedicado',
    requiredPlan: 'advanced',
  },
  white_label: {
    name: 'White Label',
    description: 'Elimina toda marca de Nova Hub y presenta la plataforma con tu propia identidad corporativa',
    requiredPlan: 'enterprise',
  },
  custom_domain: {
    name: 'Dominio Personalizado',
    description: 'Usa tu propio dominio personalizado (ej: hub.tuempresa.com) para acceder a la plataforma',
    requiredPlan: 'enterprise',
  },
};

/**
 * FeatureGate - Controla acceso a features premium
 *
 * Verifica automáticamente si el plan actual del proyecto permite
 * usar una feature específica. Si no tiene acceso, muestra un overlay
 * o reemplaza el contenido con un mensaje de upgrade.
 */
export function FeatureGate({
  projectId,
  feature,
  children,
  fallback,
  featureName,
  requiredPlan,
  description,
  mode = 'overlay',
  className,
  showLoadingSkeleton = false,
}: FeatureGateProps) {
  // 🎯 FEATURE FLAG: If payments are disabled, grant full access to everything
  // This allows testing with known users before activating payment system
  if (!isPaymentsEnabled()) {
    return <>{children}</>;
  }

  const { canUseFeature, isLoading, plan } = useFeatureAccess(projectId);

  // 🎯 MODO DEMO: Siempre mostrar con datos demo (sin verificar acceso)
  // Esto permite que usuarios sin plan vean el valor de las features premium INMEDIATAMENTE
  if (mode === 'demo') {
    const featureInfo = FEATURE_INFO[feature];
    const displayName = featureName || featureInfo.name;
    const displayRequiredPlan = requiredPlan || featureInfo.requiredPlan;

    return (
      <div className={className}>
        <DemoBanner
          featureName={displayName}
          requiredPlan={displayRequiredPlan}
          description={`Esta es una preview de ${displayName}. Para aplicar estos análisis a tu empresa con datos reales personalizados, mejora tu plan.`}
          variant="compact"
        />
        {/* Renderizar children con prop isDemoMode=true si es posible */}
        {isValidElement(children) && typeof children.type !== 'string'
          ? cloneElement(children as React.ReactElement<any>, { isDemoMode: true })
          : children}
      </div>
    );
  }

  // Si está cargando
  if (isLoading) {
    if (showLoadingSkeleton) {
      return (
        <div className={`animate-pulse bg-gray-200 rounded-lg ${className || ''}`}>
          <div className="h-32" />
        </div>
      );
    }
    // Por defecto, mostrar children mientras carga (evita flash de bloqueado)
    return <>{children}</>;
  }

  // Verificar si el usuario puede usar la feature
  const hasAccess = canUseFeature(feature);

  // ✅ Si tiene acceso, renderizar children normalmente
  if (hasAccess) {
    return <>{children}</>;
  }

  // 🔒 No tiene acceso - mostrar overlay/lock/nada según el modo

  // Obtener información de la feature
  const featureInfo = FEATURE_INFO[feature];
  const displayName = featureName || featureInfo.name;
  const displayDescription = description || featureInfo.description;
  const displayRequiredPlan = requiredPlan || featureInfo.requiredPlan;

  // Si hay fallback personalizado, usarlo
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Modo 'hide': no renderizar nada
  if (mode === 'hide') {
    return null;
  }

  // Modo 'replace': solo mostrar el overlay (sin children debajo)
  if (mode === 'replace') {
    return (
      <div className={className}>
        <LockedFeatureOverlay
          featureName={displayName}
          requiredPlan={displayRequiredPlan}
          description={displayDescription}
          currentPlan={plan?.name || 'trial'}
          projectId={projectId}
        />
      </div>
    );
  }

  // Modo 'overlay': mostrar children con overlay semi-transparente encima
  return (
    <div className={`relative ${className || ''}`}>
      {/* Contenido deshabilitado debajo con blur effect */}
      <div className="pointer-events-none blur-sm opacity-40 select-none">
        {children}
      </div>

      {/* Overlay de bloqueo encima - sticky para que siempre esté visible */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-8 overflow-auto">
        <div className="sticky top-8">
          <LockedFeatureOverlay
            featureName={displayName}
            requiredPlan={displayRequiredPlan}
            description={displayDescription}
            currentPlan={plan?.name || 'trial'}
            projectId={projectId}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Helper hook para verificar rápidamente si una feature está disponible
 * sin renderizar un gate completo
 *
 * @example
 * const hasAI = useFeatureAvailable('ai_role_generation', projectId);
 * if (hasAI) {
 *   // mostrar botón
 * }
 */
export function useFeatureAvailable(
  feature: GateableFeature,
  projectId: string | undefined
): boolean {
  // 🎯 FEATURE FLAG: If payments disabled, all features are available
  if (!isPaymentsEnabled()) {
    return true;
  }

  const { canUseFeature } = useFeatureAccess(projectId);
  return canUseFeature(feature);
}
