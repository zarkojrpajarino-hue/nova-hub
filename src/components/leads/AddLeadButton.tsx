/**
 * 🎯 ADD LEAD BUTTON
 *
 * Botón para añadir leads con validación de límites del plan
 * Muestra modal de upgrade si se alcanzó el límite
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Lock } from 'lucide-react';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { useFeatureAccess, useAvailablePlans } from '@/hooks/useSubscription';
import { PlanSelectionModal } from '@/components/subscription/PlanSelectionModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
interface AddLeadButtonProps {
  onAddLead?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function AddLeadButton({
  onAddLead,
  variant = 'default',
  size = 'default',
  className,
  children,
}: AddLeadButtonProps) {
  const { t } = useTranslation();
  const { currentProject } = useCurrentProject();
  const { getLimitInfo } = useFeatureAccess(currentProject?.id);
  const { data: availablePlans = [] } = useAvailablePlans();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const leadsLimit = getLimitInfo('leads');
  const canAdd = leadsLimit.isUnlimited || leadsLimit.current < leadsLimit.max;

  const handleClick = () => {
    if (!currentProject) {
      toast.error(t('leads.seleccionaUnProyectoPrimero'));
      return;
    }

    if (!canAdd) {
      toast.error(`Has alcanzado el límite de ${leadsLimit.max} leads en tu plan actual`);
      setShowUpgradeModal(true);
      return;
    }

    // Llamar al callback para abrir modal de añadir lead
    onAddLead?.();
  };

  const handlePlanSelected = (_planId: string, _billingCycle: 'monthly' | 'yearly') => {
    // TODO: Implementar upgrade en Fase 7
    setShowUpgradeModal(false);
    toast.success(t('leads.planActualizadoYaPuedes'));
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={cn(
          !canAdd && 'opacity-75',
          className
        )}
      >
        {!canAdd ? (
          <Lock className="h-4 w-4 mr-2" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        {children || t('leads.nuevoLead')}
      </Button>

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
