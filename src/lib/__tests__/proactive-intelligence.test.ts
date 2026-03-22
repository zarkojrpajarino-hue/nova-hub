/**
 * PI27.6 — Tests de Proactive Intelligence
 *
 * Tests para moment-detector y phase-runway-estimator.
 */

import { describe, it, expect } from 'vitest'
import { detectMoments, type MomentDetectorInput } from '../moment-detector'
import { estimatePhaseRunway } from '../phase-runway-estimator'

// ── Moment Detector ──────────────────────────────────────────────

const BASE_INPUT: MomentDetectorInput = {
  hasFirstSale: false,
  currentMrr: 0,
  previousMrr: 0,
  currentPhase: 1,
  phaseScore: 50,
  hardSignalMet: false,
  weeksInPhase: 4,
  scoreChange4w: 5,
  consecutiveLowScore: 0,
  teamSize: 1,
  newMembersThisWeek: 0,
  activeCycleDaysRemaining: null,
  activeCycleScore: null,
  seenMoments: [],
};

describe('PI27.1 — detectMoments', () => {
  it('detects first_customer when hasFirstSale and not seen', () => {
    const moments = detectMoments({ ...BASE_INPUT, hasFirstSale: true });
    expect(moments.find(m => m.type === 'first_customer')).toBeDefined();
    expect(moments.find(m => m.type === 'first_customer')?.severity).toBe('celebration');
  });

  it('does not repeat first_customer if already seen', () => {
    const moments = detectMoments({ ...BASE_INPUT, hasFirstSale: true, seenMoments: ['first_customer'] });
    expect(moments.find(m => m.type === 'first_customer')).toBeUndefined();
  });

  it('detects first_revenue when MRR goes from 0 to positive', () => {
    const moments = detectMoments({ ...BASE_INPUT, currentMrr: 500, previousMrr: 0 });
    expect(moments.find(m => m.type === 'first_revenue')).toBeDefined();
  });

  it('detects revenue_milestone at €1k', () => {
    const moments = detectMoments({ ...BASE_INPUT, currentMrr: 1200, previousMrr: 900 });
    expect(moments.find(m => m.type === 'revenue_milestone')).toBeDefined();
    expect(moments.find(m => m.type === 'revenue_milestone')?.data?.milestone).toBe(1000);
  });

  it('detects stagnation_warning at 8+ weeks without improvement', () => {
    const moments = detectMoments({ ...BASE_INPUT, weeksInPhase: 10, scoreChange4w: 2 });
    expect(moments.find(m => m.type === 'stagnation_warning')).toBeDefined();
    expect(moments.find(m => m.type === 'stagnation_warning')?.severity).toBe('warning');
  });

  it('detects hard_signal_close when score OK but signal missing', () => {
    const moments = detectMoments({ ...BASE_INPUT, phaseScore: 80, weeksInPhase: 3 });
    expect(moments.find(m => m.type === 'hard_signal_close')).toBeDefined();
    expect(moments.find(m => m.type === 'hard_signal_close')?.severity).toBe('info');
  });

  it('detects cycle_ending_soon when ≤14 days and score < 75', () => {
    const moments = detectMoments({ ...BASE_INPUT, activeCycleDaysRemaining: 10, activeCycleScore: 60 });
    expect(moments.find(m => m.type === 'cycle_ending_soon')).toBeDefined();
  });

  it('detects regression_risk when consecutive low score ≥ 3', () => {
    const moments = detectMoments({ ...BASE_INPUT, currentPhase: 2, consecutiveLowScore: 4 });
    expect(moments.find(m => m.type === 'regression_risk')).toBeDefined();
  });

  it('returns empty array when no moments match', () => {
    const moments = detectMoments(BASE_INPUT);
    expect(moments).toHaveLength(0);
  });
});

// ── Phase Runway Estimator ───────────────────────────────────────

describe('PI27.3 — estimatePhaseRunway', () => {
  it('returns ready when score >= 75 and hard signal met', () => {
    const result = estimatePhaseRunway({
      currentPhase: 2,
      currentScore: 80,
      scoreHistory: [60, 65, 70, 75, 80],
      hardSignalMet: true,
      iterationVelocity: 3,
    });
    expect(result.weeksEstimate).toBe('ready');
    expect(result.confidence).toBe('high');
  });

  it('returns stalled when slope is negative', () => {
    const result = estimatePhaseRunway({
      currentPhase: 1,
      currentScore: 40,
      scoreHistory: [60, 55, 50, 45, 40],
      hardSignalMet: false,
      iterationVelocity: 1,
    });
    expect(result.weeksEstimate).toBe('stalled');
  });

  it('estimates weeks when improving', () => {
    const result = estimatePhaseRunway({
      currentPhase: 1,
      currentScore: 50,
      scoreHistory: [30, 35, 40, 45, 50],  // slope ~5 pts/week
      hardSignalMet: false,
      iterationVelocity: 3,
    });
    // 75 - 50 = 25 points needed, 5 pts/week = 5 weeks + 2 (no hard signal) = 7
    expect(result.weeksEstimate).toBe(7);
  });

  it('returns stalled with not enough data', () => {
    const result = estimatePhaseRunway({
      currentPhase: 1,
      currentScore: 30,
      scoreHistory: [30],
      hardSignalMet: false,
      iterationVelocity: 2,
    });
    expect(result.weeksEstimate).toBe('stalled');
    expect(result.confidence).toBe('low');
  });

  it('returns ready for phase 4+', () => {
    const result = estimatePhaseRunway({
      currentPhase: 4,
      currentScore: 60,
      scoreHistory: [50, 55, 60],
      hardSignalMet: false,
      iterationVelocity: 2,
    });
    expect(result.weeksEstimate).toBe('ready');
  });

  it('has high confidence with 6+ data points and good R²', () => {
    const result = estimatePhaseRunway({
      currentPhase: 2,
      currentScore: 60,
      scoreHistory: [30, 35, 40, 45, 50, 55, 60],  // Very linear
      hardSignalMet: true,
      iterationVelocity: 3,
    });
    expect(typeof result.weeksEstimate).toBe('number');
    expect(result.confidence).toBe('high');
  });
});
