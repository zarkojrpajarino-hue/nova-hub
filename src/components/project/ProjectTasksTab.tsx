import { memo } from 'react';
import { Loader2, ListTodo } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles } from '@/hooks/useNovaData';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { AITaskGenerator } from '@/components/tasks/AITaskGenerator';
import { useProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { EmptyState } from '@/components/ui/empty-state';

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { data: profiles = [] } = useProfiles();
  const { data: engineData } = useProjectEngineData(projectId);

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
      nombre: profile?.nombre || t('project.desconocido'),
      color: profile?.color || '#6366F1',
      role: pm.role,
    };
  });

  // Build AI context — F19.B.2: reemplazar ENUM legacy por datos reales del motor
  const coverageLevel = (type: string) =>
    (engineData?.coverage ?? []).find(c => c.function_type === type)?.coverage_level ?? 'none';

  const aiProjectContext = project ? {
    id: project.id,
    nombre: project.nombre,
    fase: project.fase,      // mantenido por compatibilidad con la edge function
    tipo: project.tipo,
    onboarding_data: project.onboarding_data,
    team: projectMembers.map(m => ({ id: m.id, nombre: m.nombre, role: m.role || '' })),
    obvs_count: projectStats?.obvs_count || 0,
    leads_count: projectStats?.leads_count || 0,
    last_activity: projectStats?.last_activity || null,
    // Motor del proyecto — sustituye la interpretación del ENUM por datos reales
    current_phase:     engineData?.phaseState?.current_phase  ?? 1,
    phase_score:       engineData?.phaseState?.phase_score    ?? 0,
    hard_signal_met:   engineData?.phaseState?.hard_signal_met ?? false,
    risk_level:        engineData?.risk?.risk_level           ?? 'low',
    demand_coverage:   coverageLevel('demand'),
    delivery_coverage: coverageLevel('delivery'),
  } : null;

  // Task count for empty state
  const { data: taskCount } = useQuery({
    queryKey: ['project_task_count', projectId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (taskCount === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <EmptyState
          icon={ListTodo}
          title={t('project.emptyTasks.title')}
          description={t('project.emptyTasks.description')}
          suggestions={[
            t('project.emptyTasks.suggestion1'),
            t('project.emptyTasks.suggestion2'),
            t('project.emptyTasks.suggestion3'),
          ]}
        />
        {aiProjectContext && (
          <div className="flex justify-center">
            <AITaskGenerator project={aiProjectContext} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with AI button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t('project.tareasDelProyecto')}</h3>
        {aiProjectContext && (
          <AITaskGenerator project={aiProjectContext} />
        )}
      </div>

      <KanbanBoard
        projectId={projectId}
        projectMembers={projectMembers}
        currentPhase={engineData?.phaseState?.current_phase ?? 1}
      />
    </div>
  );
}

// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios
export const ProjectTasksTab = memo(ProjectTasksTabComponent);
