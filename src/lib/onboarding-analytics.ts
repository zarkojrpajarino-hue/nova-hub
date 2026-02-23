/**
 * 📊 ONBOARDING ANALYTICS
 *
 * Track user behavior, completion rates, and optimization metrics
 * Helps identify drop-off points and improve conversion
 */

import { supabase } from '@/integrations/supabase/client';

export interface OnboardingEvent {
  event_type: string;
  project_id: string;
  user_id: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface OnboardingMetrics {
  total_starts: number;
  fast_start_completions: number;
  deep_setup_completions: number;
  fast_start_completion_rate: number;
  deep_setup_completion_rate: number;
  average_fast_start_time: number; // in seconds
  average_deep_setup_time: number;
  drop_off_points: Array<{
    step: string;
    count: number;
    percentage: number;
  }>;
  popular_sections: Array<{
    section_id: string;
    completions: number;
  }>;
}

/**
 * Event types for analytics tracking
 */
export const OnboardingEvents = {
  // Type Selection
  TYPE_SELECTED: 'onboarding.type_selected',

  // Fast Start
  FAST_START_STARTED: 'onboarding.fast_start_started',
  FAST_START_COMPLETED: 'onboarding.fast_start_completed',
  FAST_START_ABANDONED: 'onboarding.fast_start_abandoned',

  // Deep Setup
  DEEP_SETUP_ACCESSED: 'onboarding.deep_setup_accessed',
  DEEP_SETUP_SECTION_STARTED: 'onboarding.deep_setup_section_started',
  DEEP_SETUP_SECTION_COMPLETED: 'onboarding.deep_setup_section_completed',
  DEEP_SETUP_COMPLETED: 'onboarding.deep_setup_completed',

  // Regeneration
  REGENERATION_TRIGGERED: 'onboarding.regeneration_triggered',
  REGENERATION_COMPLETED: 'onboarding.regeneration_completed',

  // Gamification
  ACHIEVEMENT_UNLOCKED: 'onboarding.achievement_unlocked',
  BADGE_EARNED: 'onboarding.badge_earned',
  LEVEL_UP: 'onboarding.level_up',
} as const;

export class OnboardingAnalytics {
  projectId: string;
  userId: string;

  constructor(projectId: string, userId: string) {
    this.projectId = projectId;
    this.userId = userId;
  }

  /**
   * Track an onboarding event
   */
  async trackEvent(
    eventType: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const event: OnboardingEvent = {
      event_type: eventType,
      project_id: this.projectId,
      user_id: this.userId,
      metadata,
      timestamp: new Date().toISOString(),
    };

    // Store in project metadata for analytics
    const { data: project } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', this.projectId)
      .single();

    const events = project?.metadata?.onboarding_events || [];
    events.push(event);

    await supabase
      .from('projects')
      .update({
        metadata: {
          ...project?.metadata,
          onboarding_events: events,
        }
      })
      .eq('id', this.projectId);

    // Also log to console for debugging
  }

  /**
   * Track Fast Start timing
   */
  async trackFastStartTiming(startTime: number, endTime: number): Promise<void> {
    const duration = (endTime - startTime) / 1000; // in seconds

    await this.trackEvent(OnboardingEvents.FAST_START_COMPLETED, {
      duration_seconds: duration,
      duration_minutes: Math.round(duration / 60 * 10) / 10,
      timestamp_start: new Date(startTime).toISOString(),
      timestamp_end: new Date(endTime).toISOString(),
    });

    // Award speed demon badge if under 3 minutes
    if (duration < 180) {
      await this.trackEvent(OnboardingEvents.BADGE_EARNED, {
        badge_id: 'speed-demon',
        reason: 'Fast Start completed in under 3 minutes',
      });
    }
  }

  /**
   * Track Deep Setup section progress
   */
  async trackSectionProgress(
    sectionId: string,
    status: 'started' | 'completed' | 'abandoned'
  ): Promise<void> {
    const eventType = status === 'started'
      ? OnboardingEvents.DEEP_SETUP_SECTION_STARTED
      : status === 'completed'
      ? OnboardingEvents.DEEP_SETUP_SECTION_COMPLETED
      : OnboardingEvents.FAST_START_ABANDONED;

    await this.trackEvent(eventType, {
      section_id: sectionId,
      status,
    });
  }

  /**
   * Calculate onboarding metrics
   */
  async getMetrics(): Promise<OnboardingMetrics> {
    const { data: projects } = await supabase
      .from('projects')
      .select('metadata')
      .not('metadata', 'is', null);

    if (!projects || projects.length === 0) {
      return {
        total_starts: 0,
        fast_start_completions: 0,
        deep_setup_completions: 0,
        fast_start_completion_rate: 0,
        deep_setup_completion_rate: 0,
        average_fast_start_time: 0,
        average_deep_setup_time: 0,
        drop_off_points: [],
        popular_sections: [],
      };
    }

    let totalStarts = 0;
    let fastStartCompletions = 0;
    let deepSetupCompletions = 0;
    let totalFastStartTime = 0;
    let fastStartTimeCount = 0;

    const sectionCompletions: Record<string, number> = {};

    projects.forEach(project => {
      const metadata = project.metadata;

      // Count starts
      if (metadata?.onboarding_type) {
        totalStarts++;
      }

      // Count Fast Start completions
      if (metadata?.fast_start_completed) {
        fastStartCompletions++;
      }

      // Count Deep Setup completions
      if (metadata?.onboarding_progress === 100) {
        deepSetupCompletions++;
      }

      // Calculate Fast Start timing
      const events = metadata?.onboarding_events || [];
      const fastStartEvent = events.find((e: OnboardingEvent) =>
        e.event_type === OnboardingEvents.FAST_START_COMPLETED
      );
      if (fastStartEvent?.metadata?.duration_seconds) {
        totalFastStartTime += fastStartEvent.metadata.duration_seconds;
        fastStartTimeCount++;
      }

      // Count section completions
      const completedSections = metadata?.completed_sections || [];
      completedSections.forEach((sectionId: string) => {
        sectionCompletions[sectionId] = (sectionCompletions[sectionId] || 0) + 1;
      });
    });

    const popularSections = Object.entries(sectionCompletions)
      .map(([section_id, completions]) => ({ section_id, completions }))
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 10);

    return {
      total_starts: totalStarts,
      fast_start_completions: fastStartCompletions,
      deep_setup_completions: deepSetupCompletions,
      fast_start_completion_rate: totalStarts > 0
        ? Math.round((fastStartCompletions / totalStarts) * 100)
        : 0,
      deep_setup_completion_rate: fastStartCompletions > 0
        ? Math.round((deepSetupCompletions / fastStartCompletions) * 100)
        : 0,
      average_fast_start_time: fastStartTimeCount > 0
        ? Math.round(totalFastStartTime / fastStartTimeCount)
        : 0,
      average_deep_setup_time: 0, // TODO: implement
      drop_off_points: [], // TODO: implement
      popular_sections: popularSections,
    };
  }

  /**
   * Get funnel data (for visualization)
   */
  async getFunnelData(): Promise<Array<{
    stage: string;
    users: number;
    percentage: number;
  }>> {
    const metrics = await this.getMetrics();

    return [
      {
        stage: 'Started Onboarding',
        users: metrics.total_starts,
        percentage: 100,
      },
      {
        stage: 'Completed Fast Start',
        users: metrics.fast_start_completions,
        percentage: metrics.fast_start_completion_rate,
      },
      {
        stage: 'Accessed Deep Setup',
        users: Math.round(metrics.fast_start_completions * 0.6), // estimate
        percentage: Math.round(metrics.fast_start_completion_rate * 0.6),
      },
      {
        stage: 'Completed Deep Setup',
        users: metrics.deep_setup_completions,
        percentage: metrics.deep_setup_completion_rate,
      },
    ];
  }

  /**
   * Track A/B test variant
   */
  async trackVariant(testName: string, variant: string): Promise<void> {
    await this.trackEvent('ab_test.variant_assigned', {
      test_name: testName,
      variant,
    });
  }

  /**
   * Track conversion event
   */
  async trackConversion(goalName: string, value?: number): Promise<void> {
    await this.trackEvent('conversion', {
      goal_name: goalName,
      value,
    });
  }
}

/**
 * Helper to initialize analytics for a project
 */
export function useOnboardingAnalytics(projectId: string, userId: string) {
  return new OnboardingAnalytics(projectId, userId);
}

/**
 * Global analytics metrics dashboard data
 */
export async function getGlobalOnboardingMetrics(): Promise<OnboardingMetrics> {
  // This would aggregate data across all projects
  // For now, use a single project's analytics
  const analytics = new OnboardingAnalytics('global', 'system');
  return analytics.getMetrics();
}
