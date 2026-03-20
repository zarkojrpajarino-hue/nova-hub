-- AUD.M.6 — founder_tool_feedback: captura si las tareas creadas desde el toolkit
--           se completaron o ignoraron.
--
-- Tablas:
--   founder_tool_tasks: vínculo entre una generación de toolkit y las tareas creadas
--   founder_tool_feedback: señal aggregada de uso (completion_rate) por generación
--
-- Flujo:
--   1. Al crear tarea desde toolkit: INSERT en founder_tool_tasks
--   2. Trigger en tasks.status → 'done' actualiza founder_tool_tasks.completed_at
--   3. founder_tool_feedback se calcula como VIEW sobre founder_tool_tasks

-- ── 1. Tabla de vínculo toolkit → tareas ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS founder_tool_tasks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tool_type        TEXT        NOT NULL,  -- buyer_persona | lead_scoring | etc.
  tool_cache_id    UUID,                  -- FK a founder_tool_cache si existe
  task_id          UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,           -- se rellena cuando task.status → 'done'
  ignored_at       TIMESTAMPTZ            -- se rellena si la tarea se archiva sin completar
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_founder_tool_tasks_task
  ON founder_tool_tasks (task_id);

CREATE INDEX IF NOT EXISTS idx_founder_tool_tasks_project_tool
  ON founder_tool_tasks (project_id, tool_type, created_at DESC);

-- RLS
ALTER TABLE founder_tool_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founder_tool_tasks: member read/insert"
  ON founder_tool_tasks FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE member_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE member_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

-- ── 2. Trigger: cuando tarea → 'done', marcar completed_at ───────────────────

CREATE OR REPLACE FUNCTION trg_fn_toolkit_task_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    UPDATE founder_tool_tasks
    SET    completed_at = NOW()
    WHERE  task_id      = NEW.id
      AND  completed_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_toolkit_task_completed ON tasks;
CREATE TRIGGER trg_toolkit_task_completed
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_toolkit_task_completed();

-- ── 3. VIEW: completion_rate aggregado por tool_type por proyecto ─────────────

CREATE OR REPLACE VIEW founder_tool_feedback AS
SELECT
  project_id,
  tool_type,
  COUNT(*)                                   AS tasks_created,
  COUNT(completed_at)                        AS tasks_completed,
  COUNT(ignored_at)                          AS tasks_ignored,
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE ROUND(COUNT(completed_at)::NUMERIC / COUNT(*), 3)
  END AS completion_rate,
  MAX(created_at)                            AS last_task_at
FROM founder_tool_tasks
GROUP BY project_id, tool_type;

COMMENT ON VIEW founder_tool_feedback IS
  'AUD.M.6: completion_rate de tareas creadas desde el toolkit por proyecto y tipo de herramienta. '
  'completion_rate = tasks_completed / tasks_created.';
