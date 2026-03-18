/**
 * M18.25 — MEETING DECISION TIMELINE
 *
 * Vista cruzada: decisiones de reunión × phase transitions × strategic cycles.
 * Muestra en orden cronológico si las decisiones de reunión alinearon con los
 * momentos clave del motor estratégico.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, ArrowUpRight, RefreshCw, Calendar } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type EventKind = 'decision' | 'phase_transition' | 'cycle'

interface TimelineEvent {
  id:          string
  date:        string   // ISO
  kind:        EventKind
  title:       string
  description?: string
  badge?:       string
}

// ── Queries ───────────────────────────────────────────────────────────────────

function useDecisionTimeline(projectId: string) {
  return useQuery<TimelineEvent[]>({
    queryKey:  ['decision_timeline', projectId],
    enabled:   !!projectId,
    staleTime: 5 * 60_000,
    queryFn:   async () => {
      const events: TimelineEvent[] = [];

      // 1. Decision events from meetings
      const { data: decisions } = await supabase
        .from('decision_events')
        .select('id, payload, triggered_by, created_at')
        .eq('project_id', projectId)
        .eq('triggered_by', 'meeting_intelligence')
        .order('created_at', { ascending: false })
        .limit(30);

      for (const d of decisions ?? []) {
        const payload = d.payload as { title?: string; description?: string } | null;
        events.push({
          id:          d.id,
          date:        d.created_at as string,
          kind:        'decision',
          title:       payload?.title ?? 'Decisión de reunión',
          description: payload?.description ?? undefined,
          badge:       'Decisión',
        });
      }

      // 2. Phase transitions (change_reason IS NOT NULL = hubo cambio)
      const { data: phases } = await supabase
        .from('project_phase_history')
        .select('id, phase, change_reason, calculated_at')
        .eq('project_id', projectId)
        .not('change_reason', 'is', null)
        .order('calculated_at', { ascending: false })
        .limit(10);

      const PHASE_REASON_LABELS: Record<string, string> = {
        threshold_met:      'Umbral alcanzado',
        acceleration_signal: 'Señal de aceleración',
        regression:         'Regresión detectada',
      };

      for (const p of phases ?? []) {
        events.push({
          id:    p.id,
          date:  p.calculated_at as string,
          kind:  'phase_transition',
          title: `Transición a Fase ${p.phase}`,
          badge: PHASE_REASON_LABELS[(p.change_reason as string) ?? ''] ?? p.change_reason as string,
        });
      }

      // 3. Strategic cycles
      const { data: cycles } = await supabase
        .from('strategic_cycles')
        .select('id, cycle_type, cycle_start, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      const CYCLE_LABELS: Record<string, string> = {
        weekly:    'Ciclo semanal',
        monthly:   'Ciclo mensual',
        quarterly: 'Ciclo trimestral',
      };

      for (const c of cycles ?? []) {
        events.push({
          id:    c.id,
          date:  c.created_at as string,
          kind:  'cycle',
          title: CYCLE_LABELS[(c.cycle_type as string)] ?? `Ciclo ${c.cycle_type}`,
          badge: new Date(c.cycle_start as string).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short',
          }),
        });
      }

      // Sort all events by date descending
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return events;
    },
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

const KIND_CONFIG = {
  decision: {
    Icon:        CheckCircle2,
    iconColor:   'text-green-600',
    dotColor:    'bg-green-500',
    badgeClass:  'bg-green-100 text-green-700',
  },
  phase_transition: {
    Icon:        ArrowUpRight,
    iconColor:   'text-blue-600',
    dotColor:    'bg-blue-500',
    badgeClass:  'bg-blue-100 text-blue-700',
  },
  cycle: {
    Icon:        RefreshCw,
    iconColor:   'text-violet-600',
    dotColor:    'bg-violet-400',
    badgeClass:  'bg-violet-100 text-violet-700',
  },
} as const;

function TimelineItem({ event }: { event: TimelineEvent }) {
  const cfg = KIND_CONFIG[event.kind];
  const Icon = cfg.Icon;
  const dateStr = new Date(event.date).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${cfg.dotColor}`} />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon size={13} className={`shrink-0 ${cfg.iconColor}`} />
            <span className="text-sm font-medium text-foreground leading-snug line-clamp-1">
              {event.title}
            </span>
          </div>
          {event.badge && (
            <Badge className={`shrink-0 text-xs px-1.5 py-0 ${cfg.badgeClass}`}>
              {event.badge}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 ml-5">
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground ml-5 mt-0.5 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MeetingDecisionTimelineProps {
  projectId: string;
  onClose?: () => void;
}

export function MeetingDecisionTimeline({ projectId, onClose }: MeetingDecisionTimelineProps) {
  const { data: events = [], isLoading } = useDecisionTimeline(projectId);

  const decisions   = events.filter(e => e.kind === 'decision').length;
  const transitions = events.filter(e => e.kind === 'phase_transition').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Timeline de Decisiones
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Decisiones de reunión, transiciones de fase y ciclos estratégicos en orden cronológico.
        </p>
      </div>

      {/* Legend */}
      {!isLoading && events.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {decisions} decisión{decisions !== 1 ? 'es' : ''} de reunión
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {transitions} transición{transitions !== 1 ? 'es' : ''} de fase
          </span>
        </div>
      )}

      {/* Timeline */}
      <Card>
        <CardContent className="pt-5 pb-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin eventos de decisión registrados aún.
              <br />
              Completa reuniones para ver cómo tus decisiones se alinean con el motor.
            </p>
          ) : (
            <div className="space-y-0">
              {events.map(event => (
                <TimelineItem key={`${event.kind}-${event.id}`} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {onClose && (
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
