-- =============================================================================
-- MIGRACIÓN 00028 — E4.24: On-demand triggers
--
-- Scope real tras auditoría de dependencias (2026-03-10):
--
--   OBV validated → Phase Engine:   GAP real → cerrado aquí
--   Task completed → Phase+Prob:    cubierto por trg_tasks_done_phase (mig 00019)
--   CRM cerrado_ganado → Prob:      cubierto por trg_pipeline_probability (mig 00023)
--   Member add/remove → Prob:       NO añadido — acoplamiento falso
--
-- Por qué NO se añade cascade org_capacity → probability:
--   compute_capacity_health() lee de obvs.status='pending' y tasks.status='done'.
--   No lee de project_org_state. Añadir el trigger hoy sería:
--     - recomputaciones sin cambio real en inputs
--     - dependencia engañosa entre engines con fuentes distintas
--   Criterio: trigger solo cuando cambia una fuente que el engine realmente lee.
--   Si compute_capacity_health evoluciona para leer project_org_state →
--   ese es el momento correcto para añadir la cascade.
--
-- Gap cerrado:
--   trg_obvs_phase (mig 00005) escucha: obv_outcome, tipo
--   trg_obvs_probability (mig 00007) escucha: obv_outcome, tipo, status  ← ya cubierto
--   → Phase engine no reaccionaba a status='validated' (solo a obv_outcome y tipo)
--   → trg_obvs_validated_phase cierra ese gap: OBV validado → recalcular Phase Score
--
-- Fuentes verificadas:
--   obvs.status  — kpi_status ENUM: 'pending' | 'validated' | 'rejected'
--   obvs.validated_at — TIMESTAMPTZ, set por trigger check_obv_validations
--   run_phase_engine  — migración 00005 (SECURITY DEFINER, acepta trigger_source TEXT)
-- =============================================================================

-- =============================================================================
-- E4.24 — OBV validated → Phase Engine
--
-- Condición exacta: status transiciona de cualquier valor a 'validated'
-- (OLD.status IS DISTINCT FROM NEW.status evita disparo en updates sin cambio real)
-- Llamada con trigger_source='acceleration' — coherente con convención de mig 00019
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_obvs_validated_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status = 'validated'
  THEN
    PERFORM run_phase_engine(NEW.project_id, 'acceleration');
  END IF;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION trg_fn_obvs_validated_phase() IS
  'E4.24. Cuando un OBV pasa a status=validated, relanza run_phase_engine '
  'con trigger_source=acceleration. '
  'Probability ya cubierta por trg_obvs_probability (mig 00007, escucha status). '
  'Solo dispara en transición real (OLD.status IS DISTINCT FROM NEW.status).';

CREATE OR REPLACE TRIGGER trg_obvs_validated_phase
  AFTER UPDATE OF status
  ON obvs
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_obvs_validated_phase();
