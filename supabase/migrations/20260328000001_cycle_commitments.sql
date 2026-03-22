-- F31 v1: Ciclo Intelligence — Compromisos del founder al iniciar ciclo
-- Permite comparar lo que prometió vs lo que hizo al cerrar el ciclo.

-- Columna de compromisos en strategic_cycles
-- Formato: [{text, category, measurable_target?}]
-- category: 'demand' | 'delivery' | 'cash' | 'team'
ALTER TABLE strategic_cycles
ADD COLUMN IF NOT EXISTS commitments_json JSONB DEFAULT '[]'::jsonb;

-- Comentario para documentar el formato esperado
COMMENT ON COLUMN strategic_cycles.commitments_json IS
'Array de compromisos del founder al iniciar el ciclo. Formato: [{text: string, category: "demand"|"delivery"|"cash"|"team", measurable_target?: string}]. Se compara con ejecución real (tasks + obvs) al cerrar.';

-- RPC: compute_cycle_delta
-- Devuelve datos brutos de ejecución del ciclo vs compromisos.
-- Frontend interpreta (colores, textos, alertas).
CREATE OR REPLACE FUNCTION compute_cycle_delta(p_cycle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle RECORD;
  v_tasks_by_cat JSONB;
  v_obvs_total INTEGER;
  v_obvs_by_type JSONB;
  v_revenue_total NUMERIC;
  v_committed_dist JSONB;
  v_result JSONB;
BEGIN
  -- Get cycle data
  SELECT id, project_id, start_date, end_date, commitments_json
  INTO v_cycle
  FROM strategic_cycles
  WHERE id = p_cycle_id;

  IF v_cycle IS NULL THEN
    RETURN jsonb_build_object('error', 'cycle_not_found');
  END IF;

  -- Tasks by function_type (category)
  -- Mapping: function_type values → demand, delivery, cash, support
  -- 'support' maps to 'team' in UI (documented here)
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

  -- OBVs total and by type
  SELECT COUNT(*), COALESCE(SUM(CASE WHEN es_venta THEN facturacion ELSE 0 END), 0)
  INTO v_obvs_total, v_revenue_total
  FROM obvs
  WHERE project_id = v_cycle.project_id
    AND fecha BETWEEN v_cycle.start_date AND v_cycle.end_date
    AND status != 'rejected';

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

  -- Committed distribution (from commitments_json)
  -- Calculate % per category from the commitments array
  SELECT COALESCE(jsonb_object_agg(cat, pct), '{}'::jsonb)
  INTO v_committed_dist
  FROM (
    SELECT
      elem->>'category' AS cat,
      ROUND(COUNT(*)::numeric / GREATEST(jsonb_array_length(v_cycle.commitments_json), 1) * 100) AS pct
    FROM jsonb_array_elements(COALESCE(v_cycle.commitments_json, '[]'::jsonb)) AS elem
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
    'commitments', COALESCE(v_cycle.commitments_json, '[]'::jsonb),
    'committed_distribution', v_committed_dist
  );

  RETURN v_result;
END;
$$;
