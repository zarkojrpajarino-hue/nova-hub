/**
 * WEEKLY REVIEW CARD — U6.12
 *
 * Muestra el último resumen semanal del proyecto.
 * Generado determinísticamente por pg_cron cada domingo.
 */

import { useState } from 'react';
import { CalendarDays, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLatestWeeklyReview } from '@/hooks/useNovaDataOptimized';
import { WeeklyReviewDetail } from './WeeklyReviewDetail';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklyReviewCardProps {
  projectId: string;
}

export function WeeklyReviewCard({ projectId }: WeeklyReviewCardProps) {
  const { data: review, isLoading } = useLatestWeeklyReview(projectId);
  const [detailOpen, setDetailOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="h-3 bg-muted rounded w-2/3 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">Resumen semanal</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Aún no hay review semanal. Se genera automáticamente cada domingo.
        </p>
      </div>
    );
  }

  const summary = review.summary_json;
  const weekLabel = review.week_start_date && review.week_end_date
    ? `${format(parseISO(review.week_start_date), 'd MMM', { locale: es })} – ${format(parseISO(review.week_end_date), 'd MMM', { locale: es })}`
    : '';

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">Resumen semanal</h3>
          </div>
          <div className="flex items-center gap-2">
            {review.has_transition && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">
                <TrendingUp size={9} className="mr-0.5" />
                Avance
              </Badge>
            )}
            {review.has_regression && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-red-500/10 text-red-600 border-red-500/30">
                <TrendingDown size={9} className="mr-0.5" />
                Alerta
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">{weekLabel}</span>
          </div>
        </div>

        {/* Headline */}
        <p className="text-sm font-medium mb-3 leading-snug">{summary.headline}</p>

        {/* Highlights */}
        {summary.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {summary.highlights.slice(0, 3).map((h, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Warnings */}
        {summary.warnings.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {summary.warnings.slice(0, 2).map((w, i) => (
              <span
                key={i}
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded-full',
                  w.includes('Regresión') || w.includes('crítico')
                    ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                )}
              >
                {w}
              </span>
            ))}
          </div>
        )}

        {/* Next step */}
        <p className="text-[11px] text-muted-foreground italic leading-relaxed mb-3">
          Próximo paso: {summary.next_step}
        </p>

        {/* Ver detalle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] text-muted-foreground gap-1 -ml-2"
          onClick={() => setDetailOpen(true)}
        >
          Ver detalle
          <ChevronRight size={12} />
        </Button>
      </div>

      <WeeklyReviewDetail
        review={review}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
