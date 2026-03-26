/**
 * useNovaDataOptimized — BARREL FILE (V5.5.4)
 *
 * Re-exports from split modules for backward compatibility.
 * Engine, viability, weekly, and ritual hooks remain here.
 *
 * Split modules:
 *   - src/hooks/useProjects.ts (project queries)
 *   - src/hooks/useProjectMembers.ts (member queries)
 *   - src/hooks/useLeads.ts (lead queries)
 *   - src/hooks/useMemberStatsHook.ts (stats/objectives queries)
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { invalidateOBVData, invalidateProjectData } from '@/lib/invalidation-helpers';

// ============================================================================
// RE-EXPORTS from split modules (backward compat)
// ============================================================================

export type { Profile, ProjectMemberWithProfile, MemberStats } from './useProjectMembers';
export type { Project, ProjectStat } from './useProjects';
export type { Lead } from './useLeads';
export type { Objective } from './useMemberStatsHook';

export { useProfiles, useProjectTeamMembers, useProjectMembers, useMemberStats, useCurrentMemberStats } from './useProjectMembers';
export { useProjects, useProjectStats, useProjectWithStats, useProjectStatsGlobal } from './useProjects';
export { useProjectLeads, useLeads, usePipelineGlobal } from './useLeads';
export { useObjectives, useProjectComplete } from './useMemberStatsHook';

// ============================================================================
// ENGINE DATA HOOK
// ============================================================================

export interface ProjectEngineData {
  phaseState: {
    current_phase: number;
    phase_score: number;
    phase_status: string;
    hard_signal_met: boolean;
    last_calculated_at: string;
    primary_block: string;
    entry_mode: string | null;
    phase_entered_at: string;
    graduation_eligible_since: string | null;
    graduated: boolean;
    consecutive_low_score: number;
  } | null;
  probability: {
    probability_score: number | null;
    probability_status: string;
    data_completeness_score: number;
    phase_score_input: number | null;
    execution_rate_input: number | null;
    validation_strength_input: number | null;
    revenue_momentum_input: number | null;
    capacity_health_input: number | null;
  } | null;
  probabilityHistory: {
    probability_score: number | null;
    calculated_at: string;
  }[];
  risk: {
    risk_score: number | null;
    risk_level: string;
    risk_status: string;
    data_completeness_score: number;
    runway_factor_input: number | null;
    execution_drop_input: number | null;
    validation_weakness_input: number | null;
    revenue_concentration_input: number | null;
    bottleneck_severity_input: number | null;
    inputs_available: number;
  } | null;
  riskHistory: {
    risk_score: number | null;
    risk_level: string;
    calculated_at: string;
  }[];
  coverage: {
    function_type: string;
    coverage_score: number;
    coverage_level: string;
  }[];
  phaseHistory: {
    phase: number;
    phase_score: number;
    change_reason: string | null;
    calculated_at: string;
  }[];
}

export interface PhaseEngineData {
  phaseState: ProjectEngineData['phaseState'];
  phaseHistory: ProjectEngineData['phaseHistory'];
  counts?: { obvsCount: number; kpisCount: number; tasksDoneWeek: number };
  membership?: { role: string | null; isLead: boolean };
}

export interface ProbabilityEngineData {
  probability: ProjectEngineData['probability'];
  probabilityHistory: ProjectEngineData['probabilityHistory'];
}

export interface RiskEngineData {
  risk: ProjectEngineData['risk'];
  riskHistory: ProjectEngineData['riskHistory'];
}

// ── Hooks de dominio ──────────────────────────────────────────────────────────

export function useProjectPhaseData(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.engine.phase(projectId!),
    queryFn: async (): Promise<PhaseEngineData> => {
      const [stateResult, historyResult] = await Promise.all([
        supabase
          .from('project_phase_state')
          .select('current_phase, phase_score, phase_status, hard_signal_met, last_calculated_at, phase_entered_at, primary_block, entry_mode, graduation_eligible_since, graduated, consecutive_low_score')
          .eq('project_id', projectId!)
          .maybeSingle(),
        supabase
          .from('project_phase_history')
          .select('phase, phase_score, change_reason, calculated_at')
          .eq('project_id', projectId!)
          .order('calculated_at', { ascending: false })
          .limit(8),
      ]);
      if (stateResult.error)   throw stateResult.error;
      if (historyResult.error) throw historyResult.error;

      // Extra data fetched separately — errors don't break phase data
      let counts: PhaseEngineData['counts'];
      let membership: PhaseEngineData['membership'];
      try {
        // Get current user's auth_id → profile_id → project_members role
        const { data: { session } } = await supabase.auth.getSession();
        const authId = session?.user?.id;

        const [obvsCount, kpisCount, tasksDoneCount, profileResult] = await Promise.all([
          supabase.from('obvs').select('id', { count: 'exact', head: true }).eq('project_id', projectId!),
          supabase.rpc('count_project_kpis', { p_project_id: projectId! }),
          supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('project_id', projectId!).eq('status', 'done'),
          authId
            ? supabase.from('profiles').select('id').eq('auth_id', authId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        counts = {
          obvsCount: obvsCount.count ?? 0,
          kpisCount: (kpisCount.data as number) ?? 0,
          tasksDoneWeek: tasksDoneCount.count ?? 0,
        };

        // Get role from project_members using profile_id
        if (profileResult.data?.id) {
          const { data: pm } = await supabase
            .from('project_members')
            .select('role, is_lead')
            .eq('project_id', projectId!)
            .eq('member_id', profileResult.data.id)
            .maybeSingle();
          if (pm) {
            membership = { role: pm.role, isLead: pm.is_lead };
          }
        }
      } catch {
        counts = undefined;
      }

      return {
        phaseState:   stateResult.data,
        phaseHistory: historyResult.data ?? [],
        counts,
        membership,
      };
    },
    enabled: !!projectId,
  });
}

export function useProjectProbabilityData(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.engine.probability(projectId!),
    queryFn: async (): Promise<ProbabilityEngineData> => {
      const [probResult, historyResult] = await Promise.all([
        supabase
          .from('project_probability')
          .select('probability_score, probability_status, data_completeness_score, phase_score_input, execution_rate_input, validation_strength_input, revenue_momentum_input, capacity_health_input')
          .eq('project_id', projectId!)
          .maybeSingle(),
        supabase
          .from('project_probability_history')
          .select('probability_score, calculated_at')
          .eq('project_id', projectId!)
          .order('calculated_at', { ascending: false })
          .limit(2),
      ]);
      if (probResult.error)    throw probResult.error;
      if (historyResult.error) throw historyResult.error;
      return {
        probability:        probResult.data,
        probabilityHistory: historyResult.data ?? [],
      };
    },
    enabled: !!projectId,
  });
}

export function useProjectRiskData(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.engine.risk(projectId!),
    queryFn: async (): Promise<RiskEngineData> => {
      const [riskResult, historyResult] = await Promise.all([
        supabase
          .from('project_risk_score')
          .select('risk_score, risk_level, risk_status, data_completeness_score, runway_factor_input, execution_drop_input, validation_weakness_input, revenue_concentration_input, bottleneck_severity_input, inputs_available')
          .eq('project_id', projectId!)
          .maybeSingle(),
        supabase
          .from('project_risk_score_history')
          .select('risk_score, risk_level, calculated_at')
          .eq('project_id', projectId!)
          .order('calculated_at', { ascending: false })
          .limit(2),
      ]);
      if (riskResult.error)    throw riskResult.error;
      if (historyResult.error) throw historyResult.error;
      return {
        risk:        riskResult.data,
        riskHistory: historyResult.data ?? [],
      };
    },
    enabled: !!projectId,
  });
}

export function useProjectCoverageData(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.engine.coverage(projectId!),
    queryFn: async (): Promise<ProjectEngineData['coverage']> => {
      const { data, error } = await supabase
        .from('project_function_coverage')
        .select('function_type, coverage_score, coverage_level')
        .eq('project_id', projectId!);
      if (error) throw error;
      return data as ProjectEngineData['coverage'];
    },
    enabled: !!projectId,
    staleTime: 2 * 60_000,
    placeholderData: (prev: PhaseEngineData | undefined) => prev, // Keep previous data during refetch
  });
}

export function useProjectEngineData(projectId: string | undefined) {
  const phase    = useProjectPhaseData(projectId);
  const prob     = useProjectProbabilityData(projectId);
  const risk     = useProjectRiskData(projectId);
  const coverage = useProjectCoverageData(projectId);

  const isLoading = phase.isLoading || prob.isLoading || risk.isLoading || coverage.isLoading;

  const data = useMemo((): (ProjectEngineData & { counts?: { obvsCount: number; kpisCount: number; tasksDoneWeek: number } }) | null => {
    if (!projectId) return null;
    return {
      phaseState:         phase.data?.phaseState         ?? null,
      phaseHistory:       phase.data?.phaseHistory        ?? [],
      probability:        prob.data?.probability          ?? null,
      probabilityHistory: prob.data?.probabilityHistory   ?? [],
      risk:               risk.data?.risk                 ?? null,
      riskHistory:        risk.data?.riskHistory          ?? [],
      coverage:           coverage.data                   ?? [],
      counts:             phase.data?.counts,
      membership:         phase.data?.membership,
    };
  }, [projectId, phase.data, prob.data, risk.data, coverage.data]);

  return { data, isLoading };
}

// ============================================================================
// VIABILITY STATE — U6.7
// ============================================================================

export interface ViabilityStateData {
  viability_status: 'healthy' | 'monitoring' | 'stagnation' | 'critical';
  top_trigger_type: 'stagnation' | 'margin_risk' | 'overload' | 'weak_validation' | null;
  t2_cash_flow_active: boolean;
  active_trigger_count: number;
  last_evaluated_at: string;
}

export function useProjectViabilityState(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.viability(projectId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_viability_state')
        .select('viability_status, top_trigger_type, t2_cash_flow_active, active_trigger_count, last_evaluated_at')
        .eq('project_id', projectId!)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as ViabilityStateData;
    },
    enabled: !!projectId,
  });
}

// ============================================================================
// WEEKLY REVIEW — U6.12
// ============================================================================

export interface WeeklyReviewSummary {
  headline: string;
  highlights: string[];
  warnings: string[];
  next_step: string;
}

export interface WeeklyReview {
  id: string;
  project_id: string;
  week_start_date: string;
  week_end_date: string;
  phase: number | null;
  phase_score: number | null;
  phase_status: string | null;
  mrr: number | null;
  runway_months: number | null;
  tasks_completed: number;
  obvs_count: number;
  sales_count: number;
  summary_json: WeeklyReviewSummary;
  has_regression: boolean;
  has_transition: boolean;
  created_at: string;
  read_at: string | null;
}

export function useLatestWeeklyReview(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.weeklyReview(projectId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('project_id', projectId!)
        .order('week_end_date', { ascending: false })
        .limit(1)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as WeeklyReview;
    },
    enabled: !!projectId,
  });
}

export function useStrategicCyclesWhileAway(
  projectId: string | undefined,
  lastSeenAt: string | null,
) {
  return useQuery({
    queryKey: queryKeys.cycles.cyclesWhileAway(projectId!, lastSeenAt!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_cycles')
        .select('closed_at, ritual_responses')
        .eq('project_id', projectId!)
        .not('closed_at', 'is', null)
        .gt('closed_at', lastSeenAt!)
        .order('closed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { cycleClosedWhileAway: false, ritualMissed: false };
      return {
        cycleClosedWhileAway: true,
        ritualMissed: data.ritual_responses === null,
      };
    },
    enabled: !!projectId && !!lastSeenAt,
  });
}

export function useProjectUserState(
  projectId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.projects.userState(projectId!, userId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_user_state')
        .select('last_seen_at')
        .eq('project_id', projectId!)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.last_seen_at as string | null) ?? null;
    },
    enabled: !!projectId && !!userId,
  });
}

export function useRitualPending(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ritualPending(projectId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_cycles')
        .select('end_date, urgent_reset_requested')
        .eq('project_id', projectId!)
        .is('closed_at', null)
        .is('ritual_responses', null)
        .maybeSingle();
      if (error) throw error;
      if (!data) return false;
      const endDate = new Date(data.end_date);
      const cycleDueThreshold = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
      const cycleDue = new Date() >= cycleDueThreshold;
      return cycleDue || data.urgent_reset_requested === true;
    },
    enabled: !!projectId,
  });
}

export function useMarkWeeklyReviewRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId }: { reviewId: string; projectId: string }) => {
      const { error } = await supabase
        .from('weekly_reviews')
        .update({ read_at: new Date().toISOString() })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weeklyReview(variables.projectId) });
    },
  });
}

export function useUpdateLastSeenAt() {
  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const { error } = await supabase
        .from('project_user_state')
        .upsert(
          { project_id: projectId, user_id: userId, last_seen_at: new Date().toISOString() },
          { onConflict: 'project_id,user_id' },
        );
      if (error) throw error;
    },
  });
}

export function useSubmitRitual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      responses,
    }: {
      projectId: string;
      responses: {
        evidence_progress: string;
        broken_hypothesis: string;
        main_bottleneck: string;
        stop_doing: string;
        next_bet: string;
        success_signal: string;
        invalidation_condition: string;
      };
    }) => {
      const { data, error } = await supabase.rpc('submit_strategic_reset', {
        p_project_id: projectId,
        p_ritual_responses: responses,
      });
      if (error) throw error;
      return data as 'progress' | 'stagnation' | 'regression';
    },
    onSuccess: (_data, { projectId }) => {
      invalidateProjectData(queryClient, projectId);
      queryClient.invalidateQueries({ queryKey: queryKeys.ritualPending(projectId) });
    },
  });
}

export function useCloseCycleForPivot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await supabase.rpc('close_cycle_for_pivot', {
        p_project_id: projectId,
      });
      if (error) throw error;
      return data as string | null;
    },
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ritualPending(projectId) });
    },
  });
}

export function useProjectFunctions(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.functions(projectId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_functions')
        .select('function_type, owner_user_id')
        .eq('project_id', projectId!);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        function_type: row.function_type as string,
        hasOwner: row.owner_user_id !== null,
        owner_user_id: row.owner_user_id as string | null,
      }));
    },
    enabled: !!projectId,
  });
}

export function useClosedCyclesCount(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cycles.closedCount(projectId!),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('strategic_cycles')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId!)
        .not('closed_at', 'is', null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!projectId,
  });
}

export function useUpsertOBVParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      obvId,
      participants,
    }: {
      obvId: string;
      projectId: string;
      participants: Array<{ member_id: string; porcentaje: number }>;
    }) => {
      const { error } = await supabase.rpc('upsert_obv_participants', {
        p_obv_id: obvId,
        p_participants: participants,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { projectId }) => {
      invalidateOBVData(queryClient, projectId);
    },
  });
}
