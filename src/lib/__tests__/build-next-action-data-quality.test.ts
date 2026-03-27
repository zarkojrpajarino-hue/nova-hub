/**
 * buildNextAction — Data Quality gate (step 5b) cascade tests
 *
 * Verifies that data_completeness < 50% triggers the data quality action
 * ONLY when higher-priority levels (risk, overdue, agents) don't fire.
 */
import { describe, it, expect } from 'vitest';
import { buildNextAction } from '../build-next-action';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import type { SynthesizedInsight } from '@/lib/agent-synthesis';

function makeEngineData(overrides: {
  phase?: number;
  riskLevel?: string;
  riskStatus?: string;
  probCompleteness?: number;
  riskCompleteness?: number;
}): ProjectEngineData {
  return {
    phaseState: {
      current_phase: overrides.phase ?? 1,
      phase_score: 40,
      phase_status: 'active',
      hard_signal_met: false,
      last_calculated_at: '',
      entry_mode: null,
      graduation_eligible_since: null,
      graduated: false,
    },
    phaseHistory: [],
    probability: {
      probability_score: 50,
      probability_status: 'active',
      data_completeness_score: overrides.probCompleteness ?? 0.3,
      revenue_momentum_input: 0,
    } as ProjectEngineData['probability'],
    probabilityHistory: [],
    risk: {
      risk_level: overrides.riskLevel ?? 'low',
      risk_status: overrides.riskStatus ?? 'active',
      risk_score: 30,
      top_risk_type: null,
      data_completeness_score: overrides.riskCompleteness ?? 0.3,
    } as ProjectEngineData['risk'],
    riskHistory: [],
    coverage: [
      { function_type: 'demand', coverage_level: 'none', coverage_score: 0 },
    ],
  } as ProjectEngineData;
}

const noTasks = { overdueCount: 0 };
const defaultCtx = { mode: 'solo' as const, teamSize: 1, operationalComplexity: 'low' as const, macroRole: 'founder' as const };

function makeCriticalInsight(): SynthesizedInsight {
  return {
    agent_type: 'finance',
    reliability_score: 0.8,
    sources: [],
    content: {
      severity: 'critical',
      summary: 'Cash flow critical',
      implication: 'Running out of money',
      action_hint: 'Add funding',
    },
  } as SynthesizedInsight;
}

describe('buildNextAction — Data Quality gate (5b)', () => {
  // ── 1. Risk critical wins over 5b ──
  it('risk critical overrides data quality gate', () => {
    const result = buildNextAction(
      makeEngineData({ riskLevel: 'critical', riskStatus: 'active', probCompleteness: 0.2, riskCompleteness: 0.2 }),
      [],
      noTasks,
      defaultCtx,
    );
    expect(result.title).toContain('riesgo crítico');
    expect(result.source).toBe('engine');
    expect(result.urgency).toBe('high');
  });

  // ── 2. Overdue tasks >= 3 wins over 5b ──
  it('overdue tasks override data quality gate', () => {
    const result = buildNextAction(
      makeEngineData({ probCompleteness: 0.2, riskCompleteness: 0.2 }),
      [],
      { overdueCount: 4 },
      defaultCtx,
    );
    expect(result.title).toContain('tareas bloqueando');
    expect(result.source).toBe('tasks');
  });

  // ── 3. Agent critical wins over 5b ──
  it('agent critical overrides data quality gate', () => {
    const result = buildNextAction(
      makeEngineData({ probCompleteness: 0.2, riskCompleteness: 0.2 }),
      [makeCriticalInsight()],
      noTasks,
      defaultCtx,
    );
    expect(result.title).toBe('Cash flow critical');
    expect(result.source).toBe('agents');
  });

  // ── 4. Data quality < 50% triggers 5b when nothing else fires ──
  it('data quality < 50% triggers evidence action', () => {
    const result = buildNextAction(
      makeEngineData({ probCompleteness: 0.3, riskCompleteness: 0.2 }),
      [],
      noTasks,
      defaultCtx,
    );
    expect(result.title).toBe('Genera más evidencia antes de decidir');
    expect(result.urgency).toBe('medium');
    expect(result.source).toBe('engine');
    expect(result.actionType).toBe('create_obv');
    expect(result.ctaLabel).toBe('Crear evidencia');
    expect(result.signals.some(s => s.includes('Calidad de datos baja'))).toBe(true);
  });

  // ── 5. Data quality >= 50% falls through to normal fallback ──
  it('data quality >= 50% does NOT trigger 5b', () => {
    const result = buildNextAction(
      makeEngineData({ probCompleteness: 0.6, riskCompleteness: 0.6 }),
      [],
      noTasks,
      defaultCtx,
    );
    // Should fall through to getNextAction() phase-based fallback
    expect(result.title).not.toBe('Genera más evidencia antes de decidir');
    expect(result.title).toContain('Valida'); // Phase 1 founder fallback
  });

  // ── 6. Copy and CTA are correct ──
  it('5b has correct copy structure', () => {
    const result = buildNextAction(
      makeEngineData({ probCompleteness: 0.15, riskCompleteness: 0.25 }),
      [],
      noTasks,
      defaultCtx,
    );
    expect(result.title).toBe('Genera más evidencia antes de decidir');
    expect(result.description).toContain('datos actuales');
    expect(result.description).toContain('señales fiables');
    expect(result.ctaLabel).toBe('Crear evidencia');
    expect(result.type).toBe('obv');
    // Signal should include percentage
    const qualitySignal = result.signals.find(s => s.includes('Calidad de datos'));
    expect(qualitySignal).toBeDefined();
    expect(qualitySignal).toContain('20%'); // avg of 0.15 + 0.25 = 0.2 = 20%
  });
});
