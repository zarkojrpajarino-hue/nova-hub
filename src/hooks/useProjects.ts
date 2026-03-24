/**
 * useProjects — V5.5.4
 * Project queries extracted from useNovaDataOptimized.ts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface Project {
  id: string;
  nombre: string;
  descripcion: string | null;
  fase: string;
  tipo: string;
  onboarding_completed: boolean;
  onboarding_data: Record<string, unknown> | null;
  icon: string;
  color: string;
  created_at: string;
  created_by?: string | null;
  paused_at?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
}

export interface ProjectStat {
  id: string;
  facturacion?: number;
  margen?: number;
  total_obvs?: number;
  leads_ganados?: number;
}

/**
 * Hook para obtener todos los proyectos con phase_state
 * Source of truth para la fase: project.phase_state.current_phase
 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.withPhaseState,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('*, phase_state:project_phase_state!project_id(current_phase, phase_score, phase_status, hard_signal_met, last_calculated_at, entry_mode, graduation_eligible_since, graduated)')
        .order('nombre');

      if (error) throw error;
      return data as (Project & {
        phase_state: {
          current_phase: number;
          phase_score: number;
          phase_status: string;
          hard_signal_met: boolean;
          last_calculated_at: string;
          entry_mode: string | null;
          graduation_eligible_since: string | null;
          graduated: boolean;
        } | null;
      })[];
    },
  });
}

/**
 * Hook para stats de un proyecto específico
 */
export function useProjectStats(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.stats(projectId!),
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('project_stats')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data as ProjectStat | null;
    },
    enabled: !!projectId,
  });
}

/**
 * Hook para un proyecto específico con sus stats
 */
export function useProjectWithStats(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.withStats(projectId!),
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*, stats:project_stats!id(*)')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

/**
 * Hook global para stats de proyectos
 * @deprecated Use useProjectStats(projectId) instead.
 */
export function useProjectStatsGlobal() {
  return useQuery({
    queryKey: queryKeys.projects.statsGlobal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_stats')
        .select('*');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
