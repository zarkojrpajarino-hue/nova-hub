/**
 * ACTIVITY HEATMAP
 *
 * Heatmap estilo GitHub contributions
 * Muestra actividad diaria del equipo
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActivityHeatmapProps {
  data: Array<{
    date: string; // YYYY-MM-DD
    count: number; // Número de actividades
  }>;
  weeks?: number; // Número de semanas a mostrar
}

export function ActivityHeatmap({ data, weeks = 12 }: ActivityHeatmapProps) {
  // Generate last N weeks
  const endDate = new Date();
  const startDate = subWeeks(endDate, weeks);

  const allDays = eachDayOfInterval({
    start: startOfWeek(startDate, { locale: es }),
    end: endOfWeek(endDate, { locale: es }),
  });

  // Create map for quick lookup
  const activityMap = new Map(data.map((d) => [d.date, d.count]));

  // Group by week
  const weekGroups: Date[][] = [];
  let currentWeek: Date[] = [];

  allDays.forEach((day, index) => {
    currentWeek.push(day);
    if ((index + 1) % 7 === 0) {
      weekGroups.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weekGroups.push(currentWeek);
  }

  // Get activity level (0-4) based on count
  const getActivityLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  };

  const getActivityColor = (level: number): string => {
    switch (level) {
      case 0:
        return 'bg-muted border-border/50';
      case 1:
        return 'bg-primary/20 border-primary/30';
      case 2:
        return 'bg-primary/40 border-primary/50';
      case 3:
        return 'bg-primary/60 border-primary/70';
      case 4:
        return 'bg-primary border-primary';
      default:
        return 'bg-muted';
    }
  };

  // Max count for legend
  const maxCount = Math.max(...data.map((d) => d.count), 10);

  return (
    <Card className="elevation-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <CardTitle>Heatmap de Actividad</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Últimas {weeks} semanas - {data.length} días con actividad
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="overflow-x-auto custom-scrollbar">
            <div className="inline-flex gap-1 min-w-full">
              {weekGroups.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = activityMap.get(dateStr) || 0;
                    const level = getActivityLevel(count);

                    return (
                      <TooltipProvider key={dateStr} delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'w-3 h-3 rounded-sm border transition-all cursor-pointer hover:scale-125',
                                getActivityColor(level)
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs font-medium">
                              {format(day, "d 'de' MMMM, yyyy", { locale: es })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {count} {count === 1 ? 'actividad' : 'actividades'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Menos</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn('w-3 h-3 rounded-sm border', getActivityColor(level))}
                />
              ))}
            </div>
            <span>Más</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-muted-foreground">Días activos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{data.reduce((sum, d) => sum + d.count, 0)}</p>
              <p className="text-xs text-muted-foreground">Total actividades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{(data.length / (weeks * 7) * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Tasa de actividad</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
