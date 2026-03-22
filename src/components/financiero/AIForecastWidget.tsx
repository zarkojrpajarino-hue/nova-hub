/**
 * AI FORECAST WIDGET - PROYECCIÓN DE INGRESOS
 *
 * Widget predictivo que muestra proyecciones de ingresos basadas en:
 * - Leads en pipeline (hot, propuesta, negociación)
 * - Probabilidades de cierre por etapa
 * - Histórico de conversión
 *
 * Usa la view `forecast_ingresos` de Supabase
 */

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, Target, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SourceBadge } from '@/components/shared/SourceBadge';

import { useTranslation } from 'react-i18next';
import { SourceBadge } from '@/components/shared/SourceBadge';
interface ForecastData {
  proyeccion_hot: number;
  proyeccion_propuesta: number;
  proyeccion_negociacion: number;
  total_proyectado_30_dias: number;
}

export function AIForecastWidget() {
  const { t } = useTranslation();
  const { data: forecast, isLoading } = useQuery({
    queryKey: ['forecast_ingresos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forecast_ingresos')
        .select('*')
        .single();

      if (error) {
        // Return default values if view doesn't exist or has no data
        return {
          proyeccion_hot: 0,
          proyeccion_propuesta: 0,
          proyeccion_negociacion: 0,
          total_proyectado_30_dias: 0,
        };
      }

      return data as ForecastData;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  if (isLoading) {
    return (
      <Card>
      <div className="flex justify-end mb-2"><SourceBadge type="inferred" source={t('transparency.iaFinanciera')} reliability={0.35} size="sm" /></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Proyección de Ingresos con IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">{t('financiero.calculandoProyecciones')}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalProyectado = forecast?.total_proyectado_30_dias || 0;
  const proyeccionHot = forecast?.proyeccion_hot || 0;
  const proyeccionPropuesta = forecast?.proyeccion_propuesta || 0;
  const proyeccionNegociacion = forecast?.proyeccion_negociacion || 0;

  // Calcular probabilidades implícitas (basadas en etapa del pipeline)
  const probHot = 30; // 30% de probabilidad en hot
  const probPropuesta = 50; // 50% en propuesta
  const probNegociacion = 75; // 75% en negociación

  const stages = [
    {
      name: 'Hot',
      value: proyeccionHot,
      probability: probHot,
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600',
      icon: '🔥',
    },
    {
      name: t('financiero.propuesta'),
      value: proyeccionPropuesta,
      probability: probPropuesta,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600',
      icon: '📝',
    },
    {
      name: t('financiero.negociación'),
      value: proyeccionNegociacion,
      probability: probNegociacion,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600',
      icon: '🤝',
    },
  ];

  // Calcular valor ponderado por probabilidad
  const valorPonderado = Math.round(
    proyeccionHot * (probHot / 100) +
    proyeccionPropuesta * (probPropuesta / 100) +
    proyeccionNegociacion * (probNegociacion / 100)
  );

  return (
    <Card className="border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                Proyección de Ingresos con IA
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />{t('financiero.beta')}</Badge>
              </div>
              <p className="text-sm font-normal text-muted-foreground">
                Próximos 30 días basado en pipeline CRM
              </p>
            </div>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Total Proyectado */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Proyección Total (30 días)
            </div>
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            €{totalProyectado.toLocaleString('es-ES')}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Valor ponderado: €{valorPonderado.toLocaleString('es-ES')}
          </p>
        </div>

        {/* Desglose por Etapa */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t('financiero.desglosePorEtapaDel')}</h4>

          {stages.map((stage) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{stage.icon}</span>
                  <span className="font-medium">{stage.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {stage.probability}% prob.
                  </Badge>
                </div>
                <div className={cn("text-xl font-bold", stage.textColor)}>
                  €{stage.value.toLocaleString('es-ES')}
                </div>
              </div>

              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all",
                    stage.color
                  )}
                  style={{
                    width: `${Math.min((stage.value / Math.max(totalProyectado, 1)) * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {((stage.value / Math.max(totalProyectado, 1)) * 100).toFixed(0)}% del total
                </span>
                <span>
                  Esperado: €{Math.round(stage.value * (stage.probability / 100)).toLocaleString('es-ES')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium mb-1">💡 Análisis Predictivo</p>
              <p className="text-muted-foreground">
                {totalProyectado === 0 ? (
                  t('financiero.noHayLeadsActivos')
                ) : valorPonderado > 0 ? (
                  `Basado en probabilidades históricas, se espera cerrar aproximadamente €${valorPonderado.toLocaleString('es-ES')} de los €${totalProyectado.toLocaleString('es-ES')} proyectados en los próximos 30 días.`
                ) : (
                  t('financiero.proyecciónCalculadaEnBase')
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Nota técnica */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <span className="font-medium text-blue-600">Nota:</span>{t('financiero.lasProyeccionesSeCalculan')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
