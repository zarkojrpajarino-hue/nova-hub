/**
 * FinanceInsightsCard — I15.78
 *
 * Muestra los insights activos del Finance Agent para una conexión Stripe.
 * Lee de integration_insights (persiste entre reloads — no depende de sesión).
 *
 * Reglas de display (AGENTS_CONTRACT.md §4.3):
 * - summary: factual, tiempo presente
 * - implication: impacto en el proyecto
 * - action_hint: solo si es obvio — no inventado
 * - severity badge: info=azul, attention=ámbar, warning=rojo, critical=rojo oscuro
 *
 * El badge t('integrations.financeAgent0') identifica la fuente (§4 — no texto generado por UI directamente).
 */

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { getActiveFinanceInsights } from '@/services/financeAgentService'
import { EvidenceBadge } from '@/components/evidence/EvidenceBadge'
import { SourcesPanel } from '@/components/evidence/SourcesPanel'
import type { EvidenceType, SourceUsed, SourceDiscarded, ProviderSlug } from '@/lib/evidence'

import { useTranslation } from 'react-i18next';
interface InsightPayload {
  signal: { metric_name: string; current_value: number; data_points: number }
  content: {
    summary: string
    implication: string
    severity: 'info' | 'attention' | 'warning' | 'critical'
    action_hint?: string
  }
}

const SEVERITY_CONFIG = {
  info:      { badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',   icon: <Info size={13} /> },
  attention: { badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: <AlertTriangle size={13} /> },
  warning:   { badge: 'bg-red-500/10 text-red-700 dark:text-red-400',      icon: <AlertTriangle size={13} /> },
  critical:  { badge: 'bg-red-900/20 text-red-800 dark:text-red-300',      icon: <AlertTriangle size={13} /> },
} as const

function SeverityBadge({ severity }: { severity: keyof typeof SEVERITY_CONFIG }) {
  const { t: _t } = useTranslation();
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${cfg.badge}`}>
      {cfg.icon}
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}

interface FinanceInsightsCardProps {
  projectId: string | undefined
}

export function FinanceInsightsCard({ projectId }: FinanceInsightsCardProps) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['finance_insights', projectId],
    enabled: !!projectId,
    staleTime: 60_000,
    queryFn: () => getActiveFinanceInsights(projectId!),
  })

  // No renderizar si no hay proyecto, está cargando sin datos o no hay insights
  if (!projectId) return null
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 size={14} className="animate-spin" />{t('integrations.analizandoDatosFinancieros')}</div>
    )
  }
  if (!insights || insights.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp size={15} className="text-indigo-500" />{t('integrations.análisisFinanciero')}<Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal">{t('integrations.financeAgent')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const payload = insight.payload as InsightPayload
          const { content } = payload
          const _cfg = SEVERITY_CONFIG[content.severity] ?? SEVERITY_CONFIG.info

          const evidenceType = (insight as unknown as { evidence_type?: string }).evidence_type as EvidenceType | undefined
          const sourcesUsed = ((insight as unknown as { sources_used?: unknown }).sources_used ?? []) as SourceUsed[]
          const sourcesDiscarded = ((insight as unknown as { sources_discarded?: unknown }).sources_discarded ?? []) as SourceDiscarded[]

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
              {/* §4.3 — summary: 1 frase factual */}
              <p className="text-sm font-medium">{content.summary}</p>
              {/* §4.3 — implication: impacto en el proyecto */}
              <p className="text-xs text-muted-foreground">{content.implication}</p>
              {/* §4.3 — action_hint: solo si existe */}
              {content.action_hint && (
                <p className="text-xs text-foreground/70 font-medium pt-0.5">
                  → {content.action_hint}
                </p>
              )}
              {/* Trazabilidad: data_points + timestamp */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-muted-foreground/60">
                  {payload.signal.data_points} entidad{payload.signal.data_points !== 1 ? 'es' : ''} · Stripe
                </span>
                <span className="text-xs text-muted-foreground/60">
                  {new Date(insight.generated_at).toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              {/* T17.20 — fuentes colapsables */}
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
