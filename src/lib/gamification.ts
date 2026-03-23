/**
 * 🏆 GAMIFICATION SYSTEM
 *
 * Points, badges, achievements, and leaderboards
 * Rewards users for completing onboarding and using features
 */

import { supabase } from '@/integrations/supabase/client';
import i18next from 'i18next';

export interface Achievement {
  id: string;
  nameKey: string;
  descriptionKey: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: 'onboarding' | 'usage' | 'milestone' | 'quality';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Badge {
  id: string;
  nameKey: string;
  descriptionKey: string;
  requirementKey: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
}

const t = (key: string) => i18next.t(key);

export function getAchievements(): Omit<Achievement, 'unlocked' | 'unlockedAt'>[] {
  return [
    { id: 'fast-start-complete', nameKey: 'gamification.fastStartComplete', descriptionKey: 'gamification.fastStartCompleteDesc', name: t('gamification.fastStartComplete'), description: t('gamification.fastStartCompleteDesc'), icon: '⚡', points: 100, category: 'onboarding', rarity: 'common' },
    { id: 'deep-setup-25', nameKey: 'gamification.gettingSerious', descriptionKey: 'gamification.gettingSeriousDesc', name: t('gamification.gettingSerious'), description: t('gamification.gettingSeriousDesc'), icon: '🎯', points: 150, category: 'onboarding', rarity: 'common' },
    { id: 'deep-setup-50', nameKey: 'gamification.halfwayThere', descriptionKey: 'gamification.halfwayThereDesc', name: t('gamification.halfwayThere'), description: t('gamification.halfwayThereDesc'), icon: '🚀', points: 300, category: 'onboarding', rarity: 'rare' },
    { id: 'deep-setup-75', nameKey: 'gamification.almostThere', descriptionKey: 'gamification.almostThereDesc', name: t('gamification.almostThere'), description: t('gamification.almostThereDesc'), icon: '💎', points: 500, category: 'onboarding', rarity: 'rare' },
    { id: 'deep-setup-100', nameKey: 'gamification.masterFounder', descriptionKey: 'gamification.masterFounderDesc', name: t('gamification.masterFounder'), description: t('gamification.masterFounderDesc'), icon: '👑', points: 1000, category: 'onboarding', rarity: 'legendary' },
    { id: 'first-regeneration', nameKey: 'gamification.contextBuilder', descriptionKey: 'gamification.contextBuilderDesc', name: t('gamification.contextBuilder'), description: t('gamification.contextBuilderDesc'), icon: '🔄', points: 200, category: 'usage', rarity: 'common' },
    { id: 'five-regenerations', nameKey: 'gamification.aiPowerUser', descriptionKey: 'gamification.aiPowerUserDesc', name: t('gamification.aiPowerUser'), description: t('gamification.aiPowerUserDesc'), icon: '⚡', points: 500, category: 'usage', rarity: 'rare' },
    { id: 'customer-interviews-5', nameKey: 'gamification.customerWhisperer', descriptionKey: 'gamification.customerWhispererDesc', name: t('gamification.customerWhisperer'), description: t('gamification.customerWhispererDesc'), icon: '🎤', points: 300, category: 'usage', rarity: 'common' },
    { id: 'deals-closed-10', nameKey: 'gamification.salesChampion', descriptionKey: 'gamification.salesChampionDesc', name: t('gamification.salesChampion'), description: t('gamification.salesChampionDesc'), icon: '💰', points: 500, category: 'usage', rarity: 'rare' },
    { id: 'first-100-visitors', nameKey: 'gamification.trafficStarter', descriptionKey: 'gamification.trafficStarterDesc', name: t('gamification.trafficStarter'), description: t('gamification.trafficStarterDesc'), icon: '📈', points: 250, category: 'milestone', rarity: 'common' },
    { id: 'first-1000-visitors', nameKey: 'gamification.trafficMaster', descriptionKey: 'gamification.trafficMasterDesc', name: t('gamification.trafficMaster'), description: t('gamification.trafficMasterDesc'), icon: '🚀', points: 750, category: 'milestone', rarity: 'epic' },
    { id: 'first-revenue', nameKey: 'gamification.moneyMaker', descriptionKey: 'gamification.moneyMakerDesc', name: t('gamification.moneyMaker'), description: t('gamification.moneyMakerDesc'), icon: '💵', points: 500, category: 'milestone', rarity: 'rare' },
    { id: 'context-quality-50', nameKey: 'gamification.qualityConscious', descriptionKey: 'gamification.qualityConsciousDesc', name: t('gamification.qualityConscious'), description: t('gamification.qualityConsciousDesc'), icon: '⭐', points: 200, category: 'quality', rarity: 'common' },
    { id: 'context-quality-100', nameKey: 'gamification.perfectionist', descriptionKey: 'gamification.perfectionistDesc', name: t('gamification.perfectionist'), description: t('gamification.perfectionistDesc'), icon: '🌟', points: 1000, category: 'quality', rarity: 'legendary' },
  ];
}

// Re-export for backward compat
export const ACHIEVEMENTS = getAchievements();

export function getBadges(): Badge[] {
  return [
    { id: 'intermediate', nameKey: 'gamification.badgeIntermediate', descriptionKey: 'gamification.badgeIntermediateDesc', requirementKey: 'gamification.progress50', name: t('gamification.badgeIntermediate'), description: t('gamification.badgeIntermediateDesc'), icon: '⭐', color: 'text-blue-600', requirement: t('gamification.progress50') },
    { id: 'advanced', nameKey: 'gamification.badgeAdvanced', descriptionKey: 'gamification.badgeAdvancedDesc', requirementKey: 'gamification.progress75', name: t('gamification.badgeAdvanced'), description: t('gamification.badgeAdvancedDesc'), icon: '⚡', color: 'text-purple-600', requirement: t('gamification.progress75') },
    { id: 'master', nameKey: 'gamification.badgeMaster', descriptionKey: 'gamification.badgeMasterDesc', requirementKey: 'gamification.progress100', name: t('gamification.badgeMaster'), description: t('gamification.badgeMasterDesc'), icon: '👑', color: 'text-yellow-600', requirement: t('gamification.progress100') },
    { id: 'speed-demon', nameKey: 'gamification.badgeSpeedDemon', descriptionKey: 'gamification.badgeSpeedDemonDesc', requirementKey: 'gamification.fastStart3min', name: t('gamification.badgeSpeedDemon'), description: t('gamification.badgeSpeedDemonDesc'), icon: '⚡', color: 'text-orange-600', requirement: t('gamification.fastStart3min') },
    { id: 'completionist', nameKey: 'gamification.badgeCompletionist', descriptionKey: 'gamification.badgeCompletionistDesc', requirementKey: 'gamification.allSectionsDone', name: t('gamification.badgeCompletionist'), description: t('gamification.badgeCompletionistDesc'), icon: '💯', color: 'text-green-600', requirement: t('gamification.allSectionsDone') },
  ];
}

export const BADGES = getBadges();

export class GamificationSystem {
  projectId: string;
  userId: string;

  constructor(projectId: string, userId: string) {
    this.projectId = projectId;
    this.userId = userId;
  }

  /**
   * Get user's current gamification data
   */
  async getGamificationData() {
    const { data, error } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', this.projectId)
      .single();

    if (error || !data) {
      return {
        points: 0,
        achievements: [],
        badges: [],
        level: 1,
      };
    }

    return data.metadata?.gamification || {
      points: 0,
      achievements: [],
      badges: [],
      level: 1,
    };
  }

  /**
   * Award points to user
   */
  async awardPoints(points: number, reason: string): Promise<void> {
    const gamData = await this.getGamificationData();
    const newPoints = gamData.points + points;
    const newLevel = this.calculateLevel(newPoints);

    const { data: project } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', this.projectId)
      .single();

    await supabase
      .from('projects')
      .update({
        metadata: {
          ...project?.metadata,
          gamification: {
            ...gamData,
            points: newPoints,
            level: newLevel,
            last_points_awarded: {
              amount: points,
              reason,
              timestamp: new Date().toISOString(),
            }
          }
        }
      })
      .eq('id', this.projectId);

  }

  /**
   * Unlock achievement
   */
  async unlockAchievement(achievementId: string): Promise<boolean> {
    const gamData = await this.getGamificationData();

    // Check if already unlocked
    if (gamData.achievements.some((a: Achievement) => a.id === achievementId)) {
      return false;
    }

    const achievement = getAchievements().find(a => a.id === achievementId);
    if (!achievement) return false;

    // Add achievement
    const unlockedAchievement = {
      ...achievement,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    };

    const { data: project } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', this.projectId)
      .single();

    await supabase
      .from('projects')
      .update({
        metadata: {
          ...project?.metadata,
          gamification: {
            ...gamData,
            achievements: [...gamData.achievements, unlockedAchievement],
            points: gamData.points + achievement.points,
          }
        }
      })
      .eq('id', this.projectId);

    return true;
  }

  /**
   * Award badge
   */
  async awardBadge(badgeId: string): Promise<boolean> {
    const gamData = await this.getGamificationData();

    // Check if already has badge
    if (gamData.badges.includes(badgeId)) {
      return false;
    }

    const { data: project } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', this.projectId)
      .single();

    await supabase
      .from('projects')
      .update({
        metadata: {
          ...project?.metadata,
          gamification: {
            ...gamData,
            badges: [...gamData.badges, badgeId],
          }
        }
      })
      .eq('id', this.projectId);

    return true;
  }

  /**
   * Calculate level from points (level up every 1000 points)
   */
  calculateLevel(points: number): number {
    return Math.floor(points / 1000) + 1;
  }

  /**
   * Check and award achievements based on progress
   */
  async checkProgressAchievements(progress: number): Promise<void> {
    if (progress >= 25) await this.unlockAchievement('fast-start-complete');
    if (progress >= 50) {
      await this.unlockAchievement('deep-setup-25');
      await this.awardBadge('intermediate');
    }
    if (progress >= 75) {
      await this.unlockAchievement('deep-setup-50');
      await this.awardBadge('advanced');
    }
    if (progress >= 90) await this.unlockAchievement('deep-setup-75');
    if (progress >= 100) {
      await this.unlockAchievement('deep-setup-100');
      await this.awardBadge('master');
      await this.awardBadge('completionist');
    }
  }

  /**
   * Get leaderboard (top users by points)
   */
  async getLeaderboard(limit: number = 10): Promise<{ rank: number; name: string; points: number; level: number; avatar: string }[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('id, metadata, profiles!projects_created_by_fkey(nombre, avatar)')
      .not('metadata', 'is', null)
      .limit(limit);

    if (error || !data) return [];

    return data
      .map((p: Record<string, unknown>) => {
        const gam = (p.metadata as Record<string, unknown>)?.gamification as Record<string, unknown> | undefined;
        const profile = p.profiles as Record<string, unknown> | null;
        return {
          rank: 0,
          name: (profile?.nombre as string) || t('gamification.founder'),
          points: (gam?.points as number) || 0,
          level: this.calculateLevel((gam?.points as number) || 0),
          avatar: (profile?.avatar as string) || '',
        };
      })
      .sort((a: { points: number }, b: { points: number }) => b.points - a.points)
      .map((entry: { rank: number; name: string; points: number; level: number; avatar: string }, idx: number) => ({ ...entry, rank: idx + 1 }));
  }
}
