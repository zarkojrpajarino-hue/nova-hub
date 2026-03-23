/**
 * M2.5 — Trial Email Triggers
 *
 * Cron-triggered function that sends contextual emails during trial:
 *   Day 3  — "¿Has creado tu primera validación?"
 *   Day 7  — "Llevas una semana — así va tu progreso"
 *   Day 10 — "Quedan 4 días de trial"
 *   Day 13 — "Último día mañana — no pierdas tu progreso"
 *
 * Protected by CRON_SECRET header.
 * Uses Resend for email delivery.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TrialProject {
  project_id: string;
  project_name: string;
  trial_day: number;
  user_email: string;
  user_name: string;
  phase_score: number;
  current_phase: number;
}

const TRIGGER_DAYS = [3, 7, 10, 13] as const;

const EMAIL_TEMPLATES: Record<number, { subject: string; body: (p: TrialProject) => string }> = {
  3: {
    subject: '¿Has creado tu primera validación?',
    body: (p) => `
      <h2>Hola ${esc(p.user_name)},</h2>
      <p>Llevas 3 días en Optimus-K con tu proyecto <strong>${esc(p.project_name)}</strong>.</p>
      <p>El primer paso más importante es crear una <strong>validación (OBV)</strong> — registrar una entrevista, test o venta para que el motor de fases pueda medir tu progreso real.</p>
      <p>Los founders que crean su primera OBV en la primera semana tienen <strong>3x más probabilidad</strong> de avanzar de fase.</p>
      <a href="${appUrl()}/projects" style="${btnStyle()}">Crear mi primera validación →</a>
      <p style="color:#666;font-size:13px;margin-top:24px">Tu trial termina en 11 días.</p>
    `,
  },
  7: {
    subject: `Tu primera semana — ${'{score}'}% de progreso`,
    body: (p) => `
      <h2>Una semana en Optimus-K</h2>
      <p>Hola ${esc(p.user_name)}, llevas 7 días con <strong>${esc(p.project_name)}</strong>.</p>
      <p>Tu score actual es <strong>${p.phase_score}%</strong> en Fase ${p.current_phase}.</p>
      ${p.phase_score >= 50
        ? '<p>👏 Vas por buen camino. Sigue creando validaciones para llegar al 75% y desbloquear la siguiente fase.</p>'
        : '<p>💡 Tip: crea al menos 2 validaciones esta semana. Cada una puede subir tu score ~15%.</p>'
      }
      <a href="${appUrl()}/projects" style="${btnStyle()}">Ver mi dashboard →</a>
      <p style="color:#666;font-size:13px;margin-top:24px">Quedan 7 días de trial.</p>
    `,
  },
  10: {
    subject: 'Quedan 4 días de trial',
    body: (p) => `
      <h2>Tu trial termina en 4 días</h2>
      <p>Hola ${esc(p.user_name)}, tu proyecto <strong>${esc(p.project_name)}</strong> está en Fase ${p.current_phase} con score ${p.phase_score}%.</p>
      <p>Cuando termine el trial, podrás seguir viendo tu dashboard pero las funciones de IA y generación quedarán limitadas.</p>
      <p><strong>Para no perder tu progreso:</strong> elige un plan antes de que termine el trial.</p>
      <a href="${appUrl()}/projects" style="${btnStyle()}">Ver planes →</a>
    `,
  },
  13: {
    subject: '⏰ Último día de trial mañana',
    body: (p) => `
      <h2>Tu trial termina mañana</h2>
      <p>Hola ${esc(p.user_name)}, mañana se acaba tu período de prueba.</p>
      <p>Tu proyecto <strong>${esc(p.project_name)}</strong> tiene un score de ${p.phase_score}% en Fase ${p.current_phase}.</p>
      <p>Si eliges un plan hoy, tu progreso se mantiene intacto. Si no, las funciones premium se desactivarán pero tus datos se conservan.</p>
      <a href="${appUrl()}/projects" style="${btnStyle()}">Elegir plan ahora →</a>
    `,
  },
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function appUrl(): string {
  return Deno.env.get('APP_URL') || 'https://app.optimus-k.app';
}

function btnStyle(): string {
  return 'display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px';
}

function wrapHtml(innerHtml: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
${innerHtml}
<hr style="margin-top:32px;border:none;border-top:1px solid #eee">
<p style="color:#999;font-size:11px">Optimus-K · Este email es automático. No responder.</p>
</body></html>`;
}

serve(async (req) => {
  // Protect with CRON_SECRET
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'alertas@optimus-k.app';
    const fromName = Deno.env.get('NOTIFICATION_FROM_NAME') || 'Optimus-K';

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 });
    }

    // Find trial projects and their trial day
    const { data: trials } = await supabase
      .from('project_subscriptions')
      .select('project_id, trial_started_at')
      .eq('status', 'trial')
      .not('trial_started_at', 'is', null);

    if (!trials?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No active trials' }));
    }

    let sent = 0;
    const now = Date.now();

    for (const trial of trials) {
      const trialDay = Math.floor((now - new Date(trial.trial_started_at).getTime()) / 86_400_000);

      if (!TRIGGER_DAYS.includes(trialDay as typeof TRIGGER_DAYS[number])) continue;

      const template = EMAIL_TEMPLATES[trialDay];
      if (!template) continue;

      // Check if we already sent this day's email (dedup via activity_log)
      const dedupKey = `trial_email_day_${trialDay}_${trial.project_id}`;
      const { data: existing } = await supabase
        .from('activity_log')
        .select('id')
        .eq('project_id', trial.project_id)
        .eq('action', dedupKey)
        .maybeSingle();

      if (existing) continue;

      // Get project + user + phase data
      const { data: project } = await supabase
        .from('projects')
        .select('nombre, created_by')
        .eq('id', trial.project_id)
        .single();

      if (!project) continue;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', project.created_by)
        .single();

      if (!profile?.email) continue;

      const { data: phaseState } = await supabase
        .from('project_phase_state')
        .select('current_phase, phase_score')
        .eq('project_id', trial.project_id)
        .single();

      const trialProject: TrialProject = {
        project_id: trial.project_id,
        project_name: project.nombre || 'Mi Proyecto',
        trial_day: trialDay,
        user_email: profile.email,
        user_name: profile.full_name || 'Founder',
        phase_score: Math.round(phaseState?.phase_score ?? 0),
        current_phase: phaseState?.current_phase ?? 1,
      };

      // Send email via Resend
      const subject = template.subject.replace('{score}', String(trialProject.phase_score));
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [trialProject.user_email],
          subject,
          html: wrapHtml(template.body(trialProject)),
        }),
      });

      if (res.ok) {
        sent++;
        // Mark as sent (dedup)
        await supabase.from('activity_log').insert({
          project_id: trial.project_id,
          action: dedupKey,
          details: { trial_day: trialDay, email: trialProject.user_email },
        });
        console.log(`✉️ Trial email day ${trialDay} sent to ${trialProject.user_email}`);
      } else {
        console.error(`❌ Failed to send trial email day ${trialDay}:`, await res.text());
      }
    }

    return new Response(JSON.stringify({ sent, total_trials: trials.length }));
  } catch (error) {
    console.error('❌ Trial email triggers error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500 },
    );
  }
});
