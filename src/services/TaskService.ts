import { taskRepository } from '@/repositories/TaskRepository';
import type { Database } from '@/integrations/supabase/types';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskStatus = Database['public']['Enums']['task_status'];

export interface TaskFeedback {
  resultado: string;
  aprendizaje: string;
  mejora: string;
}

/**
 * Service layer for Task business logic
 * Orchestrates repository operations and contains domain rules
 */
export class TaskService {
  /**
   * Create a new task with validation
   */
  async createTask(
    titulo: string,
    projectId: string,
    assignedTo: string,
    options?: Partial<TaskInsert>
  ) {
    // Business rule: Validate titulo length
    if (!titulo || titulo.trim().length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres');
    }

    if (titulo.length > 200) {
      throw new Error('El título no puede superar 200 caracteres');
    }

    const taskData: TaskInsert = {
      titulo: titulo.trim(),
      project_id: projectId,
      assigned_to: assignedTo,
      status: 'pending',
      ...options,
    };

    return await taskRepository.create(taskData);
  }

  /**
   * Move task to new status with business rules
   */
  async moveTask(taskId: string, newStatus: TaskStatus) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Tarea no encontrada');
    }

    // Business rule: Can't move from done back to other statuses without proper flow
    if (task.status === 'done' && newStatus !== 'done') {
      throw new Error('No se puede reabrir una tarea completada directamente');
    }

    await taskRepository.updateStatus(taskId, newStatus);
  }

  /**
   * Complete task with feedback
   */
  async completeTaskWithFeedback(
    taskId: string,
    userId: string,
    feedback: TaskFeedback
  ) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Tarea no encontrada');
    }

    // Business rule: Only assigned user can complete task
    if (task.assigned_to !== userId) {
      throw new Error('Solo el responsable puede completar la tarea');
    }

    // Complete the task
    await taskRepository.complete(taskId, userId);

    // Return feedback summary
    return {
      taskId,
      feedback,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Get task statistics for a project
   */
  async getProjectStats(projectId: string) {
    const tasks = await taskRepository.findByProject(projectId);

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      completionRate: 0,
    };

    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.done / stats.total) * 100);
    }

    return stats;
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(projectId: string) {
    const tasks = await taskRepository.findByProject(projectId);
    const now = new Date();

    return tasks.filter(task => {
      if (task.status === 'done' || !task.fecha_limite) return false;
      return new Date(task.fecha_limite) < now;
    });
  }
}

// Singleton instance
export const taskService = new TaskService();
