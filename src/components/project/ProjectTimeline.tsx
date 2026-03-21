/**
 * A12.1 — ProjectTimeline — timeline unificado del proyecto
 *
 * Unifica: phase transitions + decision events + cycle history + milestones.
 * Usa datos de project_phase_history, decision_events, strategic_cycles.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, ArrowRight, Flag, Sparkles, Calendar, Loader2 } from 'lucide-react';
import { PHASE_LABELS } from '@/lib/engine';

interface TimelineEvent {
  id: string;
  type: 'phase_change' | 'decision' | 'cycle' | 'milestone';
  title: string;
  description: string;
  date: string;
  icon: 'phase' | 'decision' | 'cycle' | 'milestone';
}

function useProjectTimeline(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-timeline', projectId],
    queryFn: async (): Promise<TimelineEvent[]> => {
      const [phaseResult, decisionResult, cycleResult] = await Promise.all([
        supabase
          .from('project_phase_history')
          .select('id, phase, phase_score, change_reason, calculated_at')
          .eq('project_id', projectId!)
          .not('change_reason', 'is', null)
          .order('calculated_at', { ascending: false })
          .limit(20),
        supabase
          .from('decision_events')
          .select('id, title, description, decision_category, decided_at')
          .eq('project_id', projectId!)
          .order('decided_at', { ascending: false })
          .limit(20),
        supabase
          .from('strategic_cycles')
          .select('id, cycle_index, title, status, start_date, end_date, cycle_score')
          .eq('project_id', projectId!)
          .order('cycle_index', { ascending: false })
          .limit(10),
      ]);

      const events: TimelineEvent[] = [];

      // Phase changes
      for (const ph of phaseResult.data ?? []) {
        const reason = ph.change_reason === 'threshold_met' ? 'Avance'
          : ph.change_reason === 'regression' ? 'Regresión'
          : ph.change_reason === 'onboarding_fast_track' ? 'Fast-track'
          : ph.change_reason;
        events.push({
          id: ph.id,
          type: 'phase_change',
          title: `${reason}: Fase ${ph.phase} — ${PHASE_LABELS[ph.phase] ?? ''}`,
          description: `Score: ${Math.round(ph.phase_score)}%`,
          date: ph.calculated_at,
          icon: 'phase',
        });
      }

      // Decisions
      for (const d of decisionResult.data ?? []) {
        events.push({
          id: d.id,
          type: 'decision',
          title: d.title,
          description: d.description ?? d.decision_category,
          date: d.decided_at,
          icon: 'decision',
        });
      }

      // Cycles
      for (const c of cycleResult.data ?? []) {
        events.push({
          id: c.id,
          type: 'cycle',
          title: `Ciclo ${c.cycle_index}: ${c.title ?? 'Sin título'}`,
          description: `${c.status} — Score: ${Math.round(c.cycle_score)}%`,
          date: c.start_date,
          icon: 'cycle',
        });
      }

      // Sort by date descending
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return events;
    },
    enabled: !!projectId,
    staleTime: 5 * 60_000,
  });
}

const ICON_MAP = {
  phase: ArrowRight,
  decision: Flag,
  cycle: Sparkles,
  milestone: CheckCircle2,
};

const COLOR_MAP: Record<string, string> = {
  phase_change: 'border-blue-400 bg-blue-50',
  decision: 'border-purple-400 bg-purple-50',
  cycle: 'border-amber-400 bg-amber-50',
  milestone: 'border-green-400 bg-green-50',
};

interface ProjectTimelineProps {
  projectId: string;
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const { data: events, isLoading } = useProjectTimeline(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        No hay eventos en el timeline aún.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Timeline del proyecto</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

        {events.slice(0, 15).map((event) => {
          const Icon = ICON_MAP[event.icon];
          const colorClass = COLOR_MAP[event.type] ?? 'border-gray-300 bg-gray-50';

          return (
            <div key={event.id} className="relative flex gap-3 pb-3">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${colorClass}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
