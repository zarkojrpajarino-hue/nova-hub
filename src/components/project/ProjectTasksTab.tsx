import { useState } from 'react';
import { Plus, Loader2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TASK_COLUMNS = [
  { id: 'todo', label: 'To Do', icon: Circle, color: '#64748B' },
  { id: 'doing', label: 'Doing', icon: Clock, color: '#F59E0B' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: '#22C55E' },
];

interface ProjectTasksTabProps {
  projectId: string;
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ titulo: '', descripcion: '' });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project_tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleAddTask = async () => {
    if (!newTask.titulo || !profile?.id) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          titulo: newTask.titulo,
          descripcion: newTask.descripcion || null,
          assignee_id: profile.id,
          status: 'todo',
        });

      if (error) throw error;

      toast.success('Tarea creada');
      setIsAdding(false);
      setNewTask({ titulo: '', descripcion: '' });
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Error al crear tarea');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus as any,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error al actualizar tarea');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tareas del Proyecto</h3>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Tarea</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newTask.titulo}
                  onChange={e => setNewTask(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Preparar presentación..."
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={newTask.descripcion}
                  onChange={e => setNewTask(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button onClick={handleAddTask} className="w-full">
                Crear Tarea
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-3 gap-6">
        {TASK_COLUMNS.map(column => {
          const columnTasks = tasks.filter(t => t.status === column.id);
          
          return (
            <div key={column.id}>
              {/* Column Header */}
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-t-xl mb-3"
                style={{ 
                  background: 'hsl(var(--muted))',
                  borderTop: `3px solid ${column.color}` 
                }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <column.icon size={16} style={{ color: column.color }} />
                  {column.label}
                </div>
                <span className="w-6 h-6 rounded-lg bg-background flex items-center justify-center text-xs font-semibold">
                  {columnTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3 min-h-[300px]">
                {columnTasks.map(task => (
                  <div 
                    key={task.id}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <p className={cn(
                      "font-medium mb-2",
                      task.status === 'done' && "line-through text-muted-foreground"
                    )}>
                      {task.titulo}
                    </p>
                    {task.descripcion && (
                      <p className="text-sm text-muted-foreground mb-3">{task.descripcion}</p>
                    )}
                    
                    {/* Status buttons */}
                    <div className="flex gap-1">
                      {TASK_COLUMNS.filter(c => c.id !== task.status).map(col => (
                        <Button
                          key={col.id}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => updateTaskStatus(task.id, col.id)}
                        >
                          <col.icon size={12} className="mr-1" />
                          {col.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    Sin tareas
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
