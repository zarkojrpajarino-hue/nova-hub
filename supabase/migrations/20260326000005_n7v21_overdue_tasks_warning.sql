-- =============================================================================
-- MIGRACIÓN 20260326000005 — N7.V2.1: Notificación overdue_tasks_warning
--
-- Problema: un founder con ≥3 tareas vencidas bloquea el avance de fase
-- (buildNextAction prioriza eso sobre cualquier otra acción) pero no recibe
-- ninguna notificación que le avise del estado. El Focus Block lo muestra,
-- pero si el founder no abre la app frecuentemente, pasa desapercibido.
--
-- Solución: función notify_overdue_tasks_warning(project_id, user_id).
--   - Lee overdue_count via get_project_task_stats().
--   - Emite notificación tipo 'overdue_tasks_warning' priority 'high' si ≥3.
--   - Anti-spam: no emite si ya existe notificación activa (no leída,
--     no archivada) del mismo tipo + proyecto en las últimas 48h.
--   - Threshold ≥3 alineado con buildNextAction() (bloqueo real de avance).
--
-- Llamada: desde trigger en tasks (E4.V2.2) o desde cron diario.
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_overdue_tasks_warning(
  p_project_id UUID,
  p_user_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats       JSONB;
  v_overdue     INTEGER;
  v_existing    INTEGER;
  v_cutoff_48h  TIMESTAMPTZ := NOW() - INTERVAL '48 hours';
BEGIN
  -- Leer stats (depende de E4.V2.1)
  v_stats   := get_project_task_stats(p_project_id);
  v_overdue := (v_stats->>'overdue_count')::INTEGER;

  -- Solo si ≥3 tareas vencidas (threshold de buildNextAction)
  IF v_overdue < 3 THEN
    RETURN;
  END IF;

  -- Anti-spam: no duplicar si ya hay notificación activa en 48h
  SELECT COUNT(*) INTO v_existing
  FROM   notifications
  WHERE  user_id    = p_user_id
    AND  project_id = p_project_id
    AND  tipo       = 'overdue_tasks_warning'
    AND  leida      = FALSE
    AND  archived   = FALSE
    AND  created_at >= v_cutoff_48h;

  IF v_existing > 0 THEN
    RETURN;
  END IF;

  -- Emitir notificación
  INSERT INTO notifications (
    user_id,    project_id,
    tipo,       priority,
    titulo,     mensaje,
    action_url, action_label,
    metadata,   leida,        archived
  )
  VALUES (
    p_user_id,      p_project_id,
    'overdue_tasks_warning', 'high',
    v_overdue || ' tareas vencidas bloquean el avance',
    'Tienes ' || v_overdue || ' tarea' || CASE WHEN v_overdue != 1 THEN 's' ELSE '' END
      || ' vencida' || CASE WHEN v_overdue != 1 THEN 's' ELSE '' END
      || '. Resuélvelas para desbloquear el motor del proyecto.',
    NULL,           'Ver tareas',
    jsonb_build_object('overdue_count', v_overdue),
    FALSE,          FALSE
  );
END;
$$;

COMMENT ON FUNCTION notify_overdue_tasks_warning(UUID, UUID) IS
  'N7.V2.1: Emite notificación overdue_tasks_warning HIGH cuando overdue_count ≥ 3. '
  'Anti-spam 48h: no duplica si ya existe notificación activa del mismo tipo. '
  'Threshold alineado con buildNextAction() (bloqueo real de fase). '
  'Prereq: get_project_task_stats() (E4.V2.1). Migration 20260326000005.';
