import { useState } from 'react';
import { Plus, Loader2, Circle, Clock, CheckCircle2, AlertCircle, Calendar, Flag, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskForm } from './TaskForm';

const TASK_COLUMNS = [
  { id: 'todo', label: 'To Do', icon: Circle, color: '#64748B' },
  { id: 'doing', label: 'Doing', icon: Clock, color: '#F59E0B' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: '#22C55E' },
  { id: 'blocked', label: 'Blocked', icon: AlertCircle, color: '#EF4444' },
];

const PRIORITY_COLORS: Record<number, string> = {
  1: '#EF4444', // Alta
  2: '#F59E0B', // Media
  3: '#22C55E', // Baja
};

interface Task {
  id: string;
  titulo: string;
  descripcion: string | null;
  status: string;
  prioridad: number | null;
  fecha_limite: string | null;
  assignee_id: string | null;
  ai_generated: boolean | null;
  created_at: string;
}

interface KanbanBoardProps {
  projectId: string;
  projectMembers: Array<{ id: string; nombre: string; color: string }>;
}

export function KanbanBoard({ projectId, projectMembers }: KanbanBoardProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project_tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('prioridad', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Task[];
    },
  });

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const oldStatus = result.source.droppableId;

    if (newStatus === oldStatus) return;

    // Optimistic update
    queryClient.setQueryData(['project_tasks', projectId], (old: Task[] | undefined) =>
      old?.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    );

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus as any,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success(`Tarea movida a ${TASK_COLUMNS.find(c => c.id === newStatus)?.label}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error al mover la tarea');
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
    }
  };

  const toggleComplete = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus as any,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Error al actualizar tarea');
    }
  };

  const getAssignee = (assigneeId: string | null) => 
    projectMembers.find(m => m.id === assigneeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
          <Plus size={14} className="mr-2" />
          Manual
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
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

                {/* Droppable area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "space-y-3 min-h-[300px] p-2 rounded-xl transition-colors",
                        snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20"
                      )}
                    >
                      {columnTasks.map((task, index) => {
                        const assignee = getAssignee(task.assignee_id);
                        const isOverdue = task.fecha_limite && 
                          new Date(task.fecha_limite) < new Date() && 
                          task.status !== 'done';
                        
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "bg-card border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing",
                                  snapshot.isDragging && "shadow-lg ring-2 ring-primary",
                                  task.status === 'done' && "opacity-60"
                                )}
                              >
                                {/* Priority & AI badge */}
                                <div className="flex items-center gap-2 mb-2">
                                  {task.prioridad && (
                                    <div 
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: PRIORITY_COLORS[task.prioridad] }}
                                      title={`Prioridad ${task.prioridad === 1 ? 'Alta' : task.prioridad === 2 ? 'Media' : 'Baja'}`}
                                    />
                                  )}
                                  {task.ai_generated && (
                                    <div className="flex items-center gap-1 text-xs text-purple-500">
                                      <Sparkles size={10} />
                                      IA
                                    </div>
                                  )}
                                </div>

                                {/* Checkbox + Title */}
                                <div className="flex items-start gap-2 mb-2">
                                  <button
                                    onClick={() => toggleComplete(task)}
                                    className="mt-0.5 shrink-0"
                                  >
                                    {task.status === 'done' ? (
                                      <CheckCircle2 size={18} className="text-success" />
                                    ) : (
                                      <Circle size={18} className="text-muted-foreground hover:text-primary transition-colors" />
                                    )}
                                  </button>
                                  <p className={cn(
                                    "font-medium text-sm",
                                    task.status === 'done' && "line-through text-muted-foreground"
                                  )}>
                                    {task.titulo}
                                  </p>
                                </div>

                                {task.descripcion && (
                                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 pl-6">
                                    {task.descripcion}
                                  </p>
                                )}
                                
                                {/* Footer */}
                                <div className="flex items-center justify-between pl-6">
                                  {task.fecha_limite && (
                                    <div className={cn(
                                      "flex items-center gap-1 text-xs",
                                      isOverdue ? "text-destructive" : "text-muted-foreground"
                                    )}>
                                      <Calendar size={10} />
                                      {new Date(task.fecha_limite).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                      })}
                                    </div>
                                  )}
                                  
                                  {assignee && (
                                    <div 
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                      style={{ backgroundColor: assignee.color }}
                                      title={assignee.nombre}
                                    >
                                      {assignee.nombre.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}

                      {columnTasks.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                          Sin tareas
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <TaskForm
        projectId={projectId}
        projectMembers={projectMembers}
        open={showForm}
        onOpenChange={setShowForm}
      />
    </div>
  );
}
