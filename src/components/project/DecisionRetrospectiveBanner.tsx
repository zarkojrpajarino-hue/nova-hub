/**
 * DecisionRetrospectiveBanner — SR10.V2.3
 *
 * Muestra un banner cuando hay decisiones estratégicas pendientes de retrospectiva
 * (tomadas hace ≥30 días y sin outcome registrado).
 *
 * El usuario puede:
 *   - Completar la retrospectiva inline (outcome_text + was_correct)
 *   - Descartar la notificación (pospone 7d en localStorage)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardCheck, X, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/i18n';

import { useTranslation } from 'react-i18next';
// ── Tipos ─────────────────────────────────────────────────────────────────────

interface DecisionRetrospective {
  id:                   string;
  decision_summary:     string;
  decision_made_at:     string;
  retrospective_due_at: string;
  filled_at:            string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

function usePendingRetrospectives(projectId: string | undefined) {
  const { t } = useTranslation();
  return useQuery<DecisionRetrospective[]>({
    queryKey:  ['decision_retrospectives_pending', projectId],
    enabled:   !!projectId,
    staleTime: 5 * 60_000,
    queryFn:   async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('decision_retrospectives')
        .select('id, decision_summary, decision_made_at, retrospective_due_at, filled_at')
        .eq('project_id', projectId!)
        .is('filled_at', null)
        .lte('retrospective_due_at', new Date().toISOString())
        .order('retrospective_due_at', { ascending: true })
        .limit(5);
      return (data ?? []) as DecisionRetrospective[];
    },
  });
}

// ── Componente ────────────────────────────────────────────────────────────────

interface DecisionRetrospectiveBannerProps {
  projectId: string | undefined;
}

const SNOOZED_KEY = (projectId: string) => `dr_snoozed_${projectId}`;

export function DecisionRetrospectiveBanner({ projectId }: DecisionRetrospectiveBannerProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded]     = useState(false);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [outcomeText, setOutcome]   = useState('');
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  // Snooze check
  const isSnoozed = () => {
    if (!projectId) return true;
    const snoozeUntil = localStorage.getItem(SNOOZED_KEY(projectId));
    return snoozeUntil ? Date.now() < Number(snoozeUntil) : false;
  };

  const { data: pending = [] } = usePendingRetrospectives(projectId);

  const fillMutation = useMutation({
    mutationFn: async ({ id, outcome, correct }: { id: string; outcome: string; correct: boolean }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('decision_retrospectives')
        .update({
          outcome_text: outcome,
          was_correct:  correct,
          filled_at:    new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decision_retrospectives_pending', projectId] });
      toast.success(t('project.retrospectivaRegistrada'));
      setActiveId(null);
      setOutcome('');
      setWasCorrect(null);
    },
    onError: () => toast.error(t('project.errorAlGuardarLa')),
  });

  if (!projectId || isSnoozed() || pending.length === 0) return null;

  const _first = pending[0];

  const handleSnooze = () => {
    localStorage.setItem(SNOOZED_KEY(projectId), String(Date.now() + 7 * 86_400_000));
    // Force re-render by triggering re-check
    queryClient.invalidateQueries({ queryKey: ['decision_retrospectives_pending', projectId] });
  };

  const handleSubmit = () => {
    if (!activeId || wasCorrect === null) return;
    fillMutation.mutate({ id: activeId, outcome: outcomeText, correct: wasCorrect });
  };

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30">
      {/* Header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-violet-600 shrink-0" />
          <span className="text-sm font-semibold text-violet-900 dark:text-violet-200">
            {pending.length === 1
              ? '1 decisión pendiente de retrospectiva'
              : `${pending.length} decisiones pendientes de retrospectiva`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-violet-500">{t('project.quéPasó')}</span>
          {expanded
            ? <ChevronUp  className="h-4 w-4 text-violet-500" />
            : <ChevronDown className="h-4 w-4 text-violet-500" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-violet-200 dark:border-violet-800 px-4 pb-4 pt-3 space-y-4">
          {/* Lista de decisiones pendientes */}
          <div className="space-y-2">
            {pending.map(retro => (
              <div
                key={retro.id}
                className={`rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                  activeId === retro.id
                    ? 'border-violet-400 bg-violet-100 dark:bg-violet-900/40'
                    : 'border-violet-200 dark:border-violet-800 hover:bg-violet-100/60 dark:hover:bg-violet-900/20'
                }`}
                onClick={() => {
                  setActiveId(retro.id === activeId ? null : retro.id);
                  setOutcome('');
                  setWasCorrect(null);
                }}
              >
                <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
                  {retro.decision_summary}
                </p>
                <p className="text-xs text-violet-500 mt-0.5">
                  Tomada{' '}
                  {formatDistanceToNow(new Date(retro.decision_made_at), { addSuffix: true, locale: getDateFnsLocale() })}
                </p>
              </div>
            ))}
          </div>

          {/* Form inline para la decisión activa */}
          {activeId && (
            <div className="space-y-3 rounded-md border border-violet-300 dark:border-violet-700 bg-white dark:bg-violet-950/50 p-3">
              <p className="text-xs font-semibold text-violet-800 dark:text-violet-200 uppercase tracking-wide">{t('project.quéPasóConEsta')}</p>
              <Textarea
                placeholder={t('project.describeBrevementeElOutcome')}
                value={outcomeText}
                onChange={e => setOutcome(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-violet-600 dark:text-violet-400">{t('project.fueLaDecisiónCorrecta')}</span>
                <button
                  onClick={() => setWasCorrect(true)}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    wasCorrect === true
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" /> Sí
                </button>
                <button
                  onClick={() => setWasCorrect(false)}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    wasCorrect === false
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  <ThumbsDown className="h-3 w-3" /> No
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setActiveId(null); setOutcome(''); setWasCorrect(null); }}
                >{t('project.cancelar')}</Button>
                <Button
                  size="sm"
                  disabled={wasCorrect === null || fillMutation.isPending}
                  onClick={handleSubmit}
                >{t('project.guardarRetrospectiva')}</Button>
              </div>
            </div>
          )}

          {/* Snooze */}
          <div className="flex justify-end">
            <button
              onClick={handleSnooze}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-600"
            >
              <X className="h-3 w-3" />{t('project.recordarEn7Días')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
