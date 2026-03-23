/**
 * F31 Upgrade 3 — CycleComparisonChart
 *
 * Recharts RadarChart showing up to 3 cycles overlaid.
 * Axes: demand, delivery, cash, team (4 axes).
 * Two layers per cycle: committed (dashed) vs actual (solid).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ─────────────────────────────────────────────────────

interface CycleDelta {
  cycle_id: string;
  start_date: string;
  end_date: string;
  tasks_total: number;
  by_category: Record<string, number>;
  committed_distribution: Record<string, number>;
}

interface CycleComparisonChartProps {
  projectId: string;
}

// ── Config ────────────────────────────────────────────────────

const AXES = [
  { key: 'demand', taskKey: 'demand' },
  { key: 'delivery', taskKey: 'delivery' },
  { key: 'cash', taskKey: 'cash' },
  { key: 'team', taskKey: 'support' },
] as const;

const CYCLE_COLORS = [
  { actual: '#f59e0b', committed: '#fbbf24' },  // amber
  { actual: '#3b82f6', committed: '#93c5fd' },  // blue
  { actual: '#10b981', committed: '#6ee7b7' },  // green
];

// ── Hook ──────────────────────────────────────────────────────

function useCycleComparison(projectId: string) {
  return useQuery({
    queryKey: ['cycle-comparison', projectId],
    queryFn: async () => {
      // Get last 3 completed/revised cycles
      const { data: cycles, error: cyclesErr } = await supabase
        .from('strategic_cycles')
        .select('id, cycle_index, start_date, end_date, commitments_json')
        .eq('project_id', projectId)
        .in('status', ['completed', 'revised'])
        .order('cycle_index', { ascending: false })
        .limit(3);

      if (cyclesErr) throw cyclesErr;
      if (!cycles || cycles.length === 0) return null;

      // Compute delta for each cycle in parallel
      const deltas = await Promise.all(
        cycles.map(async (c) => {
          const { data, error } = await supabase.rpc('compute_cycle_delta', {
            p_cycle_id: c.id,
          });
          if (error) return null;
          return {
            ...((data as unknown) as CycleDelta),
            cycle_index: c.cycle_index,
            start_date: c.start_date,
            end_date: c.end_date,
          };
        })
      );

      // Filter out nulls, reverse to chronological order
      return deltas
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .reverse();
    },
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000,
  });
}

// ── Main component ────────────────────────────────────────────

export function CycleComparisonChart({ projectId }: CycleComparisonChartProps) {
  const { t } = useTranslation();
  const { data: cycles, isLoading } = useCycleComparison(projectId);

  const chartData = useMemo(() => {
    if (!cycles || cycles.length === 0) return null;

    // Normalize: for each axis, compute pct of total tasks in that cycle
    return AXES.map(axis => {
      const point: Record<string, string | number> = {
        axis: axis.key.charAt(0).toUpperCase() + axis.key.slice(1),
      };

      cycles.forEach((cycle, idx) => {
        const totalTasks = cycle.tasks_total || 1;
        const taskCount = cycle.by_category[axis.taskKey] || 0;
        const actualPct = Math.round((taskCount / totalTasks) * 100);
        const committedPct = cycle.committed_distribution?.[axis.key] || 0;

        point[`actual_${idx}`] = actualPct;
        point[`committed_${idx}`] = committedPct;
      });

      return point;
    });
  }, [cycles]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-48 mb-4" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  if (!chartData || !cycles || cycles.length === 0) return null;

  // Build cycle labels for legend
  const formatCycleLabel = (cycle: NonNullable<typeof cycles>[number]) => {
    const start = new Date(cycle.start_date).toLocaleDateString('es', { month: 'short' });
    const end = new Date(cycle.end_date).toLocaleDateString('es', { month: 'short' });
    return `${t('project.ciclo')} ${cycle.cycle_index} (${start}-${end})`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-primary" />
        <h3 className="text-base font-bold">{t('project.comparaciónDeCiclos')}</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        {cycles.length === 1
          ? t('project.radarUnCiclo')
          : t('project.radarMultipleCiclos', { count: cycles.length })}
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickCount={5}
          />

          {cycles.map((cycle, idx) => (
            <Radar
              key={`committed-${idx}`}
              name={`${formatCycleLabel(cycle)} (${t('project.prometido')})`}
              dataKey={`committed_${idx}`}
              stroke={CYCLE_COLORS[idx % 3].committed}
              fill={CYCLE_COLORS[idx % 3].committed}
              fillOpacity={0.05}
              strokeDasharray="5 5"
              strokeWidth={1.5}
            />
          ))}

          {cycles.map((cycle, idx) => (
            <Radar
              key={`actual-${idx}`}
              name={`${formatCycleLabel(cycle)} (${t('project.real')})`}
              dataKey={`actual_${idx}`}
              stroke={CYCLE_COLORS[idx % 3].actual}
              fill={CYCLE_COLORS[idx % 3].actual}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}

          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Tooltip
            formatter={(value: number) => `${value}%`}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
