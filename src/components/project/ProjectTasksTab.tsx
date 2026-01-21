import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles } from '@/hooks/useNovaData';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';

interface ProjectTasksTabProps {
  projectId: string;
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const { data: profiles = [] } = useProfiles();

  // Get project members
  const { data: projectMembers = [], isLoading } = useQuery({
    queryKey: ['project_members_profiles', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('member_id')
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      const memberIds = data.map(pm => pm.member_id);
      return profiles.filter(p => memberIds.includes(p.id)).map(p => ({
        id: p.id,
        nombre: p.nombre,
        color: p.color,
      }));
    },
    enabled: profiles.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <KanbanBoard 
      projectId={projectId} 
      projectMembers={projectMembers}
    />
  );
}
