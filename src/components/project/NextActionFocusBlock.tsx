/**
 * NextActionFocusBlock — F19.A.3
 *
 * El primer elemento del dashboard: Next Action en primer plano.
 * Integra buildNextAction() con señales de agents, tareas vencidas
 * y contexto solo/equipo.
 *
 * - Si no hay Next Action (type='none'): no renderiza nada.
 * - Solo mode: filtra tipo 'meeting'.
 * - "Ver señales ▼": expande panel inline con bullets y contexto.
 */

import { useState, useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useProjectEngineData } from '@/hooks/useNovaDataOptimized'
import { useAgentContext } from '@/hooks/useAgentContext'
import { useProjectContext } from '@/hooks/useProjectContext'
import { buildNextAction } from '@/lib/build-next-action'
import { useExecutionTrends } from '@/hooks/useExecutionTrends'
import { SourceBadge } from '@/components/shared/SourceBadge';
import {
  trackFocusBlockImpression,
  trackFocusBlockCTAClicked,
} from '@/lib/analytics'
import type { AnalysisSection } from '@/hooks/useProjectAnalysis'

import { useTranslation } from 'react-i18next';
interface NextActionFocusBlockProps {
  projectId:      string
  onNavigateToTab?: (tab: string) => void
}

// F20.V2.3 — lee urgent_decisions del análisis más reciente (cualquier nivel)
// V5.2.9 — also extracts benchmarking signal for risk elevation
function useAnalysisSignals(projectId: string) {
  return useQuery({
    queryKey: ['analysis-signals', projectId],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_analysis_cache')
        .select('sections, generated_at')
        .eq('project_id', projectId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!data) return { urgentDecisions: [], benchmarkSignal: undefined }
      const sections = data.sections as AnalysisSection | null
      const urgentDecisions = sections?.urgent_decisions ?? []
      // V5.2.9 — Extract benchmarking percentile from phase_fit or executive_summary
      const momentumScore = sections?.executive_summary?.momentum_score
      const benchmarkSignal = momentumScore !== undefined
        ? { percentile: momentumScore, isBottom20: momentumScore < 20 }
        : undefined
      return { urgentDecisions, benchmarkSignal }
    },
  })
}

function useOverdueTasks(projectId: string) {
  return useQuery({
    queryKey:  ['overdue_tasks', projectId],
    staleTime: 2 * 60_000,
    queryFn:   async () => {
      // F19.V2.2 — Also fetch oldest overdue task for meeting escalation
      const { data, count } = await supabase
        .from('tasks')
        .select('fecha_limite', { count: 'exact' })
        .eq('project_id', projectId)
        .neq('status', 'done')
        .lt('fecha_limite', new Date().toISOString())
        .order('fecha_limite', { ascending: true })
        .limit(1)
      const overdueCount = count ?? 0
      let oldestOverdueDays = 0
      if (data?.[0]?.fecha_limite) {
        oldestOverdueDays = Math.floor(
          (Date.now() - new Date(data[0].fecha_limite).getTime()) / 86_400_000,
        )
      }
      return { overdueCount, oldestOverdueDays }
    },
  })
}

function getUrgencyConfig(t: (k: string) => string) {
  return {
    high:   { label: t('project.urgente'),      className: 'bg-red-100 text-red-800 border-red-200' },
    medium: { label: t('project.estaSemana'),  className: 'bg-amber-100 text-amber-800 border-amber-200' },
    low:    { label: t('project.enProgreso'),  className: 'bg-blue-100 text-blue-800 border-blue-200' },
  };
}

const RELIABILITY_CONFIG = {
  high:   { icon: ShieldCheck, className: 'text-emerald-600 dark:text-emerald-400' },
  medium: { icon: ShieldAlert,  className: 'text-amber-600 dark:text-amber-400'   },
  low:    { icon: ShieldOff,    className: 'text-red-500 dark:text-red-400'        },
}

const SOURCE_LABEL_KEYS: Partial<Record<string, string>> = {
  stripe:          'project.stripe',
  holded:          'project.holded',
  hubspot:         'project.hubspot',
  asana:           'project.asana',
  google_calendar: 'project.calendar',
  user_manual:     'project.manual',
  ai_inferred:     'project.estimación',
}

export const NextActionFocusBlock = memo(function NextActionFocusBlock({
  projectId,
  onNavigateToTab,
}: NextActionFocusBlockProps) {
  const { t } = useTranslation();
  const URGENCY_CONFIG = getUrgencyConfig(t);
  const _navigate = useNavigate()
  const [signalsExpanded, setSignalsExpanded] = useState(false)

  const { data: engineData } = useProjectEngineData(projectId)
  const { data: agentCtx }   = useAgentContext(projectId)
  const { data: projectCtx } = useProjectContext(projectId)
  const { data: overdueData } = useOverdueTasks(projectId)
  const overdueCount = overdueData?.overdueCount ?? 0
  const oldestOverdueDays = overdueData?.oldestOverdueDays ?? 0
  const { data: analysisSignals } = useAnalysisSignals(projectId)
  const urgentDecisions = analysisSignals?.urgentDecisions ?? []
  const benchmarkSignal = analysisSignals?.benchmarkSignal
  const { data: trendsData } = useExecutionTrends(projectId, 4)

  // ER29.10 — Detect consistent trend (4 weeks same direction)
  const consistentTrend = (() => {
    if (!trendsData?.trends) return null
    const { tasks, obvs } = trendsData.trends
    if (tasks === 'up' && tasks === obvs) return { metric: 'tareas y OBVs', direction: 'up' as const }
    if (tasks === 'up') return { metric: 'tareas', direction: 'up' as const }
    if (obvs === 'up') return { metric: 'OBVs', direction: 'up' as const }
    if (tasks === 'down') return { metric: 'tareas', direction: 'down' as const }
    return null
  })()

  // AUD.M.4 — Digest Mode vars
  const agentInsights = agentCtx?.insights ?? []
  const riskLevel = engineData?.risk?.risk_level ?? 'low'
  const isDigestMode = agentInsights.length >= 3 && riskLevel !== 'critical'

  const nextAction = buildNextAction(
    engineData,
    agentInsights,
    { overdueCount, oldestOverdueDays },
    projectCtx ?? { mode: 'solo', teamSize: 0, operationalComplexity: 'low' },
    urgentDecisions,
    benchmarkSignal,
  )

  // AUD.A.4 — PostHog: impression cuando el bloque se muestra
  useEffect(() => {
    if (!nextAction || nextAction.type === 'none') return
    trackFocusBlockImpression({
      project_id: projectId,
      urgency:    nextAction.urgency,
      source:     nextAction.source,
      phase:      engineData?.phaseState?.current_phase,
    })
  // Solo al montar o cuando cambia el nextAction.type — no en cada re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextAction?.type, projectId])

  if (!nextAction || nextAction.type === 'none') return null

  // AUD.M.4 — Digest Mode: ≥3 agent signals y riesgo no crítico → resumen consolidado
  if (isDigestMode && nextAction.source === 'agents') {
    const _mostSevereInsight = agentInsights[0]
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">{t('project.digest')}</Badge>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {agentInsights.length} señales activas — resumen del sistema
          </span>
        <SourceBadge type="inferred" source={t('transparency.motorYAgentesIA')} reliability={0.4} size="sm" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold leading-snug">{nextAction.title}</p>
          {agentInsights.length > 1 && (
            <p className="text-sm text-muted-foreground">
              +{agentInsights.length - 1} señal{agentInsights.length - 1 > 1 ? 'es' : ''} adicional{agentInsights.length - 1 > 1 ? 'es' : ''} detectada{agentInsights.length - 1 > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setSignalsExpanded(v => !v)}
        >
          Ver todas las señales
          {signalsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {signalsExpanded && (
          <div className="border-t border-border pt-3 space-y-1">
            {agentInsights.slice(0, 5).map((ins, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                {ins.content.summary}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const urgencyConfig = URGENCY_CONFIG[nextAction.urgency]

  function handleCTA() {
    if (!nextAction) return
    // AUD.A.4 — PostHog: CTA click
    trackFocusBlockCTAClicked({
      project_id:  projectId,
      action_type: nextAction.actionType ?? nextAction.type,
      urgency:     nextAction.urgency,
      source:      nextAction.source,
    })
    switch (nextAction.actionType) {
      case 'create_obv':
        onNavigateToTab?.('obvs')
        break
      case 'add_metrics':
        onNavigateToTab?.('financiero')
        break
      case 'define_channel':
        onNavigateToTab?.('obvs')
        break
      case 'create_task':
        onNavigateToTab?.('tareas')
        break
      case 'open_meeting':
        // Tab 'reuniones' planificado pero no implementado. Fallback a tareas.
        onNavigateToTab?.('tareas')
        break
      default:
        break
    }
  }

  function handleOverdueLink() {
    onNavigateToTab?.('tareas')
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn('text-xs font-medium border', urgencyConfig.className)}
        >
          {urgencyConfig.label}
        </Badge>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('project.tuPrioridadAhora')}</span>
      </div>

      {/* Title + description */}
      <div className="space-y-1">
        <p className="text-lg font-semibold leading-snug">{nextAction.title}</p>
        <p className="text-sm text-muted-foreground">{nextAction.description}</p>
      </div>

      {/* T17.V2.1 — Fiabilidad visible sin expandir señales */}
      {nextAction.reliabilityInfo && (() => {
        const ri  = nextAction.reliabilityInfo!
        const cfg = RELIABILITY_CONFIG[ri.level]
        const Icon = cfg.icon
        return (
          <div className={cn('flex items-center gap-1.5 text-xs', cfg.className)}>
            <Icon size={11} className="shrink-0" />
            <span>{ri.label}</span>
            {ri.source && (
              <span className="text-muted-foreground/70">
                · {SOURCE_LABEL_KEYS[ri.source] ? t(SOURCE_LABEL_KEYS[ri.source]!) : ri.source}
              </span>
            )}
          </div>
        )
      })()}

      {/* F19.V2.1 — Aviso de baja fiabilidad cuando la acción se basa en estimados */}
      {nextAction.reliabilityInfo?.level === 'low' && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">{t('project.acciónBasadaEnDatos')}</div>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-3 flex-wrap">
        {nextAction.ctaLabel && nextAction.actionType && (
          <Button size="sm" onClick={handleCTA}>
            {nextAction.ctaLabel}
          </Button>
        )}

        {nextAction.signals.length > 0 && (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSignalsExpanded((v) => !v)}
          >
            Ver señales
            {signalsExpanded
              ? <ChevronUp className="h-3 w-3" />
              : <ChevronDown className="h-3 w-3" />
            }
          </button>
        )}
      </div>

      {/* Overdue secondary note */}
      {overdueCount >= 1 && nextAction.type !== 'task' && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>
            También tienes {overdueCount} tarea{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''} ·{' '}
            <button
              className="underline underline-offset-2 hover:no-underline"
              onClick={handleOverdueLink}
            >{t('project.verTareas')}</button>
          </span>
        </div>
      )}

      {/* Signals panel */}
      {signalsExpanded && nextAction.signals.length > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <ul className="space-y-1">
            {nextAction.signals.slice(0, 3).map((signal, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                {signal}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground/60">
            Calculado por: Motor del proyecto
            {(agentCtx?.insights?.length ?? 0) > 0 &&
              ` + ${agentCtx!.insights.length} agente${agentCtx!.insights.length > 1 ? 's' : ''} activo${agentCtx!.insights.length > 1 ? 's' : ''}`
            }
          </p>
        </div>
      )}

      {/* F20.V2.3 — Decisiones urgentes del Análisis Estratégico */}
      {urgentDecisions.length > 0 && nextAction.urgency !== 'high' && (
        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Análisis estratégico · {urgentDecisions.length} decisión{urgentDecisions.length > 1 ? 'es' : ''} urgente{urgentDecisions.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-foreground/80">{urgentDecisions[0].title}</p>
          {urgentDecisions[0].cta?.view && (
            <button
              className="mt-1 text-xs text-primary underline underline-offset-2 hover:no-underline"
              onClick={() => onNavigateToTab?.('analisis')}
            >
              {urgentDecisions[0].cta.label ?? t('project.verAnálisis')}
            </button>
          )}
        </div>
      )}

      {/* ER29.10 — Execution trend signal when consistent for 4+ weeks */}
      {consistentTrend && (
        <div className={cn(
          'border-t border-border pt-3 flex items-center gap-1.5 text-xs',
          consistentTrend.direction === 'up'
            ? 'text-green-600 dark:text-green-400'
            : 'text-amber-600 dark:text-amber-400'
        )}>
          <span className="shrink-0">{consistentTrend.direction === 'up' ? '↑' : '↓'}</span>
          <span>
            {t('pipelineVelocity.focusSignal', { metric: consistentTrend.metric, weeks: '4' })}
          </span>
        </div>
      )}
    </div>
  )
});
