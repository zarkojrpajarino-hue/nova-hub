import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles } from '@/hooks/useNovaData';
import { CRMPipeline } from '@/components/crm/CRMPipeline';
import type { Database } from '@/integrations/supabase/types';

interface ProjectCRMTabProps {
  projectId: string;
  projectName: string;
}

type LeadRow = Database['public']['Tables']['leads']['Row'];

export interface Lead {
  id: string;
  nombre: string;
  empresa: string | null;
  status: string;
  valor_potencial: number | null;
  responsable_id: string | null;
  project_id: string;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  proxima_accion: string | null;
  proxima_accion_fecha: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function ProjectCRMTabComponent({ projectId, projectName }: ProjectCRMTabProps) {
  const { data: profiles = [] } = useProfiles();

  // Fetch project leads
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['project_leads', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: LeadRow) => ({
        id: row.id,
        nombre: row.nombre,
        empresa: row.empresa,
        status: row.status || 'frio',
        valor_potencial: row.valor_potencial,
        responsable_id: row.responsable_id,
        project_id: row.project_id,
        email: row.email,
        telefono: row.telefono,
        notas: row.notas,
        proxima_accion: row.proxima_accion,
        proxima_accion_fecha: row.proxima_accion_fecha,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    },
  });

  const membersData = profiles.map(p => ({
    id: p.id,
    nombre: p.nombre,
    color: p.color,
  }));

  const projectData = [{
    id: projectId,
    nombre: projectName,
    icon: '📁',
    color: '#6366F1',
  }];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <CRMPipeline
      projectId={projectId}
      leads={leads}
      projects={projectData}
      members={membersData}
      isLoading={false}
    />
  );
}

// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios
export const ProjectCRMTab = memo(ProjectCRMTabComponent);
