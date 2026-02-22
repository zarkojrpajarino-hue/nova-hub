-- =====================================================
-- TRACKER AUTOMÁTICO DE PROGRESO
-- =====================================================
-- Auto-actualiza contadores cuando se completan tareas/OBVs
-- =====================================================

-- TRIGGER 1: Actualizar tasks_completed cuando se marca tarea como done
CREATE OR REPLACE FUNCTION update_exploration_task_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exploration_id UUID;
  member_uuid UUID;
  tasks_done INTEGER;
  tasks_on_time INTEGER;
BEGIN
  -- Solo si la tarea cambió a 'done'
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN

    -- Obtener member_id del assignee
    SELECT id INTO member_uuid
    FROM members
    WHERE id = NEW.assignee_id;

    IF member_uuid IS NULL THEN
      RETURN NEW;
    END IF;

    -- Buscar exploración activa de este miembro en este proyecto
    SELECT id INTO exploration_id
    FROM role_exploration_periods
    WHERE member_id = member_uuid
      AND project_id = NEW.project_id
      AND status = 'active'
    LIMIT 1;

    IF exploration_id IS NOT NULL THEN
      -- Contar tareas completadas
      SELECT COUNT(*) INTO tasks_done
      FROM tasks
      WHERE project_id = NEW.project_id
        AND assignee_id = member_uuid
        AND status = 'done';

      -- Contar tareas completadas "on time" (antes del due_date)
      SELECT COUNT(*) INTO tasks_on_time
      FROM tasks
      WHERE project_id = NEW.project_id
        AND assignee_id = member_uuid
        AND status = 'done'
        AND (completed_at IS NULL OR completed_at <= due_date);

      -- Actualizar exploration period
      UPDATE role_exploration_periods
      SET
        tasks_completed = tasks_done,
        tasks_on_time = tasks_on_time,
        updated_at = NOW()
      WHERE id = exploration_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger en tasks
DROP TRIGGER IF EXISTS trigger_update_exploration_task_progress ON tasks;

CREATE TRIGGER trigger_update_exploration_task_progress
  AFTER INSERT OR UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_exploration_task_progress();

-- =====================================================
-- TRIGGER 2: Actualizar obvs_completed cuando se valida OBV
-- =====================================================

CREATE OR REPLACE FUNCTION update_exploration_obv_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exploration_id UUID;
  member_uuid UUID;
  obvs_done INTEGER;
  obvs_validated INTEGER;
  initiative_count INTEGER;
BEGIN
  -- Solo si el OBV cambió a 'validated'
  IF NEW.status = 'validated' AND (OLD.status IS NULL OR OLD.status != 'validated') THEN

    -- Obtener owner_id
    member_uuid := NEW.owner_id;

    -- Buscar exploración activa
    SELECT id INTO exploration_id
    FROM role_exploration_periods
    WHERE member_id = member_uuid
      AND project_id = NEW.project_id
      AND status = 'active'
    LIMIT 1;

    IF exploration_id IS NOT NULL THEN
      -- Contar OBVs completados
      SELECT COUNT(*) INTO obvs_done
      FROM obvs
      WHERE project_id = NEW.project_id
        AND owner_id = member_uuid
        AND status IN ('validated', 'completed');

      -- Contar OBVs validados
      SELECT COUNT(*) INTO obvs_validated
      FROM obvs
      WHERE project_id = NEW.project_id
        AND owner_id = member_uuid
        AND status = 'validated';

      -- Contar OBVs de iniciativa propia (sin task_id asignada)
      SELECT COUNT(*) INTO initiative_count
      FROM obvs
      WHERE project_id = NEW.project_id
        AND owner_id = member_uuid
        AND status IN ('validated', 'completed')
        AND (task_id IS NULL OR task_id = '');

      -- Actualizar exploration period
      UPDATE role_exploration_periods
      SET
        obvs_completed = obvs_done,
        obvs_validated = obvs_validated,
        initiative_obvs = initiative_count,
        updated_at = NOW()
      WHERE id = exploration_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger en obvs
DROP TRIGGER IF EXISTS trigger_update_exploration_obv_progress ON obvs;

CREATE TRIGGER trigger_update_exploration_obv_progress
  AFTER INSERT OR UPDATE OF status ON obvs
  FOR EACH ROW
  EXECUTE FUNCTION update_exploration_obv_progress();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver funciones creadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%exploration%progress%';

-- Ver triggers creados
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%exploration%progress%';

-- ✅ LISTO - Ahora los contadores se actualizan automáticamente
