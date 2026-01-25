import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type TaskStatus = Database['public']['Enums']['task_status'];

/**
 * Repository pattern for Task data access
 * Abstracts Supabase operations behind a clean interface
 */
export class TaskRepository {
  /**
   * Find task by ID
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find tasks by status
   */
  async findByStatus(projectId: string, status: TaskStatus): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
   * Update task status
   */
  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    const completed_at = status === 'done' ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('tasks')
      .update({ status, completed_at })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Update task
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
   * Delete task
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Mark task as complete with completion data
   */
  async complete(id: string, completedBy: string, feedback?: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completed_by: completedBy,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Singleton instance
export const taskRepository = new TaskRepository();
