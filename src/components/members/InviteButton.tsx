/**
 * 👥 INVITE BUTTON
 *
 * Botón para invitar miembros con validación de límites del plan
 * Abre InviteMemberWizard si hay espacio disponible
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Lock } from 'lucide-react';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { useFeatureAccess, useAvailablePlans } from '@/hooks/useSubscription';
import { PlanSelectionModal } from '@/components/subscription/PlanSelectionModal';
import { InviteMemberWizard } from '@/components/roles/InviteMemberWizard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InviteButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function InviteButton({
  variant = 'default',
  size = 'default',
  className,
  children,
  onSuccess,
}: InviteButtonProps) {
  const { currentProject } = useCurrentProject();
  const { getLimitInfo } = useFeatureAccess(currentProject?.id);
  const { data: availablePlans = [] } = useAvailablePlans();

  const [showInviteWizard, setShowInviteWizard] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const membersLimit = getLimitInfo('members');
  const canInvite = membersLimit.isUnlimited || membersLimit.current < membersLimit.max;

  const handleClick = () => {
    if (!currentProject) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    if (!canInvite) {
      toast.error(`Has alcanzado el límite de ${membersLimit.max} miembros en tu plan actual`);
      setShowUpgradeModal(true);
      return;
    }

    // Abrir wizard de invitación
    setShowInviteWizard(true);
  };

  const handlePlanSelected = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    // TODO: Implementar upgrade en Fase 7
    console.log('Upgrade to:', planId, billingCycle);
    setShowUpgradeModal(false);
    toast.success('¡Plan actualizado! Ya puedes invitar más miembros.');
  };

  const handleInviteSuccess = () => {
    setShowInviteWizard(false);
    toast.success('Invitación enviada exitosamente');
    onSuccess?.();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={cn(
          !canInvite && 'opacity-75',
          className
        )}
      >
        {!canInvite ? (
          <Lock className="h-4 w-4 mr-2" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        )}
        {children || 'Invitar Miembro'}
      </Button>

      {/* Invite Wizard */}
      {currentProject && (
        <InviteMemberWizard
          isOpen={showInviteWizard}
          onClose={() => setShowInviteWizard(false)}
          projectId={currentProject.id}
          onSuccess={handleInviteSuccess}
        />
      )}

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
