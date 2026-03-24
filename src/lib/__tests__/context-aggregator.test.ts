import { describe, it, expect } from 'vitest';
import {
  REGENERATION_TRIGGERS,
  ContextAggregator,
  type ContextData,
  type RegenerationTrigger,
} from '../context-aggregator';

// ── REGENERATION_TRIGGERS (pure data, no DB) ─────────────────────────────────

describe('REGENERATION_TRIGGERS', () => {
  it('has 6 triggers', () => {
    expect(REGENERATION_TRIGGERS).toHaveLength(6);
  });

  it('each trigger has required fields', () => {
    for (const trigger of REGENERATION_TRIGGERS) {
      expect(trigger.id).toBeTruthy();
      expect(trigger.name).toBeTruthy();
      expect(trigger.description).toBeTruthy();
      expect(trigger.metric).toBeTruthy();
      expect(trigger.threshold).toBeGreaterThan(0);
      expect(trigger.artifact_type).toBeTruthy();
      expect(trigger.icon).toBeTruthy();
      expect(trigger.color).toBeTruthy();
    }
  });

  it('trigger IDs are unique', () => {
    const ids = REGENERATION_TRIGGERS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('trigger metrics reference valid ContextData keys', () => {
    const validKeys: Array<keyof ContextData> = [
      'project_id', 'customer_interviews', 'website_visitors',
      'deals_closed', 'revenue_months', 'competitor_changes',
      'validation_experiments', 'team_size', 'last_regeneration',
    ];
    for (const trigger of REGENERATION_TRIGGERS) {
      expect(validKeys).toContain(trigger.metric);
    }
  });

  it('has correct thresholds per trigger ID', () => {
    const thresholds: Record<string, number> = {
      'buyer-personas': 5,
      'value-proposition': 100,
      'sales-playbook': 10,
      'financial-projections': 3,
      'competitive-analysis': 5,
      'validation-insights': 3,
    };
    for (const trigger of REGENERATION_TRIGGERS) {
      expect(trigger.threshold).toBe(thresholds[trigger.id]);
    }
  });
});

// ── ContextAggregator constructor (no DB) ────────────────────────────────────

describe('ContextAggregator', () => {
  it('stores projectId', () => {
    const agg = new ContextAggregator('proj-123');
    expect(agg.projectId).toBe('proj-123');
  });

  it('has expected async methods', () => {
    const agg = new ContextAggregator('proj-123');
    expect(typeof agg.getContext).toBe('function');
    expect(typeof agg.updateContext).toBe('function');
    expect(typeof agg.incrementMetric).toBe('function');
    expect(typeof agg.getReadyTriggers).toBe('function');
    expect(typeof agg.getTriggerProgress).toBe('function');
    expect(typeof agg.checkTriggers).toBe('function');
    expect(typeof agg.markRegenerated).toBe('function');
    expect(typeof agg.getContextQualityScore).toBe('function');
  });
});
