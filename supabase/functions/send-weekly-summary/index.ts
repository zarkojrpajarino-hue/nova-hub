/**
 * SEND WEEKLY SUMMARY — UX Email Engagement
 *
 * Cron-triggered (Monday 9am UTC) weekly email summary for active projects.
 * For each active project with at least 1 member:
 * - Task stats (done this week, overdue)
 * - Latest insights from integration_insights
 * - MRR if available from key_metrics
 *
 * Protected by CRON_SECRET header.
 * Sends via Resend (RESEND_API_KEY in Supabase secrets).
 *
 * Variables de entorno requeridas:
 *   RESEND_API_KEY            — clave de Resend
 *   NOTIFICATION_FROM_EMAIL   — email remitente (ej: weekly@optimus-k.app)
 *   NOTIFICATION_FROM_NAME    — nombre remitente (ej: Optimus-K)
 *   APP_URL                   — base URL de la app (ej: https://app.optimus-k.app)
 *   CRON_SECRET               — secreto para proteger el endpoint
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

// ── HTML template ────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface WeeklySummaryData {
  projectName: string;
  tasksDone: number;
  tasksOverdue: number;
  insightsCount: number;
  topInsight: string | null;
  mrr: number | null;
  dashboardUrl: string;
}

function buildWeeklyHtml(data: WeeklySummaryData): string {
  const mrrSection = data.mrr !== null
    ? `<tr><td style="padding:8px 0;color:#666">MRR</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a1a">${data.mrr.toLocaleString('es-ES')} &euro;</td></tr>`
    : '';

  const insightSection = data.topInsight
    ? `<p style="background:#f0f9ff;border-left:3px solid #3b82f6;padding:12px;margin:16px 0;font-size:13px;color:#1e40af;border-radius:0 6px 6px 0">${escapeHtml(data.topInsight)}</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <h2 style="margin-top:0;font-size:18px;line-height:1.3">Resumen semanal: ${escapeHtml(data.projectName)}</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px 0;color:#666">Tareas completadas</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#16a34a">${data.tasksDone}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Tareas vencidas</td><td style="padding:8px 0;text-align:right;font-weight:600;color:${data.tasksOverdue > 0 ? '#dc2626' : '#16a34a'}">${data.tasksOverdue}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Insights nuevos</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#1a1a1a">${data.insightsCount}</td></tr>
    ${mrrSection}
  </table>
  ${insightSection}
  <a href="${data.dashboardUrl}"
     style="display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">
    Ver dashboard
  </a>
  <hr style="margin-top:32px;border:none;border-top:1px solid #eee">
  <p style="font-size:11px;color:#999;margin-top:8px;line-height:1.5">
    Recibes este email porque eres miembro activo de un proyecto en Optimus-K.<br>
    No respondas a este mensaje.
  </p>
</body>
</html>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

serve(async (req) => {
  // Only POST allowed (cron trigger)
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Verify cron secret
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'weekly@optimus-k.app';
  const fromName = Deno.env.get('NOTIFICATION_FROM_NAME') || 'Optimus-K';
  const appUrl = Deno.env.get('APP_URL') || 'https://app.optimus-k.app';

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const resend = new Resend(resendApiKey);

  try {
    // Get all active projects (not deleted, not archived, not paused)
    const { data: projects, error: projErr } = await supabase
      .from('projects')
      .select('id, nombre')
      .is('deleted_at', null)
      .is('archived_at', null)
      .is('paused_at', null);

    if (projErr) throw projErr;
    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No active projects' }), { status: 200 });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let totalSent = 0;

    for (const project of projects) {
      // Get project members with their emails
      const { data: members } = await supabase
        .from('project_members')
        .select('member_id, member:profiles!member_id(email, nombre)')
        .eq('project_id', project.id);

      if (!members || members.length === 0) continue;

      // Tasks completed this week
      const { count: tasksDone } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .eq('status', 'done')
        .gte('updated_at', weekAgo);

      // Tasks overdue
      const { count: tasksOverdue } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .neq('status', 'done')
        .neq('status', 'cancelled')
        .lt('due_date', now.toISOString().split('T')[0]);

      // Latest insights count from integration_insights
      const { data: insights } = await supabase
        .from('integration_insights')
        .select('insight_text')
        .eq('project_id', project.id)
        .gte('generated_at', weekAgo)
        .order('generated_at', { ascending: false })
        .limit(5);

      // Latest MRR from key_metrics
      const { data: latestMetric } = await supabase
        .from('key_metrics')
        .select('mrr')
        .eq('project_id', project.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const summaryData: WeeklySummaryData = {
        projectName: project.nombre,
        tasksDone: tasksDone ?? 0,
        tasksOverdue: tasksOverdue ?? 0,
        insightsCount: insights?.length ?? 0,
        topInsight: insights?.[0]?.insight_text ?? null,
        mrr: latestMetric?.mrr ?? null,
        dashboardUrl: `${appUrl}/proyecto/${project.id}`,
      };

      // Skip projects with no activity
      if (summaryData.tasksDone === 0 && summaryData.tasksOverdue === 0 && summaryData.insightsCount === 0 && summaryData.mrr === null) {
        continue;
      }

      const html = buildWeeklyHtml(summaryData);

      // Send to each member
      for (const member of members) {
        const profile = member.member as { email: string; nombre: string } | null;
        if (!profile?.email) continue;

        try {
          await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: profile.email,
            subject: `Resumen semanal: ${project.nombre}`,
            html,
          });
          totalSent++;
        } catch (emailErr) {
          console.error(`Failed to send to ${profile.email}:`, emailErr);
        }
      }
    }

    return new Response(JSON.stringify({ sent: totalSent, projects: projects.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Weekly summary error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
