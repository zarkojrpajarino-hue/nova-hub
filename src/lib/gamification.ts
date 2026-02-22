/**
 * 🏆 GAMIFICATION SYSTEM
 *
 * Points, badges, achievements, and leaderboards
 * Rewards users for completing onboarding and using features
 */

import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  id: string;
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
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
}

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Onboarding Achievements
  {
    id: 'fast-start-complete',
    name: 'Quick Starter',
    description: 'Completed Fast Start in under 5 minutes',
    icon: '⚡',
    points: 100,
    category: 'onboarding',
    rarity: 'common',
  },
  {
    id: 'deep-setup-25',
    name: 'Getting Serious',
    description: 'Completed 25% of Deep Setup',
    icon: '🎯',
    points: 150,
    category: 'onboarding',
    rarity: 'common',
  },
  {
    id: 'deep-setup-50',
    name: 'Halfway There',
    description: 'Completed 50% of Deep Setup',
    icon: '🚀',
    points: 300,
    category: 'onboarding',
    rarity: 'rare',
  },
  {
    id: 'deep-setup-75',
    name: 'Almost There',
    description: 'Completed 75% of Deep Setup',
    icon: '💎',
    points: 500,
    category: 'onboarding',
    rarity: 'rare',
  },
  {
    id: 'deep-setup-100',
    name: 'Master Founder',
    description: 'Completed 100% of Deep Setup',
    icon: '👑',
    points: 1000,
    category: 'onboarding',
    rarity: 'legendary',
  },

  // Usage Achievements
  {
    id: 'first-regeneration',
    name: 'Context Builder',
    description: 'Triggered your first AI regeneration',
    icon: '🔄',
    points: 200,
    category: 'usage',
    rarity: 'common',
  },
  {
    id: 'five-regenerations',
    name: 'AI Power User',
    description: 'Triggered 5 AI regenerations',
    icon: '⚡',
    points: 500,
    category: 'usage',
    rarity: 'rare',
  },
  {
    id: 'customer-interviews-5',
    name: 'Customer Whisperer',
    description: 'Conducted 5 customer interviews',
    icon: '🎤',
    points: 300,
    category: 'usage',
    rarity: 'common',
  },
  {
    id: 'deals-closed-10',
    name: 'Sales Champion',
    description: 'Closed 10 deals',
    icon: '💰',
    points: 500,
    category: 'usage',
    rarity: 'rare',
  },

  // Milestone Achievements
  {
    id: 'first-100-visitors',
    name: 'Traffic Starter',
    description: 'Reached 100 website visitors',
    icon: '📈',
    points: 250,
    category: 'milestone',
    rarity: 'common',
  },
  {
    id: 'first-1000-visitors',
    name: 'Traffic Master',
    description: 'Reached 1,000 website visitors',
    icon: '🚀',
    points: 750,
    category: 'milestone',
    rarity: 'epic',
  },
  {
    id: 'first-revenue',
    name: 'Money Maker',
    description: 'Generated first revenue',
    icon: '💵',
    points: 500,
    category: 'milestone',
    rarity: 'rare',
  },

  // Quality Achievements
  {
    id: 'context-quality-50',
    name: 'Quality Conscious',
    description: 'Reached 50% context quality score',
    icon: '⭐',
    points: 200,
    category: 'quality',
    rarity: 'common',
  },
  {
    id: 'context-quality-100',
    name: 'Perfectionist',
    description: 'Reached 100% context quality score',
    icon: '🌟',
    points: 1000,
    category: 'quality',
    rarity: 'legendary',
  },
];

export const BADGES: Badge[] = [
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Reached 50% onboarding progress',
    icon: '⭐',
    color: 'text-blue-600',
    requirement: '50% progress',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Reached 75% onboarding progress',
    icon: '⚡',
    color: 'text-purple-600',
    requirement: '75% progress',
  },
  {
    id: 'master',
    name: 'Master',
    description: 'Completed 100% of onboarding',
    icon: '👑',
    color: 'text-yellow-600',
    requirement: '100% progress',
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Completed Fast Start in under 3 minutes',
    icon: '⚡',
    color: 'text-orange-600',
    requirement: 'Fast Start < 3 min',
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Completed all Deep Setup sections',
    icon: '💯',
    color: 'text-green-600',
    requirement: 'All sections done',
  },
];

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

    console.log(`Awarded ${points} points for: ${reason}`);
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

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
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

    console.log(`Achievement unlocked: ${achievement.name} (+${achievement.points} points)`);
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

    console.log(`Badge awarded: ${badgeId}`);
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
    // In a real implementation, this would query across all users
    // For now, just return mock data
    return [
      { rank: 1, name: 'You', points: 2500, level: 3, avatar: '🏆' },
      { rank: 2, name: 'Founder A', points: 2100, level: 3, avatar: '⭐' },
      { rank: 3, name: 'Founder B', points: 1800, level: 2, avatar: '🚀' },
    ];
  }
}
