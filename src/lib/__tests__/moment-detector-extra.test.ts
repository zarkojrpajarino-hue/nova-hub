/**
 * V4.7.3 — Additional moment-detector tests
 *
 * Tests for 4 missing cases: team_growth, phase_speed, bottleneck_alert, low_runway_alert
 * (the existing proactive-intelligence.test.ts covers first_customer, first_revenue,
 *  revenue_milestone, stagnation_warning, hard_signal_close, etc.)
 */

import { describe, it, expect } from 'vitest';
import { detectMoments, type MomentDetectorInput } from '../moment-detector';

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
  activeBlockDays: 0,
  runwayMonths: null,
  totalOBVs: 0,
  totalTasksCompleted: 0,
  aiCallsUsed: 0,
  projectCount: 1,
  seenMoments: [],
};

describe('moment-detector — team_growth', () => {
  it('detects team_growth when newMembersThisWeek > 0', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      newMembersThisWeek: 2,
      teamSize: 4,
    });
    const m = moments.find((m) => m.type === 'team_growth');
    expect(m).toBeDefined();
    expect(m!.severity).toBe('celebration');
    expect(m!.message).toContain('2');
    expect(m!.message).toContain('4');
    expect(m!.data).toEqual({ newMembers: 2, totalSize: 4 });
  });

  it('uses singular form for 1 new member', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      newMembersThisWeek: 1,
      teamSize: 2,
    });
    const m = moments.find((m) => m.type === 'team_growth');
    expect(m).toBeDefined();
    expect(m!.message).toContain('1 nuevo miembro se');
  });

  it('does not detect team_growth if already seen', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      newMembersThisWeek: 3,
      teamSize: 5,
      seenMoments: ['team_growth'],
    });
    expect(moments.find((m) => m.type === 'team_growth')).toBeUndefined();
  });

  it('does not detect team_growth when newMembersThisWeek is 0', () => {
    const moments = detectMoments({ ...BASE_INPUT, newMembersThisWeek: 0 });
    expect(moments.find((m) => m.type === 'team_growth')).toBeUndefined();
  });
});

describe('moment-detector — phase_speed', () => {
  it('detects phase_speed when weeksInPhase < 4, score >= 75, hardSignal met', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      weeksInPhase: 2,
      phaseScore: 80,
      hardSignalMet: true,
      currentPhase: 2,
    });
    const m = moments.find((m) => m.type === 'phase_speed');
    expect(m).toBeDefined();
    expect(m!.severity).toBe('celebration');
    expect(m!.message).toContain('2 semanas');
    expect(m!.message).toContain('Fase 2');
  });

  it('uses singular "semana" for 1 week', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      weeksInPhase: 1,
      phaseScore: 90,
      hardSignalMet: true,
      currentPhase: 1,
    });
    const m = moments.find((m) => m.type === 'phase_speed');
    expect(m).toBeDefined();
    expect(m!.message).toContain('1 semana');
    expect(m!.message).not.toContain('1 semanas');
  });

  it('does not detect phase_speed if weeksInPhase >= 4', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      weeksInPhase: 4,
      phaseScore: 90,
      hardSignalMet: true,
    });
    expect(moments.find((m) => m.type === 'phase_speed')).toBeUndefined();
  });

  it('does not detect phase_speed if weeksInPhase is 0', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      weeksInPhase: 0,
      phaseScore: 90,
      hardSignalMet: true,
    });
    expect(moments.find((m) => m.type === 'phase_speed')).toBeUndefined();
  });

  it('does not detect phase_speed if score < 75', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      weeksInPhase: 2,
      phaseScore: 70,
      hardSignalMet: true,
    });
    expect(moments.find((m) => m.type === 'phase_speed')).toBeUndefined();
  });

  it('does not detect phase_speed if hardSignal not met', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      weeksInPhase: 2,
      phaseScore: 80,
      hardSignalMet: false,
    });
    expect(moments.find((m) => m.type === 'phase_speed')).toBeUndefined();
  });

  it('does not detect phase_speed if already seen', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      weeksInPhase: 2,
      phaseScore: 80,
      hardSignalMet: true,
      seenMoments: ['phase_speed'],
    });
    expect(moments.find((m) => m.type === 'phase_speed')).toBeUndefined();
  });
});

describe('moment-detector — bottleneck_alert', () => {
  it('detects bottleneck_alert when activeBlockDays >= 14', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      activeBlockDays: 14,
    });
    const m = moments.find((m) => m.type === 'bottleneck_alert');
    expect(m).toBeDefined();
    expect(m!.severity).toBe('warning');
    expect(m!.message).toContain('14 días');
    expect(m!.data).toEqual({ blockDays: 14 });
  });

  it('detects bottleneck_alert when activeBlockDays > 14', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      activeBlockDays: 30,
    });
    const m = moments.find((m) => m.type === 'bottleneck_alert');
    expect(m).toBeDefined();
    expect(m!.data).toEqual({ blockDays: 30 });
  });

  it('does not detect bottleneck_alert when activeBlockDays < 14', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      activeBlockDays: 13,
    });
    expect(moments.find((m) => m.type === 'bottleneck_alert')).toBeUndefined();
  });

  it('does not detect bottleneck_alert when activeBlockDays is 0', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      activeBlockDays: 0,
    });
    expect(moments.find((m) => m.type === 'bottleneck_alert')).toBeUndefined();
  });
});

describe('moment-detector — low_runway_alert', () => {
  it('detects low_runway_alert when runwayMonths < 4', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      runwayMonths: 3,
    });
    const m = moments.find((m) => m.type === 'low_runway_alert');
    expect(m).toBeDefined();
    expect(m!.severity).toBe('warning');
    expect(m!.message).toContain('3 meses');
    expect(m!.data).toEqual({ runwayMonths: 3 });
  });

  it('detects low_runway_alert when runwayMonths is 0', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      runwayMonths: 0,
    });
    const m = moments.find((m) => m.type === 'low_runway_alert');
    expect(m).toBeDefined();
    expect(m!.message).toContain('0 meses');
  });

  it('does not detect low_runway_alert when runwayMonths >= 4', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      runwayMonths: 4,
    });
    expect(moments.find((m) => m.type === 'low_runway_alert')).toBeUndefined();
  });

  it('does not detect low_runway_alert when runwayMonths is null', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      runwayMonths: null,
    });
    expect(moments.find((m) => m.type === 'low_runway_alert')).toBeUndefined();
  });

  it('rounds runway months in message', () => {
    const moments = detectMoments({
      ...BASE_INPUT,
      runwayMonths: 2.7,
    });
    const m = moments.find((m) => m.type === 'low_runway_alert');
    expect(m).toBeDefined();
    expect(m!.message).toContain('3 meses');
  });
});
