-- =============================================================================
-- MIGRACIÓN 00013 — CALCULATE_ROLE_PERFORMANCE_SCORE (C3.4)
--
-- Propósito: fórmulas de performance diferenciadas por rol (6 roles).
--   Reemplaza la fórmula genérica existente:
--     score = (obvs_validados × 10) + (kpis_validados × 5) + (tareas_completadas × 2)
--   con 6 fórmulas especializadas que escriben en project_members.performance_score_v2.
--
-- Inputs: SOLO columnas verificadas en schema (migrations 00001–00012).
-- Inputs NO disponibles en schema actual (documentados, no inventados):
--   - crm_leads table: NO EXISTE → se usan campos de venta en obvs (es_venta, cobrado)
--   - obv_outcome column: NO EXISTE en obvs → se usa status = 'validated'
--   - kpis.project_id: NO EXISTE → kpis son cross-project (señal menor, aceptado)
--   - strategic_cycles / tasks.strategic_cycle_id: PENDIENTE verificar para O3.3 de E4.4
--
-- Funciones creadas:
--   1. calculate_role_performance_score(project_id, member_id) → NUMERIC(5,2)
--      Pure compute — no writes.
--   2. update_member_performance_scores(project_id) → void
--      Loops members, calls #1, writes to performance_score_v2.
--
-- Thresholds 0–100:
--   ≥75 → Alto rendimiento
--   50–74 → Estándar
--   25–49 → Bajo rendimiento
--   0–24 → Sin datos / Inactivo
--
-- Dependencia E4.4:
--   execution_rate incluye role_execution_health (wR=0.20 en F3, wR=0.15 en F2).
--   role_execution_health = AVG(performance_score_v2) de miembros con rol asignado.
--   Este compute debe ejecutarse antes de run_phase_engine para Fase 3.
-- =============================================================================

-- =============================================================================
-- FUNCIÓN 1: calculate_role_performance_score
--
-- Fórmulas por rol:
--
--   SALES   (→ demand):
--     A: deals cerrados (es_venta=TRUE, cobrado=TRUE, 90d)   max 40  (2 deals)
--     B: revenue_validation OBVs validated (28d)             max 30  (2 OBVs)
--     C: task on-time rate (28d)                             max 20  (100%)
--     D: kpis validated (28d)                                max 10  (2 KPIs)
--
--   FINANCE (→ cash):
--     A: collection rate on time (cobro_dias_retraso≤0, 90d) max 40  (100%)
--     B: revenue_validation OBVs validated (28d)             max 30  (3 OBVs)
--     C: task on-time rate (28d)                             max 20  (100%)
--     D: kpis validated (28d)                                max 10  (2 KPIs)
--
--   MARKETING (→ demand):
--     A: customer_discovery OBVs validated (28d)             max 40  (3 OBVs)
--     B: task on-time rate (28d)                             max 35  (100%)
--     C: kpis validated (28d)                                max 15  (2 KPIs)
--     D: revenue_validation OBVs (demand→revenue signal, 28d)max 10  (1 OBV)
--
--   OPERATIONS (→ delivery):
--     A: task on-time rate (28d)                             max 40  (100%)
--     B: process documentation active (project_functions +
--        process_artifacts, 30d)                             max 30  (owns+active)
--     C: operational_system OBVs validated (28d)             max 20  (2 OBVs)
--     D: kpis validated (28d)                                max 10  (2 KPIs)
--
--   AI_TECH (→ delivery):
--     A: delivery-typed tasks completed (28d)                max 40  (4 tasks)
--     B: product_validation OBVs validated (28d)             max 35  (2 OBVs)
--     C: task on-time rate (28d)                             max 15  (100%)
--     D: kpis validated (28d)                                max 10  (2 KPIs)
--
--   STRATEGY (→ cross-function):
--     A: any OBVs validated (28d)                            max 30  (3 OBVs)
--     B: strategic pivots authored (strategic_model_versions, 28d) max 35 (2 pivots)
--     C: tasks led to completion (leader_id, 28d)            max 25  (3 tasks)
--     D: kpis validated (28d)                                max 10  (2 KPIs)
--
-- Nota sobre project_functions.owner_user_id:
--   Referencia auth.users(id). En Supabase, profiles.id = auth.users.id (1:1).
--   La comparación owner_user_id = p_member_id (profiles.id) es correcta en práctica.
--   Si esa equivalencia no se cumple en el tenant, este check devuelve FALSE silenciosamente.
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_role_performance_score(
  p_project_id  UUID,
  p_member_id   UUID   -- profiles.id
)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role              specialization_role;

  -- Task metrics (28d rolling window, all function_types)
  v_tasks_done        INTEGER := 0;
  v_tasks_on_time     INTEGER := 0;
  v_on_time_rate      NUMERIC := 0.50;  -- neutral default when no completed tasks
  v_tasks_led         INTEGER := 0;     -- tasks where member is leader_id

  -- Delivery-typed tasks specifically (ai_tech formula)
  v_delivery_tasks    INTEGER := 0;

  -- OBV metrics (28d rolling window, by tipo)
  v_obvs_revenue      INTEGER := 0;
  v_obvs_product      INTEGER := 0;
  v_obvs_discovery    INTEGER := 0;
  v_obvs_ops          INTEGER := 0;
  v_obvs_any          INTEGER := 0;

  -- KPI metrics (28d, no project_id filter — kpis table has no project_id)
  v_kpis_validated    INTEGER := 0;

  -- Sales-specific
  v_deals_closed      INTEGER := 0;

  -- Finance-specific
  v_collect_total     INTEGER := 0;
  v_collect_ontime    INTEGER := 0;

  -- Operations-specific
  v_owns_delivery     BOOLEAN := FALSE;
  v_proc_active       BOOLEAN := FALSE;

  -- Strategy-specific
  v_pivots_28d        INTEGER := 0;

  -- Score components (sum = final score, max = 100)
  v_score_a           NUMERIC := 0;
  v_score_b           NUMERIC := 0;
  v_score_c           NUMERIC := 0;
  v_score_d           NUMERIC := 0;

  c_28d CONSTANT INTERVAL := INTERVAL '28 days';
  c_90d CONSTANT INTERVAL := INTERVAL '90 days';
  c_30d CONSTANT INTERVAL := INTERVAL '30 days';
BEGIN

  -- ── 1. Get member role ─────────────────────────────────────────────────────
  SELECT pm.role INTO v_role
  FROM   project_members pm
  WHERE  pm.project_id = p_project_id
    AND  pm.member_id  = p_member_id;

  -- No role or role NULL → score 0 (no formula to apply)
  IF v_role IS NULL THEN
    RETURN 0::NUMERIC(5,2);
  END IF;

  -- ── 2. Shared: task metrics ─────────────────────────────────────────────────
  -- All assigned tasks (any function_type including NULL — don't penalize
  -- unclassified tasks from members who predate function_type enforcement)
  SELECT
    COUNT(*) FILTER (
      WHERE status = 'completed'
        AND completed_at >= NOW() - c_28d
    ),
    COUNT(*) FILTER (
      WHERE status       = 'completed'
        AND completed_at >= NOW() - c_28d
        AND fecha_limite IS NOT NULL
        AND completed_at <= (fecha_limite::TIMESTAMPTZ + INTERVAL '1 day')
    )
  INTO v_tasks_done, v_tasks_on_time
  FROM tasks
  WHERE project_id = p_project_id
    AND assignee_id = p_member_id;

  -- on_time_rate: computed only from completed tasks (not from overdue pending)
  -- If 0 tasks done → neutral 0.50 (no signal, don't punish)
  IF v_tasks_done > 0 THEN
    v_on_time_rate := v_tasks_on_time::NUMERIC / v_tasks_done;
  END IF;

  -- Tasks where member is leader (accountability signal — used by strategy)
  SELECT COUNT(*) INTO v_tasks_led
  FROM   tasks
  WHERE  project_id   = p_project_id
    AND  leader_id    = p_member_id
    AND  status       = 'completed'
    AND  completed_at >= NOW() - c_28d;

  -- Delivery-typed tasks specifically (ai_tech role)
  SELECT COUNT(*) INTO v_delivery_tasks
  FROM   tasks
  WHERE  project_id    = p_project_id
    AND  assignee_id   = p_member_id
    AND  function_type = 'delivery'
    AND  status        = 'completed'
    AND  completed_at  >= NOW() - c_28d;

  -- ── 3. Shared: OBV metrics ──────────────────────────────────────────────────
  -- status = 'validated' is the correct kpi_status value for completed OBVs
  -- (obv_outcome column does NOT exist in schema — verified in migration 00001/00002)
  SELECT
    COUNT(*) FILTER (WHERE tipo = 'revenue_validation'),
    COUNT(*) FILTER (WHERE tipo = 'product_validation'),
    COUNT(*) FILTER (WHERE tipo = 'customer_discovery'),
    COUNT(*) FILTER (WHERE tipo = 'operational_system'),
    COUNT(*)
  INTO v_obvs_revenue, v_obvs_product, v_obvs_discovery, v_obvs_ops, v_obvs_any
  FROM obvs
  WHERE project_id   = p_project_id
    AND owner_id     = p_member_id
    AND status       = 'validated'
    AND validated_at >= NOW() - c_28d;

  -- ── 4. Shared: KPI metrics ──────────────────────────────────────────────────
  -- kpis table has no project_id → cross-project signal
  -- Accepted limitation: minor weight in all formulas (max 10 pts)
  SELECT COUNT(*) INTO v_kpis_validated
  FROM   kpis
  WHERE  owner_id    = p_member_id
    AND  status      = 'validated'
    AND  validated_at >= NOW() - c_28d;

  -- ── 5. Role-specific formula dispatch ───────────────────────────────────────

  CASE v_role

    -- ── SALES ──────────────────────────────────────────────────────────────────
    -- Core signal: closing deals (verified payment from obvs financial fields)
    -- Secondary: revenue OBVs, task execution, KPIs
    WHEN 'sales' THEN

      -- Deals = obvs with es_venta=TRUE where payment was collected (90d window:
      -- sales cycles can be longer than 28d)
      SELECT COUNT(*) INTO v_deals_closed
      FROM   obvs
      WHERE  project_id       = p_project_id
        AND  owner_id         = p_member_id
        AND  es_venta         = TRUE
        AND  cobrado          = TRUE
        AND  cobro_fecha_real >= NOW() - c_90d;

      v_score_a := LEAST(40, v_deals_closed * 20);   -- 2 deals = max 40
      v_score_b := LEAST(30, v_obvs_revenue * 15);   -- 2 revenue OBVs = max 30
      v_score_c := ROUND(v_on_time_rate * 20, 2);    -- execution reliability
      v_score_d := LEAST(10, v_kpis_validated * 5);  -- KPI signal

    -- ── FINANCE ────────────────────────────────────────────────────────────────
    -- Core signal: collections on time (cobro_dias_retraso ≤ 0)
    -- If no invoices recorded: collection component = 0 (genuine absence of data)
    WHEN 'finance' THEN

      SELECT
        COUNT(*) FILTER (
          WHERE cobro_fecha_esperada >= NOW() - c_90d
        ),
        COUNT(*) FILTER (
          WHERE cobrado            = TRUE
            AND (cobro_dias_retraso IS NULL OR cobro_dias_retraso <= 0)
            AND cobro_fecha_real  >= NOW() - c_90d
        )
      INTO v_collect_total, v_collect_ontime
      FROM obvs
      WHERE project_id = p_project_id
        AND owner_id   = p_member_id;

      -- collection rate only meaningful when there are invoices to track
      v_score_a := CASE
        WHEN v_collect_total > 0
          THEN ROUND((v_collect_ontime::NUMERIC / v_collect_total) * 40, 2)
        ELSE 0  -- no invoice data = 0, not penalized with neutral
      END;

      v_score_b := LEAST(30, v_obvs_revenue * 10);   -- 3 cash OBVs = max 30
      v_score_c := ROUND(v_on_time_rate * 20, 2);
      v_score_d := LEAST(10, v_kpis_validated * 5);

    -- ── MARKETING ──────────────────────────────────────────────────────────────
    -- Core signal: market discovery (customer_discovery OBVs)
    -- Secondary: task execution (demand generation is execution-heavy), KPIs
    -- Note: no leads table, no content table → cannot compute leads_generated or
    --       content_published from current schema
    WHEN 'marketing' THEN

      v_score_a := LEAST(40, v_obvs_discovery * 13); -- 3 discovery OBVs ≈ max 39
      v_score_b := ROUND(v_on_time_rate * 35, 2);    -- demand execution weight
      v_score_c := LEAST(15, v_kpis_validated * 7);  -- 2 KPIs = 14 ≈ max
      v_score_d := LEAST(10, v_obvs_revenue * 10);   -- revenue contribution bonus

    -- ── OPERATIONS ─────────────────────────────────────────────────────────────
    -- Core signal: reliability (task on-time) + active process documentation
    -- process_artifacts checked for delivery function ownership
    WHEN 'operations' THEN

      -- Does this member own the delivery function?
      -- Note: project_functions.owner_user_id refs auth.users(id);
      --       p_member_id is profiles.id. In Supabase profiles.id = auth.users.id.
      SELECT EXISTS(
        SELECT 1 FROM project_functions
        WHERE project_id    = p_project_id
          AND owner_user_id = p_member_id
          AND function_type = 'delivery'
      ) INTO v_owns_delivery;

      -- Is there an active, used process for delivery?
      -- active = checklist_items_count ≥ 5 AND used within 30 days
      SELECT EXISTS(
        SELECT 1 FROM process_artifacts
        WHERE project_id              = p_project_id
          AND function_type           = 'delivery'
          AND checklist_items_count  >= 5
          AND last_used_at           >= NOW() - c_30d
      ) INTO v_proc_active;

      v_score_a := ROUND(v_on_time_rate * 40, 2);    -- reliability is core

      -- process score: full credit requires both ownership and active process
      v_score_b := CASE
        WHEN v_owns_delivery AND v_proc_active THEN 30
        WHEN v_proc_active                     THEN 20  -- process exists, not owned by them
        WHEN v_owns_delivery                   THEN 10  -- owns function but no active process
        ELSE 0
      END;

      v_score_c := LEAST(20, v_obvs_ops * 10);        -- 2 ops OBVs = max 20
      v_score_d := LEAST(10, v_kpis_validated * 5);

    -- ── AI_TECH ────────────────────────────────────────────────────────────────
    -- Core signal: delivery velocity + product validation OBVs
    -- Note: no milestone table, no sprint table, no bug tracking in schema
    WHEN 'ai_tech' THEN

      v_score_a := LEAST(40, v_delivery_tasks * 10); -- 4 delivery tasks = max 40
      v_score_b := LEAST(35, v_obvs_product * 17);   -- 2 product OBVs = 34 ≈ max
      v_score_c := ROUND(v_on_time_rate * 15, 2);    -- delivery precision
      v_score_d := LEAST(10, v_kpis_validated * 5);

    -- ── STRATEGY ───────────────────────────────────────────────────────────────
    -- Core signal: documented pivots + tasks led (strategic direction + accountability)
    -- strategic_model_versions.created_by = profiles.id (verified in StrategyEditor.tsx)
    WHEN 'strategy' THEN

      SELECT COUNT(*) INTO v_pivots_28d
      FROM   strategic_model_versions
      WHERE  project_id = p_project_id
        AND  created_by = p_member_id
        AND  created_at >= NOW() - c_28d;

      v_score_a := LEAST(30, v_obvs_any * 10);       -- 3 any-type OBVs = max 30
      v_score_b := LEAST(35, v_pivots_28d * 17);     -- 2 pivots = 34 ≈ max
      v_score_c := LEAST(25, v_tasks_led * 8);       -- 3 tasks led = 24 ≈ max
      v_score_d := LEAST(10, v_kpis_validated * 5);

    -- ── Unknown role ───────────────────────────────────────────────────────────
    ELSE
      RETURN 0::NUMERIC(5,2);

  END CASE;

  -- ── 6. Sum and bound to [0, 100] ──────────────────────────────────────────
  RETURN GREATEST(0, LEAST(100,
    ROUND(v_score_a + v_score_b + v_score_c + v_score_d, 2)
  ))::NUMERIC(5,2);

END;
$$;

COMMENT ON FUNCTION calculate_role_performance_score(UUID, UUID) IS
  'Computa performance score 0–100 diferenciado por specialization_role.
   6 fórmulas: sales / finance / marketing / operations / ai_tech / strategy.
   Inputs: tasks (28d), obvs (28d), kpis (28d cross-project), deals (90d).
   Esquema usado: verificado contra migrations 00001–00012.
   Columnas NO disponibles ignoradas: crm_leads (no existe), obv_outcome (no existe).
   Pure compute — no escribe. Llamar update_member_performance_scores para persistir.';


-- =============================================================================
-- FUNCIÓN 2: update_member_performance_scores
--
-- Recorre todos los miembros de un proyecto con rol asignado,
-- calcula su performance_score_v2 y persiste en project_members.
--
-- Se llama desde:
--   - run_coverage_engine (integración E4.14 pendiente)
--   - Manualmente para seed/debugging
--   - Potencialmente desde trigger de task.status='completed' (decisión de E4.14)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_member_performance_scores(
  p_project_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT member_id
    FROM   project_members
    WHERE  project_id = p_project_id
      AND  role IS NOT NULL
  LOOP
    UPDATE project_members
    SET
      performance_score_v2    = calculate_role_performance_score(p_project_id, r.member_id),
      last_performance_update = NOW()
    WHERE project_id = p_project_id
      AND member_id  = r.member_id;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION update_member_performance_scores(UUID) IS
  'Recorre miembros con rol asignado en el proyecto y persiste performance_score_v2
   calculado por calculate_role_performance_score. No dispara Phase Engine —
   eso queda en manos del runner que llame a esta función.';
