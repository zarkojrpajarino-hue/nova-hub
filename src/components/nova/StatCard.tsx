import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  progress: number;
  target?: string | number;
  color: string;
  delay?: number;
}

export const StatCard = memo(function StatCard({ icon: Icon, value, label, progress, target, color, delay = 1 }: StatCardProps) {
  const clampedProgress = Math.min(progress, 100);

  return (
    <article
      className={cn(
        "relative bg-card border border-border rounded-2xl p-5 overflow-hidden animate-fade-in",
        `delay-${delay}`
      )}
      style={{ opacity: 0 }}
      aria-label={`${label} estadística`}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: color }}
        aria-hidden="true"
      />

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${color}20` }}
        aria-hidden="true"
      >
        <Icon size={20} style={{ color }} aria-hidden="true" />
      </div>

      {/* Value */}
      <p className="text-3xl font-bold tracking-tight mb-1" aria-label={`Valor: ${value}`}>{value}</p>

      {/* Label */}
      <p className="text-sm text-muted-foreground mb-3">{label}</p>

      {/* Progress bar */}
      <div
        className="h-1 bg-muted rounded-full overflow-hidden mb-2"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso: ${clampedProgress}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clampedProgress}%`,
            background: color
          }}
          aria-hidden="true"
        />
      </div>

      {target !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold" style={{ color }} aria-label={`Progreso ${clampedProgress}%`}>
            {clampedProgress.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">Meta: {target}</span>
        </div>
      )}
    </article>
  );
});
