/**
 * 🧠 CONTEXT AGGREGATOR
 *
 * Tracks accumulated context and triggers AI regeneration when thresholds are met
 *
 * TRIGGERS:
 * - 5 customer interviews → Regenerate Buyer Personas
 * - 100 website visitors → Regenerate Value Proposition
 * - 10 deals closed → Regenerate Sales Playbook
 * - 3 months of revenue data → Regenerate Financial Projections
 * - 5 competitor changes → Regenerate Competitive Analysis
 */

import { supabase } from '@/integrations/supabase/client';

export interface ContextData {
  project_id: string;
  customer_interviews?: number;
  website_visitors?: number;
  deals_closed?: number;
  revenue_months?: number;
  competitor_changes?: number;
  validation_experiments?: number;
  team_size?: number;
  last_regeneration?: string;
}

export interface RegenerationTrigger {
  id: string;
  name: string;
  description: string;
  metric: keyof ContextData;
  threshold: number;
  artifact_type: string;
  icon: string;
  color: string;
}

export const REGENERATION_TRIGGERS: RegenerationTrigger[] = [
  {
    id: 'buyer-personas',
    name: 'Buyer Personas Regeneration',
    description: 'Update personas with real customer interview insights',
    metric: 'customer_interviews',
    threshold: 5,
    artifact_type: 'buyer_personas',
    icon: '👥',
    color: 'blue',
  },
  {
    id: 'value-proposition',
    name: 'Value Proposition Refinement',
    description: 'Refine value prop based on actual visitor behavior',
    metric: 'website_visitors',
    threshold: 100,
    artifact_type: 'value_proposition',
    icon: '💎',
    color: 'purple',
  },
  {
    id: 'sales-playbook',
    name: 'Sales Playbook Update',
    description: 'Improve playbook with real sales conversations',
    metric: 'deals_closed',
    threshold: 10,
    artifact_type: 'sales_playbook',
    icon: '📈',
    color: 'green',
  },
  {
    id: 'financial-projections',
    name: 'Financial Projections Refresh',
    description: 'Update projections with actual revenue data',
    metric: 'revenue_months',
    threshold: 3,
    artifact_type: 'financial_projections',
    icon: '💰',
    color: 'yellow',
  },
  {
    id: 'competitive-analysis',
    name: 'Competitive Analysis Update',
    description: 'Refresh competitive landscape insights',
    metric: 'competitor_changes',
    threshold: 5,
    artifact_type: 'competitive_analysis',
    icon: '⚔️',
    color: 'red',
  },
  {
    id: 'validation-insights',
    name: 'Validation Insights',
    description: 'Generate insights from validation experiments',
    metric: 'validation_experiments',
    threshold: 3,
    artifact_type: 'validation_insights',
    icon: '🧪',
    color: 'cyan',
  },
];

export class ContextAggregator {
  projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Get current context data for project
   */
  async getContext(): Promise<ContextData | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', this.projectId)
      .single();

    if (error || !data) {
      console.error('Error loading context:', error);
      return null;
    }

    return data.metadata?.context_data || {
      project_id: this.projectId,
      customer_interviews: 0,
      website_visitors: 0,
      deals_closed: 0,
      revenue_months: 0,
      competitor_changes: 0,
      validation_experiments: 0,
      team_size: 1,
    };
  }

  /**
   * Update context data
   */
  async updateContext(updates: Partial<ContextData>): Promise<void> {
    const currentContext = await this.getContext();
    if (!currentContext) return;

    const newContext = { ...currentContext, ...updates };

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
          context_data: newContext,
          context_updated_at: new Date().toISOString(),
        }
      })
      .eq('id', this.projectId);
  }

  /**
   * Increment a context metric
   */
  async incrementMetric(metric: keyof ContextData, amount: number = 1): Promise<void> {
    const context = await this.getContext();
    if (!context) return;

    const currentValue = (context[metric] as number) || 0;
    await this.updateContext({ [metric]: currentValue + amount });

    // Check if any triggers should fire
    await this.checkTriggers();
  }

  /**
   * Check which triggers are ready to fire
   */
  async getReadyTriggers(): Promise<RegenerationTrigger[]> {
    const context = await this.getContext();
    if (!context) return [];

    const ready: RegenerationTrigger[] = [];

    for (const trigger of REGENERATION_TRIGGERS) {
      const currentValue = (context[trigger.metric] as number) || 0;
      if (currentValue >= trigger.threshold) {
        ready.push(trigger);
      }
    }

    return ready;
  }

  /**
   * Get progress towards triggers
   */
  async getTriggerProgress(): Promise<Array<{
    trigger: RegenerationTrigger;
    current: number;
    threshold: number;
    percentage: number;
    ready: boolean;
  }>> {
    const context = await this.getContext();
    if (!context) return [];

    return REGENERATION_TRIGGERS.map(trigger => {
      const current = (context[trigger.metric] as number) || 0;
      const percentage = Math.min((current / trigger.threshold) * 100, 100);
      const ready = current >= trigger.threshold;

      return {
        trigger,
        current,
        threshold: trigger.threshold,
        percentage,
        ready,
      };
    });
  }

  /**
   * Check triggers and create notifications if needed
   */
  async checkTriggers(): Promise<void> {
    const readyTriggers = await this.getReadyTriggers();

    if (readyTriggers.length === 0) return;

    // Get current project metadata
    const { data: project } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', this.projectId)
      .single();

    const firedTriggers = project?.metadata?.fired_triggers || [];

    // Only notify for triggers that haven't been fired yet
    const newTriggers = readyTriggers.filter(
      t => !firedTriggers.includes(t.id)
    );

    if (newTriggers.length > 0) {
      // Mark triggers as fired
      await supabase
        .from('projects')
        .update({
          metadata: {
            ...project?.metadata,
            fired_triggers: [...firedTriggers, ...newTriggers.map(t => t.id)],
            pending_regenerations: newTriggers.map(t => t.id),
          }
        })
        .eq('id', this.projectId);

      // Could also create a notification in notifications table here
      console.log('Triggers ready:', newTriggers);
    }
  }

  /**
   * Mark a trigger as regenerated
   */
  async markRegenerated(triggerId: string): Promise<void> {
    const { data: project } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', this.projectId)
      .single();

    const pendingRegenerations = project?.metadata?.pending_regenerations || [];
    const completedRegenerations = project?.metadata?.completed_regenerations || [];

    await supabase
      .from('projects')
      .update({
        metadata: {
          ...project?.metadata,
          pending_regenerations: pendingRegenerations.filter((id: string) => id !== triggerId),
          completed_regenerations: [...completedRegenerations, triggerId],
          [`${triggerId}_regenerated_at`]: new Date().toISOString(),
        }
      })
      .eq('id', this.projectId);
  }

  /**
   * Get context quality score (0-100)
   */
  async getContextQualityScore(): Promise<number> {
    const context = await this.getContext();
    if (!context) return 0;

    let score = 0;
    let maxScore = 0;

    for (const trigger of REGENERATION_TRIGGERS) {
      const current = (context[trigger.metric] as number) || 0;
      const percentage = Math.min((current / trigger.threshold) * 100, 100);

      score += percentage;
      maxScore += 100;
    }

    return Math.round((score / maxScore) * 100);
  }
}
