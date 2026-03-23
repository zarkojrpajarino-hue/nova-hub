/**
 * UPGRADE 5 — RevenueQualityScore
 *
 * Composite score 0-10 based on recurrence, diversification, growth, stability.
 * Circular progress with score, breakdown below.
 * Color: red <4, amber 4-6, green >6.
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Star, TrendingUp, Shield, Users, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMRRForecast, useStressTest } from '@/hooks/useFinancialIntelligence'

interface RevenueQualityScoreProps {
  projectId: string
}

interface ScoreFactor {
  key: string
  label: string
  value: number
  score: number
  maxScore: number
  icon: typeof Star
  good: string
}

export function RevenueQualityScore({ projectId }: RevenueQualityScoreProps) {
  const { t } = useTranslation()
  const { data: forecastData, isLoading: forecastLoading } = useMRRForecast(projectId)
  const { data: stressData, isLoading: stressLoading } = useStressTest(projectId)

  const isLoading = forecastLoading || stressLoading

  const { totalScore, factors, scoreColor, scoreBg } = useMemo(() => {
    if (!forecastData || forecastData.status !== 'ok' || !stressData?.inputs) {
      return { totalScore: 0, factors: [] as ScoreFactor[], scoreColor: '', scoreBg: '' }
    }

    const historical = forecastData.historical ?? []
    const trend = forecastData.trend ?? 'flat'
    const topClientPct = stressData.inputs.top_client_pct ?? 0

    // Factor 1: Recurrence (0-3 points)
    // Assume MRR-based revenue is recurring. Score based on having consistent MRR.
    const mrrValues = historical.map(h => h.mrr)
    const hasConsistentMRR = mrrValues.length >= 3 && mrrValues.every(v => v > 0)
    const recurrenceScore = hasConsistentMRR ? 3 : mrrValues.filter(v => v > 0).length >= 2 ? 2 : 1

    // Factor 2: Diversification (0-3 points)
    // 1 - top_client_pct: higher = better diversification
    const diversification = 1 - (topClientPct / 100)
    const divScore = diversification >= 0.8 ? 3
      : diversification >= 0.6 ? 2
        : diversification >= 0.4 ? 1
          : 0

    // Factor 3: Growth (-2 to +2 points, normalized to 0-2)
    const growthScore = trend === 'growing' ? 2 : trend === 'flat' ? 1 : 0

    // Factor 4: Stability (0-2 points)
    // Standard deviation of MRR relative to mean
    let stabilityScore = 1
    if (mrrValues.length >= 3) {
      const mean = mrrValues.reduce((s, v) => s + v, 0) / mrrValues.length
      if (mean > 0) {
        const variance = mrrValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / mrrValues.length
        const stdDev = Math.sqrt(variance)
        const cv = stdDev / mean // Coefficient of variation
        stabilityScore = cv < 0.1 ? 2 : cv < 0.25 ? 1 : 0
      }
    }

    const total = recurrenceScore + divScore + growthScore + stabilityScore
    const color = total < 4 ? 'text-red-500' : total <= 6 ? 'text-amber-500' : 'text-green-500'
    const bg = total < 4 ? 'bg-red-50' : total <= 6 ? 'bg-amber-50' : 'bg-green-50'

    const computedFactors: ScoreFactor[] = [
      {
        key: 'recurrence',
        label: t('financialIntelligence.rqRecurrence'),
        value: recurrenceScore,
        score: recurrenceScore,
        maxScore: 3,
        icon: BarChart3,
        good: t('financialIntelligence.rqRecurrenceGood'),
      },
      {
        key: 'diversification',
        label: t('financialIntelligence.rqDiversification'),
        value: Math.round(diversification * 100),
        score: divScore,
        maxScore: 3,
        icon: Users,
        good: t('financialIntelligence.rqDiversificationGood'),
      },
      {
        key: 'growth',
        label: t('financialIntelligence.rqGrowth'),
        value: growthScore,
        score: growthScore,
        maxScore: 2,
        icon: TrendingUp,
        good: t('financialIntelligence.rqGrowthGood'),
      },
      {
        key: 'stability',
        label: t('financialIntelligence.rqStability'),
        value: stabilityScore,
        score: stabilityScore,
        maxScore: 2,
        icon: Shield,
        good: t('financialIntelligence.rqStabilityGood'),
      },
    ]

    return { totalScore: total, factors: computedFactors, scoreColor: color, scoreBg: bg }
  }, [forecastData, stressData, t])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (factors.length === 0) {
    return (
      <Card>
        <CardContent className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
          {t('financialIntelligence.insufficientData')}
        </CardContent>
      </Card>
    )
  }

  const pct = (totalScore / 10) * 100
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          {t('financialIntelligence.rqTitle')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('financialIntelligence.rqSubtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          {/* Circular progress */}
          <div className={`relative w-24 h-24 shrink-0 rounded-full ${scoreBg} flex items-center justify-center`}>
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                className="text-muted/20"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                className={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${scoreColor}`}>{totalScore}</span>
              <span className="text-[10px] text-muted-foreground">/10</span>
            </div>
          </div>

          {/* Factor breakdown */}
          <div className="flex-1 space-y-2.5">
            {factors.map(factor => {
              const FactorIcon = factor.icon
              const factorColor = factor.score === factor.maxScore
                ? 'text-green-600'
                : factor.score >= factor.maxScore / 2
                  ? 'text-amber-600'
                  : 'text-red-600'

              return (
                <div key={factor.key} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FactorIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{factor.label}</span>
                    </div>
                    <Badge variant="secondary" className={`text-xs h-5 px-1.5 ${factorColor} bg-transparent`}>
                      {factor.score}/{factor.maxScore}
                    </Badge>
                  </div>
                  {/* Progress bar for factor */}
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        factor.score === factor.maxScore ? 'bg-green-500'
                          : factor.score >= factor.maxScore / 2 ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{factor.good}</p>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
