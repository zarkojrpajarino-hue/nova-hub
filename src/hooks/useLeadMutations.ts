/**
 * useLeadMutations — Centralized lead mutation hooks
 *
 * Replaces direct supabase.from('leads').insert() calls in components.
 * Invalidates the correct queryKeys on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import type { Database } from '@/integrations/supabase/types';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

/**
 * Hook for creating one or more leads.
 * Accepts a single lead or an array.
 */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: LeadInsert | LeadInsert[]) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(Array.isArray(leadData) ? leadData : [leadData])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      const first = Array.isArray(variables) ? variables[0] : variables;
      if (first?.project_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.byProject(first.project_id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.pipeline });
    },
  });
}
