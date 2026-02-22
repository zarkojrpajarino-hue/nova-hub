import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, CheckCircle2, Circle, Calendar, Filter,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useNovaData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

interface TaskWithProject {
  id: string;
  titulo: string;
  descripcion: string | null;
  status: string;
  prioridad: number | null;
  fecha_limite: string | null;
  project_id: string | null;
  ai_generated: boolean | null;
  project?: {
    id: string;
    nombre: string;
    icon: string;
    color: string;
  };
}

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Alta', color: '#EF4444' },
  2: { label: 'Media', color: '#F59E0B' },
  3: { label: 'Baja', color: '#22C55E' },
};

export function MyTasksList() {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<'today' | 'pending' | 'all'>('pending');

  const today = new Date().toISOString().split('T')[0];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my_tasks', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', profile.id)
        .neq('status', 'done')
        .order('prioridad', { ascending: true })
        .order('fecha_limite', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Enrich tasks with project info
  const enrichedTasks: TaskWithProject[] = tasks.map(task => ({
    ...task,
    project: projects.find(p => p.id === task.project_id),
  }));

  // Apply filters
  const filteredTasks = enrichedTasks.filter(task => {
    // Project filter
    if (filterProject !== 'all' && task.project_id !== filterProject) return false;
    
    // Type filter
    if (filterType === 'today' && task.fecha_limite !== today) return false;
    
    return true;
  });

  // Group by date
  const todayTasks = filteredTasks.filter(t => t.fecha_limite === today);
  const overdueTasks = filteredTasks.filter(t => 
    t.fecha_limite && t.fecha_limite < today
  );
  const upcomingTasks = filteredTasks.filter(t => 
    !t.fecha_limite || (t.fecha_limite > today)
  );

  const toggleComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'done' as Database['public']['Enums']['task_status'],
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success('¡Tarea completada!');
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error al completar tarea');
    }
  };

  const renderTask = (task: TaskWithProject) => {
    const isOverdue = task.fecha_limite && task.fecha_limite < today;
    
    return (
      <div
        key={task.id}
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
      >
        <button onClick={() => toggleComplete(task.id)}>
          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {task.prioridad && (
              <div 
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: PRIORITY_CONFIG[task.prioridad]?.color }}
              />
            )}
            <p className="font-medium text-sm truncate">{task.titulo}</p>
            {task.ai_generated && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-purple-500 border-purple-200">
                IA
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.project && (
              <div className="flex items-center gap-1">
                <span>{task.project.icon}</span>
                <span className="truncate max-w-[100px]">{task.project.nombre}</span>
              </div>
            )}
            
            {task.fecha_limite && (
              <div className={cn(
                "flex items-center gap-1",
                isOverdue && "text-destructive"
              )}>
                {isOverdue && <AlertCircle size={10} />}
                <Calendar size={10} />
                {new Date(task.fecha_limite).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            )}
          </div>
        </div>

        {task.project && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => navigate(`/proyecto/${task.project_id}`)}
          >
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterType} onValueChange={(v: 'today' | 'pending' | 'all') => setFilterType(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-[180px]">
            <Filter size={14} className="mr-2" />
            <SelectValue placeholder="Proyecto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proyectos</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.icon} {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay tareas pendientes</p>
          <p className="text-sm">¡Buen trabajo!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                <AlertCircle size={14} />
                Atrasadas ({overdueTasks.length})
              </h4>
              <div className="space-y-1">
                {overdueTasks.map(renderTask)}
              </div>
            </div>
          )}

          {/* Today */}
          {todayTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Calendar size={14} />
                Hoy ({todayTasks.length})
              </h4>
              <div className="space-y-1">
                {todayTasks.map(renderTask)}
              </div>
            </div>
          )}

          {/* Upcoming / No date */}
          {upcomingTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                Próximas ({upcomingTasks.length})
              </h4>
              <div className="space-y-1">
                {upcomingTasks.map(renderTask)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
