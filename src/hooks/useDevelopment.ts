import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for development system
export interface RolePerformance {
  user_id: string;
  role_name: string;
  project_id: string;
  project_name: string;
  user_name: string;
  is_lead: boolean;
  role_accepted: boolean;
  performance_score: number;
  total_tasks: number;
  completed_tasks: number;
  task_completion_rate: number;
  total_obvs: number;
  validated_obvs: number;
  total_facturacion: number;
  total_leads: number;
  leads_ganados: number;
  lead_conversion_rate: number;
  joined_at: string;
}

export interface UserInsight {
  id: string;
  user_id: string;
  project_id: string | null;
  role_context: string | null;
  titulo: string;
  contenido: string;
  tipo: 'aprendizaje' | 'reflexion' | 'error' | 'exito' | 'idea';
  tags: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPlaybook {
  id: string;
  user_id: string;
  role_name: string;
  version: number;
  contenido: {
    sections: Array<{
      title: string;
      content: string;
      tips?: string[];
    }>;
  };
  fortalezas: string[];
  areas_mejora: string[];
  objetivos_sugeridos: Array<{
    objetivo: string;
    plazo: string;
    metricas: string[];
  }>;
  ai_model: string | null;
  generated_at: string;
  is_active: boolean;
  created_at: string;
}

export interface RoleRanking {
  id: string;
  role_name: string;
  user_id: string;
  project_id: string;
  ranking_position: number;
  score: number;
  previous_position: number | null;
  metrics: Record<string, number>;
  period_start: string;
  period_end: string;
  calculated_at: string;
}

// Hook for role performance data
export function useRolePerformance(userId?: string) {
  return useQuery({
    queryKey: ['role_performance', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_role_performance')
        .select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RolePerformance[];
    },
    enabled: true,
  });
}

// Hook for user insights
export function useInsights(userId?: string) {
  return useQuery({
    queryKey: ['user_insights', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_insights')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as UserInsight[];
    },
  });
}

// Hook to create insight
export function useCreateInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (insight: Omit<UserInsight, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('user_insights')
        .insert(insight)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_insights'] });
    },
  });
}

// Hook to update insight
export function useUpdateInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserInsight> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_insights')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_insights'] });
    },
  });
}

// Hook to delete insight
export function useDeleteInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_insights')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_insights'] });
    },
  });
}

// Hook for user playbooks
export function usePlaybooks(userId?: string) {
  return useQuery({
    queryKey: ['user_playbooks', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_playbooks')
        .select('*')
        .eq('is_active', true)
        .order('generated_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as UserPlaybook[];
    },
  });
}

// Hook to get playbook for a specific role
export function usePlaybookForRole(userId: string | undefined, roleName: string | undefined) {
  return useQuery({
    queryKey: ['user_playbook', userId, roleName],
    queryFn: async () => {
      if (!userId || !roleName) return null;
      
      const { data, error } = await supabase
        .from('user_playbooks')
        .select('*')
        .eq('user_id', userId)
        .eq('role_name', roleName)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserPlaybook | null;
    },
    enabled: !!userId && !!roleName,
  });
}

// Hook for role rankings
export function useRoleRankings(roleName?: string) {
  return useQuery({
    queryKey: ['role_rankings', roleName],
    queryFn: async () => {
      let query = supabase
        .from('role_rankings')
        .select('*')
        .order('ranking_position', { ascending: true });
      
      if (roleName) {
        query = query.eq('role_name', roleName);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RoleRanking[];
    },
  });
}

// Hook to generate playbook via edge function
export function useGeneratePlaybook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-playbook', {
        body: { userId, roleName },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_playbooks'] });
    },
  });
}
