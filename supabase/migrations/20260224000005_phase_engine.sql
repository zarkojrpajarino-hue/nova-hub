-- =============================================================================
-- MIGRACIÓN 00005 — PHASE ENGINE (Phase 1)
--
-- run_phase_engine: calcula phase_score, hard_signal_met, phase_status.
-- En v1 solo Phase 1 tiene fórmula implementada (O1.1/O1.2/O1.3).
-- Para phases > 1: actualiza timestamps sin recalcular (placeholder hasta O2.x).
--
-- VELOCITY GATE: iteration_velocity >= 2 para avanzar de fase.
-- (NOTA: el plan maestro original decía > 0; aquí se aplica >= 2 según spec v1 actual.
-- Cambiar la constante en la sección "Gate Phase 1 → 2" si se revisa.)
--
-- TRIGGER_SOURCE → valores válidos en project_phase_history:
--   'weekly_job'  → pg_cron semanal
--   'acceleration' → trigger de evento (OBV, strategy, coverage)
--   'regression'  → (reservado para detección futura de caída brusca)
-- =============================================================================

-- =============================================================================
-- run_phase_engine(p_project_id, p_trigger_source)
--
-- INPUTS para Phase 1 (todos vienen del schema sin suposiciones):
--
-- O1.1 — Volumen de entrevistas  (peso 0.40)
--   n_entrevistas = COUNT(obvs WHERE tipo IN ('customer_discovery','exploracion'))
--   score         = MIN(100, (n_entrevistas / 10) × 100)
--
-- O1.2 — Claridad y recurrencia del problema  (peso 0.40)
--   n_positivas   = COUNT(obvs tipo_entrevista AND obv_outcome = 'success')
--   pct_dolor     = (n_positivas / n_entrevistas) × 100  (0 si sin entrevistas)
--   base          = MIN(100, (pct_dolor / 30) × 100)
--   penalty       = IF n_entrevistas < 5 THEN base × 0.5 ELSE base
--
-- O1.3 — Foco en segmento definido  (peso 0.20)
--   strategy_def  = segment_text ≥ 10 chars AND problem_text ≥ 10 chars
--                   AND value_prop_text ≥ 10 chars  (regla data_completeness D5)
--   pivot_count   = COUNT(strategic_model_versions en últimas 4 semanas)
--   score (proxy v1 sin campo de precisión de segmento):
--     NOT strategy_def OR pivot_count >= 4 → 0
--     pivot_count <= 1                     → 100
--     pivot_count = 2                      → 75
--     pivot_count = 3                      → 50
--
-- phase1_score = O1.1×0.40 + O1.2×0.40 + O1.3×0.20
--
-- Hard signal Phase 1 → 2 (las 3 simultáneas):
--   1. n_entrevistas >= 10
--   2. pct_dolor >= 30
--   3. strategy_def = TRUE  (segment + problem definidos)
--
-- Gate de avance:
--   phase_score >= 75 AND hard_signal_met AND iteration_velocity >= 2
--
-- phase_status (day-1 friendly):
--   score >= 75           → 'healthy'
--   score >= 50           → 'friction'
--   n_entrevistas = 0     → 'friction'   ← sin datos, no critico
--   score < 50            → 'critical'
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

  -- O1.1
  v_n_interviews     INTEGER;
  v_o1_1             NUMERIC;

  -- O1.2
  v_n_positive       INTEGER;
  v_pct_dolor        NUMERIC;
  v_o1_2_base        NUMERIC;
  v_o1_2             NUMERIC;

  -- O1.3
  v_strategy_def     BOOLEAN;
  v_pivot_count      INTEGER;
  v_o1_3             NUMERIC;

  -- Resultados
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
  -- Phase > 1: placeholder hasta que se implementen O2.x/O3.x/O4.x
  -- Actualiza timestamps, inserta snapshot de estado actual, y retorna.
  -- -----------------------------------------------------------------------
  IF v_cur_phase > 1 THEN
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

  -- -----------------------------------------------------------------------
  -- O1.1 — Volumen de entrevistas
  -- Entrevistas = OBVs tipo customer_discovery o exploracion (legacy).
  -- Sin ventana temporal: entrevistas son acumulativas (validación no caduca).
  -- -----------------------------------------------------------------------
  SELECT COUNT(*)
  INTO   v_n_interviews
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  tipo::text IN ('customer_discovery', 'exploracion');

  v_o1_1 := LEAST(100.0, (v_n_interviews::NUMERIC / 10.0) * 100.0);

  -- -----------------------------------------------------------------------
  -- O1.2 — Claridad y recurrencia del problema
  -- pct_dolor = % de entrevistas con obv_outcome = 'success'
  -- Penalty: si n_entrevistas < 5, base × 0.5 (muestra estadísticamente pequeña)
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
  -- strategy_def: los 3 campos ≥ 10 chars (criterio data_completeness D5)
  -- pivot_count:  registros en strategic_model_versions en últimas 4 semanas
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

  -- Score proxy v1 (sin campo de precisión de segmento en schema)
  v_o1_3 := CASE
    WHEN NOT v_strategy_def OR v_pivot_count >= 4  THEN   0.0
    WHEN v_pivot_count <= 1                         THEN 100.0
    WHEN v_pivot_count = 2                          THEN  75.0
    WHEN v_pivot_count = 3                          THEN  50.0
    ELSE 0.0
  END;

  -- -----------------------------------------------------------------------
  -- phase_score = O1.1×0.40 + O1.2×0.40 + O1.3×0.20
  -- -----------------------------------------------------------------------
  v_phase_score := ROUND(
    (v_o1_1 * 0.40) + (v_o1_2 * 0.40) + (v_o1_3 * 0.20),
    2
  );

  -- -----------------------------------------------------------------------
  -- Hard signal Phase 1 → 2
  -- Las 3 condiciones deben cumplirse simultáneamente.
  -- -----------------------------------------------------------------------
  v_hard_signal := (
    v_n_interviews >= 10
    AND v_pct_dolor   >= 30.0
    AND v_strategy_def = TRUE
  );

  -- -----------------------------------------------------------------------
  -- Iteration velocity gate (compute_iteration_velocity: rolling 28d)
  -- -----------------------------------------------------------------------
  v_velocity := compute_iteration_velocity(p_project_id);

  -- -----------------------------------------------------------------------
  -- phase_status — day-1 friendly (sin datos → friction, no critical)
  -- -----------------------------------------------------------------------
  v_phase_status := CASE
    WHEN v_phase_score >= 75.0  THEN 'healthy'
    WHEN v_phase_score >= 50.0  THEN 'friction'
    WHEN v_n_interviews = 0     THEN 'friction'   -- sin datos no es crítico
    ELSE                             'critical'
  END;

  -- -----------------------------------------------------------------------
  -- Gate de avance de fase
  -- Gate Phase 1 → 2: score >= 75 AND hard_signal AND velocity >= 2
  -- NOTA: plan maestro original especificaba velocity > 0.
  -- Versión actual aplica velocity >= 2 (spec v1 más conservadora).
  -- -----------------------------------------------------------------------
  v_advanced      := FALSE;
  v_change_reason := NULL;
  v_new_phase     := v_cur_phase;

  IF v_cur_phase = 1
     AND v_phase_score  >= 75.0
     AND v_hard_signal  = TRUE
     AND v_velocity     >= 2
  THEN
    v_new_phase     := 2;
    v_advanced      := TRUE;
    v_change_reason := 'threshold_met';
    v_phase_entered := NOW();  -- reset: entró en fase 2 ahora
  END IF;

  -- -----------------------------------------------------------------------
  -- UPSERT project_phase_state (idempotente)
  -- phase_last_changed_at solo se actualiza cuando cambia current_phase.
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
  -- Siempre: weekly backstop y en cada trigger de evento.
  -- change_reason: NULL = sin cambio de fase | 'threshold_met' = avanzó.
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
  'Recalcula phase_score (O1.1×0.40 + O1.2×0.40 + O1.3×0.20) para Phase 1. Para phases > 1: timestamp-only hasta que se implementen O2.x–O4.x. Gate de avance: score>=75 AND hard_signal AND velocity>=2. Motor: phase_v1.0.';

-- =============================================================================
-- TRIGGER 1 — obvs
-- Dispara run_phase_engine cuando:
--   a) Se inserta un OBV nuevo
--   b) obv_outcome cambia (puede afectar O1.2: n_positivas/pct_dolor)
--   c) tipo cambia (puede afectar qué OBVs cuentan como entrevistas O1.1)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_obvs_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Solo dispara si es entrevista (afecta O1.1/O1.2)
    IF NEW.tipo::text IN ('customer_discovery', 'exploracion') THEN
      PERFORM run_phase_engine(NEW.project_id, 'acceleration');
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.obv_outcome IS DISTINCT FROM NEW.obv_outcome
    OR OLD.tipo        IS DISTINCT FROM NEW.tipo
    THEN
      PERFORM run_phase_engine(NEW.project_id, 'acceleration');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_obvs_phase
  AFTER INSERT OR UPDATE OF obv_outcome, tipo
  ON obvs
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_obvs_phase();

-- =============================================================================
-- TRIGGER 2 — project_strategy_current
-- Dispara cuando cambia segment_text, problem_text o value_prop_text.
-- Afecta O1.3 (strategy_def) y el hard_signal check.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_strategy_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_phase_engine(NEW.project_id, 'acceleration');

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.segment_text    IS DISTINCT FROM NEW.segment_text
    OR OLD.problem_text    IS DISTINCT FROM NEW.problem_text
    OR OLD.value_prop_text IS DISTINCT FROM NEW.value_prop_text
    THEN
      PERFORM run_phase_engine(NEW.project_id, 'acceleration');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_strategy_phase
  AFTER INSERT OR UPDATE OF segment_text, problem_text, value_prop_text
  ON project_strategy_current
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_strategy_phase();

-- =============================================================================
-- TRIGGER 3 — strategic_model_versions
-- Dispara en cada INSERT (append-only).
-- Afecta O1.3: pivot_count en últimas 4 semanas.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_pivots_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM run_phase_engine(NEW.project_id, 'acceleration');
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_pivots_phase
  AFTER INSERT
  ON strategic_model_versions
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_pivots_phase();

-- =============================================================================
-- TRIGGER 4 — project_function_coverage
-- Dispara cuando coverage_level o coverage_score cambia.
-- No afecta Phase 1 directamente (no es input de O1.x).
-- Incluido para preparar Phase 2+ donde coverage entra en la fórmula
-- y para el weekly backstop de history.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_coverage_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.coverage_score IS DISTINCT FROM NEW.coverage_score
    OR OLD.coverage_level IS DISTINCT FROM NEW.coverage_level
    THEN
      PERFORM run_phase_engine(NEW.project_id, 'acceleration');
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_coverage_phase
  AFTER UPDATE OF coverage_score, coverage_level
  ON project_function_coverage
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_coverage_phase();

-- =============================================================================
-- pg_cron: backstop semanal Phase Engine
-- Domingo 00:00 UTC — recalcula phase de todos los proyectos activos.
-- trigger_source = 'weekly_job' (por defecto)
-- =============================================================================

SELECT cron.schedule(
  'weekly-phase-engine',
  '0 0 * * 0',
  $$
    SELECT run_phase_engine(id)
    FROM   projects
    WHERE  deleted_at IS NULL
  $$
);
