-- =============================================================================
-- FASE 30 — Financial Intelligence Avanzada
--
-- FI30.1 — compute_mrr_forecast(project_id, months_ahead)
-- FI30.3 — run_cash_flow_stress_test(project_id)
-- FI30.5 — detect_financial_risks(project_id)
-- FI30.7 — Integration enrichment (Stripe/Holded) built into RPCs
-- FI30.8 — Churn signal built into detect_financial_risks
-- FI30.9 — Financial risks added to get_optimus_context
--
-- Principle: If insufficient data → return {"status": "insufficient_data"}.
-- UI shows UnlockProgress instead of empty charts.
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- FI30.1 + FI30.7 — compute_mrr_forecast
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION compute_mrr_forecast(
  p_project_id   UUID,
  p_months_ahead INT DEFAULT 6
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_integration   BOOLEAN := FALSE;
  v_months_required   INT;
  v_months_available  INT;
  v_source_confidence NUMERIC(3,2);
  v_historical        JSONB;
  v_forecast          JSONB;
  v_n                 INT;
  v_sum_x             NUMERIC;
  v_sum_y             NUMERIC;
  v_sum_xy            NUMERIC;
  v_sum_x2            NUMERIC;
  v_slope             NUMERIC;
  v_intercept         NUMERIC;
  v_last_x            INT;
  v_residual_sum      NUMERIC := 0;
  v_std_dev           NUMERIC;
  v_trend             TEXT;
  v_confidence_score  NUMERIC(3,2);
  v_avg_mrr           NUMERIC;
  v_first_mrr         NUMERIC;
  v_last_mrr          NUMERIC;
BEGIN
  -- Check if Stripe or Holded integration is active (FI30.7)
  SELECT EXISTS (
    SELECT 1 FROM integration_connections
    WHERE project_id = p_project_id
      AND provider IN ('stripe', 'holded')
      AND status = 'active'
  ) INTO v_has_integration;

  -- Set threshold: 6 months manual, 3 months with integration
  v_months_required := CASE WHEN v_has_integration THEN 3 ELSE 6 END;
  v_source_confidence := CASE WHEN v_has_integration THEN 1.0 ELSE 0.7 END;

  -- Count distinct months with MRR data
  SELECT COUNT(DISTINCT date_trunc('month', date))
  INTO   v_months_available
  FROM   key_metrics
  WHERE  project_id = p_project_id
    AND  mrr IS NOT NULL
    AND  mrr > 0;

  -- Insufficient data guard
  IF v_months_available < v_months_required THEN
    RETURN jsonb_build_object(
      'status',           'insufficient_data',
      'months_available', v_months_available,
      'months_required',  v_months_required,
      'has_integration',  v_has_integration
    );
  END IF;

  -- Build historical array: one MRR per month (last value if multiple entries)
  WITH monthly AS (
    SELECT
      date_trunc('month', date)::date AS month,
      (ARRAY_AGG(mrr ORDER BY date DESC))[1] AS mrr_value,
      ROW_NUMBER() OVER (ORDER BY date_trunc('month', date)) AS month_index
    FROM   key_metrics
    WHERE  project_id = p_project_id
      AND  mrr IS NOT NULL
      AND  mrr > 0
    GROUP BY date_trunc('month', date)
    ORDER BY date_trunc('month', date)
  )
  SELECT
    COUNT(*),
    SUM(month_index),
    SUM(mrr_value),
    SUM(month_index * mrr_value),
    SUM(month_index * month_index),
    MAX(month_index),
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'month', to_char(month, 'YYYY-MM'),
        'mrr',   ROUND(mrr_value::numeric, 2)
      ) ORDER BY month
    ), '[]'::jsonb)
  INTO
    v_n, v_sum_x, v_sum_y, v_sum_xy, v_sum_x2, v_last_x, v_historical
  FROM monthly;

  -- Linear regression: slope & intercept
  IF v_n < 2 OR (v_n * v_sum_x2 - v_sum_x * v_sum_x) = 0 THEN
    v_slope := 0;
    v_intercept := COALESCE(v_sum_y / NULLIF(v_n, 0), 0);
  ELSE
    v_slope := (v_n * v_sum_xy - v_sum_x * v_sum_y) /
               (v_n * v_sum_x2 - v_sum_x * v_sum_x);
    v_intercept := (v_sum_y - v_slope * v_sum_x) / v_n;
  END IF;

  -- Compute residual standard deviation for confidence band
  WITH monthly AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY date_trunc('month', date)) AS month_index,
      (ARRAY_AGG(mrr ORDER BY date DESC))[1] AS mrr_value
    FROM   key_metrics
    WHERE  project_id = p_project_id
      AND  mrr IS NOT NULL
      AND  mrr > 0
    GROUP BY date_trunc('month', date)
    ORDER BY date_trunc('month', date)
  )
  SELECT COALESCE(
    SQRT(SUM(POWER(mrr_value - (v_intercept + v_slope * month_index), 2)) / GREATEST(COUNT(*) - 2, 1)),
    0
  )
  INTO v_std_dev
  FROM monthly;

  -- Build forecast array
  WITH future_months AS (
    SELECT generate_series(1, p_months_ahead) AS i
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'month',     to_char(
        (SELECT MAX(date_trunc('month', date)) FROM key_metrics
         WHERE project_id = p_project_id AND mrr IS NOT NULL AND mrr > 0)
        + (i || ' months')::interval,
        'YYYY-MM'
      ),
      'predicted', ROUND(GREATEST(v_intercept + v_slope * (v_last_x + i), 0)::numeric, 2),
      'low',       ROUND(GREATEST(v_intercept + v_slope * (v_last_x + i) - v_std_dev, 0)::numeric, 2),
      'high',      ROUND((v_intercept + v_slope * (v_last_x + i) + v_std_dev)::numeric, 2)
    ) ORDER BY i
  ), '[]'::jsonb)
  INTO v_forecast
  FROM future_months;

  -- Determine trend
  v_avg_mrr := v_sum_y / v_n;
  SELECT mrr_value INTO v_first_mrr FROM (
    SELECT (ARRAY_AGG(mrr ORDER BY date DESC))[1] AS mrr_value
    FROM key_metrics WHERE project_id = p_project_id AND mrr IS NOT NULL AND mrr > 0
    GROUP BY date_trunc('month', date)
    ORDER BY date_trunc('month', date) ASC LIMIT 1
  ) sub;
  SELECT mrr_value INTO v_last_mrr FROM (
    SELECT (ARRAY_AGG(mrr ORDER BY date DESC))[1] AS mrr_value
    FROM key_metrics WHERE project_id = p_project_id AND mrr IS NOT NULL AND mrr > 0
    GROUP BY date_trunc('month', date)
    ORDER BY date_trunc('month', date) DESC LIMIT 1
  ) sub;

  v_trend := CASE
    WHEN v_slope > v_avg_mrr * 0.02 THEN 'growing'
    WHEN v_slope < v_avg_mrr * -0.02 THEN 'declining'
    ELSE 'flat'
  END;

  -- Confidence: 0-1 based on R^2 adjusted by source confidence
  v_confidence_score := LEAST(1.0, GREATEST(0.0,
    CASE
      WHEN v_std_dev = 0 THEN 1.0
      WHEN v_avg_mrr = 0 THEN 0.3
      ELSE GREATEST(0.0, 1.0 - (v_std_dev / NULLIF(v_avg_mrr, 0)))
    END * v_source_confidence
  ));

  RETURN jsonb_build_object(
    'status',            'ok',
    'historical',        v_historical,
    'forecast',          v_forecast,
    'trend',             v_trend,
    'confidence',        ROUND(v_confidence_score, 2),
    'source_confidence', v_source_confidence,
    'months_available',  v_months_available,
    'has_integration',   v_has_integration
  );
END;
$$;

COMMENT ON FUNCTION compute_mrr_forecast(UUID, INT) IS
  'FI30.1+FI30.7: Computes MRR forecast using linear regression on key_metrics. '
  'Returns insufficient_data if < 6 months manual (or < 3 months with Stripe/Holded). '
  'Includes confidence band (±1 std dev) and trend classification.';


-- ═══════════════════════════════════════════════════════════════════════════════
-- FI30.3 + FI30.7 — run_cash_flow_stress_test
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION run_cash_flow_stress_test(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr             NUMERIC;
  v_burn_rate       NUMERIC;
  v_cash_on_hand    NUMERIC;
  v_runway_months   NUMERIC;
  v_has_integration BOOLEAN := FALSE;
  v_top_client_pct  NUMERIC;
  v_source_confidence NUMERIC(3,2);
  v_scenarios       JSONB;
  -- Scenario computations
  v_base_runway     NUMERIC;
  v_growth_runway   NUMERIC;
  v_crisis_runway   NUMERIC;
  v_base_date       TEXT;
  v_growth_date     TEXT;
  v_crisis_date     TEXT;
  v_base_severity   TEXT;
  v_growth_severity TEXT;
  v_crisis_severity TEXT;
  v_crisis_mrr      NUMERIC;
BEGIN
  -- Check for active financial integration (FI30.7)
  SELECT EXISTS (
    SELECT 1 FROM integration_connections
    WHERE project_id = p_project_id
      AND provider IN ('stripe', 'holded')
      AND status = 'active'
  ) INTO v_has_integration;

  v_source_confidence := CASE WHEN v_has_integration THEN 1.0 ELSE 0.7 END;

  -- Get latest MRR from key_metrics
  SELECT mrr, burn_rate, cash_balance, runway_months
  INTO   v_mrr, v_burn_rate, v_cash_on_hand, v_runway_months
  FROM   key_metrics
  WHERE  project_id = p_project_id
    AND  (mrr IS NOT NULL OR burn_rate IS NOT NULL)
  ORDER BY date DESC
  LIMIT 1;

  -- Fallback: try financial_projections for burn_rate
  IF v_burn_rate IS NULL THEN
    SELECT burn_rate, cash_balance
    INTO   v_burn_rate, v_cash_on_hand
    FROM   financial_projections
    WHERE  project_id = p_project_id
    ORDER BY year DESC, month DESC
    LIMIT 1;
  END IF;

  -- Fallback: try project_economic_profile for cash_on_hand
  IF v_cash_on_hand IS NULL THEN
    SELECT cash_on_hand, top_client_revenue_percent
    INTO   v_cash_on_hand, v_top_client_pct
    FROM   project_economic_profile
    WHERE  project_id = p_project_id;
  ELSE
    SELECT top_client_revenue_percent
    INTO   v_top_client_pct
    FROM   project_economic_profile
    WHERE  project_id = p_project_id;
  END IF;

  -- Insufficient data guard
  IF COALESCE(v_mrr, 0) = 0 AND COALESCE(v_burn_rate, 0) = 0 THEN
    RETURN jsonb_build_object(
      'status', 'insufficient_data',
      'reason', 'No MRR or burn_rate data available'
    );
  END IF;

  IF COALESCE(v_cash_on_hand, 0) = 0 THEN
    RETURN jsonb_build_object(
      'status', 'insufficient_data',
      'reason', 'No cash_on_hand data available'
    );
  END IF;

  -- Default values
  v_mrr := COALESCE(v_mrr, 0);
  v_burn_rate := COALESCE(v_burn_rate, 0);
  v_top_client_pct := COALESCE(v_top_client_pct, 0);

  -- ── SCENARIO 1: BASE — current trajectory ─────────────────────────────────
  IF v_burn_rate > v_mrr THEN
    v_base_runway := v_cash_on_hand / GREATEST(v_burn_rate - v_mrr, 1);
  ELSE
    v_base_runway := 999; -- profitable, infinite runway
  END IF;
  v_base_severity := CASE
    WHEN v_base_runway > 6 THEN 'safe'
    WHEN v_base_runway >= 3 THEN 'warning'
    ELSE 'critical'
  END;
  v_base_date := to_char(
    NOW() + (LEAST(v_base_runway, 120) || ' months')::interval,
    'YYYY-MM'
  );

  -- ── SCENARIO 2: GROWTH — mrr +15%/month, burn +5%/month ───────────────────
  -- Approximate: after 6 months, mrr_6 = mrr * 1.15^6, burn_6 = burn * 1.05^6
  -- Average net burn over 6 months for runway approximation
  DECLARE
    v_growth_total_cash NUMERIC := v_cash_on_hand;
    v_g_mrr NUMERIC := v_mrr;
    v_g_burn NUMERIC := v_burn_rate;
    v_g_month INT := 0;
  BEGIN
    v_growth_runway := 0;
    FOR i IN 1..120 LOOP
      v_g_mrr := v_g_mrr * 1.15;
      v_g_burn := v_g_burn * 1.05;
      v_growth_total_cash := v_growth_total_cash - GREATEST(v_g_burn - v_g_mrr, 0) + GREATEST(v_g_mrr - v_g_burn, 0);
      IF v_growth_total_cash <= 0 THEN
        v_growth_runway := i;
        EXIT;
      END IF;
    END LOOP;
    IF v_growth_total_cash > 0 THEN
      v_growth_runway := 999; -- never runs out
    END IF;
  END;

  v_growth_severity := CASE
    WHEN v_growth_runway > 6 THEN 'safe'
    WHEN v_growth_runway >= 3 THEN 'warning'
    ELSE 'critical'
  END;
  v_growth_date := to_char(
    NOW() + (LEAST(v_growth_runway, 120) || ' months')::interval,
    'YYYY-MM'
  );

  -- ── SCENARIO 3: CRISIS — mrr -20%/month, burn stays, lose top client ──────
  v_crisis_mrr := v_mrr * (1.0 - GREATEST(v_top_client_pct, 0) / 100.0);
  DECLARE
    v_crisis_total_cash NUMERIC := v_cash_on_hand;
    v_c_mrr NUMERIC := v_crisis_mrr;
  BEGIN
    v_crisis_runway := 0;
    FOR i IN 1..120 LOOP
      v_c_mrr := v_c_mrr * 0.80; -- -20%/month
      v_crisis_total_cash := v_crisis_total_cash - GREATEST(v_burn_rate - v_c_mrr, 0);
      IF v_crisis_total_cash <= 0 THEN
        v_crisis_runway := i;
        EXIT;
      END IF;
    END LOOP;
    IF v_crisis_total_cash > 0 THEN
      v_crisis_runway := 999;
    END IF;
  END;

  v_crisis_severity := CASE
    WHEN v_crisis_runway > 6 THEN 'safe'
    WHEN v_crisis_runway >= 3 THEN 'warning'
    ELSE 'critical'
  END;
  v_crisis_date := to_char(
    NOW() + (LEAST(v_crisis_runway, 120) || ' months')::interval,
    'YYYY-MM'
  );

  -- Build scenarios array
  v_scenarios := jsonb_build_array(
    jsonb_build_object(
      'name',           'base',
      'runway_months',  LEAST(ROUND(v_base_runway), 120),
      'cash_zero_date', v_base_date,
      'severity',       v_base_severity
    ),
    jsonb_build_object(
      'name',           'growth',
      'runway_months',  LEAST(ROUND(v_growth_runway), 120),
      'cash_zero_date', v_growth_date,
      'severity',       v_growth_severity
    ),
    jsonb_build_object(
      'name',           'crisis',
      'runway_months',  LEAST(ROUND(v_crisis_runway), 120),
      'cash_zero_date', v_crisis_date,
      'severity',       v_crisis_severity
    )
  );

  RETURN jsonb_build_object(
    'status',            'ok',
    'scenarios',         v_scenarios,
    'inputs', jsonb_build_object(
      'mrr',             v_mrr,
      'burn_rate',       v_burn_rate,
      'cash_on_hand',    v_cash_on_hand,
      'top_client_pct',  v_top_client_pct
    ),
    'source_confidence', v_source_confidence,
    'has_integration',   v_has_integration
  );
END;
$$;

COMMENT ON FUNCTION run_cash_flow_stress_test(UUID) IS
  'FI30.3+FI30.7: 3-scenario cash flow stress test. '
  'Base (current trajectory), Growth (+15% mrr, +5% burn), Crisis (-20% mrr, lose top client). '
  'Returns insufficient_data if no MRR/burn_rate/cash_on_hand available.';


-- ═══════════════════════════════════════════════════════════════════════════════
-- FI30.5 + FI30.7 + FI30.8 — detect_financial_risks
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION detect_financial_risks(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risks           JSONB := '[]'::jsonb;
  v_mrr_values      NUMERIC[];
  v_burn_values     NUMERIC[];
  v_runway          NUMERIC;
  v_top_client_pct  NUMERIC;
  v_overdue_count   INT;
  v_has_stripe      BOOLEAN := FALSE;
  v_canceled_count  INT := 0;
  v_deals_lost_count INT := 0;
BEGIN
  -- ── Gather MRR history (last 6 months, one per month) ────────────────────
  SELECT ARRAY_AGG(mrr_val ORDER BY m ASC)
  INTO   v_mrr_values
  FROM (
    SELECT date_trunc('month', date) AS m,
           (ARRAY_AGG(mrr ORDER BY date DESC))[1] AS mrr_val
    FROM   key_metrics
    WHERE  project_id = p_project_id
      AND  mrr IS NOT NULL
    GROUP BY date_trunc('month', date)
    ORDER BY m DESC
    LIMIT 6
  ) sub;

  -- ── Gather burn_rate history (last 6 months) ─────────────────────────────
  SELECT ARRAY_AGG(burn_val ORDER BY m ASC)
  INTO   v_burn_values
  FROM (
    SELECT date_trunc('month', date) AS m,
           (ARRAY_AGG(burn_rate ORDER BY date DESC))[1] AS burn_val
    FROM   key_metrics
    WHERE  project_id = p_project_id
      AND  burn_rate IS NOT NULL
    GROUP BY date_trunc('month', date)
    ORDER BY m DESC
    LIMIT 6
  ) sub;

  -- ── Risk 1: MRR declining 2+ consecutive months ─────────────────────────
  IF v_mrr_values IS NOT NULL AND array_length(v_mrr_values, 1) >= 3 THEN
    DECLARE
      v_len INT := array_length(v_mrr_values, 1);
    BEGIN
      IF v_mrr_values[v_len] < v_mrr_values[v_len - 1]
         AND v_mrr_values[v_len - 1] < v_mrr_values[v_len - 2] THEN
        v_risks := v_risks || jsonb_build_array(jsonb_build_object(
          'type',     'mrr_declining',
          'severity', 'warning',
          'evidence', format(
            'MRR descendio de %s a %s en los ultimos 2 meses',
            to_char(v_mrr_values[v_len - 2], 'FM999G999D00'),
            to_char(v_mrr_values[v_len], 'FM999G999D00')
          ),
          'action',   'Revisa tu pricing, busca nuevos clientes o reduce churn'
        ));
      END IF;
    END;
  END IF;

  -- ── Risk 2: Burn > Revenue for 3+ consecutive months ────────────────────
  IF v_mrr_values IS NOT NULL AND v_burn_values IS NOT NULL
     AND array_length(v_mrr_values, 1) >= 3 AND array_length(v_burn_values, 1) >= 3 THEN
    DECLARE
      v_len_m INT := array_length(v_mrr_values, 1);
      v_len_b INT := array_length(v_burn_values, 1);
      v_consecutive INT := 0;
    BEGIN
      FOR i IN REVERSE LEAST(v_len_m, v_len_b)..1 LOOP
        IF v_burn_values[i] > v_mrr_values[i] THEN
          v_consecutive := v_consecutive + 1;
        ELSE
          EXIT;
        END IF;
      END LOOP;

      IF v_consecutive >= 3 THEN
        v_risks := v_risks || jsonb_build_array(jsonb_build_object(
          'type',     'burn_exceeds_revenue',
          'severity', 'critical',
          'evidence', format(
            'Tu burn rate supera tus ingresos desde hace %s meses consecutivos',
            v_consecutive
          ),
          'action',   'Reduce costes o acelera ventas urgentemente'
        ));
      END IF;
    END;
  END IF;

  -- ── Risk 3: Overdue invoices (Holded integration entities) ──────────────
  SELECT COUNT(*)
  INTO   v_overdue_count
  FROM   integration_entities
  WHERE  project_id = p_project_id
    AND  provider = 'holded'
    AND  entity_type = 'invoice'
    AND  status = 'overdue';

  IF v_overdue_count > 3 THEN
    v_risks := v_risks || jsonb_build_array(jsonb_build_object(
      'type',     'overdue_invoices',
      'severity', 'warning',
      'evidence', format('%s facturas vencidas sin cobrar', v_overdue_count),
      'action',   'Revisa tus cobros pendientes y contacta a los clientes morosos'
    ));
  END IF;

  -- ── Risk 4: Revenue concentration ──────────────────────────────────────
  SELECT top_client_revenue_percent
  INTO   v_top_client_pct
  FROM   project_economic_profile
  WHERE  project_id = p_project_id;

  IF COALESCE(v_top_client_pct, 0) > 50 THEN
    v_risks := v_risks || jsonb_build_array(jsonb_build_object(
      'type',     'revenue_concentration',
      'severity', 'warning',
      'evidence', format(
        'Tu cliente principal representa el %s%% de tus ingresos',
        ROUND(v_top_client_pct)
      ),
      'action',   'Diversifica tu base de clientes para reducir riesgo'
    ));
  END IF;

  -- ── Risk 5: Low runway ─────────────────────────────────────────────────
  SELECT runway_months
  INTO   v_runway
  FROM   key_metrics
  WHERE  project_id = p_project_id
    AND  runway_months IS NOT NULL
  ORDER BY date DESC
  LIMIT 1;

  -- Fallback to economic profile
  IF v_runway IS NULL THEN
    SELECT
      CASE
        WHEN cash_on_hand IS NOT NULL AND cash_on_hand > 0 THEN
          cash_on_hand / NULLIF(
            (SELECT burn_rate FROM key_metrics
             WHERE project_id = p_project_id AND burn_rate IS NOT NULL
             ORDER BY date DESC LIMIT 1),
            0
          )
        ELSE NULL
      END
    INTO v_runway
    FROM project_economic_profile
    WHERE project_id = p_project_id;
  END IF;

  IF v_runway IS NOT NULL AND v_runway < 4 THEN
    v_risks := v_risks || jsonb_build_array(jsonb_build_object(
      'type',     'low_runway',
      'severity', 'critical',
      'evidence', format('Tu runway actual es de %s meses', ROUND(v_runway, 1)),
      'action',   'Busca financiacion, reduce burn o acelera ventas inmediatamente'
    ));
  END IF;

  -- ── FI30.8: Churn signal from Stripe ───────────────────────────────────
  SELECT EXISTS (
    SELECT 1 FROM integration_connections
    WHERE project_id = p_project_id
      AND provider = 'stripe'
      AND status = 'active'
  ) INTO v_has_stripe;

  IF v_has_stripe THEN
    -- Check for canceled subscriptions in last 30 days
    SELECT COUNT(*)
    INTO   v_canceled_count
    FROM   integration_entities
    WHERE  project_id = p_project_id
      AND  provider = 'stripe'
      AND  entity_type = 'subscription'
      AND  (status = 'canceled' OR (payload->>'cancel_at') IS NOT NULL)
      AND  occurred_at > NOW() - INTERVAL '30 days';

    IF v_canceled_count > 0 THEN
      v_risks := v_risks || jsonb_build_array(jsonb_build_object(
        'type',     'churn_signal',
        'severity', CASE WHEN v_canceled_count >= 3 THEN 'critical' ELSE 'warning' END,
        'evidence', format(
          '%s suscripciones canceladas o programadas para cancelar en los ultimos 30 dias',
          v_canceled_count
        ),
        'action',   'Investiga las razones de cancelacion y contacta a los clientes en riesgo'
      ));
    END IF;
  END IF;

  -- ── FI30.8: Pipeline risk from HubSpot ─────────────────────────────────
  SELECT COUNT(*)
  INTO   v_deals_lost_count
  FROM   integration_entities
  WHERE  project_id = p_project_id
    AND  provider = 'hubspot'
    AND  entity_type = 'deal'
    AND  status = 'closed_lost'
    AND  occurred_at > NOW() - INTERVAL '30 days';

  IF v_deals_lost_count >= 3 THEN
    v_risks := v_risks || jsonb_build_array(jsonb_build_object(
      'type',     'pipeline_risk',
      'severity', 'warning',
      'evidence', format(
        '%s deals perdidos en los ultimos 30 dias',
        v_deals_lost_count
      ),
      'action',   'Revisa tu proceso de ventas y cualificacion de leads'
    ));
  END IF;

  RETURN jsonb_build_object(
    'status', CASE WHEN jsonb_array_length(v_risks) = 0 THEN 'no_risks' ELSE 'ok' END,
    'risks',  v_risks,
    'checked_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION detect_financial_risks(UUID) IS
  'FI30.5+FI30.7+FI30.8: Detects financial risks. '
  'Checks: MRR declining, burn>revenue, overdue invoices (Holded), '
  'revenue concentration, low runway, churn signal (Stripe), pipeline risk (HubSpot).';


-- ═══════════════════════════════════════════════════════════════════════════════
-- FI30.9 — Add financial_risks to get_optimus_context
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_optimus_context(
  p_project_id UUID,
  p_user_id    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Phase
  v_phase_current    SMALLINT;
  v_phase_score      NUMERIC(5,2);
  v_phase_status     TEXT;
  v_hard_signal      BOOLEAN;
  v_phase_changed_at TIMESTAMPTZ;
  v_phase_regressed  BOOLEAN;
  -- Viability
  v_viability_status TEXT;
  v_cash_flow        BOOLEAN;
  v_top_trigger      TEXT;
  -- Risk
  v_risk_level       TEXT;
  v_risk_status      TEXT;
  -- Probability
  v_prob_score       NUMERIC(5,2);
  v_prob_status      TEXT;
  v_prob_trend       TEXT;
  -- Coverage
  v_demand_cov       TEXT;
  v_delivery_cov     TEXT;
  v_cash_cov         TEXT;
  -- Channels
  v_channel_count    INTEGER;
  -- Economic profile
  v_model_type       TEXT;
  v_pricing_model    TEXT;
  v_sales_cycle      TEXT;
  v_capital          TEXT;
  -- Operational
  v_bottleneck_role  TEXT;
  v_user_role        TEXT;
  v_last_ritual      TIMESTAMPTZ;
  -- Blocks + mode
  v_active_blocks    JSONB;
  v_optimus_mode     TEXT;
  -- History
  v_critical_count   INTEGER;
  v_decisions        JSONB;
  -- F31: Founder patterns
  v_founder_patterns JSONB;
  -- F30: Financial risks
  v_financial_risks  JSONB;
BEGIN

  -- ── Phase signals ──────────────────────────────────────────────────────────
  SELECT current_phase, phase_score, phase_status, hard_signal_met,
         phase_last_changed_at
  INTO   v_phase_current, v_phase_score, v_phase_status,
         v_hard_signal, v_phase_changed_at
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  SELECT EXISTS (
    SELECT 1 FROM project_phase_history
    WHERE  project_id = p_project_id
      AND  phase > COALESCE(v_phase_current, 1)
      AND  calculated_at > NOW() - INTERVAL '30 days'
  ) INTO v_phase_regressed;

  -- ── Viability signals ──────────────────────────────────────────────────────
  SELECT viability_status, t2_cash_flow_active, top_trigger_type
  INTO   v_viability_status, v_cash_flow, v_top_trigger
  FROM   project_viability_state
  WHERE  project_id = p_project_id;

  -- ── Risk signals ───────────────────────────────────────────────────────────
  SELECT risk_level, risk_status
  INTO   v_risk_level, v_risk_status
  FROM   project_risk_score
  WHERE  project_id = p_project_id;

  -- ── Probability signals ────────────────────────────────────────────────────
  SELECT probability_score, probability_status
  INTO   v_prob_score, v_prob_status
  FROM   project_probability
  WHERE  project_id = p_project_id;

  SELECT CASE
    WHEN COUNT(*) < 2 THEN 'insufficient_data'
    WHEN (ARRAY_AGG(probability_score ORDER BY calculated_at DESC))[1]
       > (ARRAY_AGG(probability_score ORDER BY calculated_at DESC))[2] + 3
      THEN 'growing'
    WHEN (ARRAY_AGG(probability_score ORDER BY calculated_at DESC))[1]
       < (ARRAY_AGG(probability_score ORDER BY calculated_at DESC))[2] - 3
      THEN 'declining'
    ELSE 'stable'
  END
  INTO v_prob_trend
  FROM project_probability_history
  WHERE project_id = p_project_id
    AND calculated_at > NOW() - INTERVAL '14 days';

  -- ── Coverage signals ───────────────────────────────────────────────────────
  SELECT coverage_level INTO v_demand_cov
  FROM   project_function_coverage
  WHERE  project_id = p_project_id AND function_type = 'demand'
  LIMIT  1;

  SELECT coverage_level INTO v_delivery_cov
  FROM   project_function_coverage
  WHERE  project_id = p_project_id AND function_type = 'delivery'
  LIMIT  1;

  SELECT coverage_level INTO v_cash_cov
  FROM   project_function_coverage
  WHERE  project_id = p_project_id AND function_type = 'cash'
  LIMIT  1;

  -- ── Acquisition channels count ─────────────────────────────────────────────
  SELECT COUNT(*) INTO v_channel_count
  FROM   project_acquisition_channel
  WHERE  project_id = p_project_id;

  -- ── Economic profile ───────────────────────────────────────────────────────
  SELECT
    model_type,
    pricing_model,
    CASE
      WHEN sales_cycle_days IS NULL THEN 'desconocido'
      WHEN sales_cycle_days <= 30   THEN 'corto'
      WHEN sales_cycle_days <= 90   THEN 'medio'
      ELSE                               'largo'
    END,
    CASE
      WHEN cash_on_hand IS NULL    THEN 'desconocido'
      WHEN cash_on_hand < 10000    THEN 'bajo'
      WHEN cash_on_hand < 100000   THEN 'medio'
      ELSE                              'alto'
    END
  INTO v_model_type, v_pricing_model, v_sales_cycle, v_capital
  FROM project_economic_profile
  WHERE project_id = p_project_id;

  -- ── Bottleneck role ────────────────────────────────────────────────────────
  SELECT description INTO v_bottleneck_role
  FROM   strategic_blocks
  WHERE  project_id  = p_project_id
    AND  resolved_at IS NULL
    AND  block_type  = 'function_no_owner'
  ORDER  BY first_detected_at ASC
  LIMIT  1;

  -- ── User role ──────────────────────────────────────────────────────────────
  IF p_user_id IS NOT NULL THEN
    SELECT role::TEXT INTO v_user_role
    FROM   project_members
    WHERE  project_id = p_project_id
      AND  member_id  = p_user_id;
  END IF;

  -- ── Last completed ritual ──────────────────────────────────────────────────
  SELECT MAX(closed_at) INTO v_last_ritual
  FROM   strategic_cycles
  WHERE  project_id = p_project_id
    AND  closed_at IS NOT NULL;

  -- ── Critical notifications (last 7 days) ──────────────────────────────────
  SELECT COUNT(*) INTO v_critical_count
  FROM   notifications
  WHERE  metadata->>'project_id' = p_project_id::text
    AND  priority    = 'critical'
    AND  created_at  > NOW() - INTERVAL '7 days';

  -- ── Recent decisions (last 28 days) ───────────────────────────────────────
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'title',    title,
        'category', decision_category,
        'at',       decided_at
      ) ORDER BY decided_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_decisions
  FROM decision_events
  WHERE project_id = p_project_id
    AND decided_at  > NOW() - INTERVAL '28 days';

  -- ── Block detection — Option A ──────────────────────────────────────────────
  SELECT COALESCE(jsonb_agg(b ORDER BY b), '[]'::jsonb)
  INTO   v_active_blocks
  FROM (
    SELECT 'clarity_block'::text AS b
    WHERE  COALESCE(v_phase_current, 0) = 1
      AND  COALESCE(v_phase_score, 100) < 35
      AND  COALESCE(v_demand_cov, 'none') = 'none'

    UNION ALL

    SELECT 'traction_block'
    WHERE  COALESCE(v_demand_cov, 'none') IN ('none', 'basic')
        OR COALESCE(v_channel_count, 0) = 0

    UNION ALL

    SELECT 'structural_block'
    WHERE  COALESCE(v_cash_flow, FALSE) = TRUE
        OR EXISTS (
          SELECT 1 FROM strategic_blocks
          WHERE  project_id = p_project_id
            AND  resolved_at IS NULL
            AND  block_type IN ('function_no_owner', 'execution_drop')
        )
  ) sub(b);

  -- ── Optimus mode derivation — Option A3 ────────────────────────────────────
  v_optimus_mode := CASE
    WHEN COALESCE(v_viability_status, 'healthy') = 'critical'
      OR COALESCE(v_risk_level, 'low') = 'critical'
      OR COALESCE(v_phase_regressed, FALSE) = TRUE
      THEN 'estricto'
    WHEN COALESCE(v_phase_current, 1) >= 2
      AND COALESCE(v_viability_status, 'healthy') != 'critical'
      AND COALESCE(v_risk_level, 'low') != 'critical'
      THEN 'estandar'
    ELSE 'exploracion'
  END;

  -- ── F31: Founder patterns (max 3 active) ──────────────────────────────────
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'pattern_type', pattern_type,
        'description',  description,
        'confidence',   confidence
      ) ORDER BY detected_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_founder_patterns
  FROM (
    SELECT pattern_type, description, confidence, detected_at
    FROM   founder_patterns
    WHERE  project_id = p_project_id
      AND  status = 'active'
    ORDER BY detected_at DESC
    LIMIT 3
  ) sub;

  -- ── F30: Financial risks (max 5 critical/warning) ─────────────────────────
  BEGIN
    SELECT detect_financial_risks(p_project_id)->'risks'
    INTO   v_financial_risks;
  EXCEPTION WHEN OTHERS THEN
    v_financial_risks := '[]'::jsonb;
  END;

  -- ── Assemble context packet ────────────────────────────────────────────────
  RETURN jsonb_build_object(
    -- Phase
    'current_phase',          v_phase_current,
    'phase_score',            ROUND(COALESCE(v_phase_score, 0), 1),
    'phase_status',           COALESCE(v_phase_status, 'critical'),
    'hard_signal_met',        COALESCE(v_hard_signal, FALSE),
    'weeks_in_current_phase', ROUND(
      EXTRACT(EPOCH FROM (NOW() - COALESCE(v_phase_changed_at, NOW()))) / 604800.0, 1
    ),
    'phase_regressed',        COALESCE(v_phase_regressed, FALSE),
    -- Viability
    'viability_status',       COALESCE(v_viability_status, 'healthy'),
    't2_cash_flow_active',    COALESCE(v_cash_flow, FALSE),
    'top_trigger_type',       v_top_trigger,
    -- Risk
    'risk_level',             COALESCE(v_risk_level, 'insufficient_data'),
    'risk_status',            COALESCE(v_risk_status, 'insufficient_data'),
    -- Probability
    'probability_score',      v_prob_score,
    'probability_status',     COALESCE(v_prob_status, 'inactive'),
    'probability_trend',      COALESCE(v_prob_trend, 'insufficient_data'),
    -- Coverage
    'coverage', jsonb_build_object(
      'demand',   COALESCE(v_demand_cov, 'none'),
      'delivery', COALESCE(v_delivery_cov, 'none'),
      'cash',     COALESCE(v_cash_cov, 'none')
    ),
    -- Economic profile
    'economic_profile', jsonb_build_object(
      'model_type',    v_model_type,
      'pricing_model', v_pricing_model,
      'sales_cycle',   COALESCE(v_sales_cycle, 'desconocido'),
      'capital',       COALESCE(v_capital, 'desconocido')
    ),
    -- Operational context
    'bottleneck_role',        v_bottleneck_role,
    'user_role',              v_user_role,
    -- Blocks
    'active_blocks',          v_active_blocks,
    -- Mode
    'optimus_mode',           v_optimus_mode,
    -- Temporal context
    'last_ritual_completed',  v_last_ritual,
    -- History signals
    'critical_notifications_7d', COALESCE(v_critical_count, 0),
    'recent_decisions',          v_decisions,
    -- F31: Founder behavioral patterns
    'founder_patterns',          v_founder_patterns,
    -- F30: Financial risks
    'financial_risks',           v_financial_risks
  );
END;
$$;

COMMENT ON FUNCTION get_optimus_context(UUID, UUID) IS
  'P8.2 + F31 + F30: Ensambla el context packet de Optimus. '
  'Incluye phase/viability/risk/probability/coverage/economic_profile, '
  'block detection inline (Option A), mode derivado del engine (Option A3), '
  'founder_patterns (max 3, F31), y financial_risks (F30).';
