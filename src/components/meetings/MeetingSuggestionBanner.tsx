/**
 * 🔔 MEETING SUGGESTION BANNER — M18.I.3
 *
 * Se muestra en MeetingHistory cuando detect_meeting_triggers() detecta
 * ≥3 señales activas en el proyecto. Muestra el tipo de reunión sugerido,
 * las señales detectadas y un CTA para crear la reunión.
 *
 * M18.I.5 (N7.V2.2): inserta notificación 'meeting_suggested' una vez por
 * proyecto cada 7 días (dedup client-side, fire-and-forget).
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, X, AlertTriangle, Clock, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useMeetingTriggers, type MeetingTrigger } from '@/hooks/useMeetingTriggers';
import { supabase } from '@/integrations/supabase/client';

import { useTranslation } from 'react-i18next';
// ── Helpers ───────────────────────────────────────────────────────────────────

const SUGGESTED_TYPE_LABELS: Record<string, string> = {
  review:    'revisión',
  strategy:  'estrategia',
  alignment: 'alineación',
};

function urgencyStyles(urgency: string) {
  const { t } = useTranslation();
  switch (urgency) {
    case 'high':   return 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30';
    case 'medium': return 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30';
    default:       return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30';
  }
}

function urgencyIconColor(urgency: string) {
  switch (urgency) {
    case 'high':   return 'text-red-500';
    case 'medium': return 'text-amber-500';
    default:       return 'text-blue-500';
  }
}

function urgencyTextColor(urgency: string) {
  switch (urgency) {
    case 'high':   return 'text-red-800 dark:text-red-300';
    case 'medium': return 'text-amber-800 dark:text-amber-300';
    default:       return 'text-blue-800 dark:text-blue-300';
  }
}

function TriggerIcon({ triggerKey }: { triggerKey: string }) {
  const cls = 'h-3.5 w-3.5 shrink-0 mt-0.5';
  switch (triggerKey) {
    case 'overdue_commitments':
    case 'low_fulfillment':
      return <Clock className={cls} />;
    case 'unresolved_blockers':
    case 'recurring_blocker':
      return <AlertTriangle className={cls} />;
    case 'low_alignment':
    case 'pending_strategic_insights':
      return <TrendingDown className={cls} />;
    default:
      return <Clock className={cls} />;
  }
}

// ── Notification dedup (M18.I.5 / N7.V2.2) ───────────────────────────────────

async function maybeInsertMeetingSuggestedNotification(
  projectId: string,
  totalSignals: number,
  suggestedType: string,
  triggers: MeetingTrigger[],
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Dedup: no insertar si ya hay una en los últimos 7 días
    const cutoff = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .eq('tipo', 'meeting_suggested')
      .gte('created_at', cutoff)
      .limit(1);

    if (existing && existing.length > 0) return;

    const typeLabel = SUGGESTED_TYPE_LABELS[suggestedType] ?? suggestedType;

    await supabase.from('notifications').insert({
      user_id:    user.id,
      project_id: projectId,
      tipo:       'meeting_suggested',
      titulo:     t('meetings.reuniónSugeridaPorEl'),
      mensaje:    `Optimus detectó ${totalSignals} señales — puede ser buen momento para una reunión de ${typeLabel}`,
      priority:   'medium',
      metadata:   { triggers, suggested_type: suggestedType },
    });
  } catch {
    // non-fatal — notification failure must never block the main flow
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MeetingSuggestionBannerProps {
  projectId:      string;
  onStartMeeting: () => void;
}

export function MeetingSuggestionBanner({
  projectId,
  onStartMeeting,
}: MeetingSuggestionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showAll, setShowAll]     = useState(false);

  const { data: triggers, isLoading } = useMeetingTriggers(projectId);

  // M18.I.5 — insert meeting_suggested notification once per 7 days
  useEffect(() => {
    if (!triggers?.suggest_meeting) return;
    void maybeInsertMeetingSuggestedNotification(
      projectId,
      triggers.total_signals,
      triggers.suggested_type,
      triggers.triggers,
    );
  }, [triggers?.suggest_meeting, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !triggers?.suggest_meeting || dismissed) return null;

  const { urgency, suggested_type, triggers: items, total_signals } = triggers;
  const typeLabel     = SUGGESTED_TYPE_LABELS[suggested_type] ?? suggested_type;
  const visibleItems  = showAll ? items : items.slice(0, 3);
  const hasMore       = items.length > 3;

  return (
    <div className={`rounded-xl border px-4 py-3 ${urgencyStyles(urgency)}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Mic className={`h-5 w-5 mt-0.5 shrink-0 ${urgencyIconColor(urgency)}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${urgencyTextColor(urgency)}`}>
              {urgency === 'high'
                ? `${total_signals} señales convergen — reúnete con tu equipo`
                : `${total_signals} señales detectadas — puede ser buen momento para una reunión de ${typeLabel}`
              }
            </span>
          </div>

          {/* Triggers list */}
          <ul className={`mt-2 space-y-1 ${urgencyTextColor(urgency)}`}>
            {visibleItems.map(t => (
              <li key={t.key} className="flex items-start gap-1.5 text-xs opacity-80">
                <TriggerIcon triggerKey={t.key} />
                <span>{t.label}</span>
              </li>
            ))}
          </ul>

          {/* Show more / less */}
          {hasMore && (
            <button
              className={`mt-1.5 flex items-center gap-1 text-xs opacity-60 hover:opacity-80 ${urgencyTextColor(urgency)}`}
              onClick={() => setShowAll(v => !v)}
            >
              {showAll ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showAll ? 'Ver menos': `Ver ${items.length - 3} más`}
            </button>
          )}

          {/* CTA */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5 h-8 px-3 text-xs"
              onClick={onStartMeeting}
            >
              <Mic className="h-3.5 w-3.5" />
              Programar reunión de {typeLabel}
            </Button>
            <button
              className={`text-xs opacity-50 hover:opacity-75 ${urgencyTextColor(urgency)}`}
              onClick={() => setDismissed(true)}
            >{t('meetings.recordármeloDespués')}</button>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className={`shrink-0 opacity-40 hover:opacity-70 ${urgencyTextColor(urgency)}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
