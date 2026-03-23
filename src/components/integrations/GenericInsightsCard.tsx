/**
 * GenericInsightsCard — reusable insights display for any agent type.
 *
 * Reads from integration_insights filtered by agent_type + project_id.
 * Used by Slack (slack_communication) and Notion (notion_knowledge) integrations,
 * and can be used by any future agent that doesn't have a dedicated InsightsCard.
 */

import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { EvidenceBadge } from '@/components/evidence/EvidenceBadge'
import { SourcesPanel } from '@/components/evidence/SourcesPanel'
import type { EvidenceType, SourceUsed, SourceDiscarded, ProviderSlug } from '@/lib/evidence'

interface InsightPayload {
  signal: { metric_name: string; current_value: number; data_points: number }
  content: {
    summary:      string
    implication:  string
    severity:     'info' | 'attention' | 'warning' | 'critical'
    action_hint?: string
  }
}

const SEVERITY_CONFIG = {
  info:      { badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',    icon: <Info size={13} /> },
  attention: { badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: <AlertTriangle size={13} /> },
  warning:   { badge: 'bg-red-500/10 text-red-700 dark:text-red-400',       icon: <AlertTriangle size={13} /> },
  critical:  { badge: 'bg-red-900/20 text-red-800 dark:text-red-300',       icon: <AlertTriangle size={13} /> },
} as const

function SeverityBadge({ severity }: { severity: keyof typeof SEVERITY_CONFIG }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${cfg.badge}`}>
      {cfg.icon}
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}

async function getActiveInsights(projectId: string, agentType: string) {
  const { data } = await supabase
    .from('integration_insights')
    .select('id, insight_type, payload, confidence, generated_at, evidence_type, sources_used, sources_discarded')
    .eq('project_id', projectId)
    .eq('agent_type', agentType)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(10)
  return data ?? []
}

interface GenericInsightsCardProps {
  projectId: string | undefined
  agentType: string
  title: string
  icon: ReactNode
  badgeLabel: string
  sourceLabel: string
}

export function GenericInsightsCard({ projectId, agentType, title, icon, badgeLabel, sourceLabel }: GenericInsightsCardProps) {
  const { data: insights, isLoading } = useQuery({
    queryKey:  [`${agentType}_insights`, projectId],
    enabled:   !!projectId,
    staleTime: 60_000,
    queryFn:   () => getActiveInsights(projectId!, agentType),
  })

  if (!projectId) return null
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 size={14} className="animate-spin" />Analizando...
      </div>
    )
  }
  if (!insights || insights.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal">{badgeLabel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const payload = insight.payload as InsightPayload
          const { content, signal } = payload
          const evidenceType = insight.evidence_type as EvidenceType | undefined
          const sourcesUsed = (insight.sources_used ?? []) as SourceUsed[]
          const sourcesDiscarded = (insight.sources_discarded ?? []) as SourceDiscarded[]

          return (
            <div
              key={insight.id}
              className={`rounded-lg p-3 space-y-1.5 border ${
                content.severity === 'warning' || content.severity === 'critical'
                  ? 'border-red-500/20 bg-red-500/5'
                  : content.severity === 'attention'
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : 'border-border/40 bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <SeverityBadge severity={content.severity} />
                <span className="text-xs text-muted-foreground font-mono">
                  {insight.insight_type}
                </span>
                {evidenceType && (
                  <EvidenceBadge
                    type={evidenceType}
                    source={sourcesUsed[0]?.source as ProviderSlug | undefined}
                    compact
                  />
                )}
              </div>
              <p className="text-sm font-medium">{content.summary}</p>
              <p className="text-xs text-muted-foreground">{content.implication}</p>
              {content.action_hint && (
                <p className="text-xs text-foreground/70 font-medium pt-0.5">
                  → {content.action_hint}
                </p>
              )}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-muted-foreground/60">
                  {signal.data_points} entidad{signal.data_points !== 1 ? 'es' : ''} · {sourceLabel}
                </span>
                <span className="text-xs text-muted-foreground/60">
                  {new Date(insight.generated_at).toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              {evidenceType && (
                <SourcesPanel
                  sources_used={sourcesUsed}
                  sources_discarded={sourcesDiscarded}
                  evidence_type={evidenceType}
                  generated_at={insight.generated_at}
                  project_id={projectId}
                  insight_type={insight.insight_type}
                />
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
