-- ============================================================================
-- MIGRACIÓN 00042 — Fix: run_notification_batch — layers 2–5 no aplicados
--
-- Root cause diagnosticado:
--   La migración 00036 definió todas las funciones de notify_*_changes
--   individualmente (verificadas: se pueden llamar via RPC y generan
--   notificaciones correctas). Sin embargo, el CREATE OR REPLACE FUNCTION
--   run_notification_batch() al final de 00036 no se aplicó en el DB
--   desplegado — la versión activa era la de 00035 (Layer 1 only).
--
-- Evidencia:
--   - notify_viability_changes('project-uuid') → HTTP 204 + 2 notificaciones ✓
--   - notify_phase_changes('project-uuid regresado') → HTTP 204 + phase_regressed ✓
--   - run_notification_batch() → HTTP 204, CERO notificaciones layer 2–5 ✗
--
-- Fix: forzar CREATE OR REPLACE de run_notification_batch con la
-- implementación completa Layer 1+2-5, idéntica a la de migración 00036.
-- ============================================================================

CREATE OR REPLACE FUNCTION run_notification_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Layer 1: actividad
  PERFORM notify_inactive_leads();
  PERFORM notify_overdue_tasks();
  PERFORM notify_expiring_validations();
  PERFORM notify_inactive_projects();

  -- Layers 2–5: engine events (por proyecto)
  FOR v_project_id IN
    SELECT id FROM projects WHERE deleted_at IS NULL
  LOOP
    BEGIN
      PERFORM notify_phase_changes(v_project_id);
      PERFORM notify_viability_changes(v_project_id);
      PERFORM notify_risk_changes(v_project_id);
      PERFORM notify_bottlenecks(v_project_id);
      PERFORM notify_probability_changes(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_batch: failed for project %: %', v_project_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION run_notification_batch() IS
  'Batch completo: Layer 1 (actividad) + Layers 2–5 (engine events). pg_cron cada 6h. '
  'Fix 00042: fuerza re-aplicación del CREATE OR REPLACE que no se ejecutó en 00036.';
