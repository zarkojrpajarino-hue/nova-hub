-- =============================================================================
-- MIGRACIÓN 20260326000001 — AUD.A.1: EconProfile Incoherences → Phase Engine
--
-- Problema: run_economic_profile_engine() detecta hasta 4 incoherencias del
-- modelo de negocio (saas_transactional, subscription_no_mrr, etc.) y las
-- escribe en project_economic_profile.incoherences, pero run_phase_engine()
-- no las consume. Un founder con modelo SaaS sin MRR desde hace 12 semanas
-- sigue avanzando sin penalización.
--
-- Solución: BEFORE trigger en project_phase_state.
--   - Aplica en Phase 2+ (Phase 1 no tiene perfil económico relevante).
--   - Penaliza -10 pts por incoherencia activa, cap en -30 (3 incoherencias max).
--   - Sin modificar run_phase_engine() — el trigger se ejecuta en cada UPSERT.
--   - Sin recursión: BEFORE trigger modifica NEW antes de escribir, no re-dispara.
--
-- Incoherencias definidas en E4.19 (migration 00024):
--   1. saas_transactional       — model_type='saas' AND revenue_type='transactional'
--   2. subscription_no_mrr      — pricing_model='subscription' AND mrr=0 en fase 2+ ≥12w
--   3. high_ticket_no_pipeline  — avg_ticket≥300 AND cycle≥14d AND sin late-stage pipeline ≥8w
--   4. concentrated_scalable    — top_client_revenue_percent≥60 AND model scalable
--
-- Ejemplo: Phase 3, score=72, 2 incoherencias → effective_score=52 (friction)
-- Ejemplo: Phase 2, score=80, 1 incoherencia → effective_score=70 (justo bajo umbral 75)
-- =============================================================================

-- =============================================================================
-- 1. Función auxiliar: compute_econ_incoherence_penalty(project_id) → NUMERIC
--
-- Lee project_economic_profile.incoherences (JSONB array).
-- Retorna: 0 si sin incoherencias, 10×N si N incoherencias (cap en 30).
-- Nunca NULL.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_econ_incoherence_penalty(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(jsonb_array_length(incoherences), 0)
  INTO   v_count
  FROM   project_economic_profile
  WHERE  project_id = p_project_id;

  -- No existe perfil o sin incoherencias → sin penalización
  IF NOT FOUND OR v_count = 0 THEN
    RETURN 0.0;
  END IF;

  -- -10 pts por incoherencia, cap en 30 (máx 3 incoherencias cuentan)
  RETURN LEAST(30.0, v_count::NUMERIC * 10.0);
END;
$$;

COMMENT ON FUNCTION compute_econ_incoherence_penalty(UUID) IS
  'AUD.A.1: Penalización de phase_score por incoherencias en project_economic_profile. '
  '-10 pts por incoherencia activa, cap en -30. Retorna 0 si sin perfil o sin incoherencias. '
  'Usado por trg_phase_state_econ_penalty (BEFORE trigger en project_phase_state).';

-- =============================================================================
-- 2. Función del trigger: trg_fn_apply_econ_penalty()
--
-- BEFORE INSERT OR UPDATE → modifica NEW.phase_score antes de escribir.
-- Solo actúa en Phase 2+ y cuando hay penalización real (> 0).
-- Idempotente: si project_economic_profile no existe → penalty = 0 → sin cambio.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_apply_econ_penalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_penalty NUMERIC;
BEGIN
  -- Solo aplica a Phase 2+ (Phase 1: perfil económico no es relevante para el score)
  IF NEW.current_phase IS NULL OR NEW.current_phase < 2 THEN
    RETURN NEW;
  END IF;

  -- Si phase_score es NULL (insuficiente data), no hay nada que penalizar
  IF NEW.phase_score IS NULL THEN
    RETURN NEW;
  END IF;

  v_penalty := compute_econ_incoherence_penalty(NEW.project_id);

  IF v_penalty > 0 THEN
    NEW.phase_score := GREATEST(0.0, NEW.phase_score - v_penalty);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_fn_apply_econ_penalty() IS
  'AUD.A.1: Trigger function — aplica penalización de incoherencias de EconProfile al phase_score. '
  'BEFORE INSERT OR UPDATE → modifica NEW.phase_score sin recursión. Phase 1 siempre ignorado.';

-- =============================================================================
-- 3. Trigger en project_phase_state
--
-- BEFORE INSERT OR UPDATE para actuar en cada run de run_phase_engine().
-- La función retorna NEW modificado, que PostgreSQL usa como valor final a escribir.
-- No hay recursión porque el trigger no hace UPDATE — solo modifica NEW en memoria.
-- =============================================================================

DROP TRIGGER IF EXISTS trg_phase_state_econ_penalty ON project_phase_state;

CREATE TRIGGER trg_phase_state_econ_penalty
  BEFORE INSERT OR UPDATE OF phase_score ON project_phase_state
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_apply_econ_penalty();

COMMENT ON TRIGGER trg_phase_state_econ_penalty ON project_phase_state IS
  'AUD.A.1: Aplica penalización EconProfile al phase_score en cada run del Phase Engine. '
  'BEFORE trigger → sin recursión. Phase 2+. -10 pts/incoherencia, cap -30.';
