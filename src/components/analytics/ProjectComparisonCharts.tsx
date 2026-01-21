import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

interface ProjectStat {
  id?: string;
  nombre?: string;
  color?: string;
  facturacion?: number;
  margen?: number;
  total_obvs?: number;
  total_leads?: number;
  leads_ganados?: number;
}

interface ProjectComparisonChartsProps {
  projectStats: ProjectStat[];
  onExportCSV: (data: unknown[]) => void;
}

export function ProjectComparisonCharts({ projectStats, onExportCSV }: ProjectComparisonChartsProps) {
  const billingData = projectStats.map(p => ({
    name: p.nombre || 'Sin nombre',
    facturacion: Number(p.facturacion) || 0,
    margen: Number(p.margen) || 0,
    color: p.color || '#6366F1',
  }));

  const obvsData = projectStats.map(p => ({
    name: p.nombre || 'Sin nombre',
    obvs: Number(p.total_obvs) || 0,
    color: p.color || '#6366F1',
  }));

  const leadsData = projectStats.map(p => ({
    name: p.nombre || 'Sin nombre',
    total: Number(p.total_leads) || 0,
    ganados: Number(p.leads_ganados) || 0,
    conversion: p.total_leads ? Math.round((Number(p.leads_ganados) / Number(p.total_leads)) * 100) : 0,
    color: p.color || '#6366F1',
  }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.name}: {typeof entry.value === 'number' && entry.name.includes('€') 
              ? `€${entry.value.toLocaleString()}`
              : entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Billing Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Facturación y Margen por Proyecto</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onExportCSV(billingData)}>
            <Download className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={billingData} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" tickFormatter={(v) => `€${v/1000}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="facturacion" name="Facturación €" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                  {billingData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="margen" name="Margen €" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* OBVs Chart */}
        <Card>
          <CardHeader>
            <CardTitle>OBVs por Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={obvsData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="obvs" name="OBVs" radius={[4, 4, 0, 0]}>
                    {obvsData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leads Conversion Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Leads: Convertidos vs Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0]?.payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium mb-1">{label}</p>
                          <p className="text-sm">Total: {data?.total}</p>
                          <p className="text-sm text-green-600">Ganados: {data?.ganados}</p>
                          <p className="text-sm font-medium">Conversión: {data?.conversion}%</p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Total Leads" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ganados" name="Ganados" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
