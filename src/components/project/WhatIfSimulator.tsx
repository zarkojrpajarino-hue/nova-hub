/**
 * WhatIfSimulator — F29 Upgrade 2
 *
 * Based on historical trends, simulates:
 * "If I do X more tasks/week of [category]..."
 *
 * Uses Pearson correlation from existing data to project impact.
 * ALWAYS shows disclaimer: estimation, not prediction.
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Beaker, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { WeeklyTrend } from '@/hooks/useExecutionTrends'
import { pearsonCorrelation, type PearsonResult } from '@/lib/pearson'

interface WhatIfSimulatorProps {
  projectId: string
  trends: WeeklyTrend[]
}

type TaskCategory = 'demand' | 'delivery' | 'cash'

interface SimulationResult {
  obvImpact: number
  revenueImpact: number
  confidence: 'high' | 'medium' | 'low'
  obvCorrelation: PearsonResult | null
  revenueCorrelation: PearsonResult | null
}

function computeSimulation(
  trends: WeeklyTrend[],
  category: TaskCategory,
  additionalTasks: number,
): SimulationResult | null {
  if (trends.length < 4 || additionalTasks === 0) return null

  // Extract series
  const taskSeries = trends.map(w => w.tasks[category])
  const obvSeries = trends.map(w => w.obvs.venta + w.obvs.validacion + w.obvs.exploracion)
  const revenueSeries = trends.map(w => w.revenue)

  const obvCorr = pearsonCorrelation(taskSeries, obvSeries)
  const revCorr = pearsonCorrelation(taskSeries, revenueSeries)

  // Calculate average ratios (slope approximation)
  const avgTasks = taskSeries.reduce((a, b) => a + b, 0) / taskSeries.length
  const avgObvs = obvSeries.reduce((a, b) => a + b, 0) / obvSeries.length
  const avgRevenue = revenueSeries.reduce((a, b) => a + b, 0) / revenueSeries.length

  // Projected impact = (additionalTasks / avgTasks) * avgMetric * |correlation|
  const obvImpact = avgTasks > 0 && obvCorr
    ? Math.round((additionalTasks / Math.max(avgTasks, 1)) * avgObvs * Math.max(obvCorr.r, 0) * 10) / 10
    : 0

  const revenueImpact = avgTasks > 0 && revCorr
    ? Math.round((additionalTasks / Math.max(avgTasks, 1)) * avgRevenue * Math.max(revCorr.r, 0))
    : 0

  // Confidence based on correlation strength and data points
  const strongCorr = (obvCorr?.strength === 'strong' || revCorr?.strength === 'strong')
  const enoughData = trends.length >= 8

  const confidence: SimulationResult['confidence'] =
    strongCorr && enoughData ? 'high' :
    strongCorr || enoughData ? 'medium' : 'low'

  return { obvImpact, revenueImpact, confidence, obvCorrelation: obvCorr, revenueCorrelation: revCorr }
}

const CONFIDENCE_STYLE = {
  high: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-muted text-muted-foreground border-border',
}

export function WhatIfSimulator({ projectId: _projectId, trends }: WhatIfSimulatorProps) {
  const { t } = useTranslation()
  const [additionalTasks, setAdditionalTasks] = useState(3)
  const [category, setCategory] = useState<TaskCategory>('demand')

  // Reverse trends to oldest-first for correlation
  const orderedTrends = useMemo(() => [...trends].reverse(), [trends])

  const simulation = useMemo(
    () => computeSimulation(orderedTrends, category, additionalTasks),
    [orderedTrends, category, additionalTasks],
  )

  if (trends.length < 4) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Beaker size={14} className="text-primary" />
          <CardTitle className="text-sm">{t('whatIfSimulator.title')}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{t('whatIfSimulator.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('whatIfSimulator.additionalTasks')}
              </span>
              <span className="text-xs font-mono font-medium">{additionalTasks}</span>
            </div>
            <Slider
              value={[additionalTasks]}
              onValueChange={([v]) => setAdditionalTasks(v)}
              min={0}
              max={10}
              step={1}
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="demand">{t('whatIfSimulator.categoryDemand')}</SelectItem>
              <SelectItem value="delivery">{t('whatIfSimulator.categoryDelivery')}</SelectItem>
              <SelectItem value="cash">{t('whatIfSimulator.categoryCash')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Result */}
        {simulation && additionalTasks > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <p className="text-xs">
              {t('whatIfSimulator.result', {
                count: additionalTasks,
                category: t(`whatIfSimulator.category${category.charAt(0).toUpperCase() + category.slice(1)}`),
                obvImpact: simulation.obvImpact.toFixed(1),
                revenueImpact: simulation.revenueImpact,
              })}
            </p>
            <Badge variant="outline" className={`text-xs ${CONFIDENCE_STYLE[simulation.confidence]}`}>
              {t(`whatIfSimulator.confidence_${simulation.confidence}`)}
            </Badge>
          </div>
        )}

        {/* Disclaimer — ALWAYS visible */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground italic border-l-2 border-amber-400/50 pl-2">
          <AlertCircle size={10} className="mt-0.5 shrink-0" />
          <span>{t('whatIfSimulator.disclaimer')}</span>
        </div>
      </CardContent>
    </Card>
  )
}
