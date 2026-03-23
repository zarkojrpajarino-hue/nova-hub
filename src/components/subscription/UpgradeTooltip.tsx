/**
 * 💡 UPGRADE TOOLTIP
 *
 * Tooltip reutilizable que explica features premium y motiva upgrades.
 * Se puede envolver alrededor de cualquier elemento para indicar que requiere premium.
 *
 * Uso:
 * <UpgradeTooltip feature="ai_task_generation" requiredPlan="pro">
 *   <Button disabled>Generar con IA</Button>
 * </UpgradeTooltip>
 */

import { ReactNode, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Zap, Crown, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { PlanSelectionModal } from './PlanSelectionModal';
import { useAvailablePlans } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
interface UpgradeTooltipProps {
  /** Feature requerida */
  feature: string;

  /** Plan mínimo requerido */
  requiredPlan: 'starter' | 'pro' | 'advanced' | 'enterprise';

  /** Elemento que dispara el tooltip */
  children: ReactNode;

  /** Descripción personalizada (opcional) */
  description?: string;

  /** Mostrar el botón de t('subscription.verPlanes0') en el tooltip */
  showUpgradeButton?: boolean;

  /** Lado del tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';

  /** Clase CSS adicional */
  className?: string;

  /** Deshabilitado (no muestra tooltip) */
  disabled?: boolean;
}

/**
 * Información de features para mostrar en tooltips
 */
function getFeatureTooltips(t: (key: string) => string): Record<string, { name: string; benefit: string }> {
  return {
    ai_role_generation: {
      name: t('subscription.generaciónIaDeRoles'),
      benefit: t('subscription.creaRolesDeEquipoAutomáticamente'),
    },
    ai_task_generation: {
      name: t('subscription.generaciónIaDeTareas'),
      benefit: t('subscription.generaTareasInteligentesAutomáticamente'),
    },
    ai_logo_generation: {
      name: t('subscription.logoConIa'),
      benefit: t('subscription.diseñaLogosProfesionalesEn'),
    },
    ai_buyer_persona: {
      name: t('subscription.buyerPersonaIa'),
      benefit: t('subscription.análisisDeMercadoY'),
    },
    advanced_analytics: {
      name: t('subscription.analyticsAvanzados'),
      benefit: t('subscription.dashboardsDetalladosConMétricas'),
    },
    custom_branding: {
      name: t('subscription.brandingPersonalizado'),
      benefit: t('subscription.personalizaColoresLogosY'),
    },
    api_access: {
      name: t('subscription.accesoAApi'),
      benefit: t('subscription.integraConTusHerramientas'),
    },
    priority_support: {
      name: t('subscription.soportePrioritario'),
      benefit: t('subscription.respuestaEnMenosDe'),
    },
    white_label: {
      name: t('subscription.whiteLabel'),
      benefit: t('subscription.eliminaTodaMarcaDe'),
    },
    custom_domain: {
      name: t('subscription.dominioPersonalizado'),
      benefit: t('subscription.usaTuPropioDominio'),
    },
  };
}

/**
 * Estilos por plan
 */
const PLAN_STYLES = {
  starter: {
    color: 'text-blue-600',
    icon: Sparkles,
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  pro: {
    color: 'text-purple-600',
    icon: Crown,
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  advanced: {
    color: 'text-amber-600',
    icon: Zap,
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  enterprise: {
    color: 'text-slate-700',
    icon: Building2,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export function UpgradeTooltip({
  feature,
  requiredPlan,
  children,
  description,
  showUpgradeButton = false,
  side = 'top',
  className,
  disabled = false,
}: UpgradeTooltipProps) {
  const { t } = useTranslation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const availablePlans = useAvailablePlans();

  // Si está deshabilitado, solo renderizar children
  if (disabled) {
    return <>{children}</>;
  }

  const featureTooltips = getFeatureTooltips(t);
  const featureInfo = featureTooltips[feature] || {
    name: feature,
    benefit: t('subscription.funcionalidadPremium'),
  };

  const planStyle = PLAN_STYLES[requiredPlan];
  const PlanIcon = planStyle.icon;

  const handleUpgrade = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUpgradeModal(true);
  };

  const handlePlanSelected = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    console.info('[Upgrade] Plan selected:', { planId, billingCycle, context: 'upgrade-tooltip' });
    setShowUpgradeModal(false);
  };

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild className={className}>
            {children}
          </TooltipTrigger>
          <TooltipContent side={side} className="max-w-xs p-4">
            {/* Header */}
            <div className="flex items-start gap-2 mb-2">
              <div className={cn('mt-0.5', planStyle.color)}>
                <Lock size={16} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">{featureInfo.name}</p>
                <p className="text-xs text-muted-foreground">
                  {description || featureInfo.benefit}
                </p>
              </div>
            </div>

            {/* Plan badge */}
            <Badge
              className={cn(
                'text-xs gap-1.5 mb-3',
                planStyle.badgeClass,
                'border'
              )}
            >
              <PlanIcon size={12} />
              Disponible en {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
            </Badge>

            {/* Upgrade button */}
            {showUpgradeButton && (
              <Button
                onClick={handleUpgrade}
                size="sm"
                variant="outline"
                className="w-full text-xs gap-1.5"
              >{t('subscription.verPlanes')}<ArrowRight size={12} />
              </Button>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Upgrade Modal */}
      <PlanSelectionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={handlePlanSelected}
        availablePlans={availablePlans}
      />
    </>
  );
}

/**
 * Variante inline: Badge pequeño con tooltip
 * Útil para mostrar inline junto a títulos de features
 */
export function UpgradeBadge({
  requiredPlan,
  className,
}: {
  requiredPlan: 'starter' | 'pro' | 'advanced' | 'enterprise';
  className?: string;
}) {
  const planStyle = PLAN_STYLES[requiredPlan];
  const _PlanIcon = planStyle.icon;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              'text-[10px] gap-1 cursor-help',
              planStyle.badgeClass,
              'border',
              className
            )}
          >
            <Lock size={10} />
            {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Requiere plan{' '}
            <span className="font-semibold">
              {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
            </span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
