/**
 * CE25.6-CE25.10 — Hooks para ciclos estratégicos
 *
 * useActiveCycle: ciclo activo del proyecto
 * useCycleHistory: ciclos completados/revisados
 * useCompleteCycle: mutation para marcar ciclo como completado
 * useGenerateCycle: mutation para llamar edge function generate-strategic-cycle
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CycleObjective {
  id: string;
  title: string;
  description: string;
  weight: number;
  metric_name: string;
  target_value: number;
  current_value: number;
  score?: number;
}

export interface StrategicCycle {
  id: string;
  project_id: string;
  cycle_index: number;
  start_date: string;
  end_date: string;
  title: string | null;
  description: string | null;
  objectives: CycleObjective[] | null;
  cycle_score: number;
  status: string;
  completed_at: string | null;
  closed_at: string | null;
}

/** Ciclo activo del proyecto (máximo 1) */
export function useActiveCycle(projectId: string | undefined) {
  return useQuery({
    queryKey: ['strategic-cycles', projectId, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_cycles')
        .select('*')
        .eq('project_id', projectId!)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data as StrategicCycle | null;
    },
    enabled: !!projectId,
  });
}

/** Historial de ciclos completados/revisados/abandonados */
export function useCycleHistory(projectId: string | undefined) {
  return useQuery({
    queryKey: ['strategic-cycles', projectId, 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_cycles')
        .select('*')
        .eq('project_id', projectId!)
        .neq('status', 'active')
        .order('cycle_index', { ascending: false });
      if (error) throw error;
      return (data ?? []) as StrategicCycle[];
    },
    enabled: !!projectId,
  });
}

/** CE25.6 — Marcar ciclo como completado y generar siguiente */
export function useCompleteCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cycleId, projectId }: { cycleId: string; projectId: string }) => {
      // Mark current cycle as completed
      const { error: updateErr } = await supabase
        .from('strategic_cycles')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', cycleId);

      if (updateErr) throw updateErr;

      // Generate next cycle
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await supabase.functions.invoke('generate-strategic-cycle', {
        body: { projectId, trigger: 'cycle_completed' },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['strategic-cycles', projectId] });
      toast.success('Ciclo completado. Nuevo ciclo generado.');
    },
    onError: () => {
      toast.error('Error al completar el ciclo');
    },
  });
}

/** CE25.4 — Generar ciclo estratégico (graduation, manual, etc.) */
export function useGenerateCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      trigger,
    }: {
      projectId: string;
      trigger: 'graduation' | 'cycle_completed' | 'cycle_revised' | 'manual';
    }) => {
      const response = await supabase.functions.invoke('generate-strategic-cycle', {
        body: { projectId, trigger },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['strategic-cycles', projectId] });
      toast.success('Ciclo estratégico generado.');
    },
    onError: () => {
      toast.error('Error al generar ciclo estratégico');
    },
  });
}

/** CE25.8 — Pausar ciclo activo (regresión de graduación) */
export function usePauseCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cycleId, projectId }: { cycleId: string; projectId: string }) => {
      const { error } = await supabase
        .from('strategic_cycles')
        .update({ status: 'paused' })
        .eq('id', cycleId);
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['strategic-cycles', projectId] });
      toast.info('Ciclo pausado. Tu proyecto ha vuelto al bootcamp.');
    },
    onError: () => {
      toast.error('Error al pausar el ciclo');
    },
  });
}
