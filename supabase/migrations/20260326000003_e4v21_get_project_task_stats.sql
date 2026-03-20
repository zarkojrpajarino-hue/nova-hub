-- =============================================================================
-- MIGRACIÓN 20260326000003 — E4.V2.1: RPC get_project_task_stats()
--
-- Problema: no existe una RPC que centralice las métricas de tareas por proyecto.
-- El hook buildNextAction() recibe taskStats.overdueCount manualmente calculado
-- sin datos de "done_this_week" ni "total_open". La notificación overdue_tasks_warning
-- (N7.V2.1) también necesita este RPC.
--
-- Retorna: { overdue_count, done_this_week, total_open }
--   overdue_count    — tareas con status != 'done' AND fecha_limite < today
--   done_this_week   — tareas con status = 'done' AND completed_at en los últimos 7 días
--   total_open       — tareas con status IN ('todo', 'doing', 'blocked')
--
-- Seguridad: RLS aplica (SECURITY INVOKER — el caller ya está autenticado).
-- El usuario solo ve tareas de proyectos a los que pertenece (RLS en tasks).
-- =============================================================================

CREATE OR REPLACE FUNCTION get_project_task_stats(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_overdue_count  BIGINT;
  v_done_this_week BIGINT;
  v_total_open     BIGINT;
  v_cutoff_week    TIMESTAMPTZ := NOW() - INTERVAL '7 days';
BEGIN
  SELECT
    COUNT(*) FILTER (
      WHERE status::text != 'done'
        AND fecha_limite IS NOT NULL
        AND fecha_limite < CURRENT_DATE
    ),
    COUNT(*) FILTER (
      WHERE status::text = 'done'
        AND completed_at IS NOT NULL
        AND completed_at >= v_cutoff_week
    ),
    COUNT(*) FILTER (
      WHERE status::text IN ('todo', 'doing', 'blocked')
    )
  INTO v_overdue_count, v_done_this_week, v_total_open
  FROM tasks
  WHERE project_id = p_project_id;

  RETURN jsonb_build_object(
    'overdue_count',   COALESCE(v_overdue_count,  0),
    'done_this_week',  COALESCE(v_done_this_week, 0),
    'total_open',      COALESCE(v_total_open,     0)
  );
END;
$$;

COMMENT ON FUNCTION get_project_task_stats(UUID) IS
  'E4.V2.1: Stats de tareas por proyecto. '
  'overdue_count: sin done + fecha_limite < hoy. '
  'done_this_week: done + completed_at en últimos 7 días. '
  'total_open: todo + doing + blocked. '
  'SECURITY INVOKER — RLS de tasks aplica. Prereq de N7.V2.1.';

-- RLS: la tabla tasks ya tiene RLS habilitado (migration 00001/00002).
-- Esta función hereda los permisos del caller (SECURITY INVOKER) → RLS aplica.
GRANT EXECUTE ON FUNCTION get_project_task_stats(UUID) TO authenticated;
