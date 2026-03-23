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
import { useFeatureAccess, useAvailablePlans, usePlanTierLimits } from '@/hooks/useSubscription';
import { PlanSelectionModal } from '@/components/subscription/PlanSelectionModal';
import { UpgradePromptModal } from '@/components/subscription/UpgradePromptModal';
import { InviteMemberWizard } from '@/components/roles/InviteMemberWizard';
import { isPaymentsEnabled } from '@/config/features';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { currentProject } = useCurrentProject();
  const { getLimitInfo } = useFeatureAccess(currentProject?.id);
  const { tier } = usePlanTierLimits(currentProject?.id);
  const { data: availablePlans = [] } = useAvailablePlans();

  const [showInviteWizard, setShowInviteWizard] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const membersLimit = getLimitInfo('members');
  // Use PLAN_TIERS limit when payments enabled, otherwise use DB-backed limit
  const tierMemberLimit = tier.members;
  const canInvite = isPaymentsEnabled()
    ? (tierMemberLimit === -1 || membersLimit.current < tierMemberLimit)
    : (membersLimit.isUnlimited || membersLimit.current < (membersLimit.max ?? Infinity));

  const handleClick = () => {
    if (!currentProject) {
      toast.error(t('members.seleccionaUnProyectoPrimero'));
      return;
    }

    if (!canInvite) {
      setShowUpgradeModal(true);
      return;
    }

    // Abrir wizard de invitación
    setShowInviteWizard(true);
  };

  const handlePlanSelected = (planId: string, billingCycle: 'monthly' | 'yearly') => {
    console.info('[Upgrade] Plan selected:', { planId, billingCycle, context: 'members' });
    setShowUpgradeModal(false);
    toast.info(t('subscription.upgradeComingSoon'));
  };

  const handleInviteSuccess = () => {
    setShowInviteWizard(false);
    toast.success(t('members.invitaciónEnviadaExitosamente'));
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
        {children || t('members.invitarMiembro')}
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

      {/* Upgrade Modal — PLAN_TIERS aware */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={t('pricing.memberLimitTitle', { limit: tierMemberLimit === -1 ? '?' : tierMemberLimit })}
        description={t('pricing.memberLimitDesc')}
        recommendedPlan="pro"
        variant="member"
      />
    </>
  );
}
