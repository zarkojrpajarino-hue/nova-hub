/**
 * useMeetingMode — M18.0.6
 *
 * Determina si el proyecto opera en modo solo o equipo.
 * Regla: 0 miembros en project_members → solo. ≥1 → team.
 *
 * Usado por MeetingIntelligencePage para adaptar la UX:
 * - solo: ocultar selector de participantes, asignar tareas al founder
 * - team: flujo completo con participantes y asignaciones
 */


import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'

export interface MeetingMode {
  mode:        'solo' | 'team'
  memberCount: number
}

export function useMeetingMode(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.meetings.mode(projectId!),
    enabled:   !!projectId,
    staleTime: 5 * 60_000,
    queryFn:   async (): Promise<MeetingMode> => {
      const { count } = await supabase
        .from('project_members')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId!)

      const memberCount = count ?? 0
      return {
        mode: memberCount >= 1 ? 'team' : 'solo',
        memberCount,
      }
    },
  })
}
