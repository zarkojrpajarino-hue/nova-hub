/**
 * 💳 PLAN SELECTION MODAL
 *
 * Modal para seleccionar plan ANTES de crear proyecto
 * Muestra Free Trial solo si el usuario no lo ha usado
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Building2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/hooks/useSubscription';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
  availablePlans: SubscriptionPlan[];
}

export function PlanSelectionModal({
  isOpen,
  onClose,
  onSelectPlan,
  availablePlans,
}: PlanSelectionModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (planId: string) => {
    onSelectPlan(planId, billingCycle);
  };

  const getPlanIcon = (planId: string) => {
    const icons = {
      free_trial: Sparkles,
      starter: Zap,
      pro: Crown,
      enterprise: Building2,
    };
    return icons[planId as keyof typeof icons] || Zap;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl text-center mb-2">
            Elige el plan perfecto para tu proyecto
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Cada proyecto tiene su propio plan. Puedes cambiar o cancelar en cualquier momento.
          </DialogDescription>
        </DialogHeader>

        {/* Billing Cycle Toggle (Solo mostrar si hay planes de pago) */}
        {availablePlans.some(p => p.id !== 'free_trial') && (
          <div className="flex justify-center gap-2 my-6">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              onClick={() => setBillingCycle('monthly')}
              size="sm"
            >
              Mensual
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'outline'}
              onClick={() => setBillingCycle('yearly')}
              size="sm"
            >
              Anual
              <Badge className="ml-2 bg-green-500 hover:bg-green-600">
                -20%
              </Badge>
            </Button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availablePlans.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const price = billingCycle === 'monthly'
              ? plan.price_monthly_eur
              : plan.price_yearly_eur / 12;

            const isTrial = plan.id === 'free_trial';
            const isRecommended = plan.recommended;

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative border rounded-xl p-6 transition-all',
                  isRecommended && 'border-primary border-2 shadow-xl scale-105',
                  !isRecommended && 'hover:shadow-lg hover:border-gray-400'
                )}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    ⭐ Recomendado
                  </Badge>
                )}

                {/* Popular Badge */}
                {plan.popular && !isRecommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                    🔥 Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="font-bold text-xl mb-2">{plan.display_name}</h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 min-h-[60px]">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-4xl font-bold">€{price.toFixed(0)}</span>
                    <span className="text-gray-600">/mes</span>
                  </div>

                  {isTrial && (
                    <p className="text-sm text-primary font-semibold">
                      {plan.trial_days} días gratis
                    </p>
                  )}

                  {billingCycle === 'yearly' && !isTrial && (
                    <p className="text-sm text-green-600 font-semibold">
                      Ahorras €{((plan.price_monthly_eur * 12) - plan.price_yearly_eur).toFixed(2)}/año
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  <FeatureItem
                    included={true}
                    text={plan.max_members === null ? 'Miembros ilimitados' : `Hasta ${plan.max_members} miembros`}
                  />
                  <FeatureItem
                    included={true}
                    text={plan.max_tasks === null ? 'Tareas ilimitadas' : `Hasta ${plan.max_tasks} tareas`}
                  />
                  <FeatureItem
                    included={plan.ai_role_generation}
                    text="Generación IA de roles"
                  />
                  <FeatureItem
                    included={plan.ai_task_generation}
                    text="Generación IA de tareas"
                  />
                  <FeatureItem
                    included={plan.ai_logo_generation}
                    text="Generación IA de logo"
                  />
                  <FeatureItem
                    included={plan.advanced_analytics}
                    text="Analíticas avanzadas"
                  />
                  <FeatureItem
                    included={plan.api_access}
                    text="Acceso a API"
                  />
                  <FeatureItem
                    included={plan.priority_support}
                    text="Soporte prioritario"
                  />
                  {plan.white_label && (
                    <FeatureItem
                      included={true}
                      text="White Label"
                    />
                  )}
                </ul>

                {/* Action Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={cn(
                    'w-full',
                    isRecommended && 'bg-primary hover:bg-primary/90',
                    !isRecommended && 'bg-gray-900 hover:bg-gray-800'
                  )}
                >
                  {isTrial ? 'Comenzar Gratis' : 'Seleccionar Plan'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>✨ Sin compromiso. Cancela cuando quieras.</p>
          {availablePlans.some(p => p.id === 'free_trial') && (
            <p className="mt-1">
              🎁 El Free Trial es <strong>solo 1 vez por cuenta</strong>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureItem({ included, text }: { included: boolean; text: string }) {
  if (!included) {
    return (
      <li className="flex items-start gap-2 text-gray-400">
        <span className="text-gray-300 mt-0.5">×</span>
        <span className="text-sm line-through">{text}</span>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2">
      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
      <span className="text-sm">{text}</span>
    </li>
  );
}
