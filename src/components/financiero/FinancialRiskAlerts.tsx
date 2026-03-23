/**
 * FI30.6 — FinancialRiskAlerts
 *
 * Panel with risk cards, colored by severity.
 * Each: icon + what's happening + why it matters + what to do.
 * If no risks → green "Sin alertas financieras activas".
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ShieldCheck, AlertTriangle, AlertOctagon, TrendingDown, CreditCard, Users, Banknote, Activity, Handshake } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFinancialRisks, type FinancialRisk } from '@/hooks/useFinancialIntelligence'

interface FinancialRiskAlertsProps {
  projectId: string
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

  if (isLoading) {
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
              <RiskCard key={`${risk.type}-${i}`} risk={risk} t={t} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RiskCard({ risk, t }: { risk: FinancialRisk; t: (key: string) => string }) {
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
          <div className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  )
}
