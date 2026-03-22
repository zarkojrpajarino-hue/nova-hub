/**
 * build-next-action.ts — F19.A.1
 *
 * Extiende getNextAction() con señales de agents y tareas.
 * NO modifica el archivo existente (next-action.ts) — backward compatible.
 *
 * Lógica de prioridad (orden estricto):
 *   1. riskLevel === 'critical'              → siempre gana (regla existente)
 *   2. overdueCount ≥ 3                      → tareas bloquean avance
 *   3. Agent insight con severity='critical' → acción del agente
 *   4. overdueCount ≥ 1                      → señal secundaria (no bloquea)
 *   5. Agent insight con severity='warning'  → señal secundaria
 *   6. Fallback: getNextAction() base
 *
 * Solo/equipo: si mode==='solo' → type 'meeting' se filtra a 'task' o 'obv'.
 */

import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized'
import { getNextAction } from '@/lib/next-action'
import type { SynthesizedInsight } from '@/lib/agent-synthesis'
import { getReliabilityLabel, type ReliabilityLabel, type ProviderSlug } from '@/lib/evidence'

export interface ProjectContext {
  mode:                  'solo' | 'team'
  teamSize:              number
  operationalComplexity: 'low' | 'medium' | 'high'
}

export interface EnrichedNextAction {
  title:       string
  description: string
  type:        'obv' | 'task' | 'meeting' | 'metric' | 'none'
  urgency:     'low' | 'medium' | 'high'
  source:      'engine' | 'agents' | 'tasks'
  actionType?: 'create_obv' | 'add_metrics' | 'define_channel' | 'create_task' | 'open_meeting'
  ctaLabel?:   string
  signals:     string[]  // razones legibles para "Ver señales ▼"
  /** T17.V2.1 — info de fiabilidad visible sin expandir señales */
  reliabilityInfo?: ReliabilityLabel & { score: number; source?: ProviderSlug }
}

function agentTypeLabel(agentType: string): string {
  const labels: Record<string, string> = {
    finance:   'Finance Agent',
    execution: 'Execution Agent',
    sales:     'Sales Agent',
    calendar:  'Calendar Agent',
    team:      'Team Agent',
  }
  return labels[agentType] ?? agentType
}

export function buildNextAction(
  engineData:    ProjectEngineData | null | undefined,
  agentInsights: SynthesizedInsight[],
  taskStats:     { overdueCount: number },
  context:       ProjectContext,
): EnrichedNextAction {
  const signals: string[] = []
  const riskLevel = engineData?.risk?.risk_level ?? 'low'
  const riskStatus = engineData?.risk?.risk_status ?? 'insufficient_data'

  // ── 1. Riesgo crítico — siempre gana ────────────────────────────────────────
  if (riskStatus === 'active' && riskLevel === 'critical') {
    return {
      title:       'Reduce el riesgo crítico antes de avanzar',
      description: 'Hay un riesgo crítico activo que puede invalidar el progreso actual.',
      type:        'task',
      urgency:     'high',
      source:      'engine',
      signals:     ['Riesgo crítico activo en el motor del proyecto'],
    }
  }

  // ── 2. overdueCount ≥ 3 — tareas bloquean el avance ─────────────────────────
  if (taskStats.overdueCount >= 3) {
    return {
      title:       `Tienes ${taskStats.overdueCount} tareas bloqueando el avance`,
      description: 'Las tareas vencidas reducen tu score de ejecución. Resuélvelas antes de añadir más trabajo.',
      type:        'task',
      urgency:     'high',
      source:      'tasks',
      actionType:  'create_task',
      ctaLabel:    'Ver tareas',
      signals:     [`${taskStats.overdueCount} tareas vencidas`],
    }
  }

  // Acumular señales de overdue (1-2 tareas: señal secundaria, no bloquea)
  if (taskStats.overdueCount >= 1) {
    signals.push(
      `${taskStats.overdueCount} tarea${taskStats.overdueCount > 1 ? 's' : ''} vencida${taskStats.overdueCount > 1 ? 's' : ''}`,
    )
  }

  // ── 3. Agent insight crítico ─────────────────────────────────────────────────
  const criticalInsight = agentInsights.find((i) => i.content.severity === 'critical')
  if (criticalInsight) {
    const type = context.mode === 'solo' ? 'task' : 'meeting'

    // T17.V2.2 — si reliability < 0.4 (estimado, sin entidades) → degradar a 'medium'
    const rs = criticalInsight.reliability_score
    const urgency: 'high' | 'medium' = (rs !== undefined && rs < 0.4) ? 'medium' : 'high'

    // T17.V2.1 — reliabilityInfo para mostrar en Focus Block sin expandir señales
    const reliabilityInfo: EnrichedNextAction['reliabilityInfo'] = rs !== undefined
      ? { ...getReliabilityLabel(rs), score: rs, source: criticalInsight.sources?.[0]?.source }
      : undefined

    return {
      title:          criticalInsight.content.summary,
      description:    criticalInsight.content.implication,
      type,
      urgency,
      source:         'agents',
      ctaLabel:       criticalInsight.content.action_hint ?? undefined,
      reliabilityInfo,
      signals:        [
        `${agentTypeLabel(criticalInsight.agent_type)}: señal crítica`,
        ...signals,
      ],
    }
  }

  // ── 5. Señales de warning de agents (secundarias) ────────────────────────────
  const warningInsights = agentInsights.filter((i) => i.content.severity === 'warning')
  for (const w of warningInsights.slice(0, 2)) {
    signals.push(`${agentTypeLabel(w.agent_type)}: ${w.content.summary}`)
  }

  // ── 6. Fallback al getNextAction() base del motor ───────────────────────────
  const base = getNextAction(engineData)
  if (!base) {
    return {
      title:       '',
      description: '',
      type:        'none',
      urgency:     'low',
      source:      'engine',
      signals,
    }
  }

  // Mapear actionType a type
  const typeMap: Record<string, EnrichedNextAction['type']> = {
    create_obv:     'obv',
    add_metrics:    'metric',
    define_channel: 'task',
  }
  const mappedType = base.actionType ? (typeMap[base.actionType] ?? 'obv') : 'obv'

  // Filtrar tipo 'meeting' para solo founders
  const finalType: EnrichedNextAction['type'] =
    mappedType === 'meeting' && context.mode === 'solo' ? 'task' : mappedType

  const phase = engineData?.phaseState?.current_phase ?? 1
  const score = engineData?.phaseState?.phase_score ?? 0
  const hardSignalMet = engineData?.phaseState?.hard_signal_met ?? false
  if (phase !== undefined && score !== undefined) {
    signals.push(`Fase ${phase} · Score ${Math.round(score)}/100`)
    // [V24.6] Señal de progresión: qué falta para avanzar
    if (score >= 75 && !hardSignalMet && phase < 4) {
      signals.push(`Score OK (${Math.round(score)}). Falta señal dura para avanzar a Fase ${phase + 1}.`)
    } else if (score < 75 && score >= 50 && phase < 4) {
      signals.push(`Score en fricción (${Math.round(score)}/75). Necesitas más evidencia para avanzar.`)
    }
    // [P4.4] Score impact estimado por acción según fase
    if (score < 75 && phase < 4) {
      const gap = 75 - Math.round(score)
      if (phase <= 1) {
        signals.push(`💡 Crear 1 OBV validada puede subir score ~${Math.min(15, gap)}%.`)
      } else if (phase === 2) {
        signals.push(`💡 Registrar 1 pago verificado puede subir score ~${Math.min(20, gap)}%.`)
      } else if (phase === 3) {
        signals.push(`💡 Completar 3 tareas esta semana puede subir score ~${Math.min(10, gap)}%.`)
      }
    }
  }

  // AUD.M.12 — ajustar urgency según operationalComplexity:
  // proyectos con alta complejidad operacional merecen más atención incluso
  // en acciones que el motor categoriza como 'low' (más contexto → más riesgo de dilación).
  const baseUrgency: EnrichedNextAction['urgency'] =
    signals.some((s) => s.includes('vencida') || s.includes('crítica'))
      ? 'medium'
      : 'low'
  const adjustedUrgency: EnrichedNextAction['urgency'] =
    context.operationalComplexity === 'high' && baseUrgency === 'low'
      ? 'medium'
      : baseUrgency

  return {
    title:       base.title,
    description: base.description,
    type:        finalType,
    urgency:     adjustedUrgency,
    source:      'engine',
    actionType:  base.actionType,
    ctaLabel:    base.ctaLabel,
    signals,
  }
}
