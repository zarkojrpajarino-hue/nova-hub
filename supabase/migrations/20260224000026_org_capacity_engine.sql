-- =============================================================================
-- MIGRACIÓN 00026 — E4.14/E4.15/E4.16: Org Capacity Engine
--
-- E4.14 — Org health score: role fill ratio + function coverage promedio
-- E4.15 — Bottleneck principal: coverage_level='none' + sin rol proxy en equipo
-- E4.16 — Rol crítico vacío por fase (solo valores reales de specialization_role)
--
-- Nueva tabla: project_org_state
-- Nueva función: run_org_capacity_engine(p_project_id UUID, p_trigger_source TEXT)
-- Cron: domingo 02:30 UTC (después de economic_profile a las 02:00)
--
-- Fórmula org_health_score:
--   role_fill_score  = roles_filled / total_members × 100  (peso 0.30)
--   coverage_avg     = AVG(coverage_score demand + delivery + cash)  (peso 0.70)
--   org_health_score = ROUND(role_fill_score × 0.30 + coverage_avg × 0.70, 2)
--   Sin miembros: role_fill_score = 100 (neutral — no penaliza proyectos vacíos)
--
-- org_status:
--   ≥70 → healthy
--   40–69 → understaffed
--   <40 → critical
--
-- Bottleneck (E4.15) — "bottleneck principal confirmado":
--   Función con coverage_level='none' Y sin miembro con rol proxy
--   demand ↔ sales / marketing
--   delivery ↔ ai_tech / operations
--   cash ↔ finance
--   Si múltiples calificados: la de menor coverage_score
--   Tiebreak: demand > delivery > cash (mayor impacto comercial primero)
--   bottleneck_role = representante principal del proxy (sales, ai_tech, finance)
--
-- Rol crítico por fase (E4.16):
--   Phase 1 → sales
--   Phase 2 → sales
--   Phase 3 → operations
--   Phase 4 → finance
--   critical_role_empty = TRUE si ningún miembro tiene ese rol
--   Fases basadas solo en specialization_role ENUM confirmado (migración 00001):
--     sales, finance, ai_tech, marketing, operations, strategy
--
-- Triggers reactivos:
--   project_members (INSERT / UPDATE role / DELETE) → recalcular
--   project_function_coverage (INSERT / UPDATE coverage_score, coverage_level) → recalcular
--
-- Fuentes verificadas:
--   project_members           — migración 00001 (role: specialization_role NULLABLE)
--   project_function_coverage — migración 00002 (coverage_score SMALLINT 0-100, coverage_level TEXT)
--   project_phase_state       — migración 00002 (current_phase SMALLINT 1-4)
--   specialization_role ENUM  — migración 00001: sales, finance, ai_tech, marketing, operations, strategy
-- =============================================================================

-- =============================================================================
-- 1. Ampliar engine_versions_motor_check para incluir 'org_capacity'
-- =============================================================================

ALTER TABLE engine_versions
  DROP CONSTRAINT IF EXISTS engine_versions_motor_check;

ALTER TABLE engine_versions
  ADD CONSTRAINT engine_versions_motor_check CHECK (
    motor IN ('phase', 'probability', 'viability', 'execution', 'risk', 'economic_profile', 'org_capacity')
  );

-- =============================================================================
-- 2. Registrar versión del Org Capacity Engine
-- =============================================================================

-- Columnas reales de engine_versions: (id, motor, deployed_at, notes, is_active)
-- 'version' y 'description' no existen — texto embebido en notes.
INSERT INTO engine_versions (id, motor, notes, is_active)
VALUES (
  'org_capacity_v1.0',
  'org_capacity',
  'v1.0. org_health_score = role_fill_ratio*0.30 + avg_coverage_score*0.70. '
  'org_status: healthy≥70, understaffed 40-69, critical<40. '
  'Bottleneck: coverage_level=none + sin rol proxy (demand→sales, delivery→ai_tech, cash→finance). '
  'Critical role: sales (P1/P2), operations (P3), finance (P4).',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. Nueva tabla: project_org_state
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_org_state (
  project_id            UUID          PRIMARY KEY
                          REFERENCES projects(id) ON DELETE CASCADE,

  -- E4.14: org health score y status
  org_health_score      NUMERIC(5,2)  NOT NULL DEFAULT 0
                          CHECK (org_health_score BETWEEN 0 AND 100),
  org_status            TEXT          NOT NULL DEFAULT 'critical'
                          CHECK (org_status IN ('healthy', 'understaffed', 'critical')),

  -- E4.14: role fill counts
  total_members         SMALLINT      NOT NULL DEFAULT 0,
  roles_filled          SMALLINT      NOT NULL DEFAULT 0,
  roles_unfilled        SMALLINT      NOT NULL DEFAULT 0,

  -- E4.14: function coverage snapshot
  coverage_demand       TEXT          NOT NULL DEFAULT 'none'
                          CHECK (coverage_demand IN ('none', 'basic', 'strong')),
  coverage_delivery     TEXT          NOT NULL DEFAULT 'none'
                          CHECK (coverage_delivery IN ('none', 'basic', 'strong')),
  coverage_cash         TEXT          NOT NULL DEFAULT 'none'
                          CHECK (coverage_cash IN ('none', 'basic', 'strong')),

  -- E4.15: bottleneck principal confirmado
  bottleneck_function         TEXT
                                CHECK (bottleneck_function IN ('demand', 'delivery', 'cash')),
  bottleneck_role             TEXT
                                CHECK (bottleneck_role IN (
                                  'sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy'
                                )),
  -- Todos los roles válidos para cubrir la función con bottleneck
  -- demand→['sales','marketing'], delivery→['ai_tech','operations'], cash→['finance']
  -- E4.22 debe usar este campo en lugar de bottleneck_role cuando sugiera challenges
  bottleneck_role_candidates  JSONB,

  -- E4.16: rol crítico vacío por fase
  critical_role_empty   BOOLEAN       NOT NULL DEFAULT FALSE,
  missing_critical_role TEXT
                          CHECK (missing_critical_role IN (
                            'sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy'
                          )),

  last_calculated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  engine_version        TEXT          NOT NULL
                          REFERENCES engine_versions(id)
                          DEFAULT get_active_engine_version('org_capacity')
);

COMMENT ON TABLE project_org_state IS
  'Estado del Org Capacity Engine por proyecto. Actualizado semanalmente (domingo 02:30 UTC) y on-demand. '
  'org_health_score = role_fill_ratio × 0.30 + avg_coverage_score × 0.70. '
  'bottleneck_function/role: función con coverage_level=none y sin rol proxy en equipo. '
  'bottleneck_role_candidates: todos los roles válidos para cubrir la función (para E4.22). '
  'missing_critical_role: rol crítico según fase (sales P1/P2, operations P3, finance P4) si está vacío.';

-- =============================================================================
-- 4. run_org_capacity_engine
-- =============================================================================

CREATE OR REPLACE FUNCTION run_org_capacity_engine(
  p_project_id     UUID,
  p_trigger_source TEXT DEFAULT 'manual'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Team members
  v_total_members       SMALLINT;
  v_roles_filled        SMALLINT;
  v_roles_unfilled      SMALLINT;
  v_role_fill_score     NUMERIC;

  -- Function coverage
  v_cov_demand_score    NUMERIC;
  v_cov_demand_level    TEXT;
  v_cov_delivery_score  NUMERIC;
  v_cov_delivery_level  TEXT;
  v_cov_cash_score      NUMERIC;
  v_cov_cash_level      TEXT;
  v_coverage_avg        NUMERIC;

  -- Org score & status
  v_org_health_score    NUMERIC;
  v_org_status          TEXT;

  -- Bottleneck (E4.15)
  v_has_demand_role          BOOLEAN;
  v_has_delivery_role        BOOLEAN;
  v_has_cash_role            BOOLEAN;
  v_bottleneck_fn            TEXT;
  v_bottleneck_role          TEXT;
  v_bottleneck_candidates    JSONB;

  -- Critical role (E4.16)
  v_current_phase       SMALLINT;
  v_critical_role       TEXT;
  v_critical_empty      BOOLEAN;

  v_engine_ver          TEXT;
BEGIN

  v_engine_ver := get_active_engine_version('org_capacity');

  -- -------------------------------------------------------------------------
  -- E4.14 — Conteo de miembros y roles
  -- -------------------------------------------------------------------------
  SELECT
    COUNT(*)                                 ::SMALLINT,
    COUNT(*) FILTER (WHERE role IS NOT NULL) ::SMALLINT,
    COUNT(*) FILTER (WHERE role IS NULL)     ::SMALLINT
  INTO v_total_members, v_roles_filled, v_roles_unfilled
  FROM project_members
  WHERE project_id = p_project_id;

  -- Sin miembros: neutral (no penaliza proyectos recién creados)
  IF v_total_members = 0 THEN
    v_role_fill_score := 100.0;
  ELSE
    v_role_fill_score := (v_roles_filled::NUMERIC / v_total_members::NUMERIC) * 100.0;
  END IF;

  -- -------------------------------------------------------------------------
  -- E4.14 — Cobertura por función
  -- -------------------------------------------------------------------------
  SELECT coverage_score, coverage_level
  INTO   v_cov_demand_score, v_cov_demand_level
  FROM   project_function_coverage
  WHERE  project_id = p_project_id AND function_type = 'demand';

  v_cov_demand_score := COALESCE(v_cov_demand_score, 0);
  v_cov_demand_level := COALESCE(v_cov_demand_level, 'none');

  SELECT coverage_score, coverage_level
  INTO   v_cov_delivery_score, v_cov_delivery_level
  FROM   project_function_coverage
  WHERE  project_id = p_project_id AND function_type = 'delivery';

  v_cov_delivery_score := COALESCE(v_cov_delivery_score, 0);
  v_cov_delivery_level := COALESCE(v_cov_delivery_level, 'none');

  SELECT coverage_score, coverage_level
  INTO   v_cov_cash_score, v_cov_cash_level
  FROM   project_function_coverage
  WHERE  project_id = p_project_id AND function_type = 'cash';

  v_cov_cash_score := COALESCE(v_cov_cash_score, 0);
  v_cov_cash_level := COALESCE(v_cov_cash_level, 'none');

  -- Promedio de coverage_score sobre las 3 funciones
  v_coverage_avg := (v_cov_demand_score + v_cov_delivery_score + v_cov_cash_score) / 3.0;

  -- -------------------------------------------------------------------------
  -- E4.14 — Org health score y status
  -- -------------------------------------------------------------------------
  v_org_health_score := ROUND(
    (v_role_fill_score * 0.30) + (v_coverage_avg * 0.70),
    2
  );
  v_org_health_score := GREATEST(0.0, LEAST(100.0, v_org_health_score));

  v_org_status := CASE
    WHEN v_org_health_score >= 70 THEN 'healthy'
    WHEN v_org_health_score >= 40 THEN 'understaffed'
    ELSE 'critical'
  END;

  -- -------------------------------------------------------------------------
  -- E4.15 — Bottleneck principal confirmado
  --   Condición doble: coverage_level = 'none' Y sin rol proxy asignado
  --   Proxy mapping:
  --     demand   ↔ sales / marketing
  --     delivery ↔ ai_tech / operations
  --     cash     ↔ finance
  -- -------------------------------------------------------------------------
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE  project_id = p_project_id
      AND  role::TEXT IN ('sales', 'marketing')
  ) INTO v_has_demand_role;

  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE  project_id = p_project_id
      AND  role::TEXT IN ('ai_tech', 'operations')
  ) INTO v_has_delivery_role;

  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE  project_id = p_project_id
      AND  role::TEXT = 'finance'
  ) INTO v_has_cash_role;

  -- Seleccionar bottleneck: menor coverage_score entre candidatos
  -- Tiebreak por prioridad: demand (1) > delivery (2) > cash (3)
  SELECT t.fn, t.role_proxy
  INTO   v_bottleneck_fn, v_bottleneck_role
  FROM (
    SELECT 'demand'   AS fn, v_cov_demand_score   AS score, 'sales'   AS role_proxy, 1 AS priority
    WHERE  v_cov_demand_level   = 'none' AND NOT v_has_demand_role
    UNION ALL
    SELECT 'delivery' AS fn, v_cov_delivery_score AS score, 'ai_tech' AS role_proxy, 2 AS priority
    WHERE  v_cov_delivery_level = 'none' AND NOT v_has_delivery_role
    UNION ALL
    SELECT 'cash'     AS fn, v_cov_cash_score     AS score, 'finance' AS role_proxy, 3 AS priority
    WHERE  v_cov_cash_level     = 'none' AND NOT v_has_cash_role
  ) t
  ORDER BY t.score ASC, t.priority ASC
  LIMIT 1;

  -- Candidatos completos para la función con bottleneck
  -- E4.22 debe usar este campo al sugerir challenges (no solo el rol primario)
  v_bottleneck_candidates := CASE v_bottleneck_fn
    WHEN 'demand'   THEN '["sales","marketing"]'::JSONB
    WHEN 'delivery' THEN '["ai_tech","operations"]'::JSONB
    WHEN 'cash'     THEN '["finance"]'::JSONB
    ELSE NULL
  END;

  -- -------------------------------------------------------------------------
  -- E4.16 — Rol crítico por fase
  --   Phase 1 → sales
  --   Phase 2 → sales
  --   Phase 3 → operations
  --   Phase 4 → finance
  -- -------------------------------------------------------------------------
  SELECT current_phase INTO v_current_phase
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  v_current_phase := COALESCE(v_current_phase, 1);

  v_critical_role := CASE v_current_phase
    WHEN 1 THEN 'sales'
    WHEN 2 THEN 'sales'
    WHEN 3 THEN 'operations'
    WHEN 4 THEN 'finance'
    ELSE NULL
  END;

  -- Verificar si hay algún miembro con el rol crítico de la fase actual
  IF v_critical_role IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM project_members
      WHERE  project_id = p_project_id
        AND  role::TEXT = v_critical_role
    ) INTO v_critical_empty;
  ELSE
    v_critical_empty := FALSE;
  END IF;

  -- -------------------------------------------------------------------------
  -- UPSERT project_org_state
  -- -------------------------------------------------------------------------
  INSERT INTO project_org_state (
    project_id,
    org_health_score,
    org_status,
    total_members,
    roles_filled,
    roles_unfilled,
    coverage_demand,
    coverage_delivery,
    coverage_cash,
    bottleneck_function,
    bottleneck_role,
    bottleneck_role_candidates,
    critical_role_empty,
    missing_critical_role,
    last_calculated_at,
    engine_version
  ) VALUES (
    p_project_id,
    v_org_health_score,
    v_org_status,
    v_total_members,
    v_roles_filled,
    v_roles_unfilled,
    v_cov_demand_level,
    v_cov_delivery_level,
    v_cov_cash_level,
    v_bottleneck_fn,
    v_bottleneck_role,
    v_bottleneck_candidates,
    v_critical_empty,
    CASE WHEN v_critical_empty THEN v_critical_role ELSE NULL END,
    NOW(),
    v_engine_ver
  )
  ON CONFLICT (project_id) DO UPDATE SET
    org_health_score      = EXCLUDED.org_health_score,
    org_status            = EXCLUDED.org_status,
    total_members         = EXCLUDED.total_members,
    roles_filled          = EXCLUDED.roles_filled,
    roles_unfilled        = EXCLUDED.roles_unfilled,
    coverage_demand       = EXCLUDED.coverage_demand,
    coverage_delivery     = EXCLUDED.coverage_delivery,
    coverage_cash         = EXCLUDED.coverage_cash,
    bottleneck_function        = EXCLUDED.bottleneck_function,
    bottleneck_role            = EXCLUDED.bottleneck_role,
    bottleneck_role_candidates = EXCLUDED.bottleneck_role_candidates,
    critical_role_empty        = EXCLUDED.critical_role_empty,
    missing_critical_role = EXCLUDED.missing_critical_role,
    last_calculated_at    = EXCLUDED.last_calculated_at,
    engine_version        = EXCLUDED.engine_version;

END;
$$;

COMMENT ON FUNCTION run_org_capacity_engine(UUID, TEXT) IS
  'Org Capacity Engine v1.0 (E4.14-E4.16). '
  'E4.14: org_health_score = role_fill_ratio×0.30 + avg_coverage_score×0.70. '
  'org_status: healthy≥70, understaffed 40-69, critical<40. Role fill: 100 si sin miembros (neutral). '
  'E4.15: bottleneck = función con coverage_level=none y sin rol proxy '
  '(demand↔sales/marketing, delivery↔ai_tech/operations, cash↔finance); '
  'múltiples → menor score; tiebreak demand>delivery>cash. '
  'E4.16: missing_critical_role = sales (P1/P2), operations (P3), finance (P4) '
  'si ningún miembro del equipo tiene ese rol.';

-- =============================================================================
-- 5. Trigger: project_members → recalcular org state
--    Reactivo a: INSERT (nuevo miembro), UPDATE role (cambio de rol), DELETE (salida)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_org_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM run_org_capacity_engine(NEW.project_id, 'member_change');
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM run_org_capacity_engine(OLD.project_id, 'member_change');
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      PERFORM run_org_capacity_engine(NEW.project_id, 'member_role_change');
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_org_members
  AFTER INSERT OR UPDATE OF role OR DELETE
  ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_org_members();

-- =============================================================================
-- 6. Trigger: project_function_coverage → recalcular org state
--    Reactivo a: INSERT (nueva fila de cobertura) o UPDATE de score/level
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_org_coverage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM run_org_capacity_engine(NEW.project_id, 'coverage_change');
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_org_coverage
  AFTER INSERT OR UPDATE OF coverage_score, coverage_level
  ON project_function_coverage
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_org_coverage();

-- =============================================================================
-- 7. Cron semanal — domingo 02:30 UTC
--    Pipeline: Phase(00:00) → Probability(00:30) → Risk(01:00) →
--              Viability(01:30) → EconomicProfile(02:00) → OrgCapacity(02:30)
-- =============================================================================

SELECT cron.schedule(
  'weekly-org-capacity-engine',
  '30 2 * * 0',
  $$
    SELECT run_org_capacity_engine(id, 'weekly_job')
    FROM   projects
    WHERE  deleted_at IS NULL
  $$
);
