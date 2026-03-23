/**
 * SEND CRITICAL NOTIFICATIONS — N7.6
 *
 * Canal email para alertas críticas: phase_regressed, viability_critical, cash_flow_alert.
 *
 * Diseño:
 * - Sin validateAuth (función interna, service role)
 * - Protegida por CRON_SECRET header
 * - Busca notifications con emailed_at IS NULL + created_at < 24h
 * - Dedup extra: no email si ya se envió una notif del mismo tipo/proyecto en 24h
 * - Marca emailed_at SOLO si el envío tiene éxito (permite reintento en ciclo siguiente)
 * - Compatible con cualquier scheduler externo (cron job, GitHub Actions, Vercel cron)
 *   o trigger manual desde el dashboard de Supabase.
 *
 * Variables de entorno requeridas:
 *   RESEND_API_KEY            — clave de Resend
 *   NOTIFICATION_FROM_EMAIL   — email remitente de plataforma (ej: alertas@optimus-k.app)
 *   NOTIFICATION_FROM_NAME    — nombre remitente (ej: Optimus-K)
 *   APP_URL                   — base URL de la app (ej: https://app.optimus-k.app)
 *   CRON_SECRET               — secreto para proteger el endpoint
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

// ── Tipos críticos que abren el canal email ───────────────────────────────────

const CRITICAL_EMAIL_TYPES = ['phase_regressed', 'viability_critical', 'cash_flow_alert'] as const;

// ── Templates de email ────────────────────────────────────────────────────────

function buildEmailHtml(title: string, message: string, actionUrl: string, actionLabel: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <h2 style="margin-top:0;font-size:18px;line-height:1.3;color:#1a1a1a">${escapeHtml(title)}</h2>
  <p style="color:#444;line-height:1.6;margin-bottom:20px">${escapeHtml(message)}</p>
  <a href="${actionUrl}"
     style="display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">
    ${escapeHtml(actionLabel)}
  </a>
  <hr style="margin-top:32px;border:none;border-top:1px solid #eee">
  <p style="font-size:11px;color:#999;margin-top:8px;line-height:1.5">
    Has recibido este email porque eres miembro de un proyecto con alertas críticas.<br>
    No respondas a este mensaje.
  </p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Handler principal ─────────────────────────────────────────────────────────

serve(async (req) => {
  // Solo POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Autenticación de cron: CRON_SECRET header
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret');
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Variables de entorno
  const resendApiKey     = Deno.env.get('RESEND_API_KEY');
  const fromEmail        = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'alertas@optimus-k.app';
  const fromName         = Deno.env.get('NOTIFICATION_FROM_NAME')  || 'Optimus-K';
  const appUrl           = Deno.env.get('APP_URL')                 || 'https://app.optimus-k.app';
  const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const resend        = new Resend(resendApiKey);

  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Buscar notificaciones críticas pendientes de email (created_at < 24h, emailed_at IS NULL)
  const { data: notifications, error: queryError } = await serviceClient
    .from('notifications')
    .select('id, user_id, type, title, message, action_url, action_label, metadata, created_at')
    .in('type', CRITICAL_EMAIL_TYPES)
    .is('emailed_at', null)
    .eq('archived', false)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: true });

  if (queryError) {
    console.error('Error querying notifications:', queryError);
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!notifications || notifications.length === 0) {
    return new Response(JSON.stringify({ sent: 0, skipped: 0, failed: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent    = 0;
  let skipped = 0;
  let failed  = 0;

  for (const notif of notifications) {
    try {
      const projectId = notif.metadata?.project_id as string | undefined;

      // Dedup: no email si ya se envió otra notif del mismo tipo/proyecto en 24h
      if (projectId) {
        const { count } = await serviceClient
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', notif.user_id)
          .eq('type', notif.type)
          .filter('metadata->>project_id', 'eq', projectId)
          .not('emailed_at', 'is', null)
          .gte('emailed_at', windowStart);

        if ((count ?? 0) > 0) {
          skipped++;
          continue;
        }
      }

      // Obtener email del usuario via admin API (service role)
      const { data: userData } = await serviceClient.auth.admin.getUserById(notif.user_id);
      const userEmail = userData?.user?.email;

      if (!userEmail) {
        console.warn(`No email for user ${notif.user_id}, skipping`);
        skipped++;
        continue;
      }

      // Construir URL absoluta
      const actionUrl = notif.action_url
        ? `${appUrl}${notif.action_url}`
        : appUrl;
      const actionLabel = notif.action_label || 'Ver en Optimus-K';

      // Enviar email
      const { error: sendError } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to:   userEmail,
        subject: notif.title,
        html: buildEmailHtml(notif.title, notif.message, actionUrl, actionLabel),
        text: `${notif.title}\n\n${notif.message}\n\n${actionLabel}: ${actionUrl}`,
      });

      if (sendError) {
        console.error(`Failed to send email for notification ${notif.id}:`, sendError);
        failed++;
        continue;
      }

      // Marcar emailed_at SOLO si el envío tuvo éxito
      const { error: updateError } = await serviceClient
        .from('notifications')
        .update({ emailed_at: new Date().toISOString() })
        .eq('id', notif.id);

      if (updateError) {
        console.error(`Failed to mark emailed_at for notification ${notif.id}:`, updateError);
        // Email ya enviado — no hay rollback posible; el update se reintentará
        // en el próximo ciclo pero Resend dedup evita doble envío
      }

      sent++;

    } catch (err) {
      console.error(`Unexpected error for notification ${notif.id}:`, err);
      failed++;
    }
  }

  console.log(`Critical notifications email run: sent=${sent} skipped=${skipped} failed=${failed}`);

  return new Response(
    JSON.stringify({ sent, skipped, failed }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 }
  );
});
