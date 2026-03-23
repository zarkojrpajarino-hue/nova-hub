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
import { queryKeys } from '@/lib/queryKeys'
import {
  synthesizeAgentContext,
  computeAgentRiskModifier,
  type SynthesizedInsight,
  type AgentRiskModifier,
} from '@/lib/agent-synthesis'
import {
  computeReliabilityScore,
  SOURCE_WEIGHTS,
  type SourceUsed,
  type ProviderSlug,
  type ProjectSourcePreferences,
} from '@/lib/evidence'

type RawInsightRow = {
  id:                string
  agent_type:        string
  insight_type:      string
  payload:           Record<string, unknown>
  confidence:        number
  generated_at:      string
  evidence_type?:    string
  sources_used?:     unknown
}

function toSynthesizedInsight(
  row: RawInsightRow,
  preferences?: ProjectSourcePreferences,
): SynthesizedInsight | null {
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

  // T17.17 — parsear sources_used para computar reliability_score
  const sourcesUsed: SourceUsed[] = Array.isArray(row.sources_used)
    ? (row.sources_used as SourceUsed[])
    : []
  // T17.26 — pasar preferencias para respetar fuentes desactivadas/con peso override
  const reliabilityScore = computeReliabilityScore(sourcesUsed, row.confidence, preferences)

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
    confidence:        row.confidence,
    generated_at:      row.generated_at,
    reliability_score: reliabilityScore,
    evidence_type:     (row.evidence_type as SynthesizedInsight['evidence_type']) ?? 'inferred',
    sources:           sourcesUsed.map(s => ({
      source:     s.source as ProviderSlug,
      confidence: s.confidence,
      synced_at:  s.timestamp,
    })),
  }
}

export interface AgentContextData {
  insights:     SynthesizedInsight[]
  riskModifier: AgentRiskModifier | null
}

async function fetchAgentContext(projectId: string): Promise<AgentContextData> {
  const now = new Date().toISOString()

  // T17.26 — cargar preferencias de fuente en paralelo con los insights
  const [insightsResult, prefsResult] = await Promise.all([
    supabase
      .from('integration_insights')
      .select('id, agent_type, insight_type, payload, confidence, generated_at, evidence_type, sources_used')
      .eq('project_id', projectId)
      .in('agent_type', ['finance', 'execution', 'sales', 'calendar'])
      .eq('include_in_context', true)
      .gt('expires_at', now),
    supabase
      .from('project_source_preferences')
      .select('source, enabled, weight_override')
      .eq('project_id', projectId),
  ])

  if (insightsResult.error) throw new Error(`useAgentContext: ${insightsResult.error.message}`)

  // Construir ProjectSourcePreferences desde filas de DB (filas ausentes = default enabled)
  const preferences: ProjectSourcePreferences = Object.fromEntries(
    (Object.keys(SOURCE_WEIGHTS) as ProviderSlug[]).map(s => [s, { enabled: true }])
  ) as ProjectSourcePreferences
  for (const row of (prefsResult.data ?? [])) {
    const source = row.source as ProviderSlug
    if (source in preferences) {
      preferences[source] = {
        enabled:         row.enabled,
        weight_override: (row.weight_override as number | null) ?? undefined,
      }
    }
  }

  const raw = (insightsResult.data ?? []) as RawInsightRow[]
  const allInsights = raw.flatMap((r) => {
    const s = toSynthesizedInsight(r, preferences)
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
    queryKey: queryKeys.agent.context(projectId!),
    enabled:   !!projectId,
    staleTime: 60_000,
    queryFn:   () => fetchAgentContext(projectId!),
  })
}
