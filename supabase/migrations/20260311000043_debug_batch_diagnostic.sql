-- ============================================================================
-- MIGRACIÓN 00043 — Diagnóstico: run_notification_batch loop
--
-- Función temporal de diagnóstico que:
--   1. Cuenta los proyectos que el batch procesaría
--   2. Llama notify_viability_changes para el primer proyecto crítico
--   3. Devuelve información de diagnóstico
--
-- Esta migración se puede eliminar después del diagnóstico (00044).
-- ============================================================================

CREATE OR REPLACE FUNCTION debug_notification_batch()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id        UUID;
  v_project_count     INTEGER := 0;
  v_critical_count    INTEGER := 0;
  v_notifications_before INTEGER;
  v_notifications_after  INTEGER;
  v_first_critical_id UUID;
  v_error_text        TEXT := NULL;
BEGIN
  -- Count before
  SELECT COUNT(*) INTO v_notifications_before FROM notifications;

  -- Count projects the loop would process
  SELECT COUNT(*) INTO v_project_count
  FROM projects WHERE deleted_at IS NULL;

  -- Find first critical viability project
  SELECT pvs.project_id INTO v_first_critical_id
  FROM project_viability_state pvs
  WHERE pvs.viability_status = 'critical'
  LIMIT 1;

  -- Count critical projects
  SELECT COUNT(*) INTO v_critical_count
  FROM project_viability_state
  WHERE viability_status = 'critical';

  -- Try calling notify_viability_changes for first critical project
  IF v_first_critical_id IS NOT NULL THEN
    BEGIN
      PERFORM notify_viability_changes(v_first_critical_id);
    EXCEPTION WHEN OTHERS THEN
      v_error_text := SQLERRM;
    END;
  END IF;

  -- Count after
  SELECT COUNT(*) INTO v_notifications_after FROM notifications;

  RETURN jsonb_build_object(
    'project_count',         v_project_count,
    'critical_viability',    v_critical_count,
    'first_critical_id',     v_first_critical_id,
    'notifications_before',  v_notifications_before,
    'notifications_after',   v_notifications_after,
    'new_notifications',     v_notifications_after - v_notifications_before,
    'error',                 v_error_text
  );
END;
$$;
