import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format, subDays, subWeeks, subMonths, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface TemporalEvolutionChartProps {
  period: 'week' | 'month' | 'quarter' | 'year';
}

export function TemporalEvolutionChart({ period }: TemporalEvolutionChartProps) {
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'week': return { start: subDays(now, 7), end: now };
      case 'month': return { start: subDays(now, 30), end: now };
      case 'quarter': return { start: subMonths(now, 3), end: now };
      case 'year': return { start: subMonths(now, 12), end: now };
    }
  }, [period]);

  const { data: obvs = [], isLoading: loadingOBVs } = useQuery({
    queryKey: ['obvs-temporal', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obvs')
        .select('fecha, tipo')
        .gte('fecha', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('fecha', format(dateRange.end, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: kpis = [], isLoading: loadingKPIs } = useQuery({
    queryKey: ['kpis-temporal', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpis')
        .select('created_at, type')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
      
      if (error) throw error;
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    // Determine intervals based on period
    let intervals: Date[];
    let formatStr: string;
    
    switch (period) {
      case 'week':
        intervals = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        formatStr = 'EEE';
        break;
      case 'month':
        intervals = eachWeekOfInterval({ start: dateRange.start, end: dateRange.end });
        formatStr = "'Sem' w";
        break;
      case 'quarter':
      case 'year':
        intervals = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
        formatStr = 'MMM';
        break;
    }

    return intervals.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      let nextDate: Date;
      
      switch (period) {
        case 'week':
          nextDate = subDays(date, -1);
          break;
        case 'month':
          nextDate = subWeeks(date, -1);
          break;
        case 'quarter':
        case 'year':
          nextDate = subMonths(date, -1);
          break;
      }

      const periodOBVs = obvs.filter(o => {
        const oDate = new Date(o.fecha || '');
        return oDate >= date && oDate < nextDate;
      });

      const periodKPIs = kpis.filter(k => {
        const kDate = new Date(k.created_at || '');
        return kDate >= date && kDate < nextDate;
      });

      return {
        date: format(date, formatStr, { locale: es }),
        obvs: periodOBVs.length,
        lps: periodKPIs.filter(k => k.type === 'LP').length,
        bps: periodKPIs.filter(k => k.type === 'BP').length,
        cps: periodKPIs.filter(k => k.type === 'CP').length,
      };
    });
  }, [obvs, kpis, period, dateRange]);

  if (loadingOBVs || loadingKPIs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="obvs" 
            name="OBVs" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
          />
          <Line 
            type="monotone" 
            dataKey="lps" 
            name="LPs" 
            stroke="#F59E0B" 
            strokeWidth={2}
            dot={{ fill: '#F59E0B' }}
          />
          <Line 
            type="monotone" 
            dataKey="bps" 
            name="BPs" 
            stroke="#22C55E" 
            strokeWidth={2}
            dot={{ fill: '#22C55E' }}
          />
          <Line 
            type="monotone" 
            dataKey="cps" 
            name="CPs" 
            stroke="#EC4899" 
            strokeWidth={2}
            dot={{ fill: '#EC4899' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
