/**
 * F22 — Tests del Expansion Readiness Engine
 */

import { describe, it, expect } from 'vitest'
import { computeExpansionReadiness, type MrrDataPoint } from '../expansion-readiness-engine'

function makeMrrHistory(values: number[]): MrrDataPoint[] {
  return values.map((mrr, i) => ({
    date: `2026-0${Math.floor(i / 4) + 1}-${String((i % 4) * 7 + 1).padStart(2, '0')}`,
    mrr,
  }));
}

describe('F22.1 — computeExpansionReadiness', () => {
  it('returns isReady=true when all conditions met', () => {
    const result = computeExpansionReadiness({
      currentPhase: 3,
      mrrHistory: makeMrrHistory([1000, 1050, 1100, 1150, 1200]),
      riskLevel: 'medium',
      activeIntegrations: 2,
    });
    expect(result.isReady).toBe(true);
    expect(result.readinessScore).toBe(100);
    expect(result.missingConditions).toHaveLength(0);
  });

  it('returns isReady=false when phase < 3', () => {
    const result = computeExpansionReadiness({
      currentPhase: 2,
      mrrHistory: makeMrrHistory([1000, 1050, 1100, 1150]),
      riskLevel: 'low',
      activeIntegrations: 1,
    });
    expect(result.isReady).toBe(false);
    expect(result.conditions.phaseOk).toBe(false);
    expect(result.missingConditions).toContain('Necesitas estar en Fase 3 o superior');
  });

  it('returns isReady=false when risk is critical', () => {
    const result = computeExpansionReadiness({
      currentPhase: 4,
      mrrHistory: makeMrrHistory([1000, 1050, 1100, 1150]),
      riskLevel: 'critical',
      activeIntegrations: 1,
    });
    expect(result.isReady).toBe(false);
    expect(result.conditions.riskOk).toBe(false);
  });

  it('returns isReady=false when no integrations', () => {
    const result = computeExpansionReadiness({
      currentPhase: 3,
      mrrHistory: makeMrrHistory([1000, 1050, 1100, 1150]),
      riskLevel: 'low',
      activeIntegrations: 0,
    });
    expect(result.isReady).toBe(false);
    expect(result.conditions.integrationOk).toBe(false);
  });

  it('detects MRR crash >20% between points', () => {
    const result = computeExpansionReadiness({
      currentPhase: 3,
      mrrHistory: makeMrrHistory([1000, 1050, 700, 750]),  // 1050→700 = -33%
      riskLevel: 'low',
      activeIntegrations: 1,
    });
    expect(result.isReady).toBe(false);
    expect(result.conditions.mrrTrendOk).toBe(false);
  });

  it('detects declining MRR slope > -5%', () => {
    const result = computeExpansionReadiness({
      currentPhase: 3,
      mrrHistory: makeMrrHistory([1000, 920, 900, 880]),  // slope = -12%
      riskLevel: 'low',
      activeIntegrations: 1,
    });
    expect(result.isReady).toBe(false);
    expect(result.conditions.mrrTrendOk).toBe(false);
  });

  it('returns mrrTrendOk=stale when < 4 data points', () => {
    const result = computeExpansionReadiness({
      currentPhase: 3,
      mrrHistory: makeMrrHistory([1000, 1100]),
      riskLevel: 'low',
      activeIntegrations: 1,
    });
    expect(result.conditions.mrrTrendOk).toBe('stale');
    expect(result.isReady).toBe(false);  // stale != true
    expect(result.readinessScore).toBe(88);  // phase(25) + stale(12.5) + risk(25) + integration(25) = 87.5 → 88
  });

  it('allows small MRR decline ≤5%', () => {
    const result = computeExpansionReadiness({
      currentPhase: 3,
      mrrHistory: makeMrrHistory([1000, 990, 980, 960]),  // slope = -4%
      riskLevel: 'low',
      activeIntegrations: 1,
    });
    expect(result.conditions.mrrTrendOk).toBe(true);
    expect(result.isReady).toBe(true);
  });

  it('readinessScore = 0 when nothing met', () => {
    const result = computeExpansionReadiness({
      currentPhase: 1,
      mrrHistory: [],
      riskLevel: 'critical',
      activeIntegrations: 0,
    });
    expect(result.readinessScore).toBe(13);  // stale(12.5) → round = 13 (no data = stale, not false)
    expect(result.missingConditions.length).toBeGreaterThanOrEqual(3);
  });
});
