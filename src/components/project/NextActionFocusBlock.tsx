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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useProjectEngineData } from '@/hooks/useNovaDataOptimized'
import { useAgentContext } from '@/hooks/useAgentContext'
import { useProjectContext } from '@/hooks/useProjectContext'
import { buildNextAction } from '@/lib/build-next-action'

interface NextActionFocusBlockProps {
  projectId:      string
  onNavigateToTab?: (tab: string) => void
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
  high:   { label: 'Urgente',      className: 'bg-red-100 text-red-800 border-red-200' },
  medium: { label: 'Esta semana',  className: 'bg-amber-100 text-amber-800 border-amber-200' },
  low:    { label: 'En progreso',  className: 'bg-blue-100 text-blue-800 border-blue-200' },
}

export function NextActionFocusBlock({
  projectId,
  onNavigateToTab,
}: NextActionFocusBlockProps) {
  const navigate = useNavigate()
  const [signalsExpanded, setSignalsExpanded] = useState(false)

  const { data: engineData } = useProjectEngineData(projectId)
  const { data: agentCtx }   = useAgentContext(projectId)
  const { data: projectCtx } = useProjectContext(projectId)
  const { data: overdueCount = 0 } = useOverdueTasks(projectId)

  const nextAction = buildNextAction(
    engineData,
    agentCtx?.insights ?? [],
    { overdueCount },
    projectCtx ?? { mode: 'solo', teamSize: 0, operationalComplexity: 'low' },
  )

  if (!nextAction || nextAction.type === 'none') return null

  const urgencyConfig = URGENCY_CONFIG[nextAction.urgency]

  function handleCTA() {
    if (!nextAction) return
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
        onNavigateToTab?.('reuniones')
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
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tu prioridad ahora
        </span>
      </div>

      {/* Title + description */}
      <div className="space-y-1">
        <p className="text-lg font-semibold leading-snug">{nextAction.title}</p>
        <p className="text-sm text-muted-foreground">{nextAction.description}</p>
      </div>

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
            >
              Ver tareas
            </button>
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
    </div>
  )
}
