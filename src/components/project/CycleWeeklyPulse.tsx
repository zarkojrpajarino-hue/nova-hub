/**
 * F31 Upgrade 1 — CycleWeeklyPulse
 *
 * Mini-widget shown DURING an active cycle (not at close).
 * Shows weekly progress by category vs commitments distribution.
 * Warns if a committed category has 0 activity after 50% of cycle.
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────

interface CommitmentItem {
  text: string;
  category: string;
}

interface WeeklyPulseData {
  week_number: number;
  total_weeks: number;
  by_category: Record<string, number>;
  committed_categories: string[];
  at_risk_categories: string[];
}

interface CycleWeeklyPulseProps {
  projectId: string;
  cycleId: string;
  commitments: CommitmentItem[];
  startDate: string;
  endDate: string;
}

// ── Category config ───────────────────────────────────────────

const CATEGORIES = [
  { key: 'demand', taskKey: 'demand', color: 'bg-amber-500', textColor: 'text-amber-600' },
  { key: 'delivery', taskKey: 'delivery', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { key: 'cash', taskKey: 'cash', color: 'bg-green-500', textColor: 'text-green-600' },
  { key: 'team', taskKey: 'support', color: 'bg-purple-500', textColor: 'text-purple-600' },
] as const;

// ── Hook ──────────────────────────────────────────────────────

function useWeeklyPulse(cycleId: string) {
  return useQuery({
    queryKey: ['cycle-weekly-pulse', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('compute_cycle_weekly_pulse', {
        p_cycle_id: cycleId,
      });
      if (error) throw error;
      return data as unknown as WeeklyPulseData;
    },
    enabled: !!cycleId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Main component ────────────────────────────────────────────

export function CycleWeeklyPulse({
  projectId: _projectId,
  cycleId,
  commitments,
  startDate,
  endDate,
}: CycleWeeklyPulseProps) {
  const { t } = useTranslation();
  const { data: pulse, isLoading } = useWeeklyPulse(cycleId);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-3 bg-muted rounded w-32 mb-2" />
        <div className="h-8 bg-muted rounded" />
      </div>
    );
  }

  if (!pulse) return null;

  const progressPct = pulse.total_weeks > 0
    ? Math.round((pulse.week_number / pulse.total_weeks) * 100)
    : 0;
  const pastHalf = pulse.week_number > pulse.total_weeks / 2;

  // Compute committed category labels
  const committedSet = new Set(commitments.map(c => c.category));

  // Format date range
  const startFormatted = new Date(startDate).toLocaleDateString('es', { month: 'short' });
  const endFormatted = new Date(endDate).toLocaleDateString('es', { month: 'short' });

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          <span className="text-sm font-semibold">
            {t('project.pulsoSemanal')}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('project.semanaDeCiclo', {
            week: pulse.week_number,
            total: pulse.total_weeks,
          })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.max(2, progressPct)}%` }}
        />
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map(cat => {
          const count = pulse.by_category[cat.taskKey] || 0;
          const isCommitted = committedSet.has(cat.key);
          const isAtRisk = pulse.at_risk_categories.includes(cat.key);

          return (
            <div
              key={cat.key}
              className={cn(
                'text-center p-2 rounded-lg border',
                isAtRisk ? 'border-amber-500/40 bg-amber-500/5' : 'border-border',
              )}
            >
              <p className="text-lg font-bold tabular-nums">{count}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {cat.key}
              </p>
              {isCommitted && (
                <div className={cn('mt-1 h-1 rounded-full', cat.color, 'opacity-50')} />
              )}
            </div>
          );
        })}
      </div>

      {/* At-risk warnings */}
      {pastHalf && pulse.at_risk_categories.length > 0 && (
        <div className="space-y-1.5">
          {pulse.at_risk_categories.map(cat => (
            <div
              key={cat}
              className="flex items-start gap-2 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg"
            >
              <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                {t('project.pulsoAlertaSinActividad', { category: cat })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Period indicator */}
      <p className="text-[10px] text-muted-foreground text-center">
        {startFormatted} — {endFormatted} · {progressPct}% {t('project.pulsoCompletado')}
      </p>
    </div>
  );
}
