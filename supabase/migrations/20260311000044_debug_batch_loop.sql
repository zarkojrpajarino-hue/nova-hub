-- ============================================================================
-- MIGRACIÓN 00044 — Diagnóstico: simular exactamente el loop del batch
--
-- Simula run_notification_batch() con logging explícito para detectar
-- dónde y por qué falla el loop per-proyecto.
-- ============================================================================

CREATE OR REPLACE FUNCTION debug_batch_loop()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id   UUID;
  v_project_count INTEGER := 0;
  v_notify_count  INTEGER := 0;
  v_error_count   INTEGER := 0;
  v_last_error    TEXT := NULL;
  v_before        INTEGER;
  v_after         INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_before FROM notifications;

  FOR v_project_id IN
    SELECT id FROM projects WHERE deleted_at IS NULL
  LOOP
    v_project_count := v_project_count + 1;
    BEGIN
      PERFORM notify_phase_changes(v_project_id);
      PERFORM notify_viability_changes(v_project_id);
      PERFORM notify_risk_changes(v_project_id);
      PERFORM notify_bottlenecks(v_project_id);
      PERFORM notify_probability_changes(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_last_error  := format('project %s: %s', v_project_id, SQLERRM);
    END;
  END LOOP;

  SELECT COUNT(*) INTO v_after FROM notifications;
  v_notify_count := v_after - v_before;

  RETURN jsonb_build_object(
    'projects_iterated', v_project_count,
    'new_notifications',  v_notify_count,
    'error_count',        v_error_count,
    'last_error',         v_last_error
  );
END;
$$;
