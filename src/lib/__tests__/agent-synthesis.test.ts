import { describe, it, expect } from 'vitest';
import {
  prioritizeInsights,
  synthesizeAgentContext,
  detectConflicts,
  computeAgentRiskModifier,
  type SynthesizedInsight,
  type InsightConflict,
  type AgentRiskModifier,
} from '../agent-synthesis';

// ── Factories ──────────────────────────────────────────────────────────────────

let counter = 0;
function makeInsight(overrides: Partial<SynthesizedInsight> = {}): SynthesizedInsight {
  counter++;
  return {
    id: `insight-${counter}`,
    agent_type: 'finance',
    insight_type: 'cash_flow_signal',
    content: {
      summary: 'Test insight',
      implication: 'Test implication',
      severity: 'info',
    },
    confidence: 0.7,
    generated_at: new Date().toISOString(),
    ...overrides,
  } as SynthesizedInsight;
}

// ── prioritizeInsights ─────────────────────────────────────────────────────────

describe('prioritizeInsights', () => {
  it('returns empty for empty input', () => {
    expect(prioritizeInsights([])).toEqual([]);
  });

  it('sorts by severity (critical > warning > attention > info)', () => {
    const insights = [
      makeInsight({ content: { summary: 'a', implication: 'a', severity: 'info' } }),
      makeInsight({ content: { summary: 'b', implication: 'b', severity: 'critical' } }),
      makeInsight({ content: { summary: 'c', implication: 'c', severity: 'warning' } }),
      makeInsight({ content: { summary: 'd', implication: 'd', severity: 'attention' } }),
    ];
    const sorted = prioritizeInsights(insights);
    expect(sorted[0].content.severity).toBe('critical');
    expect(sorted[1].content.severity).toBe('warning');
    expect(sorted[2].content.severity).toBe('attention');
    expect(sorted[3].content.severity).toBe('info');
  });

  it('uses agent weight as tiebreaker (finance > execution at same severity)', () => {
    const finance = makeInsight({
      agent_type: 'finance',
      content: { summary: 'f', implication: 'f', severity: 'warning' },
    });
    const execution = makeInsight({
      agent_type: 'execution',
      content: { summary: 'e', implication: 'e', severity: 'warning' },
    });
    const sorted = prioritizeInsights([execution, finance]);
    expect(sorted[0].agent_type).toBe('finance');
    expect(sorted[1].agent_type).toBe('execution');
  });

  it('uses confidence as sub-tiebreaker', () => {
    const low = makeInsight({
      agent_type: 'finance',
      confidence: 0.3,
      content: { summary: 'l', implication: 'l', severity: 'warning' },
    });
    const high = makeInsight({
      agent_type: 'finance',
      confidence: 0.9,
      content: { summary: 'h', implication: 'h', severity: 'warning' },
    });
    const sorted = prioritizeInsights([low, high]);
    expect(sorted[0].confidence).toBe(0.9);
  });

  it('does not mutate original array', () => {
    const insights = [
      makeInsight({ content: { summary: 'a', implication: 'a', severity: 'info' } }),
      makeInsight({ content: { summary: 'b', implication: 'b', severity: 'critical' } }),
    ];
    const original = [...insights];
    prioritizeInsights(insights);
    expect(insights[0].id).toBe(original[0].id);
  });
});

// ── detectConflicts ────────────────────────────────────────────────────────────

describe('detectConflicts', () => {
  it('returns empty for empty input', () => {
    expect(detectConflicts([])).toEqual([]);
  });

  it('returns empty when all insights are from same agent', () => {
    const insights = [
      makeInsight({ agent_type: 'finance', insight_type: 'cash_flow_signal', content: { summary: 'a', implication: 'a', severity: 'critical' } }),
      makeInsight({ agent_type: 'finance', insight_type: 'revenue_concentration', content: { summary: 'b', implication: 'b', severity: 'info' } }),
    ];
    expect(detectConflicts(insights)).toEqual([]);
  });

  it('returns empty for insights in different domains', () => {
    const insights = [
      makeInsight({ agent_type: 'finance', insight_type: 'cash_flow_signal', content: { summary: 'a', implication: 'a', severity: 'critical' } }),
      makeInsight({ agent_type: 'execution', insight_type: 'task_completion_rate', content: { summary: 'b', implication: 'b', severity: 'info' } }),
    ];
    expect(detectConflicts(insights)).toEqual([]);
  });

  it('detects conflict when same domain, different agents, severity delta >= 2', () => {
    // Both in financial_health domain, but from different agents
    const insights = [
      makeInsight({
        agent_type: 'finance',
        insight_type: 'cash_flow_signal',
        content: { summary: 'a', implication: 'a', severity: 'critical' }, // 4
      }),
      makeInsight({
        agent_type: 'sales', // Different agent
        insight_type: 'revenue_concentration', // Same domain: financial_health
        content: { summary: 'b', implication: 'b', severity: 'info' }, // 1
      }),
    ];
    const conflicts = detectConflicts(insights);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].reason).toContain('financial_health');
  });

  it('does not detect conflict when severity delta < 2', () => {
    const insights = [
      makeInsight({
        agent_type: 'finance',
        insight_type: 'cash_flow_signal',
        content: { summary: 'a', implication: 'a', severity: 'warning' }, // 3
      }),
      makeInsight({
        agent_type: 'sales',
        insight_type: 'revenue_concentration',
        content: { summary: 'b', implication: 'b', severity: 'attention' }, // 2
      }),
    ];
    expect(detectConflicts(insights)).toEqual([]);
  });

  it('returns empty for unknown insight types (no domain mapping)', () => {
    const insights = [
      makeInsight({
        agent_type: 'finance',
        insight_type: 'unknown_type',
        content: { summary: 'a', implication: 'a', severity: 'critical' },
      }),
      makeInsight({
        agent_type: 'execution',
        insight_type: 'also_unknown',
        content: { summary: 'b', implication: 'b', severity: 'info' },
      }),
    ];
    expect(detectConflicts(insights)).toEqual([]);
  });
});

// ── synthesizeAgentContext ──────────────────────────────────────────────────────

describe('synthesizeAgentContext', () => {
  it('returns empty for empty input', () => {
    expect(synthesizeAgentContext([])).toEqual([]);
  });

  it('returns top N insights by priority', () => {
    const insights = [
      makeInsight({ content: { summary: '1', implication: '1', severity: 'info' } }),
      makeInsight({ content: { summary: '2', implication: '2', severity: 'critical' } }),
      makeInsight({ content: { summary: '3', implication: '3', severity: 'warning' } }),
      makeInsight({ content: { summary: '4', implication: '4', severity: 'attention' } }),
    ];
    const result = synthesizeAgentContext(insights, 2);
    expect(result).toHaveLength(2);
    expect(result[0].content.severity).toBe('critical');
    expect(result[1].content.severity).toBe('warning');
  });

  it('defaults maxInsights to 3', () => {
    const insights = Array.from({ length: 5 }, (_, i) =>
      makeInsight({ content: { summary: `${i}`, implication: `${i}`, severity: 'info' } }),
    );
    const result = synthesizeAgentContext(insights);
    expect(result).toHaveLength(3);
  });

  it('excludes losing insight from conflict pair', () => {
    // Create a conflict: same domain, different agents, severity delta >= 2
    const winner = makeInsight({
      agent_type: 'finance',
      insight_type: 'cash_flow_signal',
      content: { summary: 'winner', implication: 'w', severity: 'critical' },
    });
    const loser = makeInsight({
      agent_type: 'sales',
      insight_type: 'revenue_concentration',
      content: { summary: 'loser', implication: 'l', severity: 'info' },
    });
    const result = synthesizeAgentContext([winner, loser], 5);
    expect(result.some(i => i.content.summary === 'winner')).toBe(true);
    expect(result.some(i => i.content.summary === 'loser')).toBe(false);
  });

  it('applies reliability downgrade for low reliability_score', () => {
    const insight = makeInsight({
      content: { summary: 'risky', implication: 'r', severity: 'critical' },
      reliability_score: 0.2, // < 0.4 threshold
    });
    const result = synthesizeAgentContext([insight], 3);
    expect(result[0].content.severity).toBe('warning'); // downgraded from critical
  });

  it('does not downgrade when reliability_score >= 0.4', () => {
    const insight = makeInsight({
      content: { summary: 'ok', implication: 'o', severity: 'critical' },
      reliability_score: 0.5,
    });
    const result = synthesizeAgentContext([insight], 3);
    expect(result[0].content.severity).toBe('critical');
  });

  it('does not downgrade when reliability_score is undefined', () => {
    const insight = makeInsight({
      content: { summary: 'ok', implication: 'o', severity: 'warning' },
    });
    // reliability_score not set
    const result = synthesizeAgentContext([insight], 3);
    expect(result[0].content.severity).toBe('warning');
  });
});

// ── computeAgentRiskModifier ───────────────────────────────────────────────────

describe('computeAgentRiskModifier', () => {
  it('returns null when no insights map to risk delta', () => {
    const insights = [
      makeInsight({ insight_type: 'unknown_type', content: { summary: 'a', implication: 'a', severity: 'critical' } }),
    ];
    expect(computeAgentRiskModifier(insights)).toBeNull();
  });

  it('returns null for empty insights', () => {
    expect(computeAgentRiskModifier([])).toBeNull();
  });

  it('computes delta for cash_flow_signal warning (+10)', () => {
    const insights = [
      makeInsight({ insight_type: 'cash_flow_signal', content: { summary: 'a', implication: 'a', severity: 'warning' } }),
    ];
    const result = computeAgentRiskModifier(insights);
    expect(result).not.toBeNull();
    expect(result!.delta).toBe(10);
    expect(result!.drivers).toContain('cash_flow_signal');
  });

  it('computes delta for cash_flow_signal critical (+20)', () => {
    const insights = [
      makeInsight({ insight_type: 'cash_flow_signal', content: { summary: 'a', implication: 'a', severity: 'critical' } }),
    ];
    const result = computeAgentRiskModifier(insights);
    expect(result!.delta).toBe(20);
  });

  it('accumulates deltas from multiple insights', () => {
    const insights = [
      makeInsight({ insight_type: 'cash_flow_signal', content: { summary: 'a', implication: 'a', severity: 'warning' } }), // +10
      makeInsight({ insight_type: 'overdue_ratio', content: { summary: 'b', implication: 'b', severity: 'critical' } }),    // +8
    ];
    const result = computeAgentRiskModifier(insights);
    expect(result!.delta).toBe(18);
    expect(result!.drivers).toEqual(['cash_flow_signal', 'overdue_ratio']);
  });

  it('ignores insights with info severity (no delta mapping)', () => {
    const insights = [
      makeInsight({ insight_type: 'cash_flow_signal', content: { summary: 'a', implication: 'a', severity: 'info' } }),
    ];
    expect(computeAgentRiskModifier(insights)).toBeNull();
  });

  it('returns null for insight types not in RISK_DELTA', () => {
    const insights = [
      makeInsight({ insight_type: 'revenue_concentration', content: { summary: 'a', implication: 'a', severity: 'warning' } }),
    ];
    const result = computeAgentRiskModifier(insights);
    expect(result!.delta).toBe(8);
  });
});
