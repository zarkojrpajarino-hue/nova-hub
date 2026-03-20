-- P8.V2.2 — Añadir recent_decisions_from_meetings a get_optimus_context()
--
-- Agrega el campo `recent_decisions_from_meetings: [{summary, decided_at}]` (max 3)
-- desde meeting_insights WHERE insight_type='decision' AND review_status='approved'.
-- Join necesario: meeting_insights → meetings para obtener project_id.
--
-- Campo nuevo: distinto de `recent_decisions` (que viene de decision_events).
-- `recent_decisions_from_meetings` refleja decisiones de reuniones aprobadas.

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
  v_critical_count      INTEGER;
  v_decisions           JSONB;
  v_meeting_decisions   JSONB;  -- P8.V2.2
BEGIN

  -- ── Phase signals ──────────────────────────────────────────────────────────
  SELECT current_phase, phase_score, phase_status, hard_signal_met,
         phase_last_changed_at
  INTO   v_phase_current, v_phase_score, v_phase_status,
         v_hard_signal, v_phase_changed_at
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  -- Phase regression: hubo una entrada de fase mayor a la actual en los últimos 30d
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

  -- Probability trend: compara los 2 registros más recientes (14d)
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

  -- ── Bottleneck role (primer bloqueo function_no_owner activo) ─────────────
  SELECT description INTO v_bottleneck_role
  FROM   strategic_blocks
  WHERE  project_id  = p_project_id
    AND  resolved_at IS NULL
    AND  block_type  = 'function_no_owner'
  ORDER  BY first_detected_at ASC
  LIMIT  1;

  -- ── User role in this project ──────────────────────────────────────────────
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

  -- ── Recent decisions from decision_events (last 28 days) ──────────────────
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

  -- ── P8.V2.2: Recent decisions from meeting_insights (last 28 days, max 3) ─
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'summary',    sub.summary,
        'decided_at', sub.created_at
      )
    ),
    '[]'::jsonb
  )
  INTO v_meeting_decisions
  FROM (
    SELECT mi.content->>'title' AS summary, mi.created_at
    FROM   meeting_insights mi
    JOIN   meetings m ON m.id = mi.meeting_id
    WHERE  m.project_id     = p_project_id
      AND  mi.insight_type  = 'decision'
      AND  mi.review_status = 'approved'
      AND  mi.created_at    > NOW() - INTERVAL '28 days'
    ORDER  BY mi.created_at DESC
    LIMIT  3
  ) sub;

  -- ── Block detection — Option A ─────────────────────────────────────────────
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

  -- ── Optimus mode derivation — Option A3 ───────────────────────────────────
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
    'critical_notifications_7d',      COALESCE(v_critical_count, 0),
    'recent_decisions',               v_decisions,
    'recent_decisions_from_meetings', v_meeting_decisions   -- P8.V2.2
  );
END;
$$;

COMMENT ON FUNCTION get_optimus_context(UUID, UUID) IS
  'P8.2 + P8.V2.2: Ensambla el context packet de Optimus. '
  'P8.V2.2: añade recent_decisions_from_meetings (max 3) desde meeting_insights '
  'WHERE insight_type=decision AND review_status=approved.';
