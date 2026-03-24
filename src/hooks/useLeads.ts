/**
 * useLeads — V5.5.4
 * Lead queries extracted from useNovaDataOptimized.ts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface Lead {
  id: string;
  project_id: string;
  nombre: string;
  empresa: string | null;
  status: string;
  valor_potencial: number | null;
  responsable_id: string | null;
}

/**
 * Hook optimizado para leads de un proyecto específico
 */
export function useProjectLeads(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leads.byProject(projectId!),
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!projectId,
  });
}

/**
 * Hook global para todos los leads
 * @deprecated Use useProjectLeads(projectId) instead.
 */
export function useLeads() {
  return useQuery({
    queryKey: queryKeys.leads.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Lead[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para pipeline global
 * @deprecated Use useProjectLeads(projectId) instead.
 */
export function usePipelineGlobal() {
  return useQuery({
    queryKey: queryKeys.leads.pipeline,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_global')
        .select('*')
        .limit(500);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
