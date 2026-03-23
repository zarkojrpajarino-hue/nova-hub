-- =============================================================================
-- MIGRATION F29 — Execution-to-Revenue Pipeline (LIGHT)
--
-- ER29.1 + ER29.2: Table execution_trends + RPC compute_execution_trends
-- ER29.5: RPC compute_pipeline_velocity
-- ER29.7: Enrichment with integration_entities
-- ER29.9: Extend get_optimus_context with execution_trends
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table execution_trends — weekly cache of execution metrics
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS execution_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  tasks_demand INT DEFAULT 0,
  tasks_delivery INT DEFAULT 0,
  tasks_cash INT DEFAULT 0,
  tasks_total INT DEFAULT 0,
  obvs_exploracion INT DEFAULT 0,
  obvs_validacion INT DEFAULT 0,
  obvs_venta INT DEFAULT 0,
  obvs_total INT DEFAULT 0,
  revenue_declared NUMERIC DEFAULT 0,
  enriched_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_trend_week UNIQUE(project_id, week_start)
);

ALTER TABLE execution_trends ENABLE ROW LEVEL SECURITY;

-- RLS: project members can read
CREATE POLICY "trend_read" ON execution_trends FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = execution_trends.project_id
      AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
  )
);

CREATE INDEX idx_trends_project ON execution_trends(project_id, week_start DESC);


-- ---------------------------------------------------------------------------
-- 2. RPC compute_execution_trends(project_id, weeks)
--    ER29.1 + ER29.7 (enrichment with integration_entities)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compute_execution_trends(
  p_project_id UUID,
  p_weeks INT DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_i INT;
  v_tasks_demand INT;
  v_tasks_delivery INT;
  v_tasks_cash INT;
  v_tasks_total INT;
  v_obvs_exploracion INT;
  v_obvs_validacion INT;
  v_obvs_venta INT;
  v_obvs_total INT;
  v_revenue NUMERIC;
  v_enriched TEXT[];
  v_weekly_data JSONB := '[]'::JSONB;
  v_trends JSONB := '{}'::JSONB;
  -- For trend calculation
  v_recent_tasks INT[];
  v_recent_obvs INT[];
  v_recent_revenue NUMERIC[];
  -- Integration enrichment
  v_asana_tasks INT;
  v_stripe_revenue NUMERIC;
  v_hubspot_deals INT;
BEGIN
  v_recent_tasks := ARRAY[]::INT[];
  v_recent_obvs := ARRAY[]::INT[];
  v_recent_revenue := ARRAY[]::NUMERIC[];

  FOR v_i IN 0..(p_weeks - 1) LOOP
    -- Calculate week boundaries (Monday-based)
    v_week_start := DATE_TRUNC('week', CURRENT_DATE - (v_i * 7 * INTERVAL '1 day'))::DATE;
    v_week_end := v_week_start + INTERVAL '7 days';

    -- Count tasks completed by function_type
    SELECT
      COUNT(*) FILTER (WHERE function_type = 'demand'),
      COUNT(*) FILTER (WHERE function_type = 'delivery'),
      COUNT(*) FILTER (WHERE function_type = 'cash'),
      COUNT(*)
    INTO v_tasks_demand, v_tasks_delivery, v_tasks_cash, v_tasks_total
    FROM tasks
    WHERE project_id = p_project_id
      AND status = 'done'
      AND completed_at >= v_week_start::TIMESTAMPTZ
      AND completed_at < v_week_end::TIMESTAMPTZ;

    -- Count OBVs created by tipo
    SELECT
      COUNT(*) FILTER (WHERE tipo = 'exploracion'),
      COUNT(*) FILTER (WHERE tipo = 'validacion'),
      COUNT(*) FILTER (WHERE tipo = 'venta'),
      COUNT(*)
    INTO v_obvs_exploracion, v_obvs_validacion, v_obvs_venta, v_obvs_total
    FROM obvs
    WHERE project_id = p_project_id
      AND fecha >= v_week_start
      AND fecha < v_week_end;

    -- Sum revenue from key_metrics for that period
    SELECT COALESCE(SUM(mrr), 0)
    INTO v_revenue
    FROM key_metrics
    WHERE project_id = p_project_id
      AND date >= v_week_start
      AND date < v_week_end;

    -- ER29.7 — Enrichment with integration_entities
    v_enriched := ARRAY[]::TEXT[];

    -- Asana: count external tasks
    SELECT COUNT(*)
    INTO v_asana_tasks
    FROM integration_entities
    WHERE project_id = p_project_id
      AND provider = 'asana'
      AND entity_type = 'task'
      AND status = 'processed'
      AND occurred_at >= v_week_start::TIMESTAMPTZ
      AND occurred_at < v_week_end::TIMESTAMPTZ;

    IF v_asana_tasks > 0 THEN
      v_tasks_total := v_tasks_total + v_asana_tasks;
      v_enriched := array_append(v_enriched, 'asana');
    END IF;

    -- Stripe: use real MRR if available
    SELECT COALESCE(SUM((payload->>'amount')::NUMERIC), 0)
    INTO v_stripe_revenue
    FROM integration_entities
    WHERE project_id = p_project_id
      AND provider = 'stripe'
      AND entity_type IN ('invoice', 'subscription')
      AND status = 'processed'
      AND occurred_at >= v_week_start::TIMESTAMPTZ
      AND occurred_at < v_week_end::TIMESTAMPTZ;

    IF v_stripe_revenue > 0 THEN
      v_revenue := v_stripe_revenue;
      v_enriched := array_append(v_enriched, 'stripe');
    END IF;

    -- HubSpot: count deals
    SELECT COUNT(*)
    INTO v_hubspot_deals
    FROM integration_entities
    WHERE project_id = p_project_id
      AND provider = 'hubspot'
      AND entity_type = 'deal'
      AND status = 'processed'
      AND occurred_at >= v_week_start::TIMESTAMPTZ
      AND occurred_at < v_week_end::TIMESTAMPTZ;

    IF v_hubspot_deals > 0 THEN
      v_obvs_total := v_obvs_total + v_hubspot_deals;
      v_enriched := array_append(v_enriched, 'hubspot');
    END IF;

    -- Upsert into execution_trends table
    INSERT INTO execution_trends (
      project_id, week_start,
      tasks_demand, tasks_delivery, tasks_cash, tasks_total,
      obvs_exploracion, obvs_validacion, obvs_venta, obvs_total,
      revenue_declared, enriched_by
    ) VALUES (
      p_project_id, v_week_start,
      v_tasks_demand, v_tasks_delivery, v_tasks_cash, v_tasks_total,
      v_obvs_exploracion, v_obvs_validacion, v_obvs_venta, v_obvs_total,
      v_revenue, v_enriched
    )
    ON CONFLICT (project_id, week_start) DO UPDATE SET
      tasks_demand = EXCLUDED.tasks_demand,
      tasks_delivery = EXCLUDED.tasks_delivery,
      tasks_cash = EXCLUDED.tasks_cash,
      tasks_total = EXCLUDED.tasks_total,
      obvs_exploracion = EXCLUDED.obvs_exploracion,
      obvs_validacion = EXCLUDED.obvs_validacion,
      obvs_venta = EXCLUDED.obvs_venta,
      obvs_total = EXCLUDED.obvs_total,
      revenue_declared = EXCLUDED.revenue_declared,
      enriched_by = EXCLUDED.enriched_by;

    -- Build weekly data entry
    v_weekly_data := v_weekly_data || jsonb_build_object(
      'week_start', v_week_start,
      'tasks', jsonb_build_object(
        'demand', v_tasks_demand,
        'delivery', v_tasks_delivery,
        'cash', v_tasks_cash,
        'total', v_tasks_total
      ),
      'obvs', jsonb_build_object(
        'exploracion', v_obvs_exploracion,
        'validacion', v_obvs_validacion,
        'venta', v_obvs_venta,
        'total', v_obvs_total
      ),
      'revenue', v_revenue,
      'enriched_by', to_jsonb(v_enriched)
    );

    -- Collect last 4 weeks for trend calculation
    IF v_i < 4 THEN
      v_recent_tasks := array_append(v_recent_tasks, v_tasks_total);
      v_recent_obvs := array_append(v_recent_obvs, v_obvs_total);
      v_recent_revenue := array_append(v_recent_revenue, v_revenue);
    END IF;
  END LOOP;

  -- Calculate trend direction for each metric (compare first half vs second half of last 4 weeks)
  -- Index 0 = most recent, 3 = oldest of the 4-week window
  IF array_length(v_recent_tasks, 1) >= 4 THEN
    v_trends := jsonb_build_object(
      'tasks', CASE
        WHEN (v_recent_tasks[1] + v_recent_tasks[2]) > (v_recent_tasks[3] + v_recent_tasks[4]) * 1.15 THEN 'up'
        WHEN (v_recent_tasks[1] + v_recent_tasks[2]) < (v_recent_tasks[3] + v_recent_tasks[4]) * 0.85 THEN 'down'
        ELSE 'stable'
      END,
      'obvs', CASE
        WHEN (v_recent_obvs[1] + v_recent_obvs[2]) > (v_recent_obvs[3] + v_recent_obvs[4]) * 1.15 THEN 'up'
        WHEN (v_recent_obvs[1] + v_recent_obvs[2]) < (v_recent_obvs[3] + v_recent_obvs[4]) * 0.85 THEN 'down'
        ELSE 'stable'
      END,
      'revenue', CASE
        WHEN (v_recent_revenue[1] + v_recent_revenue[2]) > (v_recent_revenue[3] + v_recent_revenue[4]) * 1.15 THEN 'up'
        WHEN (v_recent_revenue[1] + v_recent_revenue[2]) < (v_recent_revenue[3] + v_recent_revenue[4]) * 0.85 THEN 'down'
        ELSE 'stable'
      END
    );
  ELSE
    v_trends := jsonb_build_object(
      'tasks', 'insufficient_data',
      'obvs', 'insufficient_data',
      'revenue', 'insufficient_data'
    );
  END IF;

  RETURN jsonb_build_object(
    'weekly', v_weekly_data,
    'trends', v_trends
  );
END;
$$;

COMMENT ON FUNCTION compute_execution_trends(UUID, INT) IS
  'F29 ER29.1+ER29.7: Computes weekly execution trends for a project. '
  'Groups tasks by function_type, OBVs by tipo, sums revenue from key_metrics. '
  'Enriches with integration_entities (Asana/Stripe/HubSpot) if available. '
  'Returns JSONB with weekly data + trend directions (up/stable/down).';


-- ---------------------------------------------------------------------------
-- 3. RPC compute_pipeline_velocity(project_id) — ER29.5
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compute_pipeline_velocity(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transitions JSONB;
  v_bottleneck JSONB;
BEGIN
  -- Calculate average days per pipeline status transition
  WITH transitions AS (
    SELECT
      h.old_status::TEXT AS from_status,
      h.new_status::TEXT AS to_status,
      EXTRACT(EPOCH FROM (h.created_at - LAG(h.created_at) OVER (
        PARTITION BY h.obv_id ORDER BY h.created_at
      ))) / 86400.0 AS days_in_status
    FROM obv_pipeline_history h
    JOIN obvs o ON o.id = h.obv_id
    WHERE o.project_id = p_project_id
      AND h.old_status IS NOT NULL
  ),
  aggregated AS (
    SELECT
      from_status,
      to_status,
      ROUND(AVG(days_in_status)::NUMERIC, 1) AS avg_days,
      COUNT(*) AS transition_count
    FROM transitions
    WHERE days_in_status IS NOT NULL AND days_in_status > 0
    GROUP BY from_status, to_status
    ORDER BY avg_days DESC
  )
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'from', from_status,
        'to', to_status,
        'avg_days', avg_days,
        'count', transition_count
      )
    ), '[]'::JSONB)
  INTO v_transitions
  FROM aggregated;

  -- Identify bottleneck (longest average transition)
  SELECT jsonb_build_object(
    'from', t->>'from',
    'to', t->>'to',
    'avg_days', (t->>'avg_days')::NUMERIC
  )
  INTO v_bottleneck
  FROM jsonb_array_elements(v_transitions) AS t
  ORDER BY (t->>'avg_days')::NUMERIC DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'transitions', v_transitions,
    'bottleneck', COALESCE(v_bottleneck, '{}'::JSONB)
  );
END;
$$;

COMMENT ON FUNCTION compute_pipeline_velocity(UUID) IS
  'F29 ER29.5: Calculates pipeline velocity from obv_pipeline_history. '
  'Returns average days per status transition and identifies bottleneck.';


-- ---------------------------------------------------------------------------
-- 4. ER29.9 — Add execution_trends to get_optimus_context
--    Uses CREATE OR REPLACE to extend the existing function.
-- ---------------------------------------------------------------------------

-- We add execution trends as a new key in the context packet.
-- Rather than rewriting the entire function, we create a wrapper that adds
-- the execution_trends data to the existing context.

CREATE OR REPLACE FUNCTION get_optimus_context_with_trends(
  p_project_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_context JSONB;
  v_trends JSONB;
  v_has_trends BOOLEAN;
BEGIN
  -- Get base context (use profile version if exists, else base)
  BEGIN
    v_context := get_optimus_context_with_profile(p_project_id, p_user_id);
  EXCEPTION WHEN undefined_function THEN
    v_context := get_optimus_context(p_project_id, p_user_id);
  END;

  -- Check if we have enough data for trends
  SELECT EXISTS(
    SELECT 1 FROM execution_trends
    WHERE project_id = p_project_id
    LIMIT 1
  ) INTO v_has_trends;

  IF v_has_trends THEN
    -- Get last 4 weeks trend summary
    SELECT jsonb_build_object(
      'tasks_trend', CASE
        WHEN SUM(CASE WHEN rn <= 2 THEN tasks_total ELSE 0 END) >
             SUM(CASE WHEN rn > 2 THEN tasks_total ELSE 0 END) * 1.15 THEN 'up'
        WHEN SUM(CASE WHEN rn <= 2 THEN tasks_total ELSE 0 END) <
             SUM(CASE WHEN rn > 2 THEN tasks_total ELSE 0 END) * 0.85 THEN 'down'
        ELSE 'stable'
      END,
      'obvs_trend', CASE
        WHEN SUM(CASE WHEN rn <= 2 THEN obvs_total ELSE 0 END) >
             SUM(CASE WHEN rn > 2 THEN obvs_total ELSE 0 END) * 1.15 THEN 'up'
        WHEN SUM(CASE WHEN rn <= 2 THEN obvs_total ELSE 0 END) <
             SUM(CASE WHEN rn > 2 THEN obvs_total ELSE 0 END) * 0.85 THEN 'down'
        ELSE 'stable'
      END,
      'revenue_trend', CASE
        WHEN SUM(CASE WHEN rn <= 2 THEN revenue_declared ELSE 0 END) >
             SUM(CASE WHEN rn > 2 THEN revenue_declared ELSE 0 END) * 1.15 THEN 'up'
        WHEN SUM(CASE WHEN rn <= 2 THEN revenue_declared ELSE 0 END) <
             SUM(CASE WHEN rn > 2 THEN revenue_declared ELSE 0 END) * 0.85 THEN 'down'
        ELSE 'stable'
      END,
      'weeks_with_data', COUNT(*),
      'enriched_providers', (
        SELECT COALESCE(
          array_agg(DISTINCT unnested ORDER BY unnested),
          ARRAY[]::TEXT[]
        )
        FROM execution_trends et2, UNNEST(et2.enriched_by) AS unnested
        WHERE et2.project_id = p_project_id
      )
    )
    INTO v_trends
    FROM (
      SELECT *, ROW_NUMBER() OVER (ORDER BY week_start DESC) AS rn
      FROM execution_trends
      WHERE project_id = p_project_id
      ORDER BY week_start DESC
      LIMIT 4
    ) sub;

    v_context := v_context || jsonb_build_object('execution_trends', v_trends);
  END IF;

  RETURN v_context;
END;
$$;

COMMENT ON FUNCTION get_optimus_context_with_trends(UUID, UUID) IS
  'F29 ER29.9: Wrapper that adds execution_trends to the Optimus context packet.';
