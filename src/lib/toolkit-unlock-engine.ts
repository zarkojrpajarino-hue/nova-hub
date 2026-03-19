/**
 * toolkit-unlock-engine — F21.1
 *
 * Función pura que calcula el estado de desbloqueo de las 6 herramientas
 * del Founder Toolkit. Sin side effects, sin queries, testeable en aislamiento.
 *
 * Triggers de desbloqueo:
 *   buyer_persona    — 1+ lead/deal en CRM
 *   lead_scoring     — 5+ leads/deals en CRM
 *   sales_playbook   — 1+ deal cerrado (OBV cerrado_ganado o HubSpot won)
 *   brand_kit        — buyer_persona generada + 1+ pitch enviado
 *   comms_guide      — brand_kit generada + 2+ pitches enviados
 *   customer_journey — 10+ clientes activos en Stripe O Stripe conectado con datos
 */

export type ToolType =
  | 'buyer_persona'
  | 'lead_scoring'
  | 'sales_playbook'
  | 'brand_kit'
  | 'comms_guide'
  | 'customer_journey';

export type ToolStatus = 'locked' | 'available' | 'generated';

export interface ToolUnlockInfo {
  status: ToolStatus;
  unlock_reason?: string;        // cuando available o generated
  missing_for_unlock?: string[]; // cuando locked
}

export interface ToolkitUnlockState {
  buyer_persona: ToolUnlockInfo;
  lead_scoring: ToolUnlockInfo;
  sales_playbook: ToolUnlockInfo;
  brand_kit: ToolUnlockInfo;
  comms_guide: ToolUnlockInfo;
  customer_journey: ToolUnlockInfo;
}

export interface ToolkitUnlockInput {
  leads_count: number;          // leads en CRM (leads table + integration_entities deals)
  closed_deals_count: number;   // deals cerrados/ganados
  pitches_count: number;        // integration_insights tipo email_pitch
  active_customers_count: number; // Stripe subscriptions activas
  has_stripe: boolean;          // integration_connections provider='stripe' activa
  generated_tools: ToolType[];  // tools ya generadas (de founder_tool_cache)
}

// ── Función principal ─────────────────────────────────────────────────────────

export function computeToolkitUnlocks(input: ToolkitUnlockInput): ToolkitUnlockState {
  const isGenerated = (tool: ToolType) => input.generated_tools.includes(tool);
  const has_buyer_persona = isGenerated('buyer_persona');
  const has_brand_kit = isGenerated('brand_kit');

  // ── Buyer Persona: 1+ lead/deal en CRM ─────────────────────────────────────
  const buyerPersona: ToolUnlockInfo = isGenerated('buyer_persona')
    ? { status: 'generated', unlock_reason: 'Generado con datos de CRM' }
    : input.leads_count >= 1
      ? {
          status: 'available',
          unlock_reason: `${input.leads_count} contacto${input.leads_count !== 1 ? 's' : ''} en CRM`,
        }
      : {
          status: 'locked',
          missing_for_unlock: ['Añade al menos 1 lead o contacto en el CRM'],
        };

  // ── Lead Scoring: 5+ leads/deals ───────────────────────────────────────────
  const missingLeads = Math.max(0, 5 - input.leads_count);
  const leadScoring: ToolUnlockInfo = isGenerated('lead_scoring')
    ? { status: 'generated', unlock_reason: `Generado con ${input.leads_count} contactos` }
    : input.leads_count >= 5
      ? { status: 'available', unlock_reason: `${input.leads_count} contactos en CRM` }
      : {
          status: 'locked',
          missing_for_unlock: [
            `Necesitas ${missingLeads} contacto${missingLeads !== 1 ? 's' : ''} más en CRM (tienes ${input.leads_count})`,
          ],
        };

  // ── Sales Playbook: 1+ deal cerrado ────────────────────────────────────────
  const salesPlaybook: ToolUnlockInfo = isGenerated('sales_playbook')
    ? {
        status: 'generated',
        unlock_reason: `Generado con ${input.closed_deals_count} deal${input.closed_deals_count !== 1 ? 's' : ''} cerrado${input.closed_deals_count !== 1 ? 's' : ''}`,
      }
    : input.closed_deals_count >= 1
      ? {
          status: 'available',
          unlock_reason: `${input.closed_deals_count} deal${input.closed_deals_count !== 1 ? 's' : ''} cerrado${input.closed_deals_count !== 1 ? 's' : ''}`,
        }
      : {
          status: 'locked',
          missing_for_unlock: ['Cierra tu primer deal para desbloquear el Sales Playbook'],
        };

  // ── Brand Kit: buyer_persona generada + 1+ pitch ───────────────────────────
  const brandKitMissing: string[] = [];
  if (!has_buyer_persona) brandKitMissing.push('Genera la Buyer Persona primero');
  if (input.pitches_count < 1) brandKitMissing.push('Envía al menos 1 email pitch');

  const brandKit: ToolUnlockInfo = isGenerated('brand_kit')
    ? { status: 'generated', unlock_reason: 'Generado con Buyer Persona + pitches' }
    : has_buyer_persona && input.pitches_count >= 1
      ? {
          status: 'available',
          unlock_reason: `Buyer Persona lista · ${input.pitches_count} pitch${input.pitches_count !== 1 ? 'es' : ''} enviado${input.pitches_count !== 1 ? 's' : ''}`,
        }
      : { status: 'locked', missing_for_unlock: brandKitMissing };

  // ── Comms Guide: brand_kit generada + 2+ pitches ───────────────────────────
  const commsMissing: string[] = [];
  if (!has_brand_kit) commsMissing.push('Genera el Brand Kit primero');
  const pitchesLeft = Math.max(0, 2 - input.pitches_count);
  if (pitchesLeft > 0) commsMissing.push(`Envía ${pitchesLeft} pitch${pitchesLeft !== 1 ? 'es' : ''} más`);

  const commsGuide: ToolUnlockInfo = isGenerated('comms_guide')
    ? { status: 'generated', unlock_reason: 'Generado con Brand Kit + pitches' }
    : has_brand_kit && input.pitches_count >= 2
      ? {
          status: 'available',
          unlock_reason: `Brand Kit lista · ${input.pitches_count} pitches enviados`,
        }
      : { status: 'locked', missing_for_unlock: commsMissing };

  // ── Customer Journey: 10+ clientes activos O Stripe con datos ──────────────
  const customerJourneyUnlocked =
    input.active_customers_count >= 10 ||
    (input.has_stripe && input.active_customers_count >= 1);

  const journeyMissing: string[] = [];
  if (!input.has_stripe) {
    journeyMissing.push('Conecta Stripe para datos de clientes');
  } else if (input.active_customers_count < 10) {
    const left = 10 - input.active_customers_count;
    journeyMissing.push(
      `Necesitas ${left} cliente${left !== 1 ? 's' : ''} activo${left !== 1 ? 's' : ''} más en Stripe (tienes ${input.active_customers_count})`,
    );
  }

  const customerJourney: ToolUnlockInfo = isGenerated('customer_journey')
    ? { status: 'generated', unlock_reason: 'Generado con datos de Stripe' }
    : customerJourneyUnlocked
      ? {
          status: 'available',
          unlock_reason:
            input.active_customers_count >= 10
              ? `${input.active_customers_count} clientes activos en Stripe`
              : 'Stripe conectado con datos de clientes',
        }
      : { status: 'locked', missing_for_unlock: journeyMissing };

  return {
    buyer_persona: buyerPersona,
    lead_scoring: leadScoring,
    sales_playbook: salesPlaybook,
    brand_kit: brandKit,
    comms_guide: commsGuide,
    customer_journey: customerJourney,
  };
}
