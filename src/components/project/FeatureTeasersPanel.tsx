import { getFeatureTeasers } from '@/lib/teasers';
import {
  useProjectViabilityState,
  useClosedCyclesCount,
  useLatestWeeklyReview,
  useRitualPending,
} from '@/hooks/useNovaDataOptimized';
import { FeatureTeaserCard } from './FeatureTeaserCard';

interface FeatureTeasersPanelProps {
  projectId: string;
}

export function FeatureTeasersPanel({ projectId }: FeatureTeasersPanelProps) {
  const { data: viabilityData } = useProjectViabilityState(projectId);
  const { data: closedCount = 0 } = useClosedCyclesCount(projectId);
  const { data: latestReview } = useLatestWeeklyReview(projectId);
  const { data: ritualPending = false } = useRitualPending(projectId);

  const teasers = getFeatureTeasers({
    viabilityStatus: viabilityData?.viability_status ?? 'healthy',
    closedCyclesCount: closedCount,
    hasWeeklyReview: latestReview !== null && latestReview !== undefined,
    ritualPending,
  });

  if (teasers.length === 0) return null;

  return (
    <div className="space-y-2">
      {teasers.map((t) => (
        <FeatureTeaserCard key={t.featureId} teaser={t} />
      ))}
    </div>
  );
}
