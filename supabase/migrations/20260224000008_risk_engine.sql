-- =============================================================================
-- MIGRACIÓN 00008 — RISK ENGINE
--
-- 5 inputs canónicos (R1.1–R1.5):
--   compute_runway_factor(project_id)           → NUMERIC | NULL
--   compute_revenue_concentration(project_id)   → NUMERIC | NULL
--   compute_execution_drop(project_id)          → NUMERIC | NULL
--   compute_validation_weakness(project_id)     → NUMERIC | NULL
--   compute_bottleneck_severity(project_id)     → NUMERIC (nunca NULL)
--
-- Fórmula:
--   risk_score = RunwayFactor×0.25 + RevenueConcentration×0.20
--              + ExecutionDrop×0.20 + ValidationWeakness×0.20
--              + BottleneckSeverity×0.15
--   Con redistribución proporcional de pesos cuando algún input es NULL.
--   Requiere ≥3 inputs con valor; si <3 → insufficient_data, score = NULL.
--
-- SCHEMA CONFIRMADO:
--   project_risk_score          : UPSERT idempotente
--   project_risk_score_history  : append-only; trigger_source CHECK ('weekly_job','block_event')
--   project_economic_profile    : cash_on_hand, top_client_revenue_percent
--   financial_projections       : revenue, cogs+payroll+marketing_spend+infrastructure+other_costs
--   project_probability_history : execution_rate_input, validation_strength_input, calculated_at
--   strategic_blocks            : resolved_at, status, impact_weight
-- =============================================================================

-- =============================================================================
-- 1. compute_runway_factor(p_project_id) → NUMERIC | NULL
--
-- DEFINICIÓN (R1.1 — escala 0=sin riesgo, 100=máximo riesgo):
--   Requiere:
--     a) cash_on_hand IS NOT NULL (project_economic_profile)
--     b) ≥2 meses con costes reales en últimos 3 meses (financial_projections)
--   net_burn_month = MAX(0, AVG(costes_mes - ingresos_mes) sobre esos n meses)
--   runway_months = cash_on_hand / net_burn_month
--   Mapping: ≥12m→0 | 9-12→20 | 6-9→40 | 3-6→70 | 1-3→90 | <1→100
--   NULL si alguna condición falla.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_runway_factor(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cash_on_hand    NUMERIC;
  v_n_cost_months   BIGINT;
  v_net_burn_month  NUMERIC;
  v_runway_months   NUMERIC;
  v_cutoff_3m       DATE;
BEGIN
  v_cutoff_3m := (NOW() - INTERVAL '90 days')::DATE;

  -- Condición a: cash_on_hand declarado
  SELECT cash_on_hand INTO v_cash_on_hand
  FROM   project_economic_profile
  WHERE  project_id = p_project_id;

  IF v_cash_on_hand IS NULL THEN
    RETURN NULL;
  END IF;

  -- Condición b: ≥2 meses con costes reales en últimos 3 meses
  SELECT COUNT(*) INTO v_n_cost_months
  FROM   financial_projections
  WHERE  project_id = p_project_id
    AND  MAKE_DATE(year, month, 1) >= v_cutoff_3m
    AND  (COALESCE(cogs, 0)
        + COALESCE(payroll, 0)
        + COALESCE(marketing_spend, 0)
        + COALESCE(infrastructure, 0)
        + COALESCE(other_costs, 0)) > 0;

  IF v_n_cost_months < 2 THEN
    RETURN NULL;
  END IF;

  -- net_burn_month = MAX(0, AVG(costes - ingresos))
  SELECT MAX(0, AVG(
    (COALESCE(cogs, 0) + COALESCE(payroll, 0)
     + COALESCE(marketing_spend, 0) + COALESCE(infrastructure, 0)
     + COALESCE(other_costs, 0))
    - COALESCE(revenue, 0)
  )) INTO v_net_burn_month
  FROM   financial_projections
  WHERE  project_id = p_project_id
    AND  MAKE_DATE(year, month, 1) >= v_cutoff_3m
    AND  (COALESCE(cogs, 0) + COALESCE(payroll, 0)
        + COALESCE(marketing_spend, 0) + COALESCE(infrastructure, 0)
        + COALESCE(other_costs, 0)) > 0;

  -- Sin burn → runway = ∞ → sin riesgo
  IF COALESCE(v_net_burn_month, 0) = 0 THEN
    RETURN 0;
  END IF;

  v_runway_months := v_cash_on_hand / v_net_burn_month;

  RETURN CASE
    WHEN v_runway_months >= 12 THEN  0
    WHEN v_runway_months >=  9 THEN 20
    WHEN v_runway_months >=  6 THEN 40
    WHEN v_runway_months >=  3 THEN 70
    WHEN v_runway_months >=  1 THEN 90
    ELSE                            100
  END;
END;
$$;

COMMENT ON FUNCTION compute_runway_factor(UUID) IS
  'R1.1: riesgo de runway (0=sin riesgo, 100=máximo). Requiere cash_on_hand declarado + ≥2 meses costes últimos 3m. net_burn=MAX(0,AVG(costes-ingresos)). Mapping: ≥12m→0, 9-12→20, 6-9→40, 3-6→70, 1-3→90, <1→100. NULL si no hay datos.';

-- =============================================================================
-- 2. compute_revenue_concentration(p_project_id) → NUMERIC | NULL
--
-- DEFINICIÓN (R1.4 — fuente: project_economic_profile.top_client_revenue_percent):
--   ≤20%         → 0
--   >20%–≤40%   → 25
--   >40%–≤60%   → 50
--   >60%–≤80%   → 75
--   >80%         → 95
--   NULL si top_client_revenue_percent IS NULL
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_revenue_concentration(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_top_pct NUMERIC;
BEGIN
  SELECT top_client_revenue_percent INTO v_top_pct
  FROM   project_economic_profile
  WHERE  project_id = p_project_id;

  IF v_top_pct IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN CASE
    WHEN v_top_pct <= 20 THEN  0
    WHEN v_top_pct <= 40 THEN 25
    WHEN v_top_pct <= 60 THEN 50
    WHEN v_top_pct <= 80 THEN 75
    ELSE                       95
  END;
END;
$$;

COMMENT ON FUNCTION compute_revenue_concentration(UUID) IS
  'R1.4: riesgo de concentración en un cliente (0=diversificado, 95=concentrado). Fuente: top_client_revenue_percent. ≤20%→0, 20-40%→25, 40-60%→50, 60-80%→75, >80%→95. NULL si no declarado.';

-- =============================================================================
-- 3. compute_execution_drop(p_project_id) → NUMERIC | NULL
--
-- DEFINICIÓN (R1.2):
--   Ventanas temporales (sin solapamiento):
--     Current  = AVG(execution_rate_input) de registros en últimos 14 días
--     Baseline = AVG(execution_rate_input) de registros entre 14 y 56 días atrás
--
--   Requiere ≥1 registro en baseline (aprox. 6 semanas de histórico).
--   Si no hay baseline → NULL.
--   Si baseline = 0 → 100.
--   Si baseline < 40 → solo riesgo_absoluto (no relativo).
--
--   A) Riesgo relativo (si baseline ≥ 40):
--     drop_ratio = (baseline - current) / baseline
--     ≤10%→10 | 10-20%→30 | 20-35%→60 | >35%→85 | ≤0→0
--
--   B) Riesgo absoluto (floor):
--     current ≥ 60 → 0 | 50-60 → 20 | 40-50 → 40 | <40 → 70
--
--   ExecutionDrop = MAX(riesgo_relativo, riesgo_absoluto)
--
--   FUENTE: project_probability_history.execution_rate_input
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_execution_drop(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current       NUMERIC;
  v_baseline      NUMERIC;
  v_drop_ratio    NUMERIC;
  v_risk_rel      NUMERIC := 0;
  v_risk_abs      NUMERIC := 0;
  v_has_baseline  BOOLEAN;
BEGIN
  -- Verificar que existe histórico baseline (14-56 días atrás)
  SELECT EXISTS (
    SELECT 1 FROM project_probability_history
    WHERE  project_id         = p_project_id
      AND  calculated_at     >= NOW() - INTERVAL '56 days'
      AND  calculated_at     <  NOW() - INTERVAL '14 days'
      AND  execution_rate_input IS NOT NULL
  ) INTO v_has_baseline;

  IF NOT v_has_baseline THEN
    RETURN NULL;  -- Sin historial suficiente (< 6 semanas aprox.)
  END IF;

  -- Current: AVG de últimas 2 semanas (registros en -14 días)
  SELECT AVG(execution_rate_input) INTO v_current
  FROM   project_probability_history
  WHERE  project_id             = p_project_id
    AND  calculated_at         >= NOW() - INTERVAL '14 days'
    AND  execution_rate_input   IS NOT NULL;

  -- Si no hay registros recientes, usar el más reciente disponible
  IF v_current IS NULL THEN
    SELECT execution_rate_input INTO v_current
    FROM   project_probability_history
    WHERE  project_id             = p_project_id
      AND  execution_rate_input   IS NOT NULL
    ORDER  BY calculated_at DESC
    LIMIT  1;
  END IF;

  -- Baseline: AVG de semanas 3–8 (registros entre -56 y -14 días)
  SELECT AVG(execution_rate_input) INTO v_baseline
  FROM   project_probability_history
  WHERE  project_id             = p_project_id
    AND  calculated_at         >= NOW() - INTERVAL '56 days'
    AND  calculated_at         <  NOW() - INTERVAL '14 days'
    AND  execution_rate_input   IS NOT NULL;

  -- Sin datos en ninguna de las ventanas → NULL
  IF v_current IS NULL OR v_baseline IS NULL THEN
    RETURN NULL;
  END IF;

  -- baseline = 0 → riesgo máximo
  IF v_baseline = 0 THEN
    RETURN 100;
  END IF;

  -- B) Riesgo absoluto (siempre aplica)
  v_risk_abs := CASE
    WHEN v_current >= 60 THEN  0
    WHEN v_current >= 50 THEN 20
    WHEN v_current >= 40 THEN 40
    ELSE                       70
  END;

  -- A) Riesgo relativo (solo si baseline ≥ 40)
  IF v_baseline >= 40 THEN
    v_drop_ratio := (v_baseline - v_current) / v_baseline * 100.0;

    v_risk_rel := CASE
      WHEN v_drop_ratio <= 0   THEN  0   -- current ≥ baseline → sin caída
      WHEN v_drop_ratio <= 10  THEN 10
      WHEN v_drop_ratio <= 20  THEN 30
      WHEN v_drop_ratio <= 35  THEN 60
      ELSE                          85
    END;
  END IF;

  RETURN GREATEST(v_risk_rel, v_risk_abs);
END;
$$;

COMMENT ON FUNCTION compute_execution_drop(UUID) IS
  'R1.2: riesgo de caída de ejecución respecto al baseline propio. Current=AVG últimas 2 semanas. Baseline=AVG semanas 3-8. MAX(riesgo_relativo, riesgo_absoluto). NULL si <6 semanas de histórico. Fuente: project_probability_history.execution_rate_input.';

-- =============================================================================
-- 4. compute_validation_weakness(p_project_id) → NUMERIC | NULL
--
-- DEFINICIÓN (R1.3):
--   base_risk = 100 - validation_strength_actual
--   stagnation_penalty = 15 si NO mejoró ≥5pts en últimas 4 semanas; else 0
--   ValidationWeakness = MIN(100, base_risk + stagnation_penalty)
--
--   "Mejora": validation_strength_input actual vs hace ≥28 días
--   Si <4 semanas de histórico → stagnation_penalty = 0
--   Si sin validation_strength → NULL
--
--   FUENTE: project_probability_history.validation_strength_input (más reciente)
--           + el registro de ~4 semanas atrás para comparación
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_validation_weakness(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_val_current     NUMERIC;
  v_val_4w_ago      NUMERIC;
  v_base_risk       NUMERIC;
  v_stag_penalty    NUMERIC := 0;
BEGIN
  -- Validation strength actual (más reciente)
  SELECT validation_strength_input INTO v_val_current
  FROM   project_probability_history
  WHERE  project_id                 = p_project_id
    AND  validation_strength_input  IS NOT NULL
  ORDER  BY calculated_at DESC
  LIMIT  1;

  IF v_val_current IS NULL THEN
    RETURN NULL;  -- Sin datos de validation_strength
  END IF;

  -- base_risk: 100 - validation_strength_actual
  v_base_risk := 100.0 - v_val_current;

  -- Registro de ~4 semanas atrás para comparar tendencia
  SELECT validation_strength_input INTO v_val_4w_ago
  FROM   project_probability_history
  WHERE  project_id                 = p_project_id
    AND  calculated_at             <= NOW() - INTERVAL '28 days'
    AND  validation_strength_input  IS NOT NULL
  ORDER  BY calculated_at DESC
  LIMIT  1;

  IF v_val_4w_ago IS NOT NULL THEN
    -- Hubo datos hace 4 semanas → evaluar mejora
    IF (v_val_current - v_val_4w_ago) < 5.0 THEN
      v_stag_penalty := 15;  -- No mejoró ≥5 puntos → penalización
    END IF;
    -- Si mejoró ≥5 pts → stag_penalty = 0 (ya está en 0)
  END IF;
  -- Si v_val_4w_ago IS NULL → sin histórico suficiente → stag_penalty = 0

  RETURN LEAST(100.0, v_base_risk + v_stag_penalty);
END;
$$;

COMMENT ON FUNCTION compute_validation_weakness(UUID) IS
  'R1.3: riesgo de validación débil. base_risk=100-val_strength. stagnation_penalty=15 si no mejoró ≥5pts en 4 semanas. MIN(100, base+penalty). NULL si sin datos. Fuente: project_probability_history.validation_strength_input.';

-- =============================================================================
-- 5. compute_bottleneck_severity(p_project_id) → NUMERIC (nunca NULL en v1)
--
-- DEFINICIÓN (R1.5):
--   B = bloques activos (resolved_at IS NULL AND status IN ('active','monitoring'))
--   |B| = 0 → 0
--   |B| ≥ 1 → MIN(100, MAX(impact_weight)×0.70 + AVG(top3.impact_weight)×0.30)
--
--   Lógica: el bloqueo más severo domina (×0.70); la acumulación penaliza (+top3 ×0.30).
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_bottleneck_severity(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_weight  NUMERIC;
  v_avg_top3    NUMERIC;
BEGIN
  -- bloques activos: MAX y AVG top-3 por impact_weight
  SELECT
    MAX(impact_weight),
    AVG(impact_weight) FILTER (WHERE rn <= 3)
  INTO
    v_max_weight,
    v_avg_top3
  FROM (
    SELECT
      impact_weight,
      ROW_NUMBER() OVER (ORDER BY impact_weight DESC) AS rn
    FROM   strategic_blocks
    WHERE  project_id  = p_project_id
      AND  resolved_at IS NULL
      AND  status      IN ('active', 'monitoring')
  ) ranked;

  -- Sin bloques → 0 (contribuye al RiskScore sin penalizar)
  IF v_max_weight IS NULL THEN
    RETURN 0;
  END IF;

  RETURN ROUND(
    LEAST(100.0,
      v_max_weight * 0.70 + COALESCE(v_avg_top3, v_max_weight) * 0.30
    ),
    2
  );
END;
$$;

COMMENT ON FUNCTION compute_bottleneck_severity(UUID) IS
  'R1.5: severidad de bloqueos activos. |B|=0→0. |B|≥1: MIN(100, MAX×0.70 + AVG(top3)×0.30). Nunca NULL en v1 (0 si sin bloques). Fuente: strategic_blocks activos (resolved_at IS NULL AND status IN active,monitoring).';

-- =============================================================================
-- 6. run_risk_engine(p_project_id, p_trigger_source) → VOID
--
-- PROCESO:
--   1. Resolver versión activa del motor ('risk')
--   2. Calcular los 5 inputs (cada uno puede ser NULL excepto bottleneck_severity)
--   3. Contar inputs disponibles (no NULL)
--   4. Si inputs_available < 3 → insufficient_data, score = NULL
--   5. Si ≥3 inputs: redistribuir pesos pro-rata sobre los inputs disponibles
--   6. Determinar risk_status:
--      insufficient_data → inputs_available < 3
--      low_confidence    → inputs_available ≥ 3 AND data_completeness_score < 50
--      active            → inputs_available ≥ 3 AND data_completeness_score ≥ 50
--   7. Calcular risk_level: <30→low | 30-54.99→medium | 55-79.99→high | ≥80→critical
--   8. UPSERT idempotente en project_risk_score
--   9. INSERT en project_risk_score_history
--
-- INVARIANTE: risk_score IS NULL iff risk_status = 'insufficient_data'
-- =============================================================================

CREATE OR REPLACE FUNCTION run_risk_engine(
  p_project_id     UUID,
  p_trigger_source TEXT DEFAULT 'weekly_job'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver                TEXT;

  -- 5 inputs (algunos pueden ser NULL)
  v_runway             NUMERIC;
  v_rev_conc           NUMERIC;
  v_exec_drop          NUMERIC;
  v_val_weak           NUMERIC;
  v_bottleneck         NUMERIC;

  -- Pesos originales
  v_w_runway           NUMERIC := 0.25;
  v_w_rev_conc         NUMERIC := 0.20;
  v_w_exec_drop        NUMERIC := 0.20;
  v_w_val_weak         NUMERIC := 0.20;
  v_w_bottleneck       NUMERIC := 0.15;

  v_total_weight       NUMERIC;
  v_inputs_available   SMALLINT := 0;

  -- Completeness (reutiliza compute_data_completeness del motor de probabilidad)
  v_completeness       NUMERIC;

  -- Resultados
  v_risk_score         NUMERIC;
  v_risk_status        TEXT;
  v_risk_level         TEXT;
BEGIN
  -- -----------------------------------------------------------------------
  -- Versión activa del motor
  -- -----------------------------------------------------------------------
  SELECT id INTO v_ver
  FROM   engine_versions
  WHERE  motor     = 'risk'
    AND  is_active = TRUE
  LIMIT  1;

  IF v_ver IS NULL THEN
    v_ver := 'risk_v1.0';
  END IF;

  -- -----------------------------------------------------------------------
  -- Calcular 5 inputs
  -- -----------------------------------------------------------------------
  v_runway     := compute_runway_factor(p_project_id);
  v_rev_conc   := compute_revenue_concentration(p_project_id);
  v_exec_drop  := compute_execution_drop(p_project_id);
  v_val_weak   := compute_validation_weakness(p_project_id);
  v_bottleneck := compute_bottleneck_severity(p_project_id);  -- nunca NULL

  -- -----------------------------------------------------------------------
  -- Nullear pesos de inputs faltantes + contar disponibles
  -- bottleneck_severity siempre contribuye (retorna 0 si sin bloques)
  -- -----------------------------------------------------------------------
  IF v_runway    IS NULL THEN v_w_runway    := 0; ELSE v_inputs_available := v_inputs_available + 1; END IF;
  IF v_rev_conc  IS NULL THEN v_w_rev_conc  := 0; ELSE v_inputs_available := v_inputs_available + 1; END IF;
  IF v_exec_drop IS NULL THEN v_w_exec_drop := 0; ELSE v_inputs_available := v_inputs_available + 1; END IF;
  IF v_val_weak  IS NULL THEN v_w_val_weak  := 0; ELSE v_inputs_available := v_inputs_available + 1; END IF;
  -- bottleneck siempre disponible
  v_inputs_available := v_inputs_available + 1;

  -- -----------------------------------------------------------------------
  -- Data completeness (F1.13 — reutiliza función del motor de probabilidad)
  -- -----------------------------------------------------------------------
  v_completeness := compute_data_completeness(p_project_id);

  -- -----------------------------------------------------------------------
  -- Risk status
  -- -----------------------------------------------------------------------
  IF v_inputs_available < 3 THEN
    v_risk_status := 'insufficient_data';
    v_risk_score  := NULL;
    v_risk_level  := 'low';  -- default para constraint (score NULL)

    -- UPSERT con score NULL
    INSERT INTO project_risk_score (
      project_id,
      risk_score,                 risk_level,
      risk_status,
      runway_factor_input,        revenue_concentration_input,
      execution_drop_input,       validation_weakness_input,
      bottleneck_severity_input,  inputs_available,
      data_completeness_score,    last_calculated_at,
      engine_version
    )
    VALUES (
      p_project_id,
      NULL,                       v_risk_level,
      v_risk_status,
      v_runway,                   v_rev_conc,
      v_exec_drop,                v_val_weak,
      v_bottleneck,               v_inputs_available,
      v_completeness,             NOW(),
      v_ver
    )
    ON CONFLICT (project_id) DO UPDATE SET
      risk_score                  = EXCLUDED.risk_score,
      risk_level                  = EXCLUDED.risk_level,
      risk_status                 = EXCLUDED.risk_status,
      runway_factor_input         = EXCLUDED.runway_factor_input,
      revenue_concentration_input = EXCLUDED.revenue_concentration_input,
      execution_drop_input        = EXCLUDED.execution_drop_input,
      validation_weakness_input   = EXCLUDED.validation_weakness_input,
      bottleneck_severity_input   = EXCLUDED.bottleneck_severity_input,
      inputs_available            = EXCLUDED.inputs_available,
      data_completeness_score     = EXCLUDED.data_completeness_score,
      last_calculated_at          = EXCLUDED.last_calculated_at,
      engine_version              = EXCLUDED.engine_version;

    INSERT INTO project_risk_score_history (
      project_id,
      risk_score,                 risk_level,               risk_status,
      runway_factor_input,        revenue_concentration_input,
      execution_drop_input,       validation_weakness_input,
      bottleneck_severity_input,  inputs_available,
      data_completeness_score,    trigger_source,
      calculated_at,              engine_version
    )
    VALUES (
      p_project_id,
      NULL,                       v_risk_level,             v_risk_status,
      v_runway,                   v_rev_conc,
      v_exec_drop,                v_val_weak,
      v_bottleneck,               v_inputs_available,
      v_completeness,             p_trigger_source,
      NOW(),                      v_ver
    );

    RETURN;
  END IF;

  -- -----------------------------------------------------------------------
  -- ≥3 inputs: redistribuir pesos proporcionales sobre los no-NULL
  -- -----------------------------------------------------------------------
  v_total_weight := v_w_runway + v_w_rev_conc + v_w_exec_drop
                  + v_w_val_weak + v_w_bottleneck;

  v_risk_score := ROUND(
    LEAST(100.0, GREATEST(0.0,
      COALESCE(v_runway,    0) * (v_w_runway    / v_total_weight)
    + COALESCE(v_rev_conc,  0) * (v_w_rev_conc  / v_total_weight)
    + COALESCE(v_exec_drop, 0) * (v_w_exec_drop / v_total_weight)
    + COALESCE(v_val_weak,  0) * (v_w_val_weak  / v_total_weight)
    + v_bottleneck             * (v_w_bottleneck / v_total_weight)
    )),
    2
  );

  -- Risk status: low_confidence si completeness < 50
  v_risk_status := CASE
    WHEN v_completeness >= 50 THEN 'active'
    ELSE                           'low_confidence'
  END;

  -- Risk level: <30→low | 30–54.99→medium | 55–79.99→high | ≥80→critical
  v_risk_level := CASE
    WHEN v_risk_score >= 80 THEN 'critical'
    WHEN v_risk_score >= 55 THEN 'high'
    WHEN v_risk_score >= 30 THEN 'medium'
    ELSE                         'low'
  END;

  -- -----------------------------------------------------------------------
  -- UPSERT idempotente en project_risk_score
  -- -----------------------------------------------------------------------
  INSERT INTO project_risk_score (
    project_id,
    risk_score,                 risk_level,
    risk_status,
    runway_factor_input,        revenue_concentration_input,
    execution_drop_input,       validation_weakness_input,
    bottleneck_severity_input,  inputs_available,
    data_completeness_score,    last_calculated_at,
    engine_version
  )
  VALUES (
    p_project_id,
    v_risk_score,               v_risk_level,
    v_risk_status,
    v_runway,                   v_rev_conc,
    v_exec_drop,                v_val_weak,
    v_bottleneck,               v_inputs_available,
    v_completeness,             NOW(),
    v_ver
  )
  ON CONFLICT (project_id) DO UPDATE SET
    risk_score                  = EXCLUDED.risk_score,
    risk_level                  = EXCLUDED.risk_level,
    risk_status                 = EXCLUDED.risk_status,
    runway_factor_input         = EXCLUDED.runway_factor_input,
    revenue_concentration_input = EXCLUDED.revenue_concentration_input,
    execution_drop_input        = EXCLUDED.execution_drop_input,
    validation_weakness_input   = EXCLUDED.validation_weakness_input,
    bottleneck_severity_input   = EXCLUDED.bottleneck_severity_input,
    inputs_available            = EXCLUDED.inputs_available,
    data_completeness_score     = EXCLUDED.data_completeness_score,
    last_calculated_at          = EXCLUDED.last_calculated_at,
    engine_version              = EXCLUDED.engine_version;

  -- -----------------------------------------------------------------------
  -- INSERT en project_risk_score_history (siempre)
  -- -----------------------------------------------------------------------
  INSERT INTO project_risk_score_history (
    project_id,
    risk_score,                 risk_level,               risk_status,
    runway_factor_input,        revenue_concentration_input,
    execution_drop_input,       validation_weakness_input,
    bottleneck_severity_input,  inputs_available,
    data_completeness_score,    trigger_source,
    calculated_at,              engine_version
  )
  VALUES (
    p_project_id,
    v_risk_score,               v_risk_level,             v_risk_status,
    v_runway,                   v_rev_conc,
    v_exec_drop,                v_val_weak,
    v_bottleneck,               v_inputs_available,
    v_completeness,             p_trigger_source,
    NOW(),                      v_ver
  );
END;
$$;

COMMENT ON FUNCTION run_risk_engine(UUID, TEXT) IS
  'Motor de riesgo. 5 inputs: runway(25%) + rev_concentration(20%) + exec_drop(20%) + val_weakness(20%) + bottleneck(15%). Redistribución pro-rata si NULL. Requiere ≥3 inputs; si <3→insufficient_data. UPSERT + history.';

-- =============================================================================
-- TRIGGER 1 — strategic_blocks
-- Cambios en bloques afectan BottleneckSeverity (R1.5) directamente.
-- También informa a la Coverage Engine (ya cubierto por trg_blocks_coverage).
-- trigger_source = 'block_event'
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_blocks_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_risk_engine(NEW.project_id, 'block_event');

  ELSIF TG_OP = 'UPDATE' THEN
    -- Cambio de estado, resolución o impacto → afecta BottleneckSeverity
    IF OLD.resolved_at   IS DISTINCT FROM NEW.resolved_at
    OR OLD.status        IS DISTINCT FROM NEW.status
    OR OLD.impact_weight IS DISTINCT FROM NEW.impact_weight
    THEN
      PERFORM run_risk_engine(NEW.project_id, 'block_event');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_blocks_risk
  AFTER INSERT OR UPDATE OF resolved_at, status, impact_weight
  ON strategic_blocks
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_blocks_risk();

-- =============================================================================
-- TRIGGER 2 — project_economic_profile
-- Cambios en cash_on_hand (R1.1) o top_client_revenue_percent (R1.4).
-- trigger_source = 'block_event' (evento significativo, único trigger_source no-cron)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_economic_profile_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_risk_engine(NEW.project_id, 'block_event');

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.cash_on_hand               IS DISTINCT FROM NEW.cash_on_hand
    OR OLD.top_client_revenue_percent IS DISTINCT FROM NEW.top_client_revenue_percent
    THEN
      PERFORM run_risk_engine(NEW.project_id, 'block_event');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_economic_profile_risk
  AFTER INSERT OR UPDATE OF cash_on_hand, top_client_revenue_percent
  ON project_economic_profile
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_economic_profile_risk();

-- =============================================================================
-- TRIGGER 3 — project_probability (tabla de estado actual)
-- Cuando execution_rate_input o validation_strength_input cambian,
-- ExecutionDrop (R1.2) y ValidationWeakness (R1.3) se actualizan en el histórico.
-- NOTA: R1.2 y R1.3 leen de project_probability_history, no de project_probability.
--       Este trigger dispara run_risk_engine DESPUÉS de que la probabilidad se actualiza,
--       asegurando que el historial más reciente ya esté insertado.
-- trigger_source = 'block_event' (único valor no-cron disponible)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_probability_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo dispara si hubo cambios relevantes para riesgo
  IF TG_OP = 'INSERT' THEN
    PERFORM run_risk_engine(NEW.project_id, 'block_event');

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.execution_rate_input      IS DISTINCT FROM NEW.execution_rate_input
    OR OLD.validation_strength_input IS DISTINCT FROM NEW.validation_strength_input
    THEN
      PERFORM run_risk_engine(NEW.project_id, 'block_event');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_probability_risk
  AFTER INSERT OR UPDATE OF execution_rate_input, validation_strength_input
  ON project_probability
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_probability_risk();

-- =============================================================================
-- pg_cron: backstop semanal
-- Domingo 01:00 UTC — después de probability (00:30) y phase (00:00).
-- El offset garantiza que project_probability_history esté actualizado
-- antes de que run_risk_engine lea execution_rate y validation_strength.
-- =============================================================================

SELECT cron.schedule(
  'weekly-risk-engine',
  '0 1 * * 0',
  $$
    SELECT run_risk_engine(id, 'weekly_job')
    FROM   projects
    WHERE  deleted_at IS NULL
  $$
);
