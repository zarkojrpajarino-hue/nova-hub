/**
 * V4.6.1 — SEND WEEKLY DIGEST (Cron)
 *
 * Runs weekly (Monday 9am UTC) to generate and email a digest for each
 * active project (activity in the last 7 days).
 *
 * For each project:
 *   1. Gathers tasks completed, OBVs created, KPI changes, phase progress
 *   2. Calls Haiku to summarise (~$0.003/digest)
 *   3. Sends email via Resend (same pattern as send-weekly-summary)
 *
 * Protected by CRON_SECRET header.
 *
 * Env vars:
 *   ANTHROPIC_API_KEY, RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   CRON_SECRET, NOTIFICATION_FROM_EMAIL, NOTIFICATION_FROM_NAME, APP_URL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { logAICall } from '../_shared/aiLogger.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { safeJsonParse } from '../_shared/safe-json-parse.ts';

interface DigestData {
  subject: string;
  body_text: string;
  body_html: string;
}

serve(async (req) => {
  // Only allow POST with CRON_SECRET
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'digest@optimus-k.app';
  const fromName = Deno.env.get('NOTIFICATION_FROM_NAME') || 'Optimus-K';
  const appUrl = Deno.env.get('APP_URL') || 'https://app.optimus-k.app';

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const weekAgoISO = weekAgo.toISOString();

  try {
    // 1. Find projects with activity in last 7 days
    const { data: activeProjects } = await supabase
      .from('activity_log')
      .select('entity_id')
      .gte('created_at', weekAgoISO)
      .eq('entity_type', 'project');

    const projectIds = [...new Set((activeProjects ?? []).map(a => a.entity_id).filter(Boolean))];

    if (projectIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'no active projects' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalSent = 0;

    for (const projectId of projectIds) {
      try {
        // 2. Gather weekly data
        const [projectResult, tasksResult, obvsResult, phaseResult, membersResult] = await Promise.all([
          supabase.from('projects').select('nombre, created_by').eq('id', projectId).single(),
          supabase
            .from('tasks')
            .select('id, titulo, status')
            .eq('project_id', projectId as string)
            .eq('status', 'done')
            .gte('updated_at', weekAgoISO),
          supabase
            .from('obvs')
            .select('id, titulo, tipo')
            .eq('project_id', projectId as string)
            .gte('created_at', weekAgoISO),
          supabase
            .from('project_phase_state')
            .select('current_phase, phase_score, hard_signal_met')
            .eq('project_id', projectId as string)
            .single(),
          supabase
            .from('project_members')
            .select('user_id, profiles(email)')
            .eq('project_id', projectId as string),
        ]);

        const project = projectResult.data;
        if (!project) continue;

        const tasksCompleted = tasksResult.data?.length ?? 0;
        const obvsCreated = obvsResult.data?.length ?? 0;
        const phase = phaseResult.data;

        // 3. Generate digest with Haiku (~$0.003 target)
        const prompt = `Generate a weekly project digest email in Spanish. Be concise (max 150 words).

PROJECT: ${project.nombre}
TASKS COMPLETED THIS WEEK: ${tasksCompleted}${tasksResult.data?.slice(0, 5).map(t => `\n  - ${t.titulo}`).join('') || ''}
OBVs CREATED THIS WEEK: ${obvsCreated}${obvsResult.data?.slice(0, 5).map(o => `\n  - ${o.titulo} (${o.tipo})`).join('') || ''}
PHASE: ${phase?.current_phase ?? '?'} | Score: ${phase?.phase_score ?? '?'}% | Hard signal: ${phase?.hard_signal_met ? 'Yes' : 'No'}

Return JSON: {"subject": "...", "body_text": "...", "body_html": "<html>..."}
The body_html should be a simple, clean email with the digest summary. Use inline styles.`;

        const digestStart = Date.now();
        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        });
        const digestDurationMs = Date.now() - digestStart;

        const text = (message.content[0] as { type: string; text: string }).text;

        await logAICall({
          supabaseClient: supabase,
          projectId: projectId as string,
          functionName: 'send-weekly-digest',
          inputData: { projectId },
          outputData: text?.slice(0, 500),
          success: true,
          executionTimeMs: digestDurationMs,
          tokensUsed: (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
          modelUsed: 'claude-haiku-4-5-20251001',
        });
        const parsed = safeJsonParse<DigestData>(text);

        if (!parsed.ok) {
          console.error(`Failed to parse digest for project ${projectId}: ${parsed.error}`);
          continue;
        }

        const digest = parsed.data;

        // 4. Send email to all project members
        if (!resendApiKey) {
          console.warn('RESEND_API_KEY not set — skipping email send');
          continue;
        }

        const resend = new Resend(resendApiKey);
        const members = membersResult.data ?? [];

        for (const member of members) {
          const email = (member.profiles as unknown as { email: string } | null)?.email;
          if (!email) continue;

          try {
            await resend.emails.send({
              from: `${fromName} <${fromEmail}>`,
              to: email,
              subject: digest.subject,
              html: digest.body_html + `<p style="margin-top:24px;font-size:12px;color:#999"><a href="${appUrl}/proyecto/${projectId}" style="color:#5CE1E6">Ver proyecto en Optimus-K</a></p>`,
              text: digest.body_text,
            });
          } catch (emailErr) {
            console.error(`Email send failed for ${email}:`, emailErr);
          }
        }

        totalSent++;
      } catch (projErr) {
        console.error(`Digest failed for project ${projectId}:`, projErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, total_projects: projectIds.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Weekly digest cron failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
