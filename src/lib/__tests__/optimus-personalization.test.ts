/**
 * OP28.6 — Tests de Optimus Personalization
 *
 * Tests de la lógica de derivación de preferencias (mirrors compute_optimus_profile SQL).
 */

import { describe, it, expect } from 'vitest'

interface FeedbackSummary {
  total: number;
  down: number;
  too_obvious: number;
  not_actionable: number;
  wrong_context: number;
  disagree: number;
  helpful: number;
}

// Mirror of compute_optimus_profile SQL logic
function derivePreferences(s: FeedbackSummary) {
  if (s.total < 5) return null;

  // Depth
  let depth = 'equilibrado';
  if (s.too_obvious / s.total > 0.5) depth = 'detallado';
  else if (s.helpful / s.total > 0.7) depth = 'conciso';

  // Risk
  let risk = 'moderado';
  if (s.disagree / s.total > 0.3) risk = 'conservador';
  else if (s.disagree / s.total < 0.1 && s.down / s.total < 0.2) risk = 'agresivo';

  // Style
  let style = 'default';
  if (s.not_actionable / s.total > 0.4) style = 'más específico';
  else if (s.wrong_context / s.total > 0.3) style = 'más estratégico';
  else if (s.too_obvious / s.total > 0.3 && s.not_actionable / s.total < 0.2) style = 'más motivacional';

  return { depth, risk, style };
}

describe('OP28.1 — compute_optimus_profile logic', () => {
  it('returns null with < 5 feedbacks', () => {
    expect(derivePreferences({ total: 3, down: 1, too_obvious: 1, not_actionable: 0, wrong_context: 0, disagree: 0, helpful: 2 })).toBeNull();
  });

  it('derives detallado when > 50% too_obvious', () => {
    const result = derivePreferences({ total: 10, down: 6, too_obvious: 6, not_actionable: 0, wrong_context: 0, disagree: 0, helpful: 0 });
    expect(result?.depth).toBe('detallado');
  });

  it('derives conciso when > 70% helpful', () => {
    const result = derivePreferences({ total: 10, down: 0, too_obvious: 0, not_actionable: 0, wrong_context: 0, disagree: 0, helpful: 8 });
    expect(result?.depth).toBe('conciso');
  });

  it('derives conservador when > 30% disagree', () => {
    const result = derivePreferences({ total: 10, down: 4, too_obvious: 0, not_actionable: 0, wrong_context: 0, disagree: 4, helpful: 0 });
    expect(result?.risk).toBe('conservador');
  });

  it('derives agresivo when < 10% disagree and < 20% down', () => {
    const result = derivePreferences({ total: 10, down: 1, too_obvious: 0, not_actionable: 0, wrong_context: 0, disagree: 0, helpful: 5 });
    expect(result?.risk).toBe('agresivo');
  });

  it('derives más específico when > 40% not_actionable', () => {
    const result = derivePreferences({ total: 10, down: 5, too_obvious: 0, not_actionable: 5, wrong_context: 0, disagree: 0, helpful: 0 });
    expect(result?.style).toBe('más específico');
  });

  it('derives más estratégico when > 30% wrong_context', () => {
    const result = derivePreferences({ total: 10, down: 4, too_obvious: 0, not_actionable: 1, wrong_context: 4, disagree: 0, helpful: 0 });
    expect(result?.style).toBe('más estratégico');
  });

  it('derives defaults when no strong signal', () => {
    const result = derivePreferences({ total: 10, down: 2, too_obvious: 1, not_actionable: 1, wrong_context: 1, disagree: 1, helpful: 3 });
    expect(result?.depth).toBe('equilibrado');
    expect(result?.risk).toBe('moderado');
    expect(result?.style).toBe('default');
  });
});
