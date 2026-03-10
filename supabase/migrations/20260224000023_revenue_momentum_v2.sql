-- =============================================================================
-- MIGRACIÓN 00023 — E4.9: compute_revenue_momentum v2 con pipeline complement
--
-- Problema:
--   v1 usaba únicamente key_metrics.mrr (últimos 2 registros).
--   Proyectos en Fase 2 con leads activos en pipeline pero sin MRR registrado
--   aún obtenían 30 (neutral), sin reflejo de la señal comercial real.
--
-- Fix:
--   Añadir pipeline_boost como complemento aditivo conservador.
--   MRR sigue dominando — pipeline solo aporta hasta 20 puntos.
--
-- Fórmula v2:
--
--   late_stage_count = obvs con pipeline_status IN ('propuesta','negociacion')
--   valued_count     = late_stage con valor_potencial > 0
--
--   pipeline_boost (base):
--     0 leads → 0
--     1–2    → +5
--     3–4    → +10
--     5+     → +15
--   Bonus calidad: +5 si late_stage_count ≥ 2 AND valued_count ≥ 1
--   pipeline_boost = LEAST(20, base + bonus)
--
--   Con MRR disponible (v_mrr_curr IS NOT NULL):
--     LEAST(100, momentum_mrr + pipeline_boost)
--   Sin MRR (Phase 2+ sin key_metrics):
--     GREATEST(30, LEAST(40, 30 + pipeline_boost))
--
-- Notas de diseño:
--   - 'cerrado_ganado' excluido: ya contabilizado en MRR
--   - 'frio','tibio','hot' excluidos: señal insuficiente
--   - Bonus late_stage ≥ 2: evita que un solo lead sobre-infle la señal
--   - Cap sin MRR en 40: pipeline solo no puede dar señal fuerte
--   - Phase 1 sigue retornando 30 (neutral, sin cambio)
--
-- Fuentes verificadas:
--   obvs.pipeline_status  lead_status ENUM ('frio','tibio','hot',
--                                           'propuesta','negociacion',
--                                           'cerrado_ganado','cerrado_perdido')
--   obvs.valor_potencial  DECIMAL(12,2)
--   obvs.project_id       UUID (FK directo a projects)
--
-- Trigger añadido: trg_pipeline_probability — dispara run_probability_engine
--   cuando pipeline_status o valor_potencial cambia en obvs.
--   (Separado de trg_obvs_probability de migración 00007 para no modificarlo.)
-- =============================================================================

-- =============================================================================
-- 1. compute_revenue_momentum v2
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_revenue_momentum(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phase            SMALLINT;
  v_mrr_curr         NUMERIC;
  v_mrr_prev         NUMERIC;
  v_growth_pct       NUMERIC;
  v_momentum_mrr     NUMERIC;
  v_late_stage_count BIGINT;
  v_valued_count     BIGINT;
  v_pipeline_boost   SMALLINT := 0;
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

  -- -------------------------------------------------------------------------
  -- MRR trend (Phase 2+)
  -- Lógica idéntica a v1 — resultado almacenado en v_momentum_mrr
  -- -------------------------------------------------------------------------
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

  IF v_mrr_curr IS NULL OR v_mrr_prev IS NULL THEN
    v_momentum_mrr := 30;  -- neutral — sin datos suficientes para trend

  ELSIF v_mrr_curr > v_mrr_prev THEN
    IF v_mrr_prev = 0 THEN
      v_momentum_mrr := 100;  -- crecimiento desde cero = máximo
    ELSE
      v_growth_pct   := ((v_mrr_curr - v_mrr_prev) / v_mrr_prev) * 100.0;
      v_momentum_mrr := LEAST(100.0, 60.0 + (v_growth_pct * 0.40));
    END IF;

  ELSIF v_mrr_curr = v_mrr_prev THEN
    v_momentum_mrr := 40;

  ELSE
    -- Caída
    IF v_mrr_prev = 0 THEN
      v_momentum_mrr := 40;
    ELSE
      v_growth_pct   := ((v_mrr_prev - v_mrr_curr) / v_mrr_prev) * 100.0;
      v_momentum_mrr := GREATEST(0.0, 40.0 - (v_growth_pct * 0.50));
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- Pipeline boost (complemento CRM, Phase 2+)
  --
  -- Fuente: obvs.pipeline_status ∈ {'propuesta', 'negociacion'}
  -- Excluye 'cerrado_ganado' (ya en MRR), 'frio/tibio/hot' (señal débil).
  -- -------------------------------------------------------------------------
  SELECT
    COUNT(*) FILTER (WHERE pipeline_status IN ('propuesta', 'negociacion')),
    COUNT(*) FILTER (WHERE pipeline_status IN ('propuesta', 'negociacion')
                       AND valor_potencial  >  0)
  INTO v_late_stage_count, v_valued_count
  FROM obvs
  WHERE project_id = p_project_id;

  -- Base boost por volumen de late-stage leads
  v_pipeline_boost := CASE
    WHEN v_late_stage_count >= 5 THEN 15
    WHEN v_late_stage_count >= 3 THEN 10
    WHEN v_late_stage_count >= 1 THEN  5
    ELSE 0
  END;

  -- Bonus por calidad: valor declarado en ≥2 leads late-stage
  -- Condición late_stage_count ≥ 2: evita que un solo lead sobre-infle
  IF v_late_stage_count >= 2 AND v_valued_count >= 1 THEN
    v_pipeline_boost := v_pipeline_boost + 5;
  END IF;

  -- Cap: pipeline no puede aportar más de 20 puntos
  v_pipeline_boost := LEAST(20, v_pipeline_boost);

  -- -------------------------------------------------------------------------
  -- Combinación MRR + Pipeline
  --
  -- MRR disponible (≥1 registro): MRR domina, pipeline es aditivo
  -- Sin MRR: señal pura de pipeline, capped en 40 (sin MRR no hay señal fuerte)
  -- -------------------------------------------------------------------------
  IF v_mrr_curr IS NOT NULL THEN
    RETURN LEAST(100.0, v_momentum_mrr + CAST(v_pipeline_boost AS NUMERIC));
  ELSE
    RETURN GREATEST(30.0, LEAST(40.0, 30.0 + CAST(v_pipeline_boost AS NUMERIC)));
  END IF;

END;
$$;

COMMENT ON FUNCTION compute_revenue_momentum(UUID) IS
  'Momentum de revenue v2. Phase 1=30. Phase 2+: MRR trend (crecimiento→60+(g×0.4) cap 100, estable→40, caída→MAX(0,40-(d×0.5))) + pipeline_boost (leads en propuesta/negociacion: 1-2→+5, 3-4→+10, 5+→+15; bonus +5 si ≥2 leads con valor_potencial; cap 20). MRR disponible: LEAST(100, mrr+boost). Sin MRR: GREATEST(30, LEAST(40, 30+boost)).';

-- =============================================================================
-- 2. Trigger: pipeline_status / valor_potencial → recalcular probabilidad
--
-- Separado de trg_obvs_probability (migración 00007) para no modificarlo.
-- Solo dispara en INSERT o UPDATE de pipeline_status / valor_potencial.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_pipeline_probability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_probability_engine(NEW.project_id, 'acceleration');

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status
    OR OLD.valor_potencial IS DISTINCT FROM NEW.valor_potencial
    THEN
      PERFORM run_probability_engine(NEW.project_id, 'acceleration');
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_pipeline_probability
  AFTER INSERT OR UPDATE OF pipeline_status, valor_potencial
  ON obvs
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_pipeline_probability();
