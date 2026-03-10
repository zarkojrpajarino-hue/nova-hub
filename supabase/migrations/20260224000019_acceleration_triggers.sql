-- =============================================================================
-- MIGRACIÓN 00019 — Acceleration triggers: causalidad en tiempo real
--
-- Problema: tres acciones importantes del usuario no disparaban run_phase_engine
-- de forma inmediata. El cron semanal actúa como red de seguridad, pero sin
-- feedback instantáneo el sistema parece que no funciona.
--
-- ── Auditoría de cadenas existentes (pre-00019) ──────────────────────────────
--
--   OBVs (INSERT):
--     trg_obvs_phase (migration 00005) → dispara solo si
--       tipo IN ('customer_discovery','exploracion') en INSERT
--     Para revenue_validation/venta con outcome: trigger fires pero no-op.
--     GAP: INSERT con obv_outcome ya fijado en tipos de venta.
--
--   tasks (UPDATE status='done'):
--     trg_tasks_coverage (migration 00004) → recalcula project_function_coverage
--     trg_coverage_phase (migration 00005) → run_phase_engine si coverage cambia
--     Para tareas CON function_type: cadena ya funciona.
--     GAP: tareas SIN function_type (coverage no cambia → engine no dispara).
--
--   key_metrics (INSERT/UPDATE mrr):
--     trg_key_metrics_probability (migration 00007) → probability engine
--     → actualiza project_probability.revenue_momentum_input
--     Nada llama a run_phase_engine después.
--     GAP: Phase 2→3 hard signal y O3.1 no recalculan hasta cron.
--
-- ── Decisión de diseño para el fix de key_metrics ────────────────────────────
--
-- Opción descartada: trigger directo key_metrics → run_phase_engine.
-- Problema: PostgreSQL ejecuta AFTER triggers en orden alfabético por nombre.
-- 'trg_key_metrics_phase' < 'trg_key_metrics_probability' (ph < pr).
-- → run_phase_engine leería revenue_momentum_input ANTES de que la probability
--   engine lo actualice → hard signal de Fase 2→3 leería valor obsoleto.
-- Esto NO es un bug de datos (idempotente), pero anula la causalidad que queremos.
--
-- Solución correcta: trigger en project_probability AFTER UPDATE OF
-- revenue_momentum_input. La cadena queda:
--   key_metrics.mrr  → trg_key_metrics_probability → revenue_momentum_input
--                   → trg_probability_phase → run_phase_engine
-- → El phase engine lee revenue_momentum_input ya actualizado. Orden correcto.
--
-- Edge case documentado (O3.1):
--   Si el usuario añade MRR sin cambiar la dirección de crecimiento
--   (momentum_input = 40 antes y 40 después), trg_probability_phase
--   no dispara (IS DISTINCT FROM = false). O3.1 (count_stable_revenue_months)
--   queda desactualizado hasta el siguiente evento (OBV/task) o cron del domingo.
--   Aceptado en v1: la mayoría de entradas de MRR nuevas cambian momentum
--   (datos ausentes → primer valor, o cambio de dirección) y el cron corrige el resto.
--
-- ── Fixes implementados ──────────────────────────────────────────────────────
--
--   A) trg_probability_phase
--      AFTER UPDATE OF revenue_momentum_input ON project_probability
--      → run_phase_engine('acceleration')
--      Cadena correcta: key_metrics → probability → phase.
--
--   B) trg_tasks_done_phase
--      AFTER UPDATE OF status ON tasks
--      Solo cuando status OLD != 'done' AND NEW == 'done'.
--      Cubre tareas sin function_type.
--
--   C) trg_obvs_insert_outcome_phase
--      AFTER INSERT ON obvs
--      Solo si obv_outcome IS NOT NULL AND tipo NOT IN (discovery/exploracion).
--      Evita doble disparo con trg_obvs_phase.
--
-- Tras 00019: cron semanal = red de seguridad. Triggers = causalidad real.
-- =============================================================================


-- =============================================================================
-- A. project_probability (revenue_momentum_input) → run_phase_engine
--
-- Dispara cuando la probability engine actualiza revenue_momentum_input,
-- lo que ocurre como consecuencia de trg_key_metrics_probability (migration 00007)
-- al insertar/actualizar key_metrics.mrr.
--
-- Cadena completa:
--   INSERT/UPDATE key_metrics.mrr
--     → trg_key_metrics_probability (migration 00007)
--     → run_probability_engine → project_probability.revenue_momentum_input
--     → trg_probability_phase (este trigger)
--     → run_phase_engine (lee revenue_momentum_input ya actualizado)
--
-- También dispara si la probability engine actualiza revenue_momentum_input
-- por otros motivos (OBV tipo venta, etc.) — comportamiento correcto y deseable.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_probability_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM run_phase_engine(NEW.project_id, 'acceleration');
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_probability_phase() IS
  'Trigger: dispara run_phase_engine cuando revenue_momentum_input cambia en project_probability. Implementa la cadena correcta key_metrics → probability → phase. El phase engine lee revenue_momentum_input ya actualizado. Migration 00019.';

CREATE OR REPLACE TRIGGER trg_probability_phase
  AFTER UPDATE OF revenue_momentum_input
  ON project_probability
  FOR EACH ROW
  WHEN (OLD.revenue_momentum_input IS DISTINCT FROM NEW.revenue_momentum_input)
  EXECUTE FUNCTION trg_probability_phase();


-- =============================================================================
-- B. tasks (status → 'done') → run_phase_engine
--
-- Dispara cuando una tarea pasa al estado 'done'.
-- Para tareas CON function_type: ya existe cadena (trg_tasks_coverage →
-- project_function_coverage → trg_coverage_phase → run_phase_engine).
-- Este trigger cubre el gap de tareas sin function_type.
--
-- Doble disparo para tareas CON function_type es idempotente:
-- run_phase_engine usa ON CONFLICT DO UPDATE. Advisory locks (migration 00011)
-- garantizan serialización sin race conditions.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_tasks_done_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo transición hacia 'done'. Evita disparar en ediciones de title,
  -- description, etc., y en transiciones que no sean hacia 'done'.
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status <> 'done') THEN
    PERFORM run_phase_engine(NEW.project_id, 'acceleration');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_tasks_done_phase() IS
  'Trigger: dispara run_phase_engine cuando una tarea pasa a done. Cubre tareas sin function_type (las que tienen function_type ya disparan vía cadena coverage → phase). Migration 00019.';

CREATE OR REPLACE TRIGGER trg_tasks_done_phase
  AFTER UPDATE OF status
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trg_tasks_done_phase();


-- =============================================================================
-- C. obvs INSERT con obv_outcome → run_phase_engine
--
-- Dispara cuando se crea un OBV con obv_outcome ya fijado en el INSERT.
-- El trigger existente trg_obvs_phase (migration 00005) cubre:
--   - INSERT de tipo customer_discovery/exploracion
--   - UPDATE de obv_outcome o tipo (todos los tipos)
-- Este trigger cubre el gap:
--   - INSERT de tipo revenue_validation/venta/otro con obv_outcome ya fijado
--     (formulario OBV que envía outcome en el mismo INSERT)
--
-- Scope NOT IN ('customer_discovery','exploracion') evita doble disparo
-- con trg_obvs_phase, que ya maneja esos tipos en INSERT.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_obvs_insert_outcome_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.obv_outcome IS NOT NULL
     AND NEW.tipo::text NOT IN ('customer_discovery', 'exploracion')
  THEN
    PERFORM run_phase_engine(NEW.project_id, 'acceleration');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_obvs_insert_outcome_phase() IS
  'Trigger: dispara run_phase_engine en INSERT de OBVs con obv_outcome fijado (tipos revenue_validation/venta/otros). Complementa trg_obvs_phase (migration 00005): cubre INSERT de venta con outcome. Migration 00019.';

CREATE OR REPLACE TRIGGER trg_obvs_insert_outcome_phase
  AFTER INSERT
  ON obvs
  FOR EACH ROW
  EXECUTE FUNCTION trg_obvs_insert_outcome_phase();
