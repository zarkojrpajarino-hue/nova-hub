/**
 * usePipelineVelocity — ER29.6 (hook for PipelineVelocityCard)
 *
 * Calls compute_pipeline_velocity RPC.
 * Returns typed transition data + bottleneck.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface PipelineTransition {
  from: string
  to: string
  avg_days: number
  count: number
}

export interface PipelineBottleneck {
  from: string
  to: string
  avg_days: number
}

export interface PipelineVelocityData {
  transitions: PipelineTransition[]
  bottleneck: PipelineBottleneck | Record<string, never>
}

async function fetchPipelineVelocity(
  projectId: string,
): Promise<PipelineVelocityData> {
  const { data, error } = await supabase.rpc('compute_pipeline_velocity', {
    p_project_id: projectId,
  })
  if (error) throw error
  return data as unknown as PipelineVelocityData
}

export function usePipelineVelocity(projectId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline_velocity', projectId],
    enabled: !!projectId,
    staleTime: 10 * 60_000,
    queryFn: () => fetchPipelineVelocity(projectId!),
  })
}
