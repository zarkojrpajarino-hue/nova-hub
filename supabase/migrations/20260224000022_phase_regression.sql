-- =============================================================================
-- MIGRACIÓN 00022 — E4.7: Regresión de fase (consecutive_low_score)
--
-- Problema:
--   run_phase_engine podía avanzar fases pero nunca retroceder.
--   Un proyecto con score < 50 durante semanas indefinidas permanecía
--   en su fase actual sin consecuencias.
--
-- Solución:
--   Campo consecutive_low_score en project_phase_state.
--   Solo se actualiza en weekly_job y solo para fases > 1.
--   Al llegar a 6 semanas consecutivas con score < 50 → regresión.
--
-- Reglas:
--   - Solo weekly_job cuenta (acceleration/on-demand no contaminan)
--   - Fase 1 nunca acumula racha (v_cur_phase > 1)
--   - Si score >= 50 → reset a 0
--   - Si consecutive_low_score >= 6 → v_new_phase = v_cur_phase - 1
--   - Al regresar: change_reason = 'regression', racha = 0, phase_entered_at = NOW()
--   - Gate de avance tiene prioridad sobre gate de regresión
--   - Fases que pueden regresar: 2→1, 3→2, 4→3
--   - No-weekly_job preserva consecutive_low_score exactamente como estaba en DB
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Añadir campo
-- ---------------------------------------------------------------------------
ALTER TABLE project_phase_state
  ADD COLUMN consecutive_low_score SMALLINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN project_phase_state.consecutive_low_score IS
  'Semanas consecutivas con phase_score < 50 (solo weekly_job, solo fases > 1). Al llegar a 6 → regresión.';

-- ---------------------------------------------------------------------------
-- 2. run_phase_engine — reemplazo completo con lógica de regresión
--    Base: migration 00018. Cambios marcados con -- [E4.7].
-- ---------------------------------------------------------------------------
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
  v_consecutive_low  SMALLINT;  -- [E4.7]

  -- Phase 1 variables
  v_n_interviews     INTEGER;
  v_o1_1             NUMERIC;
  v_n_positive       INTEGER;
  v_pct_dolor        NUMERIC;
  v_o1_2_base        NUMERIC;
  v_o1_2             NUMERIC;
  v_strategy_def     BOOLEAN;
  v_pivot_count      INTEGER;
  v_o1_3             NUMERIC;

  -- Phase 2 variables
  v_o2_1             NUMERIC;
  v_o2_2             NUMERIC;
  v_o2_3             NUMERIC;
  v_has_payment_obv  BOOLEAN;
  v_rev_momentum     NUMERIC;

  -- Phase 3 variables
  v_o3_1             NUMERIC;
  v_o3_2             NUMERIC;
  v_o3_3             NUMERIC;
  v_stable_months    INTEGER;
  v_tasks_done_28d_p3 INTEGER;

  -- Phase 4 variables
  v_o4_1             NUMERIC;
  v_o4_2             NUMERIC;
  v_o4_3             NUMERIC;
  v_risk_level       TEXT;

  -- Resultados compartidos
  v_phase_score      NUMERIC;
  v_hard_signal      BOOLEAN;
  v_velocity         INTEGER;
  v_phase_status     TEXT;

  -- Avance / regresión de fase
  v_new_phase        SMALLINT;
  v_advanced         BOOLEAN;
  v_change_reason    TEXT;
BEGIN

  -- -------------------------------------------------------------------------
  -- Motor activo
  -- -------------------------------------------------------------------------
  SELECT id INTO v_ver
  FROM   engine_versions
  WHERE  motor = 'phase' AND is_active = TRUE
  LIMIT  1;
  IF v_ver IS NULL THEN v_ver := 'phase_v1.0'; END IF;

  -- -------------------------------------------------------------------------
  -- Estado actual de fase  [E4.7: añadir consecutive_low_score]
  -- -------------------------------------------------------------------------
  SELECT current_phase, phase_entered_at, phase_last_changed_at,
         COALESCE(consecutive_low_score, 0)
  INTO   v_cur_phase, v_phase_entered, v_phase_changed, v_consecutive_low
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  v_cur_phase       := COALESCE(v_cur_phase, 1);
  v_phase_entered   := COALESCE(v_phase_entered, NOW());
  v_phase_changed   := COALESCE(v_phase_changed, NOW());
  v_consecutive_low := COALESCE(v_consecutive_low, 0);  -- [E4.7]

  -- -------------------------------------------------------------------------
  -- Init avance / regresión
  -- -------------------------------------------------------------------------
  v_advanced      := FALSE;
  v_change_reason := NULL;
  v_new_phase     := v_cur_phase;

  -- =========================================================================
  -- PHASE 3 — Operación
  -- =========================================================================
  IF v_cur_phase = 3 THEN

    v_o3_1        := compute_phase3_o31(p_project_id);
    v_o3_2        := compute_phase3_o32(p_project_id);
    v_o3_3        := compute_phase3_o33(p_project_id);
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o3_1 * 0.40) + (v_o3_2 * 0.35) + (v_o3_3 * 0.25)
      )), 2
    );

    v_stable_months := count_stable_revenue_months(p_project_id);

    SELECT COUNT(*) INTO v_tasks_done_28d_p3
    FROM   tasks
    WHERE  project_id   = p_project_id
      AND  status       = 'done'
      AND  completed_at >= NOW() - INTERVAL '28 days';

    v_hard_signal := (
      v_stable_months      >= 3
      AND v_tasks_done_28d_p3 >= 3
    );

    v_velocity := compute_iteration_velocity(p_project_id);

    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      WHEN v_stable_months = 0   THEN 'friction'
      ELSE                            'critical'
    END;

    -- [E4.7] Actualizar racha — solo weekly_job, solo fases > 1
    IF p_trigger_source = 'weekly_job' THEN
      IF v_phase_score < 50.0 THEN
        v_consecutive_low := v_consecutive_low + 1;
      ELSE
        v_consecutive_low := 0;
      END IF;
    END IF;

    -- Gate de avance Phase 3→4 (prioridad sobre regresión)
    IF v_phase_score >= 75.0
       AND v_hard_signal = TRUE
       AND v_velocity    >= 2
    THEN
      v_new_phase       := 4;
      v_advanced        := TRUE;
      v_change_reason   := 'threshold_met';
      v_phase_entered   := NOW();
      v_consecutive_low := 0;  -- reset al avanzar
    END IF;

    -- [E4.7] Gate de regresión Phase 3→2
    IF NOT v_advanced
       AND p_trigger_source = 'weekly_job'
       AND v_cur_phase > 1
       AND v_consecutive_low >= 6
    THEN
      v_new_phase       := 2;
      v_change_reason   := 'regression';
      v_consecutive_low := 0;
      v_phase_entered   := NOW();
    END IF;

    INSERT INTO project_phase_state (
      project_id,        current_phase,
      phase_score,       hard_signal_met,
      phase_status,      phase_entered_at,
      phase_last_changed_at, last_calculated_at,
      engine_version,    consecutive_low_score  -- [E4.7]
    )
    VALUES (
      p_project_id,      v_new_phase,
      v_phase_score,     v_hard_signal,
      v_phase_status,    v_phase_entered,
      CASE WHEN (v_advanced OR v_change_reason = 'regression') THEN NOW() ELSE v_phase_changed END,
      NOW(),             v_ver,
      v_consecutive_low  -- [E4.7]
    )
    ON CONFLICT (project_id) DO UPDATE SET
      current_phase         = EXCLUDED.current_phase,
      phase_score           = EXCLUDED.phase_score,
      hard_signal_met       = EXCLUDED.hard_signal_met,
      phase_status          = EXCLUDED.phase_status,
      phase_entered_at      = EXCLUDED.phase_entered_at,
      phase_last_changed_at = EXCLUDED.phase_last_changed_at,
      last_calculated_at    = EXCLUDED.last_calculated_at,
      engine_version        = EXCLUDED.engine_version,
      consecutive_low_score = EXCLUDED.consecutive_low_score;  -- [E4.7]

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

  -- =========================================================================
  -- PHASE 4 — Escala (terminal en v1)
  -- =========================================================================
  IF v_cur_phase = 4 THEN

    v_o4_1        := compute_phase4_o41(p_project_id);
    v_o4_2        := compute_phase4_o42(p_project_id);
    v_o4_3        := compute_phase4_o43(p_project_id);
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o4_1 * 0.40) + (v_o4_2 * 0.35) + (v_o4_3 * 0.25)
      )), 2
    );

    SELECT COALESCE(risk_level, 'low') INTO v_risk_level
    FROM   project_risk_score
    WHERE  project_id = p_project_id;
    v_risk_level := COALESCE(v_risk_level, 'low');

    v_hard_signal := (
      v_o4_1     >= 33
      AND v_o4_2 >= 50
      AND v_risk_level NOT IN ('high', 'critical')
    );

    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      ELSE                            'critical'
    END;

    -- [E4.7] Actualizar racha — solo weekly_job, solo fases > 1
    IF p_trigger_source = 'weekly_job' THEN
      IF v_phase_score < 50.0 THEN
        v_consecutive_low := v_consecutive_low + 1;
      ELSE
        v_consecutive_low := 0;
      END IF;
    END IF;

    -- Fase 4 no avanza (terminal en v1) — v_advanced permanece FALSE

    -- [E4.7] Gate de regresión Phase 4→3
    IF p_trigger_source = 'weekly_job'
       AND v_cur_phase > 1
       AND v_consecutive_low >= 6
    THEN
      v_new_phase       := 3;
      v_change_reason   := 'regression';
      v_consecutive_low := 0;
      v_phase_entered   := NOW();
    END IF;

    INSERT INTO project_phase_state (
      project_id,        current_phase,
      phase_score,       hard_signal_met,
      phase_status,      phase_entered_at,
      phase_last_changed_at, last_calculated_at,
      engine_version,    consecutive_low_score  -- [E4.7]
    )
    VALUES (
      p_project_id,      v_new_phase,
      v_phase_score,     v_hard_signal,
      v_phase_status,    v_phase_entered,
      CASE WHEN v_change_reason = 'regression' THEN NOW() ELSE v_phase_changed END,
      NOW(),             v_ver,
      v_consecutive_low  -- [E4.7]
    )
    ON CONFLICT (project_id) DO UPDATE SET
      current_phase         = EXCLUDED.current_phase,
      phase_score           = EXCLUDED.phase_score,
      hard_signal_met       = EXCLUDED.hard_signal_met,
      phase_status          = EXCLUDED.phase_status,
      phase_entered_at      = EXCLUDED.phase_entered_at,
      phase_last_changed_at = EXCLUDED.phase_last_changed_at,
      last_calculated_at    = EXCLUDED.last_calculated_at,
      engine_version        = EXCLUDED.engine_version,
      consecutive_low_score = EXCLUDED.consecutive_low_score;  -- [E4.7]

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

  -- =========================================================================
  -- PHASE 2 — Validación
  -- PATCH 00017: v_rev_momentum > 0  →  v_rev_momentum >= 40
  -- =========================================================================
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

    v_hard_signal := (v_has_payment_obv = TRUE AND v_rev_momentum >= 40);
    v_velocity    := compute_iteration_velocity(p_project_id);

    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      WHEN v_o2_1        = 0     THEN 'friction'
      ELSE                            'critical'
    END;

    -- [E4.7] Actualizar racha — solo weekly_job, solo fases > 1
    IF p_trigger_source = 'weekly_job' THEN
      IF v_phase_score < 50.0 THEN
        v_consecutive_low := v_consecutive_low + 1;
      ELSE
        v_consecutive_low := 0;
      END IF;
    END IF;

    -- Gate de avance Phase 2→3 (prioridad sobre regresión)
    IF v_phase_score >= 75.0 AND v_hard_signal = TRUE AND v_velocity >= 2 THEN
      v_new_phase       := 3;
      v_advanced        := TRUE;
      v_change_reason   := 'threshold_met';
      v_phase_entered   := NOW();
      v_consecutive_low := 0;  -- reset al avanzar
    END IF;

    -- [E4.7] Gate de regresión Phase 2→1
    IF NOT v_advanced
       AND p_trigger_source = 'weekly_job'
       AND v_cur_phase > 1
       AND v_consecutive_low >= 6
    THEN
      v_new_phase       := 1;
      v_change_reason   := 'regression';
      v_consecutive_low := 0;
      v_phase_entered   := NOW();
    END IF;

    INSERT INTO project_phase_state (
      project_id, current_phase, phase_score, hard_signal_met, phase_status,
      phase_entered_at, phase_last_changed_at, last_calculated_at,
      engine_version, consecutive_low_score  -- [E4.7]
    )
    VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal, v_phase_status,
      v_phase_entered,
      CASE WHEN (v_advanced OR v_change_reason = 'regression') THEN NOW() ELSE v_phase_changed END,
      NOW(), v_ver, v_consecutive_low  -- [E4.7]
    )
    ON CONFLICT (project_id) DO UPDATE SET
      current_phase         = EXCLUDED.current_phase,
      phase_score           = EXCLUDED.phase_score,
      hard_signal_met       = EXCLUDED.hard_signal_met,
      phase_status          = EXCLUDED.phase_status,
      phase_entered_at      = EXCLUDED.phase_entered_at,
      phase_last_changed_at = EXCLUDED.phase_last_changed_at,
      last_calculated_at    = EXCLUDED.last_calculated_at,
      engine_version        = EXCLUDED.engine_version,
      consecutive_low_score = EXCLUDED.consecutive_low_score;  -- [E4.7]

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

  -- =========================================================================
  -- PHASE 1 — Descubrimiento
  -- [E4.7] Sin racha ni regresión. consecutive_low_score se preserva en 0.
  -- =========================================================================

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

  -- Gate de avance Phase 1→2 (sin regresión posible desde Fase 1)
  IF v_cur_phase = 1
     AND v_phase_score >= 75.0
     AND v_hard_signal = TRUE
     AND v_velocity    >= 2
  THEN
    v_new_phase       := 2;
    v_advanced        := TRUE;
    v_change_reason   := 'threshold_met';
    v_phase_entered   := NOW();
    -- consecutive_low_score ya es 0 en Fase 1, reset explícito no necesario
  END IF;

  -- [E4.7] Fase 1: consecutive_low_score no se toca → se preserva (0)
  INSERT INTO project_phase_state (
    project_id, current_phase, phase_score, hard_signal_met, phase_status,
    phase_entered_at, phase_last_changed_at, last_calculated_at,
    engine_version, consecutive_low_score  -- [E4.7]
  )
  VALUES (
    p_project_id, v_new_phase, v_phase_score, v_hard_signal, v_phase_status,
    v_phase_entered,
    CASE WHEN v_advanced THEN NOW() ELSE v_phase_changed END,
    NOW(), v_ver, v_consecutive_low  -- [E4.7] siempre 0 en Fase 1
  )
  ON CONFLICT (project_id) DO UPDATE SET
    current_phase         = EXCLUDED.current_phase,
    phase_score           = EXCLUDED.phase_score,
    hard_signal_met       = EXCLUDED.hard_signal_met,
    phase_status          = EXCLUDED.phase_status,
    phase_entered_at      = EXCLUDED.phase_entered_at,
    phase_last_changed_at = EXCLUDED.phase_last_changed_at,
    last_calculated_at    = EXCLUDED.last_calculated_at,
    engine_version        = EXCLUDED.engine_version,
    consecutive_low_score = EXCLUDED.consecutive_low_score;  -- [E4.7]

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
  'Phase Engine v1 migration 00022 (E4.7). Regresión añadida: consecutive_low_score >= 6 semanas weekly_job con score < 50 → fase -1 (fases 2→1, 3→2, 4→3). Fase 1 no acumula racha. Avance tiene prioridad sobre regresión. change_reason = regression en project_phase_history. Base: migration 00018.';
