/**
 * useProjectMembership — reads membership from the engine phase query cache.
 *
 * useProjectPhaseData already fetches the current user's role + is_lead
 * and stores it under queryKeys.engine.phase(projectId). This hook uses
 * the same queryKey with a `select` option so it piggybacks on the existing
 * cache entry — zero extra network requests.
 *
 * Returns { role, isLead } or null while loading / unavailable.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { PhaseEngineData } from '@/hooks/useNovaDataOptimized';

export interface ProjectMembership {
  role: string | null;
  isLead: boolean;
}

export function useProjectMembership(projectId: string | undefined): {
  membership: ProjectMembership | null;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery<PhaseEngineData, Error, ProjectMembership | null>({
    queryKey: queryKeys.engine.phase(projectId!),
    // No queryFn — relies on the cache populated by useProjectPhaseData.
    // If the cache is empty, React Query will use any existing queryFn
    // registered for this key (from useProjectPhaseData).
    select: (phaseData) => phaseData?.membership ?? null,
    enabled: !!projectId,
  });

  return { membership: data ?? null, isLoading };
}
