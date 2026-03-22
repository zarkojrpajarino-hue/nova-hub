import { describe, it, expect, vi } from 'vitest';
import { buildNextAction, type ProjectContext, type EnrichedNextAction } from '../build-next-action';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';
import type { SynthesizedInsight } from '@/lib/agent-synthesis';

// Minimal engine data for testing
const baseEngineData: ProjectEngineData = {
  phase: { current_phase: 2, phase_score: 50, hard_signal_met: false },
  risk: { risk_level: 'low', risk_status: 'insufficient_data', risk_score: 20 },
  probability: null,
  coverage: null,
  viability: null,
  economicProfile: null,
  orgCapacity: null,
  phaseHistory: [],
} as unknown as ProjectEngineData;

const defaultContext: ProjectContext = {
  mode: 'solo',
  teamSize: 1,
  operationalComplexity: 'low',
};

const noInsights: SynthesizedInsight[] = [];
const noOverdue = { overdueCount: 0 };

describe('buildNextAction', () => {
  it('returns critical risk action when risk is critical', () => {
    const engineData = {
      ...baseEngineData,
      risk: { risk_level: 'critical', risk_status: 'active', risk_score: 90 },
    } as unknown as ProjectEngineData;

    const result = buildNextAction(engineData, noInsights, noOverdue, defaultContext);
    expect(result.urgency).toBe('high');
    expect(result.type).toBe('task');
    expect(result.title).toContain('riesgo crítico');
  });

  it('returns overdue action when overdueCount >= 3', () => {
    const result = buildNextAction(baseEngineData, noInsights, { overdueCount: 5 }, defaultContext);
    expect(result.type).toBe('task');
    expect(result.urgency).toBe('high');
    expect(result.source).toBe('tasks');
    expect(result.title).toContain('5');
  });

  it('returns agent critical insight before overdue 1-2', () => {
    const criticalInsight: SynthesizedInsight = {
      agent_type: 'finance',
      content: {
        severity: 'critical',
        summary: 'Cash burn too high',
        implication: 'Runway is 2 months',
        action_hint: 'Cut costs',
      },
      reliability_score: 0.8,
      sources: [],
    } as unknown as SynthesizedInsight;

    const result = buildNextAction(
      baseEngineData,
      [criticalInsight],
      { overdueCount: 1 },
      defaultContext,
    );
    expect(result.source).toBe('agents');
    expect(result.title).toBe('Cash burn too high');
  });

  it('maps meeting type to task for solo founders', () => {
    const criticalInsight: SynthesizedInsight = {
      agent_type: 'team',
      content: {
        severity: 'critical',
        summary: 'Team alignment needed',
        implication: 'Schedule meeting',
        action_hint: null,
      },
      reliability_score: 0.9,
      sources: [],
    } as unknown as SynthesizedInsight;

    const result = buildNextAction(
      baseEngineData,
      [criticalInsight],
      noOverdue,
      { ...defaultContext, mode: 'solo' },
    );
    // Solo mode → meeting becomes task
    expect(result.type).toBe('task');
  });

  it('returns engine fallback when no overdue/agents', () => {
    const result = buildNextAction(baseEngineData, noInsights, noOverdue, defaultContext);
    expect(result.source).toBe('engine');
  });

  it('returns type none with null engine data', () => {
    const result = buildNextAction(null, noInsights, noOverdue, defaultContext);
    expect(result.type).toBe('none');
  });

  it('accumulates overdue signals without blocking when 1-2', () => {
    const result = buildNextAction(baseEngineData, noInsights, { overdueCount: 2 }, defaultContext);
    expect(result.signals).toEqual(
      expect.arrayContaining([expect.stringContaining('2 tareas vencidas')]),
    );
    // Should NOT be the primary action (source should be engine, not tasks)
    expect(result.source).not.toBe('tasks');
  });

  it('degrades agent urgency when reliability < 0.4', () => {
    const lowReliabilityInsight: SynthesizedInsight = {
      agent_type: 'sales',
      content: {
        severity: 'critical',
        summary: 'Pipeline issue',
        implication: 'Check pipeline',
        action_hint: null,
      },
      reliability_score: 0.2,
      sources: [],
    } as unknown as SynthesizedInsight;

    const result = buildNextAction(
      baseEngineData,
      [lowReliabilityInsight],
      noOverdue,
      defaultContext,
    );
    expect(result.urgency).toBe('medium'); // degraded from high
  });
});
