/**
 * PI27.2 — useMomentDetector
 *
 * Recopila datos del proyecto y llama a detectMoments().
 * Mantiene lista de momentos ya vistos en localStorage.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { detectMoments, type Moment, type MomentDetectorInput } from '@/lib/moment-detector';
import { useProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { useActiveCycle } from '@/hooks/useStrategicCycles';

const SEEN_KEY_PREFIX = 'moments_seen_';

function getSeenMoments(projectId: string): string[] {
  try {
    const raw = localStorage.getItem(`${SEEN_KEY_PREFIX}${projectId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markMomentSeen(projectId: string, momentKey: string) {
  const seen = getSeenMoments(projectId);
  if (!seen.includes(momentKey)) {
    seen.push(momentKey);
    localStorage.setItem(`${SEEN_KEY_PREFIX}${projectId}`, JSON.stringify(seen));
  }
}

// [P4.3] Persist moment to moment_history for retry + historical view
export async function persistMoment(projectId: string, moment: { type: string; severity: string; title: string; message: string; data?: Record<string, unknown> }) {
  try {
    await supabase.from('moment_history').insert({
      project_id: projectId,
      moment_type: moment.type,
      moment_severity: moment.severity,
      title: moment.title,
      message: moment.message,
      data: moment.data ?? null,
      seen_at: new Date().toISOString(),
    });
  } catch {
    // Silent — history is nice-to-have, not critical
  }
}

export function useMomentDetector(projectId: string | undefined) {
  const { data: engineData } = useProjectEngineData(projectId);
  const { data: activeCycle } = useActiveCycle(projectId);

  // Additional data: first sale, MRR, team, AI usage, project count
  const { data: extraData } = useQuery({
    queryKey: queryKeys.momentDetector(projectId!),
    queryFn: async () => {
      // Current month start for AI call counting
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

      const [saleResult, mrrResult, teamResult, scoreHistoryResult, blocksResult, runwayResult, obvCountResult, taskCountResult, aiCallsResult, projectCountResult, obvValidatedResult] = await Promise.all([
        supabase
          .from('obvs')
          .select('id')
          .eq('project_id', projectId!)
          .in('tipo', ['venta', 'revenue_validation'])
          .eq('obv_outcome', 'success')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('key_metrics')
          .select('mrr, date')
          .eq('project_id', projectId!)
          .order('date', { ascending: false })
          .limit(2),
        supabase
          .from('project_members')
          .select('id, joined_at')
          .eq('project_id', projectId!),
        supabase
          .from('project_phase_history')
          .select('phase_score, calculated_at')
          .eq('project_id', projectId!)
          .order('calculated_at', { ascending: false })
          .limit(8),
        // [D5.3] Oldest active strategic_block
        supabase
          .from('strategic_blocks')
          .select('created_at')
          .eq('project_id', projectId!)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        // [FI30.10] Latest runway_months from key_metrics
        supabase
          .from('key_metrics')
          .select('runway_months')
          .eq('project_id', projectId!)
          .not('runway_months', 'is', null)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // [V4.1.23] Total OBVs for micro-celebrations
        supabase
          .from('obvs')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!),
        // [V4.1.23] Total completed tasks for micro-celebrations
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('status', 'done'),
        // [V4.5.6] AI calls used this month (for upgrade nudge)
        supabase
          .from('ai_generations_log')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .gte('created_at', startOfMonth),
        // [V4.5.6] Total projects the user belongs to (for upgrade nudge)
        supabase
          .from('project_members')
          .select('project_id', { count: 'exact', head: true }),
        // [V4.8.4] Total validated OBVs for micro-celebrations
        supabase
          .from('obvs')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('status', 'validated'),
      ]);

      const mrrData = mrrResult.data ?? [];
      const currentMrr = Number(mrrData[0]?.mrr) || 0;
      const previousMrr = Number(mrrData[1]?.mrr) || 0;
      const members = teamResult.data ?? [];
      const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const newMembers = members.filter(m => m.joined_at && m.joined_at >= weekAgo).length;
      const oldestBlock = blocksResult.data?.created_at;
      const activeBlockDays = oldestBlock
        ? Math.floor((Date.now() - new Date(oldestBlock).getTime()) / 86_400_000)
        : 0;

      const runwayMonths = runwayResult.data?.runway_months != null
        ? Number(runwayResult.data.runway_months)
        : null;

      return {
        hasFirstSale: !!saleResult.data,
        currentMrr,
        previousMrr,
        teamSize: members.length,
        newMembersThisWeek: newMembers,
        scoreHistory: (scoreHistoryResult.data ?? []).reverse().map(h => Number(h.phase_score)),
        activeBlockDays,
        runwayMonths,
        totalOBVs: obvCountResult.count ?? 0,
        totalTasksCompleted: taskCountResult.count ?? 0,
        totalOBVsValidated: obvValidatedResult.count ?? 0,
        aiCallsUsed: aiCallsResult.count ?? 0,
        projectCount: projectCountResult.count ?? 0,
      };
    },
    enabled: !!projectId,
    staleTime: 5 * 60_000,
  });

  const moments = useMemo((): Moment[] => {
    if (!engineData?.phaseState || !extraData) return [];

    const ps = engineData.phaseState;
    const weeksInPhase = ps.phase_entered_at
      ? Math.floor((Date.now() - new Date(ps.phase_entered_at).getTime()) / (7 * 86_400_000))
      : 0;

    // Score change in last 4 weeks
    const history = extraData.scoreHistory;
    const scoreChange4w = history.length >= 5
      ? history[history.length - 1] - history[history.length - 5]
      : 0;

    // Cycle data
    const cycleDaysRemaining = activeCycle?.end_date
      ? Math.max(0, Math.ceil((new Date(activeCycle.end_date).getTime() - Date.now()) / 86_400_000))
      : null;

    const input: MomentDetectorInput = {
      hasFirstSale: extraData.hasFirstSale,
      currentMrr: extraData.currentMrr,
      previousMrr: extraData.previousMrr,
      currentPhase: ps.current_phase,
      phaseScore: ps.phase_score,
      hardSignalMet: ps.hard_signal_met,
      weeksInPhase,
      scoreChange4w,
      consecutiveLowScore: ps.consecutive_low_score ?? 0,
      activeBlockDays: extraData.activeBlockDays,
      runwayMonths: extraData.runwayMonths,
      teamSize: extraData.teamSize,
      newMembersThisWeek: extraData.newMembersThisWeek,
      activeCycleDaysRemaining: cycleDaysRemaining,
      activeCycleScore: activeCycle?.cycle_score ?? null,
      totalOBVs: extraData.totalOBVs,
      totalTasksCompleted: extraData.totalTasksCompleted,
      totalOBVsValidated: extraData.totalOBVsValidated,
      hasTeamMembers: extraData.teamSize >= 2,
      aiCallsUsed: extraData.aiCallsUsed,
      projectCount: extraData.projectCount,
      seenMoments: getSeenMoments(projectId!),
    };

    return detectMoments(input);
  }, [engineData, extraData, activeCycle, projectId]);

  return { moments, topMoment: moments[0] ?? null };
}
