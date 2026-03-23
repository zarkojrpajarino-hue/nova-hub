-- V2 Batch SQL: E4.V2.1 + E4.V2.2 + EC13.V2.1 fixes
-- Applied as single migration for atomicity.

-- ══════════════════════════════════════════════════════════════════
-- E4.V2.1 — RPC get_project_task_stats(project_id UUID)
-- Returns { overdue_count, done_this_week, total_open }
-- Used by buildNextAction() to detect ">=3 overdue → CTA prioritario"
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_project_task_stats(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_overdue_count INT;
  v_done_this_week INT;
  v_total_open INT;
BEGIN
  -- Overdue: open tasks with fecha_limite in the past
  SELECT COUNT(*)
  INTO v_overdue_count
  FROM tasks
  WHERE project_id = p_project_id
    AND status NOT IN ('done', 'cancelled', 'archived')
    AND fecha_limite IS NOT NULL
    AND fecha_limite < CURRENT_DATE;

  -- Done this week: tasks completed in the last 7 days
  SELECT COUNT(*)
  INTO v_done_this_week
  FROM tasks
  WHERE project_id = p_project_id
    AND status = 'done'
    AND updated_at >= NOW() - INTERVAL '7 days';

  -- Total open: all non-closed tasks
  SELECT COUNT(*)
  INTO v_total_open
  FROM tasks
  WHERE project_id = p_project_id
    AND status NOT IN ('done', 'cancelled', 'archived');

  RETURN jsonb_build_object(
    'overdue_count', COALESCE(v_overdue_count, 0),
    'done_this_week', COALESCE(v_done_this_week, 0),
    'total_open', COALESCE(v_total_open, 0)
  );
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- E4.V2.2 — Trigger trg_task_feedback_engine
-- When a task is completed with resultado (feedback), run phase engine
-- with trigger source 'task_completed_with_feedback'
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_task_feedback_engine()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status changes to 'done' AND resultado is not null/empty
  IF NEW.status = 'done'
    AND (OLD.status IS NULL OR OLD.status <> 'done')
    AND NEW.resultado IS NOT NULL
    AND TRIM(NEW.resultado) <> ''
  THEN
    PERFORM run_phase_engine(NEW.project_id, 'task_completed_with_feedback');
  END IF;
  RETURN NEW;
END;
$$;

-- Drop if exists to avoid duplicate
DROP TRIGGER IF EXISTS trg_task_feedback_engine ON tasks;

CREATE TRIGGER trg_task_feedback_engine
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  WHEN (NEW.status = 'done')
  EXECUTE FUNCTION fn_task_feedback_engine();
