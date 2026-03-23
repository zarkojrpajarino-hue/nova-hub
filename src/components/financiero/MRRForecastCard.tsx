/**
 * FI30.2 — MRRForecastCard
 *
 * Shows historical MRR (solid line) + forecast (dashed line) + confidence band (shaded area).
 * If insufficient_data → shows UnlockProgress.
 * Badge: "Estimacion con N meses de datos (confianza X%)"
 * Disclaimer: "Esta proyeccion asume que las condiciones actuales se mantienen."
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ComposedChart,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useMRRForecast } from '@/hooks/useFinancialIntelligence'
import { useFeatureUnlock } from '@/hooks/useUnlockProgress'
import { UnlockGate } from '@/components/project/UnlockProgress'

interface MRRForecastCardProps {
  projectId: string
}

export function MRRForecastCard({ projectId }: MRRForecastCardProps) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useMRRForecast(projectId)
  const { data: unlockFeature } = useFeatureUnlock(projectId, 'f30_forecast')

  // Merge historical + forecast into single chart data
  const chartData = useMemo(() => {
    if (!data || data.status !== 'ok') return []

    const historical = (data.historical ?? []).map(h => ({
      month: formatMonth(h.month),
      mrr: h.mrr,
      predicted: null as number | null,
      low: null as number | null,
      high: null as number | null,
    }))

    const forecast = (data.forecast ?? []).map(f => ({
      month: formatMonth(f.month),
      mrr: null as number | null,
      predicted: f.predicted,
      low: f.low,
      high: f.high,
    }))

    // Connect historical to forecast: last historical point also shows as predicted
    if (historical.length > 0 && forecast.length > 0) {
      const lastH = historical[historical.length - 1]
      forecast[0] = {
        ...forecast[0],
        mrr: null,
        predicted: lastH.mrr,
        low: lastH.mrr,
        high: lastH.mrr,
      }
      // Add connection point
      historical[historical.length - 1] = {
        ...lastH,
        predicted: lastH.mrr,
      }
    }

    return [...historical, ...forecast]
  }, [data])

  const trendIcon = data?.trend === 'growing'
    ? <TrendingUp className="w-4 h-4 text-green-500" />
    : data?.trend === 'declining'
      ? <TrendingDown className="w-4 h-4 text-red-500" />
      : <Minus className="w-4 h-4 text-amber-500" />

  const trendColor = data?.trend === 'growing' ? 'bg-green-100 text-green-700'
    : data?.trend === 'declining' ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700'

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Insufficient data → show UnlockProgress
  if (data?.status === 'insufficient_data' || (!data && !error)) {
    return (
      <UnlockGate
        feature={unlockFeature}
        title={t('financialIntelligence.forecastUnlockTitle')}
        description={t('financialIntelligence.forecastUnlockDescription')}
      >
        <Card>
          <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            {t('financialIntelligence.insufficientData')}
          </CardContent>
        </Card>
      </UnlockGate>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          {t('financialIntelligence.errorLoading')}
        </CardContent>
      </Card>
    )
  }

  const confidencePercent = Math.round((data?.confidence ?? 0) * 100)

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return `${value}`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            {t('financialIntelligence.forecastTitle')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`text-xs ${trendColor}`}>
              <span className="flex items-center gap-1">
                {trendIcon}
                {t(`financialIntelligence.trend_${data?.trend ?? 'flat'}`)}
              </span>
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('financialIntelligence.forecastBadge', {
            months: data?.months_available ?? 0,
            confidence: confidencePercent,
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
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
                width={45}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `€${value?.toLocaleString('es-ES') ?? '-'}`,
                  name === 'mrr' ? 'MRR'
                    : name === 'predicted' ? t('financialIntelligence.predicted')
                      : name,
                ]}
                labelStyle={{ fontWeight: 600 }}
              />
              {/* Confidence band */}
              <Area
                dataKey="high"
                stroke="none"
                fill="hsl(var(--primary))"
                fillOpacity={0.08}
                connectNulls={false}
              />
              <Area
                dataKey="low"
                stroke="none"
                fill="white"
                fillOpacity={0.8}
                connectNulls={false}
              />
              {/* Historical MRR (solid) */}
              <Line
                dataKey="mrr"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
                name="MRR"
              />
              {/* Forecast (dashed) */}
              <Line
                dataKey="predicted"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 2, strokeDasharray: '' }}
                connectNulls={false}
                name={t('financialIntelligence.predicted')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Source confidence badge */}
        <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            {data?.has_integration
              ? t('financialIntelligence.enrichedSource')
              : t('financialIntelligence.manualSource')}
            {' — '}
            {t('financialIntelligence.disclaimer')}
          </span>
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
