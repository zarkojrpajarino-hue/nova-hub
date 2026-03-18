-- BLOQUE B: write_integration_to_engine_table() — stored procedure principal
--
-- Único punto de acceso autorizado para que los agentes escriban en tablas de motor.
-- Implementa validación, idempotencia, traceabilidad y atomicidad en una sola transacción.
--
-- Prerequisitos: 20260315000002 (tablas Bloque B), 20260315000003 (integration_write_log)
-- Referencia de diseño: INTEGRATION_WRITE_GUARD.md

-- =============================================================================
-- PASO 0: pgcrypto (cifrado de credentials)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- PASO 1: ALTER TABLE — columnas de traceabilidad en tablas de motor
-- Necesarias para conflict resolution (source_timestamp + confidence).
-- Patrón: integration_source, source_timestamp, source_confidence
-- =============================================================================

ALTER TABLE key_metrics
  ADD COLUMN IF NOT EXISTS integration_source  TEXT,
  ADD COLUMN IF NOT EXISTS source_timestamp    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_confidence   NUMERIC(4,3);

ALTER TABLE financial_projections
  ADD COLUMN IF NOT EXISTS integration_source  TEXT,
  ADD COLUMN IF NOT EXISTS source_timestamp    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_confidence   NUMERIC(4,3);

ALTER TABLE project_economic_profile
  ADD COLUMN IF NOT EXISTS integration_source  TEXT,
  ADD COLUMN IF NOT EXISTS source_timestamp    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_confidence   NUMERIC(4,3);

-- =============================================================================
-- PASO 2: ALTER TABLE — columnas de identidad externa en tasks y obvs
-- Necesarias para idempotencia de escrituras de Execution y Sales agents.
-- =============================================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS external_provider   TEXT,
  ADD COLUMN IF NOT EXISTS external_id         TEXT,
  ADD COLUMN IF NOT EXISTS external_synced_at  TIMESTAMPTZ;

-- Índice único para tareas externas — identidad para idempotencia
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_external_identity
  ON tasks (project_id, external_provider, external_id)
  WHERE external_provider IS NOT NULL AND external_id IS NOT NULL;

ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS external_provider   TEXT,
  ADD COLUMN IF NOT EXISTS external_id         TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_obvs_external_identity
  ON obvs (project_id, external_provider, external_id)
  WHERE external_provider IS NOT NULL AND external_id IS NOT NULL;

-- =============================================================================
-- PASO 3: task_status enum — añadir 'done_historical'
-- Tareas externas completadas ANTES de integration_connections.connected_at.
-- El motor de ejecución ignora este status (no cuenta en execution_rate).
-- =============================================================================

ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'done_historical';

-- =============================================================================
-- PASO 4: Funciones privadas de escritura por target
-- Prefijo _integration_write_ para distinguirlas.
-- Devuelven (ok BOOLEAN, reason TEXT).
-- No son SECURITY DEFINER — llamadas solo desde write_integration_to_engine_table.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 4a. key_metrics
-- Identity: (project_id, date) donde date = primer día UTC del mes de source_timestamp
-- Conflict resolution: source_timestamp más reciente gana; mismo ts → mayor confidence
-- Escritura parcial: solo actualiza campos presentes en el payload
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION _integration_write_key_metrics(
  p_project_id       UUID,
  p_payload          JSONB,
  p_source_timestamp TIMESTAMPTZ,
  p_confidence       NUMERIC,
  p_provider         TEXT
) RETURNS TABLE (ok BOOLEAN, reason TEXT)
LANGUAGE plpgsql AS $$
DECLARE
  v_date            DATE;
  v_existing_ts     TIMESTAMPTZ;
  v_existing_conf   NUMERIC;
BEGIN
  -- Identidad: primer día UTC del mes del dato en el provider
  v_date := DATE_TRUNC('month', p_source_timestamp AT TIME ZONE 'UTC')::date;

  -- Conflict resolution
  SELECT source_timestamp, source_confidence
  INTO v_existing_ts, v_existing_conf
  FROM key_metrics
  WHERE project_id = p_project_id AND date = v_date;

  IF FOUND AND v_existing_ts IS NOT NULL THEN
    IF p_source_timestamp < v_existing_ts THEN
      RETURN QUERY SELECT FALSE, 'stale_or_lower_confidence'::text;
      RETURN;
    ELSIF p_source_timestamp = v_existing_ts AND p_confidence < v_existing_conf THEN
      RETURN QUERY SELECT FALSE, 'stale_or_lower_confidence'::text;
      RETURN;
    END IF;
  END IF;

  -- UPSERT: insertar o actualizar. Solo actualiza campos presentes en payload.
  INSERT INTO key_metrics (
    project_id, date,
    mrr, arr, mrr_growth_rate,
    total_customers, new_customers, churned_customers, churn_rate,
    cac, ltv, ltv_cac_ratio,
    dau, mau,
    cash_balance, burn_rate, runway_months,
    integration_source, source_timestamp, source_confidence
  ) VALUES (
    p_project_id, v_date,
    COALESCE((p_payload->>'mrr')::decimal, 0),
    COALESCE((p_payload->>'arr')::decimal, 0),
    COALESCE((p_payload->>'mrr_growth_rate')::decimal, 0),
    COALESCE((p_payload->>'total_customers')::integer, 0),
    COALESCE((p_payload->>'new_customers')::integer, 0),
    COALESCE((p_payload->>'churned_customers')::integer, 0),
    COALESCE((p_payload->>'churn_rate')::decimal, 0),
    COALESCE((p_payload->>'cac')::decimal, 0),
    COALESCE((p_payload->>'ltv')::decimal, 0),
    COALESCE((p_payload->>'ltv_cac_ratio')::decimal, 0),
    COALESCE((p_payload->>'dau')::integer, 0),
    COALESCE((p_payload->>'mau')::integer, 0),
    COALESCE((p_payload->>'cash_balance')::decimal, 0),
    COALESCE((p_payload->>'burn_rate')::decimal, 0),
    COALESCE((p_payload->>'runway_months')::integer, 0),
    p_provider, p_source_timestamp, p_confidence
  )
  ON CONFLICT (project_id, date) DO UPDATE SET
    mrr               = CASE WHEN p_payload ? 'mrr'               THEN EXCLUDED.mrr               ELSE key_metrics.mrr               END,
    arr               = CASE WHEN p_payload ? 'arr'               THEN EXCLUDED.arr               ELSE key_metrics.arr               END,
    mrr_growth_rate   = CASE WHEN p_payload ? 'mrr_growth_rate'   THEN EXCLUDED.mrr_growth_rate   ELSE key_metrics.mrr_growth_rate   END,
    total_customers   = CASE WHEN p_payload ? 'total_customers'   THEN EXCLUDED.total_customers   ELSE key_metrics.total_customers   END,
    new_customers     = CASE WHEN p_payload ? 'new_customers'     THEN EXCLUDED.new_customers     ELSE key_metrics.new_customers     END,
    churned_customers = CASE WHEN p_payload ? 'churned_customers' THEN EXCLUDED.churned_customers ELSE key_metrics.churned_customers END,
    churn_rate        = CASE WHEN p_payload ? 'churn_rate'        THEN EXCLUDED.churn_rate        ELSE key_metrics.churn_rate        END,
    cac               = CASE WHEN p_payload ? 'cac'               THEN EXCLUDED.cac               ELSE key_metrics.cac               END,
    ltv               = CASE WHEN p_payload ? 'ltv'               THEN EXCLUDED.ltv               ELSE key_metrics.ltv               END,
    ltv_cac_ratio     = CASE WHEN p_payload ? 'ltv_cac_ratio'     THEN EXCLUDED.ltv_cac_ratio     ELSE key_metrics.ltv_cac_ratio     END,
    dau               = CASE WHEN p_payload ? 'dau'               THEN EXCLUDED.dau               ELSE key_metrics.dau               END,
    mau               = CASE WHEN p_payload ? 'mau'               THEN EXCLUDED.mau               ELSE key_metrics.mau               END,
    cash_balance      = CASE WHEN p_payload ? 'cash_balance'      THEN EXCLUDED.cash_balance      ELSE key_metrics.cash_balance      END,
    burn_rate         = CASE WHEN p_payload ? 'burn_rate'         THEN EXCLUDED.burn_rate         ELSE key_metrics.burn_rate         END,
    runway_months     = CASE WHEN p_payload ? 'runway_months'     THEN EXCLUDED.runway_months     ELSE key_metrics.runway_months     END,
    integration_source = EXCLUDED.integration_source,
    source_timestamp   = EXCLUDED.source_timestamp,
    source_confidence  = EXCLUDED.source_confidence;

  RETURN QUERY SELECT TRUE, NULL::text;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4b. financial_projections
-- Identity: (project_id, year, month) derivados de logical_period ('YYYY-MM-01')
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION _integration_write_financial_projections(
  p_project_id       UUID,
  p_payload          JSONB,
  p_logical_period   TEXT,
  p_source_timestamp TIMESTAMPTZ,
  p_confidence       NUMERIC,
  p_provider         TEXT
) RETURNS TABLE (ok BOOLEAN, reason TEXT)
LANGUAGE plpgsql AS $$
DECLARE
  v_year            INTEGER;
  v_month           INTEGER;
  v_existing_ts     TIMESTAMPTZ;
  v_existing_conf   NUMERIC;
BEGIN
  IF p_logical_period IS NULL THEN
    RETURN QUERY SELECT FALSE, 'invalid_payload'::text;
    RETURN;
  END IF;

  v_year  := EXTRACT(YEAR  FROM p_logical_period::date)::integer;
  v_month := EXTRACT(MONTH FROM p_logical_period::date)::integer;

  -- Conflict resolution
  SELECT source_timestamp, source_confidence
  INTO v_existing_ts, v_existing_conf
  FROM financial_projections
  WHERE project_id = p_project_id AND year = v_year AND month = v_month;

  IF FOUND AND v_existing_ts IS NOT NULL THEN
    IF p_source_timestamp < v_existing_ts THEN
      RETURN QUERY SELECT FALSE, 'stale_or_lower_confidence'::text;
      RETURN;
    ELSIF p_source_timestamp = v_existing_ts AND p_confidence < v_existing_conf THEN
      RETURN QUERY SELECT FALSE, 'stale_or_lower_confidence'::text;
      RETURN;
    END IF;
  END IF;

  INSERT INTO financial_projections (
    project_id, year, month,
    revenue, mrr, new_customers, churned_customers,
    cogs, payroll, marketing_spend, infrastructure, other_costs,
    gross_profit, gross_margin, net_profit,
    cash_balance, burn_rate, runway_months,
    integration_source, source_timestamp, source_confidence,
    updated_at
  ) VALUES (
    p_project_id, v_year, v_month,
    COALESCE((p_payload->>'revenue')::decimal, 0),
    COALESCE((p_payload->>'mrr')::decimal, 0),
    COALESCE((p_payload->>'new_customers')::integer, 0),
    COALESCE((p_payload->>'churned_customers')::integer, 0),
    COALESCE((p_payload->>'cogs')::decimal, 0),
    COALESCE((p_payload->>'payroll')::decimal, 0),
    COALESCE((p_payload->>'marketing_spend')::decimal, 0),
    COALESCE((p_payload->>'infrastructure')::decimal, 0),
    COALESCE((p_payload->>'other_costs')::decimal, 0),
    COALESCE((p_payload->>'gross_profit')::decimal, 0),
    COALESCE((p_payload->>'gross_margin')::decimal, 0),
    COALESCE((p_payload->>'net_profit')::decimal, 0),
    COALESCE((p_payload->>'cash_balance')::decimal, 0),
    COALESCE((p_payload->>'burn_rate')::decimal, 0),
    COALESCE((p_payload->>'runway_months')::integer, 0),
    p_provider, p_source_timestamp, p_confidence,
    NOW()
  )
  ON CONFLICT (project_id, year, month) DO UPDATE SET
    revenue           = CASE WHEN p_payload ? 'revenue'           THEN EXCLUDED.revenue           ELSE financial_projections.revenue           END,
    mrr               = CASE WHEN p_payload ? 'mrr'               THEN EXCLUDED.mrr               ELSE financial_projections.mrr               END,
    new_customers     = CASE WHEN p_payload ? 'new_customers'     THEN EXCLUDED.new_customers     ELSE financial_projections.new_customers     END,
    churned_customers = CASE WHEN p_payload ? 'churned_customers' THEN EXCLUDED.churned_customers ELSE financial_projections.churned_customers END,
    cogs              = CASE WHEN p_payload ? 'cogs'              THEN EXCLUDED.cogs              ELSE financial_projections.cogs              END,
    payroll           = CASE WHEN p_payload ? 'payroll'           THEN EXCLUDED.payroll           ELSE financial_projections.payroll           END,
    marketing_spend   = CASE WHEN p_payload ? 'marketing_spend'   THEN EXCLUDED.marketing_spend   ELSE financial_projections.marketing_spend   END,
    infrastructure    = CASE WHEN p_payload ? 'infrastructure'    THEN EXCLUDED.infrastructure    ELSE financial_projections.infrastructure    END,
    other_costs       = CASE WHEN p_payload ? 'other_costs'       THEN EXCLUDED.other_costs       ELSE financial_projections.other_costs       END,
    gross_profit      = CASE WHEN p_payload ? 'gross_profit'      THEN EXCLUDED.gross_profit      ELSE financial_projections.gross_profit      END,
    gross_margin      = CASE WHEN p_payload ? 'gross_margin'      THEN EXCLUDED.gross_margin      ELSE financial_projections.gross_margin      END,
    net_profit        = CASE WHEN p_payload ? 'net_profit'        THEN EXCLUDED.net_profit        ELSE financial_projections.net_profit        END,
    cash_balance      = CASE WHEN p_payload ? 'cash_balance'      THEN EXCLUDED.cash_balance      ELSE financial_projections.cash_balance      END,
    burn_rate         = CASE WHEN p_payload ? 'burn_rate'         THEN EXCLUDED.burn_rate         ELSE financial_projections.burn_rate         END,
    runway_months     = CASE WHEN p_payload ? 'runway_months'     THEN EXCLUDED.runway_months     ELSE financial_projections.runway_months     END,
    integration_source = EXCLUDED.integration_source,
    source_timestamp   = EXCLUDED.source_timestamp,
    source_confidence  = EXCLUDED.source_confidence,
    updated_at         = NOW();

  RETURN QUERY SELECT TRUE, NULL::text;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4c. project_economic_profile
-- Identity: project_id (singleton — una fila por proyecto)
-- Solo UPDATE — no INSERT (la fila requiere campos obligatorios que el agente no provee)
-- Finance Agent escribe principalmente: cash_on_hand, cash_on_hand_updated_at
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION _integration_write_economic_profile(
  p_project_id       UUID,
  p_payload          JSONB,
  p_source_timestamp TIMESTAMPTZ,
  p_confidence       NUMERIC,
  p_provider         TEXT
) RETURNS TABLE (ok BOOLEAN, reason TEXT)
LANGUAGE plpgsql AS $$
DECLARE
  v_rows_updated INTEGER;
  v_existing_ts  TIMESTAMPTZ;
  v_existing_conf NUMERIC;
BEGIN
  -- Conflict resolution
  SELECT source_timestamp, source_confidence
  INTO v_existing_ts, v_existing_conf
  FROM project_economic_profile
  WHERE project_id = p_project_id;

  IF NOT FOUND THEN
    -- La fila no existe — el agente no puede crearla (faltan campos obligatorios)
    RETURN QUERY SELECT FALSE, 'unknown_project'::text;
    RETURN;
  END IF;

  IF v_existing_ts IS NOT NULL THEN
    IF p_source_timestamp < v_existing_ts THEN
      RETURN QUERY SELECT FALSE, 'stale_or_lower_confidence'::text;
      RETURN;
    ELSIF p_source_timestamp = v_existing_ts AND p_confidence < v_existing_conf THEN
      RETURN QUERY SELECT FALSE, 'stale_or_lower_confidence'::text;
      RETURN;
    END IF;
  END IF;

  UPDATE project_economic_profile SET
    cash_on_hand             = CASE WHEN p_payload ? 'cash_on_hand'             THEN (p_payload->>'cash_on_hand')::numeric             ELSE cash_on_hand             END,
    cash_on_hand_updated_at  = CASE WHEN p_payload ? 'cash_on_hand'             THEN p_source_timestamp                                ELSE cash_on_hand_updated_at  END,
    avg_ticket               = CASE WHEN p_payload ? 'avg_ticket'               THEN (p_payload->>'avg_ticket')::numeric               ELSE avg_ticket               END,
    cac_estimate             = CASE WHEN p_payload ? 'cac_estimate'             THEN (p_payload->>'cac_estimate')::numeric             ELSE cac_estimate             END,
    gross_margin_target      = CASE WHEN p_payload ? 'gross_margin_target'      THEN (p_payload->>'gross_margin_target')::numeric      ELSE gross_margin_target      END,
    top_client_revenue_percent = CASE WHEN p_payload ? 'top_client_revenue_percent' THEN (p_payload->>'top_client_revenue_percent')::numeric ELSE top_client_revenue_percent END,
    integration_source       = p_provider,
    source_timestamp         = p_source_timestamp,
    source_confidence        = p_confidence
  WHERE project_id = p_project_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RETURN QUERY SELECT FALSE, 'unknown_project'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::text;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4d. tasks
-- Identity: (project_id, external_provider, external_id)
-- Temporal boundary: solo si completed_at >= integration_connections.connected_at
-- Tareas históricas → status = 'done_historical'
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION _integration_write_task(
  p_project_id       UUID,
  p_payload          JSONB,
  p_source_timestamp TIMESTAMPTZ,
  p_confidence       NUMERIC,
  p_provider         TEXT
) RETURNS TABLE (ok BOOLEAN, reason TEXT)
LANGUAGE plpgsql AS $$
DECLARE
  v_external_id     TEXT;
  v_completed_at    TIMESTAMPTZ;
  v_connected_at    TIMESTAMPTZ;
  v_status          TEXT;
BEGIN
  v_external_id  := p_payload->>'external_id';

  IF v_external_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'invalid_payload'::text;
    RETURN;
  END IF;

  -- Temporal boundary: tareas completadas antes de connected_at → done_historical
  v_completed_at := (p_payload->>'completed_at')::timestamptz;

  SELECT connected_at INTO v_connected_at
  FROM integration_connections
  WHERE project_id = p_project_id AND provider = p_provider AND status = 'active'
  LIMIT 1;

  IF v_completed_at IS NOT NULL AND v_connected_at IS NOT NULL AND v_completed_at < v_connected_at THEN
    v_status := 'done_historical';
  ELSE
    v_status := COALESCE(p_payload->>'status', 'todo');
  END IF;

  -- UPSERT via external identity
  INSERT INTO tasks (
    project_id,
    titulo, descripcion, status, prioridad,
    fecha_limite, assignee_id,
    completed_at,
    external_provider, external_id, external_synced_at,
    metadata
  ) VALUES (
    p_project_id,
    COALESCE(p_payload->>'titulo', p_payload->>'title', 'Sin título'),
    p_payload->>'descripcion',
    v_status::task_status,
    COALESCE((p_payload->>'prioridad')::integer, 2),
    (p_payload->>'fecha_limite')::date,
    (p_payload->>'assignee_id')::uuid,
    v_completed_at,
    p_provider,
    v_external_id,
    p_source_timestamp,
    COALESCE(p_payload->'metadata', '{}'::jsonb)
  )
  ON CONFLICT ON CONSTRAINT idx_tasks_external_identity DO UPDATE SET
    titulo              = CASE WHEN p_payload ? 'titulo' OR p_payload ? 'title' THEN EXCLUDED.titulo ELSE tasks.titulo END,
    descripcion         = CASE WHEN p_payload ? 'descripcion' THEN EXCLUDED.descripcion ELSE tasks.descripcion END,
    status              = EXCLUDED.status,
    prioridad           = CASE WHEN p_payload ? 'prioridad' THEN EXCLUDED.prioridad ELSE tasks.prioridad END,
    fecha_limite        = CASE WHEN p_payload ? 'fecha_limite' THEN EXCLUDED.fecha_limite ELSE tasks.fecha_limite END,
    completed_at        = CASE WHEN p_payload ? 'completed_at' THEN EXCLUDED.completed_at ELSE tasks.completed_at END,
    external_synced_at  = EXCLUDED.external_synced_at;

  RETURN QUERY SELECT TRUE, NULL::text;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4e. obvs
-- Identity: (project_id, external_provider, external_id)
-- En v1: Sales Agent puede escribir validaciones/leads de HubSpot
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION _integration_write_obv(
  p_project_id       UUID,
  p_payload          JSONB,
  p_source_timestamp TIMESTAMPTZ,
  p_confidence       NUMERIC,
  p_provider         TEXT
) RETURNS TABLE (ok BOOLEAN, reason TEXT)
LANGUAGE plpgsql AS $$
DECLARE
  v_external_id TEXT;
  v_owner_id    UUID;
BEGIN
  v_external_id := p_payload->>'external_id';

  IF v_external_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'invalid_payload'::text;
    RETURN;
  END IF;

  -- owner_id requerido por obvs — usar el connected_by del connection como owner
  SELECT connected_by INTO v_owner_id
  FROM integration_connections
  WHERE project_id = p_project_id AND provider = p_provider AND status = 'active'
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'invalid_sync_run'::text;
    RETURN;
  END IF;

  INSERT INTO obvs (
    owner_id, project_id,
    titulo, descripcion, tipo, fecha,
    nombre_contacto, empresa, email_contacto,
    pipeline_status, valor_potencial,
    external_provider, external_id
  ) VALUES (
    v_owner_id, p_project_id,
    COALESCE(p_payload->>'titulo', p_payload->>'title', 'Sin título'),
    p_payload->>'descripcion',
    COALESCE(p_payload->>'tipo', 'outbound_contact')::obv_type,
    COALESCE((p_payload->>'fecha')::date, CURRENT_DATE),
    p_payload->>'nombre_contacto',
    p_payload->>'empresa',
    p_payload->>'email_contacto',
    COALESCE(p_payload->>'pipeline_status', 'frio')::lead_status,
    (p_payload->>'valor_potencial')::decimal,
    p_provider,
    v_external_id
  )
  ON CONFLICT ON CONSTRAINT idx_obvs_external_identity DO UPDATE SET
    titulo          = CASE WHEN p_payload ? 'titulo' OR p_payload ? 'title' THEN EXCLUDED.titulo ELSE obvs.titulo END,
    descripcion     = CASE WHEN p_payload ? 'descripcion'     THEN EXCLUDED.descripcion     ELSE obvs.descripcion     END,
    pipeline_status = CASE WHEN p_payload ? 'pipeline_status' THEN EXCLUDED.pipeline_status ELSE obvs.pipeline_status END,
    valor_potencial = CASE WHEN p_payload ? 'valor_potencial' THEN EXCLUDED.valor_potencial ELSE obvs.valor_potencial END;

  RETURN QUERY SELECT TRUE, NULL::text;
END;
$$;

-- =============================================================================
-- PASO 5: Stored procedure principal
-- Todos los pasos son atómicos dentro de una sola transacción.
-- SECURITY DEFINER: corre con permisos del owner, bypaseando RLS en tablas de motor.
-- =============================================================================

CREATE OR REPLACE FUNCTION write_integration_to_engine_table(
  p_project_id       UUID,
  p_sync_run_id      UUID,
  p_insight_id       UUID,          -- NULL si no hay insight previo
  p_agent_type       TEXT,          -- 'finance' | 'sales' | 'execution' | 'team' | 'calendar'
  p_target           TEXT,          -- 'key_metrics' | 'financial_projections' | ...
  p_operation        TEXT,          -- 'upsert' | 'insert'
  p_payload          JSONB,
  p_logical_period   TEXT,          -- NULL para targets sin periodo (economic_profile, tasks, obvs)
  p_payload_hash     TEXT,          -- MD5(canonical_json(payload)) — calculado en TypeScript
  p_entity_ids       UUID[],
  p_confidence       NUMERIC,
  p_source_timestamp TIMESTAMPTZ
) RETURNS JSONB                      -- { ok: bool, reason: text|null, log_id: uuid|null }
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id      UUID;
  v_provider    TEXT;
  v_write_ok    BOOLEAN;
  v_write_reason TEXT;
  v_result      RECORD;
BEGIN
  -- ============================================================
  -- PASO 1: Validación
  -- ============================================================

  -- 1a. Verificar que project_id existe
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'unknown_project', 'log_id', NULL);
  END IF;

  -- 1b. Verificar que sync_run existe y está activo
  IF NOT EXISTS (
    SELECT 1 FROM integration_sync_runs
    WHERE id = p_sync_run_id
      AND project_id = p_project_id
      AND status IN ('running')
  ) THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'invalid_sync_run', 'log_id', NULL);
  END IF;

  -- Obtener provider del sync_run (necesario para sub-handlers)
  SELECT provider INTO v_provider
  FROM integration_sync_runs WHERE id = p_sync_run_id;

  -- 1c. Verificar autorización (agente × target)
  IF NOT (
    (p_agent_type = 'finance'    AND p_target IN ('key_metrics', 'financial_projections', 'project_economic_profile'))
    OR (p_agent_type = 'sales'   AND p_target = 'obvs')
    OR (p_agent_type = 'execution' AND p_target = 'tasks')
    -- team y calendar: sin targets en v1
  ) THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'unauthorized_target', 'log_id', NULL);
  END IF;

  -- 1d. Verificar confidence mínima para escritura en motor
  IF p_confidence < 0.8 THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'confidence_too_low', 'log_id', NULL);
  END IF;

  -- 1e. Verificar que source_timestamp no es futuro (tolerancia 5 minutos)
  IF p_source_timestamp > NOW() + INTERVAL '5 minutes' THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'invalid_payload', 'log_id', NULL);
  END IF;

  -- ============================================================
  -- PASO 2: Verificar payload no vacío
  -- ============================================================

  IF p_payload IS NULL OR p_payload = '{}'::jsonb THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'invalid_payload', 'log_id', NULL);
  END IF;

  -- ============================================================
  -- PASO 3: Idempotencia
  -- La UNIQUE constraint en integration_write_log garantiza esto estructuralmente.
  -- Si ya existe un registro 'written' con el mismo hash, devolver duplicate_skipped.
  -- ============================================================

  SELECT id INTO v_log_id
  FROM integration_write_log
  WHERE project_id    = p_project_id
    AND sync_run_id   = p_sync_run_id
    AND target        = p_target
    AND logical_period IS NOT DISTINCT FROM p_logical_period
    AND payload_hash  = p_payload_hash
    AND status        = 'written';

  IF FOUND THEN
    RETURN jsonb_build_object('ok', TRUE, 'reason', 'duplicate_skipped', 'log_id', v_log_id);
  END IF;

  -- ============================================================
  -- PASO 4: Crear registro en integration_write_log (status = 'pending')
  -- ============================================================

  INSERT INTO integration_write_log (
    project_id, sync_run_id, insight_id,
    agent_type, target, logical_period, operation,
    payload_hash, entity_ids, confidence, source_timestamp,
    status, created_at
  ) VALUES (
    p_project_id, p_sync_run_id, p_insight_id,
    p_agent_type, p_target, p_logical_period, p_operation,
    p_payload_hash, COALESCE(p_entity_ids, '{}'), p_confidence, p_source_timestamp,
    'pending', NOW()
  )
  ON CONFLICT ON CONSTRAINT uq_write_log DO UPDATE
    SET status = 'pending'  -- re-intento de un write previo que quedó en pending
  RETURNING id INTO v_log_id;

  -- ============================================================
  -- PASO 5: Ejecutar write via sub-handler por target
  -- ============================================================

  CASE p_target
    WHEN 'key_metrics' THEN
      SELECT r.ok, r.reason INTO v_write_ok, v_write_reason
      FROM _integration_write_key_metrics(
        p_project_id, p_payload, p_source_timestamp, p_confidence, v_provider
      ) r;

    WHEN 'financial_projections' THEN
      SELECT r.ok, r.reason INTO v_write_ok, v_write_reason
      FROM _integration_write_financial_projections(
        p_project_id, p_payload, p_logical_period, p_source_timestamp, p_confidence, v_provider
      ) r;

    WHEN 'project_economic_profile' THEN
      SELECT r.ok, r.reason INTO v_write_ok, v_write_reason
      FROM _integration_write_economic_profile(
        p_project_id, p_payload, p_source_timestamp, p_confidence, v_provider
      ) r;

    WHEN 'tasks' THEN
      SELECT r.ok, r.reason INTO v_write_ok, v_write_reason
      FROM _integration_write_task(
        p_project_id, p_payload, p_source_timestamp, p_confidence, v_provider
      ) r;

    WHEN 'obvs' THEN
      SELECT r.ok, r.reason INTO v_write_ok, v_write_reason
      FROM _integration_write_obv(
        p_project_id, p_payload, p_source_timestamp, p_confidence, v_provider
      ) r;

    ELSE
      v_write_ok := FALSE;
      v_write_reason := 'unauthorized_target';
  END CASE;

  -- ============================================================
  -- PASO 6: Actualizar integration_write_log con resultado final
  -- ============================================================

  IF v_write_ok THEN
    UPDATE integration_write_log
    SET status   = 'written',
        wrote_at = NOW(),
        reason   = NULL
    WHERE id = v_log_id;

    RETURN jsonb_build_object('ok', TRUE, 'reason', NULL, 'log_id', v_log_id);
  ELSE
    UPDATE integration_write_log
    SET status = 'rejected',
        reason = v_write_reason
    WHERE id = v_log_id;

    RETURN jsonb_build_object('ok', FALSE, 'reason', v_write_reason, 'log_id', v_log_id);
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error inesperado, marcar log como rejected y re-lanzar
    IF v_log_id IS NOT NULL THEN
      UPDATE integration_write_log
      SET status = 'rejected', reason = SQLERRM
      WHERE id = v_log_id;
    END IF;
    RAISE;
END;
$$;

-- Revocar acceso público — solo llamable vía service_role o funciones autorizadas
REVOKE ALL ON FUNCTION write_integration_to_engine_table(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, UUID[], NUMERIC, TIMESTAMPTZ
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION write_integration_to_engine_table(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, UUID[], NUMERIC, TIMESTAMPTZ
) TO service_role;
