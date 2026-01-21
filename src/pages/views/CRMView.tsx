import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { usePipelineGlobal, useProjects, useProfiles } from '@/hooks/useNovaData';
import { CRMPipeline } from '@/components/crm/CRMPipeline';
import { CRMFilters } from '@/components/crm/CRMFilters';

interface CRMViewProps {
  onNewOBV?: () => void;
}

export function CRMView({ onNewOBV }: CRMViewProps) {
  const { data: leads = [], isLoading: loadingLeads } = usePipelineGlobal();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles();

  const [filters, setFilters] = useState({
    project: 'all',
    responsable: 'all',
    status: 'all',
    minValue: '',
    maxValue: '',
  });

  const isLoading = loadingLeads || loadingProjects || loadingProfiles;

  // Apply filters
  const filteredLeads = leads.filter(lead => {
    if (filters.project !== 'all' && lead.project_id !== filters.project) return false;
    if (filters.responsable !== 'all' && lead.responsable_id !== filters.responsable) return false;
    if (filters.status !== 'all' && lead.status !== filters.status) return false;
    if (filters.minValue && (lead.valor_potencial || 0) < parseFloat(filters.minValue)) return false;
    if (filters.maxValue && (lead.valor_potencial || 0) > parseFloat(filters.maxValue)) return false;
    return true;
  });

  // Transform data for components
  const projectsData = projects.map(p => ({
    id: p.id,
    nombre: p.nombre,
    icon: p.icon,
    color: p.color,
  }));

  const membersData = profiles.map(p => ({
    id: p.id,
    nombre: p.nombre,
    color: p.color,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader 
        title="CRM Global" 
        subtitle="Pipeline de todos los proyectos" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8 space-y-6">
        <CRMFilters
          projects={projectsData}
          members={membersData}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <CRMPipeline
          leads={filteredLeads as any[]}
          projects={projectsData}
          members={membersData}
          isLoading={false}
        />
      </div>
    </>
  );
}
