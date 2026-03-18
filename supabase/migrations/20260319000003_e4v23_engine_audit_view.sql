-- E4.V2.3 — SQL view v_engine_input_audit
--
-- Prerequisito: E4.V2.4 (inputs_sources JSONB) debe estar aplicada.
-- Prerequisito de: FASE 17 T17.3 (UI de trazabilidad) y F20.4 (PreAnalysisDataReview).
--
-- La view expone, por proyecto y motor, todos los inputs registrados con:
--   - qué motor generó el output (engine)
--   - cuál fue el output (output_value)
--   - cuándo se calculó (computed_at)
--   - el JSON de fuentes completo (raw_sources)
--   - campos extraídos para queries sin parseo JSON en cliente
--
-- SECURITY INVOKER: la view hereda los permisos del usuario autenticado.
-- RLS de las tablas base se aplica automáticamente — no se necesitan políticas extra.
--
-- Nombres de columna verificados contra schema v1 (20260224000002):
--   project_phase_state:    last_calculated_at, current_phase
--   project_probability:    last_calculated_at, probability_score
--   project_risk_score:     last_calculated_at, risk_level
--   project_viability_state:last_evaluated_at, viability_status
--   project_economic_profile:source_timestamp (+ last_updated_at), model_type

CREATE OR REPLACE VIEW v_engine_input_audit
WITH (security_invoker = true)
AS

-- ── Phase Engine ──────────────────────────────────────────────────────────────
SELECT
  ps.project_id,
  'phase_state'                         AS engine,
  ps.current_phase::text                AS output_value,
  ps.last_calculated_at                 AS computed_at,
  ps.inputs_sources                     AS raw_sources,

  -- Inputs comunes extraídos para UI (de raw_sources JSONB)
  (ps.inputs_sources->>'obvs_count')                   AS input_obvs_count,
  (ps.inputs_sources->'obvs_count'->>'source')         AS input_obvs_count_source,
  (ps.inputs_sources->'obvs_count'->>'ts')             AS input_obvs_count_ts,

  (ps.inputs_sources->>'validation_rate')              AS input_validation_rate,
  (ps.inputs_sources->'validation_rate'->>'source')    AS input_validation_rate_source,
  (ps.inputs_sources->'validation_rate'->>'ts')        AS input_validation_rate_ts,

  (ps.inputs_sources->>'mrr')                          AS input_mrr,
  (ps.inputs_sources->'mrr'->>'source')                AS input_mrr_source,
  (ps.inputs_sources->'mrr'->>'ts')                    AS input_mrr_ts

FROM project_phase_state ps

UNION ALL

-- ── Probability Engine ────────────────────────────────────────────────────────
SELECT
  pp.project_id,
  'probability'                          AS engine,
  pp.probability_score::text             AS output_value,
  pp.last_calculated_at                  AS computed_at,
  pp.inputs_sources                      AS raw_sources,

  (pp.inputs_sources->>'iteration_velocity')             AS input_obvs_count,
  (pp.inputs_sources->'iteration_velocity'->>'source')   AS input_obvs_count_source,
  (pp.inputs_sources->'iteration_velocity'->>'ts')       AS input_obvs_count_ts,

  (pp.inputs_sources->>'evidence_quality')               AS input_validation_rate,
  (pp.inputs_sources->'evidence_quality'->>'source')     AS input_validation_rate_source,
  (pp.inputs_sources->'evidence_quality'->>'ts')         AS input_validation_rate_ts,

  NULL AS input_mrr,
  NULL AS input_mrr_source,
  NULL AS input_mrr_ts

FROM project_probability pp

UNION ALL

-- ── Risk Score Engine ─────────────────────────────────────────────────────────
SELECT
  prs.project_id,
  'risk_score'                           AS engine,
  prs.risk_level                         AS output_value,
  prs.last_calculated_at                 AS computed_at,
  prs.inputs_sources                     AS raw_sources,

  (prs.inputs_sources->>'runway_months')                 AS input_obvs_count,
  (prs.inputs_sources->'runway_months'->>'source')       AS input_obvs_count_source,
  (prs.inputs_sources->'runway_months'->>'ts')           AS input_obvs_count_ts,

  (prs.inputs_sources->>'burn_rate')                     AS input_validation_rate,
  (prs.inputs_sources->'burn_rate'->>'source')           AS input_validation_rate_source,
  (prs.inputs_sources->'burn_rate'->>'ts')               AS input_validation_rate_ts,

  NULL AS input_mrr,
  NULL AS input_mrr_source,
  NULL AS input_mrr_ts

FROM project_risk_score prs

UNION ALL

-- ── Viability Engine ──────────────────────────────────────────────────────────
SELECT
  pvs.project_id,
  'viability_state'                      AS engine,
  pvs.viability_status                   AS output_value,
  pvs.last_evaluated_at                  AS computed_at,
  pvs.inputs_sources                     AS raw_sources,

  NULL AS input_obvs_count,
  NULL AS input_obvs_count_source,
  NULL AS input_obvs_count_ts,

  NULL AS input_validation_rate,
  NULL AS input_validation_rate_source,
  NULL AS input_validation_rate_ts,

  NULL AS input_mrr,
  NULL AS input_mrr_source,
  NULL AS input_mrr_ts

FROM project_viability_state pvs

UNION ALL

-- ── Economic Profile Engine ───────────────────────────────────────────────────
SELECT
  pep.project_id,
  'economic_profile'                     AS engine,
  pep.model_type                         AS output_value,
  COALESCE(pep.source_timestamp, pep.last_updated_at) AS computed_at,
  pep.inputs_sources                     AS raw_sources,

  NULL AS input_obvs_count,
  NULL AS input_obvs_count_source,
  NULL AS input_obvs_count_ts,

  NULL AS input_validation_rate,
  NULL AS input_validation_rate_source,
  NULL AS input_validation_rate_ts,

  (pep.inputs_sources->>'mrr')                           AS input_mrr,
  (pep.inputs_sources->'mrr'->>'source')                 AS input_mrr_source,
  (pep.inputs_sources->'mrr'->>'ts')                     AS input_mrr_ts

FROM project_economic_profile pep;

COMMENT ON VIEW v_engine_input_audit IS
  'Vista unificada de inputs de los 5 engines con fuente y timestamp. Prerequisito de FASE 17 (T17.3) y FASE 20 (F20.4). Lee inputs_sources JSONB (E4.V2.4). SECURITY INVOKER — respeta RLS de tablas base. NULL en inputs_sources = registros pre-V4.';
