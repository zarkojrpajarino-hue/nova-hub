/**
 * teamAgentService — I15.81 (DB interface para Team Agent)
 *
 * Reads project_members + tasks to compute team activity,
 * then runs the Team Agent pure functions and writes insights
 * to integration_insights with agent_type='team'.
 */

import { supabase } from '@/integrations/supabase/client'
import { runTeamAgentLocal, type TeamMemberActivityRow, type TeamInsightData } from '@/lib/team-agent'

export interface RunTeamAgentResult {
  insights_emitted: number
  insight_types: string[]
}

/**
 * Runs the Team Agent for a project.
 * 1. Read project_members + tasks activity
 * 2. Compute insights (pure function)
 * 3. Insert new insights into integration_insights
 */
export async function runTeamAgent(projectId: string): Promise<RunTeamAgentResult> {
  // ── 1. Read project members ───────────────────────────────────────────────
  const { data: members, error: membersErr } = await supabase
    .from('project_members')
    .select('member_id, role, profiles!inner(display_name)')
    .eq('project_id', projectId)

  if (membersErr) throw new Error(`Team Agent: error reading members — ${membersErr.message}`)
  if (!members || members.length < 2) {
    return { insights_emitted: 0, insight_types: [] }
  }

  // ── 2. Read tasks per member ──────────────────────────────────────────────
  const memberIds = members.map(m => m.member_id)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('assigned_to, status, due_date')
    .eq('project_id', projectId)
    .in('assigned_to', memberIds)

  // ── 3. Read last activity per member ──────────────────────────────────────
  const { data: activities } = await supabase
    .from('activity_log')
    .select('user_id, created_at')
    .in('user_id', memberIds)
    .order('created_at', { ascending: false })

  // Build activity map: member_id -> last_activity_at
  const lastActivityMap = new Map<string, string>()
  for (const act of activities ?? []) {
    if (!lastActivityMap.has(act.user_id)) {
      lastActivityMap.set(act.user_id, act.created_at)
    }
  }

  // ── 4. Assemble member activity rows ──────────────────────────────────────
  const now = new Date()
  const memberRows: TeamMemberActivityRow[] = members.map(m => {
    const memberTasks = (tasks ?? []).filter(t => t.assigned_to === m.member_id)
    const completed = memberTasks.filter(t => t.status === 'done').length
    const overdue = memberTasks.filter(t =>
      t.status !== 'done' && t.due_date && new Date(t.due_date) < now
    ).length

    const profileData = m.profiles as unknown as { display_name: string } | null

    return {
      member_id: m.member_id,
      display_name: profileData?.display_name ?? 'Miembro',
      tasks_total: memberTasks.length,
      tasks_completed: completed,
      tasks_overdue: overdue,
      last_activity_at: lastActivityMap.get(m.member_id) ?? null,
    }
  })

  // ── 5. Run Team Agent (pure) ──────────────────────────────────────────────
  const candidates: TeamInsightData[] = runTeamAgentLocal(memberRows)
  if (candidates.length === 0) {
    return { insights_emitted: 0, insight_types: [] }
  }

  // ── 6. Anti-spam: check existing insights not expired ─────────────────────
  const candidateTypes = candidates.map(c => c.insight_type)
  const nowIso = now.toISOString()

  const { data: existing } = await supabase
    .from('integration_insights')
    .select('id, insight_type')
    .eq('project_id', projectId)
    .eq('agent_type', 'team')
    .in('insight_type', candidateTypes)
    .gt('expires_at', nowIso)

  const existingTypes = new Set((existing ?? []).map(e => e.insight_type))
  const toEmit = candidates.filter(c => !existingTypes.has(c.insight_type))

  if (toEmit.length === 0) {
    return { insights_emitted: 0, insight_types: [] }
  }

  // ── 7. Insert insights ────────────────────────────────────────────────────
  const generatedAt = now
  const rows = toEmit.map(insight => {
    const expiresAt = new Date(generatedAt.getTime() + insight.expires_hours * 3_600_000)
    return {
      project_id: projectId,
      agent_type: 'team',
      insight_type: insight.insight_type,
      entity_ids: insight.entity_ids,
      payload: {
        signal: insight.signal,
        content: insight.content,
      },
      confidence: insight.confidence,
      source_timestamp: generatedAt.toISOString(),
      generated_at: generatedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      include_in_context: insight.include_in_context,
      status: 'pending',
      evidence_type: insight.evidence_type,
      sources_used: insight.sources_used,
      sources_discarded: [],
    }
  })

  const { error: insertErr } = await supabase.from('integration_insights').insert(rows)
  if (insertErr) throw new Error(`Team Agent: error writing insights — ${insertErr.message}`)

  return {
    insights_emitted: toEmit.length,
    insight_types: toEmit.map(c => c.insight_type),
  }
}

/**
 * Read active team insights for display in TeamInsightsCard.
 */
export async function getActiveTeamInsights(projectId: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('integration_insights')
    .select('id, insight_type, payload, confidence, generated_at, expires_at, evidence_type, sources_used, sources_discarded')
    .eq('project_id', projectId)
    .eq('agent_type', 'team')
    .gt('expires_at', now)
    .order('generated_at', { ascending: false })

  if (error) throw new Error(`Team Agent: error reading insights — ${error.message}`)
  return data ?? []
}
