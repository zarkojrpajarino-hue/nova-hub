/**
 * useMemberStatsHook — V5.5.4
 * Stats queries extracted from useNovaDataOptimized.ts
 * (File named useMemberStatsHook to avoid conflict with MemberStats type)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface Objective {
  id: string;
  name: string;
  target_value: number;
  unit: string;
  period: string;
}

/**
 * Hook para obtener objetivos globales
 */
export function useObjectives() {
  return useQuery({
    queryKey: queryKeys.objectives,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objectives')
        .select('*');
      if (error) throw error;
      return data as Objective[];
    },
  });
}

/**
 * Hook para datos completos de un proyecto (TODO EN UNO)
 */
export function useProjectComplete(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.complete(projectId!),
    queryFn: async () => {
      if (!projectId) return null;

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*, project_members(id, project_id, member_id, role, created_at, member:members!member_id(*))')
        .eq('id', projectId)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!project) return null;

      const { data: stats, error: statsError } = await supabase
        .from('project_stats')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (statsError) throw statsError;

      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      return {
        project,
        stats,
        leads: leads || [],
        teamMembers: project.project_members || [],
      };
    },
    enabled: !!projectId,
  });
}
