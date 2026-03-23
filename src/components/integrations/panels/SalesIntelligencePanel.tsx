/**
 * SalesIntelligencePanel — I15.99
 *
 * Dedicated dashboard panel that aggregates all Sales Agent insights.
 * Shows insights from integration_insights where agent_type='sales'.
 */

import { useTranslation } from 'react-i18next'
import { GenericInsightsCard } from '../GenericInsightsCard'
import { TrendingUp } from 'lucide-react'

interface SalesIntelligencePanelProps {
  projectId: string | undefined
}

export function SalesIntelligencePanel({ projectId }: SalesIntelligencePanelProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t('integrations.salesIntelligenceTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('integrations.salesIntelligenceDesc')}</p>
      </div>
      <GenericInsightsCard
        projectId={projectId}
        agentType="sales"
        title={t('integrations.salesAgentInsights')}
        icon={<TrendingUp size={15} className="text-orange-500" />}
        badgeLabel={t('integrations.salesAgent')}
        sourceLabel="HubSpot"
      />
    </div>
  )
}
