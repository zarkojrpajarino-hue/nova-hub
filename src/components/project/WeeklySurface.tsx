/**
 * WEEKLY SURFACE — V11.3
 *
 * Surface 2: Weekly Review Surface (full page, semanas 1–3 del ciclo).
 * Reemplaza Surface 1 completamente — Rule 2 (1 surface = 1 time context).
 *
 * Componentes: signal_changes · engine_warnings · focus_confirmation.
 * En v1: read-only. El founder ve el estado, no lo ajusta.
 *
 * Botón de salida: t('project.continueExecution') → marca review como leída → regresa a Surface 1.
 */

import { CalendarDays, TrendingUp, TrendingDown, ArrowRight, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLatestWeeklyReview, useProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useProjectContext } from '@/hooks/useProjectContext';
import { buildNextAction } from '@/lib/build-next-action';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { getDateFnsLocale } from '@/i18n';
import { SourceBadge } from '@/components/shared/SourceBadge';

import { useTranslation } from 'react-i18next';
import { SourceBadge } from '@/components/shared/SourceBadge';
interface WeeklySurfaceProps {
  projectId: string;
  onContinue: () => void; // marca read_at + regresa a Engine
}

export function WeeklySurface({ projectId, onContinue }: WeeklySurfaceProps) {
  const { t } = useTranslation();
  const { data: review, isLoading } = useLatestWeeklyReview(projectId);

  // U6.V2.2 — Foco de la próxima semana: buildNextAction() en lugar de next_step estático
  const { data: engineData } = useProjectEngineData(projectId);
  const { data: agentCtx }   = useAgentContext(projectId);
  const { data: projectCtx } = useProjectContext(projectId);
  const weekNextAction = buildNextAction(
    engineData,
    agentCtx?.insights ?? [],
    { overdueCount: 0 },
    projectCtx ?? { mode: 'solo', teamSize: 0, operationalComplexity: 'low' },
  );

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <CalendarDays size={40} className="mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">{t('project.noHayRevisiónSemanal')}</p>
        <Button onClick={onContinue}>{t('project.continuar')}</Button>
      </div>
    );
  }

  // Guard runtime: summary_json puede llegar como null, string, array u objeto incompleto
  // según la versión del backend que lo generó. Validación explícita de cada campo.
  const raw = review.summary_json;
  const summaryObj: Record<string, unknown> =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const headline   = typeof summaryObj.headline   === 'string'  ? summaryObj.headline   : t('project.revisiónSemanal');
  const highlights = Array.isArray(summaryObj.highlights)       ? (summaryObj.highlights as string[]) : [];
  const warnings   = Array.isArray(summaryObj.warnings)         ? (summaryObj.warnings   as string[]) : [];
  const nextStep   = typeof summaryObj.next_step  === 'string'  ? summaryObj.next_step  : null;

  const weekLabel =
    review.week_start_date && review.week_end_date
      ? `${format(parseISO(review.week_start_date), "d 'de' MMMM", { locale: getDateFnsLocale() })} – ${format(parseISO(review.week_end_date), "d 'de' MMMM", { locale: getDateFnsLocale() })}`
      : '';

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <CalendarDays size={15} />
          <span>Revisión semanal · {weekLabel}</span>
          {review.has_transition && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">
              <TrendingUp size={9} className="mr-0.5" />{t('project.avanceDeFase')}</Badge>
          )}
          {review.has_regression && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-red-500/10 text-red-600 border-red-500/30">
              <TrendingDown size={9} className="mr-0.5" />{t('project.alerta')}</Badge>
          )}
        <SourceBadge type="declared" source="weeklyReview" reliability={0.6} size="sm" />
        </div>
        <h2 className="text-2xl font-bold leading-snug">{headline}</h2>
      </div>

      {/* Highlights — signal changes */}
      {highlights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('project.loQueAvanzóEsta')}</h3>
          <ul className="space-y-1">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings — engine warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('project.alertasATenerEn')}</h3>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    'mt-1 w-1.5 h-1.5 rounded-full shrink-0',
                    w.includes(t('project.regresión')) || w.includes('crítico')
                      ? 'bg-red-500'
                      : 'bg-amber-500',
                  )}
                />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Focus confirmation — Next Action contexto retrospectivo (read-only) */}
      {nextStep && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('project.direcciónDeEstaSemana')}</h3>
          <p className="text-sm leading-relaxed">{nextStep}</p>
          <p className="text-[11px] text-muted-foreground">{t('project.estaEsLaDirección')}</p>
        </div>
      )}

      {/* U6.V2.2 — Foco de la próxima semana: calculado en tiempo real por buildNextAction() */}
      {weekNextAction && weekNextAction.type !== 'none' && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Target size={12} />{t('project.focoDeLaPróxima')}</h3>
          <p className="text-sm font-medium leading-snug">{weekNextAction.title}</p>
          <p className="text-sm text-muted-foreground">{weekNextAction.description}</p>
          <p className="text-[11px] text-muted-foreground">{t('project.calculadoPorElMotor')}</p>
        </div>
      )}

      {/* Exit button — obligatorio per SURFACES_V1.md */}
      <div className="pt-4 flex justify-end">
        <Button onClick={onContinue} className="gap-2">{t('project.continuarEjecución')}<ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
