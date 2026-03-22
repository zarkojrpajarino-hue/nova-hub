/**
 * DASHBOARD PREVIEW MODAL
 *
 * Modal interactivo que muestra TODAS las funcionalidades del Dashboard
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
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Activity,
  Zap,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import { PREMIUM_DEMO_DATA } from '@/data/premiumDemoData';

import { useTranslation } from 'react-i18next';
interface DashboardPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SLIDES = [
  {
    id: 'intro',
    title: t('preview.dashboardTuCentroDe'),
    icon: LayoutDashboard,
    description: t('preview.vistaPanorámicaDeTu'),
    content: (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />{t('preview.quéPuedesHacerCon')}</h4>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span className="text-sm">{t('preview.monitorearKpisPrincipalesEn')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span className="text-sm">{t('preview.verEstadoDeTodos')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span className="text-sm">{t('preview.seguirActivityFeedCon')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span className="text-sm">{t('preview.ejecutarQuickActionsSin')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span className="text-sm">Analizar evolución de revenue (6 meses)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span className="text-sm">{t('preview.identificarAlertasYOportunidades')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 group-hover:text-green-600 transition-colors" />{t('preview.revenueOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary group-hover:scale-105 transition-transform inline-block">
                ${(PREMIUM_DEMO_DATA.analytics.metrics.totalRevenue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MRR: ${(PREMIUM_DEMO_DATA.analytics.metrics.mrr / 1000).toFixed(1)}K
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 group-hover:text-blue-600 transition-colors" />{t('preview.activeProjects')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary group-hover:scale-105 transition-transform inline-block">
                {PREMIUM_DEMO_DATA.analytics.metrics.activeProjects}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg Health: {PREMIUM_DEMO_DATA.analytics.metrics.avgProjectHealth}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 group-hover:text-purple-600 transition-colors" />{t('preview.teamMembers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary group-hover:scale-105 transition-transform inline-block">
                {PREMIUM_DEMO_DATA.analytics.metrics.teamMembers}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Satisfaction: {PREMIUM_DEMO_DATA.analytics.metrics.customerSatisfaction}/5
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            💡 Todo está diseñado para decisiones rápidas: scroll, click, y actúa sin fricción.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'kpis',
    title: t('preview.kpisPrincipales'),
    icon: TrendingUp,
    description: t('preview.métricasClaveConTendencias'),
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          💡 Haz click en cada métrica para ver detalles expandidos
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Total Revenue */}
          <Card className="border-primary/20 hover:border-green-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="text-muted-foreground">{t('preview.totalRevenue')}</span>
                <DollarSign className="w-5 h-5 text-green-600 group-hover:scale-125 transition-transform" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold text-green-600 group-hover:text-green-500 transition-colors">
                ${(PREMIUM_DEMO_DATA.analytics.metrics.totalRevenue / 1000).toFixed(1)}K
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 group-hover:bg-green-500/20 transition-colors">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +{PREMIUM_DEMO_DATA.analytics.metrics.monthlyGrowth}%
                </Badge>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
              <div className="pt-2 border-t space-y-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MRR</span>
                  <span className="font-semibold">${(PREMIUM_DEMO_DATA.analytics.metrics.mrr / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ARR</span>
                  <span className="font-semibold">${(PREMIUM_DEMO_DATA.analytics.metrics.arr / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.perMember')}</span>
                  <span className="font-semibold">${(PREMIUM_DEMO_DATA.analytics.metrics.revenuePerMember / 1000).toFixed(1)}K</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Completed */}
          <Card className="border-primary/20 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="text-muted-foreground">{t('preview.tasksCompleted')}</span>
                <CheckCircle2 className="w-5 h-5 text-blue-600 group-hover:scale-125 transition-transform" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold text-blue-600 group-hover:text-blue-500 transition-colors">
                {PREMIUM_DEMO_DATA.analytics.metrics.tasksCompleted}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +91%
                </Badge>
                <span className="text-xs text-muted-foreground">this quarter</span>
              </div>
              <div className="pt-2 border-t space-y-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.thisMonth')}</span>
                  <span className="font-semibold">298</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.lastMonth')}</span>
                  <span className="font-semibold">267</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.avgmember')}</span>
                  <span className="font-semibold">45</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="border-primary/20 hover:border-purple-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="text-muted-foreground">{t('preview.activeProjects')}</span>
                <Briefcase className="w-5 h-5 text-purple-600 group-hover:scale-125 transition-transform" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold text-purple-600 group-hover:text-purple-500 transition-colors">
                {PREMIUM_DEMO_DATA.analytics.metrics.activeProjects}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 group-hover:bg-green-500/20 transition-colors">
                  Health: {PREMIUM_DEMO_DATA.analytics.metrics.avgProjectHealth}%
                </Badge>
              </div>
              <div className="pt-2 border-t space-y-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High Health (90%+)</span>
                  <span className="font-semibold">9</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medium (70-89%)</span>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.needsAttention')}</span>
                  <span className="font-semibold">1</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Satisfaction */}
          <Card className="border-primary/20 hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="text-muted-foreground">{t('preview.teamSatisfaction')}</span>
                <Sparkles className="w-5 h-5 text-amber-600 group-hover:scale-125 transition-transform" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-bold text-amber-600 group-hover:text-amber-500 transition-colors">
                {PREMIUM_DEMO_DATA.analytics.metrics.customerSatisfaction}/5
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors">{t('preview.excellent')}</Badge>
                <span className="text-xs text-muted-foreground">98th percentile</span>
              </div>
              <div className="pt-2 border-t space-y-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.responses')}</span>
                  <span className="font-semibold">28/28</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.trend')}</span>
                  <span className="font-semibold text-green-600">↑ Improving</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('preview.npsScore')}</span>
                  <span className="font-semibold">72</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: 'revenue-evolution',
    title: t('preview.evoluciónDeRevenue'),
    icon: DollarSign,
    description: t('preview.gráficoDeCrecimientoDe'),
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border bg-gradient-to-r from-green-500/10 to-emerald-500/10">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />{t('preview.revenueGrowthÚltimos6')}<span className="text-xs text-muted-foreground ml-2">(Pasa el ratón por cada mes)</span>
          </h4>

          <div className="flex items-baseline gap-3 h-[180px] mb-4">
            {PREMIUM_DEMO_DATA.analytics.temporal.revenue.map((val, idx) => (
              <div key={idx} className="group relative flex-1 flex flex-col items-center">
                {/* Bar */}
                <div
                  className="relative w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:from-green-500 hover:to-green-300 transition-all duration-300 cursor-pointer"
                  style={{
                    height: `${(val / 60000) * 180}px`,
                    animation: `growUp 0.8s ease-out ${idx * 0.1}s both`
                  }}
                >
                  {/* Shimmer effect on hover */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 pointer-events-none"
                    style={{ animation: 'shimmer 2s infinite' }}
                  />

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs font-semibold z-10">
                    <p className="text-green-600">${(val / 1000).toFixed(1)}K</p>
                    <p className="text-[10px] text-muted-foreground">{PREMIUM_DEMO_DATA.analytics.temporal.labels[idx]}</p>
                    {idx > 0 && (
                      <p className="text-[10px] text-green-600">
                        +{(((val - PREMIUM_DEMO_DATA.analytics.temporal.revenue[idx - 1]) / PREMIUM_DEMO_DATA.analytics.temporal.revenue[idx - 1]) * 100).toFixed(1)}%
                      </p>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-popover" />
                  </div>
                </div>

                {/* Label */}
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                  {PREMIUM_DEMO_DATA.analytics.temporal.labels[idx].slice(0, 3)}
                </p>
              </div>
            ))}
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
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t('preview.growthRate')}</p>
              <p className="text-lg font-bold text-green-600">+83%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t('preview.avgMonthly')}</p>
              <p className="text-lg font-bold text-primary">$40.3K</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Projection (Jul)</p>
              <p className="text-lg font-bold text-blue-600">$58.4K</p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm font-medium mb-2">💡 Insights Automáticos</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Crecimiento constante mes a mes (promedio +13.8%)</li>
            <li>• Aceleración en últimos 3 meses (Q2 performance)</li>
            <li>• Proyección para julio: $58.4K (87% confidence)</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'projects-status',
    title: t('preview.estadoDeProyectos'),
    icon: Briefcase,
    description: t('preview.cardsInteractivasConHealth'),
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          💡 Click en cada proyecto para ver métricas detalladas
        </p>

        <div className="grid grid-cols-3 gap-4">
          {PREMIUM_DEMO_DATA.analytics.projects.map((project, idx) => (
            <Card
              key={project.id}
              className="border-primary/10 hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
              style={{
                animation: `slideIn 0.4s ease-out ${idx * 0.12}s both`
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-2xl group-hover:scale-125 transition-transform">
                    {project.icon}
                  </span>
                  <span className="truncate group-hover:text-primary transition-colors">
                    {project.nombre}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Health Score */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t('preview.healthScore')}</span>
                    <span className="font-bold text-green-600 group-hover:scale-110 transition-transform inline-block">
                      {project.health_score}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={project.health_score}
                      className="h-2 group-hover:h-3 transition-all"
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-1.5 text-xs pt-2 border-t">
                  <div className="flex justify-between items-center group-hover:bg-primary/5 p-1.5 rounded transition-colors">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />{t('preview.revenue')}</span>
                    <span className="font-semibold">${(project.revenue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between items-center group-hover:bg-primary/5 p-1.5 rounded transition-colors">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />{t('preview.team')}</span>
                    <span className="font-semibold">{project.team_size} members</span>
                  </div>
                  <div className="flex justify-between items-center group-hover:bg-primary/5 p-1.5 rounded transition-colors">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Target className="w-3 h-3" />{t('preview.leadsWon')}</span>
                    <span className="font-semibold text-green-600">
                      {project.leads_ganados}/{project.leads}
                    </span>
                  </div>
                </div>

                {/* Badge */}
                <div className="pt-2">
                  <Badge
                    variant={project.health_score >= 90 ? 'default' : 'secondary'}
                    className="w-full justify-center group-hover:scale-105 transition-transform"
                  >
                    {project.health_score >= 90 ? '🚀 Excellent' : '✅ Good'}
                  </Badge>
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
        `}</style>
      </div>
    ),
  },
  {
    id: 'activity-feed',
    title: t('preview.activityFeed'),
    icon: Activity,
    description: t('preview.streamDeEventosEn'),
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />Actividad Reciente<Badge variant="secondary" className="ml-auto">{t('preview.enVivo')}</Badge>
          </h4>

          <div className="space-y-2">
            {PREMIUM_DEMO_DATA.integrations.slack.recent_notifications.map((notif, idx) => (
              <div
                key={notif.id}
                className="group flex items-start gap-3 p-3 rounded-lg bg-background border hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                style={{
                  animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both`
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="text-lg group-hover:scale-125 transition-transform">
                    {notif.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{notif.channel}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notif.time}
                    </span>
                  </div>
                </div>

                {/* Action hint */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateX(-10px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-muted-foreground mb-1">{t('preview.eventosHoy')}</p>
            <p className="text-2xl font-bold">151</p>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-muted-foreground mb-1">{t('preview.usuariosActivos')}</p>
            <p className="text-2xl font-bold">28</p>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-muted-foreground mb-1">{t('preview.tiempoRespuesta')}</p>
            <p className="text-2xl font-bold">12m</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm font-medium mb-1">🔔 Notificaciones Inteligentes</p>
          <p className="text-xs text-muted-foreground">{t('preview.elFeedPriorizaEventos')}</p>
        </div>
      </div>
    ),
  },
  {
    id: 'quick-actions',
    title: t('preview.quickActionsResumen'),
    icon: Zap,
    description: t('preview.accionesRápidasYResumen'),
    content: (
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="p-4 rounded-lg border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />Quick Actions<span className="text-xs text-muted-foreground">(Sin salir del Dashboard)</span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="group h-auto p-4 flex flex-col items-start gap-2 hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Validar OBV</p>
                <p className="text-xs text-muted-foreground">{t('preview.aprobarObjetivoPendiente')}</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="group h-auto p-4 flex flex-col items-start gap-2 hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{t('preview.asignarTarea')}</p>
                <p className="text-xs text-muted-foreground">{t('preview.crearYAsignarAl')}</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="group h-auto p-4 flex flex-col items-start gap-2 hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Target className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{t('preview.nuevoProyecto')}</p>
                <p className="text-xs text-muted-foreground">{t('preview.iniciarProyectoRápido')}</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="group h-auto p-4 flex flex-col items-start gap-2 hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <DollarSign className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{t('preview.registrarVenta')}</p>
                <p className="text-xs text-muted-foreground">{t('preview.logNuevoDealCerrado')}</p>
              </div>
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />{t('preview.resumenEjecutivo')}</h4>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{t('preview.todoVaBien')}</p>
                  <p className="text-xs text-muted-foreground">{t('preview.revenue235TeamSatisfaction')}</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">1 proyecto necesita atención</p>
                  <p className="text-xs text-muted-foreground">
                    t('preview.mobileAppRedesign') está al 65% - considera reforzar el equipo
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{t('preview.oportunidadDetectada')}</p>
                  <p className="text-xs text-muted-foreground">{t('preview.elenaRodriguez40Revenue')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            🎯 El Dashboard te da el poder de actuar en segundos, no en horas
          </p>
        </div>
      </div>
    ),
  },
];

export function DashboardPreviewModal({ open, onOpenChange }: DashboardPreviewModalProps) {
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
          <DialogTitle>{t('preview.dashboardPreview')}</DialogTitle>
          <DialogDescription>{t('preview.interactivePreviewOfDashboard')}</DialogDescription>
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
