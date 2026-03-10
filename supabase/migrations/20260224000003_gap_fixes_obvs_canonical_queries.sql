-- =============================================================================
-- MIGRACIÓN 00003 — GAP FIXES PRE-F3.1
-- Cierra 3 gaps identificados antes de arrancar engine runners:
--   Gap 1 — obv_type dual-layer: añade valores canónicos en inglés + view de normalización
--   Gap 2 — evidence_type y obv_outcome en obvs (sin tabla separada)
--   Gap 3 — queries canónicas: compute_iteration_velocity, compute_validation_strength,
--            compute_capacity_health como funciones SQL reutilizadas por los runners
-- =============================================================================

-- =============================================================================
-- GAP 1 — obv_type: completar con valores canónicos ingleses
--
-- Estado actual del enum:  exploracion | validacion | venta (00001)
--                        + product_validation | operational_system  (00002)
-- Faltan:                  customer_discovery | revenue_validation
--
-- Regla definitiva:
--   - NO se renombran los valores legacy (español). Datos existentes se mantienen.
--   - Los motores trabajan con los valores canónicos ingleses.
--   - La UI puede guardar cualquier valor del enum.
--   - La normalización (legacy → canónico) ocurre en v_obvs_canonical (ver abajo).
-- =============================================================================

ALTER TYPE obv_type ADD VALUE IF NOT EXISTS 'customer_discovery';
ALTER TYPE obv_type ADD VALUE IF NOT EXISTS 'revenue_validation';

-- Enum resultante completo:
--   exploracion        → legacy (mapeado a customer_discovery)
--   validacion         → legacy (mapeado a product_validation)
--   venta              → legacy (mapeado a revenue_validation)
--   customer_discovery → canónico (descubrimiento de cliente)
--   product_validation → canónico (×1.1 en verification_multiplier)
--   revenue_validation → canónico (×1.3 — mayor peso)
--   operational_system → canónico (×0.8 — sistema interno)

-- =============================================================================
-- GAP 1 — VIEW: v_obvs_canonical
--
-- Propósito: normalizar tipo legacy → canónico + exponer verification_multiplier.
-- Uso: queries de UI que necesiten mostrar tipo en inglés; los runners usan
--      CASE inline directamente sobre obvs para evitar dependencia de views.
-- Security: SECURITY INVOKER (default) → respeta RLS del caller sobre obvs.
-- =============================================================================

CREATE OR REPLACE VIEW v_obvs_canonical AS
SELECT
  o.*,
  -- tipo_canonical: normaliza legacy español → inglés canónico
  CASE o.tipo::text
    WHEN 'exploracion'        THEN 'customer_discovery'
    WHEN 'validacion'         THEN 'product_validation'
    WHEN 'venta'              THEN 'revenue_validation'
    ELSE o.tipo::text
  END AS tipo_canonical,
  -- verification_multiplier: peso de validación por tipo (F1.8)
  CASE o.tipo::text
    WHEN 'customer_discovery' THEN 1.00
    WHEN 'exploracion'        THEN 1.00
    WHEN 'product_validation' THEN 1.10
    WHEN 'validacion'         THEN 1.10
    WHEN 'revenue_validation' THEN 1.30
    WHEN 'venta'              THEN 1.30
    WHEN 'operational_system' THEN 0.80
    ELSE 1.00
  END AS verification_multiplier
FROM obvs o;

COMMENT ON VIEW v_obvs_canonical IS
  'Vista normalizada de OBVs. Expone tipo_canonical (legacy español → inglés canónico) y verification_multiplier para motores y UI. Los runners usan CASE inline; esta view es para consultas ad-hoc y UI.';

-- =============================================================================
-- GAP 2 — obvs: añadir evidence_type y obv_outcome
--
-- No existe tabla separada de evidencias. evidence_url ya existe en obvs.
-- Se añaden dos columnas:
--
-- evidence_type: qué tipo de prueba acompaña al OBV.
--   NULL = sin evidencia documentada (no penaliza, simplemente no hay)
--   payment = comprobante de pago → combinado con obv_outcome='success'
--             activa auto-tipo revenue_validation en F1.8
--
-- obv_outcome: resultado del OBV documentado por el founder.
--   NULL = resultado no documentado → NO cuenta como iteración (velocity)
--          → se trata como score=50 en validation_strength (default)
--   success  → base_score=100
--   partial  → base_score=60 (señal mixta, cliente interesado pero no confirmó)
--   fail     → base_score=20 (hipótesis refutada — cuenta como iteración)
--
-- EDGE CASES (según spec Iteration Velocity):
--   OBV sin outcome → no cuenta como iteración
--   OBV con outcome negativo (fail) → SÍ cuenta como iteración
--   OBV cancelado → no aplica (status='rejected' ≠ cancelado; v1 no tiene cancelled)
-- =============================================================================

ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS evidence_type TEXT
    CHECK (evidence_type IN ('payment', 'interview_recording', 'public_url', 'screenshot', 'doc', 'other')),
  ADD COLUMN IF NOT EXISTS obv_outcome TEXT
    CHECK (obv_outcome IN ('success', 'partial', 'fail'));

COMMENT ON COLUMN obvs.evidence_type IS
  'Tipo de evidencia adjunta al OBV. payment=prueba de pago (activa auto-tipo revenue_validation en F1.8). NULL=sin evidencia documentada.';

COMMENT ON COLUMN obvs.obv_outcome IS
  'Resultado del OBV documentado por el founder. success=hipótesis confirmada (100pts), partial=señal mixta (60pts), fail=hipótesis refutada (20pts). NULL=no documentado → no cuenta como iteración para velocity, vale 50 en validation_strength.';

-- Índice de soporte para compute_iteration_velocity (project + outcome + fecha)
CREATE INDEX IF NOT EXISTS idx_obvs_project_outcome_fecha
  ON obvs (project_id, obv_outcome, created_at DESC)
  WHERE obv_outcome IS NOT NULL;

-- Índice de soporte para compute_validation_strength (project + fecha)
CREATE INDEX IF NOT EXISTS idx_obvs_project_fecha
  ON obvs (project_id, fecha DESC);

-- =============================================================================
-- GAP 3.0 — compute_iteration_velocity(p_project_id)
--
-- Definición: número de OBVs con resultado documentado (obv_outcome IS NOT NULL)
--             creados en la ventana rolling de 28 días.
--
-- Reglas (spec Iteration Velocity):
--   - Cuenta solo OBVs con resultado documentado
--   - No normaliza por miembros del equipo
--   - Ventana: rolling 28 días (no mes calendario)
--   - OBV cancelado / sin outcome → no cuenta
--   - OBV duplicado con mismo resultado → solo cuenta 1 (no se gestiona aquí;
--     la deduplicación es responsabilidad del app layer al crear OBVs)
--
-- Clasificación resultante:
--   0 → Crítico | 1 → Fricción | 2 → Saludable mínimo
--   3 → Alto rendimiento | 4+ → Excelente
--
-- velocity_score para motores = MIN(100, iteration_velocity × 25)
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_iteration_velocity(p_project_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM obvs
  WHERE project_id    = p_project_id
    AND obv_outcome   IS NOT NULL
    AND created_at    >= NOW() - INTERVAL '28 days';
$$;

COMMENT ON FUNCTION compute_iteration_velocity(UUID) IS
  'Cuenta OBVs con resultado documentado en los últimos 28 días (rolling window). Clasificación: 0=crítico, 1=fricción, 2=saludable, 3=alto, 4+=excelente. velocity_score = MIN(100, result × 25).';

-- =============================================================================
-- GAP 3.1 — compute_validation_strength(p_project_id)
--
-- Definición: promedio del score de los top 5 OBVs del proyecto (o los que haya).
--
-- Fórmula por OBV:
--   raw_score = base_score × verification_multiplier × recency_decay
--   score     = LEAST(100, raw_score)
--
-- Donde:
--   base_score = CASE obv_outcome
--                  WHEN 'success' THEN 100
--                  WHEN 'partial' THEN 60
--                  WHEN 'fail'    THEN 20
--                  ELSE 50  -- NULL outcome: default 50 (no penaliza, no premia)
--                END
--
--   verification_multiplier = según tipo (tabla completa en v_obvs_canonical)
--     customer_discovery / exploracion  → 1.00
--     product_validation / validacion   → 1.10
--     revenue_validation / venta        → 1.30
--     operational_system                → 0.80
--
--   recency_decay = IF fecha < CURRENT_DATE - 56 días THEN 0.80 ELSE 1.00
--     (binario, >8 semanas)
--
-- Resultado: promedio de los top 5 por score. Si 0 OBVs → 0.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_validation_strength(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_strength NUMERIC;
BEGIN
  SELECT AVG(score) INTO v_strength
  FROM (
    SELECT
      LEAST(100.0,
        -- base_score (outcome → points)
        COALESCE(
          CASE obv_outcome
            WHEN 'success' THEN 100.0
            WHEN 'partial' THEN  60.0
            WHEN 'fail'    THEN  20.0
          END,
          50.0  -- NULL outcome → default 50
        )
        -- × verification_multiplier (tipo canónico)
        * CASE tipo::text
            WHEN 'customer_discovery' THEN 1.00
            WHEN 'exploracion'        THEN 1.00
            WHEN 'product_validation' THEN 1.10
            WHEN 'validacion'         THEN 1.10
            WHEN 'revenue_validation' THEN 1.30
            WHEN 'venta'              THEN 1.30
            WHEN 'operational_system' THEN 0.80
            ELSE 1.00
          END
        -- × recency_decay (>8 semanas → ×0.8)
        * CASE
            WHEN fecha < CURRENT_DATE - INTERVAL '56 days' THEN 0.80
            ELSE 1.00
          END
      ) AS score
    FROM obvs
    WHERE project_id = p_project_id
    ORDER BY score DESC
    LIMIT 5
  ) top5;

  RETURN ROUND(COALESCE(v_strength, 0), 2);
END;
$$;

COMMENT ON FUNCTION compute_validation_strength(UUID) IS
  'Promedio del score de los top 5 OBVs del proyecto. score_por_obv = base_score × verification_multiplier × recency_decay, capped a 100. Si 0 OBVs → 0. NULL outcome → base 50 (no penaliza).';

-- =============================================================================
-- GAP 3.2 — compute_capacity_health(p_project_id)
--
-- Definición (F1.3):
--   used_units       = 10 × active_obvs + 3 × tasks_done_7d + 0 × meetings (v1: sin tabla)
--   capacity_base    = 100 (constante v1)
--   capacity_used_pct = used_units / capacity_base × 100
--     → equivale a comparar used_units directamente contra umbrales
--
-- Mapping a health score:
--   used_units ≤ 75  → 100  (carga sostenible)
--   used_units ≤ 85  →  70  (carga elevada)
--   used_units  > 85 →  30  (sobrecarga)
--
-- Definiciones v1:
--   active_obvs    = OBVs del proyecto con status = 'pending'
--   tasks_done_7d  = tareas con status = 'done' AND completed_at ≥ NOW() - 7 días
--   meetings_7d    = 0 (no existe tabla en v1)
--
-- Nota: no se ajusta por número de miembros. El ajuste solo-founder
--       se gestiona en capacity_health → umbrales, no en esta fórmula.
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_capacity_health(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_obvs   INTEGER;
  v_tasks_done_7d INTEGER;
  v_used_units    NUMERIC;
BEGIN
  -- active_obvs: OBVs en curso (pendientes de validar/rechazar)
  SELECT COUNT(*) INTO v_active_obvs
  FROM obvs
  WHERE project_id = p_project_id
    AND status     = 'pending';

  -- tasks completadas en los últimos 7 días
  SELECT COUNT(*) INTO v_tasks_done_7d
  FROM tasks
  WHERE project_id   = p_project_id
    AND status       = 'done'
    AND completed_at >= NOW() - INTERVAL '7 days';

  -- used_units (meetings = 0 en v1)
  v_used_units := (10 * v_active_obvs) + (3 * v_tasks_done_7d);

  -- map a health score
  RETURN CASE
    WHEN v_used_units <= 75 THEN 100
    WHEN v_used_units <= 85 THEN  70
    ELSE                          30
  END;
END;
$$;

COMMENT ON FUNCTION compute_capacity_health(UUID) IS
  'Salud de capacidad del equipo. used_units = 10×active_obvs + 3×tasks_done_7d. ≤75→100, ≤85→70, >85→30. meetings=0 en v1 (sin tabla). No se normaliza por miembros.';
