/**
 * FI30.6 — FinancialRiskAlerts
 *
 * Panel with risk cards, colored by severity.
 * Each: icon + what's happening + why it matters + what to do.
 * If no risks → green "Sin alertas financieras activas".
 *
 * UPGRADE 3: Predictive risk alerts — linear extrapolation from last 3 data points.
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ShieldCheck, AlertTriangle, AlertOctagon, TrendingDown, CreditCard, Users, Banknote, Activity, Handshake } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFinancialRisks, useMRRForecast, useStressTest, type FinancialRisk } from '@/hooks/useFinancialIntelligence'

interface FinancialRiskAlertsProps {
  projectId: string
}

/**
 * Linear extrapolation: given last N values, predict value at futureSteps ahead.
 * Returns { predicted, confidence } where confidence = R^2 proxy.
 */
function linearExtrapolate(values: number[], futureSteps: number): { predicted: number; confidence: number } | null {
  const n = values.length
  if (n < 3) return null

  // Use last 3 points
  const pts = values.slice(-3)
  const m = pts.length
  const sumX = (m * (m - 1)) / 2
  const sumY = pts.reduce((s, v) => s + v, 0)
  const sumXY = pts.reduce((s, v, i) => s + i * v, 0)
  const sumX2 = pts.reduce((s, _, i) => s + i * i, 0)

  const denom = m * sumX2 - sumX * sumX
  if (denom === 0) return null

  const slope = (m * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / m

  // Predicted value at future step
  const predicted = intercept + slope * (m - 1 + futureSteps)

  // Simple R^2 as confidence proxy
  const meanY = sumY / m
  const ssTot = pts.reduce((s, v) => s + Math.pow(v - meanY, 2), 0)
  const ssRes = pts.reduce((s, v, i) => s + Math.pow(v - (intercept + slope * i), 2), 0)
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0

  return { predicted: Math.round(predicted), confidence: Math.max(0, r2) }
}

const RISK_ICONS: Record<string, typeof AlertTriangle> = {
  mrr_declining: TrendingDown,
  burn_exceeds_revenue: Banknote,
  overdue_invoices: CreditCard,
  revenue_concentration: Users,
  low_runway: AlertOctagon,
  churn_signal: Activity,
  pipeline_risk: Handshake,
}

export function FinancialRiskAlerts({ projectId }: FinancialRiskAlertsProps) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useFinancialRisks(projectId)
  const { data: forecastData, isLoading: forecastLoading } = useMRRForecast(projectId)
  const { data: stressData, isLoading: stressLoading } = useStressTest(projectId)

  // Compute predictions for each risk type
  const predictions = useMemo(() => {
    const preds: Record<string, { message: string; months: number } | null> = {}

    if (!forecastData || forecastData.status !== 'ok' || !stressData?.inputs) return preds

    const historical = forecastData.historical ?? []
    const mrrValues = historical.map(h => h.mrr)
    const burnRate = stressData.inputs.burn_rate ?? 0
    const cashOnHand = stressData.inputs.cash_on_hand ?? 0

    // MRR declining prediction
    if (mrrValues.length >= 3) {
      const ext = linearExtrapolate(mrrValues, 4)
      if (ext && ext.confidence > 0.5 && ext.predicted < mrrValues[mrrValues.length - 1]) {
        preds['mrr_declining'] = {
          message: t('financialIntelligence.predictionMRRDecline', {
            months: 4,
            value: ext.predicted.toLocaleString('es-ES'),
          }),
          months: 4,
        }
      }
    }

    // Burn exceeds revenue prediction
    if (burnRate > 0 && mrrValues.length >= 3) {
      const netBurn = burnRate - (mrrValues[mrrValues.length - 1] ?? 0)
      if (netBurn > 0 && cashOnHand > 0) {
        const runwayMonths = Math.round(cashOnHand / netBurn)
        preds['burn_exceeds_revenue'] = {
          message: t('financialIntelligence.predictionBurnRunway', {
            months: runwayMonths,
          }),
          months: runwayMonths,
        }
      }
    }

    // Low runway prediction
    if (burnRate > 0 && cashOnHand > 0) {
      const currentMRR = mrrValues.length > 0 ? mrrValues[mrrValues.length - 1] : 0
      const netBurn = burnRate - currentMRR
      if (netBurn > 0) {
        const runway = Math.round(cashOnHand / netBurn)
        if (runway <= 12) {
          preds['low_runway'] = {
            message: t('financialIntelligence.predictionLowRunway', {
              months: runway,
            }),
            months: runway,
          }
        }
      }
    }

    return preds
  }, [forecastData, stressData, t])

  if (isLoading || forecastLoading || stressLoading) {
    return (
      <Card>
        <CardContent className="h-[150px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
          {t('financialIntelligence.errorLoading')}
        </CardContent>
      </Card>
    )
  }

  const risks = data?.risks ?? []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {risks.length > 0
            ? <AlertTriangle className="w-4 h-4 text-amber-500" />
            : <ShieldCheck className="w-4 h-4 text-green-500" />
          }
          {t('financialIntelligence.risksTitle')}
          {risks.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-red-100 text-red-700">
              {risks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {risks.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-700">
              {t('financialIntelligence.noRisks')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {risks.map((risk, i) => (
              <RiskCard
                key={`${risk.type}-${i}`}
                risk={risk}
                t={t}
                prediction={predictions[risk.type] ?? null}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RiskCard({
  risk,
  t,
  prediction,
}: {
  risk: FinancialRisk
  t: (key: string) => string
  prediction: { message: string; months: number } | null
}) {
  const Icon = RISK_ICONS[risk.type] ?? AlertTriangle
  const isCritical = risk.severity === 'critical'

  const bgColor = isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
  const iconColor = isCritical ? 'text-red-500' : 'text-amber-500'
  const titleColor = isCritical ? 'text-red-800' : 'text-amber-800'

  return (
    <div className={`p-3 rounded-lg border ${bgColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${titleColor}`}>
              {t(`financialIntelligence.risk_${risk.type}`)}
            </span>
            <Badge
              variant="secondary"
              className={`text-xs h-5 px-1.5 ${
                isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {t(`financialIntelligence.severity_${risk.severity}`)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{risk.evidence}</p>
          <p className="text-xs font-medium">{risk.action}</p>

          {/* UPGRADE 3: Predictive section */}
          {prediction && (
            <div className="mt-1.5 p-2 rounded bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-purple-100 text-purple-700">
                  {t('financialIntelligence.predictionBadge')}
                </Badge>
              </div>
              <p className="text-xs text-purple-800 mt-1">{prediction.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
