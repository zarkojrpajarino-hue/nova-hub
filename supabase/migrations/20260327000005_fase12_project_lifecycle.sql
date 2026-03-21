-- =============================================================================
-- MIGRACIÓN FASE 12 — Sistemas Avanzados: ciclo de vida del proyecto
--
-- 1. ALTER projects: paused_at, archived_at
-- 2. Función pause_project() / unpause_project()
-- 3. Función archive_project()
-- 4. Función remove_project_member() con redistribución
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Nuevas columnas de ciclo de vida
-- ---------------------------------------------------------------------------

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN projects.paused_at IS
  'FASE 12: Proyecto pausado — engines dejan de recalcular. NULL = activo.';
COMMENT ON COLUMN projects.archived_at IS
  'FASE 12: Proyecto archivado — oculto de la lista principal, read-only. NULL = no archivado.';

-- ---------------------------------------------------------------------------
-- 2. pause_project / unpause_project
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pause_project(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only project lead can pause
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
      AND member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      AND is_lead = TRUE
  ) THEN
    RAISE EXCEPTION 'Only project lead can pause';
  END IF;

  UPDATE projects
  SET    paused_at = NOW()
  WHERE  id = p_project_id
    AND  paused_at IS NULL
    AND  archived_at IS NULL
    AND  deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION unpause_project(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only project lead can unpause
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
      AND member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      AND is_lead = TRUE
  ) THEN
    RAISE EXCEPTION 'Only project lead can unpause';
  END IF;

  UPDATE projects
  SET    paused_at = NULL
  WHERE  id = p_project_id
    AND  paused_at IS NOT NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. archive_project
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION archive_project(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only project lead can archive
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
      AND member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      AND is_lead = TRUE
  ) THEN
    RAISE EXCEPTION 'Only project lead can archive';
  END IF;

  UPDATE projects
  SET    archived_at = NOW(),
         paused_at = COALESCE(paused_at, NOW())
  WHERE  id = p_project_id
    AND  archived_at IS NULL
    AND  deleted_at IS NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. remove_project_member + redistribución de tareas
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION remove_project_member(
  p_project_id UUID,
  p_member_id UUID,
  p_reassign_to UUID DEFAULT NULL  -- NULL = unassign tasks, not NULL = reassign
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tasks_affected INTEGER;
BEGIN
  -- Only project lead can remove members
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
      AND member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      AND is_lead = TRUE
  ) THEN
    RETURN jsonb_build_object('error', 'Only project lead can remove members');
  END IF;

  -- Cannot remove lead/owner
  IF EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND member_id = p_member_id AND is_lead = TRUE
  ) THEN
    RETURN jsonb_build_object('error', 'Cannot remove project lead');
  END IF;

  -- Verify reassign target is a member of the project
  IF p_reassign_to IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND member_id = p_reassign_to
  ) THEN
    RETURN jsonb_build_object('error', 'Reassign target is not a member of this project');
  END IF;

  -- Reassign or unassign tasks
  IF p_reassign_to IS NOT NULL THEN
    UPDATE tasks
    SET    assignee_id = p_reassign_to
    WHERE  project_id = p_project_id
      AND  assignee_id = p_member_id
      AND  status != 'done';
  ELSE
    UPDATE tasks
    SET    assignee_id = NULL
    WHERE  project_id = p_project_id
      AND  assignee_id = p_member_id
      AND  status != 'done';
  END IF;

  GET DIAGNOSTICS v_tasks_affected = ROW_COUNT;

  -- Remove member
  DELETE FROM project_members
  WHERE  project_id = p_project_id
    AND  member_id = p_member_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'tasks_reassigned', v_tasks_affected
  );
END;
$$;

COMMENT ON FUNCTION remove_project_member(UUID, UUID, UUID) IS
  'FASE 12: Elimina miembro del proyecto. Reasigna tareas pendientes a p_reassign_to (o unassign si NULL). No permite eliminar al lead.';

-- ---------------------------------------------------------------------------
-- 5. Guard: run_phase_engine skips paused/archived projects
-- Wrap existing function to check project status first
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_project_active(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
      AND deleted_at IS NULL
      AND paused_at IS NULL
      AND archived_at IS NULL
  );
END;
$$;

COMMENT ON FUNCTION is_project_active(UUID) IS
  'FASE 12: Retorna TRUE si el proyecto no está eliminado, pausado ni archivado. Usado por engines antes de recalcular.';
