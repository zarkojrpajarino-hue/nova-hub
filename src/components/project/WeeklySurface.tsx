/**
 * WEEKLY SURFACE — V11.3
 *
 * Surface 2: Weekly Review Surface (full page, semanas 1–3 del ciclo).
 * Reemplaza Surface 1 completamente — Rule 2 (1 surface = 1 time context).
 *
 * Componentes: signal_changes · engine_warnings · focus_confirmation.
 * En v1: read-only. El founder ve el estado, no lo ajusta.
 *
 * Botón de salida: "Continue execution" → marca review como leída → regresa a Surface 1.
 */

import { CalendarDays, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLatestWeeklyReview } from '@/hooks/useNovaDataOptimized';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklySurfaceProps {
  projectId: string;
  onContinue: () => void; // marca read_at + regresa a Engine
}

export function WeeklySurface({ projectId, onContinue }: WeeklySurfaceProps) {
  const { data: review, isLoading } = useLatestWeeklyReview(projectId);

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
        <p className="text-muted-foreground">No hay revisión semanal disponible.</p>
        <Button onClick={onContinue}>Continuar</Button>
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
  const headline   = typeof summaryObj.headline   === 'string'  ? summaryObj.headline   : 'Revisión semanal';
  const highlights = Array.isArray(summaryObj.highlights)       ? (summaryObj.highlights as string[]) : [];
  const warnings   = Array.isArray(summaryObj.warnings)         ? (summaryObj.warnings   as string[]) : [];
  const nextStep   = typeof summaryObj.next_step  === 'string'  ? summaryObj.next_step  : null;

  const weekLabel =
    review.week_start_date && review.week_end_date
      ? `${format(parseISO(review.week_start_date), "d 'de' MMMM", { locale: es })} – ${format(parseISO(review.week_end_date), "d 'de' MMMM", { locale: es })}`
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
              <TrendingUp size={9} className="mr-0.5" />
              Avance de fase
            </Badge>
          )}
          {review.has_regression && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-red-500/10 text-red-600 border-red-500/30">
              <TrendingDown size={9} className="mr-0.5" />
              Alerta
            </Badge>
          )}
        </div>
        <h2 className="text-2xl font-bold leading-snug">{headline}</h2>
      </div>

      {/* Highlights — signal changes */}
      {highlights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lo que avanzó esta semana
          </h3>
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
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Alertas a tener en cuenta
          </h3>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    'mt-1 w-1.5 h-1.5 rounded-full shrink-0',
                    w.includes('Regresión') || w.includes('crítico')
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

      {/* Focus confirmation — Next Action en contexto semanal (read-only) */}
      {nextStep && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Foco de esta semana
          </h3>
          <p className="text-sm leading-relaxed">{nextStep}</p>
          <p className="text-[11px] text-muted-foreground">
            Esta es la dirección del engine — no cambia por la revisión.
          </p>
        </div>
      )}

      {/* Exit button — obligatorio per SURFACES_V1.md */}
      <div className="pt-4 flex justify-end">
        <Button onClick={onContinue} className="gap-2">
          Continuar ejecución
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
