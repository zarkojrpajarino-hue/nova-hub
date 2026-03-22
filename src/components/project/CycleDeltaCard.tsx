/**
 * F31 v1 — CycleDeltaCard
 *
 * Shows 3 insights after a cycle closes:
 *   1. Execution summary — total tasks + OBVs in the cycle
 *   2. Focus distribution — promised vs actual by category
 *   3. Blind spot — category with 0 activity (if any)
 *
 * Category mapping documented:
 *   commitments.category 'team' ↔ tasks.function_type 'support'
 *   All other categories match 1:1 (demand, delivery, cash)
 *
 * Revenue is shown as context, not protagonist — no causal claims.
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart3, AlertTriangle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────

interface CycleDelta {
  cycle_id: string;
  start_date: string;
  end_date: string;
  cycle_days: number;
  tasks_total: number;
  by_category: Record<string, number>; // { demand: 5, delivery: 8, cash: 2, support: 1, unclassified: 3 }
  obvs_total: number;
  obvs_by_type: Record<string, number>; // { exploración: 2, validación: 1, venta: 1 }
  revenue_total: number;
  commitments: Array<{ text: string; category: string; measurable_target?: string }>;
  committed_distribution: Record<string, number>; // { demand: 40, delivery: 30, cash: 30 }
}

interface CycleDeltaCardProps {
  cycleId: string;
}

// ── Category config ───────────────────────────────────────────

/** Category mapping: commitments use 'team', tasks use 'support' — documented here */
const CATEGORIES = [
  { key: 'demand', taskKey: 'demand', color: 'bg-amber-500', label: 'Demand' },
  { key: 'delivery', taskKey: 'delivery', color: 'bg-blue-500', label: 'Delivery' },
  { key: 'cash', taskKey: 'cash', color: 'bg-green-500', label: 'Cash' },
  { key: 'team', taskKey: 'support', color: 'bg-purple-500', label: 'Team' },
] as const;

// ── Hook ──────────────────────────────────────────────────────

function useCycleDelta(cycleId: string) {
  return useQuery({
    queryKey: ['cycle-delta', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('compute_cycle_delta', {
        p_cycle_id: cycleId,
      });
      if (error) throw error;
      return data as unknown as CycleDelta;
    },
    enabled: !!cycleId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Sub-components ────────────────────────────────────────────

/** Insight 1: Execution summary */
function ExecutionSummary({ delta }: { delta: CycleDelta }) {
  const { t } = useTranslation();
  const tasksPerWeek = delta.cycle_days > 0
    ? (delta.tasks_total / (delta.cycle_days / 7)).toFixed(1)
    : '0';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-primary" />
        <span className="text-sm font-semibold">{t('project.ejecuciónDelCiclo')}</span>
      </div>
      <p className="text-2xl font-bold">
        {delta.tasks_total} {t('project.tareas')} · {delta.obvs_total} OBVs
      </p>
      <p className="text-xs text-muted-foreground">
        ~{tasksPerWeek} {t('project.tareasPorSemana')} · {delta.cycle_days} {t('project.días')}
      </p>
      {delta.revenue_total > 0 && (
        <p className="text-xs text-muted-foreground">
          {t('project.contextoRevenue')}: €{delta.revenue_total.toLocaleString()}
        </p>
      )}
    </div>
  );
}

/** Insight 2: Distribution — promised vs actual */
function FocusDistribution({ delta }: { delta: CycleDelta }) {
  const { t } = useTranslation();
  const hasCommitments = delta.commitments.length > 0;
  const totalTasks = delta.tasks_total || 1;

  // Compute actual distribution from tasks (mapping support→team)
  const actualDist: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    const count = delta.by_category[cat.taskKey] || 0;
    actualDist[cat.key] = Math.round((count / totalTasks) * 100);
  }
  // Include unclassified
  const unclassified = delta.by_category['unclassified'] || 0;
  if (unclassified > 0) {
    actualDist['unclassified'] = Math.round((unclassified / totalTasks) * 100);
  }

  // Find biggest overinvestment / underinvestment
  let biggestGap = { key: '', diff: 0 };
  if (hasCommitments) {
    for (const cat of CATEGORIES) {
      const promised = delta.committed_distribution[cat.key] || 0;
      const actual = actualDist[cat.key] || 0;
      const diff = actual - promised;
      if (Math.abs(diff) > Math.abs(biggestGap.diff)) {
        biggestGap = { key: cat.key, diff };
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 size={14} className="text-primary" />
        <span className="text-sm font-semibold">{t('project.dóndePusisteFoco')}</span>
      </div>

      {/* Actual distribution bar */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">{t('project.real')}</p>
        <div className="flex h-5 rounded-full overflow-hidden">
          {CATEGORIES.map(cat => {
            const pct = actualDist[cat.key] || 0;
            if (pct === 0) return null;
            return (
              <div
                key={cat.key}
                className={cn('flex items-center justify-center text-[10px] text-white font-bold', cat.color)}
                style={{ width: `${Math.max(pct, 8)}%` }}
                title={`${cat.label}: ${pct}%`}
              >
                {pct >= 15 ? `${cat.label} ${pct}%` : pct >= 8 ? `${pct}%` : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Promised distribution bar (only if commitments exist) */}
      {hasCommitments && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">{t('project.prometido')}</p>
          <div className="flex h-5 rounded-full overflow-hidden">
            {CATEGORIES.map(cat => {
              const pct = delta.committed_distribution[cat.key] || 0;
              if (pct === 0) return null;
              return (
                <div
                  key={cat.key}
                  className={cn('flex items-center justify-center text-[10px] text-white/70 font-bold opacity-50', cat.color)}
                  style={{ width: `${Math.max(pct, 8)}%` }}
                  title={`${cat.label}: ${pct}%`}
                >
                  {pct >= 15 ? `${cat.label} ${pct}%` : pct >= 8 ? `${pct}%` : ''}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interpretation line — biggest gap */}
      {hasCommitments && biggestGap.key && Math.abs(biggestGap.diff) >= 10 && (
        <p className="text-xs font-medium">
          {biggestGap.diff > 0 ? (
            <span className="text-amber-600">
              {t('project.sobreinvertisteEn')} {biggestGap.key} (+{biggestGap.diff}%)
            </span>
          ) : (
            <span className="text-red-600">
              {t('project.subinvertisteEn')} {biggestGap.key} ({biggestGap.diff}%)
            </span>
          )}
        </p>
      )}
    </div>
  );
}

/** Insight 3: Blind spot — category with 0 activity */
function BlindSpot({ delta }: { delta: CycleDelta }) {
  const { t } = useTranslation();

  // Find categories with 0 tasks
  const ignored: string[] = [];
  for (const cat of CATEGORIES) {
    const count = delta.by_category[cat.taskKey] || 0;
    const wasCommitted = (delta.committed_distribution[cat.key] || 0) > 0;
    // Show if: committed but 0 tasks, OR cash with 0 tasks (always watched)
    if (count === 0 && (wasCommitted || cat.key === 'cash')) {
      ignored.push(cat.label);
    }
  }

  if (ignored.length === 0) return null;

  return (
    <div className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
      <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-red-600">
          0 {t('project.tareasEn')} {ignored.join(', ')}
        </p>
        <p className="text-xs text-muted-foreground">
          {ignored.includes('Cash')
            ? t('project.sinActividadFinanciera')
            : t('project.categoríaSinActividad')}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export function CycleDeltaCard({ cycleId }: CycleDeltaCardProps) {
  const { t } = useTranslation();
  const { data: delta, isLoading, error } = useCycleDelta(cycleId);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-48 mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (error || !delta) return null;

  // Don't show if there's no data at all
  if (delta.tasks_total === 0 && delta.obvs_total === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <h3 className="text-base font-bold">{t('project.resumenDelCiclo')}</h3>

      <ExecutionSummary delta={delta} />
      <FocusDistribution delta={delta} />
      <BlindSpot delta={delta} />

      {/* Commitments as reference (not compared automatically) */}
      {delta.commitments.length > 0 && (
        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t('project.loQuePrometiste')}
          </p>
          <ul className="space-y-1.5">
            {delta.commitments.map((c, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className={cn(
                  'mt-1 w-2 h-2 rounded-full shrink-0',
                  CATEGORIES.find(cat => cat.key === c.category)?.color || 'bg-muted'
                )} />
                <span>{c.text}</span>
                {c.measurable_target && (
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {t('project.meta')}: {c.measurable_target}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
