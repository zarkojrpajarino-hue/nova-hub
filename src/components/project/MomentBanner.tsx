/**
 * PI27.2 — MomentBanner
 *
 * Muestra el momento más importante detectado.
 * Celebraciones: confetti + dismiss.
 * Warnings: banner persistente con CTA.
 *
 * Persists active moment in sessionStorage so it survives
 * component unmount/remount cycles.
 */

import { useEffect, useState, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, PartyPopper, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMomentDetector, markMomentSeen, persistMoment } from '@/hooks/useMomentDetector';
import confetti from '@/lib/confetti';
import type { Moment } from '@/lib/moment-detector';
import { SourceBadge } from '@/components/shared/SourceBadge';

const SESSION_KEY_PREFIX = 'moment_banner_active_';

interface MomentBannerProps {
  projectId: string;
}

function BannerContent({ moment, onDismiss, projectId }: { moment: Moment; onDismiss: () => void; projectId: string }) {
  const { t } = useTranslation();
  const isCelebration = moment.severity === 'celebration';
  const isWarning = moment.severity === 'warning';

  const bgClass = isCelebration
    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
    : isWarning
      ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
      : 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800';

  const Icon = isCelebration ? PartyPopper : isWarning ? AlertTriangle : Info;
  const iconColor = isCelebration ? 'text-green-500' : isWarning ? 'text-amber-500' : 'text-blue-500';
  const titleColor = isCelebration ? 'text-green-800 dark:text-green-200' : isWarning ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200';

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
    // Clear session cache on dismiss
    try { sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${projectId}`); } catch { /* */ }
    onDismiss();
  };

  return (
    <div className={`border rounded-lg p-3 ${bgClass} animate-fade-in`}>
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
}

export const MomentBanner = memo(function MomentBanner({ projectId }: MomentBannerProps) {
  const { topMoment } = useMomentDetector(projectId);
  const [dismissed, setDismissed] = useState(false);
  const confettiFiredRef = useRef(false);

  // Read from sessionStorage on mount (survives unmount/remount)
  const [activeMoment, setActiveMoment] = useState<Moment | null>(() => {
    try {
      const cached = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${projectId}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Capture first valid moment — persist to sessionStorage
  useEffect(() => {
    if (topMoment && !activeMoment && !dismissed) {
      setActiveMoment(topMoment);
      try {
        sessionStorage.setItem(`${SESSION_KEY_PREFIX}${projectId}`, JSON.stringify(topMoment));
      } catch { /* quota exceeded — non-critical */ }
    }
  }, [topMoment, activeMoment, dismissed, projectId]);

  // Fire confetti once per session (ref survives re-renders, sessionStorage survives remounts)
  useEffect(() => {
    if (activeMoment?.severity === 'celebration' && !confettiFiredRef.current) {
      const firedKey = `moment_confetti_fired_${projectId}`;
      if (!sessionStorage.getItem(firedKey)) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.3 } });
        sessionStorage.setItem(firedKey, '1');
      }
      confettiFiredRef.current = true;
    }
  }, [activeMoment, projectId]);

  if (!activeMoment || dismissed) return null;

  return (
    <BannerContent
      moment={activeMoment}
      onDismiss={() => {
        persistMoment(projectId, activeMoment);
        setDismissed(true);
      }}
      projectId={projectId}
    />
  );
});
