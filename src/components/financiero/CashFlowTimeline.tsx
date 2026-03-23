/**
 * UPGRADE 2 — CashFlowTimeline
 *
 * Recharts LineChart showing cash_on_hand month by month.
 * Historical: solid line. Projected: dashed line.
 * Red zone: area below 0. Red marker at cash-zero date.
 * Green badge if profitable (no cash-zero date).
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wallet, CheckCircle2 } from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useMRRForecast, useStressTest } from '@/hooks/useFinancialIntelligence'

interface CashFlowTimelineProps {
  projectId: string
}

interface TimelinePoint {
  month: string
  cash: number | null
  projected: number | null
  isHistorical: boolean
}

export function CashFlowTimeline({ projectId }: CashFlowTimelineProps) {
  const { t } = useTranslation()
  const { data: forecastData, isLoading: forecastLoading } = useMRRForecast(projectId)
  const { data: stressData, isLoading: stressLoading } = useStressTest(projectId)

  const isLoading = forecastLoading || stressLoading

  const { chartData, cashZeroMonth, isProfitable } = useMemo(() => {
    if (!forecastData || forecastData.status !== 'ok' || !stressData?.inputs) {
      return { chartData: [], cashZeroMonth: null as string | null, isProfitable: false }
    }

    const inputs = stressData.inputs
    const cashOnHand = inputs.cash_on_hand ?? 0
    const burnRate = inputs.burn_rate ?? 0
    const historicalMRR = forecastData.historical ?? []
    const forecastMRR = forecastData.forecast ?? []

    const points: TimelinePoint[] = []
    let currentCash = cashOnHand
    let cashZero: string | null = null

    // Historical months: use actual MRR data to reconstruct cash trajectory
    // We approximate: cash at month N = cash_on_hand - sum(burn - mrr) for projected months
    // For historical, we show the trajectory leading to current cash
    const totalHistorical = historicalMRR.length
    if (totalHistorical > 0) {
      // Walk backwards from current cash to estimate historical cash
      const historicalCashPoints: { month: string; cash: number }[] = []
      let walkBackCash = cashOnHand
      for (let i = totalHistorical - 1; i >= 0; i--) {
        historicalCashPoints.unshift({
          month: historicalMRR[i].month,
          cash: Math.round(walkBackCash),
        })
        // Each month, cash changed by (mrr - burn)
        walkBackCash -= (historicalMRR[i].mrr - burnRate)
      }

      for (const hp of historicalCashPoints) {
        points.push({
          month: formatMonth(hp.month),
          cash: hp.cash,
          projected: null,
          isHistorical: true,
        })
      }
      currentCash = cashOnHand
    }

    // Projected months: extend from current cash using forecast MRR and burn
    let projectedCash = currentCash
    for (const fp of forecastMRR) {
      const monthlyNet = (fp.predicted ?? 0) - burnRate
      projectedCash += monthlyNet
      const roundedCash = Math.round(projectedCash)

      points.push({
        month: formatMonth(fp.month),
        cash: null,
        projected: roundedCash,
        isHistorical: false,
      })

      if (roundedCash <= 0 && !cashZero) {
        cashZero = formatMonth(fp.month)
      }
    }

    // Connect historical to projected
    if (points.length > 0) {
      const lastHistIdx = points.findIndex(p => !p.isHistorical) - 1
      if (lastHistIdx >= 0) {
        points[lastHistIdx] = {
          ...points[lastHistIdx],
          projected: points[lastHistIdx].cash,
        }
      }
    }

    const profitable = !cashZero && projectedCash > 0

    return { chartData: points, cashZeroMonth: cashZero, isProfitable: profitable }
  }, [forecastData, stressData])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
          {t('financialIntelligence.insufficientData')}
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`
    return `${value}`
  }

  // Find minimum value for red zone
  const allValues = chartData.map(d => d.cash ?? d.projected ?? 0)
  const minValue = Math.min(...allValues, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            {t('financialIntelligence.cashTimelineTitle')}
          </CardTitle>
          {isProfitable && (
            <Badge className="text-xs bg-green-100 text-green-700 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t('financialIntelligence.cashTimelineProfitable')}
            </Badge>
          )}
          {cashZeroMonth && (
            <Badge className="text-xs bg-red-100 text-red-700">
              {t('financialIntelligence.cashTimelineCashZero', { date: cashZeroMonth })}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t('financialIntelligence.cashTimelineSubtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={formatCurrency}
                width={50}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value?.toLocaleString('es-ES')}`,
                  name === 'cash'
                    ? t('financialIntelligence.cashTimelineHistorical')
                    : t('financialIntelligence.cashTimelineProjected'),
                ]}
                labelStyle={{ fontWeight: 600 }}
              />

              {/* Red zone below 0 */}
              {minValue < 0 && (
                <Area
                  dataKey="projected"
                  stroke="none"
                  fill="rgba(239, 68, 68, 0.1)"
                  fillOpacity={1}
                  baseValue={0}
                  connectNulls={false}
                />
              )}

              {/* Zero reference line */}
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />

              {/* Historical cash (solid) */}
              <Line
                dataKey="cash"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
                name="cash"
              />

              {/* Projected cash (dashed) */}
              <Line
                dataKey="projected"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 2, strokeDasharray: '' }}
                connectNulls={false}
                name="projected"
              />

              {/* Cash-zero marker */}
              {cashZeroMonth && (
                <ReferenceDot
                  x={cashZeroMonth}
                  y={0}
                  r={6}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function formatMonth(yearMonth: string): string {
  try {
    const [year, month] = yearMonth.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
  } catch {
    return yearMonth
  }
}
