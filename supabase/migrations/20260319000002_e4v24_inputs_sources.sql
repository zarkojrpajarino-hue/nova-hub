-- E4.V2.4 — Columna inputs_sources JSONB en tablas de output de engines
--
-- Añade trazabilidad de inputs a los 5 outputs del motor de fases:
--   project_phase_state, project_probability, project_risk_score,
--   project_viability_state, project_economic_profile
--
-- NULL para registros históricos (pre-V4) — sin backfill intencionado.
-- En adelante, cada engine run escribe el JSON de fuentes.
--
-- Estructura esperada del JSON:
-- {
--   "obvs_count":        { "value": 12,    "source": "obvs", "ts": "2026-03-18T..." },
--   "mrr":               { "value": 4200,  "source": "stripe", "ts": "..." },
--   "pipeline_value":    { "value": 18000, "source": "hubspot", "ts": "..." },
--   "risk_level":        { "value": "low", "source": "system", "ts": "..." }
-- }
-- Prerequisito de E4.V2.3 (v_engine_input_audit) y U6.V2.4 (InputAuditModal).

ALTER TABLE project_phase_state
  ADD COLUMN IF NOT EXISTS inputs_sources JSONB DEFAULT NULL;

ALTER TABLE project_probability
  ADD COLUMN IF NOT EXISTS inputs_sources JSONB DEFAULT NULL;

ALTER TABLE project_risk_score
  ADD COLUMN IF NOT EXISTS inputs_sources JSONB DEFAULT NULL;

ALTER TABLE project_viability_state
  ADD COLUMN IF NOT EXISTS inputs_sources JSONB DEFAULT NULL;

ALTER TABLE project_economic_profile
  ADD COLUMN IF NOT EXISTS inputs_sources JSONB DEFAULT NULL;

-- Índices GIN opcionales (solo si queries JSONB sobre inputs_sources serán frecuentes)
-- Comentados por ahora — habilitar si F17/F20 necesitan filtrado por fuente
-- CREATE INDEX idx_phase_state_inputs ON project_phase_state USING GIN (inputs_sources);
-- CREATE INDEX idx_probability_inputs ON project_probability USING GIN (inputs_sources);
-- CREATE INDEX idx_risk_score_inputs ON project_risk_score USING GIN (inputs_sources);

COMMENT ON COLUMN project_phase_state.inputs_sources IS
  'JSON de inputs usados en el último run del motor. NULL = registro pre-V4. Ver E4.V2.4.';
COMMENT ON COLUMN project_probability.inputs_sources IS
  'JSON de inputs usados en el último run del motor. NULL = registro pre-V4. Ver E4.V2.4.';
COMMENT ON COLUMN project_risk_score.inputs_sources IS
  'JSON de inputs usados en el último run del motor. NULL = registro pre-V4. Ver E4.V2.4.';
COMMENT ON COLUMN project_viability_state.inputs_sources IS
  'JSON de inputs usados en el último run del motor. NULL = registro pre-V4. Ver E4.V2.4.';
COMMENT ON COLUMN project_economic_profile.inputs_sources IS
  'JSON de inputs usados en el último run del motor. NULL = registro pre-V4. Ver E4.V2.4.';
