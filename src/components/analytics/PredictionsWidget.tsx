import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { useObjectives } from '@/hooks/useNovaData';
import type { MemberStats } from '@/hooks/useNovaData';
import { differenceInDays } from 'date-fns';
import { PREMIUM_DEMO_DATA } from '@/data/premiumDemoData';
import { SourceBadge } from '@/components/shared/SourceBadge';

import { useTranslation } from 'react-i18next';
import { SourceBadge } from '@/components/shared/SourceBadge';
interface PredictionsWidgetProps {
  members: MemberStats[];
  period: 'week' | 'month' | 'quarter' | 'year';
  isDemoMode?: boolean;
}

interface Prediction {
  metric: string;
  current: number;
  target: number;
  projected: number;
  percentageOfTarget: number;
  trend: 'up' | 'down' | 'stable';
  // Neutral labels — no collision with Engine's risk_level / viability_status
  status: 'on_track' | 'below_pace' | 'off_track';
  message: string;
}

export function PredictionsWidget({ members, isDemoMode = false }: PredictionsWidgetProps) {
  const { t } = useTranslation();
  const { data: objectives = [] } = useObjectives({ enabled: !isDemoMode });

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

    // Team objectives (per-member semester objectives × team size)
    const teamSize = Math.max(members.length, 1);
    const objectivesMap: Record<string, number> = {
      obvs: 150 * teamSize,
      lps: 18 * teamSize,
      bps: 66 * teamSize,
      cps: 40 * teamSize,
      facturacion: 15000 * teamSize,
      margen: 7500 * teamSize,
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
      { key: 'obvs', label: t('analytics.obvs'), format: (v: number) => v.toString() },
      { key: 'lps', label: t('analytics.learningPaths'), format: (v: number) => v.toString() },
      { key: 'bps', label: t('analytics.bookPoints'), format: (v: number) => v.toString() },
      { key: 'cps', label: t('analytics.communityPoints'), format: (v: number) => v.toString() },
      { key: 'facturacion', label: t('analytics.facturación'), format: (v: number) => `€${(v/1000).toFixed(0)}K` },
      { key: 'margen', label: t('analytics.margen'), format: (v: number) => `€${(v/1000).toFixed(0)}K` },
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
      let status: 'on_track' | 'below_pace' | 'off_track';
      let message: string;

      if (progressDiff >= 0) {
        trend = 'up';
        if (percentageOfTarget >= 100) {
          status = 'on_track';
          message = `Proyección: ${percentageOfTarget}% del objetivo`;
        } else if (percentageOfTarget >= 80) {
          status = 'on_track';
          message = `Ritmo suficiente: llegaréis al ${percentageOfTarget}%`;
        } else {
          status = 'below_pace';
          message = `Por encima del ritmo, proyección ${percentageOfTarget}%`;
        }
      } else {
        const daysBelow = Math.abs(progressDiff) / Math.max(dailyRate, 0.001);
        if (daysBelow <= 7) {
          trend = 'stable';
          status = 'below_pace';
          message = `Ligeramente por debajo: proyección ${percentageOfTarget}%`;
        } else {
          trend = 'down';
          status = 'off_track';
          message = `Fuera de ritmo: solo ${percentageOfTarget}% si mantenéis el paso`;
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
      case 'on_track':   return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'below_pace': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'off_track':  return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  // getProgressColor removed - not currently used

  // 🎯 Si está en modo demo, mostrar predicciones perfectas
  if (isDemoMode) {
    const demoPred = PREMIUM_DEMO_DATA.analytics.predictions;

    return (
      <div className="space-y-6">
        {/* Revenue Prediction Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Predicción de Revenue IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('analytics.proyecciónPróximoMes')}</p>
                <p className="text-3xl font-bold text-primary">
                  ${(demoPred.next_month_revenue / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t('analytics.confianza')}</p>
                <div className="flex items-center gap-2">
                  <Progress value={demoPred.confidence} className="h-2 w-20" />
                  <span className="text-lg font-semibold text-green-600">{demoPred.confidence}%</span>
                </div>
              </div>
        <SourceBadge type="estimated" source={t('transparency.prediccionLineal')} reliability={0.3} size="sm" />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Growth rate: +{demoPred.growth_rate}% vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Recomendaciones IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{t('analytics.basadoEnAnálisisPredictivo')}</p>

            <div className="space-y-3">
              {demoPred.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg hover-lift transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge
                            variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {rec.priority === 'high' ? 'Alta prioridad': t('analytics.mediaPrioridad')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <p className="text-xs font-medium text-primary">
                          Impacto estimado: {rec.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />{t('analytics.prediccionesDeObjetivoSemestral')}</CardTitle>
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
          <CardTitle>{t('analytics.resumenDeEstado')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {predictions.filter(p => p.status === 'on_track').length}
              </div>
              <div className="text-sm text-muted-foreground">{t('analytics.enRitmo')}</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {predictions.filter(p => p.status === 'below_pace').length}
              </div>
              <div className="text-sm text-muted-foreground">{t('analytics.porDebajo')}</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {predictions.filter(p => p.status === 'off_track').length}
              </div>
              <div className="text-sm text-muted-foreground">{t('analytics.fueraDeRitmo')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
