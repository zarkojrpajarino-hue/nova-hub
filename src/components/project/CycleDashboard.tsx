/**
 * CE25.9 — CycleDashboard: vista del ciclo activo
 *
 * Muestra: título del ciclo, días restantes, score general, progreso por objetivo.
 * Si no hay ciclo activo: CTA t('project.crearNuevoCicloEstratégico').
 * Si ciclo expirado (end_date <= today): banner de revisión (CE25.7).
 * Si graduated=false pero hay ciclo: aviso de regresión (CE25.8).
 */

import { useTranslation } from 'react-i18next';
import { Sparkles, Clock, Target, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useActiveCycle, useCompleteCycle, useGenerateCycle, type CycleObjective } from '@/hooks/useStrategicCycles';
import { supabase } from '@/integrations/supabase/client';
import { CycleHistory } from './CycleHistory';
import { FounderPatternsCard } from './FounderPatternsCard';
import { CycleWeeklyPulse } from './CycleWeeklyPulse';
import { CycleComparisonChart } from './CycleComparisonChart';

interface CycleDashboardProps {
  projectId: string;
  graduated: boolean;
}

function ObjectiveProgressBar({ obj }: { obj: CycleObjective }) {
  const progress = obj.target_value > 0
    ? Math.min(100, Math.round((obj.current_value / obj.target_value) * 100))
    : 0;
  const color = progress >= 75 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium truncate max-w-[200px]">{obj.title}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {obj.current_value}/{obj.target_value} ({Math.round(obj.weight * 100)}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(2, progress)}%` }}
        />
      </div>
    </div>
  );
}

export function CycleDashboard({ projectId, graduated }: CycleDashboardProps) {
  const { t } = useTranslation();
  const { data: cycle, isLoading } = useActiveCycle(projectId);
  const completeCycle = useCompleteCycle();
  const generateCycle = useGenerateCycle();

  // [D5.2] Read accumulated progress from cycle_objective_progress
  const { data: progressData } = useQuery({
    queryKey: ['cycle-progress', cycle?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('cycle_objective_progress')
        .select('objective_id, value')
        .eq('cycle_id', cycle!.id);
      // Aggregate: sum values per objective
      const sums: Record<string, number> = {};
      for (const row of data ?? []) {
        sums[row.objective_id] = (sums[row.objective_id] ?? 0) + Number(row.value);
      }
      return sums;
    },
    enabled: !!cycle?.id,
    staleTime: 5 * 60_000,
  });

  if (isLoading) return null;

  // No active cycle → CTA to create one
  if (!cycle) {
    return (
      <div className="bg-card border rounded-lg p-6 text-center">
        <Sparkles className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-1">{t('cycles.title')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {graduated
            ? 'completedBootcamp': t('cycles.lockedMessage')}
        </p>
        {graduated && (
          <Button
            onClick={() => generateCycle.mutate({ projectId, trigger: 'graduation' })}
            disabled={generateCycle.isPending}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {generateCycle.isPending ? 'generating': t('cycles.createCycle')}
          </Button>
        )}
      </div>
    );
  }

  // Calculate days remaining
  const endDate = new Date(cycle.end_date);
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000));
  const isExpired = daysRemaining === 0;
  // [D5.2] Merge accumulated progress into objectives
  const objectives = ((cycle.objectives ?? []) as CycleObjective[]).map(obj => ({
    ...obj,
    // Use progress from cycle_objective_progress if available, otherwise fall back to JSONB value
    current_value: (progressData?.[obj.id] !== undefined) ? progressData[obj.id] : obj.current_value,
  }));
  const score = Math.round(cycle.cycle_score);

  // CE25.8 — Regresión: graduated=false pero ciclo activo
  if (!graduated && cycle.status === 'active') {
    return (
      <div className="bg-card border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-orange-700">{t('cycles.pausedRegression')}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t('cycles.pausedMessage', { title: cycle.title })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{cycle.title || `Ciclo ${cycle.cycle_index}`}</h3>
          {cycle.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{cycle.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`}>
            <Clock className="h-3.5 w-3.5" />
            {isExpired ? 'expired': t('cycles.daysRemaining', { days: daysRemaining })}
          </span>
          <span className="flex items-center gap-1 font-semibold">
            <Target className="h-3.5 w-3.5" />
            {score}%
          </span>
        </div>
      </div>

      {/* CE25.7 — Banner de revisión si expirado */}
      {isExpired && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-amber-800">{t('cycles.cycleEnded')}</p>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => completeCycle.mutate({ cycleId: cycle.id, projectId })}
              disabled={completeCycle.isPending}
            >
              {completeCycle.isPending ? 'closing': t('cycles.closeAndCreate')}
            </Button>
          </div>
        </div>
      )}

      {/* F31 Upgrade 1: Weekly pulse — micro-deltas during active cycle */}
      {cycle.status === 'active' && !isExpired && (
        <CycleWeeklyPulse
          projectId={projectId}
          cycleId={cycle.id}
          commitments={
            ((cycle as unknown as Record<string, unknown>).commitments_json as Array<{ text: string; category: string }>) ?? []
          }
          startDate={cycle.start_date}
          endDate={cycle.end_date}
        />
      )}

      {/* Objectives */}
      {objectives.length > 0 && (
        <div className="space-y-3">
          {objectives.map((obj) => (
            <ObjectiveProgressBar key={obj.id} obj={obj} />
          ))}
        </div>
      )}

      {/* CE25.10 — Historial de ciclos */}
      <CycleHistory projectId={projectId} />

      {/* F31 Bloque B — Founder patterns */}
      <FounderPatternsCard projectId={projectId} />

      {/* F31 Upgrade 3: Cycle comparison radar chart */}
      <CycleComparisonChart projectId={projectId} />

      {/* Complete CTA if score >= 75 and not expired */}
      {!isExpired && score >= 75 && (
        <Button
          size="sm"
          className="w-full"
          onClick={() => completeCycle.mutate({ cycleId: cycle.id, projectId })}
          disabled={completeCycle.isPending}
        >
          {completeCycle.isPending ? 'completing': t('cycles.completeAndNext')}
        </Button>
      )}
    </div>
  );
}
