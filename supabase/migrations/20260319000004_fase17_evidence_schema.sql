-- FASE 17 — BLOQUE C: Schema de evidencia
-- T17.9  Añadir campos de evidencia a integration_insights
-- T17.10 Crear tabla project_source_preferences
-- T17.11 Backfill de evidence_type en insights existentes
--
-- Depende de: 20260315000002_bloque_b_integration_tables.sql
-- Independiente de Bloque B (motor de pesos) — puede aplicarse en paralelo.

-- ─────────────────────────────────────────────────────────────────────────────
-- T17.9 — Añadir campos de evidencia a integration_insights
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE integration_insights
  ADD COLUMN IF NOT EXISTS evidence_type       TEXT
    CHECK (evidence_type IN ('observed','declared','inferred','estimated'))
    DEFAULT 'inferred',
  ADD COLUMN IF NOT EXISTS sources_used        JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS sources_discarded   JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS low_evidence_quality BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice para filtrar insights de baja calidad en síntesis
-- (partial index sobre project_id, evidence_type donde calidad no es baja)
CREATE INDEX IF NOT EXISTS idx_integration_insights_evidence_type
  ON integration_insights (project_id, evidence_type)
  WHERE low_evidence_quality = FALSE;

-- sources_used schema (array de objetos):
--   [{ "source": "stripe", "confidence": 0.9, "timestamp": "ISO", "entity_count": 3 }]
-- sources_discarded schema:
--   [{ "source": "user_manual", "score": 0.38, "reason": "lower_score_than_stripe" }]

-- ─────────────────────────────────────────────────────────────────────────────
-- T17.10 — Tabla project_source_preferences
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_source_preferences (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source          TEXT        NOT NULL,
  enabled         BOOLEAN     NOT NULL DEFAULT TRUE,
  weight_override NUMERIC
    CHECK (weight_override IS NULL OR (weight_override >= 0.1 AND weight_override <= 1.0)),
  excluded_fields TEXT[]      NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (project_id, source)
);

ALTER TABLE project_source_preferences ENABLE ROW LEVEL SECURITY;

-- Miembros del proyecto pueden leer y escribir sus preferencias de fuente.
-- Un proyecto no puede leer preferencias de otro.
CREATE POLICY "source_prefs: members read/write"
  ON project_source_preferences
  USING  (auth_is_project_member(project_id))
  WITH CHECK (auth_is_project_member(project_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- T17.11 — Backfill de evidence_type en insights existentes
-- ─────────────────────────────────────────────────────────────────────────────
-- NOTA: entity_ids es UUID[] (no JSONB) → usar cardinality() no jsonb_array_length()

-- Insights de agentes reales con entidades concretas → 'observed'
UPDATE integration_insights
  SET evidence_type = 'observed'
  WHERE agent_type IN ('finance', 'sales', 'execution', 'calendar')
    AND cardinality(entity_ids) > 0
    AND evidence_type = 'inferred';  -- solo los que tienen el default

-- Insights sin trazabilidad a entidades y baja confianza → 'estimated' + low_evidence_quality
UPDATE integration_insights
  SET evidence_type = 'estimated',
      low_evidence_quality = TRUE
  WHERE entity_ids = '{}'
    AND confidence < 0.5
    AND evidence_type = 'inferred';
