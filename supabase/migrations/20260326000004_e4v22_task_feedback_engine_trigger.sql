-- =============================================================================
-- MIGRACIÓN 20260326000004 — E4.V2.2: Trigger task completada → Phase Engine
--
-- Problema: cuando un founder completa una tarea con feedback (TaskCompletionDialog),
-- el Phase Engine no se recalcula. La tarea completada es señal directa de ejecución
-- (compute_task_completion_rate y compute_iteration_velocity la usarán en el siguiente
-- ciclo semanal, pero el founder no ve el impacto inmediato en su score).
--
-- Solución: trigger AFTER UPDATE en tasks.
--   - Dispara solo cuando status cambia de != 'done' a 'done'.
--   - trigger_source = 'acceleration' (semánticamente correcto — tarea completada
--     es señal positiva de ejecución que puede acelerar la fase).
--   - Solo si tasks.project_id IS NOT NULL (tareas huérfanas ignoradas).
--
-- Fix colateral — DEUDA.PE.5 (detectado en revisión de Bloque II):
--   completed_at no se establece automáticamente en BD. MyTasksList.tsx lo pasa,
--   pero otros paths (DnD kanban, AI executor) pueden no pasarlo. Sin completed_at,
--   compute_task_completion_rate (migration 00006) y get_project_task_stats()
--   devuelven done_this_week = 0 incorrectamente.
--   Fix: BEFORE trigger que auto-establece completed_at = NOW() cuando status = 'done'.
--
-- Impacto esperado: el Focus Block se actualiza en tiempo real cuando el fundador
-- completa una tarea, mostrando el cambio en phase_score y phase_status.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_task_done_phase_engine()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo cuando la tarea pasa de cualquier estado a 'done'
  IF OLD.status::text = 'done' OR NEW.status::text != 'done' THEN
    RETURN NEW;
  END IF;

  -- Requiere project_id (tareas sin proyecto son datos inconsistentes)
  IF NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Disparar el Phase Engine — 'acceleration' porque tarea completada
  -- impacta positivamente en compute_task_completion_rate y velocity.
  PERFORM run_phase_engine(NEW.project_id, 'acceleration');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_fn_task_done_phase_engine() IS
  'E4.V2.2: Dispara run_phase_engine cuando una tarea pasa a done. '
  'trigger_source=acceleration (tarea completada = señal positiva de ejecución). '
  'No dispara si ya estaba en done (evita doble cómputo en updates de otros campos).';

DROP TRIGGER IF EXISTS trg_task_done_phase_engine ON tasks;

CREATE TRIGGER trg_task_done_phase_engine
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_task_done_phase_engine();

-- =============================================================================
-- Trigger auxiliar: al actualizar fecha_limite o status → comprobar overdue
--
-- notify_overdue_tasks_warning() (N7.V2.1) emite una notificación HIGH si
-- overdue_count ≥ 3. La llamamos cuando una tarea puede volverse overdue
-- (actualización de fecha_limite) o cuando una tarea pasa a blocked/doing
-- con fecha vencida. Solo aplica si hay un user_id asignado.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_task_overdue_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Solo cuando hay proyecto
  IF NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Solo si la tarea no está done (las done no cuentan como overdue)
  IF NEW.status::text = 'done' THEN
    RETURN NEW;
  END IF;

  -- Obtener el creador/owner del proyecto para la notificación
  SELECT created_by INTO v_owner_id
  FROM   projects
  WHERE  id = NEW.project_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Emitir notificación si overdue_count ≥ 3 (anti-spam interno en la función)
  PERFORM notify_overdue_tasks_warning(NEW.project_id, v_owner_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_overdue_notify ON tasks;

CREATE TRIGGER trg_task_overdue_notify
  AFTER INSERT OR UPDATE OF status, fecha_limite ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_task_overdue_notify();

COMMENT ON TRIGGER trg_task_overdue_notify ON tasks IS
  'N7.V2.1 wiring: llama notify_overdue_tasks_warning() cuando cambia status o fecha_limite. '
  'Anti-spam en la función (48h). Solo si project_id y owner no son NULL.';

COMMENT ON TRIGGER trg_task_done_phase_engine ON tasks IS
  'E4.V2.2: AFTER UPDATE OF status — cuando task.status pasa a done → run_phase_engine(). '
  'Solo cuando cambia status (no otros campos). trigger_source=acceleration.';

-- =============================================================================
-- Fix colateral DEUDA.PE.5: BEFORE trigger — auto-set completed_at
--
-- compute_task_completion_rate() y get_project_task_stats() dependen de
-- tasks.completed_at (campo explícito, NOT updated_at) para calcular
-- done_this_week. Solo MyTasksList.tsx lo pasa explícitamente; el kanban DnD
-- y el AI executor no lo hacen, causando done_this_week = 0 incorrecto.
--
-- Fix: si completed_at está NULL cuando status → 'done', lo establecemos
-- aquí en BD para garantizar consistencia independientemente del path de UI.
-- Si el cliente ya lo pasa (MyTasksList), no lo sobreescribimos (IS NULL guard).
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_task_set_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo cuando la tarea pasa a 'done' por primera vez
  IF NEW.status::text = 'done' AND OLD.status::text != 'done' THEN
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := NOW();
    END IF;
  END IF;

  -- Si la tarea sale de 'done', limpiar completed_at (reabierta)
  IF OLD.status::text = 'done' AND NEW.status::text != 'done' THEN
    NEW.completed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_set_completed_at ON tasks;

CREATE TRIGGER trg_task_set_completed_at
  BEFORE UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_task_set_completed_at();

COMMENT ON FUNCTION trg_fn_task_set_completed_at() IS
  'DEUDA.PE.5: Auto-establece completed_at = NOW() cuando status → done y completed_at IS NULL. '
  'No sobreescribe si el cliente ya lo pasó. Limpia completed_at si la tarea se reabre. '
  'Garantiza que compute_task_completion_rate() y get_project_task_stats() sean correctos '
  'independientemente del path de UI (DnD kanban, AI executor, etc.).';
