/**
 * EVOLUTION CHART
 *
 * Gráfico de evolución temporal de KPIs
 * Usa Recharts para visualización profesional
 */

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';

interface EvolutionChartProps {
  data: Array<{
    week: string;
    obvs?: number;
    facturacion?: number;
    leads?: number;
    tareas?: number;
  }>;
}

type MetricType = 'obvs' | 'facturacion' | 'leads' | 'tareas' | 'all';

const METRICS = [
  { value: 'all', label: 'Todas las métricas' },
  { value: 'obvs', label: 'OBVs', color: '#6366F1' },
  { value: 'facturacion', label: 'Facturación', color: '#10B981' },
  { value: 'leads', label: 'Leads', color: '#F59E0B' },
  { value: 'tareas', label: 'Tareas', color: '#8B5CF6' },
] as const;

export function EvolutionChart({ data }: EvolutionChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('all');

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const formatTooltip = (value: number, name: string) => {
    if (name === 'facturacion') {
      return [`€${value.toLocaleString('es-ES')}`, 'Facturación'];
    }
    return [value, name.charAt(0).toUpperCase() + name.slice(1)];
  };

  const renderLines = () => {
    if (selectedMetric === 'all') {
      return (
        <>
          <Line
            type="monotone"
            dataKey="obvs"
            stroke="#6366F1"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="OBVs"
          />
          <Line
            type="monotone"
            dataKey="facturacion"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="facturacion"
          />
          <Line
            type="monotone"
            dataKey="leads"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Leads"
          />
          <Line
            type="monotone"
            dataKey="tareas"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Tareas"
          />
        </>
      );
    }

    const metric = METRICS.find((m) => m.value === selectedMetric);
    if (!metric || !metric.color) return null;

    return (
      <Line
        type="monotone"
        dataKey={selectedMetric}
        stroke={metric.color}
        strokeWidth={3}
        dot={{ r: 5 }}
        activeDot={{ r: 7 }}
        name={metric.label}
      />
    );
  };

  return (
    <Card className="elevation-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Evolución Semanal</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Últimas {data.length} semanas
              </p>
            </div>
          </div>

          <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map((metric) => (
                <SelectItem key={metric.value} value={metric.value}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ strokeOpacity: 0.3 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ strokeOpacity: 0.3 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={formatTooltip}
            />
            {selectedMetric === 'all' && (
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                }}
                iconType="line"
              />
            )}
            {renderLines()}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
