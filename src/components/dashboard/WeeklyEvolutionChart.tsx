import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';

export function WeeklyEvolutionChart() {
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['weekly_evolution'],
    queryFn: async () => {
      const weeks = [];
      const today = new Date();

      // Get last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        weeks.push({
          start: weekStart,
          end: weekEnd,
          label: format(weekStart, 'd MMM', { locale: es }),
        });
      }

      // Query OBVs grouped by week
      const { data: obvs } = await supabase
        .from('obvs')
        .select('created_at, tipo')
        .gte('created_at', weeks[0].start.toISOString())
        .order('created_at', { ascending: true });

      // Query KPIs grouped by week
      const { data: kpis } = await supabase
        .from('kpis')
        .select('created_at, type')
        .gte('created_at', weeks[0].start.toISOString())
        .order('created_at', { ascending: true });

      // Aggregate data by week
      return weeks.map(week => {
        const weekOBVs = obvs?.filter(o => {
          const date = new Date(o.created_at);
          return date >= week.start && date <= week.end;
        }) || [];

        const weekKPIs = kpis?.filter(k => {
          const date = new Date(k.created_at);
          return date >= week.start && date <= week.end;
        }) || [];

        return {
          name: week.label,
          OBVs: weekOBVs.length,
          LPs: weekKPIs.filter(k => k.type === 'lp').length,
          BPs: weekKPIs.filter(k => k.type === 'bp').length,
          CPs: weekKPIs.filter(k => k.type === 'cp').length,
        };
      });
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-4">
          <TrendingUp size={18} className="text-primary" />
          <h3 className="font-semibold">Evolución Semanal</h3>
        </div>
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <TrendingUp size={18} className="text-primary" />
        <h3 className="font-semibold">Evolución Semanal</h3>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11 }} 
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 11 }} 
              stroke="hsl(var(--muted-foreground))"
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
            <Line 
              type="monotone" 
              dataKey="OBVs" 
              stroke="#6366F1" 
              strokeWidth={2}
              dot={{ fill: '#6366F1', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="LPs" 
              stroke="#F59E0B" 
              strokeWidth={2}
              dot={{ fill: '#F59E0B', strokeWidth: 0, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="BPs" 
              stroke="#22C55E" 
              strokeWidth={2}
              dot={{ fill: '#22C55E', strokeWidth: 0, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
