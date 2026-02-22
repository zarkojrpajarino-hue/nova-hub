/**
 * ✅ CREATE TASK BUTTON
 *
 * Botón para crear tareas con validación de límites del plan
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

interface CreateTaskButtonProps {
  onCreateTask?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function CreateTaskButton({
  onCreateTask,
  variant = 'default',
  size = 'default',
  className,
  children,
}: CreateTaskButtonProps) {
  const { currentProject } = useCurrentProject();
  const { getLimitInfo } = useFeatureAccess(currentProject?.id);
  const { data: availablePlans = [] } = useAvailablePlans();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const tasksLimit = getLimitInfo('tasks');
  const canCreate = tasksLimit.isUnlimited || tasksLimit.current < tasksLimit.max;

  const handleClick = () => {
    if (!currentProject) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    if (!canCreate) {
      toast.error(`Has alcanzado el límite de ${tasksLimit.max} tareas en tu plan actual`);
      setShowUpgradeModal(true);
      return;
    }

    // Llamar al callback para abrir modal de crear tarea
    onCreateTask?.();
  };

  const handlePlanSelected = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    // TODO: Implementar upgrade en Fase 7
    console.log('Upgrade to:', planId, billingCycle);
    setShowUpgradeModal(false);
    toast.success('¡Plan actualizado! Ya puedes crear más tareas.');
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={cn(
          !canCreate && 'opacity-75',
          className
        )}
      >
        {!canCreate ? (
          <Lock className="h-4 w-4 mr-2" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        {children || 'Nueva Tarea'}
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
