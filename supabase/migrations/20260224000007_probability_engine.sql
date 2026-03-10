-- =============================================================================
-- MIGRACIÓN 00007 — PROBABILITY ENGINE
--
-- compute_revenue_momentum(project_id)     → NUMERIC (0–100)
-- compute_data_completeness(project_id)   → NUMERIC (0–100)
-- run_probability_engine(project_id, trigger_source)
--
-- Fórmula canónica v1:
--   probability_score = fase_score×0.35 + execution_rate×0.20
--                     + validation_strength×0.15 + revenue_momentum×0.15
--                     + capacity_health×0.15
--
-- Todos los inputs retornan NUMERIC (nunca NULL) → no se necesita redistribución de pesos.
--
-- SCHEMA CONFIRMADO:
--   project_probability            : una fila por proyecto (UPSERT idempotente)
--   project_probability_history    : append-only; trigger_source CHECK ('weekly_job','acceleration','regression')
--   project_phase_state.phase_score: fuente de fase_score (F0.35)
--   key_metrics.mrr                : fuente de revenue_momentum Phase 2+
--   financial_projections          : fuente de D2 (data_completeness)
--   project_function_coverage      : fuente de D4 (data_completeness)
--   project_strategy_current       : fuente de D5 (data_completeness)
-- =============================================================================

-- =============================================================================
-- 1. compute_revenue_momentum(p_project_id) → NUMERIC (0–100)
--
-- DEFINICIÓN (canónica v1):
--   Phase 1: 30 (neutral — no se penaliza sin revenue)
--   Phase 2+: compara key_metrics.mrr entre los últimos 2 registros
--     crecimiento → 60 + (growth_pct × 0.40), cap 100
--     estable     → 40
--     caída       → MAX(0, 40 - (decline_pct × 0.50))
--
-- Sin datos en Phase 2+: devuelve 30 (neutral — sin información ≠ mal negocio)
--
-- NOTA solo-fundador (v2): capacity_health × 0.85 por carga cognitiva mayor.
--   En v1 no se aplica porque projects no tiene campo work_mode.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_revenue_momentum(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phase       SMALLINT;
  v_mrr_curr    NUMERIC;
  v_mrr_prev    NUMERIC;
  v_growth_pct  NUMERIC;
BEGIN
  -- Fase actual
  SELECT current_phase INTO v_phase
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  v_phase := COALESCE(v_phase, 1);

  -- Phase 1: neutral — sin revenue esperado
  IF v_phase = 1 THEN
    RETURN 30;
  END IF;

  -- Phase 2+: comparar los dos MRR más recientes de key_metrics
  SELECT mrr INTO v_mrr_curr
  FROM   key_metrics
  WHERE  project_id = p_project_id
  ORDER  BY date DESC
  LIMIT  1 OFFSET 0;

  SELECT mrr INTO v_mrr_prev
  FROM   key_metrics
  WHERE  project_id = p_project_id
  ORDER  BY date DESC
  LIMIT  1 OFFSET 1;

  -- Sin datos suficientes → neutral
  IF v_mrr_curr IS NULL OR v_mrr_prev IS NULL THEN
    RETURN 30;
  END IF;

  IF v_mrr_curr > v_mrr_prev THEN
    -- Crecimiento: 60 + (growth_pct × 0.40), cap 100
    IF v_mrr_prev = 0 THEN
      RETURN 100;  -- crecimiento desde cero = máximo
    END IF;
    v_growth_pct := ((v_mrr_curr - v_mrr_prev) / v_mrr_prev) * 100.0;
    RETURN LEAST(100.0, 60.0 + (v_growth_pct * 0.40));

  ELSIF v_mrr_curr = v_mrr_prev THEN
    -- Estable
    RETURN 40;

  ELSE
    -- Caída: MAX(0, 40 - (decline_pct × 0.50))
    IF v_mrr_prev = 0 THEN
      RETURN 40;  -- ambos son 0 → no aplica caída
    END IF;
    v_growth_pct := ((v_mrr_prev - v_mrr_curr) / v_mrr_prev) * 100.0;
    RETURN GREATEST(0.0, 40.0 - (v_growth_pct * 0.50));
  END IF;
END;
$$;

COMMENT ON FUNCTION compute_revenue_momentum(UUID) IS
  'Momentum de revenue para Probability Engine. Phase 1=30 (neutral). Phase 2+: crecimiento MRR→60+(g×0.4) cap 100, estable→40, caída→MAX(0,40-(d×0.5)). Fuente: key_metrics.mrr. Sin datos→30.';

-- =============================================================================
-- 2. compute_data_completeness(p_project_id) → NUMERIC (0–100)
--
-- DEFINICIÓN (F1.13 canónica v1):
--
--   D1 — Activity Coverage (máx 20)
--     ≥1 OBV en últimas 4 semanas                          → 10
--     ≥3 tareas con status='done' en últimas 4 semanas
--       con function_type IN (demand, delivery, cash)       → 10
--     (independientes — se suman si ambas condiciones)
--
--   D2 — Financial Data (máx 25)
--     costes registrados en últimos 3 meses                 → 15
--     ingresos registrados en últimos 3 meses               → 10
--     (suma si ambas; fuente: financial_projections + key_metrics.mrr)
--
--   D3 — Evidence Quality (máx 20)
--     ≥1 OBV con verification_multiplier ≥ 1.10            → 20
--     ≥1 OBV con verification_multiplier = 1.00            → 10
--     else (incluido operational_system ×0.80)             →  0
--     (no acumulativo — toma el máximo)
--
--   D4 — Function Structure (máx 20)
--     ≥1 función coverage_level='strong'                   → 20
--     ≥2 funciones coverage_level='basic' (sin strong)     → 15
--     ≥1 función coverage_level='basic'  (sin strong)      → 10
--     todas 'none'                                         →  0
--     (strong domina — no acumula con basic)
--
--   D5 — Strategic Definition (máx 15)
--     segment_text  definido (≥10 chars)                   →  5
--     problem_text  definido (≥10 chars)                   →  5
--     value_prop_text definido (≥10 chars)                 →  5
--
--   data_completeness_score = D1 + D2 + D3 + D4 + D5, cap 100
--
-- NOTA D1: La spec F1.13 dice status='completed' pero el enum task_status
-- usa 'done'. Se usa 'done' para alinearse con el schema real.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_data_completeness(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_d1        SMALLINT := 0;
  v_d2        SMALLINT := 0;
  v_d3        SMALLINT := 0;
  v_d4        SMALLINT := 0;
  v_d5        SMALLINT := 0;

  -- D1
  v_has_obv_4w    BOOLEAN;
  v_tasks_done_4w BIGINT;

  -- D2
  v_has_costs_3m  BOOLEAN;
  v_has_rev_3m    BOOLEAN;
  v_cutoff_3m     DATE;

  -- D3
  v_best_mult     NUMERIC;

  -- D4
  v_strong_count  BIGINT;
  v_basic_count   BIGINT;

  -- D5
  v_seg_len   INTEGER;
  v_prob_len  INTEGER;
  v_vp_len    INTEGER;
BEGIN
  -- -----------------------------------------------------------------------
  -- D1 — Activity Coverage
  -- -----------------------------------------------------------------------
  SELECT EXISTS (
    SELECT 1 FROM obvs
    WHERE  project_id = p_project_id
      AND  created_at >= NOW() - INTERVAL '28 days'
  ) INTO v_has_obv_4w;

  IF v_has_obv_4w THEN
    v_d1 := v_d1 + 10;
  END IF;

  SELECT COUNT(*) INTO v_tasks_done_4w
  FROM   tasks
  WHERE  project_id    = p_project_id
    AND  status        = 'done'
    AND  function_type IN ('demand', 'delivery', 'cash')
    AND  completed_at >= NOW() - INTERVAL '28 days';

  IF v_tasks_done_4w >= 3 THEN
    v_d1 := v_d1 + 10;
  END IF;

  -- -----------------------------------------------------------------------
  -- D2 — Financial Data
  -- 3 meses ≈ 90 días rolling, también comparado por año/mes
  -- -----------------------------------------------------------------------
  v_cutoff_3m := (NOW() - INTERVAL '90 days')::DATE;

  SELECT EXISTS (
    SELECT 1 FROM financial_projections
    WHERE  project_id = p_project_id
      AND  MAKE_DATE(year, month, 1) >= v_cutoff_3m
      AND  (COALESCE(cogs, 0)
          + COALESCE(payroll, 0)
          + COALESCE(marketing_spend, 0)
          + COALESCE(infrastructure, 0)
          + COALESCE(other_costs, 0)) > 0
  ) INTO v_has_costs_3m;

  IF v_has_costs_3m THEN
    v_d2 := v_d2 + 15;
  END IF;

  SELECT (
    EXISTS (
      SELECT 1 FROM financial_projections
      WHERE  project_id = p_project_id
        AND  MAKE_DATE(year, month, 1) >= v_cutoff_3m
        AND  COALESCE(revenue, 0) > 0
    )
    OR
    EXISTS (
      SELECT 1 FROM key_metrics
      WHERE  project_id = p_project_id
        AND  date >= v_cutoff_3m
        AND  COALESCE(mrr, 0) > 0
    )
  ) INTO v_has_rev_3m;

  IF v_has_rev_3m THEN
    v_d2 := v_d2 + 10;
  END IF;

  -- -----------------------------------------------------------------------
  -- D3 — Evidence Quality (verification_multiplier inline, no acumulativo)
  -- -----------------------------------------------------------------------
  SELECT MAX(
    CASE tipo::text
      WHEN 'revenue_validation' THEN 1.30
      WHEN 'venta'              THEN 1.30
      WHEN 'product_validation' THEN 1.10
      WHEN 'validacion'         THEN 1.10
      WHEN 'customer_discovery' THEN 1.00
      WHEN 'exploracion'        THEN 1.00
      WHEN 'operational_system' THEN 0.80
      ELSE 1.00
    END
  ) INTO v_best_mult
  FROM   obvs
  WHERE  project_id = p_project_id;

  v_d3 := CASE
    WHEN v_best_mult >= 1.10 THEN 20
    WHEN v_best_mult >= 1.00 THEN 10
    ELSE 0
  END;

  -- -----------------------------------------------------------------------
  -- D4 — Function Structure (project_function_coverage)
  -- -----------------------------------------------------------------------
  SELECT COUNT(*) INTO v_strong_count
  FROM   project_function_coverage
  WHERE  project_id     = p_project_id
    AND  coverage_level = 'strong';

  IF v_strong_count >= 1 THEN
    v_d4 := 20;
  ELSE
    SELECT COUNT(*) INTO v_basic_count
    FROM   project_function_coverage
    WHERE  project_id     = p_project_id
      AND  coverage_level = 'basic';

    v_d4 := CASE
      WHEN v_basic_count >= 2 THEN 15
      WHEN v_basic_count >= 1 THEN 10
      ELSE 0
    END;
  END IF;

  -- -----------------------------------------------------------------------
  -- D5 — Strategic Definition
  -- -----------------------------------------------------------------------
  SELECT
    COALESCE(LENGTH(TRIM(segment_text)),   0),
    COALESCE(LENGTH(TRIM(problem_text)),   0),
    COALESCE(LENGTH(TRIM(value_prop_text)),0)
  INTO v_seg_len, v_prob_len, v_vp_len
  FROM project_strategy_current
  WHERE project_id = p_project_id;

  IF v_seg_len  >= 10 THEN v_d5 := v_d5 + 5; END IF;
  IF v_prob_len >= 10 THEN v_d5 := v_d5 + 5; END IF;
  IF v_vp_len   >= 10 THEN v_d5 := v_d5 + 5; END IF;

  -- -----------------------------------------------------------------------
  -- Total (cap 100)
  -- -----------------------------------------------------------------------
  RETURN LEAST(100, v_d1 + v_d2 + v_d3 + v_d4 + v_d5);
END;
$$;

COMMENT ON FUNCTION compute_data_completeness(UUID) IS
  'F1.13: densidad de datos para determinar confianza del Probability Engine. D1=actividad(20) + D2=financiero(25) + D3=evidencia(20) + D4=cobertura(20) + D5=estrategia(15). Cap 100. <20→inactive, 20-49→low_confidence, ≥50→active.';

-- =============================================================================
-- 3. run_probability_engine(p_project_id, p_trigger_source) → VOID
--
-- PROCESO:
--   1. Resolver versión activa del motor ('probability')
--   2. Leer 5 inputs vía funciones canónicas
--   3. Calcular data_completeness_score (F1.13)
--   4. Determinar probability_status:
--      inactive      → data_completeness_score < 20  (Day-1: sin datos reales)
--      low_confidence→ 20 ≤ data_completeness_score < 50
--      active        → data_completeness_score ≥ 50
--   5. Calcular probability_score (NULL si inactive — constraint de tabla)
--   6. UPSERT idempotente en project_probability
--   7. INSERT en project_probability_history (siempre — weekly backstop + eventos)
--
-- INVARIANTE: probability_score IS NULL iff probability_status = 'inactive'
--   (garantizado por constraint de tabla y por lógica de este motor)
-- =============================================================================

CREATE OR REPLACE FUNCTION run_probability_engine(
  p_project_id     UUID,
  p_trigger_source TEXT DEFAULT 'weekly_job'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver              TEXT;

  -- 5 inputs
  v_fase_score       NUMERIC;
  v_exec_rate        NUMERIC;
  v_val_strength     NUMERIC;
  v_rev_momentum     NUMERIC;
  v_cap_health       NUMERIC;

  -- Completeness + status
  v_completeness     NUMERIC;
  v_status           TEXT;
  v_probability      NUMERIC;  -- NULL si inactive
BEGIN
  -- -----------------------------------------------------------------------
  -- Versión activa del motor
  -- -----------------------------------------------------------------------
  SELECT id INTO v_ver
  FROM   engine_versions
  WHERE  motor     = 'probability'
    AND  is_active = TRUE
  LIMIT  1;

  IF v_ver IS NULL THEN
    v_ver := 'probability_v1.0';  -- fallback defensivo
  END IF;

  -- -----------------------------------------------------------------------
  -- 5 inputs
  -- -----------------------------------------------------------------------

  -- F0.35 — fase_score desde project_phase_state
  SELECT COALESCE(phase_score, 0) INTO v_fase_score
  FROM   project_phase_state
  WHERE  project_id = p_project_id;
  v_fase_score := COALESCE(v_fase_score, 0);

  -- F0.20 — execution_rate (velocidad + tareas + salud de roles, ponderado por fase)
  v_exec_rate    := compute_execution_rate(p_project_id);

  -- F0.15 — validation_strength (top-5 OBVs, base×mult×decay)
  v_val_strength := compute_validation_strength(p_project_id);

  -- F0.15 — revenue_momentum (Phase 1=30 neutral; Phase 2+ = comparativa MRR)
  v_rev_momentum := compute_revenue_momentum(p_project_id);

  -- F0.15 — capacity_health (used_units: OBVs activos + tareas semana)
  v_cap_health   := compute_capacity_health(p_project_id);

  -- -----------------------------------------------------------------------
  -- Data completeness (F1.13)
  -- -----------------------------------------------------------------------
  v_completeness := compute_data_completeness(p_project_id);

  -- -----------------------------------------------------------------------
  -- Probability status
  -- < 20   → inactive      (Day-1, prácticamente sin datos)
  -- 20–49  → low_confidence (datos escasos — score existe con advertencia)
  -- ≥ 50   → active
  -- -----------------------------------------------------------------------
  v_status := CASE
    WHEN v_completeness >= 50 THEN 'active'
    WHEN v_completeness >= 20 THEN 'low_confidence'
    ELSE                           'inactive'
  END;

  -- -----------------------------------------------------------------------
  -- Probability score
  -- NULL si inactive (constraint proyecto_probability lo exige)
  -- Fórmula: weighted sum de 5 inputs normalizados 0–100
  -- Pesos fijos (no varían por fase — a diferencia de execution_rate interno)
  -- -----------------------------------------------------------------------
  IF v_status != 'inactive' THEN
    v_probability := ROUND(
      LEAST(100.0, GREATEST(0.0,
        v_fase_score   * 0.35
      + v_exec_rate    * 0.20
      + v_val_strength * 0.15
      + v_rev_momentum * 0.15
      + v_cap_health   * 0.15
      )),
      2
    );
  ELSE
    v_probability := NULL;
  END IF;

  -- -----------------------------------------------------------------------
  -- UPSERT idempotente en project_probability
  -- -----------------------------------------------------------------------
  INSERT INTO project_probability (
    project_id,
    probability_score,          probability_status,
    phase_score_input,          execution_rate_input,
    validation_strength_input,  revenue_momentum_input,
    capacity_health_input,      data_completeness_score,
    last_calculated_at,         engine_version
  )
  VALUES (
    p_project_id,
    v_probability,              v_status,
    v_fase_score,               v_exec_rate,
    v_val_strength,             v_rev_momentum,
    v_cap_health,               v_completeness,
    NOW(),                      v_ver
  )
  ON CONFLICT (project_id) DO UPDATE SET
    probability_score         = EXCLUDED.probability_score,
    probability_status        = EXCLUDED.probability_status,
    phase_score_input         = EXCLUDED.phase_score_input,
    execution_rate_input      = EXCLUDED.execution_rate_input,
    validation_strength_input = EXCLUDED.validation_strength_input,
    revenue_momentum_input    = EXCLUDED.revenue_momentum_input,
    capacity_health_input     = EXCLUDED.capacity_health_input,
    data_completeness_score   = EXCLUDED.data_completeness_score,
    last_calculated_at        = EXCLUDED.last_calculated_at,
    engine_version            = EXCLUDED.engine_version;

  -- -----------------------------------------------------------------------
  -- INSERT en project_probability_history (siempre)
  -- -----------------------------------------------------------------------
  INSERT INTO project_probability_history (
    project_id,
    probability_score,          probability_status,
    phase_score_input,          execution_rate_input,
    validation_strength_input,  revenue_momentum_input,
    capacity_health_input,      data_completeness_score,
    trigger_source,             calculated_at,
    engine_version
  )
  VALUES (
    p_project_id,
    v_probability,              v_status,
    v_fase_score,               v_exec_rate,
    v_val_strength,             v_rev_momentum,
    v_cap_health,               v_completeness,
    p_trigger_source,           NOW(),
    v_ver
  );
END;
$$;

COMMENT ON FUNCTION run_probability_engine(UUID, TEXT) IS
  'Motor de probabilidad. 5 inputs: fase_score(35%) + execution_rate(20%) + validation_strength(15%) + revenue_momentum(15%) + capacity_health(15%). Status: inactive(<20 completeness), low_confidence(20-49), active(≥50). UPSERT + history siempre.';

-- =============================================================================
-- TRIGGER 1 — project_phase_state
-- La fase es el input de mayor peso (0.35). Cuando el Phase Engine actualiza
-- project_phase_state, el Probability Engine debe recalcular.
-- Cubre la cascada: tasks → coverage → phase_state → probability.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_phase_state_probability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cualquier cambio en phase_state (INSERT o UPDATE) recalcula probabilidad
  PERFORM run_probability_engine(
    COALESCE(NEW.project_id, OLD.project_id),
    'acceleration'
  );
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_phase_state_probability
  AFTER INSERT OR UPDATE OF phase_score, current_phase, phase_status
  ON project_phase_state
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_phase_state_probability();

-- =============================================================================
-- TRIGGER 2 — obvs
-- Cambios en OBVs afectan: validation_strength, iteration_velocity
-- (velocity → execution_rate → probability), data_completeness D1 y D3.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_obvs_probability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_probability_engine(NEW.project_id, 'acceleration');

  ELSIF TG_OP = 'UPDATE' THEN
    -- outcome o tipo afectan validation_strength + data_completeness D3
    IF OLD.obv_outcome IS DISTINCT FROM NEW.obv_outcome
    OR OLD.tipo        IS DISTINCT FROM NEW.tipo
    THEN
      PERFORM run_probability_engine(NEW.project_id, 'acceleration');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_obvs_probability
  AFTER INSERT OR UPDATE OF obv_outcome, tipo
  ON obvs
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_obvs_probability();

-- =============================================================================
-- TRIGGER 3 — key_metrics
-- Cambios en MRR afectan revenue_momentum (Phase 2+ directamente).
-- En Phase 1 el trigger dispara pero compute_revenue_momentum devuelve 30 (neutro).
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_key_metrics_probability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_probability_engine(NEW.project_id, 'acceleration');

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.mrr IS DISTINCT FROM NEW.mrr THEN
      PERFORM run_probability_engine(NEW.project_id, 'acceleration');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_key_metrics_probability
  AFTER INSERT OR UPDATE OF mrr
  ON key_metrics
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_key_metrics_probability();

-- =============================================================================
-- TRIGGER 4 — project_strategy_current
-- Cambios en segment/problem/value_prop afectan data_completeness D5.
-- No afectan el probability_score directamente, pero sí el status (inactive→active).
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_strategy_probability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_probability_engine(NEW.project_id, 'acceleration');

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.segment_text    IS DISTINCT FROM NEW.segment_text
    OR OLD.problem_text    IS DISTINCT FROM NEW.problem_text
    OR OLD.value_prop_text IS DISTINCT FROM NEW.value_prop_text
    THEN
      PERFORM run_probability_engine(NEW.project_id, 'acceleration');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_strategy_probability
  AFTER INSERT OR UPDATE OF segment_text, problem_text, value_prop_text
  ON project_strategy_current
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_strategy_probability();

-- =============================================================================
-- TRIGGER 5 — financial_projections
-- Cambios en datos financieros afectan data_completeness D2.
-- Puede mover un proyecto de inactive a low_confidence al registrar costes.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_financial_probability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_probability_engine(NEW.project_id, 'acceleration');

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.revenue     IS DISTINCT FROM NEW.revenue
    OR OLD.cogs        IS DISTINCT FROM NEW.cogs
    OR OLD.payroll     IS DISTINCT FROM NEW.payroll
    OR OLD.marketing_spend IS DISTINCT FROM NEW.marketing_spend
    THEN
      PERFORM run_probability_engine(NEW.project_id, 'acceleration');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_financial_probability
  AFTER INSERT OR UPDATE OF revenue, cogs, payroll, marketing_spend
  ON financial_projections
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_financial_probability();

-- =============================================================================
-- pg_cron: backstop semanal
-- Domingo 00:30 UTC — después del phase backstop (00:00) y coverage (00:00).
-- El offset de 30 minutos garantiza que phase_state esté actualizado antes
-- de que probability lea phase_score.
-- =============================================================================

SELECT cron.schedule(
  'weekly-probability-engine',
  '30 0 * * 0',
  $$
    SELECT run_probability_engine(id, 'weekly_job')
    FROM   projects
    WHERE  deleted_at IS NULL
  $$
);
