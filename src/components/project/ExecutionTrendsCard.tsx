/**
 * ExecutionTrendsCard — ER29.3 + ER29.8
 *
 * Stacked area chart showing weekly execution trends.
 * 3 visual layers: tasks by function_type, OBVs by tipo, revenue.
 * Trend badges: "Tareas demanda up", "Revenue down", etc.
 *
 * Confidence badge (ER29.8):
 *   - enriched_by empty => "Basado en datos manuales" (amber)
 *   - enriched_by has providers => "Enriquecido con [providers]" (green)
 *
 * Copy rule: "Cuando suben tus tareas de demanda, las OBVs de venta
 * tienden a subir" — NEVER causal.
 *
 * If not unlocked (< 10 tasks + 5 OBVs in 30d), shows UnlockProgress.
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useExecutionTrends, type TrendDirection, type WeeklyTrend } from '@/hooks/useExecutionTrends'
import { useFeatureUnlock } from '@/hooks/useUnlockProgress'
import { UnlockGate } from '@/components/project/UnlockProgress'

interface ExecutionTrendsCardProps {
  projectId: string
}

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
  insufficient_data: Minus,
}

const TREND_COLOR = {
  up: 'text-green-600',
  down: 'text-red-500',
  stable: 'text-muted-foreground',
  insufficient_data: 'text-muted-foreground',
}

function TrendBadge({ label, direction }: { label: string; direction: TrendDirection }) {
  const Icon = TREND_ICON[direction]
  return (
    <Badge variant="outline" className="text-xs gap-1 py-0.5">
      <Icon size={10} className={TREND_COLOR[direction]} />
      <span>{label}</span>
    </Badge>
  )
}

function ConfidenceBadge({ enrichedBy }: { enrichedBy: string[] }) {
  const { t } = useTranslation()
  const allProviders = useMemo(() => {
    const unique = new Set<string>()
    enrichedBy.forEach(p => unique.add(p))
    return Array.from(unique)
  }, [enrichedBy])

  if (allProviders.length === 0) {
    return (
      <Badge variant="outline" className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200">
        <ShieldAlert size={10} />
        {t('executionTrends.manualData')}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-xs gap-1 bg-green-50 text-green-700 border-green-200">
      <ShieldCheck size={10} />
      {t('executionTrends.enrichedWith', { providers: allProviders.join(', ') })}
    </Badge>
  )
}

export function ExecutionTrendsCard({ projectId }: ExecutionTrendsCardProps) {
  const { t } = useTranslation()
  const { data: featureUnlock } = useFeatureUnlock(projectId, 'execution_trends')
  const { data: trendsData, isLoading } = useExecutionTrends(projectId)

  // Collect all enriched_by providers across all weeks
  const allEnrichedProviders = useMemo(() => {
    if (!trendsData?.weekly) return []
    const all: string[] = []
    trendsData.weekly.forEach((w: WeeklyTrend) => {
      w.enriched_by?.forEach(p => {
        if (!all.includes(p)) all.push(p)
      })
    })
    return all
  }, [trendsData])

  // Transform weekly data for Recharts (reverse to show oldest first)
  const chartData = useMemo(() => {
    if (!trendsData?.weekly) return []
    return [...trendsData.weekly]
      .reverse()
      .map(w => ({
        week: w.week_start.slice(5), // MM-DD
        tasks_demand: w.tasks.demand,
        tasks_delivery: w.tasks.delivery,
        tasks_cash: w.tasks.cash,
        obvs_venta: w.obvs.venta,
        obvs_validacion: w.obvs.validacion,
        obvs_exploracion: w.obvs.exploracion,
        revenue: w.revenue,
      }))
  }, [trendsData])

  return (
    <UnlockGate
      feature={featureUnlock}
      title={t('executionTrends.unlockTitle')}
      description={t('executionTrends.unlockDescription')}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{t('executionTrends.title')}</CardTitle>
            <ConfidenceBadge enrichedBy={allEnrichedProviders} />
          </div>
          <p className="text-xs text-muted-foreground">{t('executionTrends.subtitle')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Trend badges */}
              {trendsData?.trends && (
                <div className="flex flex-wrap gap-1.5">
                  <TrendBadge
                    label={t('executionTrends.trendTasks')}
                    direction={trendsData.trends.tasks}
                  />
                  <TrendBadge
                    label={t('executionTrends.trendOBVs')}
                    direction={trendsData.trends.obvs}
                  />
                  <TrendBadge
                    label={t('executionTrends.trendRevenue')}
                    direction={trendsData.trends.revenue}
                  />
                </div>
              )}

              {/* Stacked area chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {/* Tasks by function_type */}
                    <Area
                      type="monotone"
                      dataKey="tasks_demand"
                      name={t('executionTrends.tasksDemand')}
                      stackId="tasks"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="tasks_delivery"
                      name={t('executionTrends.tasksDelivery')}
                      stackId="tasks"
                      stroke="#22C55E"
                      fill="#22C55E"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="tasks_cash"
                      name={t('executionTrends.tasksCash')}
                      stackId="tasks"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.3}
                    />
                    {/* OBVs by tipo */}
                    <Area
                      type="monotone"
                      dataKey="obvs_venta"
                      name={t('executionTrends.obvsVenta')}
                      stackId="obvs"
                      stroke="#EC4899"
                      fill="#EC4899"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="obvs_validacion"
                      name={t('executionTrends.obvsValidacion')}
                      stackId="obvs"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="obvs_exploracion"
                      name={t('executionTrends.obvsExploracion')}
                      stackId="obvs"
                      stroke="#6366F1"
                      fill="#6366F1"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Direction insight — never causal */}
              {trendsData?.trends?.tasks === 'up' && trendsData?.trends?.obvs === 'up' && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                  {t('executionTrends.insightBothUp')}
                </p>
              )}
              {trendsData?.trends?.tasks === 'down' && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-amber-400/50 pl-2">
                  {t('executionTrends.insightTasksDown')}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </UnlockGate>
  )
}
