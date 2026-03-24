/**
 * V4.7.7 — Tests for gamification.ts
 *
 * Tests pure functions: getAchievements, getBadges, calculateLevel.
 * Async methods (awardPoints, unlockAchievement, etc.) require Supabase
 * and are not tested here — they need integration tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18next before importing the module
vi.mock('i18next', () => ({
  default: {
    t: (key: string) => key,
  },
}));

// Mock supabase to prevent import errors
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          not: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  },
}));

import { getAchievements, getBadges, GamificationSystem } from '../gamification';

describe('getAchievements', () => {
  it('returns 14 achievements', () => {
    const achievements = getAchievements();
    expect(achievements).toHaveLength(14);
  });

  it('every achievement has required fields', () => {
    const achievements = getAchievements();
    for (const a of achievements) {
      expect(a.id).toBeTruthy();
      expect(a.nameKey).toBeTruthy();
      expect(a.descriptionKey).toBeTruthy();
      expect(typeof a.points).toBe('number');
      expect(a.points).toBeGreaterThan(0);
      expect(['onboarding', 'usage', 'milestone', 'quality']).toContain(a.category);
      expect(['common', 'rare', 'epic', 'legendary']).toContain(a.rarity);
    }
  });

  it('has unique achievement ids', () => {
    const achievements = getAchievements();
    const ids = achievements.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes all category types', () => {
    const achievements = getAchievements();
    const categories = new Set(achievements.map((a) => a.category));
    expect(categories).toContain('onboarding');
    expect(categories).toContain('usage');
    expect(categories).toContain('milestone');
    expect(categories).toContain('quality');
  });

  it('onboarding achievements have correct point progression', () => {
    const achievements = getAchievements();
    const onboarding = achievements
      .filter((a) => a.category === 'onboarding')
      .sort((a, b) => a.points - b.points);
    expect(onboarding[0].points).toBe(100);
    expect(onboarding[onboarding.length - 1].points).toBe(1000);
  });
});

describe('getBadges', () => {
  it('returns 5 badges', () => {
    const badges = getBadges();
    expect(badges).toHaveLength(5);
  });

  it('every badge has required fields', () => {
    const badges = getBadges();
    for (const b of badges) {
      expect(b.id).toBeTruthy();
      expect(b.nameKey).toBeTruthy();
      expect(b.descriptionKey).toBeTruthy();
      expect(b.requirementKey).toBeTruthy();
      expect(b.icon).toBeTruthy();
      expect(b.color).toBeTruthy();
    }
  });

  it('has unique badge ids', () => {
    const badges = getBadges();
    const ids = badges.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes expected badges', () => {
    const badges = getBadges();
    const ids = badges.map((b) => b.id);
    expect(ids).toContain('intermediate');
    expect(ids).toContain('advanced');
    expect(ids).toContain('master');
    expect(ids).toContain('speed-demon');
    expect(ids).toContain('completionist');
  });
});

describe('GamificationSystem.calculateLevel', () => {
  let system: GamificationSystem;

  beforeEach(() => {
    system = new GamificationSystem('project-1', 'user-1');
  });

  it('level 1 for 0 points', () => {
    expect(system.calculateLevel(0)).toBe(1);
  });

  it('level 1 for 999 points', () => {
    expect(system.calculateLevel(999)).toBe(1);
  });

  it('level 2 for 1000 points', () => {
    expect(system.calculateLevel(1000)).toBe(2);
  });

  it('level 2 for 1999 points', () => {
    expect(system.calculateLevel(1999)).toBe(2);
  });

  it('level 3 for 2000 points', () => {
    expect(system.calculateLevel(2000)).toBe(3);
  });

  it('level 6 for 5000 points', () => {
    expect(system.calculateLevel(5000)).toBe(6);
  });

  it('level 11 for 10000 points', () => {
    expect(system.calculateLevel(10000)).toBe(11);
  });
});

describe('GamificationSystem constructor', () => {
  it('stores projectId and userId', () => {
    const system = new GamificationSystem('proj-abc', 'user-xyz');
    expect(system.projectId).toBe('proj-abc');
    expect(system.userId).toBe('user-xyz');
  });
});
