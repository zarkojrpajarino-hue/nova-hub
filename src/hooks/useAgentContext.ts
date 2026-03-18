/**
 * useAgentContext — I15.89
 *
 * Lee los insights activos de todos los agentes del proyecto,
 * los prioriza y sintetiza vía agent-synthesis (I15.86–I15.88).
 *
 * No modifica getNextAction — actúa como señal complementaria.
 * Fuentes activas en v1: Finance Agent + Execution Agent.
 *
 * Devuelve los top 2 insights sintetizados para mostrar junto
 * al Next Action en ProjectEnginePanel.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  synthesizeAgentContext,
  computeAgentRiskModifier,
  type SynthesizedInsight,
  type AgentRiskModifier,
} from '@/lib/agent-synthesis'

type RawInsightRow = {
  id:           string
  agent_type:   string
  insight_type: string
  payload:      Record<string, unknown>
  confidence:   number
  generated_at: string
}

function toSynthesizedInsight(row: RawInsightRow): SynthesizedInsight | null {
  const content = (row.payload as { content?: Record<string, unknown> })?.content
  if (!content) return null

  const severity = content['severity']
  if (
    severity !== 'info' &&
    severity !== 'attention' &&
    severity !== 'warning' &&
    severity !== 'critical'
  ) return null

  const agentType = row.agent_type
  if (
    agentType !== 'finance' &&
    agentType !== 'execution' &&
    agentType !== 'sales' &&
    agentType !== 'team' &&
    agentType !== 'calendar'
  ) return null

  return {
    id:           row.id,
    agent_type:   agentType,
    insight_type: row.insight_type,
    content: {
      summary:      String(content['summary'] ?? ''),
      implication:  String(content['implication'] ?? ''),
      severity,
      ...(content['action_hint'] != null && { action_hint: String(content['action_hint']) }),
    },
    confidence:   row.confidence,
    generated_at: row.generated_at,
  }
}

export interface AgentContextData {
  insights:     SynthesizedInsight[]
  riskModifier: AgentRiskModifier | null
}

async function fetchAgentContext(projectId: string): Promise<AgentContextData> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('integration_insights')
    .select('id, agent_type, insight_type, payload, confidence, generated_at')
    .eq('project_id', projectId)
    .in('agent_type', ['finance', 'execution'])
    .eq('include_in_context', true)
    .gt('expires_at', now)

  if (error) throw new Error(`useAgentContext: ${error.message}`)

  const raw = (data ?? []) as RawInsightRow[]
  const allInsights = raw.flatMap((r) => {
    const s = toSynthesizedInsight(r)
    return s ? [s] : []
  })

  // computeAgentRiskModifier usa TODOS los insights (no solo top 2)
  // para el riesgo — no limitar a maxInsights aquí
  const riskModifier = computeAgentRiskModifier(allInsights)

  // synthesizeAgentContext limita a top 2 para la UI del Next Action
  const insights = synthesizeAgentContext(allInsights, 2)

  return { insights, riskModifier }
}

export function useAgentContext(projectId: string | undefined) {
  return useQuery({
    queryKey:  ['agent_context', projectId],
    enabled:   !!projectId,
    staleTime: 60_000,
    queryFn:   () => fetchAgentContext(projectId!),
  })
}
