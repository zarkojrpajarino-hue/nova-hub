-- =============================================================================
-- MIGRACIÓN 00011 — ADVISORY LOCKS (RACE-CONDITION GUARD)
--
-- Problema: cron semanal + triggers de evento pueden disparar el mismo runner
-- concurrentemente para el mismo proyecto, produciendo:
--   a) Lecturas inconsistentes si ambos leen antes de que cualquiera escriba.
--   b) Dos filas de history para el mismo cálculo (carrera de escritura).
--
-- Solución: pg_advisory_xact_lock al inicio de cada runner.
--   - Serializa ejecuciones del MISMO proyecto (lock distinto por project_id).
--   - Proyectos DISTINTOS se ejecutan en paralelo sin interferencia.
--   - El lock se libera automáticamente al finalizar la transacción.
--   - Si un runner ya tiene el lock, el segundo espera hasta que el primero
--     termine (no falla — es un lock bloqueante, no TRY).
--
-- Por qué NO se añaden UNIQUE constraints en las tablas de history:
--   - project_probability_history es fuente de compute_execution_drop (R1.2)
--     y compute_validation_weakness (R1.3), que leen AVG de ventanas temporales.
--   - Un UNIQUE(project_id, engine_version, date_trunc('week', calculated_at))
--     colapsaría todos los eventos intra-semana a una sola fila, destruyendo
--     la granularidad de series temporales que esos motores necesitan.
--   - El advisory lock es suficiente: previene ejecuciones concurrentes.
--     Ejecuciones secuenciales (cron tras trigger) producen filas con datos
--     iguales pero timestamps distintos — aceptable y útil para auditoría.
--
-- Funciones modificadas (solo se añade la primera línea en BEGIN):
--   1. run_coverage_engine
--   2. run_phase_engine
--   3. run_probability_engine
--   4. run_risk_engine
--   5. run_viability_engine
-- =============================================================================

-- =============================================================================
-- 1. run_coverage_engine
-- =============================================================================

CREATE OR REPLACE FUNCTION run_coverage_engine(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver            TEXT;
  v_ft             TEXT;
  v_owner_score    SMALLINT;
  v_tasks_score    SMALLINT;
  v_block_score    SMALLINT;
  v_process_score  SMALLINT;
  v_total          SMALLINT;
  v_level          TEXT;
  v_owner_uid      UUID;
  v_tasks_done_4w  BIGINT;
  v_has_crit_block BOOLEAN;
  v_has_process    BOOLEAN;
BEGIN
  -- Serializar ejecuciones concurrentes por proyecto.
  PERFORM pg_advisory_xact_lock(hashtext(p_project_id::text)::bigint);

  -- Resolver versión activa del motor (execution cubre coverage en v1)
  SELECT id INTO v_ver
  FROM engine_versions
  WHERE motor = 'execution' AND is_active = TRUE
  LIMIT 1;

  IF v_ver IS NULL THEN
    v_ver := 'execution_v1.0';  -- fallback defensivo
  END IF;

  -- -----------------------------------------------------------------------
  -- Loop sobre las 3 funciones críticas
  -- -----------------------------------------------------------------------
  FOREACH v_ft IN ARRAY ARRAY['demand', 'delivery', 'cash'] LOOP

    -- ------------------------------------------------------------------
    -- Score 1: owner_assigned_score
    -- ------------------------------------------------------------------
    SELECT owner_user_id
    INTO   v_owner_uid
    FROM   project_functions
    WHERE  project_id   = p_project_id
      AND  function_type = v_ft;

    v_owner_score := CASE WHEN v_owner_uid IS NOT NULL THEN 30 ELSE 0 END;

    -- ------------------------------------------------------------------
    -- Score 2: tasks_execution_score
    -- Enum task_status: 'todo' | 'doing' | 'done' | 'blocked'
    -- Ventana: 28 días = 4 semanas rolling
    -- ------------------------------------------------------------------
    SELECT COUNT(*)
    INTO   v_tasks_done_4w
    FROM   tasks
    WHERE  project_id    = p_project_id
      AND  function_type = v_ft
      AND  status        = 'done'
      AND  completed_at >= NOW() - INTERVAL '28 days';

    v_tasks_score := CASE WHEN v_tasks_done_4w >= 3 THEN 30 ELSE 0 END;

    -- ------------------------------------------------------------------
    -- Score 3: block_health_score
    -- Crítico = impact_weight >= 70 AND resolved_at IS NULL
    -- Función-específico = function_id → project_functions.function_type = ft
    --                    OR task_id   → tasks.function_type = ft
    -- ------------------------------------------------------------------
    SELECT EXISTS (
      SELECT 1
      FROM   strategic_blocks sb
      WHERE  sb.project_id    = p_project_id
        AND  sb.resolved_at   IS NULL
        AND  sb.impact_weight >= 70
        AND  (
          -- bloque apunta a función vía project_functions
          (sb.function_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM project_functions pf
            WHERE  pf.id           = sb.function_id
              AND  pf.function_type = v_ft
          ))
          OR
          -- bloque apunta a tarea que pertenece a esta función
          (sb.task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM tasks t
            WHERE  t.id           = sb.task_id
              AND  t.function_type = v_ft
          ))
        )
    ) INTO v_has_crit_block;

    v_block_score := CASE WHEN NOT v_has_crit_block THEN 20 ELSE 0 END;

    -- ------------------------------------------------------------------
    -- Score 4: process_score
    -- documented_process_exists = checklist_items_count >= 5
    --                           AND last_used_at IS NOT NULL
    --                           AND last_used_at >= NOW() - 60 días (v1 global)
    -- ------------------------------------------------------------------
    SELECT EXISTS (
      SELECT 1
      FROM   process_artifacts
      WHERE  project_id             = p_project_id
        AND  function_type          = v_ft
        AND  checklist_items_count >= 5
        AND  last_used_at           IS NOT NULL
        AND  last_used_at          >= NOW() - INTERVAL '60 days'
    ) INTO v_has_process;

    v_process_score := CASE WHEN v_has_process THEN 20 ELSE 0 END;

    -- ------------------------------------------------------------------
    -- Coverage total + clasificación
    -- ≥70 → strong | 40–69 → basic | <40 → none
    -- ------------------------------------------------------------------
    v_total := v_owner_score + v_tasks_score + v_block_score + v_process_score;

    v_level := CASE
      WHEN v_total >= 70 THEN 'strong'
      WHEN v_total >= 40 THEN 'basic'
      ELSE                    'none'
    END;

    -- ------------------------------------------------------------------
    -- UPSERT idempotente
    -- ------------------------------------------------------------------
    INSERT INTO project_function_coverage (
      project_id,          function_type,
      owner_assigned_score, tasks_execution_score,
      block_health_score,   process_score,
      coverage_score,       coverage_level,
      last_calculated_at,   engine_version
    )
    VALUES (
      p_project_id,  v_ft,
      v_owner_score, v_tasks_score,
      v_block_score, v_process_score,
      v_total,       v_level,
      NOW(),         v_ver
    )
    ON CONFLICT (project_id, function_type) DO UPDATE SET
      owner_assigned_score  = EXCLUDED.owner_assigned_score,
      tasks_execution_score = EXCLUDED.tasks_execution_score,
      block_health_score    = EXCLUDED.block_health_score,
      process_score         = EXCLUDED.process_score,
      coverage_score        = EXCLUDED.coverage_score,
      coverage_level        = EXCLUDED.coverage_level,
      last_calculated_at    = EXCLUDED.last_calculated_at,
      engine_version        = EXCLUDED.engine_version;

  END LOOP;
END;
$$;

COMMENT ON FUNCTION run_coverage_engine(UUID) IS
  'Recalcula project_function_coverage para las 3 funciones (demand/delivery/cash). UPSERT idempotente. Llamado por triggers de evento y por pg_cron semanal. Motor: execution_v1.0. Lock: pg_advisory_xact_lock por project_id.';

-- =============================================================================
-- 2. run_phase_engine
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
  -- Serializar ejecuciones concurrentes por proyecto.
  PERFORM pg_advisory_xact_lock(hashtext(p_project_id::text)::bigint);

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
  'Recalcula phase_score (O1.1×0.40 + O1.2×0.40 + O1.3×0.20) para Phase 1. Para phases > 1: timestamp-only hasta que se implementen O2.x–O4.x. Gate de avance: score>=75 AND hard_signal AND velocity>=2. Motor: phase_v1.0. Lock: pg_advisory_xact_lock por project_id.';

-- =============================================================================
-- 3. run_probability_engine
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
  -- Serializar ejecuciones concurrentes por proyecto.
  PERFORM pg_advisory_xact_lock(hashtext(p_project_id::text)::bigint);

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
  'Motor de probabilidad. 5 inputs: fase_score(35%) + execution_rate(20%) + validation_strength(15%) + revenue_momentum(15%) + capacity_health(15%). Status: inactive(<20 completeness), low_confidence(20-49), active(≥50). UPSERT + history siempre. Lock: pg_advisory_xact_lock por project_id.';

-- =============================================================================
-- 4. run_risk_engine
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
  -- Serializar ejecuciones concurrentes por proyecto.
  PERFORM pg_advisory_xact_lock(hashtext(p_project_id::text)::bigint);

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
  'Motor de riesgo. 5 inputs: runway(25%) + rev_concentration(20%) + exec_drop(20%) + val_weakness(20%) + bottleneck(15%). Redistribución pro-rata si NULL. Requiere ≥3 inputs; si <3→insufficient_data. UPSERT + history. Lock: pg_advisory_xact_lock por project_id.';

-- =============================================================================
-- 5. run_viability_engine
-- =============================================================================

CREATE OR REPLACE FUNCTION run_viability_engine(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver TEXT;

  -- Inputs compartidos
  v_velocity          INTEGER;
  v_phase_score       NUMERIC;
  v_phase_entered_at  TIMESTAMPTZ;
  v_val_strength      NUMERIC;
  v_cap_health        NUMERIC;

  -- T2 — margin_risk
  v_months_neg_cashflow  BIGINT;
  v_t2_confidence        TEXT;

  -- T3 — overload
  v_growth_real       NUMERIC;
  v_benchmark_p50     NUMERIC;
  v_model_type        TEXT;
  v_cluster           TEXT;

  -- Condiciones de trigger (TRUE = activo)
  v_t1 BOOLEAN := FALSE;
  v_t2 BOOLEAN := FALSE;
  v_t2_conf TEXT := 'low';  -- confianza específica para T2
  v_t3 BOOLEAN := FALSE;
  v_t4 BOOLEAN := FALSE;

  -- Para project_viability_state
  v_active_count      INTEGER;
  v_consec_max        INTEGER;
  v_top_trigger       TEXT;
  v_t2_active         BOOLEAN;
  v_viab_status       TEXT;
BEGIN
  -- Serializar ejecuciones concurrentes por proyecto.
  PERFORM pg_advisory_xact_lock(hashtext(p_project_id::text)::bigint);

  -- -----------------------------------------------------------------------
  -- Versión activa del motor
  -- -----------------------------------------------------------------------
  SELECT id INTO v_ver
  FROM   engine_versions
  WHERE  motor     = 'viability'
    AND  is_active = TRUE
  LIMIT  1;

  IF v_ver IS NULL THEN
    v_ver := 'viability_v1.0';
  END IF;

  -- -----------------------------------------------------------------------
  -- Inputs compartidos (se computan una vez)
  -- -----------------------------------------------------------------------

  -- velocity (28d rolling)
  v_velocity := compute_iteration_velocity(p_project_id);

  -- phase_score y phase_entered_at
  SELECT COALESCE(phase_score, 0), COALESCE(phase_entered_at, NOW())
  INTO   v_phase_score, v_phase_entered_at
  FROM   project_phase_state
  WHERE  project_id = p_project_id;
  v_phase_score := COALESCE(v_phase_score, 0);

  -- validation_strength (preferir snapshot en project_probability para coherencia)
  SELECT COALESCE(validation_strength_input, compute_validation_strength(p_project_id))
  INTO   v_val_strength
  FROM   project_probability
  WHERE  project_id = p_project_id;
  IF v_val_strength IS NULL THEN
    v_val_strength := compute_validation_strength(p_project_id);
  END IF;

  -- capacity_health
  v_cap_health := compute_capacity_health(p_project_id);

  -- -----------------------------------------------------------------------
  -- T1 — Stagnation (estancamiento prolongado)
  -- Condición: iteration_velocity=0 (28d rolling = 4 semanas sin outcomes)
  --            AND phase_score < 75
  -- -----------------------------------------------------------------------
  v_t1 := (v_velocity = 0 AND v_phase_score < 75);

  -- -----------------------------------------------------------------------
  -- T2 — Margin risk (ingresos sin margen)
  -- Condición: ≥2 meses en últimos 3 meses con:
  --   revenue > 0 AND (costes totales > 0) AND (revenue - costes < 0)
  -- Confidence = HIGH si se cumple la condición (datos reales registrados)
  -- Solo activa viability_event con HIGH confidence.
  -- -----------------------------------------------------------------------
  SELECT COUNT(*) INTO v_months_neg_cashflow
  FROM   financial_projections
  WHERE  project_id = p_project_id
    AND  MAKE_DATE(year, month, 1) >= (NOW() - INTERVAL '90 days')::DATE
    AND  COALESCE(revenue, 0) > 0
    AND  (COALESCE(cogs, 0)
        + COALESCE(payroll, 0)
        + COALESCE(marketing_spend, 0)
        + COALESCE(infrastructure, 0)
        + COALESCE(other_costs, 0)) > 0
    AND  COALESCE(revenue, 0)
       - (COALESCE(cogs, 0)
        + COALESCE(payroll, 0)
        + COALESCE(marketing_spend, 0)
        + COALESCE(infrastructure, 0)
        + COALESCE(other_costs, 0)) < 0;

  IF v_months_neg_cashflow >= 2 THEN
    v_t2      := TRUE;
    v_t2_conf := 'high';
  END IF;
  -- Si v_months_neg_cashflow = 1 → LOW confidence → v_t2 = FALSE, sin viability_event

  -- -----------------------------------------------------------------------
  -- T3 — Overload (crecimiento con sobrecarga)
  -- Condición: growth_real ≥ crecimiento_p50_benchmark AND capacity_health < 55
  -- Benchmark: benchmarks.crecimiento_p50 por model_type + cluster.
  -- Fallback: 5% mensual si no hay benchmark.
  -- -----------------------------------------------------------------------

  -- growth_real: mrr_growth_rate más reciente de key_metrics
  SELECT mrr_growth_rate INTO v_growth_real
  FROM   key_metrics
  WHERE  project_id = p_project_id
    AND  mrr_growth_rate IS NOT NULL
  ORDER  BY date DESC
  LIMIT  1;

  IF v_growth_real IS NOT NULL THEN
    -- Obtener model_type y cluster para benchmark lookup
    SELECT COALESCE(pep.model_type, 'unknown') INTO v_model_type
    FROM   project_economic_profile pep
    WHERE  pep.project_id = p_project_id;
    v_model_type := COALESCE(v_model_type, 'unknown');

    SELECT COALESCE(p.cluster, 'Other') INTO v_cluster
    FROM   projects p
    WHERE  p.id = p_project_id;
    v_cluster := COALESCE(v_cluster, 'Other');

    -- Benchmark lookup: más específico disponible por model_type + cluster
    SELECT p50 INTO v_benchmark_p50
    FROM   benchmarks
    WHERE  model_type    = v_model_type
      AND  region_cluster = v_cluster
      AND  metric_name   = 'crecimiento_p50'
      AND  source_type   = 'curated'
      AND  p50           IS NOT NULL
    ORDER  BY confidence_score DESC
    LIMIT  1;

    -- Si no hay benchmark por model_type+cluster, buscar solo por model_type
    IF v_benchmark_p50 IS NULL THEN
      SELECT p50 INTO v_benchmark_p50
      FROM   benchmarks
      WHERE  model_type  = v_model_type
        AND  metric_name = 'crecimiento_p50'
        AND  source_type = 'curated'
        AND  p50         IS NOT NULL
      ORDER  BY confidence_score DESC
      LIMIT  1;
    END IF;

    -- Fallback: 5% mensual (según F1.10 spec)
    IF v_benchmark_p50 IS NULL OR v_benchmark_p50 <= 0 THEN
      v_benchmark_p50 := 5.0;
    END IF;

    -- T3 activo si growth ≥ benchmark AND capacity sobrecargada
    v_t3 := (v_growth_real >= v_benchmark_p50 AND v_cap_health < 55);
  END IF;
  -- Si v_growth_real IS NULL → sin datos de key_metrics → T3 no aplica (FALSE)

  -- -----------------------------------------------------------------------
  -- T4 — Weak validation (validación débil persistente)
  -- Condición: validation_strength < 40 AND ≥6 semanas en misma fase (42 días)
  -- -----------------------------------------------------------------------
  v_t4 := (
    v_val_strength < 40
    AND v_phase_entered_at <= NOW() - INTERVAL '42 days'
  );

  -- -----------------------------------------------------------------------
  -- UPSERT viability_events para cada trigger
  -- -----------------------------------------------------------------------

  -- T1 — stagnation
  PERFORM _upsert_viability_trigger(p_project_id, 'stagnation', v_t1, 'low', v_ver);
  -- T2 — margin_risk (solo HIGH confidence)
  PERFORM _upsert_viability_trigger(p_project_id, 'margin_risk', v_t2, v_t2_conf, v_ver);
  -- T3 — overload
  PERFORM _upsert_viability_trigger(p_project_id, 'overload', v_t3, 'low', v_ver);
  -- T4 — weak_validation
  PERFORM _upsert_viability_trigger(p_project_id, 'weak_validation', v_t4, 'low', v_ver);

  -- -----------------------------------------------------------------------
  -- Agregar estado en project_viability_state
  -- -----------------------------------------------------------------------
  SELECT
    COUNT(*)                                        FILTER (WHERE resolved_at IS NULL),
    COALESCE(MAX(consecutive_count)                  FILTER (WHERE resolved_at IS NULL), 0),
    (SELECT trigger_type FROM viability_events sub
     WHERE  sub.project_id = p_project_id
       AND  sub.resolved_at IS NULL
     ORDER  BY consecutive_count DESC LIMIT 1),
    COALESCE(bool_or(
      trigger_type = 'margin_risk'
      AND resolved_at IS NULL
      AND confidence_level = 'high'
    ), FALSE)
  INTO
    v_active_count,
    v_consec_max,
    v_top_trigger,
    v_t2_active
  FROM viability_events
  WHERE project_id = p_project_id;

  -- Calcular viability_status
  v_viab_status := CASE
    WHEN v_active_count = 0       THEN 'healthy'
    WHEN v_t2_active              THEN 'critical'
    WHEN v_consec_max >= 3        THEN 'critical'
    WHEN v_consec_max >= 2        THEN 'stagnation'
    ELSE                               'monitoring'
  END;

  -- UPSERT project_viability_state
  INSERT INTO project_viability_state (
    project_id,
    viability_status,           active_trigger_count,
    trigger_consecutive_max,    top_trigger_consecutive,
    top_trigger_type,           t2_cash_flow_active,
    last_evaluated_at,          engine_version
  )
  VALUES (
    p_project_id,
    v_viab_status,              v_active_count,
    v_consec_max,               v_consec_max,
    v_top_trigger,              v_t2_active,
    NOW(),                      v_ver
  )
  ON CONFLICT (project_id) DO UPDATE SET
    viability_status        = EXCLUDED.viability_status,
    active_trigger_count    = EXCLUDED.active_trigger_count,
    trigger_consecutive_max = EXCLUDED.trigger_consecutive_max,
    top_trigger_consecutive = EXCLUDED.top_trigger_consecutive,
    top_trigger_type        = EXCLUDED.top_trigger_type,
    t2_cash_flow_active     = EXCLUDED.t2_cash_flow_active,
    last_evaluated_at       = EXCLUDED.last_evaluated_at,
    engine_version          = EXCLUDED.engine_version;
END;
$$;

COMMENT ON FUNCTION run_viability_engine(UUID) IS
  'F1.10: motor de advertencia estratégica. Evalúa T1(stagnation) T2(margin_risk, HIGH conf) T3(overload) T4(weak_validation). UPSERT viability_events + project_viability_state. No altera scores, no bloquea. Lock: pg_advisory_xact_lock por project_id.';
