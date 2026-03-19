/**
 * useToolkitUnlocks — F21.2 + F21.V2.1
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
 * V2.1 — Phase 2 condicional: para tools generadas, cuenta nuevos registros
 * desde generated_at. Solo si hay tools generadas. Queries en paralelo.
 * Thresholds para evitar ruido:
 *   buyer_persona:     ≥3 nuevas OBVs en pipeline
 *   lead_scoring:      ≥1 deal cerrado nuevo
 *   sales_playbook:    ≥1 deal cerrado nuevo
 *   brand_kit:         ≥3 pitches nuevos
 *   comms_guide:       brand_kit regenerado después
 *   customer_journey:  ≥1 sub Stripe nueva (fuerte) | ≥2 deals nuevos (secundario)
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
          .select('tool_type, generated_at')   // V2.1: incluir generated_at para Phase 2
          .eq('project_id', projectId!)
          .gt('expires_at', new Date().toISOString()),
      ]);

      const leads_count = (obvLeadsCount ?? 0) + (hubspotDealsCount ?? 0);
      const closed_deals_count = (closedObvCount ?? 0) + (closedHubspotCount ?? 0);
      const cacheRows = (generatedRows ?? []) as Array<{ tool_type: string; generated_at: string }>;
      const generated_tools = cacheRows.map(r => r.tool_type as ToolType);

      // ── Phase 1: unlock state ─────────────────────────────────────────────
      const unlocks = computeToolkitUnlocks({
        leads_count,
        closed_deals_count,
        pitches_count: pitchesCount ?? 0,
        active_customers_count: activeCustomersCount ?? 0,
        has_stripe: (stripeCount ?? 0) > 0,
        generated_tools,
      });

      // ── Phase 2: new data signals (solo para tools generadas) ─────────────
      if (cacheRows.length === 0) return unlocks;

      const cacheMap = Object.fromEntries(cacheRows.map(r => [r.tool_type, r.generated_at]));
      const noop = Promise.resolve({ count: 0, data: null });

      const [bpNew, lsNew, spNew, bkNew, cjStripeNew, cjDealsNew] = await Promise.all([
        // buyer_persona: nuevas OBVs en pipeline
        cacheMap.buyer_persona
          ? supabase.from('obvs').select('id', { count: 'exact', head: true })
              .eq('project_id', projectId!).not('pipeline_status', 'is', null)
              .gt('updated_at', cacheMap.buyer_persona)
          : noop,
        // lead_scoring: nuevos deals cerrados
        cacheMap.lead_scoring
          ? supabase.from('obvs').select('id', { count: 'exact', head: true })
              .eq('project_id', projectId!).eq('pipeline_status', 'cerrado_ganado')
              .gt('updated_at', cacheMap.lead_scoring)
          : noop,
        // sales_playbook: nuevos deals cerrados
        cacheMap.sales_playbook
          ? supabase.from('obvs').select('id', { count: 'exact', head: true })
              .eq('project_id', projectId!).eq('pipeline_status', 'cerrado_ganado')
              .gt('updated_at', cacheMap.sales_playbook)
          : noop,
        // brand_kit: nuevos pitches
        cacheMap.brand_kit
          ? supabase.from('integration_insights').select('id', { count: 'exact', head: true })
              .eq('project_id', projectId!).eq('insight_type', 'email_pitch')
              .gt('created_at', cacheMap.brand_kit)
          : noop,
        // customer_journey: nuevas subs Stripe
        cacheMap.customer_journey
          ? supabase.from('integration_entities').select('id', { count: 'exact', head: true })
              .eq('project_id', projectId!).eq('entity_type', 'subscription').eq('provider', 'stripe')
              .gt('occurred_at', cacheMap.customer_journey)
          : noop,
        // customer_journey: nuevos deals
        cacheMap.customer_journey
          ? supabase.from('obvs').select('id', { count: 'exact', head: true })
              .eq('project_id', projectId!).eq('pipeline_status', 'cerrado_ganado')
              .gt('updated_at', cacheMap.customer_journey)
          : noop,
      ]);

      const n = (r: { count: number | null }) => r.count ?? 0;
      const pl = (count: number, sg: string, pl: string) => count !== 1 ? pl : sg;

      // comms_guide: brand_kit más reciente que comms_guide
      const commsNewData =
        !!(cacheMap.brand_kit && cacheMap.comms_guide &&
           new Date(cacheMap.brand_kit) > new Date(cacheMap.comms_guide));

      // Aplicar thresholds y escribir señal en el unlocks (mutación local, no propaga)
      if (n(bpNew) >= 3) {
        const c = n(bpNew);
        unlocks.buyer_persona.has_new_data = true;
        unlocks.buyer_persona.new_data_reason = `${c} lead${pl(c,'','s')} nuevo${pl(c,'','s')} en CRM`;
        unlocks.buyer_persona.new_data_count = c;
      }
      if (n(lsNew) >= 1) {
        const c = n(lsNew);
        unlocks.lead_scoring.has_new_data = true;
        unlocks.lead_scoring.new_data_reason = `${c} deal${pl(c,'','s')} cerrado${pl(c,'','s')} nuevo${pl(c,'','s')}`;
        unlocks.lead_scoring.new_data_count = c;
      }
      if (n(spNew) >= 1) {
        const c = n(spNew);
        unlocks.sales_playbook.has_new_data = true;
        unlocks.sales_playbook.new_data_reason = `${c} deal${pl(c,'','s')} ganado${pl(c,'','s')} nuevo${pl(c,'','s')}`;
        unlocks.sales_playbook.new_data_count = c;
      }
      if (n(bkNew) >= 3) {
        const c = n(bkNew);
        unlocks.brand_kit.has_new_data = true;
        unlocks.brand_kit.new_data_reason = `${c} pitch${pl(c,'','es')} enviado${pl(c,'','s')} recientemente`;
        unlocks.brand_kit.new_data_count = c;
      }
      if (commsNewData) {
        unlocks.comms_guide.has_new_data = true;
        unlocks.comms_guide.new_data_reason = 'Brand Kit actualizado — regenerar para aplicar cambios';
        unlocks.comms_guide.new_data_count = 1;
      }
      if (n(cjStripeNew) >= 1) {
        const c = n(cjStripeNew);
        unlocks.customer_journey.has_new_data = true;
        unlocks.customer_journey.new_data_reason = `${c} cliente${pl(c,'','s')} nuevo${pl(c,'','s')} en Stripe`;
        unlocks.customer_journey.new_data_count = c;
      } else if (n(cjDealsNew) >= 2) {
        const c = n(cjDealsNew);
        unlocks.customer_journey.has_new_data = true;
        unlocks.customer_journey.new_data_reason = `${c} deals nuevos en pipeline`;
        unlocks.customer_journey.new_data_count = c;
      }

      return unlocks;
    },
  });

  return { unlocks: data ?? null, isLoading };
}
