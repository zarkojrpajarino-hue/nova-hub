-- =============================================================================
-- F31 Upgrades — Micro-deltas semanales (Weekly Pulse RPC)
--
-- compute_cycle_weekly_pulse(p_cycle_id UUID) → JSONB
-- Returns: { week_number, total_weeks, by_category, committed_categories, at_risk_categories }
--
-- "at_risk" = committed category with 0 activity after 50% of cycle elapsed.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_cycle_weekly_pulse(p_cycle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle RECORD;
  v_now DATE := CURRENT_DATE;
  v_total_days INTEGER;
  v_elapsed_days INTEGER;
  v_total_weeks INTEGER;
  v_week_number INTEGER;
  v_by_category JSONB;
  v_committed_categories TEXT[];
  v_at_risk TEXT[] := '{}';
  v_cat TEXT;
  v_task_key TEXT;
  v_cat_count INTEGER;
BEGIN
  -- Get cycle data
  SELECT id, project_id, start_date, end_date, commitments_json
  INTO v_cycle
  FROM strategic_cycles
  WHERE id = p_cycle_id
    AND status = 'active';

  IF v_cycle IS NULL THEN
    RETURN jsonb_build_object('error', 'cycle_not_found_or_not_active');
  END IF;

  -- Calculate week numbers
  v_total_days := GREATEST(v_cycle.end_date - v_cycle.start_date, 1);
  v_elapsed_days := GREATEST(LEAST(v_now - v_cycle.start_date, v_total_days), 0);
  v_total_weeks := GREATEST(CEIL(v_total_days / 7.0)::integer, 1);
  v_week_number := GREATEST(CEIL(v_elapsed_days / 7.0)::integer, 1);

  -- Tasks completed during cycle period, grouped by function_type
  SELECT COALESCE(jsonb_object_agg(cat, cnt), '{}'::jsonb)
  INTO v_by_category
  FROM (
    SELECT
      COALESCE(function_type, 'unclassified') AS cat,
      COUNT(*) AS cnt
    FROM tasks
    WHERE project_id = v_cycle.project_id
      AND completed_at IS NOT NULL
      AND completed_at::date BETWEEN v_cycle.start_date AND v_now
    GROUP BY COALESCE(function_type, 'unclassified')
  ) sub;

  -- Also count tasks created (not just completed) as activity signal
  -- Union with OBVs in the period for broader activity picture
  DECLARE
    v_obvs_by_cat JSONB;
  BEGIN
    SELECT COALESCE(jsonb_object_agg(cat, cnt), '{}'::jsonb)
    INTO v_obvs_by_cat
    FROM (
      SELECT
        CASE
          WHEN tipo IN ('exploración', 'validación') THEN 'demand'
          WHEN tipo = 'venta' THEN 'cash'
          WHEN tipo = 'factura' THEN 'cash'
          ELSE 'delivery'
        END AS cat,
        COUNT(*) AS cnt
      FROM obvs
      WHERE project_id = v_cycle.project_id
        AND fecha BETWEEN v_cycle.start_date AND v_now
        AND status != 'rejected'
      GROUP BY CASE
        WHEN tipo IN ('exploración', 'validación') THEN 'demand'
        WHEN tipo = 'venta' THEN 'cash'
        WHEN tipo = 'factura' THEN 'cash'
        ELSE 'delivery'
      END
    ) sub;

    -- Merge OBV counts into task counts
    FOR v_cat IN SELECT jsonb_object_keys(v_obvs_by_cat) LOOP
      v_by_category := jsonb_set(
        v_by_category,
        ARRAY[v_cat],
        to_jsonb(COALESCE((v_by_category->>v_cat)::integer, 0) + COALESCE((v_obvs_by_cat->>v_cat)::integer, 0))
      );
    END LOOP;
  END;

  -- Extract committed categories
  SELECT COALESCE(array_agg(DISTINCT elem->>'category'), '{}')
  INTO v_committed_categories
  FROM jsonb_array_elements(COALESCE(v_cycle.commitments_json, '[]'::jsonb)) AS elem
  WHERE elem->>'category' IS NOT NULL;

  -- Determine at-risk categories: committed but 0 activity after 50% of cycle
  IF v_elapsed_days > v_total_days * 0.5 AND v_committed_categories IS NOT NULL THEN
    FOREACH v_cat IN ARRAY v_committed_categories LOOP
      -- Map 'team' → 'support' for task lookup
      v_task_key := CASE WHEN v_cat = 'team' THEN 'support' ELSE v_cat END;
      v_cat_count := COALESCE((v_by_category->>v_task_key)::integer, 0);
      -- Also check the unmapped key (OBVs use demand/cash/delivery directly)
      IF v_cat != v_task_key THEN
        v_cat_count := v_cat_count + COALESCE((v_by_category->>v_cat)::integer, 0);
      END IF;

      IF v_cat_count = 0 THEN
        v_at_risk := array_append(v_at_risk, v_cat);
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'week_number', v_week_number,
    'total_weeks', v_total_weeks,
    'by_category', v_by_category,
    'committed_categories', to_jsonb(v_committed_categories),
    'at_risk_categories', to_jsonb(v_at_risk)
  );
END;
$$;

COMMENT ON FUNCTION compute_cycle_weekly_pulse(UUID) IS
  'F31 Upgrade 1: Computes weekly pulse for an active cycle. '
  'Returns week progress, activity by category (tasks+OBVs), and at-risk committed categories.';
