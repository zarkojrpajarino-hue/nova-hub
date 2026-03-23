/**
 * PricingPage — Full pricing comparison page
 *
 * 3 columns: Starter (Free), Pro ($29/mo), Scale ($79/mo)
 * Feature comparison table, annual toggle (-20%), CTA buttons.
 * No actual Stripe checkout — logs selection, shows coming-soon toast.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Check,
  X as XIcon,
  Zap,
  Crown,
  Rocket,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_TIERS, type PlanTierKey } from '@/config/features';
import { useCurrentPlanTier } from '@/hooks/useSubscription';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { toast } from 'sonner';

interface PricingPageProps {
  /** Optional callback when a plan is selected */
  onPlanSelected?: (tierKey: PlanTierKey, billingCycle: 'monthly' | 'yearly') => void;
  /** Show as embedded (no padding) vs standalone page */
  embedded?: boolean;
}

const TIER_CONFIG: Record<PlanTierKey, {
  icon: typeof Zap;
  color: string;
  gradient: string;
  popular?: boolean;
}> = {
  free: {
    icon: Sparkles,
    color: 'text-gray-700',
    gradient: 'from-gray-100 to-gray-200',
  },
  pro: {
    icon: Crown,
    color: 'text-purple-700',
    gradient: 'from-purple-500 to-purple-700',
    popular: true,
  },
  scale: {
    icon: Rocket,
    color: 'text-blue-700',
    gradient: 'from-blue-600 to-indigo-700',
  },
};

interface FeatureRow {
  labelKey: string;
  free: string | boolean;
  pro: string | boolean;
  scale: string | boolean;
}

function getFeatureRows(t: (k: string) => string): FeatureRow[] {
  return [
    {
      labelKey: t('pricing.projects'),
      free: `${PLAN_TIERS.free.projects}`,
      pro: `${PLAN_TIERS.pro.projects}`,
      scale: t('pricing.unlimited'),
    },
    {
      labelKey: t('pricing.teamMembers'),
      free: `${PLAN_TIERS.free.members}`,
      pro: `${PLAN_TIERS.pro.members}`,
      scale: t('pricing.unlimited'),
    },
    {
      labelKey: t('pricing.aiAnalysesPerMonth'),
      free: `${PLAN_TIERS.free.aiCalls}`,
      pro: `${PLAN_TIERS.pro.aiCalls}`,
      scale: `${PLAN_TIERS.scale.aiCalls}`,
    },
    {
      labelKey: t('pricing.analyticsHistory'),
      free: t('pricing.nDays', { n: 30 }),
      pro: t('pricing.nDays', { n: 365 }),
      scale: t('pricing.unlimited'),
    },
    {
      labelKey: t('pricing.integrations'),
      free: false,
      pro: true,
      scale: true,
    },
    {
      labelKey: t('pricing.meetingIntelligence'),
      free: false,
      pro: true,
      scale: true,
    },
    {
      labelKey: t('pricing.benchmarking'),
      free: false,
      pro: false,
      scale: true,
    },
    {
      labelKey: t('pricing.apiAccess'),
      free: false,
      pro: false,
      scale: true,
    },
    {
      labelKey: t('pricing.prioritySupport'),
      free: false,
      pro: true,
      scale: true,
    },
  ];
}

export function PricingPage({ onPlanSelected, embedded = false }: PricingPageProps) {
  const { t } = useTranslation();
  const [isAnnual, setIsAnnual] = useState(false);
  const { currentProject } = useCurrentProject();
  const { tierKey: currentTierKey } = useCurrentPlanTier(currentProject?.id);

  const handleSelectPlan = (tierKey: PlanTierKey) => {
    const cycle = isAnnual ? 'yearly' : 'monthly';
    console.info('[Pricing] Plan selected:', { tierKey, cycle });

    if (onPlanSelected) {
      onPlanSelected(tierKey, cycle);
    } else {
      if (tierKey === currentTierKey) {
        toast.info(t('pricing.alreadyOnPlan'));
      } else {
        toast.success(t('pricing.planRegistered'));
      }
    }
  };

  const getPrice = (tierKey: PlanTierKey) => {
    const priceMonthly = PLAN_TIERS[tierKey].price / 100;
    if (isAnnual) {
      return Math.round(priceMonthly * 0.8); // 20% discount
    }
    return priceMonthly;
  };

  const getAnnualSavings = (tierKey: PlanTierKey) => {
    const monthly = PLAN_TIERS[tierKey].price / 100;
    return Math.round(monthly * 12 * 0.2);
  };

  const featureRows = getFeatureRows(t);

  const tierKeys: PlanTierKey[] = ['free', 'pro', 'scale'];

  return (
    <div className={cn(!embedded && 'container max-w-6xl mx-auto py-12 px-4')}>
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          {t('pricing.title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>
      </div>

      {/* Annual toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={cn('text-sm font-medium', !isAnnual && 'text-foreground', isAnnual && 'text-muted-foreground')}>
          {t('pricing.monthly')}
        </span>
        <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
        <span className={cn('text-sm font-medium', isAnnual && 'text-foreground', !isAnnual && 'text-muted-foreground')}>
          {t('pricing.annual')}
        </span>
        {isAnnual && (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
            -20%
          </Badge>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {tierKeys.map((key) => {
          const tier = PLAN_TIERS[key];
          const config = TIER_CONFIG[key];
          const Icon = config.icon;
          const price = getPrice(key);
          const isCurrent = key === currentTierKey;
          const isPopular = config.popular;

          return (
            <Card
              key={key}
              className={cn(
                'relative transition-all duration-200',
                isPopular && 'border-purple-400 border-2 shadow-xl scale-[1.02]',
                isCurrent && 'ring-2 ring-primary/30',
              )}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4">
                  {t('pricing.mostPopular')}
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className={cn(
                  'w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center',
                  key === 'free' ? 'bg-gray-100' : `bg-gradient-to-br ${config.gradient}`,
                )}>
                  <Icon className={cn('h-7 w-7', key === 'free' ? 'text-gray-600' : 'text-white')} />
                </div>
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <div className="mt-3">
                  <span className="text-4xl font-extrabold">${price}</span>
                  {price > 0 && (
                    <span className="text-muted-foreground ml-1">/{t('pricing.perMonth')}</span>
                  )}
                  {price === 0 && (
                    <span className="text-muted-foreground ml-2 text-sm">{t('pricing.forever')}</span>
                  )}
                </div>
                {isAnnual && price > 0 && (
                  <p className="text-sm text-green-600 font-semibold mt-1">
                    {t('pricing.savePerYear', { amount: getAnnualSavings(key) })}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key limits */}
                <div className="space-y-2 pb-4 border-b">
                  <LimitRow label={t('pricing.projects')} value={tier.projects === -1 ? t('pricing.unlimited') : `${tier.projects}`} />
                  <LimitRow label={t('pricing.teamMembers')} value={tier.members === -1 ? t('pricing.unlimited') : `${tier.members}`} />
                  <LimitRow label={t('pricing.aiCalls')} value={`${tier.aiCalls}/${t('pricing.month')}`} />
                </div>

                {/* Boolean features */}
                <div className="space-y-2 pb-4">
                  <BoolRow label={t('pricing.integrations')} value={tier.integrations} />
                  <BoolRow label={t('pricing.meetingIntelligence')} value={tier.meetingIntelligence} />
                  <BoolRow label={t('pricing.benchmarking')} value={tier.benchmarking} />
                  <BoolRow label={t('pricing.apiAccess')} value={tier.api} />
                </div>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectPlan(key)}
                  className={cn(
                    'w-full h-12 font-bold text-base gap-2',
                    isCurrent && 'bg-gray-200 text-gray-700 hover:bg-gray-200 cursor-default',
                    !isCurrent && key === 'pro' && 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800',
                    !isCurrent && key === 'scale' && 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800',
                    !isCurrent && key === 'free' && 'bg-gray-900 hover:bg-gray-800',
                  )}
                  disabled={isCurrent}
                >
                  {isCurrent ? (
                    <>{t('pricing.currentPlan')}</>
                  ) : (
                    <>
                      {key === 'free' ? t('pricing.downgrade') : t('pricing.upgrade')}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-6">{t('pricing.featureComparison')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground w-1/4">
                  {t('pricing.feature')}
                </th>
                {tierKeys.map((key) => (
                  <th key={key} className="text-center py-3 px-4 font-bold text-sm">
                    {PLAN_TIERS[key].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row, i) => (
                <tr key={i} className={cn('border-b', i % 2 === 0 && 'bg-muted/30')}>
                  <td className="py-3 px-4 text-sm font-medium">{row.labelKey}</td>
                  {(['free', 'pro', 'scale'] as const).map((key) => (
                    <td key={key} className="text-center py-3 px-4">
                      <CellValue value={row[key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground space-y-2">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span>{t('pricing.cancelAnytime')}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-300" />
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            <span>{t('pricing.sevenDayTrial')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {value ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <XIcon className="h-4 w-4 text-gray-300" />
      )}
    </div>
  );
}

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <XIcon className="h-5 w-5 text-gray-300 mx-auto" />
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}
