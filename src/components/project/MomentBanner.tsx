/**
 * PI27.2 — MomentBanner
 *
 * Muestra el momento más importante detectado.
 * Celebraciones: confetti + dismiss.
 * Warnings: banner persistente con CTA.
 */

import { useEffect, useState, memo } from 'react';
import { X, PartyPopper, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMomentDetector, markMomentSeen, persistMoment } from '@/hooks/useMomentDetector';
import confetti from '@/lib/confetti';
import type { Moment } from '@/lib/moment-detector';
import { SourceBadge } from '@/components/shared/SourceBadge';

interface MomentBannerProps {
  projectId: string;
}

function BannerContent({ moment, onDismiss, projectId }: { moment: Moment; onDismiss: () => void; projectId: string }) {
  const isCelebration = moment.severity === 'celebration';
  const isWarning = moment.severity === 'warning';

  const bgClass = isCelebration
    ? 'bg-green-50 border-green-200'
    : isWarning
      ? 'bg-amber-50 border-amber-200'
      : 'bg-blue-50 border-blue-200';

  const Icon = isCelebration ? PartyPopper : isWarning ? AlertTriangle : Info;
  const iconColor = isCelebration ? 'text-green-500' : isWarning ? 'text-amber-500' : 'text-blue-500';
  const titleColor = isCelebration ? 'text-green-800' : isWarning ? 'text-amber-800' : 'text-blue-800';

  const handleDismiss = () => {
    // For revenue milestones, mark the specific milestone (e.g., revenue_milestone_1000)
    // For other moments, mark the type
    const weekKey = Math.floor(Date.now() / (7 * 86_400_000));
    let key: string;
    if (moment.type === 'revenue_milestone' && moment.data?.milestone) {
      key = `revenue_milestone_${moment.data.milestone}`;
    } else if (moment.severity === 'warning' || moment.severity === 'info') {
      key = `${moment.type}_${weekKey}`;  // Weekly cooldown for warnings
    } else {
      key = moment.type;  // One-time for celebrations
    }
    markMomentSeen(projectId, key);
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
  const [confettiFired, setConfettiFired] = useState(false);
  // Sticky moment: once captured, doesn't disappear when hook recalculates
  const [stickyMoment, setStickyMoment] = useState<typeof topMoment>(null);

  // Capture first valid moment — don't let it disappear on re-render
  useEffect(() => {
    if (topMoment && !stickyMoment && !dismissed) {
      setStickyMoment(topMoment);
    }
  }, [topMoment, stickyMoment, dismissed]);

  // Fire confetti for celebrations
  useEffect(() => {
    if (stickyMoment?.severity === 'celebration' && !confettiFired) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.3 } });
      setConfettiFired(true);
    }
  }, [stickyMoment, confettiFired]);

  const activeMoment = stickyMoment;
  if (!activeMoment || dismissed) return null;

  return (
    <BannerContent
      moment={activeMoment}
      onDismiss={() => {
        if (activeMoment && projectId) persistMoment(projectId, activeMoment);
        setDismissed(true);
      }}
      projectId={projectId}
    />
  );
});
