/**
 * V4.5.6 — AICallsNudge
 *
 * Shows a warning banner when the user has used 80%+ of their AI call limit.
 * Displays usage like "16/20 AI calls used" and offers upgrade CTA.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAICallsRemaining } from '@/hooks/useAICallCounter';
import { isPaymentsEnabled } from '@/config/features';
import { UpgradePromptModal } from './UpgradePromptModal';

interface AICallsNudgeProps {
  projectId: string | undefined;
  className?: string;
  /** Compact mode for inline usage (e.g., inside AI response panels) */
  compact?: boolean;
}

export function AICallsNudge({ projectId, className, compact = false }: AICallsNudgeProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { used, limit, remaining, limitReached, isUnlimited, isLoading } = useAICallsRemaining(projectId);

  // Don't show if payments disabled, unlimited, loading, or dismissed
  if (!isPaymentsEnabled() || isUnlimited || isLoading || dismissed) return null;

  const percentage = limit > 0 ? (used / limit) * 100 : 0;

  // Show when >= 80% used
  if (percentage < 80) return null;

  const isAtLimit = limitReached;

  if (compact) {
    return (
      <>
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium',
            isAtLimit
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
            className
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {t('subscription.nudge.aiCallsUsed', { used, limit })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs underline"
            onClick={() => setShowUpgrade(true)}
          >
            {t('subscription.nudge.upgrade')}
          </Button>
        </div>

        <UpgradePromptModal
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          title={t('pricing.aiLimitReachedTitle', { used, limit })}
          description={t('pricing.aiLimitReachedDesc')}
          recommendedPlan="pro"
          variant="ai"
        />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          'relative rounded-lg border p-4',
          isAtLimit
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
            : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
          className
        )}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          aria-label={t('subscription.nudge.dismiss')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className={cn(
            'rounded-lg p-2',
            isAtLimit ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
          )}>
            <Zap className={cn(
              'h-5 w-5',
              isAtLimit ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {isAtLimit
                ? t('subscription.nudge.aiLimitReached')
                : t('subscription.nudge.aiCallsRunningLow')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('subscription.nudge.aiCallsUsed', { used, limit })}
              {' — '}
              {remaining > 0
                ? t('subscription.nudge.aiCallsRemaining', { remaining })
                : t('subscription.nudge.noCallsRemaining')}
            </p>

            <Progress
              value={Math.min(percentage, 100)}
              className={cn('h-1.5 mt-2', isAtLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500')}
            />

            <Button
              size="sm"
              className="mt-3 h-7 text-xs gap-1"
              onClick={() => setShowUpgrade(true)}
            >
              <Zap className="h-3.5 w-3.5" />
              {t('subscription.nudge.upgradeForMore')}
            </Button>
          </div>
        </div>
      </div>

      <UpgradePromptModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title={t('pricing.aiLimitReachedTitle', { used, limit })}
        description={t('pricing.aiLimitReachedDesc')}
        recommendedPlan="pro"
        variant="ai"
      />
    </>
  );
}
