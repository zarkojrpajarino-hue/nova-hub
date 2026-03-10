-- =============================================================================
-- MIGRACIÓN 00009 — VIABILITY ENGINE
--
-- run_viability_engine(project_id) → VOID
--
-- 4 triggers (F1.10):
--   T1 — stagnation:      iteration_velocity=0 (28d window) AND phase_score<75
--   T2 — margin_risk:     ≥2m revenue>0 AND cash_flow<0 AND costes registrados (HIGH confidence)
--   T3 — overload:        growth_real ≥ p50_benchmark AND capacity_health<55
--   T4 — weak_validation: validation_strength<40 AND ≥6 semanas en misma fase
--
-- Filosofía: motor de advertencia estratégica — NO bloquea, NO altera scores.
--   En v1 construye confianza. Las decisiones siguen siendo del founder.
--
-- SCHEMA:
--   viability_events        : estado por (project_id, trigger_type) — UPSERT modelo estado
--   project_viability_state : resumen agregado — UPSERT idempotente
--
-- CRON: semanal lunes 02:00 UTC (después de phase/probability/risk).
--   Run por proyecto solo. No usa triggers de fila (excepto viability_state).
-- =============================================================================

-- =============================================================================
-- run_viability_engine(p_project_id UUID) → VOID
--
-- ALGORITMO:
--   Para cada trigger T1–T4:
--     Si condición ACTIVA → upsert viability_event:
--       INSERT ON CONFLICT DO UPDATE (consecutive_count + 1, last_evaluated_at = NOW())
--       pero si resolved_at IS NOT NULL (trigger estaba resuelto → se reactiva):
--         consecutive_count = 1, resolved_at = NULL (reset)
--     Si condición INACTIVA → resolver viability_event si existe y activo:
--       SET resolved_at = NOW()
--
--   Luego actualizar project_viability_state:
--     - active_trigger_count = COUNT activos
--     - trigger_consecutive_max = MAX(consecutive_count) activos
--     - top_trigger_type = trigger con mayor consecutive_count
--     - t2_cash_flow_active = margin_risk activo con HIGH confidence
--     - viability_status:
--         0 activos                → 'healthy'
--         t2_cash_flow_active      → 'critical' (inmediato por T2)
--         trigger_consecutive_max ≥ 3 → 'critical'
--         trigger_consecutive_max ≥ 2 → 'stagnation'
--         else                    → 'monitoring'
--
-- NOTA T2: Solo se activa si costes Y revenue registrados ≥2 meses (HIGH confidence).
--   Si confidence=LOW → NO se inserta viability_event.
--   El banner de "registra tus costes" es responsabilidad de la UI, no del engine.
--
-- NOTA T3: benchmark lookup via benchmarks.crecimiento_p50 con model_type + cluster.
--   Si no hay benchmark → fallback 5% mensual (según F1.10).
--   growth_real = key_metrics.mrr_growth_rate más reciente.
--   Si no hay key_metrics → T3 no puede evaluarse → marcado INACTIVO.
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

  -- Helper: procesar cada trigger
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
  'F1.10: motor de advertencia estratégica. Evalúa T1(stagnation) T2(margin_risk, HIGH conf) T3(overload) T4(weak_validation). UPSERT viability_events + project_viability_state. No altera scores, no bloquea.';

-- =============================================================================
-- _upsert_viability_trigger — helper interno
-- =============================================================================

CREATE OR REPLACE FUNCTION _upsert_viability_trigger(
  p_project_id   UUID,
  p_trigger_type TEXT,
  p_active       BOOLEAN,
  p_confidence   TEXT DEFAULT 'low',
  p_engine_ver   TEXT DEFAULT 'viability_v1.0'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_resolved TIMESTAMPTZ;
  v_existing_consec   INTEGER;
BEGIN
  IF p_active THEN
    -- Trigger está activo: INSERT o UPDATE con incremento de consecutive_count

    SELECT resolved_at, consecutive_count
    INTO   v_existing_resolved, v_existing_consec
    FROM   viability_events
    WHERE  project_id   = p_project_id
      AND  trigger_type = p_trigger_type;

    IF NOT FOUND THEN
      -- Primera vez → INSERT
      INSERT INTO viability_events (
        project_id,        trigger_type,
        consecutive_count, confidence_level,
        first_triggered_at, last_evaluated_at,
        resolved_at,       engine_version
      ) VALUES (
        p_project_id,      p_trigger_type,
        1,                 p_confidence,
        NOW(),             NOW(),
        NULL,              p_engine_ver
      );

    ELSIF v_existing_resolved IS NOT NULL THEN
      -- Trigger estaba resuelto, se reactiva → reset
      UPDATE viability_events SET
        consecutive_count  = 1,
        confidence_level   = p_confidence,
        first_triggered_at = NOW(),
        last_evaluated_at  = NOW(),
        resolved_at        = NULL,
        decision_event_id  = NULL,  -- limpiar respuesta anterior
        hidden_until       = NULL,
        engine_version     = p_engine_ver
      WHERE project_id   = p_project_id
        AND trigger_type = p_trigger_type;

    ELSE
      -- Trigger ya activo → incrementar (solo si hidden_until no bloquea)
      -- El cron evalúa: hidden_until IS NULL OR hidden_until < NOW()
      -- Solo incrementa si no está en cooldown
      UPDATE viability_events SET
        consecutive_count = consecutive_count + 1,
        confidence_level  = p_confidence,
        last_evaluated_at = NOW(),
        engine_version    = p_engine_ver
      WHERE project_id   = p_project_id
        AND trigger_type = p_trigger_type
        AND (hidden_until IS NULL OR hidden_until < NOW());
      -- Si en cooldown: no incrementa, pero el trigger sigue activo
    END IF;

  ELSE
    -- Trigger inactivo: resolver si estaba activo
    UPDATE viability_events SET
      resolved_at       = NOW(),
      last_evaluated_at = NOW()
    WHERE project_id   = p_project_id
      AND trigger_type = p_trigger_type
      AND resolved_at  IS NULL;
  END IF;
END;
$$;

COMMENT ON FUNCTION _upsert_viability_trigger(UUID, TEXT, BOOLEAN, TEXT, TEXT) IS
  'Helper interno de run_viability_engine. UPSERT de viability_events: activo→incrementa/reset, inactivo→resuelve. No llamar directamente desde app.';

-- =============================================================================
-- pg_cron: backstop semanal
-- Lunes 02:00 UTC — después de phase(00:00), probability(00:30), risk(01:00).
-- La spec F1.10 dice "cron semanal cada lunes".
-- =============================================================================

SELECT cron.schedule(
  'weekly-viability-engine',
  '0 2 * * 1',
  $$
    SELECT run_viability_engine(id)
    FROM   projects
    WHERE  deleted_at IS NULL
  $$
);
