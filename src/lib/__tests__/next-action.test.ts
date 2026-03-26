/**
 * V4.7.1 — Tests for getNextAction (src/lib/next-action.ts)
 *
 * 12+ branches: null input, critical risk, high risk phase 3+,
 * phase 0, phase 1 (2 branches), phase 2 (3 branches),
 * phase 3 (2 branches), phase 4 (4 branches), fallback null.
 */

import { describe, it, expect } from 'vitest';
import { getNextAction, type NextAction } from '../next-action';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

// Helper to build minimal engine data
function makeEngineData(overrides: {
  phase?: number;
  phaseScore?: number;
  hardSignalMet?: boolean;
  riskStatus?: string;
  riskLevel?: string;
  probStatus?: string;
  coverage?: Array<{ function_type: string; coverage_level: string }>;
  revenueInput?: number;
  consecutiveLowScore?: number;
}): ProjectEngineData {
  return {
    phaseState: {
      current_phase: overrides.phase ?? 1,
      phase_score: overrides.phaseScore ?? 50,
      hard_signal_met: overrides.hardSignalMet ?? false,
      consecutive_low_score: overrides.consecutiveLowScore ?? 0,
    },
    risk: {
      risk_status: overrides.riskStatus ?? 'insufficient_data',
      risk_level: overrides.riskLevel ?? 'low',
    },
    probability: {
      probability_status: overrides.probStatus ?? 'inactive',
      revenue_momentum_input: overrides.revenueInput ?? 60,
    },
    coverage: overrides.coverage ?? [],
  } as unknown as ProjectEngineData;
}

describe('getNextAction', () => {
  // ── Null / undefined input ─────────────────────────────────────
  it('returns null for null engineData', () => {
    expect(getNextAction(null)).toBeNull();
  });

  it('returns null for undefined engineData', () => {
    expect(getNextAction(undefined)).toBeNull();
  });

  // ── 1. Critical risk — blocks all phases ──────────────────────
  it('returns critical risk action regardless of phase', () => {
    const result = getNextAction(
      makeEngineData({ phase: 2, riskStatus: 'active', riskLevel: 'critical' }),
    );
    expect(result).not.toBeNull();
    expect(result!.title).toContain('riesgo crítico');
    expect(result!.actionType).toBeUndefined();
  });

  it('returns critical risk action even in phase 1', () => {
    const result = getNextAction(
      makeEngineData({ phase: 1, riskStatus: 'active', riskLevel: 'critical' }),
    );
    expect(result!.title).toContain('riesgo crítico');
  });

  // ── 2. High risk — only blocks phase 3+ ──────────────────────
  it('returns high risk action in phase 3', () => {
    const result = getNextAction(
      makeEngineData({ phase: 3, riskStatus: 'active', riskLevel: 'high' }),
    );
    expect(result!.title).toContain('riesgo principal');
  });

  it('does NOT block for high risk in phase 2', () => {
    const result = getNextAction(
      makeEngineData({ phase: 2, riskStatus: 'active', riskLevel: 'high' }),
    );
    // Should fall through to phase 2 logic, not risk block
    expect(result?.title).not.toContain('riesgo principal');
  });

  // ── Phase 0 ────────────────────────────────────────────────────
  it('returns exploration action for phase 0', () => {
    const result = getNextAction(makeEngineData({ phase: 0 }));
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Explora ideas');
    expect(result!.actionType).toBe('create_task');
    expect(result!.ctaLabel).toBe('Ver tareas');
  });

  // ── Phase 1 ────────────────────────────────────────────────────
  it('phase 1: returns create_obv when hardSignal not met', () => {
    const result = getNextAction(
      makeEngineData({ phase: 1, hardSignalMet: false }),
    );
    expect(result!.actionType).toBe('create_obv');
    expect(result!.title).toContain('Valida el problema');
  });

  it('phase 1: returns create_obv when demand is weak even if hardSignal met', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 1,
        hardSignalMet: true,
        coverage: [{ function_type: 'demand', coverage_level: 'basic' }],
      }),
    );
    expect(result!.actionType).toBe('create_obv');
  });

  it('phase 1: returns null when hardSignal met and demand strong', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 1,
        hardSignalMet: true,
        coverage: [{ function_type: 'demand', coverage_level: 'strong' }],
      }),
    );
    expect(result).toBeNull();
  });

  // ── Phase 2 — 3 branches ──────────────────────────────────────
  it('phase 2: returns create_obv when no hardSignal and demand weak', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 2,
        hardSignalMet: false,
        coverage: [{ function_type: 'demand', coverage_level: 'none' }],
      }),
    );
    expect(result!.actionType).toBe('create_obv');
    expect(result!.title).toContain('demanda');
  });

  it('phase 2: returns define_channel when demand weak + hardSignal + score >= 70', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 2,
        hardSignalMet: true,
        phaseScore: 75,
        coverage: [{ function_type: 'demand', coverage_level: 'basic' }],
      }),
    );
    expect(result!.actionType).toBe('define_channel');
    expect(result!.ctaLabel).toBe('Ir al canal');
  });

  it('phase 2: returns add_metrics when demand ok + prob inactive', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 2,
        hardSignalMet: true,
        phaseScore: 75,
        probStatus: 'inactive',
        coverage: [{ function_type: 'demand', coverage_level: 'strong' }],
      }),
    );
    expect(result!.actionType).toBe('add_metrics');
    expect(result!.title).toContain('métricas');
  });

  it('phase 2: returns add_metrics when demand ok + prob low_confidence', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 2,
        probStatus: 'low_confidence',
        coverage: [{ function_type: 'demand', coverage_level: 'strong' }],
      }),
    );
    expect(result!.actionType).toBe('add_metrics');
  });

  it('phase 2: returns null when all conditions satisfied', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 2,
        hardSignalMet: true,
        phaseScore: 80,
        probStatus: 'active',
        coverage: [{ function_type: 'demand', coverage_level: 'strong' }],
      }),
    );
    expect(result).toBeNull();
  });

  // ── Phase 3 — 2 branches ──────────────────────────────────────
  it('phase 3: returns create_obv when opsWeak (delivery none)', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 3,
        coverage: [
          { function_type: 'delivery', coverage_level: 'none' },
          { function_type: 'cash', coverage_level: 'strong' },
        ],
      }),
    );
    expect(result!.actionType).toBe('create_obv');
    expect(result!.title).toContain('operación');
  });

  it('phase 3: returns create_obv when opsWeak (cash basic)', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 3,
        coverage: [
          { function_type: 'delivery', coverage_level: 'strong' },
          { function_type: 'cash', coverage_level: 'basic' },
        ],
      }),
    );
    expect(result!.actionType).toBe('create_obv');
  });

  it('phase 3: returns create_obv for hardSignal not met when ops ok', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 3,
        hardSignalMet: false,
        coverage: [
          { function_type: 'delivery', coverage_level: 'strong' },
          { function_type: 'cash', coverage_level: 'strong' },
        ],
      }),
    );
    expect(result!.actionType).toBe('create_obv');
    expect(result!.title).toContain('evidencia operativa');
  });

  // ── Phase 4 — 4 branches, never returns null ──────────────────
  it('phase 4: returns create_obv when ops degraded', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 4,
        coverage: [
          { function_type: 'delivery', coverage_level: 'basic' },
          { function_type: 'cash', coverage_level: 'strong' },
        ],
      }),
    );
    expect(result!.actionType).toBe('create_obv');
    expect(result!.title).toContain('Estabiliza');
  });

  it('phase 4: returns add_metrics when prob inactive', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 4,
        probStatus: 'inactive',
        coverage: [
          { function_type: 'delivery', coverage_level: 'strong' },
          { function_type: 'cash', coverage_level: 'strong' },
        ],
      }),
    );
    expect(result!.actionType).toBe('add_metrics');
    expect(result!.title).toContain('crecimiento');
  });

  it('phase 4: returns add_metrics when hardSignal not met + ops ok + prob active', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 4,
        hardSignalMet: false,
        probStatus: 'active',
        coverage: [
          { function_type: 'delivery', coverage_level: 'strong' },
          { function_type: 'cash', coverage_level: 'strong' },
        ],
      }),
    );
    expect(result!.actionType).toBe('add_metrics');
    expect(result!.title).toContain('condiciones de escala');
  });

  it('phase 4: returns momentum action when everything is healthy', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 4,
        hardSignalMet: true,
        probStatus: 'active',
        coverage: [
          { function_type: 'delivery', coverage_level: 'strong' },
          { function_type: 'cash', coverage_level: 'strong' },
        ],
      }),
    );
    expect(result!.actionType).toBe('add_metrics');
    expect(result!.title).toContain('momentum');
  });

  // ── Fallback ───────────────────────────────────────────────────
  it('returns null for unknown phase (e.g., 5)', () => {
    const result = getNextAction(
      makeEngineData({
        phase: 5,
        hardSignalMet: true,
        coverage: [{ function_type: 'demand', coverage_level: 'strong' }],
      }),
    );
    expect(result).toBeNull();
  });
});
