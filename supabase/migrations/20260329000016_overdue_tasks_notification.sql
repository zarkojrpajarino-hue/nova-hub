-- =============================================================================
-- N7.V2.1 -- overdue_tasks_warning notification
--
-- Batch notification: projects with >= 3 overdue tasks get a high-priority
-- warning. Dedup window: 3 days. Added to run_notification_batch().
-- =============================================================================

-- ── 1. notify_overdue_tasks_warning ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_overdue_tasks_warning()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec    RECORD;
  v_count  INTEGER := 0;
BEGIN
  FOR v_rec IN
    SELECT
      t.project_id,
      COUNT(*) AS overdue_count,
      p.nombre AS project_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id AND p.deleted_at IS NULL
    WHERE t.status NOT IN ('done', 'cancelled', 'archived')
      AND t.fecha_limite IS NOT NULL
      AND t.fecha_limite < CURRENT_DATE
    GROUP BY t.project_id, p.nombre
    HAVING COUNT(*) >= 3
  LOOP
    v_count := v_count + notify_all_project_members(
      v_rec.project_id,
      'overdue_tasks_warning',
      'high',
      format('Tienes %s tareas vencidas', v_rec.overdue_count),
      format('Tienes %s tareas vencidas -- tu score de ejecucion esta en riesgo', v_rec.overdue_count),
      format('/proyecto/%s?tab=tareas', v_rec.project_id),
      'Ver tareas',
      jsonb_build_object(
        'overdue_count', v_rec.overdue_count,
        'project_name',  v_rec.project_name
      ),
      3  -- dedup window: 3 days
    );
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION notify_overdue_tasks_warning() IS
  'N7.V2.1: notificacion high cuando un proyecto tiene >= 3 tareas vencidas. Dedup 3 dias.';

-- ── 2. Extend run_notification_batch ────────────────────────────────────────

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

  -- N7.V2.1: overdue tasks warning (project-level aggregation)
  PERFORM notify_overdue_tasks_warning();

  -- Layers 2-5: engine events (por proyecto)
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
  'Batch completo: Layer 1 (actividad) + N7.V2.1 (overdue warning) + Layers 2-5 (engine events). pg_cron cada 6h.';
