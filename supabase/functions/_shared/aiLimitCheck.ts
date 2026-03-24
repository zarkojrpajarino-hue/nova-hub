/**
 * V4.5.5 — AI Call Limit Check (Edge Function side)
 *
 * Before each AI call, check the count of calls this month against the plan limit.
 * Uses the project's subscription plan to resolve the limit.
 *
 * PLAN_TIERS limits (duplicated here to avoid cross-import from frontend):
 *   free:  20 AI calls/month
 *   pro:   100
 *   scale: 500
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from './cors-config.ts';

// Mirror of PLAN_TIERS.aiCalls from src/config/features.ts
const AI_CALL_LIMITS: Record<string, number> = {
  free: 20,
  starter: 20,
  free_trial: 20,
  pro: 100,
  scale: 500,
  enterprise: 500,
  advanced: 500,
};

/**
 * Gets the start of the current billing month (UTC).
 */
function getStartOfMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Resolves the AI call limit for a project based on its subscription plan.
 * Returns -1 if unlimited (shouldn't happen with current tiers).
 */
async function resolveProjectAILimit(
  serviceClient: SupabaseClient,
  projectId: string
): Promise<number> {
  const { data: sub } = await serviceClient
    .from('project_subscriptions')
    .select('plan_id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (!sub?.plan_id) return AI_CALL_LIMITS.free; // No subscription = free tier

  const planKey = sub.plan_id.toLowerCase();

  // Try direct match first, then fuzzy
  if (AI_CALL_LIMITS[planKey] !== undefined) return AI_CALL_LIMITS[planKey];
  if (planKey.includes('scale') || planKey.includes('enterprise') || planKey.includes('advanced')) return AI_CALL_LIMITS.scale;
  if (planKey.includes('pro')) return AI_CALL_LIMITS.pro;

  return AI_CALL_LIMITS.free;
}

export interface AILimitCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Checks whether the project has remaining AI calls for the current billing period.
 *
 * @param serviceClient - Supabase client with service role (bypasses RLS)
 * @param projectId - The project to check
 * @returns { allowed, used, limit, remaining }
 */
export async function checkAICallLimit(
  serviceClient: SupabaseClient,
  projectId: string
): Promise<AILimitCheckResult> {
  const startOfMonth = getStartOfMonth();
  const limit = await resolveProjectAILimit(serviceClient, projectId);

  // Count calls this month
  const { count, error } = await serviceClient
    .from('ai_generations_log')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', startOfMonth);

  if (error) {
    console.error('[aiLimitCheck] Error counting calls:', error);
    // Fail open: allow the call but log the error
    return { allowed: true, used: 0, limit, remaining: limit };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
  };
}

/**
 * Enforces the AI call limit. If exceeded, throws a Response(429).
 * Call this BEFORE making the LLM request.
 */
export async function enforceAICallLimit(
  serviceClient: SupabaseClient,
  projectId: string,
  origin: string | null
): Promise<AILimitCheckResult> {
  const result = await checkAICallLimit(serviceClient, projectId);

  if (!result.allowed) {
    throw new Response(
      JSON.stringify({
        error: 'AI call limit reached',
        used: result.used,
        limit: result.limit,
        message: `Monthly AI call limit (${result.limit}) reached. Upgrade your plan for more.`,
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      }
    );
  }

  return result;
}
