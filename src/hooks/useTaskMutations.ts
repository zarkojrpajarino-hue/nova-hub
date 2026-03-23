/**
 * useTaskMutations — Centralized task mutation hooks
 *
 * Replaces direct supabase.from('tasks').insert() calls in components.
 * Uses TaskService for data access and invalidates the correct queryKeys.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/TaskService';
import { queryKeys } from '@/lib/queryKeys';
import type { Database } from '@/integrations/supabase/types';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

/**
 * Hook for creating a new task.
 * Invalidates project-scoped task queries on success.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: TaskInsert) => {
      return taskService.create(taskData);
    },
    onSuccess: (_data, variables) => {
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(variables.project_id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
