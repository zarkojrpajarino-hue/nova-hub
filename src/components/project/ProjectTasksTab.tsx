import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles } from '@/hooks/useNovaData';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { AITaskGenerator } from '@/components/tasks/AITaskGenerator';

interface ProjectTasksTabProps {
  projectId: string;
  project?: {
    id: string;
    nombre: string;
    fase: string;
    tipo: string;
    onboarding_data: Record<string, unknown> | null;
  };
}

function ProjectTasksTabComponent({ projectId, project }: ProjectTasksTabProps) {
  const { data: profiles = [] } = useProfiles();

  // Get project members with roles
  const { data: projectMembersData = [], isLoading } = useQuery({
    queryKey: ['project_members_with_roles', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('member_id, role')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
  });

  // Get project stats for AI context
  const { data: projectStats } = useQuery({
    queryKey: ['project_ai_context', projectId],
    queryFn: async () => {
      // Get OBVs count this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [obvsResult, leadsResult, lastActivityResult] = await Promise.all([
        supabase
          .from('obvs')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId),
        supabase
          .from('obvs')
          .select('created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      return {
        obvs_count: obvsResult.count || 0,
        leads_count: leadsResult.count || 0,
        last_activity: (lastActivityResult.data as Array<{ created_at: string | null }>)?.[0]?.created_at || null,
      };
    },
    enabled: !!projectId,
  });

  // Map members with roles
  const projectMembers = projectMembersData.map(pm => {
    const profile = profiles.find(p => p.id === pm.member_id);
    return {
      id: pm.member_id,
      nombre: profile?.nombre || 'Desconocido',
      color: profile?.color || '#6366F1',
      role: pm.role,
    };
  });

  // Build AI context
  const aiProjectContext = project ? {
    id: project.id,
    nombre: project.nombre,
    fase: project.fase,
    tipo: project.tipo,
    onboarding_data: project.onboarding_data,
    team: projectMembers.map(m => ({ id: m.id, nombre: m.nombre, role: m.role || '' })),
    obvs_count: projectStats?.obvs_count || 0,
    leads_count: projectStats?.leads_count || 0,
    last_activity: projectStats?.last_activity || null,
  } : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with AI button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tareas del Proyecto</h3>
        {aiProjectContext && (
          <AITaskGenerator project={aiProjectContext} />
        )}
      </div>

      <KanbanBoard 
        projectId={projectId} 
        projectMembers={projectMembers}
      />
    </div>
  );
}

// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios
export const ProjectTasksTab = memo(ProjectTasksTabComponent);
