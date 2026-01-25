import { taskRepository } from '@/repositories/TaskRepository';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type TaskStatus = Database['public']['Enums']['task_status'];

export class TaskService {
  async getById(id: string) {
    return taskRepository.findById(id);
  }

  async getByProject(projectId: string) {
    return taskRepository.findByProject(projectId);
  }

  async getByAssignee(assigneeId: string) {
    return taskRepository.findByAssignee(assigneeId);
  }

  async create(taskData: TaskInsert) {
    if (!taskData.titulo || !taskData.project_id) {
      throw new Error('Título y proyecto son requeridos');
    }
    return taskRepository.create(taskData);
  }

  async update(id: string, updates: TaskUpdate) {
    return taskRepository.update(id, updates);
  }

  async updateStatus(id: string, status: TaskStatus) {
    return taskRepository.updateStatus(id, status);
  }

  async completeWithFeedback(
    taskId: string,
    feedback: {
      resultado: 'exito' | 'parcial' | 'fallido';
      insights: string;
      aprendizaje: string;
      siguiente_accion: string;
      dificultad: number;
    },
    userId: string,
    projectId: string,
    taskTitle: string,
    currentMetadata?: Json
  ) {
    const contenido = '**Resultado:** ' + feedback.resultado + '\n\n**Insights:** ' + feedback.insights + '\n\n**Aprendizaje:** ' + feedback.aprendizaje + '\n\n**Siguiente acción:** ' + (feedback.siguiente_accion || 'No especificada') + '\n\n**Dificultad:** ' + feedback.dificultad + '/5';
    
    await supabase.from('user_insights').insert({
      user_id: userId,
      project_id: projectId,
      tipo: 'tarea_completada',
      titulo: 'Tarea: ' + taskTitle,
      contenido,
      tags: ['tarea', feedback.resultado],
    });

    await taskRepository.completeWithFeedback(taskId, feedback, currentMetadata);
  }

  async delete(id: string) {
    return taskRepository.delete(id);
  }
}

export const taskService = new TaskService();
