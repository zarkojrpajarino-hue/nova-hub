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

import { useState, useEffect } from 'react'
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
function useAnalysisUrgentDecisions(projectId: string) {
  const { t } = useTranslation();
  return useQuery({
    queryKey: ['analysis-urgent', projectId],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_analysis_cache')
        .select('sections, generated_at')
        .eq('project_id', projectId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!data) return []
      const sections = data.sections as AnalysisSection | null
      return sections?.urgent_decisions ?? []
    },
  })
}

function useOverdueTasks(projectId: string) {
  return useQuery({
    queryKey:  ['overdue_tasks', projectId],
    staleTime: 2 * 60_000,
    queryFn:   async () => {
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .neq('status', 'done')
        .lt('fecha_limite', new Date().toISOString())
      return count ?? 0
    },
  })
}

const URGENCY_CONFIG = {
  high:   { label: t('project.urgente'),      className: 'bg-red-100 text-red-800 border-red-200' },
  medium: { label: t('project.estaSemana'),  className: 'bg-amber-100 text-amber-800 border-amber-200' },
  low:    { label: t('project.enProgreso'),  className: 'bg-blue-100 text-blue-800 border-blue-200' },
}

const RELIABILITY_CONFIG = {
  high:   { icon: ShieldCheck, className: 'text-emerald-600 dark:text-emerald-400' },
  medium: { icon: ShieldAlert,  className: 'text-amber-600 dark:text-amber-400'   },
  low:    { icon: ShieldOff,    className: 'text-red-500 dark:text-red-400'        },
}

const SOURCE_LABEL: Partial<Record<string, string>> = {
  stripe:          t('project.stripe'),
  holded:          t('project.holded'),
  hubspot:         t('project.hubspot'),
  asana:           t('project.asana'),
  google_calendar: t('project.calendar'),
  user_manual:     t('project.manual'),
  ai_inferred:     t('project.estimación'),
}

export function NextActionFocusBlock({
  projectId,
  onNavigateToTab,
}: NextActionFocusBlockProps) {
  const _navigate = useNavigate()
  const [signalsExpanded, setSignalsExpanded] = useState(false)

  const { data: engineData } = useProjectEngineData(projectId)
  const { data: agentCtx }   = useAgentContext(projectId)
  const { data: projectCtx } = useProjectContext(projectId)
  const { data: overdueCount = 0 } = useOverdueTasks(projectId)
  const { data: urgentDecisions = [] } = useAnalysisUrgentDecisions(projectId)

  // AUD.M.4 — Digest Mode vars
  const agentInsights = agentCtx?.insights ?? []
  const riskLevel = engineData?.risk?.risk_level ?? 'low'
  const isDigestMode = agentInsights.length >= 3 && riskLevel !== 'critical'

  const nextAction = buildNextAction(
    engineData,
    agentInsights,
    { overdueCount },
    projectCtx ?? { mode: 'solo', teamSize: 0, operationalComplexity: 'low' },
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
        // F19.V2.3: tab 'reuniones' en PHASE_TAB_CONFIG pero no en ProjectPage TABS todavía.
        // Navegar a tareas como alternativa funcional hasta que el tab se implemente.
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
                · {SOURCE_LABEL[ri.source] ?? ri.source}
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
    </div>
  )
}
