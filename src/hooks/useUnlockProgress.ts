/**
 * useUnlockProgress — GUARD.3
 *
 * Hook that queries compute_unlock_progress RPC.
 * Returns unlock status for F29/F30/F31 features.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface UnlockStep {
  done: boolean
  label: string
  cta_action: string
}

export interface FeatureUnlock {
  feature: string
  phase: number
  unlocked: boolean
  progress_percent: number
  steps: UnlockStep[]
}

async function fetchUnlockProgress(projectId: string): Promise<FeatureUnlock[]> {
  const { data, error } = await supabase.rpc('compute_unlock_progress', {
    p_project_id: projectId,
  })
  if (error) throw error
  return (data as FeatureUnlock[]) ?? []
}

export function useUnlockProgress(projectId: string | undefined) {
  return useQuery({
    queryKey: ['unlock_progress', projectId],
    enabled: !!projectId,
    staleTime: 5 * 60_000,
    queryFn: () => fetchUnlockProgress(projectId!),
  })
}

export function useFeatureUnlock(projectId: string | undefined, feature: string) {
  const { data: all, ...rest } = useUnlockProgress(projectId)
  const featureData = all?.find(f => f.feature === feature) ?? null
  return { data: featureData, ...rest }
}
