/**
 * ai-anomaly-detection — V5.6.7
 *
 * Checks key_metrics history for anomalies:
 * - MRR drop >20%
 * - CAC spike
 * - Churn jump
 *
 * No LLM call — pure algorithmic detection on key_metrics rows.
 * Returns { anomalies: Array<{ metric, change_pct, severity }> }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';

interface Anomaly {
  metric: string;
  previous_value: number;
  current_value: number;
  change_pct: number;
  severity: 'warning' | 'critical';
  detected_at: string;
}

// Thresholds for anomaly detection
const THRESHOLDS: Record<string, { warningPct: number; criticalPct: number; direction: 'drop' | 'spike' }> = {
  mrr:                 { warningPct: 10, criticalPct: 20, direction: 'drop' },
  cac:                 { warningPct: 30, criticalPct: 50, direction: 'spike' },
  churn_rate:          { warningPct: 25, criticalPct: 50, direction: 'spike' },
  burn_rate:           { warningPct: 30, criticalPct: 50, direction: 'spike' },
  runway_months:       { warningPct: 25, criticalPct: 40, direction: 'drop' },
  active_users:        { warningPct: 15, criticalPct: 30, direction: 'drop' },
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  try {
    const { user, serviceClient: supabase } = await validateAuth(req);

    // V5.6.14 — Per-function rate limit
    const rl = await checkRateLimit(`ai_fn_anomaly_${user.id}`, 'ai-anomaly-detection', RateLimitPresets.DATA_READ);
    if (!rl.allowed) return createRateLimitResponse(rl, getCorsHeaders(origin));

    const { project_id } = await req.json() as { project_id: string };
    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    await verifyProjectMembership(supabase, user.id, project_id, origin);

    // Fetch last 60 days of key_metrics ordered by date
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);
    const { data: metrics } = await supabase
      .from('key_metrics')
      .select('date, mrr, cac, churn_rate, burn_rate, runway_months, active_users')
      .eq('project_id', project_id)
      .gte('date', sixtyDaysAgo)
      .order('date', { ascending: true });

    if (!metrics || metrics.length < 2) {
      return new Response(JSON.stringify({ anomalies: [], message: 'Not enough data points' }), {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    // Compare last two data points for each metric
    const anomalies: Anomaly[] = [];
    const latest = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];

    for (const [metric, config] of Object.entries(THRESHOLDS)) {
      const currentVal = (latest as Record<string, unknown>)[metric] as number | null;
      const prevVal = (previous as Record<string, unknown>)[metric] as number | null;

      if (currentVal == null || prevVal == null || prevVal === 0) continue;

      const changePct = ((currentVal - prevVal) / Math.abs(prevVal)) * 100;

      // Check direction
      const isAnomaly = config.direction === 'drop'
        ? changePct < -config.warningPct
        : changePct > config.warningPct;

      if (!isAnomaly) continue;

      const isCritical = config.direction === 'drop'
        ? changePct < -config.criticalPct
        : changePct > config.criticalPct;

      anomalies.push({
        metric,
        previous_value: prevVal,
        current_value: currentVal,
        change_pct: Math.round(changePct * 10) / 10,
        severity: isCritical ? 'critical' : 'warning',
        detected_at: latest.date,
      });
    }

    // Sort: critical first
    anomalies.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return Math.abs(b.change_pct) - Math.abs(a.change_pct);
    });

    return new Response(JSON.stringify({ anomalies, data_points: metrics.length }), {
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
    });

  } catch (error) {
    if (error instanceof Response) return error;
    console.error('ai-anomaly-detection error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin ?? '') },
    });
  }
});
