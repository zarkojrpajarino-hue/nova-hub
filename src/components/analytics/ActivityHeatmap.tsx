import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, eachDayOfInterval, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { PREMIUM_DEMO_DATA } from '@/data/premiumDemoData';

interface ActivityHeatmapProps {
  isDemoMode?: boolean;
}

export function ActivityHeatmap({ isDemoMode = false }: ActivityHeatmapProps = {}) {
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, 6);
    return { start, end };
  }, []);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-heatmap', dateRange],
    queryFn: async () => {
      // DISABLED: tabla activity_log no existe
      return [];
    },
    enabled: !isDemoMode,
  });

  const { data: obvs = [] } = useQuery({
    queryKey: ['obvs-heatmap', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obvs')
        .select('created_at')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (error) throw error;
      return (data || []) as Array<{ created_at: string | null }>;
    },
    enabled: !isDemoMode,
  });

  const heatmapData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

    // 🎯 Si está en modo demo, generar datos sintéticos perfectos
    if (isDemoMode) {
      return days.map((day, idx) => {
        // Generar patrón realista: más actividad entre semana, menos en fin de semana
        const dayOfWeek = getDay(day);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const baseActivity = isWeekend ? 5 : 18;
        const variation = Math.sin(idx / 7) * 8; // Variación semanal
        const randomFactor = (Math.sin(idx * 13) + 1) * 3; // Variación aleatoria consistente
        const count = Math.max(0, Math.round(baseActivity + variation + randomFactor));

        return {
          date: day,
          dateStr: format(day, 'yyyy-MM-dd'),
          count,
          level: Math.min(4, Math.ceil(count / 8)), // 0-4 levels
        };
      });
    }

    // Count activities per day (datos reales)
    const activityCounts: Record<string, number> = {};

    activities.forEach(a => {
      const date = format(new Date(a.created_at || ''), 'yyyy-MM-dd');
      activityCounts[date] = (activityCounts[date] || 0) + 1;
    });

    obvs.forEach(o => {
      const date = format(new Date(o.created_at || ''), 'yyyy-MM-dd');
      activityCounts[date] = (activityCounts[date] || 0) + 1;
    });

    // Find max for scale
    const maxCount = Math.max(...Object.values(activityCounts), 1);

    return days.map(day => ({
      date: day,
      dateStr: format(day, 'yyyy-MM-dd'),
      count: activityCounts[format(day, 'yyyy-MM-dd')] || 0,
      level: Math.ceil((activityCounts[format(day, 'yyyy-MM-dd')] || 0) / maxCount * 4),
    }));
  }, [activities, obvs, dateRange, isDemoMode]);

  // Group by weeks
  const weeks = useMemo(() => {
    const result: typeof heatmapData[] = [];
    let currentWeek: typeof heatmapData = [];
    
    heatmapData.forEach((day, index) => {
      const dayOfWeek = getDay(day.date);
      
      // Start new week on Sunday (0)
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push(day);
      
      // Push last week
      if (index === heatmapData.length - 1) {
        result.push(currentWeek);
      }
    });
    
    return result;
  }, [heatmapData]);

  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-muted';
      case 1: return 'bg-green-200 dark:bg-green-900';
      case 2: return 'bg-green-400 dark:bg-green-700';
      case 3: return 'bg-green-600 dark:bg-green-500';
      case 4: return 'bg-green-800 dark:bg-green-300';
      default: return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-2 text-[10px] text-muted-foreground">
          {dayLabels.map((day, i) => (
            <div key={i} className="h-3 flex items-center">{i % 2 === 1 ? day : ''}</div>
          ))}
        </div>
        
        {/* Weeks */}
        <div className="flex gap-1 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {/* Fill in missing days at start of first week */}
              {weekIndex === 0 && week.length < 7 && 
                Array.from({ length: 7 - week.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-3 h-3" />
                ))
              }
              {week.map((day) => (
                <Tooltip key={day.dateStr}>
                  <TooltipTrigger>
                    <div 
                      className={cn(
                        "w-3 h-3 rounded-sm",
                        getColor(day.level)
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {format(day.date, 'dd MMM yyyy', { locale: es })}
                      <br />
                      {day.count} actividades
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Menos</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={cn("w-3 h-3 rounded-sm", getColor(level))} />
          ))}
        </div>
        <span>Más</span>
      </div>
    </div>
  );
}
