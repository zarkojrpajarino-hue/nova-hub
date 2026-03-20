-- =============================================================================
-- MIGRACIÓN 20260326000002 — AUD.A.2: Org Capacity → Risk Engine (R1.6)
--
-- Problema: run_org_capacity_engine() (migration 00026) calcula org_health_score
-- (0-100) y lo escribe en project_org_state, pero run_risk_engine() no lo consume.
-- Un proyecto puede tener risk_level='low' financiero con org en estado crítico
-- (equipo insuficiente, roles clave vacíos) sin que el riesgo lo refleje.
--
-- Solución: Añadir R1.6 compute_org_capacity_risk() al Risk Engine.
--
-- org_capacity_risk = 100 - org_health_score
--   org_health_score = 70-100 → healthy team → org_capacity_risk = 0-30 (bajo)
--   org_health_score = 40-69  → understaffed  → org_capacity_risk = 31-60 (medio)
--   org_health_score = 0-39   → critical       → org_capacity_risk = 61-100 (alto)
--
-- NULL si no existe project_org_state (proyecto nuevo sin miembros registrados).
-- NULL no penaliza — la redistribución de pesos lo absorbe.
--
-- Nueva distribución de pesos (redistribuidos de 5 a 6 inputs):
--   R1.1 runway_factor          : 0.25 → 0.22
--   R1.2 revenue_concentration  : 0.20 → 0.18
--   R1.3 execution_drop         : 0.20 → 0.18
--   R1.4 validation_weakness    : 0.20 → 0.18
--   R1.5 bottleneck_severity    : 0.15 → 0.14
--   R1.6 org_capacity_risk      : 0.00 → 0.10  ← NUEVO
--   Total                       : 1.00   1.00
--
-- Umbral de suficiencia: ≥3 inputs (no cambia — org_capacity es 6to, no requisito)
-- =============================================================================

-- =============================================================================
-- 1. Schema — añadir columna org_capacity_input a ambas tablas
-- =============================================================================

ALTER TABLE project_risk_score
  ADD COLUMN IF NOT EXISTS org_capacity_input NUMERIC(5,2) NULL
    CHECK (org_capacity_input BETWEEN 0 AND 100);

ALTER TABLE project_risk_score_history
  ADD COLUMN IF NOT EXISTS org_capacity_input NUMERIC(5,2) NULL
    CHECK (org_capacity_input BETWEEN 0 AND 100);

-- Ampliar constraint inputs_available de 0-5 a 0-6
-- Usamos DO block para buscar el nombre real del constraint (puede ser auto-generado)
DO $$
DECLARE
  v_cname TEXT;
BEGIN
  -- project_risk_score
  SELECT conname INTO v_cname
  FROM   pg_constraint c
  JOIN   pg_class t ON t.oid = c.conrelid
  WHERE  t.relname  = 'project_risk_score'
    AND  c.contype  = 'c'
    AND  pg_get_constraintdef(c.oid) LIKE '%inputs_available%';
  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE project_risk_score DROP CONSTRAINT %I', v_cname);
  END IF;

  -- project_risk_score_history
  SELECT conname INTO v_cname
  FROM   pg_constraint c
  JOIN   pg_class t ON t.oid = c.conrelid
  WHERE  t.relname  = 'project_risk_score_history'
    AND  c.contype  = 'c'
    AND  pg_get_constraintdef(c.oid) LIKE '%inputs_available%';
  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE project_risk_score_history DROP CONSTRAINT %I', v_cname);
  END IF;
END;
$$;

ALTER TABLE project_risk_score
  ADD CONSTRAINT project_risk_score_inputs_available_check
    CHECK (inputs_available BETWEEN 0 AND 6);

ALTER TABLE project_risk_score_history
  ADD CONSTRAINT project_risk_score_history_inputs_available_check
    CHECK (inputs_available BETWEEN 0 AND 6);

COMMENT ON COLUMN project_risk_score.org_capacity_input IS
  'R1.6: 100 - org_health_score. NULL si project_org_state no existe (proyecto sin equipo registrado). '
  'Añadido en AUD.A.2 (migración 20260326000002).';

COMMENT ON COLUMN project_risk_score_history.org_capacity_input IS
  'Snapshot de R1.6 org_capacity_risk usado en este cálculo. NULL si no disponible.';

-- =============================================================================
-- 2. Engine version para R1.6
-- =============================================================================

INSERT INTO engine_versions (id, motor, deployed_at, notes)
VALUES (
  'risk_v1.6',
  'risk',
  NOW(),
  'AUD.A.2: Añade R1.6 org_capacity_risk (peso 0.10). Pesos redistribuidos: '
  'runway 0.22, rev_conc 0.18, exec_drop 0.18, val_weak 0.18, bottleneck 0.14.'
)
ON CONFLICT (id) DO NOTHING;

-- Desactivar versión anterior
UPDATE engine_versions SET is_active = FALSE WHERE motor = 'risk' AND id != 'risk_v1.6';
UPDATE engine_versions SET is_active = TRUE  WHERE id = 'risk_v1.6';

-- =============================================================================
-- 3. compute_org_capacity_risk(project_id) → NUMERIC | NULL
--
-- Lee project_org_state.org_health_score.
-- Convierte a riesgo: 100 - org_health_score (mayor salud = menor riesgo).
-- NULL si no existe fila (proyecto sin org_capacity calculado aún).
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_org_capacity_risk(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_health NUMERIC;
BEGIN
  SELECT org_health_score
  INTO   v_health
  FROM   project_org_state
  WHERE  project_id = p_project_id;

  -- Sin datos org → NULL (redistribución de pesos lo absorbe)
  IF NOT FOUND OR v_health IS NULL THEN
    RETURN NULL;
  END IF;

  -- Invertir escala: health alta = riesgo bajo
  RETURN ROUND(GREATEST(0.0, LEAST(100.0, 100.0 - v_health)), 2);
END;
$$;

COMMENT ON FUNCTION compute_org_capacity_risk(UUID) IS
  'R1.6: 100 - project_org_state.org_health_score. Escala 0-100 donde 0=equipo perfecto, '
  '100=equipo en colapso. NULL si no existe project_org_state → peso se redistribuye.';

-- =============================================================================
-- 4. run_risk_engine() v1.6 — 6 inputs con redistribución proporcional
--
-- Cambios respecto a migration 00008:
--   - Añade v_org_capacity (R1.6) con peso inicial 0.10
--   - Pesos ajustados: runway 0.22, rev_conc 0.18, exec_drop 0.18, val_weak 0.18,
--     bottleneck 0.14 (bottleneck siempre disponible — nunca NULL)
--   - UPSERT incluye org_capacity_input en ambas tablas
--   - inputs_available ahora puede llegar a 6
-- =============================================================================

CREATE OR REPLACE FUNCTION run_risk_engine(
  p_project_id     UUID,
  p_trigger_source TEXT DEFAULT 'weekly_job'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver                TEXT;

  -- 6 inputs (algunos pueden ser NULL)
  v_runway             NUMERIC;
  v_rev_conc           NUMERIC;
  v_exec_drop          NUMERIC;
  v_val_weak           NUMERIC;
  v_bottleneck         NUMERIC;
  v_org_capacity       NUMERIC;  -- R1.6: nuevo

  -- Pesos v1.6 (redistribuidos para sumar 1.00)
  v_w_runway           NUMERIC := 0.22;
  v_w_rev_conc         NUMERIC := 0.18;
  v_w_exec_drop        NUMERIC := 0.18;
  v_w_val_weak         NUMERIC := 0.18;
  v_w_bottleneck       NUMERIC := 0.14;
  v_w_org_capacity     NUMERIC := 0.10;  -- R1.6

  v_total_weight       NUMERIC;
  v_inputs_available   SMALLINT := 0;

  v_completeness       NUMERIC;

  v_risk_score         NUMERIC;
  v_risk_status        TEXT;
  v_risk_level         TEXT;
BEGIN
  -- -----------------------------------------------------------------------
  -- Versión activa del motor
  -- -----------------------------------------------------------------------
  SELECT id INTO v_ver
  FROM   engine_versions
  WHERE  motor     = 'risk'
    AND  is_active = TRUE
  LIMIT  1;

  IF v_ver IS NULL THEN
    v_ver := 'risk_v1.6';
  END IF;

  -- -----------------------------------------------------------------------
  -- Calcular 6 inputs
  -- -----------------------------------------------------------------------
  v_runway        := compute_runway_factor(p_project_id);
  v_rev_conc      := compute_revenue_concentration(p_project_id);
  v_exec_drop     := compute_execution_drop(p_project_id);
  v_val_weak      := compute_validation_weakness(p_project_id);
  v_bottleneck    := compute_bottleneck_severity(p_project_id);   -- nunca NULL
  v_org_capacity  := compute_org_capacity_risk(p_project_id);     -- NULL si sin datos

  -- -----------------------------------------------------------------------
  -- Nullear pesos de inputs faltantes + contar disponibles
  -- bottleneck_severity siempre contribuye (retorna 0 si sin bloques)
  -- org_capacity puede ser NULL → redistributed away
  -- -----------------------------------------------------------------------
  IF v_runway       IS NULL THEN v_w_runway       := 0; ELSE v_inputs_available := v_inputs_available + 1; END IF;
  IF v_rev_conc     IS NULL THEN v_w_rev_conc     := 0; ELSE v_inputs_available := v_inputs_available + 1; END IF;
  IF v_exec_drop    IS NULL THEN v_w_exec_drop    := 0; ELSE v_inputs_available := v_inputs_available + 1; END IF;
  IF v_val_weak     IS NULL THEN v_w_val_weak     := 0; ELSE v_inputs_available := v_inputs_available + 1; END IF;
  IF v_org_capacity IS NULL THEN v_w_org_capacity := 0; ELSE v_inputs_available := v_inputs_available + 1; END IF;
  -- bottleneck siempre disponible
  v_inputs_available := v_inputs_available + 1;

  -- -----------------------------------------------------------------------
  -- Data completeness (reutiliza función del motor de probabilidad)
  -- -----------------------------------------------------------------------
  v_completeness := compute_data_completeness(p_project_id);

  -- -----------------------------------------------------------------------
  -- Risk status: insufficient_data si < 3 inputs
  -- -----------------------------------------------------------------------
  IF v_inputs_available < 3 THEN
    v_risk_status := 'insufficient_data';
    v_risk_score  := NULL;
    v_risk_level  := 'low';

    INSERT INTO project_risk_score (
      project_id,
      risk_score,                 risk_level,
      risk_status,
      runway_factor_input,        revenue_concentration_input,
      execution_drop_input,       validation_weakness_input,
      bottleneck_severity_input,  org_capacity_input,
      inputs_available,           data_completeness_score,
      last_calculated_at,         engine_version
    )
    VALUES (
      p_project_id,
      NULL,                       v_risk_level,
      v_risk_status,
      v_runway,                   v_rev_conc,
      v_exec_drop,                v_val_weak,
      v_bottleneck,               v_org_capacity,
      v_inputs_available,         v_completeness,
      NOW(),                      v_ver
    )
    ON CONFLICT (project_id) DO UPDATE SET
      risk_score                  = EXCLUDED.risk_score,
      risk_level                  = EXCLUDED.risk_level,
      risk_status                 = EXCLUDED.risk_status,
      runway_factor_input         = EXCLUDED.runway_factor_input,
      revenue_concentration_input = EXCLUDED.revenue_concentration_input,
      execution_drop_input        = EXCLUDED.execution_drop_input,
      validation_weakness_input   = EXCLUDED.validation_weakness_input,
      bottleneck_severity_input   = EXCLUDED.bottleneck_severity_input,
      org_capacity_input          = EXCLUDED.org_capacity_input,
      inputs_available            = EXCLUDED.inputs_available,
      data_completeness_score     = EXCLUDED.data_completeness_score,
      last_calculated_at          = EXCLUDED.last_calculated_at,
      engine_version              = EXCLUDED.engine_version;

    INSERT INTO project_risk_score_history (
      project_id,
      risk_score,                 risk_level,               risk_status,
      runway_factor_input,        revenue_concentration_input,
      execution_drop_input,       validation_weakness_input,
      bottleneck_severity_input,  org_capacity_input,
      inputs_available,           data_completeness_score,
      trigger_source,             calculated_at,            engine_version
    )
    VALUES (
      p_project_id,
      NULL,                       v_risk_level,             v_risk_status,
      v_runway,                   v_rev_conc,
      v_exec_drop,                v_val_weak,
      v_bottleneck,               v_org_capacity,
      v_inputs_available,         v_completeness,
      p_trigger_source,           NOW(),                    v_ver
    );

    RETURN;
  END IF;

  -- -----------------------------------------------------------------------
  -- ≥3 inputs: redistribuir pesos proporcionales sobre los no-NULL
  -- -----------------------------------------------------------------------
  v_total_weight := v_w_runway + v_w_rev_conc + v_w_exec_drop
                  + v_w_val_weak + v_w_bottleneck + v_w_org_capacity;

  v_risk_score := ROUND(
    LEAST(100.0, GREATEST(0.0,
      COALESCE(v_runway,       0) * (v_w_runway       / v_total_weight)
    + COALESCE(v_rev_conc,     0) * (v_w_rev_conc     / v_total_weight)
    + COALESCE(v_exec_drop,    0) * (v_w_exec_drop    / v_total_weight)
    + COALESCE(v_val_weak,     0) * (v_w_val_weak     / v_total_weight)
    + v_bottleneck               * (v_w_bottleneck    / v_total_weight)
    + COALESCE(v_org_capacity, 0) * (v_w_org_capacity / v_total_weight)
    )),
    2
  );

  v_risk_status := CASE
    WHEN v_completeness >= 50 THEN 'active'
    ELSE                           'low_confidence'
  END;

  v_risk_level := CASE
    WHEN v_risk_score >= 80 THEN 'critical'
    WHEN v_risk_score >= 55 THEN 'high'
    WHEN v_risk_score >= 30 THEN 'medium'
    ELSE                         'low'
  END;

  -- -----------------------------------------------------------------------
  -- UPSERT idempotente en project_risk_score
  -- -----------------------------------------------------------------------
  INSERT INTO project_risk_score (
    project_id,
    risk_score,                 risk_level,
    risk_status,
    runway_factor_input,        revenue_concentration_input,
    execution_drop_input,       validation_weakness_input,
    bottleneck_severity_input,  org_capacity_input,
    inputs_available,           data_completeness_score,
    last_calculated_at,         engine_version
  )
  VALUES (
    p_project_id,
    v_risk_score,               v_risk_level,
    v_risk_status,
    v_runway,                   v_rev_conc,
    v_exec_drop,                v_val_weak,
    v_bottleneck,               v_org_capacity,
    v_inputs_available,         v_completeness,
    NOW(),                      v_ver
  )
  ON CONFLICT (project_id) DO UPDATE SET
    risk_score                  = EXCLUDED.risk_score,
    risk_level                  = EXCLUDED.risk_level,
    risk_status                 = EXCLUDED.risk_status,
    runway_factor_input         = EXCLUDED.runway_factor_input,
    revenue_concentration_input = EXCLUDED.revenue_concentration_input,
    execution_drop_input        = EXCLUDED.execution_drop_input,
    validation_weakness_input   = EXCLUDED.validation_weakness_input,
    bottleneck_severity_input   = EXCLUDED.bottleneck_severity_input,
    org_capacity_input          = EXCLUDED.org_capacity_input,
    inputs_available            = EXCLUDED.inputs_available,
    data_completeness_score     = EXCLUDED.data_completeness_score,
    last_calculated_at          = EXCLUDED.last_calculated_at,
    engine_version              = EXCLUDED.engine_version;

  -- -----------------------------------------------------------------------
  -- INSERT en project_risk_score_history
  -- -----------------------------------------------------------------------
  INSERT INTO project_risk_score_history (
    project_id,
    risk_score,                 risk_level,               risk_status,
    runway_factor_input,        revenue_concentration_input,
    execution_drop_input,       validation_weakness_input,
    bottleneck_severity_input,  org_capacity_input,
    inputs_available,           data_completeness_score,
    trigger_source,             calculated_at,            engine_version
  )
  VALUES (
    p_project_id,
    v_risk_score,               v_risk_level,             v_risk_status,
    v_runway,                   v_rev_conc,
    v_exec_drop,                v_val_weak,
    v_bottleneck,               v_org_capacity,
    v_inputs_available,         v_completeness,
    p_trigger_source,           NOW(),                    v_ver
  );
END;
$$;

COMMENT ON FUNCTION run_risk_engine(UUID, TEXT) IS
  'Motor de riesgo v1.6. 6 inputs: runway(22%) + rev_concentration(18%) + exec_drop(18%) '
  '+ val_weakness(18%) + bottleneck(14%) + org_capacity(10%). '
  'R1.6 = 100 - org_health_score (NULL si sin project_org_state). '
  'Redistribución pro-rata si NULL. Requiere ≥3 inputs; si <3→insufficient_data. '
  'UPSERT + history. Migration 20260326000002 (AUD.A.2).';

-- =============================================================================
-- 5. Trigger: run_risk_engine cuando org_capacity_score cambia
--
-- run_org_capacity_engine() actualiza project_org_state.org_health_score.
-- Ahora ese cambio debe propagar al Risk Engine.
-- trigger_source = 'block_event' — semanticamente lo más cercano (org = riesgo operativo)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_org_state_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND
     OLD.org_health_score IS DISTINCT FROM NEW.org_health_score) THEN
    PERFORM run_risk_engine(NEW.project_id, 'block_event');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_state_risk ON project_org_state;

CREATE TRIGGER trg_org_state_risk
  AFTER INSERT OR UPDATE OF org_health_score ON project_org_state
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_org_state_risk();

COMMENT ON TRIGGER trg_org_state_risk ON project_org_state IS
  'AUD.A.2: Cuando org_health_score cambia → propaga al Risk Engine como R1.6.';
