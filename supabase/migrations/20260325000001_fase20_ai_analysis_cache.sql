-- FASE 20 — ANÁLISIS ESTRATÉGICO IA v4
-- Tabla de caché para análisis IA por nivel (1/2/3)
-- TTL: Nivel 1 = 7 días · Nivel 2 = 3 días · Nivel 3 = 2 días
-- Stale detection: last_data_updated_at vs integration last_sync_at (updated_at approach)

CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  analysis_level        SMALLINT NOT NULL CHECK (analysis_level IN (1, 2, 3)),
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at            TIMESTAMPTZ NOT NULL,
  last_data_updated_at  TIMESTAMPTZ NOT NULL,  -- max(updated_at) de las fuentes al momento de generar
  data_sources          JSONB NOT NULL DEFAULT '[]'::jsonb,
  output                JSONB NOT NULL,
  tokens_used           INTEGER,
  model                 TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',

  -- Un análisis activo por nivel por proyecto
  UNIQUE (project_id, analysis_level)
);

-- Índice de consulta principal
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_project_level
  ON ai_analysis_cache (project_id, analysis_level, generated_at DESC);

-- RLS
ALTER TABLE ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Miembros del proyecto pueden leer
CREATE POLICY "ai_analysis_cache: members read"
  ON ai_analysis_cache FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE member_id = auth.uid()
    )
  );

-- Owner puede eliminar (para forzar regeneración)
CREATE POLICY "ai_analysis_cache: owner delete"
  ON ai_analysis_cache FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

-- Service role para insert/update desde edge functions
CREATE POLICY "ai_analysis_cache: service insert"
  ON ai_analysis_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ai_analysis_cache: service update"
  ON ai_analysis_cache FOR UPDATE
  USING (true);
