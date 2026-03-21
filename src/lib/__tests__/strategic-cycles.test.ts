/**
 * CE25.12 — Tests de ciclos estratégicos
 *
 * Tests de lógica pura frontend:
 * 1. PHASE_METHODOLOGY exists for all phases (re-verified for cycle context)
 * 2. CycleObjective type structure validation
 * 3. Score calculation logic (mirrors compute_cycle_score SQL)
 */

import { describe, it, expect } from 'vitest'
import { PHASE_METHODOLOGY } from '../engine'

// Mirror of compute_cycle_score SQL logic for frontend validation
function computeCycleScore(objectives: Array<{ weight: number; target_value: number; current_value: number }>): number {
  let total = 0;
  for (const obj of objectives) {
    if (obj.target_value <= 0) continue;
    const objScore = Math.min(100, (obj.current_value / obj.target_value) * 100);
    total += objScore * obj.weight;
  }
  return Math.round(total * 100) / 100;
}

describe('CE25 — Strategic Cycles', () => {
  describe('compute_cycle_score (frontend mirror)', () => {
    it('returns 0 for empty objectives', () => {
      expect(computeCycleScore([])).toBe(0);
    });

    it('returns 100 when all objectives met at target', () => {
      const objs = [
        { weight: 0.5, target_value: 100, current_value: 100 },
        { weight: 0.5, target_value: 50, current_value: 50 },
      ];
      expect(computeCycleScore(objs)).toBe(100);
    });

    it('returns correct weighted score for partial progress', () => {
      const objs = [
        { weight: 0.4, target_value: 100, current_value: 50 },  // 50% * 0.4 = 20
        { weight: 0.3, target_value: 200, current_value: 200 }, // 100% * 0.3 = 30
        { weight: 0.3, target_value: 100, current_value: 0 },   // 0% * 0.3 = 0
      ];
      expect(computeCycleScore(objs)).toBe(50);
    });

    it('caps individual objective score at 100%', () => {
      const objs = [
        { weight: 1.0, target_value: 50, current_value: 200 }, // 400% capped to 100
      ];
      expect(computeCycleScore(objs)).toBe(100);
    });

    it('handles target_value = 0 gracefully', () => {
      const objs = [
        { weight: 0.5, target_value: 0, current_value: 50 },   // skipped
        { weight: 0.5, target_value: 100, current_value: 80 },  // 80% * 0.5 = 40
      ];
      expect(computeCycleScore(objs)).toBe(40);
    });

    it('weights sum to produce max 100 when all at target', () => {
      const objs = [
        { weight: 0.30, target_value: 10, current_value: 10 },
        { weight: 0.25, target_value: 20, current_value: 20 },
        { weight: 0.25, target_value: 30, current_value: 30 },
        { weight: 0.20, target_value: 40, current_value: 40 },
      ];
      expect(computeCycleScore(objs)).toBe(100);
    });
  });

  describe('PHASE_METHODOLOGY for cycles', () => {
    it('all phases 0-4 have methodology', () => {
      for (let i = 0; i <= 4; i++) {
        expect(PHASE_METHODOLOGY[i]).toBeDefined();
      }
    });
  });
});
