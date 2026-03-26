/**
 * NextAction role differentiation — verify copy per scenario
 */
import { describe, it, expect } from 'vitest';
import { getNextAction } from '../next-action';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

function makeEngineData(overrides: {
  phase?: number;
  score?: number;
  hardSignalMet?: boolean;
  riskLevel?: string;
  coverage?: Array<{ function_type: string; coverage_level: string; coverage_score: number }>;
}): ProjectEngineData {
  return {
    phaseState: {
      current_phase: overrides.phase ?? 1,
      phase_score: overrides.score ?? 40,
      phase_status: 'active',
      hard_signal_met: overrides.hardSignalMet ?? false,
      last_calculated_at: '',
      entry_mode: null,
      graduation_eligible_since: null,
      graduated: false,
    },
    phaseHistory: [],
    probability: null,
    probabilityHistory: [],
    risk: overrides.riskLevel ? {
      risk_level: overrides.riskLevel,
      risk_status: 'active',
      risk_score: 50,
      top_risk_type: null,
    } : null,
    riskHistory: [],
    coverage: overrides.coverage ?? [
      { function_type: 'demand', coverage_level: 'none', coverage_score: 0 },
    ],
  } as ProjectEngineData;
}

describe('NextAction role differentiation', () => {
  // ── Founder P1 ──
  it('Founder P1: strategic focus', () => {
    const r = getNextAction(makeEngineData({ phase: 1 }), 'founder');
    expect(r!.title).toContain('Valida el problema');
    expect(r!.ctaLabel).toBe('Crear evidencia');
  });

  // ── Growth P1 ──
  it('Growth P1: commercial focus', () => {
    const r = getNextAction(makeEngineData({ phase: 1 }), 'growth');
    expect(r!.title).toContain('señales de demanda');
    expect(r!.ctaLabel).toBe('Ir al pipeline');
  });

  // ── Ops P1 ──
  it('Ops P1: process focus', () => {
    const r = getNextAction(makeEngineData({ phase: 1 }), 'operations');
    expect(r!.title).toContain('validación');
    expect(r!.ctaLabel).toBe('Ver tareas');
  });

  // ── Founder P2 ──
  it('Founder P2: different from P1', () => {
    const r = getNextAction(makeEngineData({ phase: 2 }), 'founder');
    expect(r!.title).toContain('demanda real');
    expect(r!.title).not.toContain('Valida el problema'); // must be different from P1
    expect(r!.ctaLabel).toBe('Registrar validación');
  });

  // ── Growth P2 ──
  it('Growth P2: pipeline focus', () => {
    const r = getNextAction(makeEngineData({ phase: 2 }), 'growth');
    expect(r!.title).toContain('evidencia de demanda');
    expect(r!.ctaLabel).toBe('Ir al pipeline');
  });

  // ── Ops P2 ──
  it('Ops P2: activation processes', () => {
    const r = getNextAction(makeEngineData({ phase: 2 }), 'operations');
    expect(r!.title).toContain('procesos');
    expect(r!.ctaLabel).toBe('Ver tareas');
  });

  // ── Founder P3 (opsWeak) ──
  it('Founder P3 opsWeak: reinforce operations', () => {
    const r = getNextAction(makeEngineData({
      phase: 3,
      coverage: [
        { function_type: 'demand', coverage_level: 'strong', coverage_score: 80 },
        { function_type: 'delivery', coverage_level: 'none', coverage_score: 0 },
      ],
    }), 'founder');
    expect(r!.title).toContain('operación');
    expect(r!.ctaLabel).toBe('Documentar operación');
  });

  // ── Growth P3 (opsWeak) ──
  it('Growth P3 opsWeak: team needs to consolidate', () => {
    const r = getNextAction(makeEngineData({
      phase: 3,
      coverage: [
        { function_type: 'demand', coverage_level: 'strong', coverage_score: 80 },
        { function_type: 'delivery', coverage_level: 'basic', coverage_score: 20 },
      ],
    }), 'growth');
    expect(r!.title).toContain('consolidar operaciones');
    expect(r!.ctaLabel).toBe('Ver estado');
  });

  // ── Ops P3 (opsWeak) ──
  it('Ops P3 opsWeak: stabilize delivery', () => {
    const r = getNextAction(makeEngineData({
      phase: 3,
      coverage: [
        { function_type: 'demand', coverage_level: 'strong', coverage_score: 80 },
        { function_type: 'delivery', coverage_level: 'none', coverage_score: 0 },
      ],
    }), 'operations');
    expect(r!.title).toContain('entrega');
    expect(r!.ctaLabel).toBe('Documentar entrega');
  });

  // ── All roles: same phase 0 ──
  it('Phase 0: all roles get same explore message', () => {
    const f = getNextAction(makeEngineData({ phase: 0 }), 'founder');
    const g = getNextAction(makeEngineData({ phase: 0 }), 'growth');
    const o = getNextAction(makeEngineData({ phase: 0 }), 'operations');
    expect(f!.title).toBe(g!.title);
    expect(f!.title).toBe(o!.title);
    expect(f!.title).toContain('Explora');
  });
});
