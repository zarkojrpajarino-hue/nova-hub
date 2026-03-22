/**
 * ANALYTICS PREVIEW MODAL
 *
 * Modal interactivo que muestra TODAS las funcionalidades de Analytics
 * con datos demo enterprise-level perfectos.
 *
 * Se activa desde el botón t('preview.verSecciónEnAcción') en HowItWorks
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  Sparkles,
  Target,
  Activity,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { PREMIUM_DEMO_DATA } from '@/data/premiumDemoData';

import { useTranslation } from 'react-i18next';
interface AnalyticsPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SLIDES = [
  {
    id: 'intro',
    title: t('preview.analyticsTuCentroDe'),
    icon: BarChart3,
    description: t('preview.análisisAvanzadoConIa'),
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Métricas globales impresionantes */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('preview.totalRevenue')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                ${(PREMIUM_DEMO_DATA.analytics.metrics.totalRevenue / 1000).toFixed(1)}K
              </p>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <TrendingUp className="w-4 h-4" />
                <span>+{PREMIUM_DEMO_DATA.analytics.metrics.monthlyGrowth}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                ${(PREMIUM_DEMO_DATA.analytics.metrics.mrr / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ARR: ${(PREMIUM_DEMO_DATA.analytics.metrics.arr / 1000).toFixed(0)}K
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('preview.teamHealth')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {PREMIUM_DEMO_DATA.analytics.metrics.avgProjectHealth}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {PREMIUM_DEMO_DATA.analytics.metrics.teamMembers} miembros activos
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />{t('preview.quéPuedesHacerCon')}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{t('preview.compararPerformanceDeSocios')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{t('preview.analizarEvoluciónTemporalDe')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Ver heatmap de actividad del equipo (últimos 6 meses)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{t('preview.obtenerPrediccionesIaDe')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>{t('preview.exportarReportesAExcelpdf')}</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'partners-comparison',
    title: t('preview.comparativaDeSocios'),
    icon: Users,
    description: t('preview.comparaPerformanceRevenueY'),
    content: (
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm font-medium mb-2">
            🎯 Ejemplo: Top 3 Performers
            <span className="text-xs text-muted-foreground ml-2">(Pasa el ratón por cada fila)</span>
          </p>
          <div className="space-y-2">
            {PREMIUM_DEMO_DATA.analytics.partners.slice(0, 3).map((partner, idx) => (
              <div
                key={partner.id}
                className="group relative flex items-center justify-between p-2 rounded-lg bg-background border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              >
                {/* Hover tooltip con más info */}
                <div className="absolute left-0 top-full mt-2 w-full p-3 rounded-lg bg-popover border shadow-xl z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">{t('preview.obvs')}</p>
                      <p className="font-semibold">{partner.obvs_creadas} / {partner.obvs_validadas}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('preview.kpis')}</p>
                      <p className="font-semibold">{partner.lps} LPs, {partner.bps} BPs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('preview.tasks')}</p>
                      <p className="font-semibold">{partner.tareas_completadas}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{partner.nombre}</p>
                    <p className="text-xs text-muted-foreground">{partner.rol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600 group-hover:text-green-500 transition-colors">
                    ${(partner.facturacion / 1000).toFixed(1)}K
                  </p>
                  <Badge variant="secondary" className="text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Efficiency: {partner.efficiency_score}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-card">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">{t('preview.métricasClave')}</h4>
            <ul className="space-y-1 text-xs">
              <li>✓ Facturación total</li>
              <li>✓ Margen de beneficio</li>
              <li>✓ OBVs creadas y validadas</li>
              <li>✓ KPIs (LPs, BPs, CPs)</li>
              <li>✓ Tareas completadas</li>
              <li>✓ Efficiency score</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">{t('preview.visualizaciones')}</h4>
            <ul className="space-y-1 text-xs">
              <li>📊 Tabla sorteable por columna</li>
              <li>📈 Radar chart comparativo</li>
              <li>🎯 Selección múltiple (hasta 3)</li>
              <li>💾 Exportar a Excel/PDF</li>
              <li>🔍 Filtros por proyecto</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'projects-comparison',
    title: t('preview.comparativaDeProyectos'),
    icon: Target,
    description: t('preview.analizaHealthScoreRevenue'),
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          💡 Haz click en cada proyecto para ver detalles expandidos
        </p>
        <div className="grid grid-cols-3 gap-3">
          {PREMIUM_DEMO_DATA.analytics.projects.map((project, idx) => (
            <Card
              key={project.id}
              className="border-primary/10 hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
              style={{
                animation: `slideIn 0.4s ease-out ${idx * 0.1}s both`
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-2xl group-hover:scale-125 transition-transform">{project.icon}</span>
                  <span className="truncate group-hover:text-primary transition-colors">{project.nombre}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('preview.health')}</span>
                  <span className="font-bold text-green-600 group-hover:scale-110 transition-transform inline-block">
                    {project.health_score}%
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={project.health_score}
                    className="h-2 group-hover:h-3 transition-all"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 animate-shimmer"
                    style={{ animation: 'shimmer 2s infinite' }}
                  />
                </div>
                <div className="pt-2 space-y-1 text-xs">
                  <div className="flex justify-between group-hover:bg-primary/5 p-1 rounded transition-colors">
                    <span className="text-muted-foreground">{t('preview.revenue')}</span>
                    <span className="font-semibold">${(project.revenue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between group-hover:bg-primary/5 p-1 rounded transition-colors">
                    <span className="text-muted-foreground">{t('preview.team')}</span>
                    <span className="font-semibold">{project.team_size} members</span>
                  </div>
                  <div className="flex justify-between group-hover:bg-primary/5 p-1 rounded transition-colors">
                    <span className="text-muted-foreground">{t('preview.leadsWon')}</span>
                    <span className="font-semibold text-green-600">{project.leads_ganados}/{project.leads}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm font-medium mb-2">💡 Insights Automáticos</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• t('preview.enterpriseSaasPlatform') tiene el health score más alto (95%)</li>
            <li>• Revenue total combinado: $245K</li>
            <li>• Tasa de conversión promedio de leads: 51%</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'temporal-evolution',
    title: t('preview.evoluciónTemporal'),
    icon: Calendar,
    description: t('preview.trackingDeRevenueTasks'),
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border bg-gradient-to-r from-green-500/10 to-blue-500/10">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />{t('preview.últimos6MesesTendencias')}</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Revenue Growth<span className="text-[10px]">(Pasa el ratón)</span>
              </p>
              <div className="flex items-baseline gap-2 h-[100px]">
                {PREMIUM_DEMO_DATA.analytics.temporal.revenue.map((val, idx) => (
                  <div
                    key={idx}
                    className="group relative flex-1 bg-green-500 rounded-t hover:bg-green-400 transition-all duration-300 cursor-pointer"
                    style={{
                      height: `${(val / 60000) * 100}px`,
                      animation: `growUp 0.6s ease-out ${idx * 0.1}s both`
                    }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs font-semibold">
                      ${(val / 1000).toFixed(1)}K
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-popover" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{PREMIUM_DEMO_DATA.analytics.temporal.labels[0]}</span>
                <span>{PREMIUM_DEMO_DATA.analytics.temporal.labels[5]}</span>
              </div>
              <p className="text-xs font-semibold text-green-600 mt-2">
                +83% crecimiento ($28.5K → $52.3K)
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Tasks Completed<span className="text-[10px]">(Pasa el ratón)</span>
              </p>
              <div className="flex items-baseline gap-2 h-[100px]">
                {PREMIUM_DEMO_DATA.analytics.temporal.tasks.map((val, idx) => (
                  <div
                    key={idx}
                    className="group relative flex-1 bg-blue-500 rounded-t hover:bg-blue-400 transition-all duration-300 cursor-pointer"
                    style={{
                      height: `${(val / 300) * 100}px`,
                      animation: `growUp 0.6s ease-out ${idx * 0.1}s both`
                    }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs font-semibold">
                      {val} tasks
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-popover" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{PREMIUM_DEMO_DATA.analytics.temporal.labels[0]}</span>
                <span>{PREMIUM_DEMO_DATA.analytics.temporal.labels[5]}</span>
              </div>
              <p className="text-xs font-semibold text-blue-600 mt-2">
                +91% productividad (156 → 298 tasks)
              </p>
            </div>

            <style jsx>{`
              @keyframes growUp {
                from {
                  height: 0;
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-card border">
            <p className="text-muted-foreground mb-1">{t('preview.obvsCreated')}</p>
            <p className="text-lg font-bold">+62%</p>
          </div>
          <div className="p-2 rounded-lg bg-card border">
            <p className="text-muted-foreground mb-1">{t('preview.teamGrowth')}</p>
            <p className="text-lg font-bold">+56%</p>
          </div>
          <div className="p-2 rounded-lg bg-card border">
            <p className="text-muted-foreground mb-1">{t('preview.satisfaction')}</p>
            <p className="text-lg font-bold text-green-600">4.8/5</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'activity-heatmap',
    title: t('preview.mapaDeActividad'),
    icon: Activity,
    description: t('preview.visualizaPatronesDeTrabajo'),
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          <h4 className="font-semibold mb-3">
            🔥 Activity Heatmap (Últimos 180 días)
            <span className="text-xs text-muted-foreground ml-2">(Pasa el ratón por cada día)</span>
          </h4>

          {/* Simulated heatmap preview - INTERACTIVE */}
          <div className="space-y-1">
            {[...Array(7)].map((_, weekIdx) => (
              <div key={weekIdx} className="flex gap-1">
                {[...Array(26)].map((_, dayIdx) => {
                  const intensity = Math.floor(Math.random() * 5);
                  const count = intensity * 6;
                  const colors = [
                    'bg-muted hover:bg-muted/70',
                    'bg-green-200 hover:bg-green-300',
                    'bg-green-400 hover:bg-green-500',
                    'bg-green-600 hover:bg-green-700',
                    'bg-green-800 hover:bg-green-900',
                  ];
                  const date = new Date(2024, 0, dayIdx * 7 + weekIdx);
                  return (
                    <div
                      key={dayIdx}
                      className={`group relative w-3 h-3 rounded-sm ${colors[intensity]} transition-all duration-200 cursor-pointer hover:scale-150 hover:z-10 hover:shadow-lg`}
                      style={{ animation: `fadeIn 0.3s ease-out ${(weekIdx * 26 + dayIdx) * 0.005}s both` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs pointer-events-none z-20">
                        <p className="font-semibold">{count} eventos</p>
                        <p className="text-[10px] text-muted-foreground">
                          {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-popover" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>

          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>{t('preview.menosActividad')}</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-green-200" />
              <div className="w-3 h-3 rounded-sm bg-green-400" />
              <div className="w-3 h-3 rounded-sm bg-green-600" />
              <div className="w-3 h-3 rounded-sm bg-green-800" />
            </div>
            <span>{t('preview.másActividad')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border bg-card">
            <p className="font-semibold mb-2">📊 Patrones Detectados</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Pico de actividad: Martes y Jueves</li>
              <li>• Menos actividad: Fines de semana</li>
              <li>• Promedio diario: 18-24 eventos</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <p className="font-semibold mb-2">💡 Insights</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Team work-life balance saludable</li>
              <li>• Consistencia alta durante semanas</li>
              <li>• Sin burnout detectado</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'predictions-ai',
    title: 'Predicciones IA',
    icon: Sparkles,
    description: t('preview.iaAnalizaTendenciasY'),
    content: (
      <div className="space-y-4">
        {/* Revenue Prediction */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-purple-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />{t('preview.predicciónRevenuePróximoMes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-4xl font-bold text-primary">
                  ${(PREMIUM_DEMO_DATA.analytics.predictions.next_month_revenue / 1000).toFixed(1)}K
                </p>
                <p className="text-sm text-muted-foreground">
                  Growth rate: +{PREMIUM_DEMO_DATA.analytics.predictions.growth_rate}%
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Progress value={PREMIUM_DEMO_DATA.analytics.predictions.confidence} className="w-20 h-2" />
                  <span className="text-lg font-bold text-green-600">
                    {PREMIUM_DEMO_DATA.analytics.predictions.confidence}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t('preview.confianza')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Recomendaciones IA (Top 2)
            <span className="text-xs text-muted-foreground">(Click para expandir)</span>
          </h4>
          {PREMIUM_DEMO_DATA.analytics.predictions.recommendations.slice(0, 2).map((rec, idx) => (
            <div
              key={idx}
              className="group p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              style={{ animation: `slideIn 0.4s ease-out ${idx * 0.15}s both` }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl group-hover:scale-125 transition-transform">
                  {rec.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {rec.title}
                    </h5>
                    <Badge
                      variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs group-hover:scale-110 transition-transform"
                    >
                      {rec.priority === 'high' ? 'Alta': t('preview.media')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{rec.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs font-medium text-primary">Impacto: {rec.impact}</p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="outline" className="text-[10px]">
                        Click para detalles →
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    ),
  },
  {
    id: 'export-reports',
    title: t('preview.exportarReportes'),
    icon: BarChart3,
    description: t('preview.generaReportesProfesionalesPara'),
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <h4 className="font-semibold mb-3">📄 Formatos de Exportación</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-background">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <span className="font-semibold text-sm">Excel (.xlsx)</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Comparativa de socios</li>
                <li>• Métricas de proyectos</li>
                <li>• Evolución temporal</li>
                <li>• Datos raw para análisis</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg border bg-background">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <span className="text-lg">📑</span>
                </div>
                <span className="font-semibold text-sm">{t('preview.pdfReport')}</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Diseño profesional</li>
                <li>• Gráficos incluidos</li>
                <li>• Listo para presentar</li>
                <li>• Customizable</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-card">
          <h4 className="font-semibold text-sm mb-2">✨ Features Pro</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Programar reportes automáticos (weekly/monthly)</li>
            <li>• Envío por email a stakeholders</li>
            <li>• Branding personalizado (logo, colores)</li>
            <li>• Integración con Google Drive / Dropbox</li>
            <li>• Reportes comparativos período-a-período</li>
          </ul>
        </div>

        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            🎯 Con el plan Advanced: Reportes ilimitados + automatización completa
          </p>
        </div>
      </div>
    ),
  },
];

export function AnalyticsPreviewModal({ open, onOpenChange }: AnalyticsPreviewModalProps) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    setCurrentSlide(0);
    onOpenChange(false);
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;
  const progress = ((currentSlide + 1) / SLIDES.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{t('preview.analyticsPreview')}</DialogTitle>
          <DialogDescription>{t('preview.interactivePreviewOfAnalytics')}</DialogDescription>
        </VisuallyHidden>
        {/* Header */}
        <div className="relative p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-background/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-12">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{slide.title}</h2>
              <p className="text-sm text-muted-foreground">{slide.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Paso {currentSlide + 1} de {SLIDES.length}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {slide.content}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />{t('preview.anterior')}</Button>

            <div className="flex gap-1">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlide
                      ? 'w-8 bg-primary'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={currentSlide === SLIDES.length - 1 ? handleClose : handleNext}
              className="gap-2"
            >
              {currentSlide === SLIDES.length - 1 ? (
                <>{t('preview.finalizar')}<CheckCircle2 className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>{t('preview.siguiente')}<ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
