/**
 * UPGRADE 1 — ScenarioBuilder
 *
 * Custom what-if scenario builder.
 * Lets the founder define scenarios (hire, pricing change, lose top client, cash injection)
 * and see the impact on runway and cash-zero date vs base scenario.
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Loader2, FlaskConical, ArrowRight, TrendingDown, TrendingUp, Minus, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStressTest } from '@/hooks/useFinancialIntelligence'

interface ScenarioBuilderProps {
  projectId: string
}

interface ScenarioModifiers {
  newHires: number
  costPerHire: number
  pricingChangePct: number
  loseTopClient: boolean
  cashInjection: number
}

const DEFAULT_MODIFIERS: ScenarioModifiers = {
  newHires: 0,
  costPerHire: 3000,
  pricingChangePct: 0,
  loseTopClient: false,
  cashInjection: 0,
}

export function ScenarioBuilder({ projectId }: ScenarioBuilderProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useStressTest(projectId)
  const [modifiers, setModifiers] = useState<ScenarioModifiers>(DEFAULT_MODIFIERS)

  const baseInputs = data?.inputs

  const results = useMemo(() => {
    if (!baseInputs) return null

    const baseMRR = baseInputs.mrr ?? 0
    const baseBurn = baseInputs.burn_rate ?? 0
    const baseCash = baseInputs.cash_on_hand ?? 0
    const topClientPct = baseInputs.top_client_pct ?? 0

    // Apply modifiers
    let newMRR = baseMRR
    let newBurn = baseBurn
    let newCash = baseCash

    // Hire N people
    newBurn += modifiers.newHires * modifiers.costPerHire

    // Pricing change
    newMRR *= (1 + modifiers.pricingChangePct / 100)

    // Lose top client
    if (modifiers.loseTopClient) {
      newMRR *= (1 - topClientPct / 100)
    }

    // Cash injection
    newCash += modifiers.cashInjection

    // Compute runway
    const baseNetBurn = baseBurn - baseMRR
    const newNetBurn = newBurn - newMRR

    const baseRunway = baseNetBurn > 0 ? baseCash / baseNetBurn : Infinity
    const newRunway = newNetBurn > 0 ? newCash / newNetBurn : Infinity

    // Cash-zero date
    const now = new Date()
    const baseCashZero = baseRunway === Infinity
      ? null
      : new Date(now.getTime() + baseRunway * 30 * 24 * 60 * 60 * 1000)
    const newCashZero = newRunway === Infinity
      ? null
      : new Date(now.getTime() + newRunway * 30 * 24 * 60 * 60 * 1000)

    const runwayDelta = newRunway === Infinity && baseRunway === Infinity
      ? 0
      : newRunway === Infinity
        ? 999
        : baseRunway === Infinity
          ? -999
          : newRunway - baseRunway

    return {
      baseMRR,
      baseBurn,
      baseCash,
      newMRR: Math.round(newMRR),
      newBurn: Math.round(newBurn),
      newCash: Math.round(newCash),
      baseRunway: baseRunway === Infinity ? null : Math.round(baseRunway * 10) / 10,
      newRunway: newRunway === Infinity ? null : Math.round(newRunway * 10) / 10,
      baseCashZero,
      newCashZero,
      runwayDelta: Math.round(runwayDelta * 10) / 10,
      isProfitable: newNetBurn <= 0,
    }
  }, [baseInputs, modifiers])

  const hasModifications = modifiers.newHires > 0
    || modifiers.pricingChangePct !== 0
    || modifiers.loseTopClient
    || modifiers.cashInjection > 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!baseInputs || data?.status === 'insufficient_data') {
    return (
      <Card>
        <CardContent className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
          {t('financialIntelligence.scenarioInsufficientData')}
        </CardContent>
      </Card>
    )
  }

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '-'

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-500" />
            {t('financialIntelligence.scenarioTitle')}
          </CardTitle>
          {hasModifications && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setModifiers(DEFAULT_MODIFIERS)}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {t('financialIntelligence.scenarioReset')}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t('financialIntelligence.scenarioSubtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Modifier: New hires */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {t('financialIntelligence.scenarioHires', { count: modifiers.newHires })}
          </Label>
          <Slider
            value={[modifiers.newHires]}
            onValueChange={([v]) => setModifiers(p => ({ ...p, newHires: v }))}
            min={0}
            max={10}
            step={1}
          />
          {modifiers.newHires > 0 && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                {t('financialIntelligence.scenarioCostPerHire')}
              </Label>
              <Input
                type="number"
                className="h-7 w-28 text-xs"
                value={modifiers.costPerHire}
                onChange={(e) => setModifiers(p => ({ ...p, costPerHire: Number(e.target.value) || 0 }))}
              />
            </div>
          )}
        </div>

        {/* Modifier: Pricing change */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {t('financialIntelligence.scenarioPricing', { pct: modifiers.pricingChangePct > 0 ? `+${modifiers.pricingChangePct}` : modifiers.pricingChangePct })}
          </Label>
          <Slider
            value={[modifiers.pricingChangePct]}
            onValueChange={([v]) => setModifiers(p => ({ ...p, pricingChangePct: v }))}
            min={-50}
            max={100}
            step={5}
          />
        </div>

        {/* Modifier: Lose top client */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="loseTopClient"
            checked={modifiers.loseTopClient}
            onChange={(e) => setModifiers(p => ({ ...p, loseTopClient: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <Label htmlFor="loseTopClient" className="text-xs font-medium cursor-pointer">
            {t('financialIntelligence.scenarioLoseTopClient', {
              pct: Math.round(baseInputs.top_client_pct ?? 0),
            })}
          </Label>
        </div>

        {/* Modifier: Cash injection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {t('financialIntelligence.scenarioCashInjection')}
          </Label>
          <Input
            type="number"
            className="h-8 text-sm"
            placeholder="0"
            value={modifiers.cashInjection || ''}
            onChange={(e) => setModifiers(p => ({ ...p, cashInjection: Number(e.target.value) || 0 }))}
          />
        </div>

        {/* Results comparison */}
        {results && hasModifications && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                {t('financialIntelligence.scenarioResult')}
              </Badge>
            </div>

            {/* MRR comparison */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-muted-foreground">{t('financialIntelligence.scenarioMetric')}</div>
              <div className="text-muted-foreground text-center">{t('financialIntelligence.scenarioBase')}</div>
              <div className="text-muted-foreground text-center">{t('financialIntelligence.scenarioNew')}</div>

              <div className="font-medium">MRR</div>
              <div className="text-center">{results.baseMRR.toLocaleString('es-ES')}</div>
              <div className="text-center font-semibold">{results.newMRR.toLocaleString('es-ES')}</div>

              <div className="font-medium">Burn Rate</div>
              <div className="text-center">{results.baseBurn.toLocaleString('es-ES')}</div>
              <div className="text-center font-semibold">{results.newBurn.toLocaleString('es-ES')}</div>

              <div className="font-medium">Cash</div>
              <div className="text-center">{results.baseCash.toLocaleString('es-ES')}</div>
              <div className="text-center font-semibold">{results.newCash.toLocaleString('es-ES')}</div>
            </div>

            {/* Runway comparison */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs">
                <span className="text-muted-foreground">{t('financialIntelligence.scenarioRunway')}: </span>
                <span className="font-medium">
                  {results.baseRunway !== null
                    ? t('financialIntelligence.runwayMonths', { months: results.baseRunway })
                    : t('financialIntelligence.scenarioProfitable')}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="text-xs">
                <span className="font-bold">
                  {results.newRunway !== null
                    ? t('financialIntelligence.runwayMonths', { months: results.newRunway })
                    : t('financialIntelligence.scenarioProfitable')}
                </span>
              </div>
            </div>

            {/* Delta badge */}
            {results.runwayDelta !== 0 && (
              <div className="flex items-center gap-2">
                {results.runwayDelta > 0 ? (
                  <Badge className="text-xs bg-green-100 text-green-700 gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{results.runwayDelta} {t('financialIntelligence.scenarioMonths')}
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-red-100 text-red-700 gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {results.runwayDelta} {t('financialIntelligence.scenarioMonths')}
                  </Badge>
                )}
              </div>
            )}

            {/* Cash-zero date */}
            <div className="text-xs text-muted-foreground">
              {t('financialIntelligence.scenarioCashZero')}: {' '}
              {results.isProfitable ? (
                <span className="text-green-600 font-medium">
                  {t('financialIntelligence.scenarioNoCashZero')}
                </span>
              ) : (
                <span className="font-medium">
                  {formatDate(results.baseCashZero)} <ArrowRight className="w-3 h-3 inline" /> {formatDate(results.newCashZero)}
                </span>
              )}
            </div>
          </div>
        )}

        {!hasModifications && (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t('financialIntelligence.scenarioEmpty')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
