import { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import type { MemberStats } from '@/hooks/useNovaData';

interface PartnerRadarChartProps {
  members: MemberStats[];
}

export function PartnerRadarChart({ members }: PartnerRadarChartProps) {
  const data = useMemo(() => {
    if (members.length === 0) return [];

    // Normalize data to percentage (0-100) for fair comparison
    const maxValues = {
      obvs: Math.max(...members.map(m => Number(m.obvs) || 0), 1),
      lps: Math.max(...members.map(m => Number(m.lps) || 0), 1),
      bps: Math.max(...members.map(m => Number(m.bps) || 0), 1),
      cps: Math.max(...members.map(m => Number(m.cps) || 0), 1),
      facturacion: Math.max(...members.map(m => Number(m.facturacion) || 0), 1),
      margen: Math.max(...members.map(m => Number(m.margen) || 0), 1),
    };

    const metrics = [
      { name: 'OBVs', key: 'obvs' },
      { name: 'LPs', key: 'lps' },
      { name: 'BPs', key: 'bps' },
      { name: 'CPs', key: 'cps' },
      { name: 'Facturación', key: 'facturacion' },
      { name: 'Margen', key: 'margen' },
    ];

    return metrics.map(metric => {
      const point: Record<string, unknown> = { metric: metric.name };
      members.forEach(member => {
        const value = Number(member[metric.key as keyof MemberStats]) || 0;
        const maxVal = maxValues[metric.key as keyof typeof maxValues];
        point[member.nombre || 'Unknown'] = Math.round((value / maxVal) * 100);
      });
      return point;
    });
  }, [members]);

  const colors = ['#6366F1', '#22C55E', '#F59E0B', '#EC4899'];

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-center">
          Selecciona 2-3 socios de la tabla<br />
          para compararlos en el radar
        </p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          {members.map((member, index) => (
            <Radar
              key={member.id}
              name={member.nombre || 'Unknown'}
              dataKey={member.nombre || 'Unknown'}
              stroke={member.color || colors[index % colors.length]}
              fill={member.color || colors[index % colors.length]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value}%`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
