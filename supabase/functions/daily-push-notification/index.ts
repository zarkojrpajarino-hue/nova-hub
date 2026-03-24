/**
 * V4.8.3 — DAILY PUSH NOTIFICATION (D1-D7)
 *
 * Cron function (daily 9am UTC) that for users in days 1-7 since signup:
 *   - Determines their next recommended action
 *   - Generates a motivational notification
 *   - Inserts into the notifications table
 *
 * Protected by CRON_SECRET.
 *
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ProfileRow {
  id: string;
  created_at: string;
  display_name: string | null;
}

interface PhaseState {
  current_phase: number;
  phase_score: number;
  hard_signal_met: boolean;
}

/** Day-specific notification templates (Spanish) */
const DAY_TEMPLATES: Record<number, { title: string; messageTemplate: string; actionHint: string }> = {
  1: {
    title: 'Bienvenido a Optimus-K',
    messageTemplate: 'Hola {{name}}. Tu primera mision: crea tu primera OBV para registrar evidencia real de tu negocio.',
    actionHint: 'create_obv',
  },
  2: {
    title: 'Dia 2: Define tu equipo',
    messageTemplate: '{{name}}, los equipos con 2+ miembros avanzan 40% mas rapido. Invita a un cofundador o colaborador.',
    actionHint: 'invite_member',
  },
  3: {
    title: 'Dia 3: Tu primera tarea',
    messageTemplate: '{{name}}, convierte tu siguiente accion en una tarea concreta. Las tareas miden tu velocidad de ejecucion.',
    actionHint: 'create_task',
  },
  4: {
    title: 'Dia 4: Revisa tu motor de fases',
    messageTemplate: '{{name}}, tu motor de fases ya tiene datos. Revisa tu score y descubre que te falta para avanzar.',
    actionHint: 'view_engine',
  },
  5: {
    title: 'Dia 5: Registra metricas',
    messageTemplate: '{{name}}, las metricas clave (MRR, clientes, runway) alimentan las predicciones IA. Registra tus numeros.',
    actionHint: 'add_metrics',
  },
  6: {
    title: 'Dia 6: Explora el CRM',
    messageTemplate: '{{name}}, si tienes leads o contactos, el CRM con AI scoring te ayuda a priorizar. Registra tu primer lead.',
    actionHint: 'add_lead',
  },
  7: {
    title: 'Dia 7: Resumen de tu primera semana',
    messageTemplate: '{{name}}, llevas una semana en Optimus-K. Revisa tu progreso en el dashboard y planifica la proxima semana.',
    actionHint: 'view_dashboard',
  },
};

serve(async (req) => {
  // Auth check
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 1 * 86_400_000).toISOString();

    // Find users who signed up 1-7 days ago
    const { data: newUsers } = await supabase
      .from('profiles')
      .select('id, created_at, display_name')
      .gte('created_at', sevenDaysAgo)
      .lte('created_at', oneDayAgo);

    if (!newUsers || newUsers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: 'no new users in D1-D7 window' }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    let totalSent = 0;

    for (const user of newUsers as ProfileRow[]) {
      try {
        const daysSinceSignup = Math.floor(
          (now.getTime() - new Date(user.created_at).getTime()) / 86_400_000,
        );

        const day = Math.min(7, Math.max(1, daysSinceSignup));
        const template = DAY_TEMPLATES[day];
        if (!template) continue;

        // Get user's primary project for momentum context
        const { data: membership } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        let momentum = '';
        if (membership?.project_id) {
          const { data: phase } = await supabase
            .from('project_phase_state')
            .select('current_phase, phase_score, hard_signal_met')
            .eq('project_id', membership.project_id)
            .maybeSingle();

          if (phase) {
            const ps = phase as PhaseState;
            momentum = ` Tu score actual: ${Math.round(ps.phase_score)}% en Fase ${ps.current_phase}.`;
          }
        }

        const name = user.display_name || 'founder';
        const message = template.messageTemplate.replace('{{name}}', name) + momentum;

        // Insert notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: template.title,
          message,
          type: 'onboarding_nudge',
          metadata: {
            day: day,
            action_hint: template.actionHint,
            project_id: membership?.project_id || null,
          },
        });

        totalSent++;
      } catch (userErr) {
        console.error(`Notification failed for user ${user.id}:`, userErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, total_users: newUsers.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Daily push notification cron failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
