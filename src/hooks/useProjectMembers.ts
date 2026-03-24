/**
 * useProjectMembers — V5.5.4
 * Member queries extracted from useNovaDataOptimized.ts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

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

export interface ProjectMemberWithProfile {
  id: string;
  project_id: string;
  member_id: string;
  role: string;
  is_lead: boolean;
  role_accepted: boolean;
  role_accepted_at: string | null;
  role_responsibilities: string[] | null;
  performance_score: number;
  member: Profile;
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

/**
 * Hook para obtener todos los perfiles
 */
export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.members.profiles,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [] as Profile[];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data as Profile[];
    },
  });
}

/**
 * Hook optimizado para miembros de un proyecto específico
 */
export function useProjectTeamMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members.byProject(projectId!),
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_members')
        .select('id, project_id, member_id, role, created_at, member:members!member_id(id, auth_id, email, nombre, avatar, color, especialization, created_at)')
        .eq('project_id', projectId);
      if (error) throw error;
      return (data || []).map(pm => ({
        id: pm.id,
        project_id: pm.project_id,
        member_id: pm.member_id,
        role: pm.role,
        is_lead: false,
        role_accepted: true,
        role_accepted_at: pm.created_at,
        role_responsibilities: null,
        performance_score: 0,
        member: pm.member as Profile,
      })) as ProjectMemberWithProfile[];
    },
    enabled: !!projectId,
  });
}

/**
 * Hook global para todos los project_members
 * @deprecated Use useProjectTeamMembers(projectId) instead.
 */
export function useProjectMembers() {
  return useQuery({
    queryKey: queryKeys.members.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('id, project_id, member_id, role, created_at, member:members!member_id(id, auth_id, email, nombre, avatar, color, especialization, created_at)')
        .limit(500);
      if (error) throw error;
      return (data || []).map(pm => ({
        id: pm.id,
        project_id: pm.project_id,
        member_id: pm.member_id,
        role: pm.role,
        is_lead: false,
        role_accepted: true,
        role_accepted_at: pm.created_at,
        role_responsibilities: null,
        performance_score: 0,
        member: pm.member as Profile,
      })) as ProjectMemberWithProfile[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para stats globales de miembros
 */
export function useMemberStats() {
  return useQuery({
    queryKey: queryKeys.members.stats,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_stats')
        .select('*');
      if (error) throw error;
      return data as MemberStats[];
    },
  });
}

/**
 * Hook para stats de miembro actual por email
 */
export function useCurrentMemberStats(email: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members.statsByEmail(email!),
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
