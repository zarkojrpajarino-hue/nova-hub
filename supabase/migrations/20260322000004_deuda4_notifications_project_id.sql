-- DEUDA.4 — Añadir project_id a notifications + corregir nombres de columna
--
-- Dos bugs en notify_overdue_meeting_commitments() (M18.17):
--   1. La tabla notifications nunca tuvo project_id → error de runtime en INSERT.
--   2. La función usa nombres viejos (tipo/titulo/mensaje) renombrados en migración
--      20260311000033 a (type/title/message) → columnas no encontradas en runtime.
--
-- Fix:
--   A. Añadir project_id con FK + índice.
--   B. Reescribir notify_overdue_meeting_commitments() con nombres de columna correctos.

-- ── A. Columna project_id ─────────────────────────────────────────────────────

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_project_id
  ON notifications(project_id)
  WHERE project_id IS NOT NULL;

COMMENT ON COLUMN notifications.project_id IS
  'DEUDA.4 (M18.17): proyecto al que pertenece la notificación. '
  'NULL para notificaciones no contextuales (e.g. sistema). '
  'Usado por notify_overdue_meeting_commitments() y dedup window.';

-- ── B. Reescribir la función con nombres de columna correctos ─────────────────

CREATE OR REPLACE FUNCTION notify_overdue_meeting_commitments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      t.project_id,
      COUNT(*)      AS overdue_count,
      p.created_by  AS user_id
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.meeting_id IS NOT NULL
      AND t.status      != 'done'
      AND t.fecha_limite < CURRENT_DATE
      AND p.archived_at  IS NULL
    GROUP BY t.project_id, p.created_by
    HAVING COUNT(*) >= 2
  LOOP
    -- Dedup: no emitir si ya existe notificación del mismo tipo en los últimos 3 días
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id    = r.user_id
        AND project_id = r.project_id
        AND type       = 'meeting_commitments_overdue'
        AND created_at > NOW() - INTERVAL '3 days'
    ) THEN
      INSERT INTO notifications (
        user_id,
        project_id,
        type,
        title,
        message,
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
  'M18.17 + DEUDA.4: Emite notificación HIGH cuando ≥ 2 tasks de reunión están vencidas. '
  'Ventana dedup: 3 días. Usa columnas renombradas (type/title/message) e incluye project_id.';
