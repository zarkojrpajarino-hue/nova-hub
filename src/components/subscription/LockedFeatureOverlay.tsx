/**
 * 🔐 LOCKED FEATURE OVERLAY
 *
 * Overlay visual premium que se muestra cuando una feature está bloqueada.
 * Diseñado para motivar upgrades sin ser intrusivo.
 *
 * Características:
 * - Diseño glassmorphism elegante
 * - Animaciones suaves
 * - CTAs claros y atractivos
 * - Información contextual del plan
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Zap,
  Crown,
  Building2,
  Sparkles,
  TrendingUp,
  Shield,
  Globe,
  Palette,
  Code,
  HeadphonesIcon,
  ArrowRight,
} from 'lucide-react';
import { PlanSelectionModal } from './PlanSelectionModal';
import { useAvailablePlans } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

interface LockedFeatureOverlayProps {
  /** Nombre de la feature (display) */
  featureName: string;

  /** Plan mínimo requerido */
  requiredPlan: string;

  /** Descripción de la feature */
  description: string;

  /** Plan actual del usuario (nombre) */
  currentPlan: string;

  /** ID del proyecto */
  projectId?: string;

  /** Variante visual */
  variant?: 'default' | 'compact' | 'card';

  /** Clase CSS adicional */
  className?: string;
}

/**
 * Mapeo de planes a colores e iconos
 */
const PLAN_STYLES = {
  starter: {
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Sparkles,
  },
  pro: {
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    icon: Crown,
  },
  advanced: {
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: TrendingUp,
  },
  enterprise: {
    color: 'from-slate-700 to-slate-900',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    icon: Building2,
  },
};

/**
 * Iconos por tipo de feature
 */
function getFeatureIcon(featureName: string) {
  if (featureName.includes('IA') || featureName.includes('Inteligencia')) return Sparkles;
  if (featureName.includes('Analytics') || featureName.includes('Análisis')) return TrendingUp;
  if (featureName.includes('API')) return Code;
  if (featureName.includes('Branding') || featureName.includes('Personaliz')) return Palette;
  if (featureName.includes('Dominio')) return Globe;
  if (featureName.includes('White Label')) return Shield;
  if (featureName.includes('Soporte')) return HeadphonesIcon;
  return Lock;
}

export function LockedFeatureOverlay({
  featureName,
  requiredPlan,
  description,
  currentPlan,
  projectId: _projectId,
  variant = 'default',
  className,
}: LockedFeatureOverlayProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const availablePlans = useAvailablePlans();

  // Normalizar nombres de planes (lowercase, sin espacios)
  const normalizedRequiredPlan = requiredPlan.toLowerCase().replace(/\s+/g, '');
  const planStyle = PLAN_STYLES[normalizedRequiredPlan as keyof typeof PLAN_STYLES] || PLAN_STYLES.pro;

  const FeatureIcon = getFeatureIcon(featureName);
  const PlanIcon = planStyle.icon;

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handlePlanSelected = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    // TODO: Implementar upgrade de plan en Fase 7 (Stripe)
    setShowUpgradeModal(false);
  };

  // Variante compacta (para botones pequeños)
  if (variant === 'compact') {
    return (
      <>
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all hover:shadow-md',
            planStyle.bgColor,
            planStyle.borderColor,
            className
          )}
          onClick={handleUpgrade}
        >
          <Lock className={cn('h-3.5 w-3.5', planStyle.textColor)} />
          <span className={cn('text-xs font-medium', planStyle.textColor)}>
            {requiredPlan}
          </span>
        </div>

        <PlanSelectionModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onSelectPlan={handlePlanSelected}
          availablePlans={availablePlans}
        />
      </>
    );
  }

  // Variante card (overlay completo) - PREMIUM GLASSMORPHISM
  return (
    <>
      <div
        className={cn(
          'relative rounded-xl overflow-hidden',
          'bg-gradient-to-br from-white/95 via-white/90 to-white/95',
          'backdrop-blur-2xl border border-white/20 shadow-2xl',
          className
        )}
      >
        {/* Glassmorphism background con blur profesional */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-white/90 backdrop-blur-3xl" />

        {/* Decorative gradient - más sutil y profesional */}
        <div
          className={cn(
            'absolute top-0 right-0 w-96 h-96 opacity-[0.07] blur-3xl',
            `bg-gradient-to-br ${planStyle.color}`
          )}
        />
        <div
          className={cn(
            'absolute bottom-0 left-0 w-80 h-80 opacity-[0.05] blur-3xl',
            `bg-gradient-to-tr ${planStyle.color}`
          )}
        />

        {/* Content */}
        <div className="relative p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[420px]">
          {/* Feature Icon - Más grande y profesional */}
          <div className="relative">
            <div
              className={cn(
                'w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl',
                `bg-gradient-to-br ${planStyle.color}`,
                'animate-pulse-glow'
              )}
            >
              <FeatureIcon className="h-12 w-12 text-white" />
            </div>
            {/* Lock badge - más elegante */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200">
              <Lock className="h-5 w-5 text-gray-700" />
            </div>
          </div>

          {/* Feature Name - Typography mejorada */}
          <div className="space-y-3">
            <h3 className="font-bold text-3xl text-gray-900 tracking-tight">
              {featureName}
            </h3>
            <p className="text-base text-gray-600 max-w-lg leading-relaxed">
              {description}
            </p>
          </div>

          {/* Plan badges - Más profesional */}
          <div className="flex items-center gap-4 bg-white/50 px-6 py-3 rounded-xl border border-gray-200/50 backdrop-blur-sm">
            {/* Current plan */}
            <div className="flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Plan Actual</p>
              <Badge variant="outline" className="text-xs py-1.5 px-3 font-semibold">
                {currentPlan}
              </Badge>
            </div>

            <ArrowRight className="h-5 w-5 text-gray-400" />

            {/* Required plan */}
            <div className="flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Requerido</p>
              <Badge
                className={cn(
                  'text-xs py-1.5 px-3 gap-1.5 font-bold',
                  planStyle.bgColor,
                  planStyle.textColor,
                  planStyle.borderColor,
                  'border-2'
                )}
              >
                <PlanIcon className="h-3.5 w-3.5" />
                {requiredPlan}
              </Badge>
            </div>
          </div>

          {/* CTA - Más profesional y grande */}
          <div className="space-y-4 pt-4 w-full max-w-sm">
            <Button
              onClick={handleUpgrade}
              size="lg"
              className={cn(
                'w-full h-14 text-base font-bold shadow-2xl hover:shadow-3xl transition-all gap-3 group',
                `bg-gradient-to-r ${planStyle.color} hover:scale-[1.02]`
              )}
            >
              <Zap className="h-6 w-6 group-hover:rotate-12 transition-transform" />
              Desbloquear {requiredPlan}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span>14 días gratis</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span>Cancela cuando quieras</span>
              </div>
            </div>
          </div>

          {/* Benefits hint - Más atractivo */}
          <div className="pt-6 border-t border-gray-200/50 w-full max-w-lg">
            <p className="text-sm text-gray-600 font-medium">
              ✨ Accede a <span className="font-bold text-gray-900">{featureName}</span> y todas las funcionalidades {requiredPlan}
            </p>
          </div>
        </div>
      </div>

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
 * Variante simplificada para usar en espacios pequeños
 */
export function LockedFeatureBadge({
  requiredPlan,
  onClick,
}: {
  requiredPlan: string;
  onClick?: () => void;
}) {
  const normalizedPlan = requiredPlan.toLowerCase().replace(/\s+/g, '');
  const planStyle = PLAN_STYLES[normalizedPlan as keyof typeof PLAN_STYLES] || PLAN_STYLES.pro;

  return (
    <Badge
      className={cn(
        'cursor-pointer gap-1.5 transition-all hover:shadow-md',
        planStyle.bgColor,
        planStyle.textColor,
        planStyle.borderColor,
        'border'
      )}
      onClick={onClick}
    >
      <Lock className="h-3 w-3" />
      {requiredPlan}
    </Badge>
  );
}
