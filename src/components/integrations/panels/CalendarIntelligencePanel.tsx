/**
 * CalendarIntelligencePanel — I15.102
 *
 * Dedicated dashboard panel for Calendar Agent insights.
 * Reads from integration_insights where agent_type='calendar'.
 */

import { useTranslation } from 'react-i18next'
import { GenericInsightsCard } from '../GenericInsightsCard'
import { CalendarDays } from 'lucide-react'

interface CalendarIntelligencePanelProps {
  projectId: string | undefined
}

export function CalendarIntelligencePanel({ projectId }: CalendarIntelligencePanelProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t('integrations.calendarIntelligenceTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('integrations.calendarIntelligenceDesc')}</p>
      </div>
      <GenericInsightsCard
        projectId={projectId}
        agentType="calendar"
        title={t('integrations.calendarAgentInsights')}
        icon={<CalendarDays size={15} className="text-blue-500" />}
        badgeLabel={t('integrations.calendarAgent')}
        sourceLabel="Google Calendar"
      />
    </div>
  )
}
