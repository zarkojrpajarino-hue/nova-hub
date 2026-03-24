/**
 * V4.5.6 — MembersNudge
 *
 * Shows when adding the 3rd member on the free plan.
 * Warns user they are at or near the member limit.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrentPlanTier, useFeatureAccess } from '@/hooks/useSubscription';
import { isPaymentsEnabled } from '@/config/features';
import { UpgradePromptModal } from './UpgradePromptModal';

interface MembersNudgeProps {
  projectId: string | undefined;
  currentMemberCount: number;
  className?: string;
}

export function MembersNudge({ projectId, currentMemberCount, className }: MembersNudgeProps) {
  const { t } = useTranslation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { tierKey, tier } = useCurrentPlanTier(projectId);
  const { isLoading } = useFeatureAccess(projectId);

  if (!isPaymentsEnabled() || isLoading) return null;

  const memberLimit = tier.members;
  if (memberLimit === -1) return null; // Unlimited

  // Show when at limit - 1 (e.g., 2 of 3) or at limit
  const isNearLimit = currentMemberCount >= memberLimit - 1;
  const isAtLimit = currentMemberCount >= memberLimit;

  if (!isNearLimit) return null;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border px-4 py-3',
          isAtLimit
            ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20'
            : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
          className
        )}
      >
        <div className={cn(
          'rounded-lg p-2 shrink-0',
          isAtLimit ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
        )}>
          <Users className={cn(
            'h-4 w-4',
            isAtLimit ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {isAtLimit
              ? t('subscription.nudge.memberLimitReached', { count: memberLimit })
              : t('subscription.nudge.memberLimitNear', { current: currentMemberCount, limit: memberLimit })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('subscription.nudge.memberUpgradeHint')}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5"
          onClick={() => setShowUpgrade(true)}
        >
          <Crown className="h-3.5 w-3.5" />
          {t('subscription.nudge.upgrade')}
        </Button>
      </div>

      <UpgradePromptModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title={t('pricing.memberLimitTitle', { limit: memberLimit })}
        description={t('pricing.memberLimitDesc', { limit: memberLimit })}
        recommendedPlan="pro"
        variant="member"
      />
    </>
  );
}
