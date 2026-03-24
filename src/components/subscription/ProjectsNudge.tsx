/**
 * V4.5.6 — ProjectsNudge
 *
 * Shows when creating the 2nd project on the free plan (limit = 1).
 * Designed to be shown in the project creation flow.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderPlus, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrentPlanTier } from '@/hooks/useSubscription';
import { isPaymentsEnabled } from '@/config/features';
import { UpgradePromptModal } from './UpgradePromptModal';

interface ProjectsNudgeProps {
  /** Current number of projects the user has */
  currentProjectCount: number;
  /** The project ID used for tier resolution (any active project) */
  projectId: string | undefined;
  className?: string;
}

export function ProjectsNudge({ currentProjectCount, projectId, className }: ProjectsNudgeProps) {
  const { t } = useTranslation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { tier } = useCurrentPlanTier(projectId);

  if (!isPaymentsEnabled()) return null;

  const projectLimit = tier.projects;
  if (projectLimit === -1) return null; // Unlimited

  // Show when at limit or above
  const isAtLimit = currentProjectCount >= projectLimit;
  if (!isAtLimit) return null;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3',
          'dark:border-indigo-800 dark:bg-indigo-950/20',
          className
        )}
      >
        <div className="rounded-lg p-2 bg-indigo-100 dark:bg-indigo-900/40 shrink-0">
          <FolderPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {t('subscription.nudge.projectLimitReached', { limit: projectLimit })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('subscription.nudge.projectUpgradeHint')}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5"
          onClick={() => setShowUpgrade(true)}
        >
          <Rocket className="h-3.5 w-3.5" />
          {t('subscription.nudge.upgrade')}
        </Button>
      </div>

      <UpgradePromptModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title={t('pricing.projectLimitTitle', { limit: projectLimit })}
        description={t('pricing.projectLimitDesc', { limit: projectLimit })}
        recommendedPlan="pro"
        variant="project"
      />
    </>
  );
}
