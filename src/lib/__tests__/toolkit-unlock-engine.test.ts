/**
 * V4.7.6 — Tests for computeToolkitUnlocks (src/lib/toolkit-unlock-engine.ts)
 *
 * Tests all 6 tools x 3 states (locked/available/generated) + edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  computeToolkitUnlocks,
  type ToolkitUnlockInput,
  type ToolkitUnlockState,
  type ToolType,
} from '../toolkit-unlock-engine';

const BASE_INPUT: ToolkitUnlockInput = {
  leads_count: 0,
  closed_deals_count: 0,
  pitches_count: 0,
  active_customers_count: 0,
  has_stripe: false,
  generated_tools: [],
};

describe('computeToolkitUnlocks', () => {
  // ── Buyer Persona ──────────────────────────────────────────────

  describe('buyer_persona', () => {
    it('locked when leads_count is 0', () => {
      const result = computeToolkitUnlocks(BASE_INPUT);
      expect(result.buyer_persona.status).toBe('locked');
      expect(result.buyer_persona.missing_for_unlock).toHaveLength(1);
    });

    it('available when leads_count >= 1', () => {
      const result = computeToolkitUnlocks({ ...BASE_INPUT, leads_count: 1 });
      expect(result.buyer_persona.status).toBe('available');
      expect(result.buyer_persona.unlock_reason).toContain('1 contacto');
    });

    it('uses plural for multiple leads', () => {
      const result = computeToolkitUnlocks({ ...BASE_INPUT, leads_count: 5 });
      expect(result.buyer_persona.unlock_reason).toContain('5 contactos');
    });

    it('generated when in generated_tools', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        leads_count: 3,
        generated_tools: ['buyer_persona'],
      });
      expect(result.buyer_persona.status).toBe('generated');
    });
  });

  // ── Lead Scoring ───────────────────────────────────────────────

  describe('lead_scoring', () => {
    it('locked when leads_count < 5', () => {
      const result = computeToolkitUnlocks({ ...BASE_INPUT, leads_count: 3 });
      expect(result.lead_scoring.status).toBe('locked');
      expect(result.lead_scoring.missing_for_unlock![0]).toContain('2 contactos más');
    });

    it('available when leads_count >= 5', () => {
      const result = computeToolkitUnlocks({ ...BASE_INPUT, leads_count: 5 });
      expect(result.lead_scoring.status).toBe('available');
    });

    it('generated when in generated_tools', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        leads_count: 10,
        generated_tools: ['lead_scoring'],
      });
      expect(result.lead_scoring.status).toBe('generated');
    });

    it('shows singular "contacto" when missing 1', () => {
      const result = computeToolkitUnlocks({ ...BASE_INPUT, leads_count: 4 });
      expect(result.lead_scoring.missing_for_unlock![0]).toContain('1 contacto más');
      expect(result.lead_scoring.missing_for_unlock![0]).not.toContain('1 contactos');
    });
  });

  // ── Sales Playbook ─────────────────────────────────────────────

  describe('sales_playbook', () => {
    it('locked when no closed deals', () => {
      const result = computeToolkitUnlocks(BASE_INPUT);
      expect(result.sales_playbook.status).toBe('locked');
      expect(result.sales_playbook.missing_for_unlock![0]).toContain('primer deal');
    });

    it('available when closed_deals_count >= 1', () => {
      const result = computeToolkitUnlocks({ ...BASE_INPUT, closed_deals_count: 1 });
      expect(result.sales_playbook.status).toBe('available');
      expect(result.sales_playbook.unlock_reason).toContain('1 deal cerrado');
    });

    it('uses plural for multiple deals', () => {
      const result = computeToolkitUnlocks({ ...BASE_INPUT, closed_deals_count: 3 });
      expect(result.sales_playbook.unlock_reason).toContain('3 deals cerrados');
    });

    it('generated overrides available', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        closed_deals_count: 5,
        generated_tools: ['sales_playbook'],
      });
      expect(result.sales_playbook.status).toBe('generated');
    });
  });

  // ── Brand Kit ──────────────────────────────────────────────────

  describe('brand_kit', () => {
    it('locked when buyer_persona not generated and no pitches', () => {
      const result = computeToolkitUnlocks(BASE_INPUT);
      expect(result.brand_kit.status).toBe('locked');
      expect(result.brand_kit.missing_for_unlock).toHaveLength(2);
    });

    it('locked when buyer_persona generated but no pitches', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        generated_tools: ['buyer_persona'],
      });
      expect(result.brand_kit.status).toBe('locked');
      expect(result.brand_kit.missing_for_unlock).toHaveLength(1);
      expect(result.brand_kit.missing_for_unlock![0]).toContain('pitch');
    });

    it('locked when pitches exist but no buyer_persona', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        pitches_count: 2,
      });
      expect(result.brand_kit.status).toBe('locked');
      expect(result.brand_kit.missing_for_unlock![0]).toContain('Buyer Persona');
    });

    it('available when buyer_persona generated and pitches >= 1', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        generated_tools: ['buyer_persona'],
        pitches_count: 1,
      });
      expect(result.brand_kit.status).toBe('available');
      expect(result.brand_kit.unlock_reason).toContain('Buyer Persona');
    });

    it('generated overrides available', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        generated_tools: ['buyer_persona', 'brand_kit'],
        pitches_count: 2,
      });
      expect(result.brand_kit.status).toBe('generated');
    });
  });

  // ── Comms Guide ────────────────────────────────────────────────

  describe('comms_guide', () => {
    it('locked when brand_kit not generated and pitches < 2', () => {
      const result = computeToolkitUnlocks(BASE_INPUT);
      expect(result.comms_guide.status).toBe('locked');
      expect(result.comms_guide.missing_for_unlock!.length).toBeGreaterThanOrEqual(1);
    });

    it('locked when brand_kit generated but pitches < 2', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        generated_tools: ['buyer_persona', 'brand_kit'],
        pitches_count: 1,
      });
      expect(result.comms_guide.status).toBe('locked');
      expect(result.comms_guide.missing_for_unlock![0]).toContain('1 pitch más');
    });

    it('available when brand_kit generated and pitches >= 2', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        generated_tools: ['buyer_persona', 'brand_kit'],
        pitches_count: 2,
      });
      expect(result.comms_guide.status).toBe('available');
    });

    it('generated overrides available', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        generated_tools: ['buyer_persona', 'brand_kit', 'comms_guide'],
        pitches_count: 5,
      });
      expect(result.comms_guide.status).toBe('generated');
    });
  });

  // ── Customer Journey ───────────────────────────────────────────

  describe('customer_journey', () => {
    it('locked when no Stripe and < 10 customers', () => {
      const result = computeToolkitUnlocks(BASE_INPUT);
      expect(result.customer_journey.status).toBe('locked');
      expect(result.customer_journey.missing_for_unlock![0]).toContain('Conecta Stripe');
    });

    it('locked when Stripe connected but < 10 customers and showing missing count', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        has_stripe: true,
        active_customers_count: 0,
      });
      // has_stripe=true + active_customers>=1 is the alternate unlock
      // but 0 customers means locked
      expect(result.customer_journey.status).toBe('locked');
    });

    it('available when Stripe connected and active_customers >= 1', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        has_stripe: true,
        active_customers_count: 1,
      });
      expect(result.customer_journey.status).toBe('available');
      expect(result.customer_journey.unlock_reason).toContain('Stripe conectado');
    });

    it('available when active_customers >= 10 even without Stripe', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        has_stripe: false,
        active_customers_count: 10,
      });
      expect(result.customer_journey.status).toBe('available');
      expect(result.customer_journey.unlock_reason).toContain('10 clientes activos');
    });

    it('shows correct missing count with Stripe', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        has_stripe: true,
        active_customers_count: 0,
      });
      expect(result.customer_journey.missing_for_unlock![0]).toContain('10 clientes activos más');
    });

    it('generated overrides available', () => {
      const result = computeToolkitUnlocks({
        ...BASE_INPUT,
        has_stripe: true,
        active_customers_count: 15,
        generated_tools: ['customer_journey'],
      });
      expect(result.customer_journey.status).toBe('generated');
    });
  });

  // ── Full chain: all locked ─────────────────────────────────────

  it('all tools locked with empty input', () => {
    const result = computeToolkitUnlocks(BASE_INPUT);
    const tools: ToolType[] = ['buyer_persona', 'lead_scoring', 'sales_playbook', 'brand_kit', 'comms_guide', 'customer_journey'];
    for (const tool of tools) {
      expect(result[tool].status).toBe('locked');
    }
  });

  // ── Full chain: all generated ──────────────────────────────────

  it('all tools generated when in generated_tools', () => {
    const allTools: ToolType[] = ['buyer_persona', 'lead_scoring', 'sales_playbook', 'brand_kit', 'comms_guide', 'customer_journey'];
    const result = computeToolkitUnlocks({
      leads_count: 20,
      closed_deals_count: 5,
      pitches_count: 10,
      active_customers_count: 15,
      has_stripe: true,
      generated_tools: allTools,
    });
    for (const tool of allTools) {
      expect(result[tool].status).toBe('generated');
    }
  });
});
