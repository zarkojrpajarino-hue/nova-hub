/**
 * ⏰ TRIAL COUNTDOWN BANNER
 *
 * Banner que se muestra cuando el proyecto está en período de prueba
 * Muestra días restantes y permite upgrade
 */

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Zap, X } from 'lucide-react';
import { useTrialStatus, useAvailablePlans } from '@/hooks/useSubscription';
import { PlanSelectionModal } from './PlanSelectionModal';
import { cn } from '@/lib/utils';
import { isPaymentsEnabled } from '@/config/features';

interface TrialCountdownBannerProps {
  projectId: string;
  className?: string;
}

export function TrialCountdownBanner({ projectId, className }: TrialCountdownBannerProps) {
  const { isTrial, daysLeft, isExpiringSoon } = useTrialStatus(projectId);
  const availablePlans = useAvailablePlans();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  console.log('🔔 TrialCountdownBanner:', { projectId, isTrial, daysLeft, isExpiringSoon });

  // 🎯 FEATURE FLAG: Don't show trial banner if payments are disabled
  if (!isPaymentsEnabled()) return null;

  if (!isTrial || isDismissed) return null;

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handlePlanSelected = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    // TODO: Implementar upgrade en Fase 7
    console.log('Upgrade to:', planId, billingCycle);
    setShowUpgradeModal(false);
  };

  // Determinar variante según urgencia
  const getVariant = () => {
    if (daysLeft === 0) return 'destructive';
    if (daysLeft <= 3) return 'destructive';
    if (daysLeft <= 7) return 'default';
    return 'default';
  };

  const getMessage = () => {
    if (daysLeft === 0) {
      return {
        title: 'Tu período de prueba ha terminado',
        description: 'Actualiza ahora para recuperar acceso completo a tu proyecto',
      };
    }

    if (daysLeft === 1) {
      return {
        title: '¡Último día de prueba gratis!',
        description: 'Actualiza hoy para no perder acceso a tu proyecto mañana',
      };
    }

    if (daysLeft <= 3) {
      return {
        title: `Te quedan solo ${daysLeft} días de prueba gratis`,
        description: 'Actualiza ahora para no perder acceso a tu proyecto',
      };
    }

    if (daysLeft <= 7) {
      return {
        title: `Te quedan ${daysLeft} días de prueba gratis`,
        description: 'Actualiza cuando quieras para desbloquear todo el potencial',
      };
    }

    return {
      title: `Período de prueba: ${daysLeft} días restantes`,
      description: 'Explora todas las funcionalidades sin compromiso',
    };
  };

  const message = getMessage();
  const variant = getVariant();

  return (
    <>
      <Alert
        variant={variant}
        className={cn(
          'relative mb-6 border-l-4',
          variant === 'destructive' && 'border-l-red-500 animate-pulse',
          variant === 'default' && 'border-l-blue-500',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Clock className={cn(
              'h-5 w-5 mt-0.5',
              variant === 'destructive' ? 'text-red-600' : 'text-blue-600'
            )} />
            <AlertDescription className="flex-1">
              <p className="font-semibold text-base mb-1">
                {message.title}
              </p>
              <p className="text-sm opacity-90">
                {message.description}
              </p>
            </AlertDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpgrade}
              size="sm"
              variant={variant === 'destructive' ? 'default' : 'outline'}
              className={cn(
                variant === 'destructive' && 'bg-white text-red-600 hover:bg-gray-100'
              )}
            >
              <Zap className="h-4 w-4 mr-2" />
              Ver Planes
            </Button>

            {/* Dismiss Button - Solo si no está por expirar */}
            {daysLeft > 3 && (
              <Button
                onClick={() => setIsDismissed(true)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {daysLeft > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  variant === 'destructive' ? 'bg-red-500' : 'bg-blue-500'
                )}
                style={{ width: `${(daysLeft / 14) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {daysLeft} de 14 días restantes
            </p>
          </div>
        )}
      </Alert>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={handlePlanSelected}
        availablePlans={availablePlans}
      />
    </>
  );
}
