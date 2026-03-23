/**
 * EQ26.8 — useRolePermissions
 *
 * Retorna permisos del usuario actual en el proyecto.
 * Fundador/strategy ve TODO. Otros roles ven solo su área.
 *
 * Usa: project_members.role + is_lead para determinar permisos.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface RolePermissions {
  role: string | null;
  isLead: boolean;
  isFounder: boolean;
  canViewFullDashboard: boolean;
  canViewFinancial: boolean;
  canViewCRM: boolean;
  canChangeStrategy: boolean;
  canInviteMembers: boolean;
  canConfigureIntegrations: boolean;
  canCreateOBVs: boolean;
  canViewTeam: boolean;
  visibleTabs: string[];
}

const FULL_TABS = ['dashboard', 'equipo', 'crm', 'tareas', 'obvs', 'financiero', 'negocio-ia', 'expansion'];

function computePermissions(role: string | null, isLead: boolean): RolePermissions {
  const isFounder = isLead || role === 'strategy';

  if (isFounder) {
    return {
      role,
      isLead,
      isFounder: true,
      canViewFullDashboard: true,
      canViewFinancial: true,
      canViewCRM: true,
      canChangeStrategy: true,
      canInviteMembers: true,
      canConfigureIntegrations: true,
      canCreateOBVs: true,
      canViewTeam: true,
      visibleTabs: FULL_TABS,
    };
  }

  // Non-founder members
  const base: RolePermissions = {
    role,
    isLead: false,
    isFounder: false,
    canViewFullDashboard: false,
    canViewFinancial: false,
    canViewCRM: false,
    canChangeStrategy: false,
    canInviteMembers: false,
    canConfigureIntegrations: false,
    canCreateOBVs: true,
    canViewTeam: true,
    visibleTabs: ['dashboard', 'tareas', 'equipo'],
  };

  switch (role) {
    case 'sales':
    case 'customer':
      return {
        ...base,
        canViewCRM: true,
        canCreateOBVs: true,
        visibleTabs: ['dashboard', 'tareas', 'crm', 'obvs', 'equipo'],
      };
    case 'marketing':
      return {
        ...base,
        canViewCRM: true,
        canCreateOBVs: true,
        visibleTabs: ['dashboard', 'tareas', 'crm', 'obvs', 'equipo'],
      };
    case 'finance':
      return {
        ...base,
        canViewFinancial: true,
        visibleTabs: ['dashboard', 'tareas', 'financiero', 'equipo'],
      };
    case 'operations':
      return {
        ...base,
        canCreateOBVs: true,
        visibleTabs: ['dashboard', 'tareas', 'obvs', 'equipo'],
      };
    case 'ai_tech':
      return {
        ...base,
        canConfigureIntegrations: true,
        visibleTabs: ['dashboard', 'tareas', 'equipo'],
      };
    default:
      return base;
  }
}

export function useRolePermissions(projectId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.rolePermissions(projectId!),
    staleTime: 30 * 60_000,  // Permisos rara vez cambian
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return computePermissions(null, false);

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (!profile) return computePermissions(null, false);

      const { data: membership } = await supabase
        .from('project_members')
        .select('role, is_lead')
        .eq('project_id', projectId!)
        .eq('member_id', profile.id)
        .single();

      if (!membership) return computePermissions(null, false);

      return computePermissions(membership.role, membership.is_lead);
    },
    enabled: !!projectId,
  });

  return {
    permissions: data ?? computePermissions(null, true), // Default to founder if loading
    isLoading,
  };
}
