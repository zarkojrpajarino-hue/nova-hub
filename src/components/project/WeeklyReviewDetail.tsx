/**
 * WEEKLY REVIEW DETAIL — U6.12
 *
 * Modal con el desglose completo del resumen semanal.
 */

import { TrendingUp, TrendingDown, CalendarDays, Target, CheckSquare, FileCheck, ShoppingCart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { WeeklyReview } from '@/hooks/useNovaDataOptimized';
import { PHASE_LABELS } from '@/lib/engine';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklyReviewDetailProps {
  review: WeeklyReview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WeeklyReviewDetail({ review, open, onOpenChange }: WeeklyReviewDetailProps) {
  const summary = review.summary_json;

  const weekLabel = review.week_start_date && review.week_end_date
    ? `${format(parseISO(review.week_start_date), "d 'de' MMMM", { locale: es })} – ${format(parseISO(review.week_end_date), "d 'de' MMMM", { locale: es })}`
    : '';

  const phaseLabel = review.phase ? (PHASE_LABELS[review.phase] ?? `Fase ${review.phase}`) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" />
            Resumen semanal
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Flags */}
          {(review.has_transition || review.has_regression) && (
            <div className="flex gap-2">
              {review.has_transition && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
                  <TrendingUp size={12} />
                  Avance de fase
                </Badge>
              )}
              {review.has_regression && (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 gap-1">
                  <TrendingDown size={12} />
                  Regresión de fase
                </Badge>
              )}
            </div>
          )}

          {/* Headline */}
          <div className="p-4 bg-muted/30 rounded-xl">
            <p className="font-semibold text-sm leading-snug">{summary.headline}</p>
          </div>

          <Separator />

          {/* Snapshot de estado */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Estado al cierre
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {phaseLabel && (
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[11px] text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Target size={11} /> Fase
                  </p>
                  <p className="text-sm font-medium">
                    {review.phase} — {phaseLabel}
                  </p>
                  {review.phase_status && (
                    <p className={cn(
                      'text-[11px] mt-0.5',
                      review.phase_status === 'healthy'   && 'text-green-600',
                      review.phase_status === 'friction'  && 'text-amber-600',
                      review.phase_status === 'critical'  && 'text-red-600',
                    )}>
                      {review.phase_status}
                    </p>
                  )}
                </div>
              )}
              {review.mrr != null && (
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-[11px] text-muted-foreground mb-0.5">MRR</p>
                  <p className="text-sm font-medium">€{Number(review.mrr).toLocaleString('es-ES')}</p>
                </div>
              )}
              {review.runway_months != null && (
                <div className={cn(
                  'p-3 rounded-lg',
                  review.runway_months < 3 ? 'bg-red-500/10' : 'bg-muted/20'
                )}>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Runway</p>
                  <p className={cn(
                    'text-sm font-medium',
                    review.runway_months < 3 && 'text-red-600'
                  )}>
                    {review.runway_months} {review.runway_months === 1 ? 'mes' : 'meses'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actividad de la semana */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Actividad de la semana
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <CheckSquare size={14} className="mx-auto mb-1 text-blue-500" />
                <p className="text-lg font-bold">{review.tasks_completed}</p>
                <p className="text-[11px] text-muted-foreground">
                  {review.tasks_completed === 1 ? 'tarea' : 'tareas'}
                </p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <FileCheck size={14} className="mx-auto mb-1 text-amber-500" />
                <p className="text-lg font-bold">{review.obvs_count}</p>
                <p className="text-[11px] text-muted-foreground">OBVs</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <ShoppingCart size={14} className="mx-auto mb-1 text-green-500" />
                <p className="text-lg font-bold">{review.sales_count}</p>
                <p className="text-[11px] text-muted-foreground">
                  {review.sales_count === 1 ? 'venta' : 'ventas'}
                </p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          {summary.highlights.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Destacados
              </h4>
              <ul className="space-y-1">
                {summary.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">+</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {summary.warnings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Alertas
              </h4>
              <ul className="space-y-1">
                {summary.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-0.5">!</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next step */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-[11px] text-primary font-semibold uppercase tracking-wide mb-1">
              Próximo paso
            </p>
            <p className="text-sm">{summary.next_step}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
