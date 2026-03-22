-- F31 v1 fix: compute_cycle_delta reads commitments from PREVIOUS cycle, not current.
--
-- Storage model:
--   Cycle N closes → founder writes commitments → saved on cycle N
--   compute_cycle_delta(N+1) reads commitments from cycle N (previous)
--   First cycle has no delta (no previous commitments) — correct behavior.

CREATE OR REPLACE FUNCTION compute_cycle_delta(p_cycle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle RECORD;
  v_prev_commitments JSONB;
  v_tasks_by_cat JSONB;
  v_obvs_total INTEGER;
  v_obvs_by_type JSONB;
  v_revenue_total NUMERIC;
  v_committed_dist JSONB;
  v_result JSONB;
BEGIN
  -- Get current cycle data
  SELECT id, project_id, start_date, end_date, cycle_index
  INTO v_cycle
  FROM strategic_cycles
  WHERE id = p_cycle_id;

  IF v_cycle IS NULL THEN
    RETURN jsonb_build_object('error', 'cycle_not_found');
  END IF;

  -- Read commitments from PREVIOUS cycle (N-1), not current
  -- These are the commitments the founder made when closing cycle N-1
  SELECT commitments_json
  INTO v_prev_commitments
  FROM strategic_cycles
  WHERE project_id = v_cycle.project_id
    AND cycle_index = v_cycle.cycle_index - 1;

  -- If no previous cycle or no commitments, use empty array
  v_prev_commitments := COALESCE(v_prev_commitments, '[]'::jsonb);

  -- Tasks by function_type (category)
  -- Mapping: function_type values → demand, delivery, cash, support
  -- 'support' maps to 'team' in UI (documented here and in CycleDeltaCard.tsx)
  SELECT COALESCE(jsonb_object_agg(cat, cnt), '{}'::jsonb)
  INTO v_tasks_by_cat
  FROM (
    SELECT
      COALESCE(function_type, 'unclassified') AS cat,
      COUNT(*) AS cnt
    FROM tasks
    WHERE project_id = v_cycle.project_id
      AND completed_at IS NOT NULL
      AND completed_at::date BETWEEN v_cycle.start_date AND v_cycle.end_date
    GROUP BY COALESCE(function_type, 'unclassified')
  ) sub;

  -- OBVs total and revenue
  SELECT COUNT(*), COALESCE(SUM(CASE WHEN es_venta THEN facturacion ELSE 0 END), 0)
  INTO v_obvs_total, v_revenue_total
  FROM obvs
  WHERE project_id = v_cycle.project_id
    AND fecha BETWEEN v_cycle.start_date AND v_cycle.end_date
    AND status != 'rejected';

  -- OBVs by type
  SELECT COALESCE(jsonb_object_agg(tipo, cnt), '{}'::jsonb)
  INTO v_obvs_by_type
  FROM (
    SELECT tipo::text, COUNT(*) AS cnt
    FROM obvs
    WHERE project_id = v_cycle.project_id
      AND fecha BETWEEN v_cycle.start_date AND v_cycle.end_date
      AND status != 'rejected'
    GROUP BY tipo
  ) sub;

  -- Committed distribution (from PREVIOUS cycle's commitments)
  SELECT COALESCE(jsonb_object_agg(cat, pct), '{}'::jsonb)
  INTO v_committed_dist
  FROM (
    SELECT
      elem->>'category' AS cat,
      ROUND(COUNT(*)::numeric / GREATEST(jsonb_array_length(v_prev_commitments), 1) * 100) AS pct
    FROM jsonb_array_elements(v_prev_commitments) AS elem
    WHERE elem->>'category' IS NOT NULL
    GROUP BY elem->>'category'
  ) sub;

  -- Build result — raw data, frontend interprets
  v_result := jsonb_build_object(
    'cycle_id', v_cycle.id,
    'start_date', v_cycle.start_date,
    'end_date', v_cycle.end_date,
    'cycle_days', v_cycle.end_date - v_cycle.start_date,
    'tasks_total', (SELECT COALESCE(SUM((val)::integer), 0) FROM jsonb_each_text(v_tasks_by_cat) AS t(key, val)),
    'by_category', v_tasks_by_cat,
    'obvs_total', v_obvs_total,
    'obvs_by_type', v_obvs_by_type,
    'revenue_total', v_revenue_total,
    'commitments', v_prev_commitments,
    'committed_distribution', v_committed_dist
  );

  RETURN v_result;
END;
$$;
