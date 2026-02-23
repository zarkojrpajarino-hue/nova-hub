import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { taskService } from '@/services/TaskService';
import type { DropResult } from '@hello-pangea/dnd';
import type { Database, Json } from '@/integrations/supabase/types';

export const TASK_COLUMNS = [
  { id: 'todo', label: 'To Do', icon: 'Circle', color: '#64748B' },
  { id: 'doing', label: 'Doing', icon: 'Clock', color: '#F59E0B' },
  { id: 'done', label: 'Done', icon: 'CheckCircle2', color: '#22C55E' },
  { id: 'blocked', label: 'Blocked', icon: 'AlertCircle', color: '#EF4444' },
] as const;

export interface Task {
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

export interface TaskFeedback {
  resultado: 'exito' | 'parcial' | 'fallido';
  insights: string;
  aprendizaje: string;
  siguiente_accion: string;
  dificultad: number;
}

export function useTaskKanban(projectId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [selectedTaskForPlaybook, setSelectedTaskForPlaybook] = useState<Task | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project_tasks', projectId],
    queryFn: async () => {
      const data = await taskService.getByProject(projectId);
      return data as Task[];
    },
  });

  // Drag and drop handler
  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const oldStatus = result.source.droppableId;

    if (newStatus === oldStatus) return;

    // If moving to "done", show completion dialog
    if (newStatus === 'done' && oldStatus !== 'done') {
      const taskToMark = tasks.find(t => t.id === taskId);
      if (taskToMark) {
        setTaskToComplete(taskToMark);
        return; // Wait for feedback before updating
      }
    }

    // For other movements, update directly
    const previousTasks = queryClient.getQueryData<Task[]>(['project_tasks', projectId]);

    // Optimistic update
    queryClient.setQueryData(['project_tasks', projectId], (old: Task[] | undefined) =>
      old?.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    );

    try {
      await taskService.updateStatus(
        taskId,
        newStatus as Database["public"]["Enums"]["task_status"]
      );

      toast.success(`Tarea movida a ${TASK_COLUMNS.find(c => c.id === newStatus)?.label}`);
    } catch (_error) {
      // Rollback on failure
      queryClient.setQueryData(['project_tasks', projectId], previousTasks);
      toast.error('Error al mover la tarea. Se ha revertido el cambio.');
    }
  }, [tasks, projectId, queryClient]);

  // Toggle task status when clicking checkbox
  const handleCompleteClick = useCallback((task: Task) => {
    if (task.status === 'done') {
      // If already done, toggle back to todo
      toggleTaskStatus(task, 'todo');
    } else {
      // If not done, show completion dialog
      setTaskToComplete(task);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTaskStatus = async (task: Task, newStatus: string) => {
    try {
      await taskService.updateStatus(
        task.id,
        newStatus as Database["public"]["Enums"]["task_status"]
      );
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
    } catch (_error) {
      toast.error('Error al actualizar tarea');
    }
  };

  // Complete task with feedback
  const handleTaskComplete = useCallback(async (taskId: string, feedback: TaskFeedback) => {
    if (!profile?.id || !taskToComplete) return;

    try {
      await taskService.completeWithFeedback(
        taskId,
        feedback,
        profile.id,
        projectId,
        taskToComplete.titulo,
        taskToComplete.metadata
      );

      toast.success('¡Tarea completada! Feedback guardado.');
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
      setTaskToComplete(null);
    } catch (_error) {
      throw error;
    }
  }, [profile, projectId, taskToComplete, queryClient]);

  // Delete task
  const handleDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      await taskService.delete(taskToDelete.id);

      toast.success('Tarea eliminada');
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
    } catch (_error) {
      toast.error('Error al eliminar la tarea');
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  }, [taskToDelete, projectId, queryClient]);

  // Check if user can delete task
  const canDeleteTask = useCallback((task: Task) => {
    return task.assignee_id === profile?.id || !task.assignee_id;
  }, [profile]);

  // Check if task has playbook
  const hasPlaybook = useCallback((task: Task) => {
    return task.playbook && typeof task.playbook === 'object' && Object.keys(task.playbook).length > 0;
  }, []);

  return {
    // State
    tasks,
    isLoading,
    showForm,
    setShowForm,
    selectedTaskForPlaybook,
    setSelectedTaskForPlaybook,
    taskToComplete,
    setTaskToComplete,
    taskToDelete,
    setTaskToDelete,
    isDeleting,

    // Actions
    handleDragEnd,
    handleCompleteClick,
    handleTaskComplete,
    handleDeleteTask,
    canDeleteTask,
    hasPlaybook,
  };
}
