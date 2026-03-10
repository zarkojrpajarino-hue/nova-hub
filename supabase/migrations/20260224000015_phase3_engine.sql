-- =============================================================================
-- MIGRACIÓN 00015 — PHASE ENGINE: Phase 3 (E4.4)
--
-- Implementa las subfunciones de Fase 3 y reemplaza el placeholder Phase > 2
-- en run_phase_engine con lógica real.
-- Phase 4 permanece como placeholder hasta E4.5.
--
-- Fórmula canónica (FASE_1 F1.6):
--   phase3_score = O3.1×0.40 + O3.2×0.35 + O3.3×0.25
--
-- SCHEMA CONFIRMADO:
--   key_metrics: project_id, date (DATE), mrr (DECIMAL)     [migration 00001]
--   financial_projections: project_id, year, month,
--     cogs, payroll, marketing_spend, infrastructure,
--     other_costs, revenue                                   [migration 00001]
--   project_risk_score: project_id, risk_level (TEXT)       [migration 00002]
--   strategic_cycles: project_id, cycle_index, start_date,
--     end_date, closed_at                                    [migration 00002]
--   tasks.completed_at, status, function_type               [migrations 00001/00002]
--
-- DECISIONES DE IMPLEMENTACIÓN v1 (explícitas):
--
--   O3.1 — "mes estable" simplificado:
--     FASE_1 F1.6 exige mrr[M3+] ≥ 0.75×AVG AND cash_flow_mensual ≥ 0.
--     En v1 solo se chequea mrr ≥ 0.75×prev (sin cash_flow por mes).
--     Las condiciones adicionales de FASE_1 (no-2-negativos-consecutivos,
--     ningún mes < -20% promedio anterior) NO se implementan en v1.
--     Fuente: key_metrics.mrr. Si no hay datos → O3.1 = 0.
--
--   O3.2 — bloqueo_penalty:
--     FASE_1 F1.6 define bloqueo_penalty via friction_count y critical_count.
--     Esos contadores NO existen en schema v1 (Risk Engine no implementado).
--     Proxy: project_risk_score.risk_level:
--       'low'→100 | 'medium'→70 | 'high'→40 | 'critical'→10 | NULL→80 (neutral)
--
--   O3.3 — independencia del founder:
--     v1 usa time-window proxy (acordado C4.4 decisión):
--     "tarea del ciclo" = tarea done con completed_at >= current_cycle.start_date.
--     No existe tasks.strategic_cycle_id FK (pendiente v2).
--     Max O3.3 = 60 ("procesos documentados") — no puede llegar a 100 en v1
--     sin datos de "función operada por otra persona".
--
--   Hard signal Phase 3→4 (FASE_1 F1.6 3 condiciones):
--     1. stable_months >= 3 en ventana de 4 meses
--     2. cost_data_months >= 2 de últimos 3 meses (cash flow confidence HIGH)
--     3. tasks_in_cycle >= 1 (proxy de "función crítica no exclusiva del founder")
--
-- DEUDA v2:
--   tasks.strategic_cycle_id FK → explicit task-cycle relationship
--   Risk Engine dedicated (friction_count / critical_count)
--   O3.1 cash_flow mensual check
--   O3.3 score 100 ("función operada por otra persona" con datos reales)
-- =============================================================================


-- =============================================================================
-- HELPER — count_stable_revenue_months(p_project_id) → INTEGER
--
-- Retorna cuántos de los últimos 4 meses con datos de MRR son "estables".
-- Compartido entre compute_phase3_o31 (score) y hard signal (Phase 3→4).
--
-- Definición de mes estable (FASE_1 F1.6, versión v1 simplificada):
--   M1 (oldest in window): siempre PASS
--   M2: mrr[2] >= 0.75 × mrr[1]
--   M3+: mrr[i] >= 0.75 × AVG(mrr[i-2], mrr[i-1])
--
-- Fuente: key_metrics.mrr. Un mes = la entrada más reciente de ese mes
-- con mrr > 0. Meses sin datos (mrr IS NULL o mrr = 0) no se incluyen.
-- =============================================================================

CREATE OR REPLACE FUNCTION count_stable_revenue_months(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr_arr  NUMERIC[];
  v_n        INTEGER;
  v_stable   INTEGER := 0;
  i          INTEGER;
  v_threshold NUMERIC;
BEGIN
  -- Última entrada de MRR (mrr > 0) por mes calendario, últimos 4 meses, oldest first
  SELECT ARRAY_AGG(monthly_mrr ORDER BY month_dt ASC)
  INTO   v_mrr_arr
  FROM (
    SELECT
      date_trunc('month', date)::date                   AS month_dt,
      (ARRAY_AGG(mrr ORDER BY date DESC NULLS LAST))[1] AS monthly_mrr
    FROM   key_metrics
    WHERE  project_id = p_project_id
      AND  date      >= (CURRENT_DATE - INTERVAL '4 months')::date
      AND  mrr        > 0
    GROUP  BY date_trunc('month', date)::date
    LIMIT  4
  ) sub;

  v_n := COALESCE(array_length(v_mrr_arr, 1), 0);

  IF v_n = 0 THEN
    RETURN 0;
  END IF;

  FOR i IN 1..v_n LOOP
    IF i = 1 THEN
      v_stable := v_stable + 1;                           -- M1: siempre PASS

    ELSIF i = 2 THEN
      IF v_mrr_arr[2] >= 0.75 * v_mrr_arr[1] THEN
        v_stable := v_stable + 1;
      END IF;

    ELSE
      -- M3+: >= 0.75 × AVG(mrr[i-2], mrr[i-1])
      v_threshold := 0.75 * ((v_mrr_arr[i-2] + v_mrr_arr[i-1]) / 2.0);
      IF v_mrr_arr[i] >= v_threshold THEN
        v_stable := v_stable + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_stable;
END;
$$;

COMMENT ON FUNCTION count_stable_revenue_months(UUID) IS
  'Cuenta meses con MRR estable en ventana 4 meses. M1=PASS, M2>=0.75×M1, M3+>=0.75×AVG(M-1,M-2). Fuente: key_metrics.mrr>0. Simplificado v1: sin check cash_flow mensual ni condiciones adicionales FASE_1 F1.6.';


-- =============================================================================
-- 1. compute_phase3_o31 — Estabilidad temporal (peso 0.40)
--
-- O3.1 = MIN(100, (stable_months / 3) × 100)
-- stable_months: ver count_stable_revenue_months() arriba.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase3_o31(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stable INTEGER;
BEGIN
  v_stable := count_stable_revenue_months(p_project_id);
  RETURN ROUND(LEAST(100.0, (v_stable::NUMERIC / 3.0) * 100.0), 2);
END;
$$;

COMMENT ON FUNCTION compute_phase3_o31(UUID) IS
  'O3.1 Phase 3: Estabilidad temporal (peso 0.40). MIN(100,(stable_months/3)×100). Fuente: count_stable_revenue_months(). Simplificado v1.';


-- =============================================================================
-- 2. compute_phase3_o32 — Execution health (peso 0.35)
--
-- bloqueo_penalty = proxy de project_risk_score.risk_level
--   (friction_count y critical_count NO existen en schema v1)
--   low→100 | medium→70 | high→40 | critical→10 | NULL→80 (neutral)
--
-- O3.2 = (capacity_health × 0.50) + (execution_rate × 0.30) + (bloqueo_penalty × 0.20)
--
-- Cap de velocity: si compute_iteration_velocity = 0 → O3.2 = MIN(O3.2, 40)
-- (proxy de "velocity = 0 durante ≥4 semanas" según FASE_1 F1.6)
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase3_o32(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity_health  NUMERIC;
  v_execution_rate   NUMERIC;
  v_bloqueo_penalty  NUMERIC;
  v_risk_level       TEXT;
  v_velocity         INTEGER;
  v_o32              NUMERIC;
BEGIN
  v_capacity_health := compute_capacity_health(p_project_id);
  v_execution_rate  := compute_execution_rate(p_project_id);

  -- bloqueo_penalty via project_risk_score.risk_level (proxy v1)
  SELECT risk_level INTO v_risk_level
  FROM   project_risk_score
  WHERE  project_id = p_project_id;

  v_bloqueo_penalty := CASE v_risk_level
    WHEN 'low'      THEN 100
    WHEN 'medium'   THEN  70
    WHEN 'high'     THEN  40
    WHEN 'critical' THEN  10
    ELSE                  80   -- NULL / sin datos → neutral
  END;

  v_o32 := ROUND(
    LEAST(100.0, GREATEST(0.0,
      (v_capacity_health * 0.50)
      + (v_execution_rate  * 0.30)
      + (v_bloqueo_penalty * 0.20)
    )),
    2
  );

  -- Cap si velocity estancado: 0 OBVs con resultado en últimos 28 días
  v_velocity := compute_iteration_velocity(p_project_id);
  IF v_velocity = 0 THEN
    v_o32 := LEAST(v_o32, 40.0);
  END IF;

  RETURN v_o32;
END;
$$;

COMMENT ON FUNCTION compute_phase3_o32(UUID) IS
  'O3.2 Phase 3: Execution health (peso 0.35). capacity_health×0.50 + execution_rate×0.30 + bloqueo_penalty×0.20. bloqueo_penalty proxy via project_risk_score.risk_level (low→100,med→70,high→40,crit→10,NULL→80). velocity=0→cap 40. v1 simplificado: sin friction_count/critical_count reales.';


-- =============================================================================
-- 3. compute_phase3_o33 — Independencia del founder (peso 0.25)
--
-- Proxy v1 (acordado E4.4): time-window, NO FK directa.
-- "Tarea del ciclo" = tarea done con completed_at >= cycle.start_date.
--
-- current_cycle = ciclo con closed_at IS NULL de mayor cycle_index;
--                 fallback: ciclo de mayor cycle_index (si todos cerrados).
--
-- Score:
--   tasks_in_cycle >= 3 AND has_cycle → 60  ("procesos documentados" — cap v1)
--   has_cycle                          → 30  (ciclo activo, poca ejecución)
--   no cycle data                      → 20  ("founder central, sin sistema")
--
-- Max = 60 (FASE_1 F1.6: "Solo founder: max O3.3 = 60").
-- Score 100 ("función operada por otra persona") requiere v2 con datos explícitos.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase3_o33(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_start    DATE;
  v_has_cycle      BOOLEAN := FALSE;
  v_tasks_in_cycle INTEGER := 0;
BEGIN
  -- Ciclo activo: mayor cycle_index con closed_at IS NULL
  SELECT start_date INTO v_cycle_start
  FROM   strategic_cycles
  WHERE  project_id = p_project_id
    AND  closed_at IS NULL
  ORDER  BY cycle_index DESC
  LIMIT  1;

  -- Fallback: mayor cycle_index (todos cerrados o ninguno activo)
  IF NOT FOUND OR v_cycle_start IS NULL THEN
    SELECT start_date INTO v_cycle_start
    FROM   strategic_cycles
    WHERE  project_id = p_project_id
    ORDER  BY cycle_index DESC
    LIMIT  1;
  END IF;

  v_has_cycle := (v_cycle_start IS NOT NULL);

  IF v_has_cycle THEN
    SELECT COUNT(*) INTO v_tasks_in_cycle
    FROM   tasks
    WHERE  project_id   = p_project_id
      AND  status       = 'done'
      AND  completed_at >= v_cycle_start::TIMESTAMPTZ;
  END IF;

  RETURN CASE
    WHEN v_tasks_in_cycle >= 3 AND v_has_cycle THEN 60   -- "procesos documentados"
    WHEN v_has_cycle                            THEN 30   -- ciclo activo, poca actividad
    ELSE                                             20   -- sin ciclo = "founder central"
  END;
END;
$$;

COMMENT ON FUNCTION compute_phase3_o33(UUID) IS
  'O3.3 Phase 3: Independencia del founder (peso 0.25). Proxy temporal v1: tarea_del_ciclo = done + completed_at >= cycle.start_date. Max 60 (FASE_1 F1.6 cap). Score 100 requiere v2 con tasks.strategic_cycle_id FK. Fuente: strategic_cycles + tasks.';


-- =============================================================================
-- 4. compute_phase3_score — Weighted sum Phase 3
--
-- phase3_score = O3.1×0.40 + O3.2×0.35 + O3.3×0.25
-- Fórmula canónica: FASE_1 F1.6 (ENGINE_SPEC_V1.md §4)
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase3_score(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_o31 NUMERIC;
  v_o32 NUMERIC;
  v_o33 NUMERIC;
BEGIN
  v_o31 := compute_phase3_o31(p_project_id);
  v_o32 := compute_phase3_o32(p_project_id);
  v_o33 := compute_phase3_o33(p_project_id);

  RETURN ROUND(
    LEAST(100.0, GREATEST(0.0,
      (v_o31 * 0.40) + (v_o32 * 0.35) + (v_o33 * 0.25)
    )),
    2
  );
END;
$$;

COMMENT ON FUNCTION compute_phase3_score(UUID) IS
  'Phase 3 composite score = O3.1×0.40 + O3.2×0.35 + O3.3×0.25. Fórmula canónica FASE_1 F1.6 / ENGINE_SPEC_V1.md §4.';


-- =============================================================================
-- 5. run_phase_engine — Integra Phase 3, mantiene Phase 1 y 2 intactos
--
-- CAMBIOS vs migration 00014:
--   • IF v_cur_phase = 3 THEN → lógica real de Phase 3
--   • Hard signal Phase 3→4: stable_months >= 3
--                          AND cost_data_months >= 2 de últimos 3 meses
--                          AND tasks_in_cycle >= 1
--   • IF v_cur_phase > 3 THEN → placeholder para E4.5 (Phase 4)
--
-- VARIABLES AÑADIDAS para Phase 3:
--   v_o3_1, v_o3_2, v_o3_3 (scores)
--   v_stable_months         (INTEGER — shared con hard signal)
--   v_months_with_costs     (INTEGER — hard signal condición 2)
--   v_cycle_start_p3        (DATE    — para hard signal condición 3)
--   v_tasks_in_cycle_p3     (INTEGER — hard signal condición 3)
-- =============================================================================

CREATE OR REPLACE FUNCTION run_phase_engine(
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
  v_cur_phase        SMALLINT;
  v_phase_entered    TIMESTAMPTZ;
  v_phase_changed    TIMESTAMPTZ;

  -- Phase 1 variables (sin cambios desde migration 00005)
  v_n_interviews     INTEGER;
  v_o1_1             NUMERIC;
  v_n_positive       INTEGER;
  v_pct_dolor        NUMERIC;
  v_o1_2_base        NUMERIC;
  v_o1_2             NUMERIC;
  v_strategy_def     BOOLEAN;
  v_pivot_count      INTEGER;
  v_o1_3             NUMERIC;

  -- Phase 2 variables (migration 00014)
  v_o2_1             NUMERIC;
  v_o2_2             NUMERIC;
  v_o2_3             NUMERIC;
  v_has_payment_obv  BOOLEAN;
  v_rev_momentum     NUMERIC;

  -- Phase 3 variables (E4.4)
  v_o3_1             NUMERIC;
  v_o3_2             NUMERIC;
  v_o3_3             NUMERIC;
  v_stable_months    INTEGER;
  v_months_with_costs INTEGER;
  v_cycle_start_p3   DATE;
  v_tasks_in_cycle_p3 INTEGER;

  -- Resultados compartidos
  v_phase_score      NUMERIC;
  v_hard_signal      BOOLEAN;
  v_velocity         INTEGER;
  v_phase_status     TEXT;

  -- Avance de fase
  v_new_phase        SMALLINT;
  v_advanced         BOOLEAN;
  v_change_reason    TEXT;
BEGIN

  -- -----------------------------------------------------------------------
  -- Motor activo
  -- -----------------------------------------------------------------------
  SELECT id INTO v_ver
  FROM   engine_versions
  WHERE  motor = 'phase' AND is_active = TRUE
  LIMIT  1;
  IF v_ver IS NULL THEN v_ver := 'phase_v1.0'; END IF;

  -- -----------------------------------------------------------------------
  -- Estado actual de fase
  -- -----------------------------------------------------------------------
  SELECT current_phase, phase_entered_at, phase_last_changed_at
  INTO   v_cur_phase, v_phase_entered, v_phase_changed
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  v_cur_phase     := COALESCE(v_cur_phase, 1);
  v_phase_entered := COALESCE(v_phase_entered, NOW());
  v_phase_changed := COALESCE(v_phase_changed, NOW());

  -- -----------------------------------------------------------------------
  -- Init avance de fase
  -- -----------------------------------------------------------------------
  v_advanced      := FALSE;
  v_change_reason := NULL;
  v_new_phase     := v_cur_phase;

  -- =======================================================================
  -- PHASE 3 — Operación
  -- =======================================================================
  IF v_cur_phase = 3 THEN

    -- Subfunctions
    v_o3_1        := compute_phase3_o31(p_project_id);
    v_o3_2        := compute_phase3_o32(p_project_id);
    v_o3_3        := compute_phase3_o33(p_project_id);
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o3_1 * 0.40) + (v_o3_2 * 0.35) + (v_o3_3 * 0.25)
      )), 2
    );

    -- Hard signal Phase 3 → 4 (FASE_1 F1.6 — 3 condiciones):
    --
    -- Condición 1: stable_months >= 3 (misma lógica que O3.1)
    v_stable_months := count_stable_revenue_months(p_project_id);

    -- Condición 2: cash flow confidence HIGH
    --   = costes reales registrados en >= 2 de los últimos 3 meses
    SELECT COUNT(DISTINCT MAKE_DATE(year, month, 1))
    INTO   v_months_with_costs
    FROM   financial_projections
    WHERE  project_id = p_project_id
      AND  MAKE_DATE(year, month, 1) >= (CURRENT_DATE - INTERVAL '3 months')
      AND  (COALESCE(cogs, 0)
          + COALESCE(payroll, 0)
          + COALESCE(marketing_spend, 0)
          + COALESCE(infrastructure, 0)
          + COALESCE(other_costs, 0)) > 0;

    -- Condición 3: tasks_in_cycle >= 1
    --   (proxy de "función crítica no exclusivamente en founder" — FASE_1 F1.6 #3)
    SELECT start_date INTO v_cycle_start_p3
    FROM   strategic_cycles
    WHERE  project_id = p_project_id
      AND  closed_at IS NULL
    ORDER  BY cycle_index DESC
    LIMIT  1;

    IF v_cycle_start_p3 IS NULL THEN
      SELECT start_date INTO v_cycle_start_p3
      FROM   strategic_cycles
      WHERE  project_id = p_project_id
      ORDER  BY cycle_index DESC
      LIMIT  1;
    END IF;

    IF v_cycle_start_p3 IS NOT NULL THEN
      SELECT COUNT(*) INTO v_tasks_in_cycle_p3
      FROM   tasks
      WHERE  project_id   = p_project_id
        AND  status       = 'done'
        AND  completed_at >= v_cycle_start_p3::TIMESTAMPTZ;
    ELSE
      v_tasks_in_cycle_p3 := 0;
    END IF;

    v_hard_signal := (
      v_stable_months         >= 3
      AND v_months_with_costs >= 2
      AND v_tasks_in_cycle_p3 >= 1
    );

    -- Velocity gate
    v_velocity := compute_iteration_velocity(p_project_id);

    -- phase_status — day-1 friendly (sin revenue no es crítico de entrada)
    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      WHEN v_stable_months = 0   THEN 'friction'   -- sin datos de revenue → fricción
      ELSE                            'critical'
    END;

    -- Gate de avance Phase 3 → 4
    IF v_phase_score >= 75.0
       AND v_hard_signal = TRUE
       AND v_velocity    >= 2
    THEN
      v_new_phase     := 4;
      v_advanced      := TRUE;
      v_change_reason := 'threshold_met';
      v_phase_entered := NOW();
    END IF;

    -- UPSERT project_phase_state
    INSERT INTO project_phase_state (
      project_id,        current_phase,
      phase_score,       hard_signal_met,
      phase_status,      phase_entered_at,
      phase_last_changed_at, last_calculated_at,
      engine_version
    )
    VALUES (
      p_project_id,      v_new_phase,
      v_phase_score,     v_hard_signal,
      v_phase_status,    v_phase_entered,
      CASE WHEN v_advanced THEN NOW() ELSE v_phase_changed END,
      NOW(),             v_ver
    )
    ON CONFLICT (project_id) DO UPDATE SET
      current_phase         = EXCLUDED.current_phase,
      phase_score           = EXCLUDED.phase_score,
      hard_signal_met       = EXCLUDED.hard_signal_met,
      phase_status          = EXCLUDED.phase_status,
      phase_entered_at      = EXCLUDED.phase_entered_at,
      phase_last_changed_at = EXCLUDED.phase_last_changed_at,
      last_calculated_at    = EXCLUDED.last_calculated_at,
      engine_version        = EXCLUDED.engine_version;

    -- INSERT project_phase_history
    INSERT INTO project_phase_history (
      project_id,     phase,
      phase_score,    hard_signal_met,
      phase_status,   change_reason,
      trigger_source, engine_version
    )
    VALUES (
      p_project_id,   v_new_phase,
      v_phase_score,  v_hard_signal,
      v_phase_status, v_change_reason,
      p_trigger_source, v_ver
    );

    RETURN;
  END IF;

  -- =======================================================================
  -- PHASE 4 — placeholder hasta E4.5
  -- =======================================================================
  IF v_cur_phase > 3 THEN
    UPDATE project_phase_state
    SET    last_calculated_at = NOW(),
           engine_version     = v_ver
    WHERE  project_id = p_project_id;

    INSERT INTO project_phase_history (
      project_id, phase, phase_score, hard_signal_met, phase_status,
      change_reason, trigger_source, engine_version
    )
    SELECT p_project_id, current_phase, phase_score, hard_signal_met, phase_status,
           NULL, p_trigger_source, v_ver
    FROM   project_phase_state
    WHERE  project_id = p_project_id;

    RETURN;
  END IF;

  -- =======================================================================
  -- PHASE 2 — Validación (sin cambios desde migration 00014)
  -- =======================================================================
  IF v_cur_phase = 2 THEN

    v_o2_1        := compute_phase2_o21(p_project_id);
    v_o2_2        := compute_phase2_o22(p_project_id);
    v_o2_3        := compute_phase2_o23(p_project_id);
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o2_1 * 0.45) + (v_o2_2 * 0.25) + (v_o2_3 * 0.30)
      )), 2
    );

    SELECT EXISTS (
      SELECT 1 FROM obvs
      WHERE  project_id    = p_project_id
        AND  tipo::text   IN ('revenue_validation', 'venta')
        AND  evidence_type = 'payment'
        AND  obv_outcome   = 'success'
        AND  created_at   >= NOW() - INTERVAL '90 days'
    ) INTO v_has_payment_obv;

    SELECT COALESCE(revenue_momentum_input, 30)
    INTO   v_rev_momentum
    FROM   project_probability
    WHERE  project_id = p_project_id;
    v_rev_momentum := COALESCE(v_rev_momentum, 30);

    v_hard_signal := (v_has_payment_obv = TRUE AND v_rev_momentum > 0);
    v_velocity    := compute_iteration_velocity(p_project_id);

    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      WHEN v_o2_1        = 0     THEN 'friction'
      ELSE                            'critical'
    END;

    IF v_phase_score >= 75.0 AND v_hard_signal = TRUE AND v_velocity >= 2 THEN
      v_new_phase     := 3;
      v_advanced      := TRUE;
      v_change_reason := 'threshold_met';
      v_phase_entered := NOW();
    END IF;

    INSERT INTO project_phase_state (
      project_id, current_phase, phase_score, hard_signal_met, phase_status,
      phase_entered_at, phase_last_changed_at, last_calculated_at, engine_version
    )
    VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal, v_phase_status,
      v_phase_entered,
      CASE WHEN v_advanced THEN NOW() ELSE v_phase_changed END,
      NOW(), v_ver
    )
    ON CONFLICT (project_id) DO UPDATE SET
      current_phase         = EXCLUDED.current_phase,
      phase_score           = EXCLUDED.phase_score,
      hard_signal_met       = EXCLUDED.hard_signal_met,
      phase_status          = EXCLUDED.phase_status,
      phase_entered_at      = EXCLUDED.phase_entered_at,
      phase_last_changed_at = EXCLUDED.phase_last_changed_at,
      last_calculated_at    = EXCLUDED.last_calculated_at,
      engine_version        = EXCLUDED.engine_version;

    INSERT INTO project_phase_history (
      project_id, phase, phase_score, hard_signal_met, phase_status,
      change_reason, trigger_source, engine_version
    )
    VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal, v_phase_status,
      v_change_reason, p_trigger_source, v_ver
    );

    RETURN;
  END IF;

  -- =======================================================================
  -- PHASE 1 — Descubrimiento (sin cambios desde migration 00005)
  -- =======================================================================

  SELECT COUNT(*) INTO v_n_interviews
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  tipo::text IN ('customer_discovery', 'exploracion');

  v_o1_1 := LEAST(100.0, (v_n_interviews::NUMERIC / 10.0) * 100.0);

  SELECT COUNT(*) INTO v_n_positive
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  tipo::text IN ('customer_discovery', 'exploracion')
    AND  obv_outcome = 'success';

  v_pct_dolor := CASE
    WHEN v_n_interviews > 0 THEN (v_n_positive::NUMERIC / v_n_interviews) * 100.0
    ELSE 0.0
  END;

  v_o1_2_base := LEAST(100.0, (v_pct_dolor / 30.0) * 100.0);
  v_o1_2      := CASE
    WHEN v_n_interviews < 5 THEN v_o1_2_base * 0.5
    ELSE v_o1_2_base
  END;

  SELECT COALESCE(
    COALESCE(LENGTH(segment_text),   0) >= 10
    AND COALESCE(LENGTH(problem_text),  0) >= 10
    AND COALESCE(LENGTH(value_prop_text),0) >= 10,
    FALSE
  )
  INTO v_strategy_def
  FROM project_strategy_current
  WHERE project_id = p_project_id;
  v_strategy_def := COALESCE(v_strategy_def, FALSE);

  SELECT COUNT(*) INTO v_pivot_count
  FROM   strategic_model_versions
  WHERE  project_id = p_project_id
    AND  created_at >= NOW() - INTERVAL '28 days';

  v_o1_3 := CASE
    WHEN NOT v_strategy_def OR v_pivot_count >= 4  THEN   0.0
    WHEN v_pivot_count <= 1                         THEN 100.0
    WHEN v_pivot_count = 2                          THEN  75.0
    WHEN v_pivot_count = 3                          THEN  50.0
    ELSE 0.0
  END;

  v_phase_score := ROUND(
    (v_o1_1 * 0.40) + (v_o1_2 * 0.40) + (v_o1_3 * 0.20),
    2
  );

  v_hard_signal := (
    v_n_interviews >= 10 AND v_pct_dolor >= 30.0 AND v_strategy_def = TRUE
  );

  v_velocity := compute_iteration_velocity(p_project_id);

  v_phase_status := CASE
    WHEN v_phase_score >= 75.0 THEN 'healthy'
    WHEN v_phase_score >= 50.0 THEN 'friction'
    WHEN v_n_interviews = 0    THEN 'friction'
    ELSE                            'critical'
  END;

  IF v_cur_phase = 1
     AND v_phase_score >= 75.0
     AND v_hard_signal = TRUE
     AND v_velocity    >= 2
  THEN
    v_new_phase     := 2;
    v_advanced      := TRUE;
    v_change_reason := 'threshold_met';
    v_phase_entered := NOW();
  END IF;

  INSERT INTO project_phase_state (
    project_id, current_phase, phase_score, hard_signal_met, phase_status,
    phase_entered_at, phase_last_changed_at, last_calculated_at, engine_version
  )
  VALUES (
    p_project_id, v_new_phase, v_phase_score, v_hard_signal, v_phase_status,
    v_phase_entered,
    CASE WHEN v_advanced THEN NOW() ELSE v_phase_changed END,
    NOW(), v_ver
  )
  ON CONFLICT (project_id) DO UPDATE SET
    current_phase         = EXCLUDED.current_phase,
    phase_score           = EXCLUDED.phase_score,
    hard_signal_met       = EXCLUDED.hard_signal_met,
    phase_status          = EXCLUDED.phase_status,
    phase_entered_at      = EXCLUDED.phase_entered_at,
    phase_last_changed_at = EXCLUDED.phase_last_changed_at,
    last_calculated_at    = EXCLUDED.last_calculated_at,
    engine_version        = EXCLUDED.engine_version;

  INSERT INTO project_phase_history (
    project_id, phase, phase_score, hard_signal_met, phase_status,
    change_reason, trigger_source, engine_version
  )
  VALUES (
    p_project_id, v_new_phase, v_phase_score, v_hard_signal, v_phase_status,
    v_change_reason, p_trigger_source, v_ver
  );

END;
$$;

COMMENT ON FUNCTION run_phase_engine(UUID, TEXT) IS
  'Phase Engine v1: Phase 1 (O1.1×0.40+O1.2×0.40+O1.3×0.20), Phase 2 (O2.1×0.45+O2.2×0.25+O2.3×0.30), Phase 3 (O3.1×0.40+O3.2×0.35+O3.3×0.25). Phase 4: placeholder. Gate: score≥75 AND hard_signal AND velocity≥2. Motor: phase_v1.0.';
