/**
 * PI27.2 — MomentBanner
 *
 * Presentational component — receives moment as prop from DashboardView.
 * DashboardView owns the moment state (never unmounts), so it's stable.
 *
 * Celebraciones: confetti on first render.
 * Warnings/info: dismiss with X.
 */

import { useEffect, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, PartyPopper, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markMomentSeen, persistMoment } from '@/hooks/useMomentDetector';
import confetti from '@/lib/confetti';
import type { Moment } from '@/lib/moment-detector';
import { SourceBadge } from '@/components/shared/SourceBadge';

interface MomentBannerProps {
  projectId: string;
  moment: Moment;
  onDismissed: () => void;
}

export const MomentBanner = memo(function MomentBanner({ projectId, moment, onDismissed }: MomentBannerProps) {
  const { t } = useTranslation();
  const confettiFiredRef = useRef(false);

  // Fire confetti once for celebrations
  useEffect(() => {
    if (moment.severity === 'celebration' && !confettiFiredRef.current) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.3 } });
      confettiFiredRef.current = true;
    }
  }, [moment.severity]);

  const isCelebration = moment.severity === 'celebration';
  const isWarning = moment.severity === 'warning';

  const bgClass = isCelebration
    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
    : isWarning
      ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
      : 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800';

  const Icon = isCelebration ? PartyPopper : isWarning ? AlertTriangle : Info;
  const iconColor = isCelebration ? 'text-green-500' : isWarning ? 'text-amber-500' : 'text-blue-500';
  const titleColor = isCelebration
    ? 'text-green-800 dark:text-green-200'
    : isWarning
      ? 'text-amber-800 dark:text-amber-200'
      : 'text-blue-800 dark:text-blue-200';

  const handleDismiss = () => {
    const weekKey = Math.floor(Date.now() / (7 * 86_400_000));
    let key: string;
    if (moment.type === 'revenue_milestone' && moment.data?.milestone) {
      key = `revenue_milestone_${moment.data.milestone}`;
    } else if (moment.severity === 'warning' || moment.severity === 'info') {
      key = `${moment.type}_${weekKey}`;
    } else {
      key = moment.type;
    }
    markMomentSeen(projectId, key);
    persistMoment(projectId, moment);
    onDismissed();
  };

  return (
    <div className={`border-2 border-red-500 rounded-lg p-3 ${bgClass}`} style={{ outline: '3px solid red' }}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${titleColor}`}>{moment.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{moment.message}</p>
          <SourceBadge type="inferred" source={t('transparency.detectorDeMomentos')} reliability={0.5} size="sm" />
        </div>
        <Button size="sm" variant="ghost" onClick={handleDismiss} className="shrink-0 h-6 w-6 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});
