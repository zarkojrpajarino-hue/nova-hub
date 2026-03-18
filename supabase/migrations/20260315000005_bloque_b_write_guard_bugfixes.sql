-- BLOQUE B: Correcciones al stored procedure write_integration_to_engine_table()
--
-- Bug 1 (crítico): WHEN OTHERS rollback deshace el INSERT del log (paso 4).
--   El UPDATE en el handler actualizaba una fila inexistente — trazabilidad perdida.
--   Fix: guardar SQLERRM, INSERT nuevo registro 'rejected', RETURN sin RAISE.
--   RAISE re-lanza la excepción y deshace incluso el INSERT del handler — no usar.
--
-- Bug 2: obv_type 'outbound_contact' no existe en el ENUM.
--   ENUM válido: 'exploracion' | 'validacion' | 'venta'.
--   Fix: default 'validacion' para OBVs externos sin tipo explícito.
--
-- Bug 3: ON CONFLICT ON CONSTRAINT para índices parciales creados con CREATE UNIQUE INDEX.
--   ON CONFLICT ON CONSTRAINT solo es válido para constraints nombrados (CONSTRAINT ... UNIQUE).
--   idx_tasks_external_identity e idx_obvs_external_identity son CREATE UNIQUE INDEX.
--   Fix: ON CONFLICT (cols) WHERE predicate — sintaxis correcta para partial indexes.
--
-- Referencia: INTEGRATION_WRITE_GUARD.md

-- =============================================================================
-- Fix Bug 3: _integration_write_task
-- Cambio: ON CONFLICT ON CONSTRAINT → ON CONFLICT (cols) WHERE predicate
-- =============================================================================

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
  -- ON CONFLICT usa sintaxis de partial index (CREATE UNIQUE INDEX, no CONSTRAINT ... UNIQUE)
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
  ON CONFLICT (project_id, external_provider, external_id)
    WHERE external_provider IS NOT NULL AND external_id IS NOT NULL
  DO UPDATE SET
    titulo             = CASE WHEN p_payload ? 'titulo' OR p_payload ? 'title' THEN EXCLUDED.titulo ELSE tasks.titulo END,
    descripcion        = CASE WHEN p_payload ? 'descripcion'  THEN EXCLUDED.descripcion  ELSE tasks.descripcion  END,
    status             = EXCLUDED.status,
    prioridad          = CASE WHEN p_payload ? 'prioridad'    THEN EXCLUDED.prioridad    ELSE tasks.prioridad    END,
    fecha_limite       = CASE WHEN p_payload ? 'fecha_limite' THEN EXCLUDED.fecha_limite ELSE tasks.fecha_limite END,
    completed_at       = CASE WHEN p_payload ? 'completed_at' THEN EXCLUDED.completed_at ELSE tasks.completed_at END,
    external_synced_at = EXCLUDED.external_synced_at;

  RETURN QUERY SELECT TRUE, NULL::text;
END;
$$;

-- =============================================================================
-- Fix Bug 2 + Bug 3: _integration_write_obv
-- Cambio 1: 'outbound_contact' → 'validacion' como default de tipo
-- Cambio 2: ON CONFLICT ON CONSTRAINT → ON CONFLICT (cols) WHERE predicate
-- =============================================================================

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
    -- Bug 2 fix: 'outbound_contact' no existe en obv_type ENUM ('exploracion','validacion','venta')
    COALESCE(p_payload->>'tipo', 'validacion')::obv_type,
    COALESCE((p_payload->>'fecha')::date, CURRENT_DATE),
    p_payload->>'nombre_contacto',
    p_payload->>'empresa',
    p_payload->>'email_contacto',
    COALESCE(p_payload->>'pipeline_status', 'frio')::lead_status,
    (p_payload->>'valor_potencial')::decimal,
    p_provider,
    v_external_id
  )
  -- Bug 3 fix: ON CONFLICT usa sintaxis de partial index (CREATE UNIQUE INDEX, no CONSTRAINT ... UNIQUE)
  ON CONFLICT (project_id, external_provider, external_id)
    WHERE external_provider IS NOT NULL AND external_id IS NOT NULL
  DO UPDATE SET
    titulo          = CASE WHEN p_payload ? 'titulo' OR p_payload ? 'title' THEN EXCLUDED.titulo ELSE obvs.titulo END,
    descripcion     = CASE WHEN p_payload ? 'descripcion'     THEN EXCLUDED.descripcion     ELSE obvs.descripcion     END,
    pipeline_status = CASE WHEN p_payload ? 'pipeline_status' THEN EXCLUDED.pipeline_status ELSE obvs.pipeline_status END,
    valor_potencial = CASE WHEN p_payload ? 'valor_potencial' THEN EXCLUDED.valor_potencial ELSE obvs.valor_potencial END;

  RETURN QUERY SELECT TRUE, NULL::text;
END;
$$;

-- =============================================================================
-- Fix Bug 1: write_integration_to_engine_table — EXCEPTION handler
-- Cambio: UPDATE (fila inexistente) + RAISE → INSERT nuevo registro + RETURN sin RAISE
--
-- Mecánica PL/pgSQL:
--   WHEN OTHERS revierte el BEGIN block al savepoint establecido al inicio del bloque.
--   Eso incluye el INSERT del paso 4 (v_log_id puede ser no-null pero la fila fue deshecha).
--   El UPDATE en el handler anterior actualizaba una fila que no existía → silencio, sin traza.
--   RAISE re-lanza la excepción y revierte también el work del handler → doble rollback.
--
-- Fix:
--   1. Guardar SQLERRM inmediatamente (antes de ejecutar otros statements).
--   2. INSERT nuevo registro 'rejected' con ON CONFLICT por si hay un intento previo.
--   3. RETURN el error JSONB — no RAISE.
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
    -- Bug 1 fix:
    -- WHEN OTHERS revierte el BEGIN block al savepoint → el INSERT del paso 4 fue deshecho.
    -- Guardar SQLERRM antes de ejecutar otros statements (sigue disponible pero por claridad).
    -- INSERT nuevo registro 'rejected' — no UPDATE (la fila no existe).
    -- No usar RAISE — re-lanzaría la excepción y desharía también este INSERT.
    v_write_reason := SQLERRM;
    INSERT INTO integration_write_log (
      project_id, sync_run_id, insight_id,
      agent_type, target, logical_period, operation,
      payload_hash, entity_ids, confidence, source_timestamp,
      status, reason, created_at
    ) VALUES (
      p_project_id, p_sync_run_id, p_insight_id,
      p_agent_type, p_target, p_logical_period, p_operation,
      p_payload_hash, COALESCE(p_entity_ids, '{}'), p_confidence, p_source_timestamp,
      'rejected', v_write_reason, NOW()
    )
    ON CONFLICT ON CONSTRAINT uq_write_log DO UPDATE
      SET status = 'rejected', reason = EXCLUDED.reason
    RETURNING id INTO v_log_id;

    RETURN jsonb_build_object('ok', FALSE, 'reason', v_write_reason, 'log_id', v_log_id);
END;
$$;

-- Nota: CREATE OR REPLACE preserva los GRANT/REVOKE existentes de la migración 00004.
-- No se repiten aquí para evitar duplicación.
