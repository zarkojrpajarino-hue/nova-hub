-- =============================================================================
-- P4.3 — moment_history
-- Persistencia de momentos detectados para historial + retry.
-- =============================================================================

CREATE TABLE IF NOT EXISTS moment_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  moment_type     TEXT        NOT NULL,
  moment_severity TEXT        NOT NULL,
  title           TEXT        NOT NULL,
  message         TEXT,
  data            JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_at         TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moment_history_project
  ON moment_history (project_id, created_at DESC);

ALTER TABLE moment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moment_history_members_read" ON moment_history
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "moment_history_system_write" ON moment_history
  FOR INSERT WITH CHECK (true);
