/**
 * UPGRADE 6 — CrossSignalCard
 *
 * Cross-references execution_trends (F29) with financial metrics (F30).
 * Shows correlations and divergences between execution and revenue.
 * Only shows if both data sources have >= 4 weeks of data.
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMRRForecast } from '@/hooks/useFinancialIntelligence'
import { useExecutionTrends } from '@/hooks/useExecutionTrends'

interface CrossSignalCardProps {
  projectId: string
}

interface CrossSignal {
  type: 'positive' | 'warning' | 'neutral'
  message: string
  sources: string[]
}

export function CrossSignalCard({ projectId }: CrossSignalCardProps) {
  const { t } = useTranslation()
  const { data: forecastData, isLoading: forecastLoading } = useMRRForecast(projectId)
  const { data: trendsData, isLoading: trendsLoading } = useExecutionTrends(projectId, 12)

  const isLoading = forecastLoading || trendsLoading

  const { signals, hasEnoughData } = useMemo(() => {
    if (!forecastData || forecastData.status !== 'ok' || !trendsData) {
      return { signals: [] as CrossSignal[], hasEnoughData: false }
    }

    const weeks = trendsData.weekly ?? []
    const historical = forecastData.historical ?? []

    // Need >= 4 weeks of execution data and some financial data
    if (weeks.length < 4 || historical.length < 2) {
      return { signals: [] as CrossSignal[], hasEnoughData: false }
    }

    const computedSignals: CrossSignal[] = []

    // Execution trends
    const tasksTrend = trendsData.trends?.tasks ?? 'insufficient_data'
    const obvsTrend = trendsData.trends?.obvs ?? 'insufficient_data'
    const revenueTrend = trendsData.trends?.revenue ?? 'insufficient_data'
    const mrrTrend = forecastData.trend ?? 'flat'

    // Recent weeks: compute demand task change
    const recentWeeks = weeks.slice(-4)
    const olderWeeks = weeks.slice(-8, -4)

    if (recentWeeks.length >= 4 && olderWeeks.length >= 2) {
      const recentDemand = recentWeeks.reduce((s, w) => s + (w.tasks?.demand ?? 0), 0)
      const olderDemand = olderWeeks.reduce((s, w) => s + (w.tasks?.demand ?? 0), 0)

      const demandChange = olderDemand > 0
        ? Math.round(((recentDemand - olderDemand) / olderDemand) * 100)
        : 0

      // Signal 1: Demand tasks up AND MRR up → positive
      if (demandChange > 20 && mrrTrend === 'growing') {
        computedSignals.push({
          type: 'positive',
          message: t('financialIntelligence.crossSignalDemandMRRUp', {
            demandPct: demandChange,
          }),
          sources: ['execution_trends.tasks.demand', 'key_metrics.mrr'],
        })
      }

      // Signal 2: Pipeline/OBV activity up but MRR not growing → pricing problem?
      if (obvsTrend === 'up' && mrrTrend !== 'growing') {
        computedSignals.push({
          type: 'warning',
          message: t('financialIntelligence.crossSignalPipelineNoMRR'),
          sources: ['execution_trends.obvs', 'key_metrics.mrr'],
        })
      }

      // Signal 3: Revenue trend from execution vs MRR trend divergence
      if (revenueTrend === 'up' && mrrTrend === 'declining') {
        computedSignals.push({
          type: 'warning',
          message: t('financialIntelligence.crossSignalRevenueVsMRR'),
          sources: ['execution_trends.revenue', 'key_metrics.mrr'],
        })
      }

      // Signal 4: Delivery tasks increasing + MRR growing → healthy execution
      const recentDelivery = recentWeeks.reduce((s, w) => s + (w.tasks?.delivery ?? 0), 0)
      const olderDelivery = olderWeeks.reduce((s, w) => s + (w.tasks?.delivery ?? 0), 0)
      const deliveryChange = olderDelivery > 0
        ? Math.round(((recentDelivery - olderDelivery) / olderDelivery) * 100)
        : 0

      if (deliveryChange > 15 && mrrTrend === 'growing') {
        computedSignals.push({
          type: 'positive',
          message: t('financialIntelligence.crossSignalDeliveryMRR', {
            deliveryPct: deliveryChange,
          }),
          sources: ['execution_trends.tasks.delivery', 'key_metrics.mrr'],
        })
      }

      // Signal 5: Demand declining + MRR declining → demand-side problem
      if (demandChange < -20 && mrrTrend === 'declining') {
        computedSignals.push({
          type: 'warning',
          message: t('financialIntelligence.crossSignalDemandMRRDown', {
            demandPct: Math.abs(demandChange),
          }),
          sources: ['execution_trends.tasks.demand', 'key_metrics.mrr'],
        })
      }

      // Signal 6: Task activity stable, MRR flat → neutral
      if (tasksTrend === 'stable' && mrrTrend === 'flat' && computedSignals.length === 0) {
        computedSignals.push({
          type: 'neutral',
          message: t('financialIntelligence.crossSignalStable'),
          sources: ['execution_trends', 'key_metrics'],
        })
      }
    }

    return { signals: computedSignals, hasEnoughData: true }
  }, [forecastData, trendsData, t])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[150px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!hasEnoughData) {
    return (
      <Card>
        <CardContent className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
          {t('financialIntelligence.crossSignalInsufficient')}
        </CardContent>
      </Card>
    )
  }

  if (signals.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            {t('financialIntelligence.crossSignalTitle')}
          </CardTitle>
          <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">
            Cross-signal
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('financialIntelligence.crossSignalSubtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {signals.map((signal, i) => {
          const Icon = signal.type === 'positive'
            ? CheckCircle2
            : signal.type === 'warning'
              ? AlertTriangle
              : TrendingUp

          const bgColor = signal.type === 'positive'
            ? 'bg-green-50 border-green-200'
            : signal.type === 'warning'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'

          const iconColor = signal.type === 'positive'
            ? 'text-green-500'
            : signal.type === 'warning'
              ? 'text-amber-500'
              : 'text-blue-500'

          return (
            <div key={i} className={`p-3 rounded-lg border ${bgColor}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${iconColor} shrink-0 mt-0.5`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{signal.message}</p>
                  <div className="flex flex-wrap gap-1">
                    {signal.sources.map(src => (
                      <Badge
                        key={src}
                        variant="secondary"
                        className="text-[10px] h-4 px-1 bg-white/50"
                      >
                        {src}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
