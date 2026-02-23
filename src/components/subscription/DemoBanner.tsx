/**
 * 📊 DEMO BANNER
 *
 * Banner que se muestra en vistas premium cuando el usuario no tiene acceso.
 * Informa que está viendo datos demo y motiva upgrade.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, ArrowRight, Lock, Info } from 'lucide-react';
import { PlanSelectionModal } from './PlanSelectionModal';
import { useAvailablePlans } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import { isPaymentsEnabled, shouldShowUpgradeHints } from '@/config/features';

interface DemoBannerProps {
  featureName: string;
  requiredPlan: 'starter' | 'pro' | 'advanced' | 'enterprise';
  description?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

const PLAN_COLORS = {
  starter: 'from-blue-500 to-blue-600',
  pro: 'from-purple-500 to-purple-600',
  advanced: 'from-amber-500 to-amber-600',
  enterprise: 'from-slate-700 to-slate-900',
};

export function DemoBanner({
  featureName,
  requiredPlan,
  description,
  variant = 'default',
  className,
}: DemoBannerProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const availablePlans = useAvailablePlans();

  // 🎯 FEATURE FLAG: Don't show demo banner if payments are disabled
  // or if upgrade hints are explicitly disabled
  if (!isPaymentsEnabled() || !shouldShowUpgradeHints()) {
    return null;
  }

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handlePlanSelected = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    // TODO: Implementar upgrade en Fase 7
    setShowUpgradeModal(false);
  };

  if (variant === 'compact') {
    return (
      <>
        <div
          className={cn(
            'sticky top-0 z-50 border-b bg-gradient-to-r shadow-lg backdrop-blur-md',
            `${PLAN_COLORS[requiredPlan]}`,
            className
          )}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-white">
                  <div className="p-1 bg-white/20 rounded-md">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold">
                    Vista Preview con Datos Demo
                  </p>
                </div>
                <div className="hidden sm:block w-px h-5 bg-white/30" />
                <p className="hidden sm:block text-sm text-white/95 font-medium">
                  Para aplicar a tu empresa con datos reales personalizados, mejora tu plan
                </p>
              </div>
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="bg-white hover:bg-white/90 text-purple-600 gap-2 font-bold shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <Lock className="h-3.5 w-3.5" />
                Ver Planes
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
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

  // Default variant - más grande y llamativo
  return (
    <>
      <Alert
        className={cn(
          'sticky top-0 z-40 border-2 shadow-lg backdrop-blur-sm',
          'bg-gradient-to-r from-amber-50 to-orange-50',
          'border-amber-200',
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Estás viendo datos demo
                </h3>
                <AlertDescription className="text-sm text-amber-800 mt-1">
                  {description || `Esta es una preview de ${featureName}. Para aplicar estos análisis a tu empresa con datos reales personalizados, mejora tu plan.`}
                </AlertDescription>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <Button
                onClick={handleUpgrade}
                size="sm"
                className={cn(
                  'bg-gradient-to-r text-white shadow-md hover:shadow-lg transition-all gap-2 font-semibold',
                  `${PLAN_COLORS[requiredPlan]}`
                )}
              >
                <Lock className="h-4 w-4" />
                Desbloquear {requiredPlan}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-xs text-amber-700">
                14 días gratis · Cancela cuando quieras
              </p>
            </div>
          </div>
        </div>
      </Alert>

      <PlanSelectionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={handlePlanSelected}
        availablePlans={availablePlans}
      />
    </>
  );
}
