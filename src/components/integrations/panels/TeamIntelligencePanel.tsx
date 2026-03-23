/**
 * TeamIntelligencePanel — I15.101
 *
 * Dedicated dashboard panel for Team Agent insights.
 * Reads from integration_insights where agent_type='team'.
 * Team Agent (I15.81) reads project_members activity as signal source.
 */

import { useTranslation } from 'react-i18next'
import { GenericInsightsCard } from '../GenericInsightsCard'
import { Users } from 'lucide-react'

interface TeamIntelligencePanelProps {
  projectId: string | undefined
}

export function TeamIntelligencePanel({ projectId }: TeamIntelligencePanelProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t('integrations.teamIntelligenceTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('integrations.teamIntelligenceDesc')}</p>
      </div>
      <GenericInsightsCard
        projectId={projectId}
        agentType="team"
        title={t('integrations.teamAgentInsights')}
        icon={<Users size={15} className="text-emerald-500" />}
        badgeLabel={t('integrations.teamAgent')}
        sourceLabel={t('integrations.projectMembers')}
      />
    </div>
  )
}
