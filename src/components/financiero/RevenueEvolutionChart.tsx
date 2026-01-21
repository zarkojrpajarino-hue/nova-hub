import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface FinancialMetric {
  project_id: string;
  project_name: string;
  project_color: string;
  month: string;
  facturacion: number;
  costes: number;
  margen: number;
  num_ventas: number;
  margen_percent: number;
  cobrado: number;
  pendiente_cobro: number;
}

interface RevenueEvolutionChartProps {
  data: FinancialMetric[];
}

export function RevenueEvolutionChart({ data }: RevenueEvolutionChartProps) {
  const chartData = useMemo(() => {
    // Group by month and aggregate
    const monthlyData = new Map<string, { month: string; facturacion: number; margen: number; costes: number }>();
    
    data.forEach(item => {
      const monthKey = new Date(item.month).toISOString().slice(0, 7);
      const existing = monthlyData.get(monthKey) || {
        month: monthKey,
        facturacion: 0,
        margen: 0,
        costes: 0,
      };
      
      monthlyData.set(monthKey, {
        month: monthKey,
        facturacion: existing.facturacion + (Number(item.facturacion) || 0),
        margen: existing.margen + (Number(item.margen) || 0),
        costes: existing.costes + (Number(item.costes) || 0),
      });
    });

    // Sort by month and format
    return Array.from(monthlyData.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
      .map(item => ({
        ...item,
        monthLabel: new Date(item.month + '-01').toLocaleDateString('es-ES', { 
          month: 'short',
          year: '2-digit'
        }),
      }));
  }, [data]);

  const formatCurrency = (value: number) => `€${value.toLocaleString('es-ES')}`;

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Evolución Mensual
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No hay datos financieros aún
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Evolución Mensual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="monthLabel" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip 
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="facturacion" 
              name="Facturación"
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="margen" 
              name="Margen"
              stroke="#22C55E" 
              strokeWidth={2}
              dot={{ fill: '#22C55E', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
