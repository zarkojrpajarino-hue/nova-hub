/**
 * ExecutionIntelligencePanel — I15.100
 *
 * Dedicated dashboard panel that aggregates all Execution Agent insights.
 * Shows insights from integration_insights where agent_type='execution'.
 */

import { useTranslation } from 'react-i18next'
import { GenericInsightsCard } from '../GenericInsightsCard'
import { CheckSquare } from 'lucide-react'

interface ExecutionIntelligencePanelProps {
  projectId: string | undefined
}

export function ExecutionIntelligencePanel({ projectId }: ExecutionIntelligencePanelProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t('integrations.executionIntelligenceTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('integrations.executionIntelligenceDesc')}</p>
      </div>
      <GenericInsightsCard
        projectId={projectId}
        agentType="execution"
        title={t('integrations.executionAgentInsights')}
        icon={<CheckSquare size={15} className="text-pink-500" />}
        badgeLabel={t('integrations.executionAgent')}
        sourceLabel="Asana"
      />
    </div>
  )
}
