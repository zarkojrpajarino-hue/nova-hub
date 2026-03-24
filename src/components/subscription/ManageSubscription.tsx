/**
 * V5.3.12 -- ManageSubscription
 *
 * Shows current plan, usage stats, and cancel subscription button.
 * Appears as a tab inside SettingsView.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Users, Brain, FolderOpen, Calendar, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { useProjectPlan, useTrialStatus, useCurrentPlanTier } from '@/hooks/useSubscription';
import { useAICallsRemaining } from '@/hooks/useAICallCounter';
import { BillingPortalButton } from './BillingPortalButton';
import { PlanSelectionModal } from './PlanSelectionModal';
import { useAvailablePlans } from '@/hooks/useSubscription';
import { isPaymentsEnabled } from '@/config/features';
import { cn } from '@/lib/utils';

export function ManageSubscription() {
  const { t } = useTranslation();
  const { currentProject } = useCurrentProject();
  const projectId = currentProject?.id;
  const { data: subscription, isLoading } = useProjectPlan(projectId);
  const { isTrial, daysLeft } = useTrialStatus(projectId);
  const { tierKey, tier } = useCurrentPlanTier(projectId);
  const { used: aiUsed, limit: aiLimit, isUnlimited: aiUnlimited } = useAICallsRemaining(projectId);
  const availablePlans = useAvailablePlans();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!isPaymentsEnabled()) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{t('manageSubscription.paymentsDisabled')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const membersCount = subscription?.current_members_count ?? 0;
  const membersMax = tier.members === -1 ? null : tier.members;
  const projectsMax = tier.projects === -1 ? null : tier.projects;
  const aiCallsMax = tier.aiCalls === -1 ? null : tier.aiCalls;

  const statusLabel = subscription?.status === 'trial'
    ? t('manageSubscription.statusTrial')
    : subscription?.status === 'active'
    ? t('manageSubscription.statusActive')
    : subscription?.status === 'past_due'
    ? t('manageSubscription.statusPastDue')
    : subscription?.status === 'cancelled'
    ? t('manageSubscription.statusCancelled')
    : t('manageSubscription.statusFree');

  const statusColor = subscription?.status === 'active' ? 'bg-green-100 text-green-800'
    : subscription?.status === 'trial' ? 'bg-blue-100 text-blue-800'
    : subscription?.status === 'past_due' ? 'bg-amber-100 text-amber-800'
    : subscription?.status === 'cancelled' ? 'bg-red-100 text-red-800'
    : 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('manageSubscription.currentPlan')}
            </CardTitle>
            <Badge className={cn('text-xs', statusColor)}>{statusLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{tier.name}</h3>
              {tier.price > 0 && (
                <p className="text-muted-foreground text-sm">
                  ${(tier.price / 100).toFixed(0)}/{t('manageSubscription.perMonth')}
                </p>
              )}
            </div>
            <Button onClick={() => setShowUpgradeModal(true)} variant="default" size="sm">
              <Zap className="h-4 w-4 mr-1" />
              {tierKey === 'scale' ? t('manageSubscription.managePlan') : t('manageSubscription.upgradePlan')}
            </Button>
          </div>

          {isTrial && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
              <Calendar className="h-4 w-4" />
              {t('manageSubscription.trialDaysLeft', { days: daysLeft })}
            </div>
          )}

          {subscription?.current_period_end && !isTrial && (
            <p className="text-xs text-muted-foreground">
              {t('manageSubscription.renewsOn', {
                date: new Date(subscription.current_period_end).toLocaleDateString()
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('manageSubscription.usage')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Members */}
          <UsageStat
            icon={<Users className="h-4 w-4" />}
            label={t('manageSubscription.members')}
            current={membersCount}
            max={membersMax}
          />

          {/* AI Calls */}
          <UsageStat
            icon={<Brain className="h-4 w-4" />}
            label={t('manageSubscription.aiCalls')}
            current={aiUsed}
            max={aiUnlimited ? null : aiCallsMax}
          />

          {/* Projects */}
          <UsageStat
            icon={<FolderOpen className="h-4 w-4" />}
            label={t('manageSubscription.projects')}
            current={1}
            max={projectsMax}
          />
        </CardContent>
      </Card>

      {/* Billing Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('manageSubscription.billing')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <BillingPortalButton projectId={projectId} variant="outline" />

          {subscription?.stripe_subscription_id && subscription.status !== 'cancelled' && (
            <div className="pt-4 border-t">
              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
                <p>{t('manageSubscription.cancelNote')}</p>
              </div>
              <BillingPortalButton
                projectId={projectId}
                variant="ghost"
                size="sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <PlanSelectionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={(planId, billingCycle) => {
          console.info('[ManageSubscription] Plan selected:', { planId, billingCycle });
          setShowUpgradeModal(false);
        }}
        availablePlans={availablePlans}
      />
    </div>
  );
}

/** Reusable usage stat row */
function UsageStat({
  icon,
  label,
  current,
  max,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  max: number | null;
}) {
  const { t } = useTranslation();
  const percentage = max ? Math.min((current / max) * 100, 100) : 0;
  const isNearLimit = max !== null && percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        <span className={cn('text-sm font-semibold', isNearLimit && 'text-amber-600')}>
          {current} / {max === null ? t('manageSubscription.unlimited') : max}
        </span>
      </div>
      {max !== null && (
        <Progress
          value={percentage}
          className={cn('h-1.5', isNearLimit && '[&>div]:bg-amber-500')}
        />
      )}
    </div>
  );
}
