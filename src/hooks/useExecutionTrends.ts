/**
 * useExecutionTrends — ER29.4
 *
 * Hook that calls compute_execution_trends RPC.
 * Returns typed weekly data + trend directions.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface WeeklyTasks {
  demand: number
  delivery: number
  cash: number
  total: number
}

export interface WeeklyOBVs {
  exploracion: number
  validacion: number
  venta: number
  total: number
}

export interface WeeklyTrend {
  week_start: string
  tasks: WeeklyTasks
  obvs: WeeklyOBVs
  revenue: number
  enriched_by: string[]
}

export type TrendDirection = 'up' | 'stable' | 'down' | 'insufficient_data'

export interface TrendDirections {
  tasks: TrendDirection
  obvs: TrendDirection
  revenue: TrendDirection
}

export interface SeasonalityData {
  day_pattern?: string // e.g. 'friday'
  weekly_pattern?: string // 'week1_higher' | 'week4_higher'
}

export interface ExecutionTrendsData {
  weekly: WeeklyTrend[]
  trends: TrendDirections
  seasonality?: SeasonalityData
}

async function fetchExecutionTrends(
  projectId: string,
  weeks: number,
): Promise<ExecutionTrendsData> {
  const { data, error } = await supabase.rpc('compute_execution_trends', {
    p_project_id: projectId,
    p_weeks: weeks,
  })
  if (error) throw error
  return data as unknown as ExecutionTrendsData
}

export function useExecutionTrends(
  projectId: string | undefined,
  weeks: number = 12,
) {
  return useQuery({
    queryKey: ['execution_trends', projectId, weeks],
    enabled: !!projectId,
    staleTime: 10 * 60_000, // 10 min — trends don't change fast
    queryFn: () => fetchExecutionTrends(projectId!, weeks),
  })
}
