-- =============================================================================
-- MIGRACIÓN 00016 — PATCH: Fix O3.1 LIMIT 4 ordering bug
--
-- Problema (migration 00015):
--   count_stable_revenue_months tenía LIMIT 4 en la subquery interna sin ORDER BY.
--   Cuando hay ≥5 meses calendario en la ventana (CURRENT_DATE - 4 months puede
--   abarcar hasta 5 meses calendario), el LIMIT 4 sin orden podría descartar el
--   mes más reciente en lugar de los más antiguos.
--
-- Fix:
--   Añadir ORDER BY month_dt DESC antes del LIMIT 4 en la subquery interna,
--   garantizando que siempre se toman los 4 meses más recientes con MRR > 0.
--   La ARRAY_AGG exterior mantiene ORDER BY month_dt ASC (oldest first)
--   para que el algoritmo de estabilidad funcione correctamente (M1=oldest).
--
-- Sin cambios en firma, lógica de estabilidad ni ninguna otra función.
-- Solo afecta a count_stable_revenue_months.
-- =============================================================================

CREATE OR REPLACE FUNCTION count_stable_revenue_months(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr_arr  NUMERIC[];
  v_n        INTEGER;
  v_stable   INTEGER := 0;
  i          INTEGER;
  v_threshold NUMERIC;
BEGIN
  -- Última entrada de MRR (mrr > 0) por mes calendario, últimos 4 meses más recientes.
  -- ORDER BY month_dt DESC + LIMIT 4 garantiza los 4 meses más recientes,
  -- aunque CURRENT_DATE - 4 months abarque 5 meses calendario.
  -- La ARRAY_AGG exterior ordena ASC (oldest first) para el algoritmo M1..M4.
  SELECT ARRAY_AGG(monthly_mrr ORDER BY month_dt ASC)
  INTO   v_mrr_arr
  FROM (
    SELECT
      date_trunc('month', date)::date                   AS month_dt,
      (ARRAY_AGG(mrr ORDER BY date DESC NULLS LAST))[1] AS monthly_mrr
    FROM   key_metrics
    WHERE  project_id = p_project_id
      AND  date      >= (CURRENT_DATE - INTERVAL '4 months')::date
      AND  mrr        > 0
    GROUP  BY date_trunc('month', date)::date
    ORDER  BY month_dt DESC   -- FIX: tomar los 4 meses MÁS RECIENTES
    LIMIT  4
  ) sub;

  v_n := COALESCE(array_length(v_mrr_arr, 1), 0);

  IF v_n = 0 THEN
    RETURN 0;
  END IF;

  FOR i IN 1..v_n LOOP
    IF i = 1 THEN
      v_stable := v_stable + 1;                           -- M1: siempre PASS

    ELSIF i = 2 THEN
      IF v_mrr_arr[2] >= 0.75 * v_mrr_arr[1] THEN
        v_stable := v_stable + 1;
      END IF;

    ELSE
      -- M3+: >= 0.75 × AVG(mrr[i-2], mrr[i-1])
      v_threshold := 0.75 * ((v_mrr_arr[i-2] + v_mrr_arr[i-1]) / 2.0);
      IF v_mrr_arr[i] >= v_threshold THEN
        v_stable := v_stable + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_stable;
END;
$$;

COMMENT ON FUNCTION count_stable_revenue_months(UUID) IS
  'Cuenta meses con MRR estable en ventana 4 meses MÁS RECIENTES. M1=PASS, M2>=0.75×M1, M3+>=0.75×AVG(M-1,M-2). Fuente: key_metrics.mrr>0. Simplificado v1: sin check cash_flow mensual. PATCH 00016: corrige ORDER BY month_dt DESC antes de LIMIT 4.';
