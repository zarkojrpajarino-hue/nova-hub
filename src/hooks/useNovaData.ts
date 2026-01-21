import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types based on database schema
export interface Profile {
  id: string;
  auth_id: string;
  email: string;
  nombre: string;
  avatar: string | null;
  color: string;
  especialization: string | null;
  created_at: string;
}

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
}

export interface ProjectMember {
  id: string;
  project_id: string;
  member_id: string;
  role: string;
  is_lead: boolean;
}

export interface Lead {
  id: string;
  project_id: string;
  nombre: string;
  empresa: string | null;
  status: string;
  valor_potencial: number | null;
  responsable_id: string | null;
}

export interface MemberStats {
  id: string;
  nombre: string;
  color: string;
  avatar: string | null;
  email: string;
  obvs: number;
  lps: number;
  bps: number;
  cps: number;
  facturacion: number;
  margen: number;
}

export interface Objective {
  id: string;
  name: string;
  target_value: number;
  unit: string;
  period: string;
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProjectMembers() {
  return useQuery({
    queryKey: ['project_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('*');
      
      if (error) throw error;
      return data as ProjectMember[];
    },
  });
}

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useMemberStats() {
  return useQuery({
    queryKey: ['member_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_stats')
        .select('*');
      
      if (error) throw error;
      return data as MemberStats[];
    },
  });
}

export function useObjectives() {
  return useQuery({
    queryKey: ['objectives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objectives')
        .select('*');
      
      if (error) throw error;
      return data as Objective[];
    },
  });
}

export function useProjectStats() {
  return useQuery({
    queryKey: ['project_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_stats')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });
}

export function usePipelineGlobal() {
  return useQuery({
    queryKey: ['pipeline_global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_global')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCurrentMemberStats(email: string | undefined) {
  return useQuery({
    queryKey: ['member_stats', email],
    queryFn: async () => {
      if (!email) return null;
      const { data, error } = await supabase
        .from('member_stats')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (error) throw error;
      return data as MemberStats | null;
    },
    enabled: !!email,
  });
}
