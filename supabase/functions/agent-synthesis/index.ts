/**
 * agent-synthesis — Edge Function
 *
 * Consolidates active insights from all agents into a prioritized summary
 * for Optimus context. Called by get_optimus_context() or on-demand.
 *
 * Input:  { project_id: string }
 * Output: { insights: SynthesizedInsight[], conflicts: InsightConflict[] }
 *
 * Priority (AGENTS_CONTRACT.md §7.3):
 *   severity: critical(4) > warning(3) > attention(2) > info(1)
 *   agent:    finance(5) > sales(4) > execution(3) > meeting(2) > calendar(1)
 *   tiebreak: confidence descending
 *
 * Max insights returned: 10 (top priority)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts'
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts'

const MAX_INSIGHTS = 10

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  warning:  3,
  attention: 2,
  info:     1,
}

const AGENT_WEIGHT: Record<string, number> = {
  finance:              5,
  sales:                4,
  execution:            3,
  slack_communication:  2,
  notion_knowledge:     2,
  meeting:              2,
  calendar:             1,
}

interface RawInsight {
  id: string
  agent_type: string
  insight_type: string
  payload: Record<string, unknown>
  confidence: number
  generated_at: string
  evidence_type: string | null
  sources_used: unknown[] | null
  include_in_context: boolean
}

interface SynthesizedInsight {
  id: string
  agent_type: string
  insight_type: string
  content: {
    summary: string
    implication: string
    severity: string
    action_hint?: string
  }
  confidence: number
  generated_at: string
  priority_score: number
  evidence_type: string | null
  sources: unknown[] | null
}

function prioritize(insight: RawInsight): number {
  const payload = insight.payload as { content?: { severity?: string } }
  const severity = payload?.content?.severity ?? 'info'
  const sevWeight = SEVERITY_WEIGHT[severity] ?? 1
  const agentWeight = AGENT_WEIGHT[insight.agent_type] ?? 1
  return (sevWeight * 10) + agentWeight + (insight.confidence * 0.5)
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin)

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const serviceClient  = createClient(supabaseUrl, serviceRoleKey)

  try {
    const { user } = await validateAuth(req)
    const { project_id } = await req.json()

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'missing_project_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      )
    }

    // B2.B — Verify project membership
    await verifyProjectMembership(serviceClient, user.id, project_id, origin)

    // Read all active (non-expired) insights for this project
    const now = new Date().toISOString()
    const { data: rawInsights, error } = await serviceClient
      .from('integration_insights')
      .select('id, agent_type, insight_type, payload, confidence, generated_at, evidence_type, sources_used, include_in_context')
      .eq('project_id', project_id)
      .gt('expires_at', now)
      .order('generated_at', { ascending: false })

    if (error) throw error

    const insights = (rawInsights ?? []) as RawInsight[]

    // Filter to only context-worthy insights and prioritize
    const contextInsights = insights
      .filter(i => i.include_in_context !== false)
      .map(i => {
        const payload = i.payload as { content?: { summary?: string; implication?: string; severity?: string; action_hint?: string } }
        return {
          id: i.id,
          agent_type: i.agent_type,
          insight_type: i.insight_type,
          content: payload?.content ?? { summary: '', implication: '', severity: 'info' },
          confidence: i.confidence,
          generated_at: i.generated_at,
          priority_score: prioritize(i),
          evidence_type: i.evidence_type,
          sources: i.sources_used,
        } as SynthesizedInsight
      })
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, MAX_INSIGHTS)

    // Conflict detection (v1: simple — same metric from different agents)
    const conflicts: Array<{ insight_a: string; insight_b: string; reason: string }> = []
    // In v1, finance and execution are orthogonal domains → no conflicts expected.
    // Structure ready for v2 when sales pipeline vs finance cashflow can conflict.

    return new Response(
      JSON.stringify({
        ok: true,
        insights: contextInsights,
        conflicts,
        total_active: insights.length,
        context_worthy: contextInsights.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )

  } catch (err) {
    if (err instanceof Response) return err
    console.error('agent-synthesis error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    )
  }
})
