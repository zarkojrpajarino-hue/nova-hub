-- =============================================================================
-- MIGRACIÓN 00024 — E4.17/E4.18/E4.19: Economic Profile Engine
--
-- Implementa tres tareas en una sola función:
--
--   E4.17 — compute conservador sobre schema real (migración 00002 autoritativa)
--     Campos derivables con señal suficiente:
--       avg_ticket           ← AVG(obvs.facturacion / cantidad) para es_venta=TRUE (≥3 OBVs)
--       gross_margin_target  ← AVG(financial_projections.gross_margin) últimos 3 meses (≥2)
--       revenue_type         ← key_metrics.mrr + sales OBVs (≥3 key_metrics records)
--     Campos NO autodetectados: model_type, pricing_model, sales_cycle_days, cac_estimate
--     (dependen de declaración del founder — sin evidencia suficiente para inferencia)
--     Confidence score: 7 campos / denominador fijo 7 / pesos 1.0-0.8-0.5-0.0
--
--   E4.18 — historial solo por cambios materiales
--     Campos vigilados: model_type, pricing_model, revenue_type,
--       sales_cycle_days (por tramo: fast<8d, medium 8-30d, long 31-90d, very_long>90d),
--       gross_margin_target (cambio ≥10pp), avg_ticket (cambio ≥25%), confidence_level
--     change_reason: 'computed_update' | 'confidence_updated'
--
--   E4.19 — 4 reglas de incoherencia (incoherences JSONB)
--     1. saas_transactional       — model_type='saas' AND revenue_type='transactional'
--     2. subscription_no_mrr      — pricing_model='subscription' AND mrr=0 en fase 2+ ≥12w
--     3. high_ticket_no_pipeline  — avg_ticket≥300 AND sales_cycle≥14d AND sin late-stage pipeline
--                                    en fase 2+ ≥8w
--     4. concentrated_scalable    — top_client_revenue_percent≥60 AND model_type IN ('saas','marketplace')
--
-- Fix colateral:
--   migration 00010 puso get_active_engine_version('risk') como DEFAULT en
--   project_economic_profile.engine_version. Corregido aquí a 'economic_profile'.
--
-- Cron: domingo 02:00 UTC (después de Viability Engine 01:30)
-- Pipeline dominical: Phase(00:00) → Probability(00:30) → Risk(01:00) → Viability(01:30) → Economic(02:00)
--
-- Fuentes verificadas:
--   project_economic_profile   — migración 00002 (autoritativa)
--   project_economic_profile_history — migración 00002
--   obvs.es_venta, .facturacion, .cantidad, .pipeline_status — migración 00001
--   key_metrics.mrr, .date     — migración 00001
--   financial_projections.gross_margin, .year, .month — migración 00001
--   project_phase_state.current_phase — migración 00002
--   projects.created_at        — migración 00001
-- =============================================================================

-- =============================================================================
-- 1. Ampliar CHECK constraint en engine_versions.motor
--    El constraint original solo incluía 5 motores. Añadimos 'economic_profile'.
-- =============================================================================

ALTER TABLE engine_versions
  DROP CONSTRAINT IF EXISTS engine_versions_motor_check;

ALTER TABLE engine_versions
  ADD CONSTRAINT engine_versions_motor_check
  CHECK (motor IN ('phase', 'probability', 'viability', 'execution', 'risk', 'economic_profile'));

-- =============================================================================
-- 2. Engine version
-- =============================================================================

INSERT INTO engine_versions (id, motor, deployed_at, notes)
VALUES (
  'economic_profile_v1.0',
  'economic_profile',
  NOW(),
  'E4.17–E4.19: compute conservador + change detection + incoherences'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. Fix DEFAULT en project_economic_profile.engine_version
--    migration 00010 hardcodeó 'risk' por error
-- =============================================================================

ALTER TABLE project_economic_profile
  ALTER COLUMN engine_version
  SET DEFAULT get_active_engine_version('economic_profile');

-- =============================================================================
-- 4. Añadir columna incoherences (E4.19)
-- =============================================================================

ALTER TABLE project_economic_profile
  ADD COLUMN IF NOT EXISTS incoherences JSONB NOT NULL DEFAULT '[]';

COMMENT ON COLUMN project_economic_profile.incoherences IS
  'Array de incoherencias detectadas. Cada elemento: {"code": "...", "severity": "high|medium"}. '
  'Vacío = sin incoherencias. Códigos: saas_transactional, subscription_no_mrr, '
  'high_ticket_no_pipeline, concentrated_scalable.';

-- =============================================================================
-- 5. run_economic_profile_engine
-- =============================================================================

CREATE OR REPLACE FUNCTION run_economic_profile_engine(
  p_project_id     UUID,
  p_trigger_source TEXT DEFAULT 'weekly_job'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Engine version
  v_ver                TEXT;

  -- Current profile snapshot
  v_pep                project_economic_profile%ROWTYPE;

  -- Computed field helpers
  v_cnt                BIGINT;
  v_comp_avg_ticket    NUMERIC;
  v_comp_gross_margin  NUMERIC;
  v_km_count           BIGINT;
  v_mrr_avg            NUMERIC;
  v_sales_count        BIGINT;
  v_comp_rev_type      TEXT;

  -- Final values going into UPSERT
  v_new_field_sources  JSONB;
  v_new_avg_ticket     NUMERIC;
  v_new_gross_margin   NUMERIC;
  v_new_revenue_type   TEXT;
  v_new_incoherences   JSONB := '[]';
  v_new_conf_score     NUMERIC;
  v_new_conf_level     TEXT;

  -- Confidence weights (7 fields, fixed denominator)
  v_w1  NUMERIC := 0;   -- model_type
  v_w2  NUMERIC := 0;   -- pricing_model
  v_w3  NUMERIC := 0;   -- revenue_type
  v_w4  NUMERIC := 0;   -- avg_ticket
  v_w5  NUMERIC := 0;   -- sales_cycle_days
  v_w6  NUMERIC := 0;   -- gross_margin_target
  v_w7  NUMERIC := 0;   -- cac_estimate

  -- E4.19 helpers
  v_phase              SMALLINT;
  v_late_leads         BIGINT;
  v_project_age        INTERVAL;

  -- E4.18 change detection
  v_last_snapshot      JSONB;
  v_changed_fields     JSONB := '{}';
  v_has_data_change    BOOLEAN := FALSE;
  v_has_conf_change    BOOLEAN := FALSE;
  v_change_reason      TEXT;
  v_profile_snapshot   JSONB;

  -- Sales cycle tramo
  v_old_tramo          TEXT;
  v_new_tramo          TEXT;
BEGIN

  -- -------------------------------------------------------------------------
  -- Engine version
  -- -------------------------------------------------------------------------
  SELECT id INTO v_ver
  FROM   engine_versions
  WHERE  motor     = 'economic_profile'
    AND  is_active = TRUE
  LIMIT  1;
  v_ver := COALESCE(v_ver, 'economic_profile_v1.0');

  -- -------------------------------------------------------------------------
  -- Current profile
  -- -------------------------------------------------------------------------
  SELECT * INTO v_pep
  FROM   project_economic_profile
  WHERE  project_id = p_project_id;

  -- Defensive seed if row somehow missing
  IF NOT FOUND THEN
    INSERT INTO project_economic_profile (
      project_id, model_type, pricing_model, revenue_type,
      field_sources, confidence_score, confidence_level,
      incoherences, last_updated_at, engine_version
    ) VALUES (
      p_project_id, 'unknown', 'unknown', 'mixed',
      '{}', 0, 'low', '[]', NOW(), v_ver
    )
    ON CONFLICT (project_id) DO NOTHING;

    SELECT * INTO v_pep FROM project_economic_profile WHERE project_id = p_project_id;
  END IF;

  v_new_field_sources := COALESCE(v_pep.field_sources, '{}');

  -- -------------------------------------------------------------------------
  -- E4.17 — Compute: avg_ticket
  -- Only if not explicitly declared by founder (field_sources.avg_ticket != 'declared')
  -- Requires ≥3 qualifying sales OBVs
  -- -------------------------------------------------------------------------
  IF COALESCE(v_new_field_sources->>'avg_ticket', '') != 'declared' THEN

    SELECT COUNT(*), AVG(facturacion / NULLIF(cantidad, 0))
    INTO   v_cnt, v_comp_avg_ticket
    FROM   obvs
    WHERE  project_id  = p_project_id
      AND  es_venta    = TRUE
      AND  facturacion > 0
      AND  cantidad    > 0;

    IF v_cnt >= 3 AND v_comp_avg_ticket IS NOT NULL THEN
      v_new_avg_ticket    := ROUND(v_comp_avg_ticket, 2);
      v_new_field_sources := jsonb_set(v_new_field_sources, '{avg_ticket}', '"computed"');
    ELSE
      v_new_avg_ticket := v_pep.avg_ticket;  -- no signal — keep current
    END IF;

  ELSE
    v_new_avg_ticket := v_pep.avg_ticket;
  END IF;

  -- -------------------------------------------------------------------------
  -- E4.17 — Compute: gross_margin_target
  -- From financial_projections, last 3 calendar months, ≥2 records
  -- -------------------------------------------------------------------------
  IF COALESCE(v_new_field_sources->>'gross_margin_target', '') != 'declared' THEN

    SELECT COUNT(*), AVG(gross_margin)
    INTO   v_cnt, v_comp_gross_margin
    FROM   financial_projections
    WHERE  project_id   = p_project_id
      AND  gross_margin > 0
      AND  (year * 12 + month) >= (
             EXTRACT(YEAR  FROM NOW())::INT * 12
           + EXTRACT(MONTH FROM NOW())::INT - 3
           );

    IF v_cnt >= 2 AND v_comp_gross_margin IS NOT NULL THEN
      v_new_gross_margin  := ROUND(v_comp_gross_margin, 2);
      v_new_field_sources := jsonb_set(v_new_field_sources, '{gross_margin_target}', '"computed"');
    ELSE
      v_new_gross_margin := v_pep.gross_margin_target;
    END IF;

  ELSE
    v_new_gross_margin := v_pep.gross_margin_target;
  END IF;

  -- -------------------------------------------------------------------------
  -- E4.17 — Compute: revenue_type
  -- From key_metrics.mrr + sales OBVs. Requires ≥3 key_metrics records.
  -- recurring:     mrr > 0 AND no sales OBVs
  -- transactional: mrr = 0 AND sales OBVs exist
  -- mixed:         mrr > 0 AND sales OBVs exist
  -- No signal:     keep current value
  -- -------------------------------------------------------------------------
  IF COALESCE(v_new_field_sources->>'revenue_type', '') != 'declared' THEN

    SELECT COUNT(*), COALESCE(AVG(mrr), 0)
    INTO   v_km_count, v_mrr_avg
    FROM (
      SELECT mrr FROM key_metrics
      WHERE  project_id = p_project_id
      ORDER  BY date DESC
      LIMIT  4
    ) sub;

    SELECT COUNT(*) INTO v_sales_count
    FROM   obvs
    WHERE  project_id = p_project_id
      AND  es_venta   = TRUE;

    IF v_km_count >= 3 THEN
      v_comp_rev_type := CASE
        WHEN v_mrr_avg > 0 AND v_sales_count > 0 THEN 'mixed'
        WHEN v_mrr_avg > 0                        THEN 'recurring'
        WHEN v_sales_count > 0                    THEN 'transactional'
        ELSE NULL   -- no signal — don't change
      END;

      IF v_comp_rev_type IS NOT NULL THEN
        v_new_revenue_type  := v_comp_rev_type;
        v_new_field_sources := jsonb_set(v_new_field_sources, '{revenue_type}', '"computed"');
      ELSE
        v_new_revenue_type := v_pep.revenue_type;
      END IF;
    ELSE
      v_new_revenue_type := v_pep.revenue_type;
    END IF;

  ELSE
    v_new_revenue_type := v_pep.revenue_type;
  END IF;

  -- -------------------------------------------------------------------------
  -- Confidence score
  -- 7 fields, fixed denominator of 7.
  -- model_type, pricing_model: always 1.0 if ≠ 'unknown'.
  -- Others: weight from field_sources (declared=1.0, computed=0.8, benchmark=0.5, missing=0.0).
  -- -------------------------------------------------------------------------

  -- W1: model_type
  v_w1 := CASE WHEN COALESCE(v_pep.model_type, 'unknown') != 'unknown' THEN 1.0 ELSE 0.0 END;

  -- W2: pricing_model
  v_w2 := CASE WHEN COALESCE(v_pep.pricing_model, 'unknown') != 'unknown' THEN 1.0 ELSE 0.0 END;

  -- W3: revenue_type (explicitly set = present in field_sources)
  v_w3 := CASE
    WHEN v_new_field_sources ? 'revenue_type' THEN
      CASE (v_new_field_sources->>'revenue_type')
        WHEN 'declared'  THEN 1.0
        WHEN 'computed'  THEN 0.8
        WHEN 'benchmark' THEN 0.5
        ELSE 0.0
      END
    ELSE 0.0
  END;

  -- W4: avg_ticket
  v_w4 := CASE
    WHEN v_new_avg_ticket IS NOT NULL THEN
      CASE (v_new_field_sources->>'avg_ticket')
        WHEN 'declared'  THEN 1.0
        WHEN 'computed'  THEN 0.8
        WHEN 'benchmark' THEN 0.5
        ELSE 0.0
      END
    ELSE 0.0
  END;

  -- W5: sales_cycle_days (not computed; if present assume declared)
  v_w5 := CASE
    WHEN v_pep.sales_cycle_days IS NOT NULL THEN
      CASE (v_new_field_sources->>'sales_cycle_days')
        WHEN 'declared'  THEN 1.0
        WHEN 'computed'  THEN 0.8
        WHEN 'benchmark' THEN 0.5
        ELSE 1.0   -- present but not tracked in field_sources → assume declared
      END
    ELSE 0.0
  END;

  -- W6: gross_margin_target
  v_w6 := CASE
    WHEN v_new_gross_margin IS NOT NULL THEN
      CASE (v_new_field_sources->>'gross_margin_target')
        WHEN 'declared'  THEN 1.0
        WHEN 'computed'  THEN 0.8
        WHEN 'benchmark' THEN 0.5
        ELSE 0.0
      END
    ELSE 0.0
  END;

  -- W7: cac_estimate (not computed; if present assume declared)
  v_w7 := CASE
    WHEN v_pep.cac_estimate IS NOT NULL THEN
      CASE (v_new_field_sources->>'cac_estimate')
        WHEN 'declared'  THEN 1.0
        WHEN 'computed'  THEN 0.8
        WHEN 'benchmark' THEN 0.5
        ELSE 1.0   -- present but not in field_sources → assume declared
      END
    ELSE 0.0
  END;

  v_new_conf_score := ROUND(
    (v_w1 + v_w2 + v_w3 + v_w4 + v_w5 + v_w6 + v_w7) / 7.0 * 100.0,
    2
  );

  v_new_conf_level := CASE
    WHEN v_new_conf_score >= 75 THEN 'high'
    WHEN v_new_conf_score >= 50 THEN 'medium'
    ELSE                             'low'
  END;

  -- -------------------------------------------------------------------------
  -- E4.19 — Incoherence detection (4 cases)
  -- Uses computed values (v_new_revenue_type, v_new_avg_ticket) for accuracy.
  -- -------------------------------------------------------------------------

  -- Phase and project age (shared for cases 2, 3)
  SELECT current_phase INTO v_phase
  FROM   project_phase_state
  WHERE  project_id = p_project_id;
  v_phase := COALESCE(v_phase, 1);

  SELECT NOW() - created_at INTO v_project_age
  FROM   projects
  WHERE  id = p_project_id;

  -- Late-stage leads (case 3)
  SELECT COUNT(*) INTO v_late_leads
  FROM   obvs
  WHERE  project_id      = p_project_id
    AND  pipeline_status IN ('propuesta', 'negociacion');

  -- ─── Case 1: SaaS + transactional — structural contradiction ───────────────
  -- A SaaS model is by definition subscription/recurring. Transactional revenue
  -- is incompatible with the SaaS classification.
  IF v_pep.model_type = 'saas' AND v_new_revenue_type = 'transactional' THEN
    v_new_incoherences := v_new_incoherences || jsonb_build_object(
      'code',     'saas_transactional',
      'severity', 'high'
    );
  END IF;

  -- ─── Case 2: subscription pricing + no MRR in Phase 2+ after 12 weeks ─────
  -- If the pricing model is subscription, recurring revenue (MRR) should appear
  -- after a reasonable period. Absence is a model execution signal.
  -- Uses v_mrr_avg and v_km_count computed above for revenue_type.
  -- Recomputes separately if those weren't computed (field_sources.revenue_type = 'declared').
  IF v_km_count IS NULL THEN
    SELECT COUNT(*), COALESCE(AVG(mrr), 0) INTO v_km_count, v_mrr_avg
    FROM (SELECT mrr FROM key_metrics WHERE project_id = p_project_id ORDER BY date DESC LIMIT 4) s;
  END IF;

  IF v_pep.pricing_model = 'subscription'
     AND v_phase         >= 2
     AND v_project_age   >  INTERVAL '84 days'   -- 12 weeks
     AND v_km_count      >= 2                     -- enough data to be meaningful
     AND v_mrr_avg       =  0
  THEN
    v_new_incoherences := v_new_incoherences || jsonb_build_object(
      'code',     'subscription_no_mrr',
      'severity', 'medium'
    );
  END IF;

  -- ─── Case 3: high-ticket + medium+ cycle + no late-stage pipeline ──────────
  -- If both avg_ticket and sales_cycle_days signal a high-touch model,
  -- absence of late-stage leads after 8 weeks in Phase 2+ is a structural gap.
  IF v_new_avg_ticket              IS NOT NULL
     AND v_new_avg_ticket           >= 300
     AND v_pep.sales_cycle_days    IS NOT NULL
     AND v_pep.sales_cycle_days     >= 14
     AND v_phase                    >= 2
     AND v_project_age              >  INTERVAL '56 days'   -- 8 weeks
     AND v_late_leads               =  0
  THEN
    v_new_incoherences := v_new_incoherences || jsonb_build_object(
      'code',     'high_ticket_no_pipeline',
      'severity', 'medium'
    );
  END IF;

  -- ─── Case 4: high revenue concentration + scalable model ───────────────────
  -- SaaS and marketplace models are premised on diversified revenue.
  -- A single client representing ≥60% of revenue breaks the scalability premise.
  IF v_pep.top_client_revenue_percent IS NOT NULL
     AND v_pep.top_client_revenue_percent >= 60
     AND v_pep.model_type IN ('saas', 'marketplace')
  THEN
    v_new_incoherences := v_new_incoherences || jsonb_build_object(
      'code',     'concentrated_scalable',
      'severity', 'medium'
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- E4.18 — Material change detection
  -- Compare new values vs last history snapshot.
  -- First run (no snapshot): always write history.
  -- -------------------------------------------------------------------------

  SELECT profile_snapshot INTO v_last_snapshot
  FROM   project_economic_profile_history
  WHERE  project_id = p_project_id
  ORDER  BY changed_at DESC
  LIMIT  1;

  -- ─── model_type ────────────────────────────────────────────────────────────
  IF COALESCE(v_pep.model_type, '') IS DISTINCT FROM
     COALESCE(v_last_snapshot->>'model_type', '')
  THEN
    v_changed_fields  := v_changed_fields || jsonb_build_object(
      'model_type', jsonb_build_object('old', v_last_snapshot->>'model_type', 'new', v_pep.model_type)
    );
    v_has_data_change := TRUE;
  END IF;

  -- ─── pricing_model ─────────────────────────────────────────────────────────
  IF COALESCE(v_pep.pricing_model, '') IS DISTINCT FROM
     COALESCE(v_last_snapshot->>'pricing_model', '')
  THEN
    v_changed_fields  := v_changed_fields || jsonb_build_object(
      'pricing_model', jsonb_build_object('old', v_last_snapshot->>'pricing_model', 'new', v_pep.pricing_model)
    );
    v_has_data_change := TRUE;
  END IF;

  -- ─── revenue_type ──────────────────────────────────────────────────────────
  IF COALESCE(v_new_revenue_type, '') IS DISTINCT FROM
     COALESCE(v_last_snapshot->>'revenue_type', '')
  THEN
    v_changed_fields  := v_changed_fields || jsonb_build_object(
      'revenue_type', jsonb_build_object('old', v_last_snapshot->>'revenue_type', 'new', v_new_revenue_type)
    );
    v_has_data_change := TRUE;
  END IF;

  -- ─── sales_cycle_days: by tramo, not by absolute value ─────────────────────
  v_old_tramo := CASE
    WHEN (v_last_snapshot->>'sales_cycle_days') IS NULL THEN 'unknown'
    WHEN (v_last_snapshot->>'sales_cycle_days')::INT <  8  THEN 'fast'
    WHEN (v_last_snapshot->>'sales_cycle_days')::INT < 31  THEN 'medium'
    WHEN (v_last_snapshot->>'sales_cycle_days')::INT < 91  THEN 'long'
    ELSE 'very_long'
  END;

  v_new_tramo := CASE
    WHEN v_pep.sales_cycle_days IS NULL THEN 'unknown'
    WHEN v_pep.sales_cycle_days <  8    THEN 'fast'
    WHEN v_pep.sales_cycle_days < 31    THEN 'medium'
    WHEN v_pep.sales_cycle_days < 91    THEN 'long'
    ELSE 'very_long'
  END;

  IF v_old_tramo IS DISTINCT FROM v_new_tramo THEN
    v_changed_fields  := v_changed_fields || jsonb_build_object(
      'sales_cycle_days', jsonb_build_object(
        'old', v_last_snapshot->'sales_cycle_days',
        'new', v_pep.sales_cycle_days,
        'old_tramo', v_old_tramo,
        'new_tramo', v_new_tramo
      )
    );
    v_has_data_change := TRUE;
  END IF;

  -- ─── gross_margin_target: material if ≥10 percentage points ────────────────
  IF v_new_gross_margin IS NOT NULL
     AND ABS(
           COALESCE(v_new_gross_margin, 0)
           - COALESCE((v_last_snapshot->>'gross_margin_target')::NUMERIC, 0)
         ) >= 10
  THEN
    v_changed_fields  := v_changed_fields || jsonb_build_object(
      'gross_margin_target', jsonb_build_object(
        'old', v_last_snapshot->'gross_margin_target',
        'new', v_new_gross_margin
      )
    );
    v_has_data_change := TRUE;
  END IF;

  -- ─── avg_ticket: material if ≥25% change ───────────────────────────────────
  IF v_new_avg_ticket IS NOT NULL
     AND (v_last_snapshot->>'avg_ticket') IS NOT NULL
     AND (v_last_snapshot->>'avg_ticket')::NUMERIC > 0
     AND ABS(
           v_new_avg_ticket
           - (v_last_snapshot->>'avg_ticket')::NUMERIC
         ) / (v_last_snapshot->>'avg_ticket')::NUMERIC >= 0.25
  THEN
    v_changed_fields  := v_changed_fields || jsonb_build_object(
      'avg_ticket', jsonb_build_object(
        'old', v_last_snapshot->'avg_ticket',
        'new', v_new_avg_ticket
      )
    );
    v_has_data_change := TRUE;
  END IF;

  -- ─── confidence_level ──────────────────────────────────────────────────────
  IF v_new_conf_level IS DISTINCT FROM
     COALESCE(v_last_snapshot->>'confidence_level', '')
     AND ABS(v_new_conf_score
           - COALESCE((v_last_snapshot->>'confidence_score')::NUMERIC, 0)
           ) >= 5
  THEN
    v_changed_fields   := v_changed_fields || jsonb_build_object(
      'confidence_level', jsonb_build_object(
        'old', v_last_snapshot->>'confidence_level',
        'new', v_new_conf_level
      )
    );
    v_has_conf_change  := TRUE;
  END IF;

  -- ─── First run (no snapshot): always record ─────────────────────────────────
  IF v_last_snapshot IS NULL THEN
    v_has_data_change := TRUE;
  END IF;

  -- ─── change_reason ──────────────────────────────────────────────────────────
  IF v_has_data_change THEN
    v_change_reason := 'computed_update';
  ELSIF v_has_conf_change THEN
    v_change_reason := 'confidence_updated';
  END IF;

  -- -------------------------------------------------------------------------
  -- UPSERT project_economic_profile
  -- -------------------------------------------------------------------------
  INSERT INTO project_economic_profile (
    project_id,
    model_type,     pricing_model,     revenue_type,
    avg_ticket,     sales_cycle_days,  gross_margin_target,
    cac_estimate,   top_client_revenue_percent,
    cash_on_hand,   cash_on_hand_updated_at,
    field_sources,  confidence_score,  confidence_level,
    incoherences,   last_updated_at,   engine_version
  )
  VALUES (
    p_project_id,
    v_pep.model_type,             v_pep.pricing_model,          v_new_revenue_type,
    v_new_avg_ticket,             v_pep.sales_cycle_days,        v_new_gross_margin,
    v_pep.cac_estimate,           v_pep.top_client_revenue_percent,
    v_pep.cash_on_hand,           v_pep.cash_on_hand_updated_at,
    v_new_field_sources,          v_new_conf_score,              v_new_conf_level,
    v_new_incoherences,           NOW(),                         v_ver
  )
  ON CONFLICT (project_id) DO UPDATE SET
    revenue_type              = EXCLUDED.revenue_type,
    avg_ticket                = EXCLUDED.avg_ticket,
    gross_margin_target       = EXCLUDED.gross_margin_target,
    field_sources             = EXCLUDED.field_sources,
    confidence_score          = EXCLUDED.confidence_score,
    confidence_level          = EXCLUDED.confidence_level,
    incoherences              = EXCLUDED.incoherences,
    last_updated_at           = EXCLUDED.last_updated_at,
    engine_version            = EXCLUDED.engine_version;
  -- NOTE: model_type, pricing_model, sales_cycle_days, cac_estimate,
  -- top_client_revenue_percent, cash_on_hand are NOT updated by the engine
  -- (founder-declared fields — UI owns these writes).

  -- -------------------------------------------------------------------------
  -- E4.18 — INSERT history if material change detected
  -- -------------------------------------------------------------------------
  IF v_has_data_change OR v_has_conf_change THEN

    -- Full snapshot of new state
    v_profile_snapshot := jsonb_build_object(
      'model_type',                   v_pep.model_type,
      'pricing_model',                v_pep.pricing_model,
      'revenue_type',                 v_new_revenue_type,
      'avg_ticket',                   v_new_avg_ticket,
      'sales_cycle_days',             v_pep.sales_cycle_days,
      'gross_margin_target',          v_new_gross_margin,
      'cac_estimate',                 v_pep.cac_estimate,
      'top_client_revenue_percent',   v_pep.top_client_revenue_percent,
      'cash_on_hand',                 v_pep.cash_on_hand,
      'field_sources',                v_new_field_sources,
      'confidence_score',             v_new_conf_score,
      'confidence_level',             v_new_conf_level,
      'incoherences',                 v_new_incoherences
    );

    INSERT INTO project_economic_profile_history (
      project_id,     changed_fields,    change_reason,
      engine_version, profile_snapshot,  changed_at
    ) VALUES (
      p_project_id,   v_changed_fields,  v_change_reason,
      v_ver,          v_profile_snapshot, NOW()
    );

  END IF;

END;
$$;

COMMENT ON FUNCTION run_economic_profile_engine(UUID, TEXT) IS
  'Economic Profile Engine v1. E4.17: computa avg_ticket (≥3 sales OBVs), gross_margin_target '
  '(≥2 financial_projections últimos 3m), revenue_type (≥3 key_metrics); actualiza field_sources y '
  'confidence_score. E4.18: historial solo si cambia model_type, pricing_model, revenue_type, '
  'sales_cycle tramo, gross_margin≥10pp, avg_ticket≥25%, confidence_level. '
  'E4.19: detecta 4 incoherencias (saas_transactional, subscription_no_mrr, high_ticket_no_pipeline, '
  'concentrated_scalable). No sobreescribe campos declarados por founder (model_type, pricing_model, etc.).';

-- =============================================================================
-- 6. Cron — domingo 02:00 UTC
--    Posición en pipeline: Phase(00:00)→Probability(00:30)→Risk(01:00)→Viability(01:30)→Economic(02:00)
-- =============================================================================

SELECT cron.schedule(
  'weekly-economic-profile-engine',
  '0 2 * * 0',
  $$
    SELECT run_economic_profile_engine(id, 'weekly_job')
    FROM   projects
    WHERE  deleted_at IS NULL
  $$
);
