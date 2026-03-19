/**
 * useToolkitUnlocks — F21.2
 *
 * Agrega los datos necesarios para computeToolkitUnlocks.
 * No existe tabla leads — los contactos/deals están en obvs (tipo venta o pipeline_status != null).
 *
 *   leads_count          — obvs con pipeline_status IS NOT NULL + integration_entities deals
 *   closed_deals_count   — obvs pipeline_status='cerrado_ganado' + HubSpot deals won
 *   pitches_count        — integration_insights tipo email_pitch
 *   active_customers_count — Stripe subscriptions activas
 *   has_stripe           — integration_connections provider=stripe activa
 *   generated_tools      — founder_tool_cache no expirados
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
        // OBVs con pipeline (contactos/deals en CRM nativo)
        { count: obvLeadsCount },
        // Deals de HubSpot vía integration_entities
        { count: hubspotDealsCount },
        // Deals cerrados en CRM nativo
        { count: closedObvCount },
        // Deals cerrados en HubSpot
        { count: closedHubspotCount },
        // Pitches enviados
        { count: pitchesCount },
        // Subscriptions activas en Stripe
        { count: activeCustomersCount },
        // Stripe conectado
        { count: stripeCount },
        // Herramientas ya generadas (no expiradas)
        { data: generatedRows },
      ] = await Promise.all([
        supabase
          .from('obvs')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .not('pipeline_status', 'is', null),

        supabase
          .from('integration_entities')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('entity_type', 'deal'),

        supabase
          .from('obvs')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('pipeline_status', 'cerrado_ganado'),

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
          .eq('provider', 'stripe'),

        supabase
          .from('integration_connections')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', projectId!)
          .eq('provider', 'stripe')
          .eq('status', 'active'),

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('founder_tool_cache')
          .select('tool_type')
          .eq('project_id', projectId!)
          .gt('expires_at', new Date().toISOString()),
      ]);

      const leads_count = (obvLeadsCount ?? 0) + (hubspotDealsCount ?? 0);
      const closed_deals_count = (closedObvCount ?? 0) + (closedHubspotCount ?? 0);
      const generated_tools = (generatedRows ?? []).map((r: { tool_type: string }) => r.tool_type as ToolType);

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
