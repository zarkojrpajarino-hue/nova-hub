-- =============================================================================
-- MIGRACIÓN FASE 22 — Expansion Intelligence
--
-- 1. expansion_analysis_cache: resultados de análisis IA (TTL 14 días)
-- 2. expansion_events: eventos curados por mercado/sector
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. expansion_analysis_cache
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS expansion_analysis_cache (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  input_snapshot  JSONB       NOT NULL DEFAULT '{}',   -- datos del negocio usados
  output          JSONB       NOT NULL DEFAULT '{}',   -- resultado completo del análisis
  markets         JSONB       NOT NULL DEFAULT '[]'    -- array de mercados recomendados
);

CREATE INDEX IF NOT EXISTS idx_expansion_cache_project
  ON expansion_analysis_cache (project_id, generated_at DESC);

COMMENT ON TABLE expansion_analysis_cache IS
  'FASE 22: Caché de análisis de expansión generado por IA. TTL 14 días. 1 análisis activo por proyecto.';

-- RLS
ALTER TABLE expansion_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expansion_analysis_cache: project members read"
  ON expansion_analysis_cache FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = expansion_analysis_cache.project_id
        AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "expansion_analysis_cache: project owner manage"
  ON expansion_analysis_cache FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = expansion_analysis_cache.project_id
        AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
        AND pm.is_lead = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = expansion_analysis_cache.project_id
        AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
        AND pm.is_lead = TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- 2. expansion_events — tabla curada de eventos por mercado
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS expansion_events (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  country             TEXT    NOT NULL,
  city                TEXT,
  sector              TEXT[]  NOT NULL DEFAULT '{}',
  event_name          TEXT    NOT NULL,
  event_date          DATE,
  url                 TEXT,
  cost_eur_approx     INTEGER,
  why_relevant_template TEXT,
  reference_hubs      JSONB,   -- aceleradoras/hubs del país
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expansion_events_country_date
  ON expansion_events (country, event_date);

COMMENT ON TABLE expansion_events IS
  'FASE 22: Eventos de networking/conferencias por mercado. Curados manualmente, actualizados trimestralmente.';

-- RLS: lectura pública para todos los autenticados
ALTER TABLE expansion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expansion_events: authenticated read"
  ON expansion_events FOR SELECT TO authenticated
  USING (TRUE);
