/**
 * useProjectContext — F19.A.2
 *
 * Context Layer solo/equipo/complejidad.
 * Usado por: buildNextAction (F19.A.1) · NextActionFocusBlock (F19.A.3) ·
 *            usePhaseFeatures (F19.C.2) · Meeting Intelligence solo mode (M18.0.6).
 *
 * Computado client-side sin RPC nueva.
 * Lee: project_members count + current_phase (de useProjectEngineData) +
 *      integration_connections count.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useProjectEngineData } from '@/hooks/useNovaDataOptimized'
import type { ProjectContext } from '@/lib/build-next-action'

async function fetchProjectContextData(projectId: string) {
  const [membersResult, connectionsResult] = await Promise.all([
    supabase
      .from('project_members')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('role_accepted', true),
    supabase
      .from('integration_connections')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'active'),
  ])

  return {
    teamSize:           membersResult.count ?? 0,
    activeConnections:  connectionsResult.count ?? 0,
  }
}

function computeContext(
  teamSize:          number,
  activeConnections: number,
  currentPhase:      number,
): ProjectContext {
  const mode: ProjectContext['mode'] = teamSize > 0 ? 'team' : 'solo'

  let operationalComplexity: ProjectContext['operationalComplexity']
  if (currentPhase >= 3 || activeConnections >= 2) {
    operationalComplexity = 'high'
  } else if (currentPhase >= 2 || activeConnections >= 1) {
    operationalComplexity = 'medium'
  } else {
    operationalComplexity = 'low'
  }

  return { mode, teamSize, operationalComplexity }
}

export function useProjectContext(projectId: string | undefined) {
  const { data: engineData } = useProjectEngineData(projectId)
  const currentPhase = engineData?.phaseState?.current_phase ?? 1

  return useQuery<ProjectContext>({
    queryKey:  ['project_context', projectId],
    enabled:   !!projectId,
    staleTime: 5 * 60_000,
    queryFn:   async () => {
      const { teamSize, activeConnections } = await fetchProjectContextData(projectId!)
      return computeContext(teamSize, activeConnections, currentPhase)
    },
  })
}
