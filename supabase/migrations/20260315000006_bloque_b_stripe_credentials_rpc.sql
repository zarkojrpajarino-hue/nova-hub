-- BLOQUE B: RPC de credenciales + fix trigger_source CHECK
-- Prerequisito para connect-stripe y sync-stripe edge functions.
--
-- 1. Añade 'integration' al CHECK de trigger_source en project_probability_history.
-- 2. upsert_integration_credential — escribe credencial cifrada (SECURITY DEFINER).
-- 3. decrypt_integration_credential — lee credencial descifrada (SECURITY DEFINER).
-- 4. get_engine_snapshot — snapshot de 4 motores para pre/post sync (SECURITY DEFINER).
--
-- Ambos RPCs restringidos a service_role. Nunca expuestos al cliente JS.

-- =============================================================================
-- 1. TRIGGER_SOURCE CHECK — añadir 'integration'
-- El motor run_probability_engine llama con trigger_source='integration'
-- desde la edge function sync-stripe. Sin este fix → constraint violation.
-- =============================================================================

ALTER TABLE project_probability_history
  DROP CONSTRAINT IF EXISTS project_probability_history_trigger_source_check;

ALTER TABLE project_probability_history
  ADD CONSTRAINT project_probability_history_trigger_source_check
    CHECK (trigger_source IN ('weekly_job', 'acceleration', 'regression', 'integration'));

-- =============================================================================
-- 2. upsert_integration_credential
-- Cifra con pgp_sym_encrypt y hace upsert en integration_credentials.
-- Llamar solo desde edge functions con service_role.
-- =============================================================================

CREATE OR REPLACE FUNCTION upsert_integration_credential(
  p_connection_id      UUID,
  p_project_id         UUID,
  p_provider           TEXT,
  p_credential_key     TEXT,
  p_credential_plaintext TEXT,
  p_app_secret         TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO integration_credentials (
    connection_id,
    project_id,
    provider,
    credential_key,
    credential_enc
  )
  VALUES (
    p_connection_id,
    p_project_id,
    p_provider,
    p_credential_key,
    encode(pgp_sym_encrypt(p_credential_plaintext, p_app_secret), 'escape')
  )
  ON CONFLICT (connection_id, credential_key) DO UPDATE
    SET credential_enc = encode(pgp_sym_encrypt(p_credential_plaintext, p_app_secret), 'escape'),
        updated_at     = NOW();
END;
$$;

REVOKE ALL ON FUNCTION upsert_integration_credential(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION upsert_integration_credential(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION upsert_integration_credential(UUID, UUID, TEXT, TEXT, TEXT, TEXT) IS
  'Cifra y almacena una credencial de integración con pgp_sym_encrypt. Solo service_role. Idempotente.';

-- =============================================================================
-- 3. decrypt_integration_credential
-- Descifra y devuelve la credencial en texto plano.
-- Llamar solo desde edge functions con service_role.
-- =============================================================================

CREATE OR REPLACE FUNCTION decrypt_integration_credential(
  p_connection_id  UUID,
  p_credential_key TEXT,
  p_app_secret     TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result TEXT;
BEGIN
  SELECT convert_from(
    pgp_sym_decrypt(decode(credential_enc, 'escape'), p_app_secret),
    'UTF8'
  )
  INTO v_result
  FROM  integration_credentials
  WHERE connection_id  = p_connection_id
    AND credential_key = p_credential_key;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION decrypt_integration_credential(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION decrypt_integration_credential(UUID, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION decrypt_integration_credential(UUID, TEXT, TEXT) IS
  'Descifra y devuelve una credencial de integración. Solo service_role. Devuelve NULL si no existe.';

-- =============================================================================
-- 4. get_engine_snapshot
-- Captura estado de 4 motores para pre/post snapshot de sync_run.
-- Llamar desde sync-stripe antes y después del write guard.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_engine_snapshot(
  p_project_id UUID
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'probability',      jsonb_build_object(
                          'value',  pp.probability_score,
                          'status', pp.probability_status
                        ),
    'phase',            jsonb_build_object(
                          'current_phase', pps.current_phase,
                          'phase_score',   pps.phase_score
                        ),
    'risk',             jsonb_build_object(
                          'level', prs.risk_level,
                          'score', prs.risk_score
                        ),
    'economic_profile', jsonb_build_object(
                          'mrr',           km.mrr,
                          'runway_months', km.runway_months
                        )
  )
  FROM   project_probability pp
  LEFT JOIN project_phase_state pps ON pps.project_id = pp.project_id
  LEFT JOIN project_risk_score  prs ON prs.project_id = pp.project_id
  LEFT JOIN LATERAL (
    SELECT mrr, runway_months
    FROM   key_metrics
    WHERE  project_id = pp.project_id
    ORDER  BY date DESC
    LIMIT  1
  ) km ON TRUE
  WHERE  pp.project_id = p_project_id;
$$;

REVOKE ALL ON FUNCTION get_engine_snapshot(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_engine_snapshot(UUID) TO service_role;

COMMENT ON FUNCTION get_engine_snapshot(UUID) IS
  'Captura snapshot de 4 motores (probability, phase, risk, economic_profile) para narrativa causal pre/post sync. Solo service_role.';
