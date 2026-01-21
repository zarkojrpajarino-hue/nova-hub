import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface FinancialMetric {
  project_id: string;
  project_name: string;
  project_color: string;
  facturacion: number;
}

interface ProjectBreakdownChartProps {
  data: FinancialMetric[];
}

export function ProjectBreakdownChart({ data }: ProjectBreakdownChartProps) {
  const chartData = useMemo(() => {
    // Group by project
    const projectTotals = new Map<string, { name: string; value: number; color: string }>();
    
    data.forEach(item => {
      const existing = projectTotals.get(item.project_id);
      if (existing) {
        existing.value += Number(item.facturacion) || 0;
      } else {
        projectTotals.set(item.project_id, {
          name: item.project_name,
          value: Number(item.facturacion) || 0,
          color: item.project_color || '#6366F1',
        });
      }
    });

    return Array.from(projectTotals.values())
      .filter(p => p.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const total = chartData.reduce((sum, p) => sum + p.value, 0);

  const formatCurrency = (value: number) => `€${value.toLocaleString('es-ES')}`;

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-500" />
            Por Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No hay datos por proyecto
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-purple-500" />
          Por Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="mt-4 space-y-2">
          {chartData.map((project, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: project.color }}
                />
                <span>{project.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  {((project.value / total) * 100).toFixed(0)}%
                </span>
                <span className="font-medium">{formatCurrency(project.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
