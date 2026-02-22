/**
 * 🔐 SUBSCRIPTION HOOKS (CORRECTED)
 *
 * Modelo: Plan-per-project with 1 FREE TRIAL per email
 * - User can create UNLIMITED projects
 * - Only 1 free trial per email (has_used_free_trial flag)
 * - Each project has its own plan (Starter/Pro/Enterprise)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo, useCallback } from 'react';
import { isPaymentsEnabled } from '@/config/features';

// =====================================================
// TYPES
// =====================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly_eur: number;
  price_yearly_eur: number;
  trial_days: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  stripe_product_id: string | null;
  max_members: number | null;
  max_tasks: number | null;
  max_leads: number | null;
  max_obvs: number | null;
  max_storage_mb: number | null;
  ai_role_generation: boolean;
  ai_task_generation: boolean;
  ai_logo_generation: boolean;
  ai_buyer_persona: boolean;
  advanced_analytics: boolean;
  custom_branding: boolean;
  api_access: boolean;
  priority_support: boolean;
  white_label: boolean;
  custom_domain: boolean;
  recommended: boolean;
  popular: boolean;
  display_order: number;
}

export interface ProjectSubscription {
  id: string;
  project_id: string;
  plan_id: string;
  owner_id: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_members_count: number;
  current_tasks_count: number;
  current_leads_count: number;
  current_obvs_count: number;
  current_storage_mb: number;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface UserAccountLimits {
  user_id: string;
  has_used_free_trial: boolean; // KEY: Only 1 free trial allowed
  free_trial_used_at: string | null;
  stripe_customer_id: string | null;
  payment_method_verified: boolean;
  blocked: boolean;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOK: useSubscriptionPlans
// =====================================================

/**
 * Get all available subscription plans
 * Optionally hide free trial if user already used it
 */
export function useSubscriptionPlans(options?: {
  includeTrial?: boolean;
}) {
  const { data: limits } = useUserLimits();

  return useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;

      // Filter out free trial if user already used it
      if (options?.includeTrial === false && limits?.has_used_free_trial) {
        return data.filter(plan => plan.id !== 'free_trial');
      }

      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour (plans don't change often)
  });
}

/**
 * Get available plans for a specific user
 * Automatically filters free trial if already used
 */
export function useAvailablePlans() {
  const { data: limits } = useUserLimits();
  const { data: allPlans = [] } = useSubscriptionPlans();

  return useMemo(() => {
    if (!limits) return allPlans;

    // If user already used free trial, exclude it
    if (limits.has_used_free_trial) {
      return allPlans.filter(plan => plan.id !== 'free_trial');
    }

    return allPlans;
  }, [allPlans, limits]);
}

// =====================================================
// HOOK: useProjectPlan
// =====================================================

/**
 * Get the subscription plan for a specific project
 */
export function useProjectPlan(projectId: string | undefined) {
  return useQuery<ProjectSubscription | null>({
    queryKey: ['project-subscription', projectId],
    queryFn: async () => {
      // 🎯 FEATURE FLAG: If payments disabled, don't query subscriptions
      if (!isPaymentsEnabled()) {
        console.log('💰 useProjectPlan: Payments disabled, returning null (full access)');
        return null;
      }

      if (!projectId) return null;

      console.log('🔍 useProjectPlan: Fetching subscription for project:', projectId);

      const { data, error } = await supabase
        .from('project_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('project_id', projectId)
        .single();

      console.log('🔍 useProjectPlan: Result:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('⚠️ useProjectPlan: No subscription found for project');
          return null; // Not found
        }
        console.error('❌ useProjectPlan: Error:', error);
        throw error;
      }

      console.log('✅ useProjectPlan: Subscription loaded:', data);
      return data as ProjectSubscription;
    },
    enabled: !!projectId && isPaymentsEnabled(), // Only query if payments are enabled
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// =====================================================
// HOOK: useUserLimits
// =====================================================

/**
 * Get user account limits
 * Main purpose: Check if user has already used free trial
 */
export function useUserLimits() {
  const { user } = useAuth();

  return useQuery<UserAccountLimits | null>({
    queryKey: ['user-limits', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_account_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Create limits if they don't exist (shouldn't happen with trigger)
          const { data: newLimits, error: createError } = await supabase
            .from('user_account_limits')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (createError) throw createError;
          return newLimits;
        }
        throw error;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });
}

// =====================================================
// HOOK: useCanUsFreeTrial
// =====================================================

/**
 * Check if user can use free trial
 * Returns false if already used
 */
export function useCanUseFreeTrial() {
  const { data: limits, isLoading } = useUserLimits();

  return useMemo(() => {
    if (isLoading) return { canUse: false, loading: true };

    if (!limits) return { canUse: true, loading: false };

    if (limits.blocked) {
      return {
        canUse: false,
        loading: false,
        reason: limits.blocked_reason || 'Cuenta bloqueada',
      };
    }

    // Main logic: Can use if hasn't used it yet
    return {
      canUse: !limits.has_used_free_trial,
      loading: false,
      reason: limits.has_used_free_trial
        ? 'Ya has usado tu período de prueba gratuito. Selecciona un plan de pago.'
        : undefined,
    };
  }, [limits, isLoading]);
}

// =====================================================
// HOOK: useFeatureAccess
// =====================================================

/**
 * Check feature access based on project plan
 */
export function useFeatureAccess(projectId: string | undefined) {
  const { data: subscription, isLoading } = useProjectPlan(projectId);

  const canUseFeature = useCallback(
    (feature: keyof SubscriptionPlan): boolean => {
      // 🎯 FEATURE FLAG: If payments disabled, all features are available
      if (!isPaymentsEnabled()) {
        return true;
      }

      if (!subscription || subscription.status === 'expired') return false;
      if (!subscription.plan) return false;

      return !!subscription.plan[feature];
    },
    [subscription]
  );

  const isNearLimit = useCallback(
    (resource: 'members' | 'tasks' | 'leads' | 'obvs'): boolean => {
      // 🎯 FEATURE FLAG: If payments disabled, never near limit
      if (!isPaymentsEnabled()) {
        return false;
      }

      if (!subscription?.plan) return false;

      let current = 0;
      let max: number | null = null;

      switch (resource) {
        case 'members':
          current = subscription.current_members_count;
          max = subscription.plan.max_members;
          break;
        case 'tasks':
          current = subscription.current_tasks_count;
          max = subscription.plan.max_tasks;
          break;
        case 'leads':
          current = subscription.current_leads_count;
          max = subscription.plan.max_leads;
          break;
        case 'obvs':
          current = subscription.current_obvs_count;
          max = subscription.plan.max_obvs;
          break;
      }

      if (max === null) return false; // Unlimited

      return (current / max) >= 0.8; // 80% or more
    },
    [subscription]
  );

  const hasReachedLimit = useCallback(
    (resource: 'members' | 'tasks' | 'leads' | 'obvs'): boolean => {
      // 🎯 FEATURE FLAG: If payments disabled, never reach limits
      if (!isPaymentsEnabled()) {
        return false;
      }

      if (!subscription?.plan) return true;

      let current = 0;
      let max: number | null = null;

      switch (resource) {
        case 'members':
          current = subscription.current_members_count;
          max = subscription.plan.max_members;
          break;
        case 'tasks':
          current = subscription.current_tasks_count;
          max = subscription.plan.max_tasks;
          break;
        case 'leads':
          current = subscription.current_leads_count;
          max = subscription.plan.max_leads;
          break;
        case 'obvs':
          current = subscription.current_obvs_count;
          max = subscription.plan.max_obvs;
          break;
      }

      if (max === null) return false; // Unlimited

      return current >= max;
    },
    [subscription]
  );

  const getLimitInfo = useCallback(
    (resource: 'members' | 'tasks' | 'leads' | 'obvs'): {
      current: number;
      max: number | null;
      percentage: number;
      isUnlimited: boolean;
    } => {
      // 🎯 FEATURE FLAG: If payments disabled, everything is unlimited
      if (!isPaymentsEnabled()) {
        return { current: 0, max: null, percentage: 0, isUnlimited: true };
      }

      if (!subscription?.plan) {
        return { current: 0, max: 0, percentage: 0, isUnlimited: false };
      }

      let current = 0;
      let max: number | null = null;

      switch (resource) {
        case 'members':
          current = subscription.current_members_count;
          max = subscription.plan.max_members;
          break;
        case 'tasks':
          current = subscription.current_tasks_count;
          max = subscription.plan.max_tasks;
          break;
        case 'leads':
          current = subscription.current_leads_count;
          max = subscription.plan.max_leads;
          break;
        case 'obvs':
          current = subscription.current_obvs_count;
          max = subscription.plan.max_obvs;
          break;
      }

      const isUnlimited = max === null;
      const percentage = isUnlimited || max === 0 ? 0 : (current / max) * 100;

      return { current, max, percentage, isUnlimited };
    },
    [subscription]
  );

  return {
    subscription,
    plan: subscription?.plan,
    canUseFeature,
    isNearLimit,
    hasReachedLimit,
    getLimitInfo,
    isTrial: subscription?.status === 'trial',
    isExpired: subscription?.status === 'expired',
    isPastDue: subscription?.status === 'past_due',
    isActive: subscription?.status === 'active',
    isLoading,
  };
}

// =====================================================
// HOOK: useTrialStatus
// =====================================================

/**
 * Get trial status for a project
 */
export function useTrialStatus(projectId: string | undefined) {
  const { data: subscription } = useProjectPlan(projectId);

  return useMemo(() => {
    if (!subscription || subscription.status !== 'trial') {
      return {
        isTrial: false,
        daysLeft: 0,
        isExpiringSoon: false,
        trialEndsAt: null,
      };
    }

    const now = new Date();
    const endsAt = new Date(subscription.trial_ends_at!);
    const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysLeft <= 3;

    return {
      isTrial: true,
      daysLeft: Math.max(0, daysLeft),
      isExpiringSoon,
      trialEndsAt: endsAt,
    };
  }, [subscription]);
}

// =====================================================
// MUTATION: createProjectWithSubscription
// =====================================================

interface CreateProjectInput {
  nombre: string;
  descripcion?: string;
  work_mode: 'individual' | 'team_small' | 'team_established' | 'no_roles';
  business_idea?: string;
  industry?: string;
  plan_id: string; // Required: Must select plan BEFORE creating
  billing_cycle?: 'monthly' | 'yearly';
}

/**
 * Create project with subscription
 * Plan selection happens BEFORE this is called
 */
export function useCreateProjectWithSubscription() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      if (!profile) throw new Error('User not authenticated');

      // 1. Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          nombre: input.nombre,
          descripcion: input.descripcion,
          work_mode: input.work_mode,
          business_idea: input.business_idea,
          industry: input.industry,
          owner_id: profile.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Create subscription
      const isTrial = input.plan_id === 'free_trial';
      const trialEndsAt = isTrial ? new Date() : null;
      if (trialEndsAt) {
        trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days
      }

      const { error: subError } = await supabase
        .from('project_subscriptions')
        .insert({
          project_id: project.id,
          plan_id: input.plan_id,
          owner_id: profile.id,
          status: isTrial ? 'trial' : 'active',
          billing_cycle: input.billing_cycle || 'monthly',
          trial_started_at: isTrial ? new Date().toISOString() : null,
          trial_ends_at: trialEndsAt?.toISOString() || null,
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndsAt?.toISOString() || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        });

      if (subError) throw subError;

      // 3. Add owner as admin
      await supabase.from('project_members').insert({
        project_id: project.id,
        member_id: profile.id,
        role: 'admin',
      });

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-limits'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['user-projects'] });
    },
  });
}

// =====================================================
// EXPORTS
// =====================================================
