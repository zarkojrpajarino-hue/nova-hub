/**
 * FinancialIntelligencePanel — I15.98
 *
 * Dedicated dashboard panel that aggregates all Finance Agent insights.
 * Shows insights from integration_insights where agent_type='finance',
 * with trends and recommendations.
 */

import { useTranslation } from 'react-i18next'
import { GenericInsightsCard } from '../GenericInsightsCard'
import { TrendingUp } from 'lucide-react'

interface FinancialIntelligencePanelProps {
  projectId: string | undefined
}

export function FinancialIntelligencePanel({ projectId }: FinancialIntelligencePanelProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t('integrations.financialIntelligenceTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('integrations.financialIntelligenceDesc')}</p>
      </div>
      <GenericInsightsCard
        projectId={projectId}
        agentType="finance"
        title={t('integrations.financeAgentInsights')}
        icon={<TrendingUp size={15} className="text-indigo-500" />}
        badgeLabel={t('integrations.financeAgent')}
        sourceLabel="Stripe"
      />
    </div>
  )
}
