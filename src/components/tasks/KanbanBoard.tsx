import { useState } from 'react';
import { Plus, Loader2, Circle, Clock, CheckCircle2, AlertCircle, Calendar, Flag, Sparkles, User, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TaskForm } from './TaskForm';
import { TaskPlaybookViewer } from './TaskPlaybookViewer';
import { TaskCompletionDialog } from './TaskCompletionDialog';
import { Json } from '@/integrations/supabase/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  playbook: Json | null;
  metadata: Json | null;
}

interface TaskFeedback {
  resultado: 'exito' | 'parcial' | 'fallido';
  insights: string;
  aprendizaje: string;
  siguiente_accion: string;
  dificultad: number;
}

interface KanbanBoardProps {
  projectId: string;
  projectMembers: Array<{ id: string; nombre: string; color: string }>;
}

export function KanbanBoard({ projectId, projectMembers }: KanbanBoardProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedTaskForPlaybook, setSelectedTaskForPlaybook] = useState<Task | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleCompleteClick = (task: Task) => {
    if (task.status === 'done') {
      // If already done, just toggle back to todo
      toggleTaskStatus(task, 'todo');
    } else {
      // If not done, show completion dialog
      setTaskToComplete(task);
    }
  };

  const toggleTaskStatus = async (task: Task, newStatus: string) => {
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

  const handleTaskComplete = async (taskId: string, feedback: TaskFeedback) => {
    try {
      // Save feedback as a user insight
      if (profile?.id) {
        await supabase.from('user_insights').insert({
          user_id: profile.id,
          project_id: projectId,
          tipo: 'tarea_completada',
          titulo: `Tarea: ${taskToComplete?.titulo}`,
          contenido: `**Resultado:** ${feedback.resultado}\n\n**Insights:** ${feedback.insights}\n\n**Aprendizaje:** ${feedback.aprendizaje}\n\n**Siguiente acción:** ${feedback.siguiente_accion || 'No especificada'}\n\n**Dificultad:** ${feedback.dificultad}/5`,
          tags: ['tarea', feedback.resultado],
        });
      }

      // Update task status
      const currentMetadata = taskToComplete?.metadata as Record<string, unknown> || {};
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'done' as any,
          completed_at: new Date().toISOString(),
          metadata: JSON.stringify({
            ...currentMetadata,
            completion_feedback: {
              resultado: feedback.resultado,
              insights: feedback.insights,
              aprendizaje: feedback.aprendizaje,
              siguiente_accion: feedback.siguiente_accion,
              dificultad: feedback.dificultad,
            },
          }),
        })
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success('¡Tarea completada! Feedback guardado.');
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
      setTaskToComplete(null);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  // Check if task has a playbook
  const hasPlaybook = (task: Task) => {
    return task.playbook && typeof task.playbook === 'object' && Object.keys(task.playbook).length > 0;
  };

  const getAssignee = (assigneeId: string | null) => 
    projectMembers.find(m => m.id === assigneeId);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete.id);

      if (error) throw error;
      
      toast.success('Tarea eliminada');
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error al eliminar la tarea');
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  };

  const canDeleteTask = (task: Task) => {
    return task.assignee_id === profile?.id || !task.assignee_id;
  };

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
                                    onClick={() => handleCompleteClick(task)}
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
                                  <div className="flex items-center gap-2">
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
                                    
                                    {/* Playbook button */}
                                    {hasPlaybook(task) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTaskForPlaybook(task);
                                        }}
                                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                                        title="Ver Playbook"
                                      >
                                        <BookOpen size={12} />
                                        <span>Playbook</span>
                                      </button>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {canDeleteTask(task) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTaskToDelete(task);
                                        }}
                                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        title="Eliminar tarea"
                                      >
                                        <Trash2 size={14} />
                                      </button>
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

      {/* Playbook Dialog */}
      <Dialog 
        open={!!selectedTaskForPlaybook} 
        onOpenChange={(open) => !open && setSelectedTaskForPlaybook(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Playbook de la tarea
            </DialogTitle>
          </DialogHeader>
          {selectedTaskForPlaybook?.playbook && (
            <TaskPlaybookViewer 
              playbook={selectedTaskForPlaybook.playbook as any} 
              taskTitle={selectedTaskForPlaybook.titulo}
              onClose={() => setSelectedTaskForPlaybook(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Task Completion Dialog */}
      {taskToComplete && (
        <TaskCompletionDialog
          open={!!taskToComplete}
          onOpenChange={(open) => !open && setTaskToComplete(null)}
          task={{
            id: taskToComplete.id,
            titulo: taskToComplete.titulo,
            descripcion: taskToComplete.descripcion,
            playbook: taskToComplete.playbook as any,
            metadata: taskToComplete.metadata as any,
          }}
          onComplete={handleTaskComplete}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la tarea "{taskToDelete?.titulo}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
