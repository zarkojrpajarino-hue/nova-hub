-- =====================================================
-- EVIDENCE SYSTEM METRICS - PRODUCTION SCHEMA
-- =====================================================

-- Tabla principal: 1 fila por generación
CREATE TABLE IF NOT EXISTS evidence_generation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificación
  feature TEXT NOT NULL,
  profile TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('hypothesis', 'balanced', 'strict')),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Latencias (ms)
  total_latency_ms INTEGER NOT NULL,
  retrieval_time_ms INTEGER NOT NULL,
  generation_time_ms INTEGER,
  validation_time_ms INTEGER,

  -- Fuentes
  sources_found INTEGER NOT NULL DEFAULT 0,
  sources_cited INTEGER NOT NULL DEFAULT 0,

  -- Coverage & Waste
  coverage_percentage NUMERIC(5,2),
  citation_utilization NUMERIC(5,2),
  waste_flag BOOLEAN DEFAULT false,

  -- Evidence Status
  evidence_status TEXT NOT NULL CHECK (evidence_status IN ('verified', 'partial', 'no_evidence', 'error')),

  -- Timeouts
  timeout_occurred BOOLEAN DEFAULT false,
  timed_out_tiers TEXT[], -- ['official_apis', 'web_news']
  tier_durations_ms JSONB, -- { "user_docs": 600, "official_apis": 4000 }
  retrieval_early_exit BOOLEAN DEFAULT false,

  -- Metadata extensible (sin romper schema)
  metadata JSONB
);

-- Índices críticos para queries rápidas
CREATE INDEX idx_evidence_metrics_created_at ON evidence_generation_metrics(created_at DESC);
CREATE INDEX idx_evidence_metrics_feature ON evidence_generation_metrics(feature);
CREATE INDEX idx_evidence_metrics_profile ON evidence_generation_metrics(profile);
CREATE INDEX idx_evidence_metrics_mode ON evidence_generation_metrics(mode);
CREATE INDEX idx_evidence_metrics_user ON evidence_generation_metrics(user_id);
CREATE INDEX idx_evidence_metrics_project ON evidence_generation_metrics(project_id);
CREATE INDEX idx_evidence_metrics_status ON evidence_generation_metrics(evidence_status);

-- Índice compuesto para queries frecuentes
CREATE INDEX idx_evidence_metrics_feature_mode ON evidence_generation_metrics(feature, mode, created_at DESC);

-- =====================================================
-- Tabla de eventos UI (opcional, alta granularidad)
-- =====================================================

CREATE TABLE IF NOT EXISTS evidence_user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con generación
  generation_id UUID REFERENCES evidence_generation_metrics(id) ON DELETE CASCADE,

  -- Identificación
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Payload del evento (flexible)
  event_data JSONB,

  -- Índices
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'opened_report',
    'changed_mode',
    'regenerated',
    'clicked_search_more',
    'export_attempted',
    'export_blocked',
    'closed_modal'
  ))
);

CREATE INDEX idx_evidence_events_generation ON evidence_user_events(generation_id);
CREATE INDEX idx_evidence_events_user ON evidence_user_events(user_id);
CREATE INDEX idx_evidence_events_type ON evidence_user_events(event_type);
CREATE INDEX idx_evidence_events_created_at ON evidence_user_events(created_at DESC);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Tabla principal
ALTER TABLE evidence_generation_metrics ENABLE ROW LEVEL SECURITY;

-- Usuario solo ve sus propias métricas
CREATE POLICY "Users can view their own metrics"
  ON evidence_generation_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Service role puede insertar todo (desde edge functions)
CREATE POLICY "Service role can insert all"
  ON evidence_generation_metrics FOR INSERT
  WITH CHECK (true);

-- Si necesitas insertar desde cliente (menos recomendado):
-- CREATE POLICY "Users can insert their own metrics"
--   ON evidence_generation_metrics FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- Tabla de eventos
ALTER TABLE evidence_user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON evidence_user_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role puede insertar
CREATE POLICY "Service role can insert events"
  ON evidence_user_events FOR INSERT
  WITH CHECK (true);

-- Cliente puede insertar sus propios eventos UI
CREATE POLICY "Users can insert their own events"
  ON evidence_user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Funciones útiles para queries
-- =====================================================

-- Calcular percentiles para una feature
CREATE OR REPLACE FUNCTION calculate_percentiles(
  p_feature TEXT,
  p_mode TEXT,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  p50 INTEGER,
  p95 INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_latency_ms)::INTEGER AS p50,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms)::INTEGER AS p95
  FROM evidence_generation_metrics
  WHERE feature = p_feature
    AND mode = p_mode
    AND created_at > NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Detectar fricción por feature
CREATE OR REPLACE FUNCTION detect_friction(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  feature TEXT,
  total_gens INTEGER,
  switched_to_hypothesis_rate NUMERIC,
  report_ignored_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.feature,
    COUNT(*)::INTEGER AS total_gens,
    (COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM evidence_user_events e
        WHERE e.generation_id = m.id AND e.event_type = 'changed_mode'
          AND e.event_data->>'new_mode' = 'hypothesis'
      )
    ) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5,2) AS switched_to_hypothesis_rate,
    (COUNT(*) FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM evidence_user_events e
        WHERE e.generation_id = m.id AND e.event_type = 'opened_report'
      )
    ) * 100.0 / NULLIF(COUNT(*), 0))::NUMERIC(5,2) AS report_ignored_rate
  FROM evidence_generation_metrics m
  WHERE m.created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY m.feature
  ORDER BY total_gens DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comentarios útiles
-- =====================================================

COMMENT ON TABLE evidence_generation_metrics IS 'Métricas de cada generación con Evidence System. 1 fila = 1 generación.';
COMMENT ON COLUMN evidence_generation_metrics.tier_durations_ms IS 'JSONB con duración de cada tier: {"user_docs": 600, "official_apis": 4000}';
COMMENT ON COLUMN evidence_generation_metrics.timed_out_tiers IS 'Array de tiers que hicieron timeout: ["official_apis"]';
COMMENT ON COLUMN evidence_generation_metrics.metadata IS 'JSONB extensible para datos adicionales sin romper schema';

COMMENT ON TABLE evidence_user_events IS 'Eventos UI granulares para medir fricción y comportamiento de usuario';
