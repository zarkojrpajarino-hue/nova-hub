/**
 * V4.6.6 — useChurnRisk
 *
 * Fetches the inputs for computeChurnRisk from Supabase and returns the score.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeChurnRisk, type ChurnRiskResult } from '@/lib/churn-risk';
import { useAuth } from '@/hooks/useAuth';

export function useChurnRisk(projectId: string | undefined): {
  data: ChurnRiskResult | null;
  isLoading: boolean;
} {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['churn-risk', projectId, user?.id],
    queryFn: async () => {
      if (!projectId || !user?.id) return null;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString();

      const [activityResult, lastLoginResult, obvResult, tasksDoneResult, tasksAllResult] = await Promise.all([
        // Activity count in last 30 days
        supabase
          .from('activity_log')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo),
        // Last login (most recent activity)
        supabase
          .from('activity_log')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // OBV count for this project
        supabase
          .from('obvs')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId),
        // Tasks done
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('status', 'done'),
        // Tasks total
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId),
      ]);

      const lastActivity = lastLoginResult.data?.created_at;
      const daysSinceLastLogin = lastActivity
        ? Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86_400_000)
        : 30;

      const totalTasks = tasksAllResult.count ?? 0;
      const doneTasks = tasksDoneResult.count ?? 0;
      const taskCompletionRate = totalTasks > 0 ? doneTasks / totalTasks : 0;

      return computeChurnRisk({
        daysSinceLastLogin,
        activityCount30d: activityResult.count ?? 0,
        obvCount: obvResult.count ?? 0,
        taskCompletionRate,
      });
    },
    enabled: !!projectId && !!user?.id,
    staleTime: 10 * 60_000,
  });

  return { data: data ?? null, isLoading };
}
