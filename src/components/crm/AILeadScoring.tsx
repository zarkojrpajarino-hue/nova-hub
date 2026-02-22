/**
 * AI LEAD SCORING & INSIGHTS
 *
 * Componente que calcula y muestra:
 * - Puntuación de leads (lead scoring)
 * - Probabilidad de cierre
 * - Próximas mejores acciones recomendadas
 * - Priorización de leads
 *
 * Usa algoritmos heurísticos basados en:
 * - Valor potencial
 * - Tiempo en cada fase
 * - Actividad reciente
 * - Patrón histórico de conversión
 */

import { useMemo } from 'react';
import {
  TrendingUp, Target, Zap,
  DollarSign, Sparkles, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  nombre: string;
  empresa: string | null;
  status: string;
  valor_potencial: number | null;
  proxima_accion: string | null;
  proxima_accion_fecha: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AILeadScoringProps {
  leads: Lead[];
}

interface ScoredLead extends Lead {
  score: number;
  winProbability: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  scoreBreakdown: {
    valueScore: number;
    stageScore: number;
    activityScore: number;
    velocityScore: number;
  };
}

// Pesos para el cálculo del score
const SCORE_WEIGHTS = {
  value: 0.3,        // 30% basado en valor potencial
  stage: 0.25,       // 25% basado en etapa del pipeline
  activity: 0.25,    // 25% basado en actividad reciente
  velocity: 0.2,     // 20% basado en velocidad de progreso
};

// Puntuación base por etapa
const STAGE_SCORES: Record<string, number> = {
  frio: 20,
  tibio: 35,
  hot: 55,
  propuesta: 70,
  negociacion: 85,
  cerrado_ganado: 100,
  cerrado_perdido: 0,
};

// Probabilidad de cierre por etapa (baseline)
const STAGE_WIN_PROBABILITY: Record<string, number> = {
  frio: 5,
  tibio: 15,
  hot: 30,
  propuesta: 50,
  negociacion: 75,
  cerrado_ganado: 100,
  cerrado_perdido: 0,
};

export function AILeadScoring({ leads }: AILeadScoringProps) {
  const scoredLeads = useMemo(() => {
    const now = new Date();
    const maxValue = Math.max(...leads.map(l => l.valor_potencial || 0), 1);

    return leads
      .filter(l => !['cerrado_ganado', 'cerrado_perdido'].includes(l.status))
      .map((lead): ScoredLead => {
        // 1. Value Score (0-100)
        const valueScore = Math.min(((lead.valor_potencial || 0) / maxValue) * 100, 100);

        // 2. Stage Score (0-100)
        const stageScore = STAGE_SCORES[lead.status] || 0;

        // 3. Activity Score (0-100) - basado en próxima acción
        let activityScore = 50; // baseline
        if (lead.proxima_accion && lead.proxima_accion_fecha) {
          const nextActionDate = new Date(lead.proxima_accion_fecha);
          const daysUntil = Math.ceil((nextActionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntil < 0) {
            // Acción vencida
            activityScore = 30;
          } else if (daysUntil <= 3) {
            // Acción próxima
            activityScore = 90;
          } else if (daysUntil <= 7) {
            activityScore = 70;
          } else {
            activityScore = 50;
          }
        } else {
          // Sin próxima acción planificada
          activityScore = 20;
        }

        // 4. Velocity Score (0-100) - basado en tiempo desde creación/actualización
        let velocityScore = 50;
        if (lead.updated_at || lead.created_at) {
          const lastUpdate = new Date(lead.updated_at || lead.created_at!);
          const daysSinceUpdate = Math.ceil((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSinceUpdate <= 2) {
            velocityScore = 90; // Muy reciente
          } else if (daysSinceUpdate <= 7) {
            velocityScore = 70; // Reciente
          } else if (daysSinceUpdate <= 14) {
            velocityScore = 50; // Normal
          } else if (daysSinceUpdate <= 30) {
            velocityScore = 30; // Estancado
          } else {
            velocityScore = 10; // Abandonado
          }
        }

        // Calcular score total (0-100)
        const score = Math.round(
          valueScore * SCORE_WEIGHTS.value +
          stageScore * SCORE_WEIGHTS.stage +
          activityScore * SCORE_WEIGHTS.activity +
          velocityScore * SCORE_WEIGHTS.velocity
        );

        // Calcular probabilidad de cierre (ajustada por score)
        const baseWinProbability = STAGE_WIN_PROBABILITY[lead.status] || 0;
        const scoreMultiplier = score / 100;
        const winProbability = Math.round(baseWinProbability * (0.5 + scoreMultiplier * 0.5));

        // Determinar prioridad
        let priority: 'high' | 'medium' | 'low' = 'low';
        if (score >= 70) priority = 'high';
        else if (score >= 40) priority = 'medium';

        // Generar recomendación
        let recommendation = '';
        if (activityScore <= 30) {
          recommendation = '⚠️ Programar próxima acción urgente';
        } else if (velocityScore <= 30) {
          recommendation = '🔄 Retomar contacto - lleva mucho tiempo inactivo';
        } else if (stageScore >= 70 && activityScore >= 70) {
          recommendation = '🎯 Alta prioridad - preparar cierre';
        } else if (lead.status === 'frio' && valueScore >= 70) {
          recommendation = '💎 Alto valor - calentar lead';
        } else if (lead.status === 'hot') {
          recommendation = '📝 Enviar propuesta comercial';
        } else if (lead.status === 'propuesta') {
          recommendation = '📞 Hacer seguimiento de propuesta';
        } else if (lead.status === 'negociacion') {
          recommendation = '✅ Cerrar términos finales';
        } else {
          recommendation = '📈 Avanzar en el pipeline';
        }

        return {
          ...lead,
          score,
          winProbability,
          priority,
          recommendation,
          scoreBreakdown: {
            valueScore: Math.round(valueScore),
            stageScore: Math.round(stageScore),
            activityScore: Math.round(activityScore),
            velocityScore: Math.round(velocityScore),
          },
        };
      })
      .sort((a, b) => b.score - a.score); // Ordenar por score descendente
  }, [leads]);

  const topLeads = scoredLeads.slice(0, 10);
  const highPriorityCount = scoredLeads.filter(l => l.priority === 'high').length;
  const avgWinProbability = Math.round(
    scoredLeads.reduce((sum, l) => sum + l.winProbability, 0) / scoredLeads.length || 0
  );
  const totalPotentialValue = scoredLeads.reduce((sum, l) => sum + (l.valor_potencial || 0), 0);
  const weightedValue = scoredLeads.reduce((sum, l) => sum + (l.valor_potencial || 0) * (l.winProbability / 100), 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            Insights con IA
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Beta
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground">
            Análisis predictivo y recomendaciones para priorizar leads
          </p>
        </div>
      </div>

      {/* Métricas Globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alta Prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-red-600">{highPriorityCount}</div>
              <Target className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Leads para enfocar ahora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prob. Cierre Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-blue-600">{avgWinProbability}%</div>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Del pipeline activo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">€{Math.round(totalPotentialValue).toLocaleString()}</div>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pipeline total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Ponderado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-green-600">€{Math.round(weightedValue).toLocaleString()}</div>
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por probabilidad</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Top 10 Leads Priorizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topLeads.map((lead, i) => (
              <div
                key={lead.id}
                className="p-4 rounded-xl border bg-card hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                      i === 0 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-black",
                      i === 1 && "bg-gradient-to-br from-slate-300 to-slate-400 text-black",
                      i === 2 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
                      i > 2 && "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{lead.nombre}</h4>
                        <Badge className={cn("text-xs", getPriorityColor(lead.priority))}>
                          {lead.priority === 'high' && '🔥 Alta'}
                          {lead.priority === 'medium' && '⚡ Media'}
                          {lead.priority === 'low' && '📌 Baja'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{lead.empresa || 'Sin empresa'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={cn("text-3xl font-bold", getScoreColor(lead.score))}>
                      {lead.score}
                    </div>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Prob. Cierre</span>
                      <span className="font-medium">{lead.winProbability}%</span>
                    </div>
                    <Progress value={lead.winProbability} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Valor</span>
                      <span className="font-medium">€{(lead.valor_potencial || 0).toLocaleString()}</span>
                    </div>
                    <Progress
                      value={(lead.scoreBreakdown.valueScore)}
                      className="h-1.5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{lead.recommendation}</p>
                </div>

                {/* Score Breakdown (collapsible) */}
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Ver desglose del score
                  </summary>
                  <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded">
                    <div>
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="ml-2 font-medium">{lead.scoreBreakdown.valueScore}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Etapa:</span>
                      <span className="ml-2 font-medium">{lead.scoreBreakdown.stageScore}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Actividad:</span>
                      <span className="ml-2 font-medium">{lead.scoreBreakdown.activityScore}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Velocidad:</span>
                      <span className="ml-2 font-medium">{lead.scoreBreakdown.velocityScore}</span>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
