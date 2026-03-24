/**
 * V4.8.1 — GENERATE INVESTOR UPDATE
 *
 * Generates a monthly investor update email using Phase Engine data:
 *   - Current phase + score
 *   - Key metrics (MRR, customers, runway)
 *   - Milestones achieved this month
 *   - Next month priorities
 *
 * Input: { project_id }
 * Output: { subject, body_html, body_text, highlights, metrics }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth, verifyProjectMembership } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse } from '../_shared/rate-limiter-persistent.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    const { project_id } = await req.json();
    if (!project_id) throw new Error('project_id is required');

    const { user, serviceClient: supabase } = await validateAuth(req);
    await verifyProjectMembership(supabase, user.id, project_id, req);

    const rateLimitResult = await checkRateLimit(user.id, 'generate-investor-update', {
      maxRequests: 3,
      windowMs: 3600_000,
    });
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    // Gather context
    const [projectResult, phaseResult, metricsResult, tasksResult, obvsResult] = await Promise.all([
      supabase.from('projects').select('nombre, metadata').eq('id', project_id).single(),
      supabase.from('project_phase_state').select('*').eq('project_id', project_id).single(),
      supabase
        .from('key_metrics')
        .select('*')
        .eq('project_id', project_id)
        .order('date', { ascending: false })
        .limit(2),
      supabase
        .from('tasks')
        .select('titulo, status')
        .eq('project_id', project_id)
        .eq('status', 'done')
        .gte('updated_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
        .limit(10),
      supabase
        .from('obvs')
        .select('titulo, tipo, obv_outcome')
        .eq('project_id', project_id)
        .gte('created_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
        .limit(10),
    ]);

    const project = projectResult.data;
    const phase = phaseResult.data;
    const metrics = metricsResult.data ?? [];
    const tasks = tasksResult.data ?? [];
    const obvs = obvsResult.data ?? [];

    const currentMetrics = metrics[0] as Record<string, unknown> | undefined;
    const prevMetrics = metrics[1] as Record<string, unknown> | undefined;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

    const prompt = `You are an expert startup advisor. Generate a professional monthly investor update email in Spanish.

PROJECT: ${project?.nombre || 'Startup'}
PHASE: ${phase?.current_phase ?? '?'} / 4 | Score: ${phase?.phase_score ?? '?'}% | Hard signal met: ${phase?.hard_signal_met ? 'Yes' : 'No'}

KEY METRICS (current):
- MRR: ${currentMetrics?.mrr ?? 'N/A'}
- Customers: ${currentMetrics?.total_customers ?? 'N/A'}
- Runway: ${currentMetrics?.runway_months ?? 'N/A'} months
- Previous MRR: ${prevMetrics?.mrr ?? 'N/A'}

TASKS COMPLETED THIS MONTH (${tasks.length}):
${tasks.slice(0, 5).map(t => `  - ${t.titulo}`).join('\n') || '  None'}

OBVs THIS MONTH (${obvs.length}):
${obvs.slice(0, 5).map(o => `  - ${o.titulo} (${o.tipo}) → ${o.obv_outcome || 'pending'}`).join('\n') || '  None'}

Generate a JSON response:
{
  "subject": "Monthly update: <project name> - <month>",
  "body_html": "<html email with inline styles, professional look, Optimus-K branding (#5CE1E6 accent)>",
  "body_text": "plain text version",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "metrics_summary": { "mrr": ..., "customers": ..., "phase": ..., "score": ... }
}

Keep it concise, data-driven, and investor-friendly (max 300 words for body).`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    const parsed = safeJsonParse<Record<string, unknown>>(text);

    if (!parsed.ok) {
      throw new Error(`Failed to generate update: ${parsed.error}`);
    }

    return new Response(
      JSON.stringify({ success: true, ...parsed.data }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Investor update generation failed:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } },
    );
  }
});
