/**
 * UpgradePromptModal
 *
 * Reusable modal for upgrade prompts at key moments.
 * Shows a context-specific message + CTA to view plans.
 * Used by: AI call limit, integration limit, member limit, project limit, analysis level.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ArrowRight, Crown, Rocket, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PricingPage } from './PricingPage';
import type { PlanTierKey } from '@/config/features';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The context-specific title, e.g. "Has usado 10/10 analisis este mes" */
  title: string;
  /** The context-specific description */
  description: string;
  /** Which plan to recommend */
  recommendedPlan?: PlanTierKey;
  /** Optional: show as inline pricing vs simple prompt */
  showPricing?: boolean;
  /** Icon variant */
  variant?: 'ai' | 'integration' | 'member' | 'project' | 'analysis';
}

const VARIANT_CONFIG = {
  ai: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
  integration: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
  member: { icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100' },
  project: { icon: Rocket, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  analysis: { icon: Zap, color: 'text-green-600', bg: 'bg-green-100' },
};

export function UpgradePromptModal({
  isOpen,
  onClose,
  title,
  description,
  recommendedPlan = 'pro',
  showPricing = false,
  variant = 'ai',
}: UpgradePromptModalProps) {
  const { t } = useTranslation();
  const [showFullPricing, setShowFullPricing] = useState(showPricing);

  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const handlePlanSelected = (tierKey: PlanTierKey, _cycle: 'monthly' | 'yearly') => {
    console.info('[UpgradePrompt] Plan selected:', { tierKey, variant });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(showFullPricing ? 'max-w-6xl max-h-[90vh] overflow-y-auto' : 'max-w-md')}>
        {!showFullPricing ? (
          <>
            <DialogHeader className="text-center">
              <div className={cn('w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center', config.bg)}>
                <Icon className={cn('h-8 w-8', config.color)} />
              </div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                {description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-6">
              <Button
                onClick={() => setShowFullPricing(true)}
                className="w-full h-12 font-bold text-base gap-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
              >
                <Zap className="h-5 w-5" />
                {t('pricing.viewPlans')}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                {t('pricing.maybeLater')}
              </Button>

              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-2">
                <Badge variant="outline" className="text-xs">
                  {t('pricing.sevenDayTrial')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {t('pricing.cancelAnytime')}
                </Badge>
              </div>
            </div>
          </>
        ) : (
          <PricingPage onPlanSelected={handlePlanSelected} embedded />
        )}
      </DialogContent>
    </Dialog>
  );
}
