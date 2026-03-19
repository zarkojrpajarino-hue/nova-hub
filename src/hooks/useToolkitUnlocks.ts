/**
 * useToolkitUnlocks — F21.2
 *
 * Agrega los datos necesarios para computeToolkitUnlocks:
 *   - leads_count: leads tabla + integration_entities deals
 *   - closed_deals_count: cerrado_ganado en leads + won en HubSpot entities
 *   - pitches_count: integration_insights tipo email_pitch
 *   - active_customers_count: Stripe subscriptions activas
 *   - has_stripe: integration_connections provider=stripe activa
 *   - generated_tools: founder_tool_cache existentes (no expirados)
 *
 * staleTime 5min — no es crítico que sea en tiempo real.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  computeToolkitUnlocks,
  type ToolkitUnlockState,
  type ToolType,
} from '@/lib/toolkit-unlock-engine';

export type { ToolkitUnlockState, ToolType };

// ─────────────────────────────────────────────────────────────────────────────

export function useToolkitUnlocks(projectId: string | undefined): {
  unlocks: ToolkitUnlockState | null;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['toolkit-unlocks', projectId],
    enabled: !!projectId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [
        // leads de la tabla legacy CRM
        { count: leadsCount },
        // deals de HubSpot vía integration_entities
        { count: hubspotDealsCount },
        // deals cerrados (legacy CRM)
        { count: closedLeadsCount },
        // deals cerrados en HubSpot (payload.dealstage contiene 'win' o 'closed')
        { count: closedHubspotCount },
        // pitches enviados (email_pitch en integration_insights)
        { count: pitchesCount },
        // subscriptions activas en Stripe
        { count: activeCustomersCount },
        // Stripe conectado
        { count: stripeCount },
        // herramientas ya generadas
        { data: generatedRows },
      ] = await Promise.all([
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!),

        supabase
          .from('integration_entities')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('entity_type', 'deal'),

        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('status', 'cerrado_ganado'),

        supabase
          .from('integration_entities')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('entity_type', 'deal')
          .ilike('payload->>dealstage', '%won%'),

        supabase
          .from('integration_insights')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('insight_type', 'email_pitch'),

        supabase
          .from('integration_entities')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('entity_type', 'subscription')
          .eq('provider', 'stripe')
          .eq('payload->>status' as string, 'active'),

        supabase
          .from('integration_connections')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('provider', 'stripe')
          .eq('status', 'active'),

        supabase
          .from('founder_tool_cache')
          .select('tool_type')
          .eq('project_id', projectId!)
          .gt('expires_at', new Date().toISOString()),
      ]);

      const leads_count = (leadsCount ?? 0) + (hubspotDealsCount ?? 0);
      const closed_deals_count = (closedLeadsCount ?? 0) + (closedHubspotCount ?? 0);
      const generated_tools = (generatedRows ?? []).map(r => r.tool_type as ToolType);

      return computeToolkitUnlocks({
        leads_count,
        closed_deals_count,
        pitches_count: pitchesCount ?? 0,
        active_customers_count: activeCustomersCount ?? 0,
        has_stripe: (stripeCount ?? 0) > 0,
        generated_tools,
      });
    },
  });

  return { unlocks: data ?? null, isLoading };
}
