/**
 * QUERY KEY FACTORY
 *
 * Single source of truth for all React Query cache keys.
 * Using a factory pattern ensures consistency between queries and invalidations.
 *
 * Usage:
 *   import { queryKeys } from '@/lib/queryKeys';
 *   useQuery({ queryKey: queryKeys.projects.withPhaseState, ... })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
 *
 * Convention:
 *   - Top-level keys group by domain (projects, tasks, engine, etc.)
 *   - `.all` is the broadest key for that domain (used for prefix invalidation)
 *   - Functions return tuple keys for parameterized queries
 */

export const queryKeys = {
  // ── Projects ───────────────────────────────────────────────────────────────
  projects: {
    all: ['projects'] as const,
    withPhaseState: ['projects', 'with-phase-state'] as const,
    detail: (id: string) => ['project', id] as const,
    complete: (id: string) => ['project-complete', id] as const,
    withStats: (id: string) => ['project-with-stats', id] as const,
    stats: (id: string) => ['project-stats', id] as const,
    statsGlobal: ['project_stats'] as const,
    functions: (id: string) => ['project-functions', id] as const,
    context: (id: string) => ['project_context', id] as const,
    viability: (id: string) => ['project-viability', id] as const,
    userState: (projectId: string, userId: string) => ['project-user-state', projectId, userId] as const,
  },

  // ── Engine ─────────────────────────────────────────────────────────────────
  engine: {
    all: (id: string) => ['project-engine', id] as const,
    phase: (id: string) => ['project-engine', id, 'phase'] as const,
    probability: (id: string) => ['project-engine', id, 'probability'] as const,
    risk: (id: string) => ['project-engine', id, 'risk'] as const,
    coverage: (id: string) => ['project-engine', id, 'coverage'] as const,
  },

  // ── Team Members ───────────────────────────────────────────────────────────
  members: {
    all: ['project_members'] as const,
    byProject: (id: string) => ['project-team-members', id] as const,
    stats: ['member_stats'] as const,
    statsByEmail: (email: string) => ['member_stats', email] as const,
    profiles: ['profiles'] as const,
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  tasks: {
    all: ['tasks'] as const,
    byProject: (id: string) => ['project-tasks', id] as const,
  },

  // ── Leads / CRM ────────────────────────────────────────────────────────────
  leads: {
    all: ['leads'] as const,
    byProject: (id: string) => ['project-leads', id] as const,
    pipeline: ['pipeline_global'] as const,
  },

  // ── OBVs ───────────────────────────────────────────────────────────────────
  obvs: {
    all: ['obvs'] as const,
    byProject: (id: string) => ['project_obvs', id] as const,
    myObvs: (userId: string) => ['my_obvs', userId] as const,
  },

  // ── KPIs ───────────────────────────────────────────────────────────────────
  kpis: {
    all: ['kpis'] as const,
    pending: ['pending_kpis'] as const,
  },

  // ── Validations ────────────────────────────────────────────────────────────
  validations: {
    pending: (profileId: string, limit?: number) => ['pending_validations', profileId, limit] as const,
    dashboard: ['pending_validations_dashboard'] as const,
    forValidation: ['pending_obvs_for_validation'] as const,
    order: ['validation_order'] as const,
    myValidators: (userId: string) => ['my_validators', userId] as const,
    stats: (userId: string) => ['validator_stats', userId] as const,
    allStats: ['all_validator_stats'] as const,
    blocked: (userId: string) => ['is_blocked', userId] as const,
    myPending: (userId: string) => ['my_pending_validations', userId] as const,
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    all: ['notifications'] as const,
    byUser: (profileId: string, filters?: unknown, limit?: number) => ['notifications', profileId, filters, limit] as const,
    unreadCount: (profileId: string) => ['notifications_unread_count', profileId] as const,
    unreadCountV2: (profileId: string) => ['notifications-unread-count', profileId] as const,
  },

  // ── Meetings ───────────────────────────────────────────────────────────────
  meetings: {
    all: ['meetings'] as const,
    byProject: (id: string) => ['meetings', id] as const,
    detail: (meetingId: string) => ['meeting', meetingId] as const,
    participants: (meetingId: string) => ['meeting-participants', meetingId] as const,
    insights: (meetingId: string) => ['meeting-insights', meetingId] as const,
    aiQuestions: (meetingId: string) => ['meeting-ai-questions', meetingId] as const,
    aiRecommendations: (meetingId: string) => ['meeting-ai-recommendations', meetingId] as const,
    decisions: (meetingId: string) => ['meeting-decisions', meetingId] as const,
    mode: (projectId: string) => ['meeting-mode', projectId] as const,
    triggers: (projectId: string) => ['meeting_triggers', projectId] as const,
  },

  // ── Strategic Cycles ───────────────────────────────────────────────────────
  cycles: {
    all: (id: string) => ['strategic-cycles', id] as const,
    active: (id: string) => ['strategic-cycles', id, 'active'] as const,
    history: (id: string) => ['strategic-cycles', id, 'history'] as const,
    closedCount: (id: string) => ['closed-cycles-count', id] as const,
    cyclesWhileAway: (id: string, lastSeenAt: string) => ['cycles-while-away', id, lastSeenAt] as const,
  },

  // ── Development ────────────────────────────────────────────────────────────
  development: {
    rolePerformance: (userId: string) => ['role_performance', userId] as const,
    userInsights: (userId: string) => ['user_insights', userId] as const,
    userPlaybooks: (userId: string) => ['user_playbooks', userId] as const,
    userPlaybook: (userId: string, roleName: string) => ['user_playbook', userId, roleName] as const,
    roleRankings: (roleName: string) => ['role_rankings', roleName] as const,
  },

  // ── Masters ────────────────────────────────────────────────────────────────
  masters: {
    applications: (status?: string) => ['master_applications', status] as const,
    myApplications: (userId: string) => ['master_applications', 'my', userId] as const,
    teamMasters: (roleName: string) => ['team_masters', roleName] as const,
    votes: (applicationId: string) => ['master_votes', applicationId] as const,
    challenges: (masterId: string) => ['master_challenges', masterId] as const,
    eligibility: (userId: string, roleName: string) => ['master_eligibility', userId, roleName] as const,
  },

  // ── Financial ──────────────────────────────────────────────────────────────
  financial: {
    metricsSecure: ['financial_metrics_secure'] as const,
    pendingPayments: ['pending_payments'] as const,
    mrrForecast: (projectId: string, monthsAhead?: number) => ['mrr_forecast', projectId, monthsAhead] as const,
    stressTest: (projectId: string) => ['stress_test', projectId] as const,
    risks: (projectId: string) => ['financial_risks', projectId] as const,
  },

  // ── Integrations ───────────────────────────────────────────────────────────
  integrations: {
    connections: (projectId: string) => ['integration_connections', projectId] as const,
    syncQuality: (projectId: string) => ['sync_quality', projectId] as const,
  },

  // ── Generative Business ────────────────────────────────────────────────────
  generative: {
    previews: (projectId: string) => ['generation-previews', projectId] as const,
    ideas: (projectId: string) => ['business-ideas', projectId] as const,
  },

  // ── Founder Tools ──────────────────────────────────────────────────────────
  founderTool: {
    byType: (projectId: string, toolType: string) => ['founder-tool', projectId, toolType] as const,
    unlocks: (projectId: string) => ['toolkit-unlocks', projectId] as const,
  },

  // ── Role Rotation ──────────────────────────────────────────────────────────
  roleRotation: {
    requests: (status?: string) => ['rotation_requests', status] as const,
    myRequests: (userId: string) => ['my_rotation_requests', userId] as const,
    history: (userId: string) => ['role_history', userId] as const,
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: {
    user: (userId: string) => ['user_settings', userId] as const,
    profile: ['profile'] as const,
  },

  // ── Subscription ───────────────────────────────────────────────────────────
  subscription: {
    project: (projectId: string) => ['project-subscription', projectId] as const,
    userLimits: (userId: string) => ['user-limits', userId] as const,
  },

  // ── Agent Context ──────────────────────────────────────────────────────────
  agent: {
    context: (projectId: string) => ['agent_context', projectId] as const,
  },

  // ── Miscellaneous ──────────────────────────────────────────────────────────
  objectives: ['objectives'] as const,
  weeklyReview: (projectId: string) => ['weekly-review', projectId] as const,
  ritualPending: (projectId: string) => ['ritual-pending', projectId] as const,
  executionTrends: (projectId: string, weeks?: number) => ['execution_trends', projectId, weeks] as const,
  expansionReadiness: (projectId: string) => ['expansion-readiness', projectId] as const,
  momentDetector: (projectId: string) => ['moment-detector-data', projectId] as const,
  rolePermissions: (projectId: string) => ['role-permissions', projectId] as const,
  sourcePreferences: (projectId: string) => ['source_preferences', projectId] as const,
} as const;
