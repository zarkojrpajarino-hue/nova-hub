-- =============================================================================
-- MIGRACIÓN 00017 — PATCH: Hard signal calibration + O3.3 rolling window
--
-- Problema base: tres señales hard en migrations 00014/00015 estaban mal
-- calibradas o eran condiciones muertas (sin data path real desde UI):
--
--   A) Phase 2→3 hard signal: revenue_momentum > 0 era vacío (COALESCE default=30,
--      30>0 siempre TRUE → condición nunca filtraba nada)
--
--   B) Phase 3→4 cond.2: cost_data_months >= 2 dependía de financial_projections,
--      tabla sin ningún data path desde UI → condición permanentemente FALSE
--      (una condición muerta no endurece: rompe el sistema)
--
--   C) Phase 3→4 cond.3 + compute_phase3_o33: usaban cycle.start_date de
--      strategic_cycles, pero el cron de avance de ciclos NO está implementado
--      (confirmed: closed_at nunca se escribe). start_date = lunes del onboarding,
--      invariante → "tasks_in_cycle" = "todas las tareas desde el primer día"
--      → condición trivialmente fácil (cualquier proyecto con 3+ tareas pasa)
--
-- Fixes:
--
--   A) revenue_momentum >= 40
--      40 = "estable" según compute_revenue_momentum:
--        creciente → 60+  (pasa)
--        estable   → 40   (pasa)
--        cayendo   → <40  (falla)
--        sin datos → 30   (COALESCE fallback, falla → correcto en v1)
--      Data path: key_metrics.mrr → compute_revenue_momentum (motor prob)
--                 → project_probability.revenue_momentum_input
--      UI: KeyMetricsEditor (migration 00016 audit fix, sprint actual)
--
--   B) cost_data_months ELIMINADA del hard signal v1.
--      DEUDA v2: reincorporar cuando exista captura estructurada de
--      financial_projections (cogs, payroll, etc.) desde UI.
--      Nota spec: condición financiera pasa a advertencia / componente O4.2.
--
--   C) tasks_done_28d >= 3 (rolling 28d, idéntico al patrón de
--      compute_iteration_velocity — migration 00003)
--      Renombrado tasks_in_cycle → tasks_done_28d para no sugerir
--      relación con ciclos que no existe en v1.
--      DEUDA v2: cuando closed_at / cycle rollover estén implementados,
--      recuperar semántica de ciclo real.
--
-- Funciones reemplazadas:
--   compute_phase3_o33(UUID)   — quita dependencia de strategic_cycles
--   run_phase_engine(UUID, TEXT) — actualiza Phase 2 + Phase 3 blocks
--
-- Firma idéntica. Sin cambios en Phase 1, compute_phase3_o31/o32/score.
-- =============================================================================

-- =============================================================================
-- 1. compute_phase3_o33 — Independencia del founder (peso 0.25)
--
-- PATCH 00017: rolling 28d en lugar de cycle.start_date.
--
-- Motivo: strategic_cycles.closed_at nunca se escribe (cron no implementado).
-- start_date = lunes del onboarding → tasks_in_cycle ≡ tareas históricas totales.
-- Rolling 28d es consistente con compute_iteration_velocity (migration 00003)
-- y representa "actividad de ejecución reciente real".
--
-- Variable renombrada: v_tasks_in_cycle → v_tasks_done_28d
-- (elimina la sugerencia de ciclo que no existe en v1)
--
-- Score:
--   tasks_done_28d >= 3 → 60  ("ejecución estructural mínima" — cap v1)
--   tasks_done_28d >= 1 → 30  ("actividad reciente, no estructural todavía")
--   tasks_done_28d  = 0 → 20  ("sin ejecución reciente — founder paralizado")
--
-- Max = 60 (FASE_1 F1.6: "Solo founder: max O3.3 = 60").
-- Score 100 ("función operada por otra persona") requiere v2.
--
-- DEUDA v2: recuperar semántica de ciclo cuando closed_at + cycle rollover
--           estén implementados. Variable → v_tasks_in_cycle.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase3_o33(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tasks_done_28d INTEGER := 0;
BEGIN
  -- tasks_done_28d: tareas completadas en rolling window de 28 días.
  -- En v1 NO se usa cycle.start_date: el avance de ciclos no está implementado
  -- (closed_at nunca se escribe → start_date = fecha de onboarding invariante).
  -- Patrón consistente con compute_iteration_velocity (migration 00003, 28d).
  SELECT COUNT(*) INTO v_tasks_done_28d
  FROM   tasks
  WHERE  project_id   = p_project_id
    AND  status       = 'done'
    AND  completed_at >= NOW() - INTERVAL '28 days';

  RETURN CASE
    WHEN v_tasks_done_28d >= 3 THEN 60   -- ejecución estructural mínima — cap v1
    WHEN v_tasks_done_28d >= 1 THEN 30   -- actividad reciente, no estructural todavía
    ELSE                            20   -- sin ejecución reciente
  END;
END;
$$;

COMMENT ON FUNCTION compute_phase3_o33(UUID) IS
  'O3.3 Phase 3: Independencia del founder (peso 0.25). PATCH 00017: rolling 28d en lugar de cycle.start_date (ciclo rollover no implementado en v1). tasks_done_28d>=3→60, >=1→30, 0→20. Max 60 (FASE_1 F1.6 cap). DEUDA v2: recuperar semántica de ciclo cuando closed_at esté implementado.';


-- =============================================================================
-- 2. run_phase_engine — Integra Phase 1, 2, 3 con hard signals calibrados
--
-- CAMBIOS vs migration 00015:
--
--   Phase 2 block:
--     • v_rev_momentum > 0  →  v_rev_momentum >= 40
--       (40 = umbral mínimo de MRR estable/creciente según compute_revenue_momentum)
--
--   Phase 3 block:
--     • ELIMINADO: v_months_with_costs + financial_projections query (cond.2 muerta)
--     • ELIMINADO: v_cycle_start_p3 + strategic_cycles queries (ciclo no avanza)
--     • AÑADIDO:   v_tasks_done_28d_p3 INTEGER — rolling 28d
--     • Hard signal: stable_months >= 3 AND tasks_done_28d >= 3
--       (de 3 condiciones a 2 — la eliminada se documenta como deuda v2)
--
--   DECLARE section: limpia variables obsoletas, añade v_tasks_done_28d_p3
--
-- Sin cambios en Phase 1, scores, UPSERT/INSERT blocks.
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

  -- Phase 3 variables
  -- PATCH 00017: eliminados v_months_with_costs, v_cycle_start_p3, v_tasks_in_cycle_p3
  --              añadido v_tasks_done_28d_p3 (rolling 28d, sin dependencia de ciclos)
  v_o3_1             NUMERIC;
  v_o3_2             NUMERIC;
  v_o3_3             NUMERIC;
  v_stable_months    INTEGER;
  v_tasks_done_28d_p3 INTEGER;

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

    -- Subfunctions (sin cambios en scores)
    v_o3_1        := compute_phase3_o31(p_project_id);
    v_o3_2        := compute_phase3_o32(p_project_id);
    v_o3_3        := compute_phase3_o33(p_project_id);  -- PATCH: usa rolling 28d
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o3_1 * 0.40) + (v_o3_2 * 0.35) + (v_o3_3 * 0.25)
      )), 2
    );

    -- ── Hard signal Phase 3→4 (PATCH 00017 — 2 condiciones, no 3) ──────────
    --
    -- Condición 1: stable_months >= 3 (3 meses de MRR estable/creciente)
    v_stable_months := count_stable_revenue_months(p_project_id);

    -- Condición 2 (ELIMINADA v1): cost_data_months >= 2
    --   Razón: financial_projections sin UI → condición permanentemente FALSE.
    --   Una condición muerta no endurece el sistema: lo rompe.
    --   DEUDA v2: reincorporar cuando exista captura de financial_projections
    --             desde UI (cogs, payroll, etc.). Candidato: componente O4.2.

    -- Condición 3 → renombrada a "cond.2 v1": tasks_done_28d >= 3
    --   Rolling 28d: consistente con compute_iteration_velocity (migration 00003).
    --   Reemplaza cycle.start_date (closed_at no se escribe → ciclo no avanza).
    --   Renombrado tasks_in_cycle → tasks_done_28d_p3 para no sugerir semántica
    --   de ciclo que no existe en v1.
    SELECT COUNT(*) INTO v_tasks_done_28d_p3
    FROM   tasks
    WHERE  project_id   = p_project_id
      AND  status       = 'done'
      AND  completed_at >= NOW() - INTERVAL '28 days';

    v_hard_signal := (
      v_stable_months      >= 3
      AND v_tasks_done_28d_p3 >= 3
    );

    -- Velocity gate
    v_velocity := compute_iteration_velocity(p_project_id);

    -- phase_status
    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      WHEN v_stable_months = 0   THEN 'friction'   -- sin datos de revenue → fricción
      ELSE                            'critical'
    END;

    -- Gate de avance Phase 3→4
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
  -- PHASE 2 — Validación
  -- PATCH 00017: v_rev_momentum > 0  →  v_rev_momentum >= 40
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

    -- PATCH 00017: >= 40 en lugar de > 0
    -- 40 = "estable" según compute_revenue_momentum:
    --   creciente → 60+  (pasa)   |  estable → 40   (pasa)
    --   cayendo   → <40  (falla)  |  sin datos → 30 COALESCE (falla — correcto)
    -- Con > 0 el COALESCE default 30 siempre pasaba → condición vacía.
    v_hard_signal := (v_has_payment_obv = TRUE AND v_rev_momentum >= 40);
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
  'Phase Engine v1 PATCH 00017. Phase 1: O1.1×0.40+O1.2×0.40+O1.3×0.20. Phase 2: O2.1×0.45+O2.2×0.25+O2.3×0.30; hard signal: payment_obv AND rev_momentum>=40. Phase 3: O3.1×0.40+O3.2×0.35+O3.3×0.25; hard signal: stable_months>=3 AND tasks_done_28d>=3. Gate: score>=75 AND hard_signal AND velocity>=2. DEUDA v2: cost_data_months (financial_projections UI), cycle rollover (closed_at).';
