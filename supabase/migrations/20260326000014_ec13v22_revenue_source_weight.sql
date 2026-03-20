-- EC13.V2.2 — Revenue momentum con SOURCE_WEIGHTS del sistema de evidencia
--
-- Cierra EC13.9: el peso ×0.7 para revenue no verificable ahora usa SOURCE_WEIGHTS
-- de evidence.ts en lugar de un multiplicador binario hardcodeado.
--
-- Lógica:
--   Stripe activo    → source_weight = 1.0  (observed — dato verificado por pasarela)
--   Holded activo    → source_weight = 0.9  (observed — dato contable verificado)
--   HubSpot activo   → source_weight = 0.8  (declarado en CRM)
--   Sin integración  → source_weight = 0.6  (user_manual — declaración del founder)
--
-- El score base ya calculado se multiplica por source_weight antes de retornar.
-- Esto es coherente con SOURCE_WEIGHTS en src/lib/evidence.ts.

CREATE OR REPLACE FUNCTION compute_revenue_momentum(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phase         SMALLINT;
  v_mrr_curr      NUMERIC;
  v_mrr_prev      NUMERIC;
  v_growth_pct    NUMERIC;
  v_base_score    NUMERIC;
  v_source_weight NUMERIC;  -- EC13.V2.2: peso según fuente del dato de revenue
BEGIN
  -- Fase actual
  SELECT current_phase INTO v_phase
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  v_phase := COALESCE(v_phase, 1);

  -- Phase 1: neutral — sin revenue esperado
  IF v_phase = 1 THEN
    RETURN 30;
  END IF;

  -- Phase 2+: comparar los dos MRR más recientes de key_metrics
  SELECT mrr INTO v_mrr_curr
  FROM   key_metrics
  WHERE  project_id = p_project_id
  ORDER  BY date DESC
  LIMIT  1 OFFSET 0;

  SELECT mrr INTO v_mrr_prev
  FROM   key_metrics
  WHERE  project_id = p_project_id
  ORDER  BY date DESC
  LIMIT  1 OFFSET 1;

  -- Sin datos suficientes → neutral
  IF v_mrr_curr IS NULL OR v_mrr_prev IS NULL THEN
    RETURN 30;
  END IF;

  -- ── EC13.V2.2: determinar source_weight según integración activa ───────────
  -- Prioridad: Stripe > Holded > HubSpot > manual
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM integration_connections
      WHERE project_id = p_project_id AND provider = 'stripe' AND status = 'active'
    ) THEN 1.0
    WHEN EXISTS (
      SELECT 1 FROM integration_connections
      WHERE project_id = p_project_id AND provider = 'holded' AND status = 'active'
    ) THEN 0.9
    WHEN EXISTS (
      SELECT 1 FROM integration_connections
      WHERE project_id = p_project_id AND provider = 'hubspot' AND status = 'active'
    ) THEN 0.8
    ELSE 0.6  -- user_manual: declaración del founder sin verificación externa
  END INTO v_source_weight;

  -- ── Score base (lógica original) ──────────────────────────────────────────
  IF v_mrr_curr > v_mrr_prev THEN
    IF v_mrr_prev = 0 THEN
      v_base_score := 100;
    ELSE
      v_growth_pct := ((v_mrr_curr - v_mrr_prev) / v_mrr_prev) * 100.0;
      v_base_score := LEAST(100.0, 60.0 + (v_growth_pct * 0.40));
    END IF;
  ELSIF v_mrr_curr = v_mrr_prev THEN
    v_base_score := 40;
  ELSE
    IF v_mrr_prev = 0 THEN
      v_base_score := 40;
    ELSE
      v_growth_pct := ((v_mrr_prev - v_mrr_curr) / v_mrr_prev) * 100.0;
      v_base_score := GREATEST(0.0, 40.0 - (v_growth_pct * 0.50));
    END IF;
  END IF;

  -- ── Aplicar source_weight (EC13.V2.2) ─────────────────────────────────────
  -- Si dato es manual (0.6), un MRR de 100 → 60 efectivo.
  -- Stripe (1.0) no penaliza.
  RETURN ROUND(v_base_score * v_source_weight, 2);
END;
$$;

COMMENT ON FUNCTION compute_revenue_momentum(UUID) IS
  'EC13.V2.2: Cierra EC13.9. Momentum de revenue con SOURCE_WEIGHTS del sistema de evidencia. '
  'Phase 1=30. Phase 2+: score_base × source_weight donde weight=1.0(Stripe)/0.9(Holded)/0.8(HubSpot)/0.6(manual). '
  'Coherente con src/lib/evidence.ts SOURCE_WEIGHTS.';
