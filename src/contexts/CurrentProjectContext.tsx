/**
 * 🎯 CURRENT PROJECT CONTEXT
 *
 * Project-scoped architecture: All data belongs to ONE project at a time
 * User selects which project they're working in
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  owner_id: string;
  work_mode: 'individual' | 'team_small' | 'team_established' | 'no_roles';
  business_idea: string | null;
  industry: string | null;
  logo_url: string | null;
  facturacion: number;
  margen: number;
  active: boolean;
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
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);

  // Fetch user's projects
  const { data: userProjects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['user-projects', user?.id, profile?.id],
    queryFn: async () => {
      if (!user || !profile) return [];

      console.log('📦 Fetching projects for:', { authId: user.id, memberId: profile.id });

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .is('deleted_at', null)
        .or(`owner_id.eq.${profile.id},id.in.(${await getUserProjectIds(profile.id)})`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching projects:', error);
        throw error;
      }

      console.log('✅ Projects loaded:', data?.length || 0, 'projects');
      return data;
    },
    enabled: !!user && !!profile,
    staleTime: 1000 * 60 * 5, // 5 minutes
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

  // Load persisted project on mount
  useEffect(() => {
    if (!user || userProjects.length === 0) return;

    const savedProjectId = localStorage.getItem(STORAGE_KEY);

    if (savedProjectId) {
      // Try to load saved project
      const savedProject = userProjects.find(p => p.id === savedProjectId);
      if (savedProject) {
        setCurrentProjectState(savedProject);
        return;
      }
    }

    // If no saved project or not found, auto-select first
    if (userProjects.length === 1) {
      setCurrentProjectState(userProjects[0]);
      localStorage.setItem(STORAGE_KEY, userProjects[0].id);
    }
  }, [user, userProjects]);

  // Set current project and persist
  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem(STORAGE_KEY, project.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Switch to a different project
  const switchProject = (projectId: string) => {
    const project = userProjects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  // Clear current project
  const clearCurrentProject = () => {
    setCurrentProject(null);
  };

  const value: CurrentProjectContextType = {
    currentProject,
    setCurrentProject,
    userProjects,
    isLoading,
    hasProjects: userProjects.length > 0,
    isOwner: currentProject ? currentProject.owner_id === profile?.id : false,
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

export function useCurrentProject() {
  const context = useContext(CurrentProjectContext);
  if (context === undefined) {
    throw new Error('useCurrentProject must be used within CurrentProjectProvider');
  }
  return context;
}

// =====================================================
// EXPORTS
// =====================================================

export { CurrentProjectContext };
