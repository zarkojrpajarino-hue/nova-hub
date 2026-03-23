/**
 * FI30.4 — CashFlowStressCard
 *
 * 3 horizontal bars: base / growth / crisis.
 * Color coded: green (safe, >6mo), amber (warning, 3-6mo), red (critical, <3mo).
 * If insufficient_data → shows UnlockProgress.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ShieldAlert, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStressTest, type StressScenario } from '@/hooks/useFinancialIntelligence'
import { useFeatureUnlock } from '@/hooks/useUnlockProgress'
import { UnlockGate } from '@/components/project/UnlockProgress'

interface CashFlowStressCardProps {
  projectId: string
}

const SEVERITY_COLORS = {
  safe: {
    bar: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
    label: 'safe',
  },
  warning: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    label: 'warning',
  },
  critical: {
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    label: 'critical',
  },
} as const

const MAX_BAR_MONTHS = 24

export function CashFlowStressCard({ projectId }: CashFlowStressCardProps) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useStressTest(projectId)
  const { data: unlockFeature } = useFeatureUnlock(projectId, 'f30_stress')

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (data?.status === 'insufficient_data' || (!data && !error)) {
    return (
      <UnlockGate
        feature={unlockFeature}
        title={t('financialIntelligence.stressUnlockTitle')}
        description={t('financialIntelligence.stressUnlockDescription')}
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

  const scenarios = data?.scenarios ?? []
  const baseScenario = scenarios.find(s => s.name === 'base')
  const crisisScenario = scenarios.find(s => s.name === 'crisis')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          {t('financialIntelligence.stressTitle')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('financialIntelligence.stressSubtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {scenarios.map((scenario) => (
          <ScenarioBar key={scenario.name} scenario={scenario} t={t} />
        ))}

        {/* Crisis comparison text */}
        {baseScenario && crisisScenario && crisisScenario.runway_months < 120 && (
          <p className="text-xs text-muted-foreground mt-2">
            {t('financialIntelligence.crisisComparison', {
              baseRunway: Math.min(baseScenario.runway_months, 120),
              crisisRunway: crisisScenario.runway_months,
            })}
          </p>
        )}

        {/* Source badge */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            {data?.has_integration
              ? t('financialIntelligence.enrichedSource')
              : t('financialIntelligence.manualSource')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ScenarioBar({ scenario, t }: { scenario: StressScenario; t: (key: string, opts?: Record<string, unknown>) => string }) {
  const colors = SEVERITY_COLORS[scenario.severity]
  const barWidth = Math.min((scenario.runway_months / MAX_BAR_MONTHS) * 100, 100)
  const displayMonths = scenario.runway_months >= 120 ? '120+' : scenario.runway_months.toString()

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">
          {t(`financialIntelligence.scenario_${scenario.name}`)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t('financialIntelligence.runwayMonths', { months: displayMonths })}
          </span>
          <Badge variant="secondary" className={`text-xs h-5 px-1.5 ${colors.badge}`}>
            {t(`financialIntelligence.severity_${scenario.severity}`)}
          </Badge>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className={`${colors.bar} rounded-full h-2.5 transition-all duration-700`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}
