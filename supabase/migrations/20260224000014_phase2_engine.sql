-- =============================================================================
-- MIGRACIÓN 00014 — PHASE ENGINE: Phase 2 (E4.3)
--
-- Implementa las subfunciones de Fase 2 y reemplaza el placeholder
-- "IF v_cur_phase > 1 THEN" de migration 00005 con lógica real.
-- Phase 3 y Phase 4 permanecen como placeholder hasta E4.4 / E4.5.
--
-- Fórmula canónica (ENGINE_SPEC_V1.md §3):
--   phase2_score = O2.1×0.45 + O2.2×0.25 + O2.3×0.30
--
-- SCHEMA CONFIRMADO:
--   obvs.obv_outcome    TEXT CHECK ('success','partial','fail')  [migration 00003]
--   obvs.evidence_type  TEXT CHECK ('payment',...)               [migration 00003]
--   obvs.tipo           obv_type ENUM                            [migration 00001+00003]
--   project_acquisition_channel: is_primary, documented_playbook,
--     estimated_cac, last_validated_at, updated_at               [migration 00012]
--   project_probability.revenue_momentum_input: NUMERIC(5,2)     [migration 00002]
--
-- CORRECCIONES vs ENGINE_SPEC_V1.md (schema no era columna sino inline):
--   verification_multiplier → NO columna; el discriminador real es evidence_type
--   status = 'validated'    → NO aplica en obvs; usar obv_outcome
--   obv_outcome EXISTE (migración 00003)
-- =============================================================================


-- =============================================================================
-- 1. compute_phase2_o21 — Revenue or commitment evidence (peso 0.45)
--
-- Verified payment  = tipo revenue_validation + evidence_type='payment'
--                     + obv_outcome='success' + creado en últimas 90 días
-- Commitment        = tipo revenue_validation + sin evidencia de pago
--                     + obv_outcome IN ('success','partial') (sin ventana temporal)
--
-- Score:
--   verified_payments >= 3  → 100
--   verified_payments >= 2  →  90
--   verified_payments >= 1  →  80
--   commitments       >= 3  →  75   (3 LOI/pre-orders = saludable mínimo)
--   commitments       >= 2  →  50
--   commitments       >= 1  →  30
--   else                    →   0
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase2_o21(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verified_payments INTEGER;
  v_commitments       INTEGER;
BEGIN
  -- Pagos verificados: comprobante de pago + resultado confirmado. Ventana 90 días.
  SELECT COUNT(*) INTO v_verified_payments
  FROM   obvs
  WHERE  project_id    = p_project_id
    AND  tipo::text   IN ('revenue_validation', 'venta')
    AND  evidence_type = 'payment'
    AND  obv_outcome   = 'success'
    AND  created_at   >= NOW() - INTERVAL '90 days';

  -- Compromisos: LOI / pre-orders / acuerdos sin evidencia de pago. Acumulativos.
  SELECT COUNT(*) INTO v_commitments
  FROM   obvs
  WHERE  project_id    = p_project_id
    AND  tipo::text   IN ('revenue_validation', 'venta')
    AND  (evidence_type IS NULL OR evidence_type != 'payment')
    AND  obv_outcome  IN ('success', 'partial');

  RETURN CASE
    WHEN v_verified_payments >= 3 THEN 100
    WHEN v_verified_payments >= 2 THEN  90
    WHEN v_verified_payments >= 1 THEN  80
    WHEN v_commitments       >= 3 THEN  75
    WHEN v_commitments       >= 2 THEN  50
    WHEN v_commitments       >= 1 THEN  30
    ELSE                               0
  END;
END;
$$;

COMMENT ON FUNCTION compute_phase2_o21(UUID) IS
  'O2.1 Phase 2: Revenue or commitment evidence (peso 0.45). Verified payment = evidence_type=payment+obv_outcome=success (90d). Commitment = revenue_validation sin pago + obv_outcome in (success,partial). Score: 3vp→100, 2vp→90, 1vp→80, 3c→75, 2c→50, 1c→30, 0→0.';


-- =============================================================================
-- 2. compute_phase2_o22 — Validated MVP tested (peso 0.25)
--
-- product_sessions = COUNT obvs tipo product_validation/validacion
--                    con obv_outcome IN ('success','partial')
-- pivot_count      = COUNT strategic_model_versions en últimas 4 semanas
--
-- Score:
--   product_sessions >= 3 AND pivot_count >= 1 → 100  (sesiones + iteración activa)
--   product_sessions >= 3                       →  75  (sesiones sin pivot reciente)
--   product_sessions >= 2                       →  55
--   product_sessions >= 1                       →  30
--   else                                        →   0
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase2_o22(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_sessions INTEGER;
  v_pivot_count      INTEGER;
BEGIN
  -- Sesiones de validación de producto con resultado documentado
  SELECT COUNT(*) INTO v_product_sessions
  FROM   obvs
  WHERE  project_id  = p_project_id
    AND  tipo::text IN ('product_validation', 'validacion')
    AND  obv_outcome IN ('success', 'partial');

  -- Pivots estratégicos en las últimas 4 semanas (bucle de aprendizaje activo)
  SELECT COUNT(*) INTO v_pivot_count
  FROM   strategic_model_versions
  WHERE  project_id = p_project_id
    AND  created_at >= NOW() - INTERVAL '28 days';

  RETURN CASE
    WHEN v_product_sessions >= 3 AND v_pivot_count >= 1 THEN 100
    WHEN v_product_sessions >= 3                         THEN  75
    WHEN v_product_sessions >= 2                         THEN  55
    WHEN v_product_sessions >= 1                         THEN  30
    ELSE                                                        0
  END;
END;
$$;

COMMENT ON FUNCTION compute_phase2_o22(UUID) IS
  'O2.2 Phase 2: Validated MVP tested (peso 0.25). product_sessions=obvs product_validation/validacion con obv_outcome in (success,partial). pivot_count=strategic_model_versions últimas 4 semanas. Score: 3+s+pivot→100, 3+s→75, 2s→55, 1s→30, 0→0.';


-- =============================================================================
-- 3. compute_phase2_o23 — Repeatable acquisition channel (peso 0.30)
--
-- Fuente: project_acquisition_channel WHERE is_primary = TRUE
-- Si no hay canal primario → 0
-- Si hay canal primario:
--   base     = 30  (canal declarado)
--   +30 si documented_playbook = TRUE
--   +25 si last_validated_at >= NOW() - INTERVAL '60 days'
--   +15 si estimated_cac IS NOT NULL
--   max = 100
--
-- Multi-primary: usar el de mayor score individual (tiebreak: updated_at DESC)
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase2_o23(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_documented_playbook BOOLEAN;
  v_validated_recent    BOOLEAN;
  v_has_cac             BOOLEAN;
  v_score               INTEGER;
BEGIN
  -- Seleccionar canal primario con mayor score (tiebreak: updated_at DESC)
  SELECT
    documented_playbook,
    last_validated_at >= NOW() - INTERVAL '60 days',
    estimated_cac IS NOT NULL
  INTO
    v_documented_playbook, v_validated_recent, v_has_cac
  FROM   project_acquisition_channel
  WHERE  project_id = p_project_id
    AND  is_primary = TRUE
  ORDER BY
    (CASE WHEN documented_playbook                                   THEN 30 ELSE 0 END
     + CASE WHEN last_validated_at >= NOW() - INTERVAL '60 days'    THEN 25 ELSE 0 END
     + CASE WHEN estimated_cac IS NOT NULL                          THEN 15 ELSE 0 END
    ) DESC,
    updated_at DESC
  LIMIT 1;

  -- Sin canal primario
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Construir score aditivo
  v_score := 30;  -- base: canal primario declarado

  IF COALESCE(v_documented_playbook, FALSE) THEN
    v_score := v_score + 30;
  END IF;

  IF COALESCE(v_validated_recent, FALSE) THEN
    v_score := v_score + 25;
  END IF;

  IF COALESCE(v_has_cac, FALSE) THEN
    v_score := v_score + 15;
  END IF;

  RETURN v_score;
END;
$$;

COMMENT ON FUNCTION compute_phase2_o23(UUID) IS
  'O2.3 Phase 2: Repeatable acquisition channel (peso 0.30). Fuente: project_acquisition_channel (migration 00012). Sin is_primary→0. Base 30 + playbook 30 + validado ≤60d 25 + CAC 15 = max 100. Multi-primary: mayor score, tiebreak updated_at DESC.';


-- =============================================================================
-- 4. compute_phase2_score — Weighted sum Phase 2
--
-- phase2_score = O2.1×0.45 + O2.2×0.25 + O2.3×0.30
-- Fuente canónica: ENGINE_SPEC_V1.md §3 / ENGINE_DESIGN.md §2.2 (adoptada)
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase2_score(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_o21 NUMERIC;
  v_o22 NUMERIC;
  v_o23 NUMERIC;
BEGIN
  v_o21 := compute_phase2_o21(p_project_id);
  v_o22 := compute_phase2_o22(p_project_id);
  v_o23 := compute_phase2_o23(p_project_id);

  RETURN ROUND(
    LEAST(100.0, GREATEST(0.0,
      (v_o21 * 0.45) + (v_o22 * 0.25) + (v_o23 * 0.30)
    )),
    2
  );
END;
$$;

COMMENT ON FUNCTION compute_phase2_score(UUID) IS
  'Phase 2 composite score = O2.1×0.45 + O2.2×0.25 + O2.3×0.30. Fórmula canónica ENGINE_SPEC_V1.md §3.';


-- =============================================================================
-- 5. run_phase_engine — Reemplaza placeholder Phase > 1
--
-- CAMBIOS vs migration 00005:
--   • IF v_cur_phase = 2 THEN → lógica real de Phase 2 (O2.1/O2.2/O2.3)
--   • Hard signal Phase 2→3: ≥1 verified payment (90d) + revenue_momentum > 0
--   • Gate Phase 2→3: score≥75 AND hard_signal AND velocity≥2
--   • IF v_cur_phase > 2 THEN → placeholder para E4.4/E4.5 (Phase 3/4)
--
-- INVARIANTES mantenidos de migration 00005:
--   • UPSERT idempotente en project_phase_state
--   • INSERT en project_phase_history (siempre)
--   • phase_last_changed_at solo se actualiza cuando cambia current_phase
--   • Advisory lock en llamadores (migration 00011) — no duplicar aquí
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

  -- Phase 2 variables (E4.3)
  v_o2_1             NUMERIC;
  v_o2_2             NUMERIC;
  v_o2_3             NUMERIC;
  v_has_payment_obv  BOOLEAN;
  v_rev_momentum     NUMERIC;

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

  -- Fallback defensivo (nunca debería ocurrir post-init-trigger)
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
  -- PHASE 2 — Validación
  -- =======================================================================
  IF v_cur_phase = 2 THEN

    -- Score compuesto
    v_o2_1        := compute_phase2_o21(p_project_id);
    v_o2_2        := compute_phase2_o22(p_project_id);
    v_o2_3        := compute_phase2_o23(p_project_id);
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o2_1 * 0.45) + (v_o2_2 * 0.25) + (v_o2_3 * 0.30)
      )), 2
    );

    -- Hard signal Phase 2 → 3:
    --   1. ≥1 pago verificado en últimas 90 días
    --   2. revenue_momentum > 0 (del último run del Probability Engine)
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

    v_rev_momentum := COALESCE(v_rev_momentum, 30);  -- fallback si no existe fila

    v_hard_signal := (
      v_has_payment_obv = TRUE
      AND v_rev_momentum > 0
    );

    -- Velocity gate (mismo threshold que Phase 1)
    v_velocity := compute_iteration_velocity(p_project_id);

    -- phase_status — day-1 friendly cuando recién entró en Phase 2
    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      WHEN v_o2_1        = 0     THEN 'friction'   -- sin revenue evidence → fricción, no crítico
      ELSE                            'critical'
    END;

    -- Gate de avance Phase 2 → 3
    IF v_phase_score >= 75.0
       AND v_hard_signal = TRUE
       AND v_velocity    >= 2
    THEN
      v_new_phase     := 3;
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
  -- PHASE 3 / 4 — placeholder hasta E4.4 / E4.5
  -- Actualiza timestamps e inserta snapshot de estado actual.
  -- =======================================================================
  IF v_cur_phase > 2 THEN
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
  -- PHASE 1 — Descubrimiento (sin cambios desde migration 00005)
  -- =======================================================================

  -- -----------------------------------------------------------------------
  -- O1.1 — Volumen de entrevistas
  -- -----------------------------------------------------------------------
  SELECT COUNT(*)
  INTO   v_n_interviews
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  tipo::text IN ('customer_discovery', 'exploracion');

  v_o1_1 := LEAST(100.0, (v_n_interviews::NUMERIC / 10.0) * 100.0);

  -- -----------------------------------------------------------------------
  -- O1.2 — Claridad y recurrencia del problema
  -- -----------------------------------------------------------------------
  SELECT COUNT(*)
  INTO   v_n_positive
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  tipo::text IN ('customer_discovery', 'exploracion')
    AND  obv_outcome = 'success';

  v_pct_dolor := CASE
    WHEN v_n_interviews > 0 THEN (v_n_positive::NUMERIC / v_n_interviews) * 100.0
    ELSE 0.0
  END;

  v_o1_2_base := LEAST(100.0, (v_pct_dolor / 30.0) * 100.0);

  v_o1_2 := CASE
    WHEN v_n_interviews < 5 THEN v_o1_2_base * 0.5
    ELSE v_o1_2_base
  END;

  -- -----------------------------------------------------------------------
  -- O1.3 — Foco en segmento definido
  -- -----------------------------------------------------------------------
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

  SELECT COUNT(*)
  INTO v_pivot_count
  FROM strategic_model_versions
  WHERE project_id = p_project_id
    AND created_at >= NOW() - INTERVAL '28 days';

  v_o1_3 := CASE
    WHEN NOT v_strategy_def OR v_pivot_count >= 4  THEN   0.0
    WHEN v_pivot_count <= 1                         THEN 100.0
    WHEN v_pivot_count = 2                          THEN  75.0
    WHEN v_pivot_count = 3                          THEN  50.0
    ELSE 0.0
  END;

  -- -----------------------------------------------------------------------
  -- phase_score Phase 1
  -- -----------------------------------------------------------------------
  v_phase_score := ROUND(
    (v_o1_1 * 0.40) + (v_o1_2 * 0.40) + (v_o1_3 * 0.20),
    2
  );

  -- -----------------------------------------------------------------------
  -- Hard signal Phase 1 → 2
  -- -----------------------------------------------------------------------
  v_hard_signal := (
    v_n_interviews >= 10
    AND v_pct_dolor   >= 30.0
    AND v_strategy_def = TRUE
  );

  -- -----------------------------------------------------------------------
  -- Iteration velocity gate
  -- -----------------------------------------------------------------------
  v_velocity := compute_iteration_velocity(p_project_id);

  -- -----------------------------------------------------------------------
  -- phase_status Phase 1 — day-1 friendly
  -- -----------------------------------------------------------------------
  v_phase_status := CASE
    WHEN v_phase_score >= 75.0  THEN 'healthy'
    WHEN v_phase_score >= 50.0  THEN 'friction'
    WHEN v_n_interviews = 0     THEN 'friction'
    ELSE                             'critical'
  END;

  -- -----------------------------------------------------------------------
  -- Gate de avance Phase 1 → 2
  -- -----------------------------------------------------------------------
  IF v_cur_phase = 1
     AND v_phase_score  >= 75.0
     AND v_hard_signal  = TRUE
     AND v_velocity     >= 2
  THEN
    v_new_phase     := 2;
    v_advanced      := TRUE;
    v_change_reason := 'threshold_met';
    v_phase_entered := NOW();
  END IF;

  -- -----------------------------------------------------------------------
  -- UPSERT project_phase_state
  -- -----------------------------------------------------------------------
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

  -- -----------------------------------------------------------------------
  -- INSERT project_phase_history
  -- -----------------------------------------------------------------------
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

END;
$$;

COMMENT ON FUNCTION run_phase_engine(UUID, TEXT) IS
  'Phase Engine v1: Phase 1 (O1.1×0.40 + O1.2×0.40 + O1.3×0.20) y Phase 2 (O2.1×0.45 + O2.2×0.25 + O2.3×0.30). Phase 3/4: placeholder hasta E4.4/E4.5. Gate: score≥75 AND hard_signal AND velocity≥2. Motor: phase_v1.0.';
