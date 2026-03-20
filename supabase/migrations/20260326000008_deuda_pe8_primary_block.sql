-- =============================================================================
-- MIGRACIÓN 20260326000008 — DEUDA.PE.8 / AUD.B.2: primary_block en SQL
--
-- Problema (AUD.B.2 / DEUDA.PE.8): la detección del bloqueo principal del
-- proyecto se hacía client-side en reentry.ts mediante derivePrimaryBlock(),
-- una función heurística que lee engineData.coverage y engineData.risk desde
-- el estado del cliente. Esta lógica:
--   a) No es authoritative — puede divergir de lo que el engine calcula.
--   b) Solo se ejecuta cuando ReentrySurface renderiza — no hay valor persistido.
--   c) Duplica lógica entre frontend y backend.
--
-- Solución:
--   1. ADD COLUMN primary_block TEXT DEFAULT 'none' en project_phase_state.
--   2. Función SQL compute_primary_block(UUID) — misma lógica que derivePrimaryBlock().
--      Prioridad: traction_block (riesgo) > clarity_block (demanda) > structural_block > none.
--   3. Triggers AFTER INSERT/UPDATE en project_risk_score y project_function_coverage
--      que actualizan primary_block automáticamente.
--   4. Backfill inicial para todos los proyectos con data.
--
-- Después de esta migración, reentry.ts leerá engineData.phaseState.primary_block
-- en lugar de ejecutar derivePrimaryBlock() client-side.
-- =============================================================================

-- 1. Añadir columna
ALTER TABLE project_phase_state
  ADD COLUMN IF NOT EXISTS primary_block TEXT NOT NULL DEFAULT 'none';

COMMENT ON COLUMN project_phase_state.primary_block IS
  'DEUDA.PE.8/AUD.B.2: Bloqueo principal del proyecto. '
  'Valores: traction_block | clarity_block | structural_block | none. '
  'Calculado por compute_primary_block() — misma lógica que derivePrimaryBlock() en reentry.ts. '
  'Actualizado automáticamente vía triggers en project_risk_score y project_function_coverage.';

-- =============================================================================
-- 2. Función compute_primary_block — lógica canónica
--
-- Espejo exacto de derivePrimaryBlock() en src/lib/reentry.ts:
--   - traction_block  : riskLevel IN ('critical', 'high')
--   - clarity_block   : demand coverage IN ('none', 'basic') o NULL
--   - structural_block: delivery o cash coverage IN ('none', 'basic') o NULL
--   - none            : sin bloqueo activo
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_primary_block(p_project_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risk_level     TEXT;
  v_demand_level   TEXT;
  v_delivery_level TEXT;
  v_cash_level     TEXT;
BEGIN
  -- Leer risk_level del motor de riesgo
  SELECT risk_level INTO v_risk_level
  FROM   project_risk_score
  WHERE  project_id = p_project_id;

  -- Prioridad 1: riesgo alto o crítico → traction_block
  IF v_risk_level IN ('critical', 'high') THEN
    RETURN 'traction_block';
  END IF;

  -- Leer coverage levels (demand, delivery, cash)
  SELECT coverage_level INTO v_demand_level
  FROM   project_function_coverage
  WHERE  project_id   = p_project_id
    AND  function_type = 'demand';

  -- Prioridad 2: sin cobertura de demanda → clarity_block
  IF v_demand_level IS NULL OR v_demand_level IN ('none', 'basic') THEN
    RETURN 'clarity_block';
  END IF;

  SELECT coverage_level INTO v_delivery_level
  FROM   project_function_coverage
  WHERE  project_id   = p_project_id
    AND  function_type = 'delivery';

  SELECT coverage_level INTO v_cash_level
  FROM   project_function_coverage
  WHERE  project_id   = p_project_id
    AND  function_type = 'cash';

  -- Prioridad 3: sin cobertura operativa/financiera → structural_block
  IF v_delivery_level IS NULL OR v_delivery_level IN ('none', 'basic')
  OR v_cash_level     IS NULL OR v_cash_level     IN ('none', 'basic') THEN
    RETURN 'structural_block';
  END IF;

  RETURN 'none';
END;
$$;

COMMENT ON FUNCTION compute_primary_block(UUID) IS
  'DEUDA.PE.8/AUD.B.2: Calcula el bloqueo principal del proyecto. '
  'Espejo SQL de derivePrimaryBlock() en reentry.ts. '
  'Prioridad: traction_block (riesgo) > clarity_block (demanda) > structural_block (entrega/caja) > none.';

-- =============================================================================
-- 3. Función trigger — escribe compute_primary_block() en project_phase_state
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_update_primary_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  v_project_id := NEW.project_id;

  -- Actualizar primary_block en project_phase_state (si existe fila)
  UPDATE project_phase_state
  SET    primary_block = compute_primary_block(v_project_id)
  WHERE  project_id    = v_project_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_fn_update_primary_block() IS
  'DEUDA.PE.8: Trigger function — recalcula y persiste primary_block en project_phase_state '
  'cuando cambia project_risk_score o project_function_coverage.';

-- Trigger 1: cuando cambia el risk level del proyecto
DROP TRIGGER IF EXISTS trg_risk_score_primary_block ON project_risk_score;

CREATE TRIGGER trg_risk_score_primary_block
  AFTER INSERT OR UPDATE OF risk_level ON project_risk_score
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_update_primary_block();

COMMENT ON TRIGGER trg_risk_score_primary_block ON project_risk_score IS
  'DEUDA.PE.8: AFTER INSERT/UPDATE OF risk_level → recalcula primary_block en project_phase_state.';

-- Trigger 2: cuando cambia la cobertura funcional del proyecto
DROP TRIGGER IF EXISTS trg_coverage_primary_block ON project_function_coverage;

CREATE TRIGGER trg_coverage_primary_block
  AFTER INSERT OR UPDATE OF coverage_level ON project_function_coverage
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_update_primary_block();

COMMENT ON TRIGGER trg_coverage_primary_block ON project_function_coverage IS
  'DEUDA.PE.8: AFTER INSERT/UPDATE OF coverage_level → recalcula primary_block en project_phase_state.';

-- =============================================================================
-- 4. Backfill inicial
-- Calcula primary_block para todos los proyectos que ya tienen phase_state.
-- =============================================================================

UPDATE project_phase_state ps
SET    primary_block = compute_primary_block(ps.project_id);
