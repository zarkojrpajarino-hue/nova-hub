// @refresh reset
/**
 * CURRENT PROJECT CONTEXT — V5.5.5 Simplified
 *
 * The context stores ONLY currentProjectId + switchProject().
 * Project data is derived from the useQuery result, not duplicated in state.
 * This prevents stale project objects when query data refreshes.
 *
 * Backward-compatible: still exposes currentProject, userProjects, etc.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// =====================================================
// TYPES
// =====================================================

export interface Project {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_by: string | null;
  // Legacy alias kept for existing code — maps to created_by in DB
  owner_id?: string;
  work_mode?: 'individual' | 'team_small' | 'team_established' | 'no_roles';
  business_idea?: string | null;
  industry?: string | null;
  logo_url?: string | null;
  facturacion?: number;
  margen?: number;
  active?: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CurrentProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  userProjects: Project[];
  isLoading: boolean;
  hasProjects: boolean;
  isOwner: boolean;
  switchProject: (projectId: string) => void;
  clearCurrentProject: () => void;
}

// =====================================================
// CONTEXT
// =====================================================

const CurrentProjectContext = createContext<CurrentProjectContextType | undefined>(undefined);

// =====================================================
// PROVIDER
// =====================================================

interface CurrentProjectProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'nova-hub:current-project-id';

export function CurrentProjectProvider({ children }: CurrentProjectProviderProps) {
  const { user, profile } = useAuth();

  // V5.5.5: Context only stores the ID, not the full project object
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  // Fetch user's projects (same query as before)
  const { data: userProjects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['user-projects', user?.id, profile?.id],
    queryFn: async () => {
      if (!user || !profile) return [];

      const memberProjectIds = await getUserProjectIds(profile.id);

      const query = supabase
        .from('projects')
        .select('*')
        .is('deleted_at', null)
        .is('archived_at', null);  // [A12.4] Ocultar archivados de la lista

      const { data, error } = await (memberProjectIds
        ? query.or(`created_by.eq.${profile.id},id.in.(${memberProjectIds})`)
        : query.eq('created_by', profile.id)
      ).order('created_at', { ascending: false });

      if (error) {
        return [];
      }

      return data;
    },
    enabled: !!user && !!profile,
    staleTime: 1000 * 60 * 5,
  });

  // Get project IDs where user is a member
  async function getUserProjectIds(memberId: string): Promise<string> {
    const { data } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('member_id', memberId);

    if (!data || data.length === 0) return '';
    return data.map(pm => pm.project_id).join(',');
  }

  // V5.5.5: Derive currentProject from query data + stored ID
  const currentProject = useMemo(() => {
    if (!currentProjectId || userProjects.length === 0) return null;
    return userProjects.find(p => p.id === currentProjectId) ?? null;
  }, [currentProjectId, userProjects]);

  // Auto-select on mount if no saved project or saved project not found
  useEffect(() => {
    if (!user || userProjects.length === 0) return;

    if (currentProjectId) {
      const found = userProjects.find(p => p.id === currentProjectId);
      if (found) return; // Already valid
    }

    // Auto-select first project if only one
    if (userProjects.length === 1) {
      setCurrentProjectId(userProjects[0].id);
      localStorage.setItem(STORAGE_KEY, userProjects[0].id);
    }
  }, [user, userProjects, currentProjectId]);

  // Switch to a different project (by ID)
  const switchProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    localStorage.setItem(STORAGE_KEY, projectId);
  };

  // Set current project (backward compat — accepts full object or null)
  const setCurrentProject = (project: Project | null) => {
    if (project) {
      switchProject(project.id);
    } else {
      clearCurrentProject();
    }
  };

  // Clear current project
  const clearCurrentProject = () => {
    setCurrentProjectId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: CurrentProjectContextType = {
    currentProject,
    setCurrentProject,
    userProjects,
    isLoading,
    hasProjects: userProjects.length > 0,
    isOwner: currentProject ? currentProject.created_by === profile?.id : false,
    switchProject,
    clearCurrentProject,
  };

  return (
    <CurrentProjectContext.Provider value={value}>
      {children}
    </CurrentProjectContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentProject() {
  const context = useContext(CurrentProjectContext);
  if (context === undefined) {
    throw new Error('useCurrentProject must be used within CurrentProjectProvider');
  }
  return context;
}
