import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computeReentryPayload,
  CHANGE_LABELS,
  CHANGE_PRIORITY,
  PHASE_LABEL,
  VIABILITY_LABEL,
  TREND_LABEL,
  BLOCK_LABEL,
  type ReentryPayload,
  type TriggerReason,
} from '../reentry';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function makeEngineData(overrides: Partial<Record<string, unknown>> = {}): ProjectEngineData {
  return {
    phaseState: {
      current_phase: 2,
      phase_score: 50,
      hard_signal_met: false,
      primary_block: null,
      ...(overrides.phaseState as object ?? {}),
    },
    risk: {
      risk_level: 'low',
      risk_status: 'insufficient_data',
      ...(overrides.risk as object ?? {}),
    },
    coverage: overrides.coverage ?? [],
    phaseHistory: overrides.phaseHistory ?? [],
    riskHistory: overrides.riskHistory ?? [],
    probabilityHistory: overrides.probabilityHistory ?? [],
    probability: overrides.probability ?? null,
    viability: overrides.viability ?? null,
    economicProfile: overrides.economicProfile ?? null,
    orgCapacity: overrides.orgCapacity ?? null,
  } as unknown as ProjectEngineData;
}

function baseParams(overrides: Partial<Parameters<typeof computeReentryPayload>[0]> = {}) {
  return {
    lastSeenAt: daysAgo(10),
    engineData: makeEngineData(),
    viabilityStatus: 'healthy',
    cycleClosedWhileAway: false,
    ritualMissed: false,
    nextActionTitle: null,
    nextActionDescription: null,
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('computeReentryPayload', () => {
  let dateSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    dateSpy?.mockRestore();
  });

  // -- triggerReason thresholds --
  it.each<[number, TriggerReason]>([
    [7, 'inactive_7d'],
    [13, 'inactive_7d'],
    [14, 'inactive_14d'],
    [20, 'inactive_14d'],
    [21, 'inactive_21d'],
    [59, 'inactive_21d'],
    [60, 'inactive_60d'],
    [100, 'inactive_60d'],
  ])('absence of %i days → triggerReason = %s', (days, expected) => {
    const result = computeReentryPayload(baseParams({ lastSeenAt: daysAgo(days) }));
    expect(result.triggerReason).toBe(expected);
  });

  // -- absenceDays calculation --
  it('calculates absenceDays correctly', () => {
    const result = computeReentryPayload(baseParams({ lastSeenAt: daysAgo(15) }));
    expect(result.absenceDays).toBe(15);
  });

  // -- currentState defaults --
  it('returns currentState with defaults when engine data is minimal', () => {
    const result = computeReentryPayload(baseParams());
    expect(result.currentState.phase).toBe(2);
    expect(result.currentState.phaseScore).toBe(50);
    expect(result.currentState.riskLevel).toBe('low');
    expect(result.currentState.viabilityStatus).toBe('healthy');
    expect(result.currentState.probabilityTrend).toBe('stable');
    // With empty coverage, demand defaults to 'none' → clarity_block
    expect(result.currentState.primaryBlock).toBe('clarity_block');
  });

  // -- probabilityTrend --
  it('returns growing when latest score > previous by >5', () => {
    const engineData = makeEngineData({
      probabilityHistory: [
        { probability_score: 80 },
        { probability_score: 70 },
      ],
    });
    const result = computeReentryPayload(baseParams({ engineData }));
    expect(result.currentState.probabilityTrend).toBe('growing');
  });

  it('returns declining when latest score < previous by >5', () => {
    const engineData = makeEngineData({
      probabilityHistory: [
        { probability_score: 40 },
        { probability_score: 70 },
      ],
    });
    const result = computeReentryPayload(baseParams({ engineData }));
    expect(result.currentState.probabilityTrend).toBe('declining');
  });

  it('returns stable when delta ≤ 5', () => {
    const engineData = makeEngineData({
      probabilityHistory: [
        { probability_score: 72 },
        { probability_score: 70 },
      ],
    });
    const result = computeReentryPayload(baseParams({ engineData }));
    expect(result.currentState.probabilityTrend).toBe('stable');
  });

  it('returns stable with <2 history entries', () => {
    const engineData = makeEngineData({
      probabilityHistory: [{ probability_score: 80 }],
    });
    const result = computeReentryPayload(baseParams({ engineData }));
    expect(result.currentState.probabilityTrend).toBe('stable');
  });

  // -- primaryBlock derivation --
  it('reads primary_block from phaseState SQL when available', () => {
    const engineData = makeEngineData({
      phaseState: { primary_block: 'clarity_block' },
    });
    const result = computeReentryPayload(baseParams({ engineData }));
    expect(result.currentState.primaryBlock).toBe('clarity_block');
  });

  it('falls back to client-side block derivation: traction_block for critical risk', () => {
    const engineData = makeEngineData({
      risk: { risk_level: 'critical', risk_status: 'active' },
    });
    const result = computeReentryPayload(baseParams({ engineData }));
    expect(result.currentState.primaryBlock).toBe('traction_block');
  });

  it('derives clarity_block when demand is none', () => {
    const engineData = makeEngineData({
      coverage: [{ function_type: 'demand', coverage_level: 'none' }],
    });
    const result = computeReentryPayload(baseParams({ engineData }));
    expect(result.currentState.primaryBlock).toBe('clarity_block');
  });

  it('derives structural_block when delivery is basic', () => {
    const engineData = makeEngineData({
      coverage: [
        { function_type: 'demand', coverage_level: 'solid' },
        { function_type: 'delivery', coverage_level: 'basic' },
      ],
    });
    const result = computeReentryPayload(baseParams({ engineData }));
    expect(result.currentState.primaryBlock).toBe('structural_block');
  });

  // -- changes computation --
  it('detects phaseChanged when phase differs from baseline', () => {
    const engineData = makeEngineData({
      phaseHistory: [
        { phase: 3, calculated_at: daysAgo(5), change_reason: 'progression' },
        { phase: 2, calculated_at: daysAgo(15), change_reason: 'initial' },
      ],
    });
    const result = computeReentryPayload(baseParams({
      lastSeenAt: daysAgo(10),
      engineData,
    }));
    expect(result.changes.phaseChanged).toBe(true);
    expect(result.changes.phaseRegressed).toBe(false);
  });

  it('detects phaseRegressed when phase went down', () => {
    const engineData = makeEngineData({
      phaseHistory: [
        { phase: 1, calculated_at: daysAgo(5), change_reason: 'regression' },
        { phase: 2, calculated_at: daysAgo(15), change_reason: 'initial' },
      ],
    });
    const result = computeReentryPayload(baseParams({
      lastSeenAt: daysAgo(10),
      engineData,
    }));
    expect(result.changes.phaseRegressed).toBe(true);
  });

  it('detects riskWorsened when risk level increased', () => {
    const engineData = makeEngineData({
      riskHistory: [
        { risk_level: 'high', calculated_at: daysAgo(3) },
        { risk_level: 'low', calculated_at: daysAgo(15) },
      ],
    });
    const result = computeReentryPayload(baseParams({
      lastSeenAt: daysAgo(10),
      engineData,
    }));
    expect(result.changes.riskWorsened).toBe(true);
  });

  it('viabilityWorsened is true when status is not healthy', () => {
    const result = computeReentryPayload(baseParams({ viabilityStatus: 'stagnation' }));
    expect(result.changes.viabilityWorsened).toBe(true);
  });

  it('viabilityWorsened is false when status is healthy', () => {
    const result = computeReentryPayload(baseParams({ viabilityStatus: 'healthy' }));
    expect(result.changes.viabilityWorsened).toBe(false);
  });

  it('passes cycleClosedWhileAway and ritualMissed through', () => {
    const result = computeReentryPayload(baseParams({
      cycleClosedWhileAway: true,
      ritualMissed: true,
    }));
    expect(result.changes.cycleClosedWhileAway).toBe(true);
    expect(result.changes.ritualMissed).toBe(true);
  });

  // -- urgencies --
  it('returns critical urgency for critical viability', () => {
    const result = computeReentryPayload(baseParams({ viabilityStatus: 'critical' }));
    expect(result.urgencies.some(u => u.type === 'viability' && u.severity === 'critical')).toBe(true);
  });

  it('returns critical urgency for critical active risk', () => {
    const engineData = makeEngineData({
      risk: { risk_level: 'critical', risk_status: 'active' },
    });
    const result = computeReentryPayload(baseParams({ engineData }));
    expect(result.urgencies.some(u => u.type === 'risk' && u.severity === 'critical')).toBe(true);
  });

  it('returns high urgency for ritualMissed', () => {
    const result = computeReentryPayload(baseParams({ ritualMissed: true }));
    expect(result.urgencies.some(u => u.type === 'ritual' && u.severity === 'high')).toBe(true);
  });

  it('returns medium urgency for stagnation viability', () => {
    const result = computeReentryPayload(baseParams({ viabilityStatus: 'stagnation' }));
    expect(result.urgencies.some(u => u.severity === 'medium')).toBe(true);
  });

  it('limits urgencies to max 3 sorted by severity', () => {
    const engineData = makeEngineData({
      risk: { risk_level: 'critical', risk_status: 'active' },
    });
    const result = computeReentryPayload(baseParams({
      engineData,
      viabilityStatus: 'critical',
      ritualMissed: true,
    }));
    expect(result.urgencies.length).toBeLessThanOrEqual(3);
    // Should be sorted: critical first
    if (result.urgencies.length > 1) {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      for (let i = 1; i < result.urgencies.length; i++) {
        expect(severityOrder[result.urgencies[i].severity])
          .toBeGreaterThanOrEqual(severityOrder[result.urgencies[i - 1].severity]);
      }
    }
  });

  it('returns empty urgencies when everything is healthy', () => {
    const result = computeReentryPayload(baseParams());
    expect(result.urgencies).toEqual([]);
  });

  // -- headlines --
  it('headline for 60+ days absence', () => {
    const result = computeReentryPayload(baseParams({ lastSeenAt: daysAgo(65) }));
    expect(result.resume.headline).toContain('60 días');
  });

  it('headline for critical state', () => {
    const result = computeReentryPayload(baseParams({ viabilityStatus: 'critical' }));
    expect(result.resume.headline).toContain('crítico');
  });

  it('headline for worsened stability', () => {
    const engineData = makeEngineData({
      riskHistory: [
        { risk_level: 'high', calculated_at: daysAgo(3) },
        { risk_level: 'low', calculated_at: daysAgo(15) },
      ],
    });
    const result = computeReentryPayload(baseParams({
      lastSeenAt: daysAgo(10),
      engineData,
      viabilityStatus: 'monitoring',
    }));
    expect(result.resume.headline).toContain('estabilidad');
  });

  it('headline for cycle closed while away', () => {
    const result = computeReentryPayload(baseParams({ cycleClosedWhileAway: true }));
    expect(result.resume.headline).toContain('revisión estratégica');
  });

  it('default headline when nothing special', () => {
    const result = computeReentryPayload(baseParams());
    expect(result.resume.headline).toContain('Te ponemos al día');
  });

  // -- resume fields --
  it('uses nextActionTitle when provided', () => {
    const result = computeReentryPayload(baseParams({
      nextActionTitle: 'Custom action',
      nextActionDescription: 'Custom desc',
    }));
    expect(result.resume.recommendedAction).toBe('Custom action');
    expect(result.resume.signalBasis).toBe('Custom desc');
  });

  it('uses default recommendedAction when nextActionTitle is null', () => {
    const result = computeReentryPayload(baseParams());
    expect(result.resume.recommendedAction).toBe('Revisa el estado actual del proyecto');
    expect(result.resume.signalBasis).toBe('');
  });
});

// -- Label maps completeness --
describe('label maps', () => {
  it('CHANGE_LABELS covers all CHANGE_PRIORITY keys', () => {
    for (const key of CHANGE_PRIORITY) {
      expect(CHANGE_LABELS[key]).toBeDefined();
    }
  });

  it('PHASE_LABEL covers phases 1–4', () => {
    expect(Object.keys(PHASE_LABEL)).toHaveLength(4);
    expect(PHASE_LABEL[1]).toBeDefined();
    expect(PHASE_LABEL[4]).toBeDefined();
  });

  it('VIABILITY_LABEL covers 4 states', () => {
    expect(VIABILITY_LABEL['healthy']).toBeDefined();
    expect(VIABILITY_LABEL['critical']).toBeDefined();
    expect(VIABILITY_LABEL['monitoring']).toBeDefined();
    expect(VIABILITY_LABEL['stagnation']).toBeDefined();
  });

  it('TREND_LABEL covers 3 states', () => {
    expect(TREND_LABEL['growing']).toBeDefined();
    expect(TREND_LABEL['stable']).toBeDefined();
    expect(TREND_LABEL['declining']).toBeDefined();
  });

  it('BLOCK_LABEL covers all blocks including none', () => {
    expect(BLOCK_LABEL['clarity_block']).toBeDefined();
    expect(BLOCK_LABEL['traction_block']).toBeDefined();
    expect(BLOCK_LABEL['structural_block']).toBeDefined();
    expect(BLOCK_LABEL['none']).toBe('');
  });
});
