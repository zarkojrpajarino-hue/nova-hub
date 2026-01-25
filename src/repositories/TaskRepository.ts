import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type TaskStatus = Database['public']['Enums']['task_status'];

export class TaskRepository {
  /**
   * Find a task by ID
   */
  async findById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find all tasks for a project
   */
  async findByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('prioridad', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Find tasks assigned to a user
   */
  async findByAssignee(assigneeId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', assigneeId)
      .order('prioridad', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create a new task
   */
  async create(task: TaskInsert): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a task
   */
  async update(id: string, updates: TaskUpdate): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update task status
   */
  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Complete task with feedback metadata
   */
  async completeWithFeedback(
    id: string,
    feedback: {
      resultado: string;
      insights: string;
      aprendizaje: string;
      siguiente_accion: string;
      dificultad: number;
    },
    currentMetadata?: Json
  ): Promise<void> {
    const metadata = currentMetadata as Record<string, unknown> || {};

    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'done' as TaskStatus,
        completed_at: new Date().toISOString(),
        metadata: JSON.stringify({
          ...metadata,
          completion_feedback: feedback,
        }),
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const taskRepository = new TaskRepository();
