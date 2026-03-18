-- ============================================================
-- 20260312000053_fase11_project_user_state.sql
--
-- V11.0: tabla project_user_state
--
-- Qué hace:
--   Crea tabla project_user_state con last_seen_at por
--   (project_id, user_id) para la capa de re-entry.
--
--   Motivación: la ausencia relevante es per-project, no global.
--   Un founder activo en proyecto A puede llevar 2 semanas sin
--   abrir proyecto B. Re-entry solo debe dispararse en B.
--
--   La tabla es minimal v1: solo last_seen_at.
--   El payload de re-entry se deriva en el frontend desde
--   project_user_state + get_optimus_context() — no tabla nueva.
--
-- Threshold re-entry v1: last_seen_at < NOW() - INTERVAL '7 days'.
--
-- RLS: cada usuario solo puede leer y escribir su propia fila.
--
-- Sin efectos sobre tablas existentes.
-- ============================================================

-- ── Tabla ────────────────────────────────────────────────────────────────────

CREATE TABLE project_user_state (
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ,
  PRIMARY KEY (project_id, user_id)
);

COMMENT ON TABLE project_user_state IS
  'V11.0. Estado per-usuario per-proyecto. '
  'last_seen_at: cuándo abrió el usuario este proyecto por última vez. '
  'Usado por la capa de re-entry (Surface 1 modo transitorio) para detectar '
  'ausencia > 7 días y mostrar "Since you were away". '
  'Minimal v1 — otras columnas de estado de usuario pueden añadirse aquí.';

COMMENT ON COLUMN project_user_state.last_seen_at IS
  'Timestamp de la última vez que el usuario abrió este proyecto. '
  'La UI actualiza este campo en cada carga de ProjectPage. '
  'NULL = usuario nunca ha abierto el proyecto (tratado como no re-entry). '
  'Re-entry activo cuando: last_seen_at < NOW() - INTERVAL ''7 days'' (threshold v1).';

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE project_user_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_user_state: own row"
  ON project_user_state
  FOR ALL
  TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- ── Índice ────────────────────────────────────────────────────────────────────

-- Consulta principal: "¿cuándo vio este usuario el proyecto?"
-- La PK (project_id, user_id) ya cubre la búsqueda exacta.
-- Índice adicional para operaciones de admin/cron por proyecto (si hace falta en v2).
CREATE INDEX idx_project_user_state_project
  ON project_user_state(project_id);
