-- FASE 18 — M18.15: get_meeting_fulfillment()
--           M18.17: notify_overdue_meeting_commitments() + extensión de run_notification_batch()
--
-- M18.15: calcula el fulfillment rate de compromisos de una reunión.
--   total_tasks      = tasks con meeting_id = p_meeting_id
--   completed_tasks  = tasks con status = 'done'
--   overdue_tasks    = tasks con status != 'done' AND fecha_limite < NOW()
--   fulfillment_rate = completed_tasks / total_tasks (NULL si 0 tasks)
--
-- M18.17: notify_overdue_meeting_commitments() — Layer 1 de notificaciones.
--   Busca projects con ≥ 2 tasks de reunión vencidas → emite HIGH notification.
--   Ventana de dedup: 3 días (no spamear si ya se notificó).

-- ── M18.15: get_meeting_fulfillment ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_meeting_fulfillment(p_meeting_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total     INT;
  v_completed INT;
  v_overdue   INT;
  v_rate      NUMERIC;
  v_tasks     JSONB;
BEGIN
  SELECT
    COUNT(*)                                                                    AS total,
    COUNT(*) FILTER (WHERE status = 'done')                                    AS completed,
    COUNT(*) FILTER (WHERE status != 'done' AND fecha_limite < CURRENT_DATE)   AS overdue
  INTO v_total, v_completed, v_overdue
  FROM tasks
  WHERE meeting_id = p_meeting_id;

  v_rate := CASE WHEN v_total > 0
    THEN ROUND((v_completed::NUMERIC / v_total::NUMERIC), 3)
    ELSE NULL
  END;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',           id,
      'titulo',       titulo,
      'status',       status,
      'fecha_limite', fecha_limite,
      'assignee_id',  assignee_id
    ) ORDER BY fecha_limite ASC NULLS LAST
  ), '[]'::jsonb)
  INTO v_tasks
  FROM tasks
  WHERE meeting_id = p_meeting_id;

  RETURN jsonb_build_object(
    'total_tasks',      v_total,
    'completed_tasks',  v_completed,
    'overdue_tasks',    v_overdue,
    'fulfillment_rate', v_rate,
    'tasks_list',       v_tasks
  );
END;
$$;

COMMENT ON FUNCTION get_meeting_fulfillment(UUID) IS
  'M18.15: Fulfillment rate de compromisos de una reunión. '
  'fulfillment_rate = completed/total (NULL si 0 tasks).';

-- ── M18.17: notify_overdue_meeting_commitments ───────────────────────────────

CREATE OR REPLACE FUNCTION notify_overdue_meeting_commitments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Por cada proyecto con ≥ 2 tasks de reunión vencidas
  FOR r IN
    SELECT
      t.project_id,
      COUNT(*)                                          AS overdue_count,
      -- Notificar al creador del proyecto (o a todos los miembros en v2)
      p.created_by                                      AS user_id
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.meeting_id IS NOT NULL
      AND t.status     != 'done'
      AND t.fecha_limite < CURRENT_DATE
      AND p.archived_at IS NULL
    GROUP BY t.project_id, p.created_by
    HAVING COUNT(*) >= 2
  LOOP
    -- Dedup: no emitir si ya existe notificación del mismo tipo en los últimos 3 días
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id    = r.user_id
        AND project_id = r.project_id
        AND tipo       = 'meeting_commitments_overdue'
        AND created_at > NOW() - INTERVAL '3 days'
    ) THEN
      INSERT INTO notifications (
        user_id,
        project_id,
        tipo,
        titulo,
        mensaje,
        priority,
        link,
        created_at
      ) VALUES (
        r.user_id,
        r.project_id,
        'meeting_commitments_overdue',
        'Compromisos de reunión vencidos',
        format(
          'Tienes %s compromisos de reunión vencidos · Revisa tus tareas pendientes',
          r.overdue_count
        ),
        'high',
        '/tasks',
        NOW()
      );
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION notify_overdue_meeting_commitments() IS
  'M18.17: Emite notificación HIGH cuando ≥ 2 tasks de reunión están vencidas. '
  'Ventana dedup: 3 días.';

-- ── Extender run_notification_batch con la nueva función ──────────────────────

CREATE OR REPLACE FUNCTION run_notification_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Layer 1: actividad
  PERFORM notify_inactive_leads();
  PERFORM notify_overdue_tasks();
  PERFORM notify_expiring_validations();
  PERFORM notify_inactive_projects();
  -- M18.17: compromisos de reunión vencidos
  PERFORM notify_overdue_meeting_commitments();
  -- Layer 2–5 se añaden en migración 00036
END;
$$;

COMMENT ON FUNCTION run_notification_batch() IS
  'Batch de notificaciones. Ejecutado por pg_cron cada 6 horas. '
  'M18.17: incluye notify_overdue_meeting_commitments().';
