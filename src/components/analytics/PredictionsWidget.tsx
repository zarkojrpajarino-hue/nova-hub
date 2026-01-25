import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { useObjectives } from '@/hooks/useNovaData';
import type { MemberStats } from '@/hooks/useNovaData';
import { differenceInDays } from 'date-fns';

interface PredictionsWidgetProps {
  members: MemberStats[];
  period: 'week' | 'month' | 'quarter' | 'year';
}

interface Prediction {
  metric: string;
  current: number;
  target: number;
  projected: number;
  percentageOfTarget: number;
  trend: 'up' | 'down' | 'stable';
  status: 'on_track' | 'at_risk' | 'behind';
  message: string;
}

export function PredictionsWidget({ members }: PredictionsWidgetProps) {
  const { data: objectives = [] } = useObjectives();

  const predictions = useMemo((): Prediction[] => {
    // Calculate current totals
    const totals = members.reduce((acc, m) => ({
      obvs: acc.obvs + (Number(m.obvs) || 0),
      lps: acc.lps + (Number(m.lps) || 0),
      bps: acc.bps + (Number(m.bps) || 0),
      cps: acc.cps + (Number(m.cps) || 0),
      facturacion: acc.facturacion + (Number(m.facturacion) || 0),
      margen: acc.margen + (Number(m.margen) || 0),
    }), { obvs: 0, lps: 0, bps: 0, cps: 0, facturacion: 0, margen: 0 });

    // Team objectives (9 members * semester objectives)
    const objectivesMap: Record<string, number> = {
      obvs: 150 * 9,
      lps: 18 * 9,
      bps: 66 * 9,
      cps: 40 * 9,
      facturacion: 15000 * 9,
      margen: 7500 * 9,
    };
    
    objectives.forEach(obj => {
      objectivesMap[obj.name] = obj.target_value * 9;
    });

    // Calculate time progress in semester (assuming 6 months)
    const now = new Date();
    const semesterStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
    const semesterEnd = new Date(now.getFullYear(), now.getMonth() < 6 ? 6 : 12, 0);
    const totalDays = differenceInDays(semesterEnd, semesterStart);
    const elapsedDays = differenceInDays(now, semesterStart);
    const timeProgress = elapsedDays / totalDays;

    // Calculate projections based on current pace
    const metrics = [
      { key: 'obvs', label: 'OBVs', format: (v: number) => v.toString() },
      { key: 'lps', label: 'Learning Paths', format: (v: number) => v.toString() },
      { key: 'bps', label: 'Book Points', format: (v: number) => v.toString() },
      { key: 'cps', label: 'Community Points', format: (v: number) => v.toString() },
      { key: 'facturacion', label: 'Facturación', format: (v: number) => `€${(v/1000).toFixed(0)}K` },
      { key: 'margen', label: 'Margen', format: (v: number) => `€${(v/1000).toFixed(0)}K` },
    ];

    return metrics.map(({ key, label }) => {
      const current = totals[key as keyof typeof totals];
      const target = objectivesMap[key];
      
      // Project based on current pace
      const dailyRate = current / Math.max(elapsedDays, 1);
      const projected = Math.round(dailyRate * totalDays);
      const percentageOfTarget = Math.round((projected / target) * 100);
      
      // Expected progress at this point in time
      const expectedProgress = timeProgress * target;
      const progressDiff = current - expectedProgress;
      
      let trend: 'up' | 'down' | 'stable';
      let status: 'on_track' | 'at_risk' | 'behind';
      let message: string;

      if (progressDiff >= 0) {
        trend = 'up';
        if (percentageOfTarget >= 100) {
          status = 'on_track';
          message = `🎯 Proyección: ${percentageOfTarget}% del objetivo`;
        } else if (percentageOfTarget >= 80) {
          status = 'on_track';
          message = `✅ Ritmo bueno: llegaréis al ${percentageOfTarget}%`;
        } else {
          status = 'at_risk';
          message = `⚠️ Por encima del ritmo pero llegaréis al ${percentageOfTarget}%`;
        }
      } else {
        const daysBelow = Math.abs(progressDiff) / dailyRate;
        if (daysBelow <= 7) {
          trend = 'stable';
          status = 'at_risk';
          message = `⚠️ Ligeramente por debajo: proyección ${percentageOfTarget}%`;
        } else {
          trend = 'down';
          status = 'behind';
          message = `🔴 En riesgo: solo ${percentageOfTarget}% si mantenéis ritmo`;
        }
      }

      return {
        metric: label,
        current,
        target,
        projected,
        percentageOfTarget,
        trend,
        status,
        message,
      };
    });
  }, [members, objectives]);

  const getStatusIcon = (status: Prediction['status']) => {
    switch (status) {
      case 'on_track': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'at_risk': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'behind': return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-primary';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Predicciones de Objetivo Semestral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Proyección lineal basada en el ritmo actual del equipo. Si mantenéis el ritmo actual hasta fin de semestre:
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            {predictions.map((pred) => (
              <div 
                key={pred.metric}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(pred.status)}
                    <span className="font-medium">{pred.metric}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {pred.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {pred.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                    <span className={pred.percentageOfTarget >= 80 ? 'text-green-600' : 'text-red-500'}>
                      {pred.percentageOfTarget}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Actual: {pred.current}</span>
                    <span>Objetivo: {pred.target}</span>
                  </div>
                  <Progress 
                    value={Math.min(pred.percentageOfTarget, 100)} 
                    className="h-2"
                  />
                </div>

                <p className="text-sm">{pred.message}</p>

                <div className="text-xs text-muted-foreground">
                  Proyección final: <span className="font-medium">{pred.projected}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {predictions.filter(p => p.status === 'on_track').length}
              </div>
              <div className="text-sm text-muted-foreground">En buen camino</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {predictions.filter(p => p.status === 'at_risk').length}
              </div>
              <div className="text-sm text-muted-foreground">En riesgo</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {predictions.filter(p => p.status === 'behind').length}
              </div>
              <div className="text-sm text-muted-foreground">Por detrás</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
