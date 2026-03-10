-- =============================================================================
-- MIGRACIÓN 00018 — E4.5: Phase 4 Engine — Escala
--
-- Implementa el motor de Fase 4 completo.
-- Reemplaza el placeholder "Phase>3" de migration 00017.
--
-- Funciones nuevas:
--   compute_phase4_o41(UUID)   — Crecimiento sostenido (peso 0.40)
--   compute_phase4_o42(UUID)   — Execution & margin health (peso 0.35)
--   compute_phase4_o43(UUID)   — Independencia del founder (peso 0.25)
--
-- Función reemplazada:
--   run_phase_engine(UUID, TEXT) — bloque Phase 4 real en lugar del placeholder
--
-- Fórmula (FASE_1 F1.7, canónica):
--   phase4_score = (O4.1 × 0.40) + (O4.2 × 0.35) + (O4.3 × 0.25)
--
-- Decisiones de diseño (cerradas 2026-03-09):
--
--   O4.1 — Crecimiento sostenido:
--     MAX(0, MIN(100, (avg_growth_4m / 0.15) × 100))
--     Fuente: key_metrics.mrr (KeyMetricsEditor desde sprint anterior).
--     "Revenue tasks" (ENGINE_DESIGN.md) sobreescrito por FASE_1 F1.7.
--
--   O4.2 — Execution & margin health:
--     capacity_health×0.40 + execution_rate×0.30 + margin_stability×0.30
--     margin_stability: varianza del margen mensual desde obvs.margen.
--     Si < 2 meses de datos: neutral (50). No penaliza proyectos con datos escasos.
--
--   O4.3 — Independencia del founder (v1 sin automation_score):
--     ≥3 funciones delegadas (owner_user_id != founder) → 100
--     ≥2 funciones delegadas                            →  70
--     < 2                                               →  30
--     Fuente: project_functions.owner_user_id vs projects.user_id.
--     DEUDA v2: automation_score pathway (sistema_automatizado_real×40 +
--       proceso_con_checklist_activo×35 + metricas_auto_generadas×25) eliminado
--       porque automation_score NO existe en schema ni tiene UI de entrada.
--       Misma decisión que financial_projections en migration 00017.
--       Reincorporar en v2 cuando exista tabla + UI + compute engine.
--
--   Hard signal Phase 4 (informacional — Fase 4 es terminal en v1):
--     1. O4.1 >= 33    → avg_growth_4m >= 5% (crecimiento real positivo)
--     2. O4.2 >= 50    → ejecución+margen no en rango crítico
--     3. risk_level NOT IN ('high', 'critical')
--     Fase 4 no avanza a Fase 5 en v1. hard_signal_met indica si el proyecto
--     opera a escala saludable.
--
-- Auditoría de conectividad pre-implementación:
--   key_metrics.mrr           ✓  (KeyMetricsEditor escribe)
--   project_functions.owner_user_id  ✓  (migration 00002)
--   obvs.margen               ✓  (migration 00001, auto_calcular_costes_y_margen trigger)
--   compute_capacity_health() ✓  (migration 00003)
--   compute_execution_rate()  ✓  (migration 00006)
--   project_risk_score.risk_level  ✓  (risk engine, migration 00008)
--   automation_score          ✗  ELIMINADO (no existe en schema)
-- =============================================================================


-- =============================================================================
-- 1. compute_phase4_o41 — Crecimiento sostenido (peso 0.40)
--
-- avg_growth_4m: promedio de las 4 tasas de crecimiento MoM más recientes.
-- Necesita 5 meses de MRR para calcular 4 tasas. Con menos de 2 meses → 0.
-- 15% mensual sostenido → 100. Negativo → 0 (GREATEST clip). Sin cap superior.
--
-- Patrón idéntico a count_stable_revenue_months (migration 00016):
--   ORDER BY month_dt DESC + LIMIT para tomar los N más recientes,
--   ARRAY_AGG ORDER BY ASC para ordenar cronológicamente para cálculo.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase4_o41(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr_arr    NUMERIC[];
  v_n          INTEGER;
  v_sum_growth NUMERIC := 0;
  v_count      INTEGER := 0;
  v_avg_growth NUMERIC;
  i            INTEGER;
BEGIN
  -- Recoge el MRR mensual de los últimos 5 meses.
  -- 5 meses de MRR → 4 tasas de crecimiento MoM.
  -- ORDER BY month_dt DESC + LIMIT 5: garantiza tomar los más recientes.
  -- ARRAY_AGG ORDER BY month_dt ASC: array cronológico para calcular crecimientos.
  SELECT ARRAY_AGG(monthly_mrr ORDER BY month_dt ASC)
  INTO   v_mrr_arr
  FROM (
    SELECT date_trunc('month', date)::date AS month_dt,
           (ARRAY_AGG(mrr ORDER BY date DESC NULLS LAST))[1] AS monthly_mrr
    FROM   key_metrics
    WHERE  project_id = p_project_id
      AND  date      >= (CURRENT_DATE - INTERVAL '5 months')::date
      AND  mrr        > 0
    GROUP  BY date_trunc('month', date)::date
    ORDER  BY month_dt DESC
    LIMIT  5
  ) sub;

  v_n := COALESCE(ARRAY_LENGTH(v_mrr_arr, 1), 0);

  -- Sin al menos 2 meses no hay tasa de crecimiento calculable.
  IF v_n < 2 THEN RETURN 0; END IF;

  -- Calcular tasas de crecimiento MoM.
  -- Índice del array en PL/pgSQL empieza en 1.
  FOR i IN 2 .. v_n LOOP
    IF COALESCE(v_mrr_arr[i-1], 0) > 0 THEN
      v_sum_growth := v_sum_growth + (v_mrr_arr[i] - v_mrr_arr[i-1]) / v_mrr_arr[i-1];
      v_count      := v_count + 1;
    END IF;
  END LOOP;

  IF v_count = 0 THEN RETURN 0; END IF;

  v_avg_growth := v_sum_growth / v_count;

  -- Escala: 15% mensual sostenido → 100. Negativo → 0.
  RETURN GREATEST(0, LEAST(100, (v_avg_growth / 0.15) * 100));
END;
$$;

COMMENT ON FUNCTION compute_phase4_o41(UUID) IS
  'O4.1 Phase 4: Crecimiento sostenido (peso 0.40). avg_growth_4m de key_metrics.mrr (últimos 5 meses → 4 tasas MoM). Escala: 15% mensual → 100. <2 meses → 0. Fuente: FASE_1 F1.7.';


-- =============================================================================
-- 2. compute_phase4_o42 — Execution & margin health (peso 0.35)
--
-- O4.2 = capacity_health×0.40 + execution_rate×0.30 + margin_stability×0.30
--
-- margin_stability:
--   varianza relativa del margen mensual de los últimos 4 meses (desde obvs.margen).
--   variance_margen = (MAX - MIN) / AVG de los meses disponibles.
--   margin_stability = MAX(0, MIN(100, (1 - variance_margen) × 100))
--   Default 50 (neutral) si < 2 meses de datos: no penaliza por falta de datos.
--
-- obvs.margen es auto-calculado por trigger auto_calcular_costes_y_margen
-- (migration 00001): margen = facturacion - costes para OBVs de venta.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase4_o42(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap_health   NUMERIC;
  v_exec_rate    NUMERIC;
  v_margen_arr   NUMERIC[];
  v_n            INTEGER;
  v_max_m        NUMERIC;
  v_min_m        NUMERIC;
  v_avg_m        NUMERIC;
  v_variance     NUMERIC;
  v_margin_stab  NUMERIC;
BEGIN
  -- Engines existentes (migrations 00003 + 00006)
  v_cap_health := COALESCE(compute_capacity_health(p_project_id), 0);
  v_exec_rate  := COALESCE(compute_execution_rate(p_project_id), 0);

  -- Margin stability: varianza del margen mensual (últimos 4 meses) desde obvs.
  -- Fuente: obvs.margen (auto-calculado). Filtra margen > 0 para evitar
  -- distorsión de OBVs exploratorias sin componente económico.
  SELECT ARRAY_AGG(monthly_margen ORDER BY month_dt ASC)
  INTO   v_margen_arr
  FROM (
    SELECT date_trunc('month', created_at)::date AS month_dt,
           SUM(margen)                           AS monthly_margen
    FROM   obvs
    WHERE  project_id  = p_project_id
      AND  created_at >= (CURRENT_DATE - INTERVAL '4 months')
      AND  margen      > 0
    GROUP  BY month_dt
    ORDER  BY month_dt DESC
    LIMIT  4
  ) sub;

  v_n := COALESCE(ARRAY_LENGTH(v_margen_arr, 1), 0);

  IF v_n < 2 THEN
    -- Sin datos suficientes: neutral (50). No penaliza ni premia.
    -- Proyectos en Fase 4 temprana pueden tener historial de OBVs < 2 meses.
    v_margin_stab := 50;
  ELSE
    SELECT MAX(val), MIN(val), AVG(val)
    INTO   v_max_m,  v_min_m,  v_avg_m
    FROM   UNNEST(v_margen_arr) AS val;

    IF COALESCE(v_avg_m, 0) <= 0 THEN
      -- Margen promedio cero o negativo → máxima inestabilidad
      v_margin_stab := 0;
    ELSE
      v_variance    := (v_max_m - v_min_m) / v_avg_m;
      v_margin_stab := GREATEST(0, LEAST(100, (1 - v_variance) * 100));
    END IF;
  END IF;

  RETURN GREATEST(0, LEAST(100,
    (v_cap_health * 0.40) + (v_exec_rate * 0.30) + (v_margin_stab * 0.30)
  ));
END;
$$;

COMMENT ON FUNCTION compute_phase4_o42(UUID) IS
  'O4.2 Phase 4: Execution & margin health (peso 0.35). capacity_health×0.40 + execution_rate×0.30 + margin_stability×0.30. margin_stability: varianza relativa de obvs.margen mensual (4 meses). Default 50 si <2 meses. Fuente: FASE_1 F1.7.';


-- =============================================================================
-- 3. compute_phase4_o43 — Independencia del founder (peso 0.25)
--
-- Delegación de funciones críticas (demand/delivery/cash) a miembros distintos
-- al founder. Fuente: project_functions.owner_user_id vs projects.user_id.
--
-- Score:
--   ≥3 funciones delegadas → 100  (organización no founder-centric)
--   ≥2 funciones delegadas →  70
--   < 2                    →  30  (founder central, sin delegación estructural)
--
-- v1: automation_score pathway ELIMINADO.
-- No existe schema (tabla, columna) ni UI para automation_score.
-- Condición muerta = misma decisión que financial_projections en migration 00017.
-- DEUDA v2: reincorporar cuando exista:
--   tabla + columnas (sistema_automatizado_real, proceso_con_checklist_activo,
--   metricas_auto_generadas) + UI de captura + compute engine.
--   Con automation_score ≥70 en ≥2 funciones strong: max O4.3 = 100 para solo founder.
--
-- Cap natural v1 (sin automation): phase4_score max = 100×0.40 + 100×0.35 + 70×0.25 = 92.5
-- (si solo 2 funciones delegadas, O4.3 = 70 → cap 92.5 incluso con O4.1+O4.2=100)
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_phase4_o43(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_founder_id  UUID;
  v_delegated   INTEGER;
BEGIN
  -- Founder = creador del proyecto (projects.created_by, no user_id)
  SELECT created_by INTO v_founder_id
  FROM   projects
  WHERE  id = p_project_id;

  -- Funciones delegadas: owner asignado y distinto al founder.
  -- Hay exactamente 3 function_types (demand/delivery/cash) por proyecto.
  -- ≥3 delegadas → todas las funciones críticas fuera del founder.
  SELECT COUNT(*)
  INTO   v_delegated
  FROM   project_functions
  WHERE  project_id    = p_project_id
    AND  owner_user_id IS NOT NULL
    AND  owner_user_id != v_founder_id;

  RETURN CASE
    WHEN v_delegated >= 3 THEN 100
    WHEN v_delegated >= 2 THEN  70
    ELSE                        30
  END;
END;
$$;

COMMENT ON FUNCTION compute_phase4_o43(UUID) IS
  'O4.3 Phase 4: Independencia del founder (peso 0.25). v1 sin automation_score (no existe en schema). Delegación: ≥3 funciones (owner!=founder en project_functions)→100, ≥2→70, <2→30. DEUDA v2: automation_score pathway cuando exista tabla+UI+engine.';


-- =============================================================================
-- 4. run_phase_engine — Integra Phase 1, 2, 3, 4 completo
--
-- CAMBIOS vs migration 00017:
--
--   DECLARE section:
--     • Añadido bloque "Phase 4 variables": v_o4_1, v_o4_2, v_o4_3, v_risk_level
--
--   Phase 4 block (REEMPLAZA placeholder "v_cur_phase > 3"):
--     • Condición: v_cur_phase = 4 (explícita — solo Fase 4)
--     • Calcula O4.1, O4.2, O4.3 mediante sub-funciones
--     • phase4_score = O4.1×0.40 + O4.2×0.35 + O4.3×0.25
--     • Hard signal (informacional — Fase 4 terminal en v1):
--         v_o4_1 >= 33 AND v_o4_2 >= 50 AND risk_level NOT IN ('high','critical')
--     • No hay gate de avance (Fase 4 es terminal en v1)
--     • UPSERT project_phase_state + INSERT project_phase_history + RETURN
--
-- Sin cambios en Phase 1, 2, 3 blocks.
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

  -- Phase 4 variables (migration 00018 — E4.5)
  v_o4_1             NUMERIC;
  v_o4_2             NUMERIC;
  v_o4_3             NUMERIC;
  v_risk_level       TEXT;

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
    v_o3_3        := compute_phase3_o33(p_project_id);  -- PATCH 00017: rolling 28d
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
  -- PHASE 4 — Escala (E4.5 — migration 00018)
  --
  -- Fase terminal en v1: no hay gate de avance a Fase 5.
  -- hard_signal_met es informacional: indica si el proyecto opera a escala
  -- saludable. No activa ningún avance de fase.
  --
  -- Hard signal:
  --   1. O4.1 >= 33  → avg_growth_4m >= 5% (crecimiento real positivo)
  --   2. O4.2 >= 50  → ejecución+margen no en rango crítico
  --   3. risk_level NOT IN ('high', 'critical')
  -- =======================================================================
  IF v_cur_phase = 4 THEN

    v_o4_1        := compute_phase4_o41(p_project_id);
    v_o4_2        := compute_phase4_o42(p_project_id);
    v_o4_3        := compute_phase4_o43(p_project_id);
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o4_1 * 0.40) + (v_o4_2 * 0.35) + (v_o4_3 * 0.25)
      )), 2
    );

    -- Hard signal (informacional): crecimiento real + ejecución no crítica + riesgo bajo
    SELECT COALESCE(risk_level, 'low') INTO v_risk_level
    FROM   project_risk_score
    WHERE  project_id = p_project_id;
    v_risk_level := COALESCE(v_risk_level, 'low');

    v_hard_signal := (
      v_o4_1     >= 33                            -- avg_growth >= 5%
      AND v_o4_2 >= 50                            -- ejecución+margen no críticos
      AND v_risk_level NOT IN ('high', 'critical')
    );

    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      ELSE                            'critical'
    END;

    -- Fase 4 terminal — v_new_phase = v_cur_phase = 4 siempre
    -- v_advanced = FALSE → phase_last_changed_at = v_phase_changed (sin cambio)
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
      v_phase_changed,   NOW(),
      v_ver
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
      v_phase_status, NULL,
      p_trigger_source, v_ver
    );

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
  'Phase Engine v1 migration 00018 (E4.5). Phase 1: O1.1×0.40+O1.2×0.40+O1.3×0.20. Phase 2: O2.1×0.45+O2.2×0.25+O2.3×0.30; hard: payment_obv AND rev_momentum>=40. Phase 3: O3.1×0.40+O3.2×0.35+O3.3×0.25; hard: stable_months>=3 AND tasks_done_28d>=3. Phase 4 (terminal): O4.1×0.40+O4.2×0.35+O4.3×0.25; hard (informacional): o41>=33 AND o42>=50 AND risk<high. Gate 1→2→3→4: score>=75 AND hard_signal AND velocity>=2. DEUDA v2: financial_projections UI, cycle rollover, automation_score.';
