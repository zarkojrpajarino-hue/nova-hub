/**
 * useTrialStatus (standalone)
 *
 * Enhanced trial status hook that:
 * - Reads trial state from project_subscriptions
 * - Supports auto-start of 7-day Pro trial on first project creation
 * - Provides countdown info for header display
 * - Gracefully downgrades to Free when trial expires
 *
 * Re-exports the core useTrialStatus from useSubscription for compatibility,
 * and adds useTrialCountdown for header display.
 */

import { useMemo } from 'react';
import { useProjectPlan } from '@/hooks/useSubscription';
import { isPaymentsEnabled } from '@/config/features';

// Re-export the original for backwards compat
export { useTrialStatus } from '@/hooks/useSubscription';

export interface TrialCountdownInfo {
  /** Whether the project is currently in trial */
  isTrial: boolean;
  /** Days remaining in trial (0 = expired) */
  daysLeft: number;
  /** Whether trial is expiring soon (<=3 days) */
  isExpiringSoon: boolean;
  /** Whether trial has expired */
  isExpired: boolean;
  /** Human-readable label for the header, e.g. "Pro trial: 5 dias" */
  headerLabel: string | null;
  /** ISO string of trial end date */
  trialEndsAt: string | null;
  /** The plan name during trial */
  trialPlanName: string | null;
}

/**
 * Provides trial countdown data suitable for displaying in the header.
 * Returns null values when payments are disabled or no trial is active.
 */
export function useTrialCountdown(projectId: string | undefined): TrialCountdownInfo {
  const { data: subscription } = useProjectPlan(projectId);

  return useMemo(() => {
    const noTrial: TrialCountdownInfo = {
      isTrial: false,
      daysLeft: 0,
      isExpiringSoon: false,
      isExpired: false,
      headerLabel: null,
      trialEndsAt: null,
      trialPlanName: null,
    };

    if (!isPaymentsEnabled()) return noTrial;
    if (!subscription) return noTrial;

    // Check if trial status
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const now = new Date();
      const endsAt = new Date(subscription.trial_ends_at);
      const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const actualDays = Math.max(0, daysLeft);
      const isExpired = actualDays === 0;
      const isExpiringSoon = actualDays <= 3 && !isExpired;

      const planName = subscription.plan?.display_name || subscription.plan?.name || 'Pro';

      let headerLabel: string | null = null;
      if (isExpired) {
        headerLabel = `${planName} trial: expirado`;
      } else if (actualDays === 1) {
        headerLabel = `${planName} trial: ultimo dia`;
      } else {
        headerLabel = `${planName} trial: ${actualDays} dias`;
      }

      return {
        isTrial: true,
        daysLeft: actualDays,
        isExpiringSoon,
        isExpired,
        headerLabel,
        trialEndsAt: subscription.trial_ends_at,
        trialPlanName: planName,
      };
    }

    // Check if trial expired (status changed to expired)
    if (subscription.status === 'expired' && subscription.trial_started_at) {
      const planName = subscription.plan?.display_name || subscription.plan?.name || 'Pro';
      return {
        isTrial: false,
        daysLeft: 0,
        isExpiringSoon: false,
        isExpired: true,
        headerLabel: `${planName} trial: expirado`,
        trialEndsAt: subscription.trial_ends_at,
        trialPlanName: planName,
      };
    }

    return noTrial;
  }, [subscription]);
}
