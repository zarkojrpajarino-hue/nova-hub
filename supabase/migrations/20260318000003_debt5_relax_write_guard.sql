-- I15.DEBT.5 — Relajar constraint de status en write_integration_to_engine_table
--
-- Problema documentado en TASK_LIST.md §I15.DEBT.5:
--   PASO 1b exigía sync_run.status='running'. Los agentes que corren POST-sync
--   (edge functions o cliente) reciben 'invalid_sync_run' porque el sync_run
--   ya está en 'completed' o 'partial'.
--
-- Fix: aceptar status IN ('running', 'completed', 'partial').
--   - La seguridad real la dan los checks 1a (project_id), 1c (agent × target),
--     1d (confidence mínima) — no el status del sync_run.
--   - Idempotencia sigue garantizada por el hash check (PASO 3).
--   - Permite future edge functions run-finance-agent, run-sales-agent que
--     corren tras el sync con sync_run ya completado (Opción A de TASK_LIST).
--
-- Nota: CREATE OR REPLACE preserva los GRANT/REVOKE existentes (20260315000005).
-- Solo se cambia la línea de validación de status en PASO 1b.
-- Esta es la versión completa tras los bugfixes de 20260315000005.

CREATE OR REPLACE FUNCTION write_integration_to_engine_table(
  p_project_id       UUID,
  p_sync_run_id      UUID,
  p_insight_id       UUID,
  p_agent_type       TEXT,
  p_target           TEXT,
  p_operation        TEXT,
  p_payload          JSONB,
  p_logical_period   TEXT,
  p_payload_hash     TEXT,
  p_entity_ids       UUID[],
  p_confidence       NUMERIC,
  p_source_timestamp TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id       UUID;
  v_provider     TEXT;
  v_write_ok     BOOLEAN;
  v_write_reason TEXT;
  v_result       RECORD;
BEGIN
  -- ============================================================
  -- PASO 1: Validación
  -- ============================================================

  -- 1a. Verificar que project_id existe
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RETURN jsonb_build_object('ok', FALSE, 'reason', 'unknown_project', 'log_id', NULL);
  END IF;

  -- 1b. Verificar que sync_run existe y pertenece al proyecto
  --     I15.DEBT.5 FIX: acepta 'running' | 'completed' | 'partial'
  --     antes solo 'running' → agentes post-sync recibían 'invalid_sync_run'.
  IF NOT EXISTS (
    SELECT 1 FROM integration_sync_runs
    WHERE id         = p_sync_run_id
      AND project_id = p_project_id
      AND status     IN ('running', 'completed', 'partial')
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
  -- PASO 3: Idempotencia — hash check
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
    SET status = 'pending'
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
    -- Bug 1 fix (20260315000005): INSERT nuevo registro 'rejected' en lugar de UPDATE.
    -- WHEN OTHERS revierte el BEGIN block → INSERT del paso 4 fue deshecho.
    -- No usar RAISE — re-lanzaría la excepción y desharía este INSERT también.
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
