-- =============================================================================
-- MIGRATION F29 Upgrade 5 — Seasonality Detection
--
-- Extends compute_execution_trends to detect:
--   - Day-of-week pattern (activity drops on specific days)
--   - Monthly pattern (week 1 vs week 4 differ significantly)
-- Minimum data: 8 weeks to detect any pattern.
-- Returns additional field: seasonality { day_pattern?, weekly_pattern? }
-- =============================================================================

-- We CREATE OR REPLACE the existing function, adding seasonality detection
-- at the end of the computation.

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
  v_seasonality JSONB := '{}'::JSONB;
  -- For trend calculation
  v_recent_tasks INT[];
  v_recent_obvs INT[];
  v_recent_revenue NUMERIC[];
  -- Integration enrichment
  v_asana_tasks INT;
  v_stripe_revenue NUMERIC;
  v_hubspot_deals INT;
  -- Seasonality
  v_d1 NUMERIC; v_d2 NUMERIC; v_d3 NUMERIC; v_d4 NUMERIC;
  v_d5 NUMERIC; v_d6 NUMERIC; v_d7 NUMERIC;
  v_day_names TEXT[] := ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  v_min_day_idx INT;
  v_min_day_val NUMERIC;
  v_avg_day_val NUMERIC;
  v_week1_avg NUMERIC;
  v_week4_avg NUMERIC;
  v_total_weeks INT;
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

  -- Calculate trend direction for each metric
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

  -- ==========================================================================
  -- UPGRADE 5: Seasonality detection (requires >= 8 weeks of data)
  -- ==========================================================================
  v_total_weeks := LEAST(p_weeks, (SELECT COUNT(*) FROM execution_trends WHERE project_id = p_project_id));

  IF v_total_weeks >= 8 THEN
    -- Day-of-week pattern: count tasks completed per day of week (0=Mon..6=Sun)
    v_d1 := 0; v_d2 := 0; v_d3 := 0; v_d4 := 0; v_d5 := 0; v_d6 := 0; v_d7 := 0;

    SELECT
      COALESCE(SUM(CASE WHEN EXTRACT(ISODOW FROM completed_at) = 1 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN EXTRACT(ISODOW FROM completed_at) = 2 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN EXTRACT(ISODOW FROM completed_at) = 3 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN EXTRACT(ISODOW FROM completed_at) = 4 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN EXTRACT(ISODOW FROM completed_at) = 5 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN EXTRACT(ISODOW FROM completed_at) = 6 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN EXTRACT(ISODOW FROM completed_at) = 7 THEN 1 ELSE 0 END), 0)
    INTO v_d1, v_d2, v_d3, v_d4, v_d5, v_d6, v_d7
    FROM tasks
    WHERE project_id = p_project_id
      AND status = 'done'
      AND completed_at >= (CURRENT_DATE - (v_total_weeks * 7) * INTERVAL '1 day');

    -- Find day with lowest activity
    v_avg_day_val := (v_d1+v_d2+v_d3+v_d4+v_d5+v_d6+v_d7) / 7.0;
    v_min_day_idx := 1;
    v_min_day_val := v_d1;
    IF v_d2 < v_min_day_val THEN v_min_day_val := v_d2; v_min_day_idx := 2; END IF;
    IF v_d3 < v_min_day_val THEN v_min_day_val := v_d3; v_min_day_idx := 3; END IF;
    IF v_d4 < v_min_day_val THEN v_min_day_val := v_d4; v_min_day_idx := 4; END IF;
    IF v_d5 < v_min_day_val THEN v_min_day_val := v_d5; v_min_day_idx := 5; END IF;
    IF v_d6 < v_min_day_val THEN v_min_day_val := v_d6; v_min_day_idx := 6; END IF;
    IF v_d7 < v_min_day_val THEN v_min_day_val := v_d7; v_min_day_idx := 7; END IF;

    -- Only report if the drop is significant (< 50% of average)
    IF v_avg_day_val > 0 AND v_min_day_val < v_avg_day_val * 0.5 THEN
      v_seasonality := v_seasonality || jsonb_build_object(
        'day_pattern', v_day_names[v_min_day_idx]
      );
    END IF;

    -- Monthly pattern: compare week 1 vs week 4 of months
    SELECT
      COALESCE(AVG(CASE WHEN EXTRACT(DAY FROM week_start) <= 7 THEN tasks_total END), 0),
      COALESCE(AVG(CASE WHEN EXTRACT(DAY FROM week_start) >= 22 THEN tasks_total END), 0)
    INTO v_week1_avg, v_week4_avg
    FROM execution_trends
    WHERE project_id = p_project_id;

    -- Report if difference is >= 50%
    IF v_week1_avg > 0 AND v_week4_avg > 0 THEN
      IF v_week1_avg > v_week4_avg * 1.5 THEN
        v_seasonality := v_seasonality || jsonb_build_object(
          'weekly_pattern', 'week1_higher'
        );
      ELSIF v_week4_avg > v_week1_avg * 1.5 THEN
        v_seasonality := v_seasonality || jsonb_build_object(
          'weekly_pattern', 'week4_higher'
        );
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'weekly', v_weekly_data,
    'trends', v_trends,
    'seasonality', v_seasonality
  );
END;
$$;

COMMENT ON FUNCTION compute_execution_trends(UUID, INT) IS
  'F29 ER29.1+ER29.7+Upgrade5: Computes weekly execution trends for a project. '
  'Groups tasks by function_type, OBVs by tipo, sums revenue from key_metrics. '
  'Enriches with integration_entities (Asana/Stripe/HubSpot) if available. '
  'Detects seasonality patterns (day-of-week, monthly) with >= 8 weeks data. '
  'Returns JSONB with weekly data + trend directions + seasonality.';


-- ---------------------------------------------------------------------------
-- UPGRADE 3 — RPC compute_bottleneck_by_tipo
-- Groups obv_pipeline_history by OBV tipo for a specific bottleneck transition.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compute_bottleneck_by_tipo(
  p_project_id UUID,
  p_from_status TEXT,
  p_to_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH transitions AS (
    SELECT
      o.tipo::TEXT AS obv_tipo,
      EXTRACT(EPOCH FROM (h.created_at - LAG(h.created_at) OVER (
        PARTITION BY h.obv_id ORDER BY h.created_at
      ))) / 86400.0 AS days_in_status
    FROM obv_pipeline_history h
    JOIN obvs o ON o.id = h.obv_id
    WHERE o.project_id = p_project_id
      AND h.old_status::TEXT = p_from_status
      AND h.new_status::TEXT = p_to_status
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'tipo', obv_tipo,
      'avg_days', ROUND(AVG(days_in_status)::NUMERIC, 1),
      'count', COUNT(*)
    )
  ), '[]'::JSONB)
  INTO v_result
  FROM transitions
  WHERE days_in_status IS NOT NULL AND days_in_status > 0
  GROUP BY obv_tipo
  ORDER BY AVG(days_in_status) DESC;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

COMMENT ON FUNCTION compute_bottleneck_by_tipo(UUID, TEXT, TEXT) IS
  'F29 Upgrade 3: Groups bottleneck transition times by OBV tipo.';
