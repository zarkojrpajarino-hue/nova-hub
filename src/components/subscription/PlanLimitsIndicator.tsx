/**
 * 📊 PLAN LIMITS INDICATOR
 *
 * Widget que muestra el uso actual vs límites del plan
 * Se puede colocar en sidebar o dashboard
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckSquare, UserPlus, Target, Zap, Crown, AlertTriangle, TrendingUp } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { PlanSelectionModal } from './PlanSelectionModal';
import { useAvailablePlans } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import { isPaymentsEnabled } from '@/config/features';

interface PlanLimitsIndicatorProps {
  projectId: string;
  compact?: boolean; // Versión compacta para sidebar
  className?: string;
}

export function PlanLimitsIndicator({
  projectId,
  compact = false,
  className,
}: PlanLimitsIndicatorProps) {
  const { plan, getLimitInfo, isTrial } = useFeatureAccess(projectId);
  const availablePlans = useAvailablePlans();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  console.log('📊 PlanLimitsIndicator:', { projectId, plan, isTrial });

  // 🎯 FEATURE FLAG: Don't show limits indicator if payments are disabled
  if (!isPaymentsEnabled()) return null;

  if (!plan) return null;

  const resources = [
    { type: 'members' as const, label: 'Miembros', icon: Users },
    { type: 'tasks' as const, label: 'Tareas', icon: CheckSquare },
    { type: 'leads' as const, label: 'Leads', icon: UserPlus },
    { type: 'obvs' as const, label: 'OBVs', icon: Target },
  ];

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handlePlanSelected = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    // TODO: Implementar upgrade en Fase 7
    console.log('Upgrade to:', planId, billingCycle);
    setShowUpgradeModal(false);
  };

  // Verificar si algún recurso está cerca del límite
  const hasWarning = resources.some(r => {
    const info = getLimitInfo(r.type);
    return !info.isUnlimited && info.percentage >= 80;
  });

  if (compact) {
    return (
      <>
        <Card className={cn('', className)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isTrial ? (
                  <Badge variant="secondary" className="text-xs">
                    Trial
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-primary">
                    {plan.display_name}
                  </Badge>
                )}
                {hasWarning && (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                )}
              </div>
              <Button
                onClick={handleUpgrade}
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            </div>

            <div className="space-y-2">
              {resources.map(({ type, label, icon: Icon }) => {
                const info = getLimitInfo(type);
                const isWarning = !info.isUnlimited && info.percentage >= 80;
                const isCritical = !info.isUnlimited && info.percentage >= 95;

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-700">{label}</span>
                      </div>
                      <span className="text-gray-600 font-medium">
                        {info.current} / {info.isUnlimited ? '∞' : info.max}
                      </span>
                    </div>
                    {!info.isUnlimited && (
                      <Progress
                        value={info.percentage}
                        className={cn(
                          'h-1.5',
                          isCritical && 'bg-red-100',
                          isWarning && !isCritical && 'bg-orange-100'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <PlanSelectionModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onSelectPlan={handlePlanSelected}
          availablePlans={availablePlans}
        />
      </>
    );
  }

  // Versión completa
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Plan Actual</CardTitle>
            {isTrial ? (
              <Badge variant="secondary">
                Trial
              </Badge>
            ) : plan.id === 'enterprise' ? (
              <Badge className="bg-amber-500">
                <Crown className="h-3 w-3 mr-1" />
                {plan.display_name}
              </Badge>
            ) : (
              <Badge className="bg-primary">
                {plan.display_name}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {resources.map(({ type, label, icon: Icon }) => {
            const info = getLimitInfo(type);
            const isWarning = !info.isUnlimited && info.percentage >= 80;
            const isCritical = !info.isUnlimited && info.percentage >= 95;

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-sm text-gray-600 font-semibold">
                    {info.current} / {info.isUnlimited ? '∞' : info.max}
                  </span>
                </div>

                {!info.isUnlimited && (
                  <>
                    <Progress
                      value={info.percentage}
                      className={cn(
                        'h-2',
                        isCritical && 'bg-red-100',
                        isWarning && !isCritical && 'bg-orange-100'
                      )}
                    />
                    {isCritical && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Límite alcanzado. Actualiza tu plan.
                      </p>
                    )}
                    {isWarning && !isCritical && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Cerca del límite ({info.percentage.toFixed(0)}%)
                      </p>
                    )}
                  </>
                )}

                {info.isUnlimited && (
                  <p className="text-xs text-green-600 font-medium">
                    ✨ Ilimitado
                  </p>
                )}
              </div>
            );
          })}

          {/* Upgrade Button */}
          <Button
            onClick={handleUpgrade}
            variant="outline"
            size="sm"
            className="w-full mt-4"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isTrial ? 'Seleccionar Plan' : 'Actualizar Plan'}
          </Button>
        </CardContent>
      </Card>

      <PlanSelectionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={handlePlanSelected}
        availablePlans={availablePlans}
      />
    </>
  );
}
