/**
 * F22.2 — useExpansionReadiness
 *
 * Hook que llama a computeExpansionReadiness con datos reales del proyecto.
 * Lee: project_phase_state, key_metrics (60d), project_risk_score, integration_connections.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  computeExpansionReadiness,
  type ExpansionReadinessState,
  type MrrDataPoint,
} from '@/lib/expansion-readiness-engine';

export function useExpansionReadiness(projectId: string | undefined) {
  return useQuery({
    queryKey: ['expansion-readiness', projectId],
    queryFn: async (): Promise<ExpansionReadinessState> => {
      const [phaseResult, mrrResult, riskResult, intResult] = await Promise.all([
        supabase
          .from('project_phase_state')
          .select('current_phase')
          .eq('project_id', projectId!)
          .maybeSingle(),
        supabase
          .from('key_metrics')
          .select('date, mrr')
          .eq('project_id', projectId!)
          .gte('date', new Date(Date.now() - 60 * 86_400_000).toISOString().split('T')[0])
          .order('date', { ascending: true }),
        supabase
          .from('project_risk_score')
          .select('risk_level')
          .eq('project_id', projectId!)
          .maybeSingle(),
        supabase
          .from('integration_connections')
          .select('id')
          .eq('project_id', projectId!)
          .eq('status', 'active'),
      ]);

      const currentPhase = phaseResult.data?.current_phase ?? 1;
      const mrrHistory: MrrDataPoint[] = (mrrResult.data ?? []).map(r => ({
        date: r.date,
        mrr: Number(r.mrr) || 0,
      }));
      const riskLevel = riskResult.data?.risk_level ?? 'low';
      const activeIntegrations = intResult.data?.length ?? 0;

      return computeExpansionReadiness({
        currentPhase,
        mrrHistory,
        riskLevel,
        activeIntegrations,
      });
    },
    enabled: !!projectId,
    staleTime: 5 * 60_000,
  });
}
