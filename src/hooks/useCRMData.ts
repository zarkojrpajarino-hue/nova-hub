import { useMemo } from 'react';
import { usePipelineGlobal, useProjects, useProfiles } from '@/hooks/useNovaData';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { DEMO_LEADS, DEMO_PROJECTS, DEMO_MEMBERS } from '@/data/demoData';

export interface CRMFilters {
  project: string;
  responsable: string;
  status: string;
  minValue: string;
  maxValue: string;
}

export function useCRMData(filters: CRMFilters) {
  const { isDemoMode } = useDemoMode();
  const { data: realLeads = [], isLoading: loadingLeads } = usePipelineGlobal();
  const { data: realProjects = [], isLoading: loadingProjects } = useProjects();
  const { data: realProfiles = [], isLoading: loadingProfiles } = useProfiles();

  // Use demo data when in demo mode
  const leads = useMemo(() =>
    isDemoMode ? DEMO_LEADS.map(l => ({
      id: l.id,
      nombre: l.nombre,
      empresa: l.empresa,
      status: l.status,
      valor_potencial: l.valor,
      project_id: DEMO_PROJECTS.find(p => p.nombre === l.proyecto)?.id || 'p1',
      responsable_id: DEMO_MEMBERS.find(m => m.nombre === l.responsable)?.id || '1',
      proxima_accion: l.proxima_accion,
    })) : realLeads,
    [isDemoMode, realLeads]
  );

  const projects = isDemoMode ? DEMO_PROJECTS : realProjects;
  const profiles = isDemoMode ? DEMO_MEMBERS : realProfiles;

  const isLoading = (loadingLeads || loadingProjects || loadingProfiles) && !isDemoMode;

  // Apply filters
  const filteredLeads = useMemo(() =>
    leads.filter(lead => {
      if (filters.project !== 'all' && lead.project_id !== filters.project) return false;
      if (filters.responsable !== 'all' && lead.responsable_id !== filters.responsable) return false;
      if (filters.status !== 'all' && lead.status !== filters.status) return false;
      if (filters.minValue && (lead.valor_potencial || 0) < parseFloat(filters.minValue)) return false;
      if (filters.maxValue && (lead.valor_potencial || 0) > parseFloat(filters.maxValue)) return false;
      return true;
    }),
    [leads, filters]
  );

  // Transform data for components
  const projectsData = useMemo(() =>
    projects.map(p => ({
      id: p.id,
      nombre: p.nombre,
      icon: p.icon,
      color: p.color,
    })),
    [projects]
  );

  const membersData = useMemo(() =>
    profiles.map(p => ({
      id: p.id,
      nombre: p.nombre,
      color: p.color,
    })),
    [profiles]
  );

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const totalValue = filteredLeads.reduce((sum, l) => sum + (l.valor_potencial || 0), 0);
    const ganados = filteredLeads.filter(l => l.status === 'cerrado_ganado').length;
    const enNegociacion = filteredLeads.filter(l => l.status === 'negociacion').length;
    const calientes = filteredLeads.filter(l => l.status === 'hot').length;

    const byStatus: Record<string, number> = {};
    filteredLeads.forEach(l => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    });

    return { totalLeads, totalValue, ganados, enNegociacion, calientes, byStatus };
  }, [filteredLeads]);

  return {
    isLoading,
    leads: filteredLeads,
    allLeads: leads,
    projects: projectsData,
    members: membersData,
    metrics,
  };
}
