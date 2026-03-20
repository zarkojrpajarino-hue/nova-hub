-- DEUDA.PE.4 — notify_overdue_tasks_warning notifica a todos los project_members
--              (no solo al created_by del proyecto)
--
-- DEUDA.PE.9 — trg_hubspot_sync_completed ejecuta engines en transacción separada
--              usando BEGIN/EXCEPTION para evitar rollback del sync si el engine falla.

-- ── DEUDA.PE.4: fix trg_fn_task_overdue_notify ───────────────────────────────

CREATE OR REPLACE FUNCTION trg_fn_task_overdue_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
BEGIN
  IF NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status::text = 'done' THEN
    RETURN NEW;
  END IF;

  -- PE.4 fix: notificar a TODOS los miembros activos del proyecto (no solo created_by)
  FOR v_member IN
    SELECT DISTINCT member_id AS user_id
    FROM   project_members
    WHERE  project_id = NEW.project_id
    UNION
    SELECT created_by AS user_id
    FROM   projects
    WHERE  id = NEW.project_id
  LOOP
    BEGIN
      PERFORM notify_overdue_tasks_warning(NEW.project_id, v_member.user_id);
    EXCEPTION WHEN OTHERS THEN
      -- No abortar si una notificación falla para un miembro concreto
      NULL;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_fn_task_overdue_notify() IS
  'DEUDA.PE.4 fix: notifica a todos los project_members (no solo created_by) '
  'cuando overdue_count ≥ 3 en el proyecto.';

-- ── DEUDA.PE.9: engines en EXCEPTION block para no revertir el sync ──────────
-- Leemos el trigger existente y lo reemplazamos con EXCEPTION wrapping.

CREATE OR REPLACE FUNCTION trg_fn_hubspot_sync_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Solo actuar cuando el sync_run pasa a 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Obtener project_id desde integration_connections
    SELECT ic.project_id INTO v_project_id
    FROM   integration_connections ic
    WHERE  ic.id = NEW.connection_id;

    IF v_project_id IS NOT NULL THEN
      -- PE.9 fix: engines en bloque EXCEPTION para no revertir la transacción del sync
      BEGIN
        PERFORM run_probability_engine(v_project_id, 'acceleration');
      EXCEPTION WHEN OTHERS THEN
        -- Engine falla → log pero el sync queda 'completed'
        RAISE WARNING 'run_probability_engine failed for project %: %', v_project_id, SQLERRM;
      END;

      BEGIN
        PERFORM run_risk_engine(v_project_id, 'block_event');
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'run_risk_engine failed for project %: %', v_project_id, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_fn_hubspot_sync_completed() IS
  'DEUDA.PE.9 fix: engines en EXCEPTION block — si run_probability_engine o '
  'run_risk_engine fallan, el sync_run queda como completed (no hace rollback). '
  'Los errores de engine se loguean como WARNING.';
