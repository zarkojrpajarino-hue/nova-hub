-- =============================================================================
-- MIGRACIÓN 00006 — EXECUTION RATE: 3 FUNCIONES CANÓNICAS
--
-- compute_task_completion_rate(project_id) → NUMERIC
-- compute_role_execution_health(project_id) → NUMERIC
-- compute_execution_rate(project_id)        → NUMERIC
--
-- Estas funciones son llamadas por run_probability_engine (migración 00007).
-- No crean triggers propios — el probability engine es quien los llama.
--
-- SCHEMA CONFIRMADO:
--   tasks.status         : task_status ENUM ('todo','doing','done','blocked')
--   tasks.completed_at   : TIMESTAMPTZ (campo explícito, NO updated_at)
--   tasks.created_at     : TIMESTAMPTZ
--   tasks.function_type  : TEXT (añadido en D2.14 — migration 00002)
--   tasks.assignee_id    : UUID → profiles(id)
--   project_functions.owner_user_id : UUID → profiles(id)
-- =============================================================================

-- =============================================================================
-- 1. compute_task_completion_rate(p_project_id) → NUMERIC (0–100)
--
-- DEFINICIÓN (canónica v1):
--   Ventana: últimos 14 días
--   done_14d = COUNT(tasks WHERE status='done' AND completed_at >= NOW()-14d)
--   due_14d  = COUNT(tasks WHERE created_at >= NOW()-14d)
--   rate     = done_14d / GREATEST(1, due_14d)
--   result   = CLAMP(rate * 100, 0, 100)
--
-- DENOMINADOR = tareas CREADAS en la ventana (no backlog total).
-- Razón: evitar inflar el denominador con backlog acumulado que puede ser enorme.
-- Un proyecto con 200 tareas atrasadas y 5 hechas esta semana no debe penalizarse
-- igual que uno que simplemente no ejecuta.
--
-- NULL-safety: si due_14d = 0 → GREATEST(1, 0) = 1 → rate = 0/1 = 0.
-- Devuelve 0 (no NULL) porque "no hay tareas creadas" es un estado medible.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_task_completion_rate(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_done_14d  BIGINT;
  v_due_14d   BIGINT;
  v_rate      NUMERIC;
BEGIN
  -- Tareas completadas en los últimos 14 días
  SELECT COUNT(*)
  INTO   v_done_14d
  FROM   tasks
  WHERE  project_id   = p_project_id
    AND  status       = 'done'
    AND  completed_at >= NOW() - INTERVAL '14 days';

  -- Tareas creadas en los últimos 14 días (denominador limpio, sin backlog)
  SELECT COUNT(*)
  INTO   v_due_14d
  FROM   tasks
  WHERE  project_id  = p_project_id
    AND  created_at  >= NOW() - INTERVAL '14 days';

  -- rate = done / GREATEST(1, due) — evita división por cero y no castiga sin datos
  v_rate := v_done_14d::NUMERIC / GREATEST(1, v_due_14d)::NUMERIC;

  RETURN ROUND(LEAST(100.0, GREATEST(0.0, v_rate * 100.0)), 2);
END;
$$;

COMMENT ON FUNCTION compute_task_completion_rate(UUID) IS
  'Tasa de completado de tareas en ventana 14 días. done_14d/created_14d × 100, clamped [0,100]. Denominador = creadas en ventana (no backlog total). Usa completed_at y status=''done''.';

-- =============================================================================
-- 2. compute_role_execution_health(p_project_id) → NUMERIC (0–100)
--
-- DEFINICIÓN (canónica v1):
-- Para cada función crítica (demand / delivery / cash):
--   owner_assigned = project_functions.owner_user_id IS NOT NULL
--   owner_active_14d = owner tiene ≥1 tarea con status='done' en esa función
--                      en los últimos 14 días (via tasks.assignee_id)
--
--   score_por_función:
--     NO owner                        → 0
--     owner SÍ, pero NO active_14d    → 50   (asignado pero sin actividad)
--     owner SÍ Y active_14d           → 100  (activo y ejecutando)
--
-- result = ROUND(AVG(score sobre las 3 funciones), 2)
--
-- NOTA sobre assignee_id:
-- Se usa tasks.assignee_id (el ejecutor de la tarea) como proxy de actividad
-- del owner de función en v1. En v2 se puede añadir leader_id como alternativa.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_role_execution_health(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_score  NUMERIC := 0;
  v_ft           TEXT;
  v_owner_id     UUID;
  v_active_14d   BOOLEAN;
  v_fn_score     NUMERIC;
BEGIN
  FOREACH v_ft IN ARRAY ARRAY['demand', 'delivery', 'cash'] LOOP

    -- owner asignado a esta función
    SELECT owner_user_id
    INTO   v_owner_id
    FROM   project_functions
    WHERE  project_id    = p_project_id
      AND  function_type = v_ft;

    IF v_owner_id IS NULL THEN
      -- Sin owner → 0
      v_fn_score := 0;

    ELSE
      -- ¿El owner tiene ≥1 tarea 'done' en esta función en 14 días?
      SELECT EXISTS (
        SELECT 1
        FROM   tasks
        WHERE  project_id    = p_project_id
          AND  function_type = v_ft
          AND  assignee_id   = v_owner_id
          AND  status        = 'done'
          AND  completed_at >= NOW() - INTERVAL '14 days'
      ) INTO v_active_14d;

      v_fn_score := CASE
        WHEN v_active_14d THEN 100
        ELSE 50  -- tiene owner pero sin actividad reciente
      END;
    END IF;

    v_total_score := v_total_score + v_fn_score;

  END LOOP;

  -- AVG sobre 3 funciones
  RETURN ROUND(v_total_score / 3.0, 2);
END;
$$;

COMMENT ON FUNCTION compute_role_execution_health(UUID) IS
  'Salud de ejecución por roles. Para demand/delivery/cash: sin_owner→0, owner_sin_actividad_14d→50, owner_activo_14d→100. AVG de las 3 funciones. Proxy: tasks.assignee_id como actividad del owner.';

-- =============================================================================
-- 3. compute_execution_rate(p_project_id) → NUMERIC (0–100)
--
-- DEFINICIÓN (canónica v1 — fórmula completa con pesos por fase):
--
--   Sub-inputs:
--     velocity_score = MIN(100, compute_iteration_velocity(project_id) × 25)
--     task_rate      = compute_task_completion_rate(project_id)
--     role_health    = compute_role_execution_health(project_id)
--
--   Pesos por fase (decreciente peso en velocity conforme avanza el modelo):
--     Phase 1:  velocity 0.60 / tasks 0.25 / role 0.15
--     Phase 2:  velocity 0.55 / tasks 0.30 / role 0.15
--     Phase 3:  velocity 0.45 / tasks 0.40 / role 0.15
--     Phase 4+: velocity 0.35 / tasks 0.50 / role 0.15
--
--   Redistribución si input NULL (valor_peso nulo → redistribuye pro-rata):
--     En v1 los 3 sub-inputs siempre devuelven NUMERIC (nunca NULL).
--     El patrón de redistribución está preparado para cuando algún input
--     sea marcado explícitamente como unavailable (NULL) en v2.
--
-- NOTA: execution_rate se almacena en project_probability.execution_rate_input
--       (no tiene tabla propia). run_probability_engine lo usa como sub-cálculo.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_execution_rate(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phase         SMALLINT;
  v_velocity_raw  INTEGER;
  v_velocity      NUMERIC;
  v_task_rate     NUMERIC;
  v_role_health   NUMERIC;

  -- Pesos por fase
  v_w_velocity    NUMERIC;
  v_w_tasks       NUMERIC;
  v_w_role        NUMERIC;

  -- Redistribución de pesos si NULL
  v_total_weight  NUMERIC;
  v_result        NUMERIC;
BEGIN
  -- -----------------------------------------------------------------------
  -- Fase actual (para pesos)
  -- -----------------------------------------------------------------------
  SELECT current_phase INTO v_phase
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  v_phase := COALESCE(v_phase, 1);

  -- -----------------------------------------------------------------------
  -- Pesos según fase
  -- -----------------------------------------------------------------------
  CASE v_phase
    WHEN 1 THEN
      v_w_velocity := 0.60; v_w_tasks := 0.25; v_w_role := 0.15;
    WHEN 2 THEN
      v_w_velocity := 0.55; v_w_tasks := 0.30; v_w_role := 0.15;
    WHEN 3 THEN
      v_w_velocity := 0.45; v_w_tasks := 0.40; v_w_role := 0.15;
    ELSE
      -- Phase 4+
      v_w_velocity := 0.35; v_w_tasks := 0.50; v_w_role := 0.15;
  END CASE;

  -- -----------------------------------------------------------------------
  -- Sub-inputs
  -- velocity_score = MIN(100, velocity × 25)
  -- -----------------------------------------------------------------------
  v_velocity_raw := compute_iteration_velocity(p_project_id);
  v_velocity     := LEAST(100.0, v_velocity_raw * 25.0);

  v_task_rate    := compute_task_completion_rate(p_project_id);
  v_role_health  := compute_role_execution_health(p_project_id);

  -- -----------------------------------------------------------------------
  -- Redistribución de pesos para NULLs (patrón RiskScore)
  -- En v1 ninguno es NULL (retornan 0 si sin datos),
  -- pero el mecanismo queda implementado para v2.
  -- -----------------------------------------------------------------------
  IF v_velocity IS NULL THEN v_w_velocity := 0; v_velocity := 0; END IF;
  IF v_task_rate IS NULL THEN v_w_tasks   := 0; v_task_rate := 0; END IF;
  IF v_role_health IS NULL THEN v_w_role  := 0; v_role_health := 0; END IF;

  v_total_weight := v_w_velocity + v_w_tasks + v_w_role;

  -- Si todos son NULL (edge case extremo), devuelve 0
  IF v_total_weight = 0 THEN
    RETURN 0;
  END IF;

  -- Redistribuir pesos proporcionalmente si alguno quedó a 0 por NULL
  v_result := (
    (v_velocity   * (v_w_velocity / v_total_weight))
  + (v_task_rate  * (v_w_tasks    / v_total_weight))
  + (v_role_health * (v_w_role    / v_total_weight))
  );

  RETURN ROUND(LEAST(100.0, GREATEST(0.0, v_result)), 2);
END;
$$;

COMMENT ON FUNCTION compute_execution_rate(UUID) IS
  'Tasa de ejecución ponderada por fase. velocity_score (MIN(100,velocity×25)) + task_completion_rate + role_execution_health. Pesos: F1=60/25/15, F2=55/30/15, F3=45/40/15, F4+=35/50/15. Redistribuye pesos si sub-input NULL.';
