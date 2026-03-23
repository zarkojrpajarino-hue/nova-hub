/**
 * team-agent — I15.81
 *
 * Pure computation layer for Team Agent.
 * Reads project_members activity (tasks, activity_log) to detect:
 * - Blocked members (no activity in 7+ days)
 * - Overdue tasks per member
 * - Activity imbalance (one member doing 80%+ of work)
 *
 * Signal source: project_members + tasks + activity_log (internal data, no external provider).
 */

export interface TeamMemberActivityRow {
  member_id: string
  display_name: string
  tasks_total: number
  tasks_completed: number
  tasks_overdue: number
  last_activity_at: string | null
}

export interface TeamInsightData {
  insight_type: string
  signal: { metric_name: string; current_value: number; data_points: number }
  content: {
    summary: string
    implication: string
    severity: 'info' | 'attention' | 'warning' | 'critical'
    action_hint?: string
  }
  confidence: number
  expires_hours: number
  include_in_context: boolean
  entity_ids: string[]
  evidence_type: 'measured'
  sources_used: Array<{ source: string; confidence: number; timestamp: string }>
  sources_discarded: never[]
}

/**
 * Computes team-level insights from member activity data.
 * Pure function — no DB calls.
 */
export function runTeamAgentLocal(members: TeamMemberActivityRow[]): TeamInsightData[] {
  if (members.length < 2) return [] // Need at least 2 members for team dynamics

  const insights: TeamInsightData[] = []
  const now = new Date()

  // ── 1. Blocked members (no activity in 7+ days) ──────────────────────────
  const blockedMembers = members.filter(m => {
    if (!m.last_activity_at) return true
    const daysSince = (now.getTime() - new Date(m.last_activity_at).getTime()) / 86_400_000
    return daysSince >= 7
  })

  if (blockedMembers.length > 0) {
    const severity = blockedMembers.length >= members.length * 0.5 ? 'warning' : 'attention'
    insights.push({
      insight_type: 'blocked_members',
      signal: { metric_name: 'blocked_member_count', current_value: blockedMembers.length, data_points: members.length },
      content: {
        summary: `${blockedMembers.length} de ${members.length} miembros sin actividad en 7+ dias`,
        implication: `Ejecucion del equipo comprometida: ${blockedMembers.map(m => m.display_name).join(', ')} inactivos`,
        severity,
        action_hint: 'Contacta a los miembros inactivos para desbloquear posibles impedimentos',
      },
      confidence: 0.85,
      expires_hours: 48,
      include_in_context: true,
      entity_ids: blockedMembers.map(m => m.member_id),
      evidence_type: 'measured',
      sources_used: [{ source: 'internal', confidence: 0.9, timestamp: now.toISOString() }],
      sources_discarded: [],
    })
  }

  // ── 2. Overdue tasks concentration ────────────────────────────────────────
  const totalOverdue = members.reduce((sum, m) => sum + m.tasks_overdue, 0)
  if (totalOverdue > 0) {
    const severity = totalOverdue >= 5 ? 'warning' : totalOverdue >= 2 ? 'attention' : 'info'
    insights.push({
      insight_type: 'team_overdue_concentration',
      signal: { metric_name: 'team_overdue_tasks', current_value: totalOverdue, data_points: members.length },
      content: {
        summary: `${totalOverdue} tareas vencidas en el equipo`,
        implication: 'Las tareas vencidas acumuladas reducen la velocidad de ejecucion del proyecto',
        severity,
        action_hint: totalOverdue >= 5 ? 'Prioriza las tareas vencidas antes de crear nuevas' : undefined,
      },
      confidence: 0.9,
      expires_hours: 24,
      include_in_context: totalOverdue >= 3,
      entity_ids: members.filter(m => m.tasks_overdue > 0).map(m => m.member_id),
      evidence_type: 'measured',
      sources_used: [{ source: 'internal', confidence: 0.95, timestamp: now.toISOString() }],
      sources_discarded: [],
    })
  }

  // ── 3. Activity imbalance ────────────────────────────────────────────────
  const totalCompleted = members.reduce((sum, m) => sum + m.tasks_completed, 0)
  if (totalCompleted >= 5) {
    const topMember = members.reduce((top, m) => m.tasks_completed > top.tasks_completed ? m : top, members[0])
    const topPct = topMember.tasks_completed / totalCompleted

    if (topPct >= 0.8) {
      insights.push({
        insight_type: 'activity_imbalance',
        signal: { metric_name: 'top_member_pct', current_value: Math.round(topPct * 100), data_points: members.length },
        content: {
          summary: `${topMember.display_name} concentra el ${Math.round(topPct * 100)}% de las tareas completadas`,
          implication: 'Riesgo de bus factor: si esta persona se ausenta, la ejecucion se detiene',
          severity: 'attention',
          action_hint: 'Redistribuye tareas para reducir la dependencia de un solo miembro',
        },
        confidence: 0.8,
        expires_hours: 72,
        include_in_context: true,
        entity_ids: [topMember.member_id],
        evidence_type: 'measured',
        sources_used: [{ source: 'internal', confidence: 0.9, timestamp: now.toISOString() }],
        sources_discarded: [],
      })
    }
  }

  return insights
}
