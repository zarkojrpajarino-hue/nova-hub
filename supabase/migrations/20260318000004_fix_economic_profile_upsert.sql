-- Fix: _integration_write_economic_profile — UPSERT safe
--
-- Problema: la función anterior era UPDATE-only.
-- Si el proyecto no tenía fila en project_economic_profile
-- (proyectos creados antes de que el motor fuera obligatorio),
-- devolvía 'unknown_project' silenciosamente y el write se perdía.
--
-- Fix: INSERT ... ON CONFLICT DO UPDATE con model_type='unknown' como safe default.
-- No sobreescribe model_type si la fila ya existe.
-- Los campos opcionales (avg_ticket, cac_estimate, etc.) siguen siendo NULL hasta que
-- el founder los declare explícitamente.

CREATE OR REPLACE FUNCTION _integration_write_economic_profile(
  p_project_id       UUID,
  p_payload          JSONB,
  p_source_timestamp TIMESTAMPTZ,
  p_confidence       NUMERIC,
  p_provider         TEXT
) RETURNS TABLE (ok BOOLEAN, reason TEXT)
LANGUAGE plpgsql AS $$
DECLARE
  v_existing_ts   TIMESTAMPTZ;
  v_existing_conf NUMERIC;
  v_rows_affected INTEGER;
BEGIN
  -- ── Conflict resolution: solo rechazar si hay datos más recientes ────────────
  SELECT source_timestamp, source_confidence
  INTO v_existing_ts, v_existing_conf
  FROM project_economic_profile
  WHERE project_id = p_project_id;

  IF FOUND AND v_existing_ts IS NOT NULL THEN
    IF p_source_timestamp < v_existing_ts THEN
      RETURN QUERY SELECT FALSE, 'stale_or_lower_confidence'::text;
      RETURN;
    ELSIF p_source_timestamp = v_existing_ts AND p_confidence < v_existing_conf THEN
      RETURN QUERY SELECT FALSE, 'stale_or_lower_confidence'::text;
      RETURN;
    END IF;
  END IF;

  -- ── UPSERT seguro: crea la fila con defaults si no existe ───────────────────
  -- model_type = 'unknown' es el valor más conservador (no asume nada del modelo)
  INSERT INTO project_economic_profile (
    project_id,
    model_type,
    pricing_model,
    revenue_type,
    field_sources,
    confidence_score,
    confidence_level,
    top_client_revenue_percent,
    cash_on_hand,
    cash_on_hand_updated_at,
    avg_ticket,
    cac_estimate,
    gross_margin_target,
    integration_source,
    source_timestamp,
    source_confidence
  ) VALUES (
    p_project_id,
    'unknown',                      -- safe default — sin asumir tipo de modelo
    'unknown',
    'mixed',
    '{}',
    0,
    'low',
    CASE WHEN p_payload ? 'top_client_revenue_percent'
         THEN (p_payload->>'top_client_revenue_percent')::numeric ELSE NULL END,
    CASE WHEN p_payload ? 'cash_on_hand'
         THEN (p_payload->>'cash_on_hand')::numeric ELSE NULL END,
    CASE WHEN p_payload ? 'cash_on_hand'
         THEN p_source_timestamp ELSE NULL END,
    CASE WHEN p_payload ? 'avg_ticket'
         THEN (p_payload->>'avg_ticket')::numeric ELSE NULL END,
    CASE WHEN p_payload ? 'cac_estimate'
         THEN (p_payload->>'cac_estimate')::numeric ELSE NULL END,
    CASE WHEN p_payload ? 'gross_margin_target'
         THEN (p_payload->>'gross_margin_target')::numeric ELSE NULL END,
    p_provider,
    p_source_timestamp,
    p_confidence
  )
  ON CONFLICT (project_id) DO UPDATE SET
    top_client_revenue_percent = CASE WHEN p_payload ? 'top_client_revenue_percent'
                                      THEN (p_payload->>'top_client_revenue_percent')::numeric
                                      ELSE project_economic_profile.top_client_revenue_percent END,
    cash_on_hand               = CASE WHEN p_payload ? 'cash_on_hand'
                                      THEN (p_payload->>'cash_on_hand')::numeric
                                      ELSE project_economic_profile.cash_on_hand END,
    cash_on_hand_updated_at    = CASE WHEN p_payload ? 'cash_on_hand'
                                      THEN p_source_timestamp
                                      ELSE project_economic_profile.cash_on_hand_updated_at END,
    avg_ticket                 = CASE WHEN p_payload ? 'avg_ticket'
                                      THEN (p_payload->>'avg_ticket')::numeric
                                      ELSE project_economic_profile.avg_ticket END,
    cac_estimate               = CASE WHEN p_payload ? 'cac_estimate'
                                      THEN (p_payload->>'cac_estimate')::numeric
                                      ELSE project_economic_profile.cac_estimate END,
    gross_margin_target        = CASE WHEN p_payload ? 'gross_margin_target'
                                      THEN (p_payload->>'gross_margin_target')::numeric
                                      ELSE project_economic_profile.gross_margin_target END,
    integration_source         = p_provider,
    source_timestamp           = p_source_timestamp,
    source_confidence          = p_confidence;
    -- model_type, pricing_model, revenue_type: NO se tocan en ON CONFLICT
    -- Solo el founder puede cambiar la clasificación del modelo de negocio.

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    -- No debería ocurrir con UPSERT, pero por seguridad
    RETURN QUERY SELECT FALSE, 'unknown_project'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::text;
END;
$$;
