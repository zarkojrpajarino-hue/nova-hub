/**
 * V4.7.2 — Tests for computeEngineDelta (src/lib/engine-delta.ts)
 *
 * 5 metrics x 4 directions (up/down/stable/new) + isBusinessImprovement + narratives.
 */

import { describe, it, expect } from 'vitest';
import {
  computeEngineDelta,
  type EngineSnapshot,
  type EngineDeltaItem,
} from '../engine-delta';

const basePre: EngineSnapshot = {
  probability: { value: 50, status: 'active' },
  phase: { current_phase: 2, phase_score: 60 },
  risk: { level: 'medium', score: 40 },
  economic_profile: { mrr: 1000, runway_months: 12 },
};

const basePost: EngineSnapshot = {
  probability: { value: 70, status: 'active' },
  phase: { current_phase: 2, phase_score: 75 },
  risk: { level: 'low', score: 30 },
  economic_profile: { mrr: 1500, runway_months: 14 },
};

function findMetric(items: EngineDeltaItem[], metric: string) {
  return items.find((i) => i.metric === metric)!;
}

describe('computeEngineDelta', () => {
  // ── Direction: up ──────────────────────────────────────────────
  it('detects "up" direction when value increases', () => {
    const items = computeEngineDelta(basePre, basePost);
    expect(findMetric(items, 'probability.value').direction).toBe('up');
    expect(findMetric(items, 'phase.phase_score').direction).toBe('up');
    expect(findMetric(items, 'economic_profile.mrr').direction).toBe('up');
    expect(findMetric(items, 'economic_profile.runway_months').direction).toBe('up');
  });

  // ── Direction: down ────────────────────────────────────────────
  it('detects "down" direction when value decreases', () => {
    const post: EngineSnapshot = {
      ...basePost,
      probability: { value: 30, status: 'active' },
      phase: { current_phase: 2, phase_score: 40 },
      risk: { level: 'high', score: 60 },
      economic_profile: { mrr: 500, runway_months: 6 },
    };
    const items = computeEngineDelta(basePre, post);
    expect(findMetric(items, 'probability.value').direction).toBe('down');
    expect(findMetric(items, 'phase.phase_score').direction).toBe('down');
    expect(findMetric(items, 'risk.score').direction).toBe('up'); // 40→60 is up numerically
    expect(findMetric(items, 'economic_profile.mrr').direction).toBe('down');
    expect(findMetric(items, 'economic_profile.runway_months').direction).toBe('down');
  });

  // ── Direction: unchanged ───────────────────────────────────────
  it('detects "unchanged" when values are identical', () => {
    const items = computeEngineDelta(basePre, basePre);
    expect(findMetric(items, 'probability.value').direction).toBe('unchanged');
    expect(findMetric(items, 'phase.phase_score').direction).toBe('unchanged');
    expect(findMetric(items, 'risk.score').direction).toBe('unchanged');
    expect(findMetric(items, 'economic_profile.mrr').direction).toBe('unchanged');
    expect(findMetric(items, 'economic_profile.runway_months').direction).toBe('unchanged');
  });

  // ── Direction: new (pre is null) ───────────────────────────────
  it('detects "new" direction when pre is null (first calc)', () => {
    const items = computeEngineDelta(null, basePost);
    items.forEach((item) => {
      expect(item.direction).toBe('new');
      expect(item.before).toBeNull();
    });
  });

  // ── isBusinessImprovement ──────────────────────────────────────
  it('marks isBusinessImprovement=true only for MRR increase', () => {
    const items = computeEngineDelta(basePre, basePost);
    const mrr = findMetric(items, 'economic_profile.mrr');
    expect(mrr.isBusinessImprovement).toBe(true);

    // Other metrics should NOT be business improvement
    const prob = findMetric(items, 'probability.value');
    expect(prob.isBusinessImprovement).toBe(false);
  });

  it('isBusinessImprovement=false when MRR decreases', () => {
    const post: EngineSnapshot = {
      ...basePost,
      economic_profile: { mrr: 500, runway_months: 10 },
    };
    const items = computeEngineDelta(basePre, post);
    expect(findMetric(items, 'economic_profile.mrr').isBusinessImprovement).toBe(false);
  });

  it('isBusinessImprovement=false when pre is null (first calc)', () => {
    const items = computeEngineDelta(null, basePost);
    expect(findMetric(items, 'economic_profile.mrr').isBusinessImprovement).toBe(false);
  });

  // ── Narratives ─────────────────────────────────────────────────
  it('generates MRR growth narrative when isBusinessImprovement', () => {
    const items = computeEngineDelta(basePre, basePost);
    const mrr = findMetric(items, 'economic_profile.mrr');
    expect(mrr.narrative).toContain('MRR creció');
    expect(mrr.narrative).toContain('1000');
    expect(mrr.narrative).toContain('1500');
  });

  it('generates "first time" narrative for new metrics', () => {
    const items = computeEngineDelta(null, basePost);
    const prob = findMetric(items, 'probability.value');
    expect(prob.narrative).toContain('primera vez');
    expect(prob.narrative).toContain('70');
  });

  it('generates "pasó de X a Y" narrative for normal changes', () => {
    const post: EngineSnapshot = {
      ...basePost,
      probability: { value: 30, status: 'active' },
    };
    const items = computeEngineDelta(basePre, post);
    const prob = findMetric(items, 'probability.value');
    expect(prob.narrative).toContain('pasó de');
    expect(prob.narrative).toContain('50');
    expect(prob.narrative).toContain('30');
  });

  // ── Always returns 5 metrics ───────────────────────────────────
  it('always returns exactly 5 metric items', () => {
    const items1 = computeEngineDelta(basePre, basePost);
    expect(items1).toHaveLength(5);

    const items2 = computeEngineDelta(null, basePost);
    expect(items2).toHaveLength(5);
  });

  // ── Risk score up = numerically up (not business improvement) ──
  it('risk score going up is direction "up" even though worse', () => {
    const post: EngineSnapshot = {
      ...basePre,
      risk: { level: 'high', score: 80 },
    };
    const items = computeEngineDelta(basePre, post);
    const risk = findMetric(items, 'risk.score');
    expect(risk.direction).toBe('up');
    expect(risk.isBusinessImprovement).toBe(false);
  });

  // ── Handles null values in snapshot fields ─────────────────────
  it('handles null probability value gracefully', () => {
    const pre: EngineSnapshot = {
      ...basePre,
      probability: { value: null, status: 'inactive' },
    };
    const post: EngineSnapshot = {
      ...basePost,
      probability: { value: 50, status: 'active' },
    };
    const items = computeEngineDelta(pre, post);
    const prob = findMetric(items, 'probability.value');
    expect(prob.direction).toBe('new');
    expect(prob.before).toBeNull();
    expect(prob.after).toBe(50);
  });
});
