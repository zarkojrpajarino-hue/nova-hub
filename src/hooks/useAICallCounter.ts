/**
 * useAICallCounter
 *
 * Tracks AI calls per project per month against PLAN_TIERS limits.
 * Reads from ai_generations_log to count usage in current billing period.
 *
 * Export: useAICallsRemaining(projectId) -> { used, limit, remaining, limitReached }
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { useCurrentPlanTier } from '@/hooks/useSubscription';
import { isPaymentsEnabled } from '@/config/features';

/**
 * Get the start of the current billing month (UTC)
 */
function getStartOfMonth(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return start.toISOString();
}

export interface AICallsRemainingResult {
  used: number;
  limit: number;
  remaining: number;
  limitReached: boolean;
  isUnlimited: boolean;
  isLoading: boolean;
}

/**
 * Returns AI call usage vs plan limit for a project in the current month.
 *
 * When ENABLE_PAYMENTS=false, returns unlimited (no restrictions).
 */
export function useAICallsRemaining(projectId: string | undefined): AICallsRemainingResult {
  const { tier, isLoading: tierLoading } = useCurrentPlanTier(projectId);

  const { data: usedCount = 0, isLoading: countLoading } = useQuery<number>({
    queryKey: ['ai-calls-count', projectId, getStartOfMonth()],
    enabled: !!projectId && isPaymentsEnabled(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    queryFn: async () => {
      const startOfMonth = getStartOfMonth();

      const { count, error } = await supabase
        .from('ai_generations_log')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId!)
        .gte('created_at', startOfMonth);

      if (error) {
        console.error('[useAICallCounter] Error counting AI calls:', error);
        return 0;
      }

      return count ?? 0;
    },
  });

  return useMemo(() => {
    if (!isPaymentsEnabled()) {
      return {
        used: 0,
        limit: -1,
        remaining: Infinity,
        limitReached: false,
        isUnlimited: true,
        isLoading: false,
      };
    }

    const limit = tier.aiCalls;
    const isUnlimited = limit === -1;
    const remaining = isUnlimited ? Infinity : Math.max(0, limit - usedCount);
    const limitReached = !isUnlimited && usedCount >= limit;

    return {
      used: usedCount,
      limit,
      remaining,
      limitReached,
      isUnlimited,
      isLoading: tierLoading || countLoading,
    };
  }, [tier, usedCount, tierLoading, countLoading]);
}
