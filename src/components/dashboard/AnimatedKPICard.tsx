/**
 * ANIMATED KPI CARD
 *
 * Card profesional con:
 * - Counter animation
 * - Progress bar animado
 * - Iconos configurables
 * - Trend indicator
 */

import { useEffect, useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AnimatedKPICardProps {
  label: string;
  value: number;
  target?: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  format?: 'number' | 'currency' | 'percentage';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  delay?: number;
}

export function AnimatedKPICard({
  label,
  value,
  target,
  icon: Icon,
  iconColor,
  iconBg,
  format = 'number',
  trend,
  delay = 0,
}: AnimatedKPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animated counter effect
  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500; // 1.5s animation
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `€${val.toLocaleString('es-ES')}`;
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString('es-ES');
    }
  };

  const progress = target ? Math.min((value / target) * 100, 100) : undefined;

  const TrendIcon = trend
    ? trend.direction === 'up'
      ? TrendingUp
      : trend.direction === 'down'
      ? TrendingDown
      : Minus
    : null;

  return (
    <Card
      className={cn(
        'hover-lift elevation-2 transition-all',
        'animate-fade-in',
        !isVisible && 'opacity-0'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
            <Icon size={24} className={iconColor} />
          </div>

          {trend && TrendIcon && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                trend.direction === 'up' && 'bg-green-500/10 text-green-600',
                trend.direction === 'down' && 'bg-red-500/10 text-red-600',
                trend.direction === 'neutral' && 'bg-gray-500/10 text-gray-600'
              )}
            >
              <TrendIcon size={12} />
              {trend.value}%
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>

          <p className="text-3xl font-bold tracking-tight">{formatValue(displayValue)}</p>

          {target !== undefined && (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Objetivo: {formatValue(target)}</span>
                <span>{progress?.toFixed(0)}%</span>
              </div>

              <Progress value={progress} className="h-2" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
