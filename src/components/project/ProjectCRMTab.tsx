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

type Lead = Database['public']['Tables']['leads']['Row'];

export function ProjectCRMTab({ projectId, projectName }: ProjectCRMTabProps) {
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
      return data as Lead[];
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
