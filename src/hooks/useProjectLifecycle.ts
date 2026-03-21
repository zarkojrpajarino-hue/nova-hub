/**
 * A12.3+A12.4+A12.5 — Hooks de ciclo de vida del proyecto
 *
 * usePauseProject: pausar/despausar
 * useArchiveProject: archivar
 * useRemoveMember: eliminar miembro + redistribuir tareas
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePauseProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, pause }: { projectId: string; pause: boolean }) => {
      const fn = pause ? 'pause_project' : 'unpause_project';
      const { error } = await supabase.rpc(fn, { p_project_id: projectId });
      if (error) throw error;
    },
    onSuccess: (_, { pause }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(pause ? 'Proyecto pausado' : 'Proyecto reactivado');
    },
    onError: () => {
      toast.error('Error al cambiar estado del proyecto');
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      const { error } = await supabase.rpc('archive_project', { p_project_id: projectId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto archivado');
    },
    onError: () => {
      toast.error('Error al archivar proyecto');
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      memberId,
      reassignTo,
    }: {
      projectId: string;
      memberId: string;
      reassignTo?: string;
    }) => {
      const { data, error } = await supabase.rpc('remove_project_member', {
        p_project_id: projectId,
        p_member_id: memberId,
        p_reassign_to: reassignTo ?? null,
      });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string; tasks_reassigned?: number };
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (result, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Miembro eliminado. ${result.tasks_reassigned ?? 0} tareas reasignadas.`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al eliminar miembro');
    },
  });
}
