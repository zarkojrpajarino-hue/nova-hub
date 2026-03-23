-- =============================================================================
-- I15.112 — integration_audit_log table
-- I15.111 — RLS policy for role-based permissions on integration_connections
-- P8.6  — behavioral_block detection (pattern of avoidance)
-- P8.7  — Excess optimism detection (projections > results)
-- P8.8  — Excess conservatism detection (high score, no progression)
-- P8.9  — Block escalation (week 1 soft -> week 3 unlock mode)
-- P8.11 — SWOT/Competitors -> structural_block
-- P8.12 — Decision Accuracy Index
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- I15.112 — Integration Audit Log
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS integration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  action TEXT NOT NULL, -- 'connected' | 'disconnected' | 'sync_started' | 'sync_completed' | 'sync_failed' | 'credential_rotated' | 'permission_denied'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE integration_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read audit log" ON integration_audit_log FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = integration_audit_log.project_id
      AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
  )
);

CREATE POLICY "Members can insert audit log" ON integration_audit_log FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = integration_audit_log.project_id
      AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
  )
);

CREATE INDEX idx_integration_audit_log_project ON integration_audit_log(project_id, created_at DESC);

COMMENT ON TABLE integration_audit_log IS
  'I15.112: Audit trail for all integration actions — connect, disconnect, sync, credential rotation, permission checks.';

-- ─────────────────────────────────────────────────────────────────────────────
-- P8.7 — Excess optimism detection
-- P8.8 — Excess conservatism detection
-- P8.9 — Block escalation
-- P8.11 — SWOT -> structural_block
-- P8.12 — Decision Accuracy Index
--
-- Adds these to detect_founder_patterns() which already handles
-- optimism_bias and execution_decay. We extend with new pattern types.
-- ─────────────────────────────────────────────────────────────────────────────

-- P8.7 + P8.8 — RPC to detect financial optimism/conservatism bias
CREATE OR REPLACE FUNCTION detect_financial_bias(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_projections RECORD;
  v_actuals RECORD;
  v_optimism_count INTEGER := 0;
  v_conservatism_flag BOOLEAN := FALSE;
  v_patterns JSONB := '[]'::jsonb;
  v_phase_score NUMERIC;
  v_weeks_no_progress NUMERIC;
  v_phase_changed_at TIMESTAMPTZ;
BEGIN
  -- P8.7 — Excess optimism: projected MRR consistently > actual MRR
  -- Compare financial_projections vs key_metrics for last 4+ data points
  SELECT COUNT(*) INTO v_optimism_count
  FROM financial_projections fp
  CROSS JOIN LATERAL (
    SELECT metric_value FROM key_metrics km
    WHERE km.project_id = p_project_id
      AND km.metric_name = 'mrr'
      AND km.measured_at >= fp.created_at - INTERVAL '7 days'
      AND km.measured_at <= fp.created_at + INTERVAL '7 days'
    ORDER BY km.measured_at DESC
    LIMIT 1
  ) actual
  WHERE fp.project_id = p_project_id
    AND fp.projected_mrr IS NOT NULL
    AND actual.metric_value IS NOT NULL
    AND fp.projected_mrr > actual.metric_value * 1.3; -- 30% over-optimistic

  IF v_optimism_count >= 3 THEN
    v_patterns := v_patterns || jsonb_build_object(
      'pattern_type', 'optimism_bias',
      'description', format('Tus proyecciones superan la realidad en %s de los ultimos periodos — sesgo de optimismo detectado', v_optimism_count),
      'evidence', jsonb_build_array(jsonb_build_object(
        'metric', 'projected_vs_actual_mrr',
        'over_optimistic_periods', v_optimism_count
      )),
      'confidence', CASE WHEN v_optimism_count >= 5 THEN 'pattern' ELSE 'early_signal' END,
      'cycles_analyzed', v_optimism_count,
      'recommendation', 'Revisa tus proyecciones financieras — ajustalas a un 70-80% de tu estimacion actual para mayor precision'
    );
  END IF;

  -- P8.8 — Excess conservatism: high phase_score but no phase progression in 4+ weeks
  SELECT phase_score, phase_last_changed_at
  INTO v_phase_score, v_phase_changed_at
  FROM project_phase_state
  WHERE project_id = p_project_id;

  IF v_phase_score IS NOT NULL AND v_phase_changed_at IS NOT NULL THEN
    v_weeks_no_progress := EXTRACT(EPOCH FROM (NOW() - v_phase_changed_at)) / 604800.0;

    IF v_phase_score >= 70 AND v_weeks_no_progress >= 4 THEN
      v_conservatism_flag := TRUE;
      v_patterns := v_patterns || jsonb_build_object(
        'pattern_type', 'conservatism_bias',
        'description', format('Score de fase %.0f%% pero sin avance en %.1f semanas — posible exceso de conservadurismo', v_phase_score, v_weeks_no_progress),
        'evidence', jsonb_build_array(jsonb_build_object(
          'metric', 'phase_score_vs_progression',
          'phase_score', v_phase_score,
          'weeks_stalled', ROUND(v_weeks_no_progress, 1)
        )),
        'confidence', CASE WHEN v_weeks_no_progress >= 6 THEN 'pattern' ELSE 'early_signal' END,
        'cycles_analyzed', 1,
        'recommendation', 'Tu proyecto esta listo para avanzar de fase — el perfeccionismo puede estar frenando tu progreso'
      );
    END IF;
  END IF;

  -- Upsert patterns if any
  IF jsonb_array_length(v_patterns) > 0 THEN
    -- Expire old financial bias patterns
    UPDATE founder_patterns
    SET status = 'expired', expires_at = NOW()
    WHERE project_id = p_project_id
      AND pattern_type IN ('optimism_bias', 'conservatism_bias')
      AND status = 'active';

    INSERT INTO founder_patterns (project_id, pattern_type, description, evidence, confidence, cycles_analyzed, recommendation, status)
    SELECT
      p_project_id,
      (elem->>'pattern_type'),
      (elem->>'description'),
      COALESCE(elem->'evidence', '[]'::jsonb),
      (elem->>'confidence'),
      COALESCE((elem->>'cycles_analyzed')::integer, 1),
      (elem->>'recommendation'),
      'active'
    FROM jsonb_array_elements(v_patterns) AS elem;
  END IF;

  RETURN v_patterns;
END;
$$;

COMMENT ON FUNCTION detect_financial_bias(UUID) IS
  'P8.7 + P8.8: Detects excess optimism (projections > actuals 30%+ in 3+ periods) '
  'and excess conservatism (phase_score >= 70 but no phase progression in 4+ weeks).';

-- ─────────────────────────────────────────────────────────────────────────────
-- P8.9 — Block escalation: soft -> medium -> unlock mode
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_block_escalation(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_block RECORD;
  v_escalations JSONB := '[]'::jsonb;
  v_weeks_active NUMERIC;
BEGIN
  FOR v_block IN
    SELECT id, block_type, description, first_detected_at
    FROM strategic_blocks
    WHERE project_id = p_project_id
      AND resolved_at IS NULL
      AND status = 'active'
      AND first_detected_at IS NOT NULL
    ORDER BY first_detected_at ASC
  LOOP
    v_weeks_active := EXTRACT(EPOCH FROM (NOW() - v_block.first_detected_at)) / 604800.0;

    v_escalations := v_escalations || jsonb_build_object(
      'block_id', v_block.id,
      'block_type', v_block.block_type,
      'description', v_block.description,
      'weeks_active', ROUND(v_weeks_active, 1),
      'escalation_level', CASE
        WHEN v_weeks_active < 1 THEN 'soft'
        WHEN v_weeks_active < 2 THEN 'medium'
        WHEN v_weeks_active < 3 THEN 'hard'
        ELSE 'unlock_mode'
      END,
      'escalation_message', CASE
        WHEN v_weeks_active < 1 THEN 'Bloqueo reciente — revisa y planifica resolucion'
        WHEN v_weeks_active < 2 THEN 'Bloqueo activo hace ' || ROUND(v_weeks_active, 0)::text || ' semana(s) — necesita atencion'
        WHEN v_weeks_active < 3 THEN 'Bloqueo persistente — considera cambio de estrategia'
        ELSE 'MODO DESBLOQUEO: bloqueo critico de ' || ROUND(v_weeks_active, 0)::text || ' semanas — accion inmediata requerida'
      END
    );
  END LOOP;

  RETURN v_escalations;
END;
$$;

COMMENT ON FUNCTION compute_block_escalation(UUID) IS
  'P8.9: Computes escalation levels for active strategic blocks. '
  'Week 1: soft, Week 2: medium, Week 3: hard, Week 3+: unlock_mode.';

-- ─────────────────────────────────────────────────────────────────────────────
-- P8.11 — SWOT/Competitors -> structural_block
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_swot_structural_block(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_swot JSONB;
  v_threat_count INTEGER := 0;
  v_weakness_count INTEGER := 0;
  v_result JSONB := '{"structural_block_from_swot": false}'::jsonb;
  v_elem JSONB;
BEGIN
  -- Read the most recent competitive analysis SWOT for this project
  SELECT swot INTO v_swot
  FROM competitive_analysis
  WHERE project_id = p_project_id
    AND swot IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_swot IS NULL THEN
    RETURN v_result;
  END IF;

  -- Count threats and weaknesses
  v_threat_count := COALESCE(jsonb_array_length(v_swot->'threats'), 0);
  v_weakness_count := COALESCE(jsonb_array_length(v_swot->'weaknesses'), 0);

  -- If 3+ critical threats or 4+ weaknesses -> structural_block signal
  IF v_threat_count >= 3 OR v_weakness_count >= 4 THEN
    -- Check if a structural_block from SWOT already exists
    IF NOT EXISTS (
      SELECT 1 FROM strategic_blocks
      WHERE project_id = p_project_id
        AND source = 'swot_analysis'
        AND resolved_at IS NULL
    ) THEN
      INSERT INTO strategic_blocks (
        project_id, block_type, origin, source, description, status
      ) VALUES (
        p_project_id,
        'other',
        'engine',
        'swot_analysis',
        format('Analisis SWOT detecta %s amenazas y %s debilidades — posible bloqueo estructural', v_threat_count, v_weakness_count),
        'active'
      );
    END IF;

    v_result := jsonb_build_object(
      'structural_block_from_swot', true,
      'threats', v_threat_count,
      'weaknesses', v_weakness_count
    );
  ELSE
    -- Resolve any existing SWOT-based blocks if condition no longer met
    UPDATE strategic_blocks
    SET resolved_at = NOW(), status = 'resolved'
    WHERE project_id = p_project_id
      AND source = 'swot_analysis'
      AND resolved_at IS NULL;
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION check_swot_structural_block(UUID) IS
  'P8.11: Evaluates competitive_analysis.swot to detect structural blocks. '
  'If 3+ threats or 4+ weaknesses, creates strategic_block with source=swot_analysis.';

-- ─────────────────────────────────────────────────────────────────────────────
-- P8.12 — Decision Accuracy Index (internal, never shown to user)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_decision_accuracy_index(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_decisions INTEGER;
  v_positive_outcomes INTEGER;
  v_accuracy NUMERIC;
  v_recent_accuracy NUMERIC;
BEGIN
  -- Count all decisions with outcomes
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE outcome_positive = TRUE)
  INTO v_total_decisions, v_positive_outcomes
  FROM decision_events
  WHERE project_id = p_project_id
    AND outcome_positive IS NOT NULL;

  IF v_total_decisions < 3 THEN
    RETURN jsonb_build_object(
      'status', 'insufficient_data',
      'total_decisions', COALESCE(v_total_decisions, 0),
      'message', 'Se requieren al menos 3 decisiones con outcome para calcular DAI'
    );
  END IF;

  v_accuracy := ROUND(v_positive_outcomes::numeric / v_total_decisions * 100, 1);

  -- Recent accuracy (last 30 days)
  SELECT
    CASE WHEN COUNT(*) >= 2 THEN
      ROUND(COUNT(*) FILTER (WHERE outcome_positive = TRUE)::numeric / COUNT(*) * 100, 1)
    ELSE NULL END
  INTO v_recent_accuracy
  FROM decision_events
  WHERE project_id = p_project_id
    AND outcome_positive IS NOT NULL
    AND decided_at > NOW() - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'status', 'computed',
    'total_decisions', v_total_decisions,
    'positive_outcomes', v_positive_outcomes,
    'accuracy_pct', v_accuracy,
    'recent_accuracy_30d', v_recent_accuracy,
    'trend', CASE
      WHEN v_recent_accuracy IS NULL THEN 'insufficient_recent_data'
      WHEN v_recent_accuracy > v_accuracy + 5 THEN 'improving'
      WHEN v_recent_accuracy < v_accuracy - 5 THEN 'declining'
      ELSE 'stable'
    END
  );
END;
$$;

COMMENT ON FUNCTION compute_decision_accuracy_index(UUID) IS
  'P8.12: Decision Accuracy Index — internal metric, never shown to user. '
  'Computes ratio of positive outcomes to total decisions. '
  'Requires 3+ decisions with outcome_positive set. Includes 30-day trend.';

-- ─────────────────────────────────────────────────────────────────────────────
-- P8.6 — Behavioral block detection (pattern of avoidance)
-- This extends the existing detect_founder_patterns function with behavioral_block
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION detect_behavioral_block(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_decision_count INTEGER;
  v_avoided_categories JSONB;
  v_most_avoided TEXT;
  v_avoid_count INTEGER;
  v_total_expected INTEGER;
  v_patterns JSONB := '[]'::jsonb;
BEGIN
  -- Count decisions in last 3 weeks
  SELECT COUNT(*) INTO v_decision_count
  FROM decision_events
  WHERE project_id = p_project_id
    AND decided_at > NOW() - INTERVAL '3 weeks';

  IF v_decision_count < 5 THEN
    RETURN '[]'::jsonb; -- Not enough decisions to detect avoidance
  END IF;

  -- Detect category avoidance: if a decision_category has 0 decisions
  -- but the project has active blocks in that area
  SELECT
    jsonb_object_agg(
      sb.block_type,
      COALESCE(decision_count, 0)
    )
  INTO v_avoided_categories
  FROM strategic_blocks sb
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS decision_count
    FROM decision_events de
    WHERE de.project_id = p_project_id
      AND de.decided_at > NOW() - INTERVAL '3 weeks'
      AND de.decision_category = sb.block_type
  ) dc ON TRUE
  WHERE sb.project_id = p_project_id
    AND sb.resolved_at IS NULL
    AND sb.status = 'active';

  -- Find block types with 0 decisions (avoidance pattern)
  IF v_avoided_categories IS NOT NULL THEN
    SELECT key, value::integer
    INTO v_most_avoided, v_avoid_count
    FROM jsonb_each_text(v_avoided_categories)
    WHERE value::integer = 0
    ORDER BY key
    LIMIT 1;

    IF v_most_avoided IS NOT NULL THEN
      v_patterns := v_patterns || jsonb_build_object(
        'pattern_type', 'behavioral_block',
        'description', format('Patron de evitacion detectado: bloqueo activo en %s pero 0 decisiones en esa area en 3 semanas', v_most_avoided),
        'evidence', jsonb_build_array(jsonb_build_object(
          'metric', 'avoidance_pattern',
          'block_type', v_most_avoided,
          'decisions_on_block', 0,
          'total_decisions', v_decision_count
        )),
        'confidence', 'early_signal',
        'cycles_analyzed', 1,
        'recommendation', format('Tienes un bloqueo activo en %s pero no lo estas abordando — considera dedicar al menos una decision a resolverlo', v_most_avoided)
      );

      -- Upsert into founder_patterns
      UPDATE founder_patterns
      SET status = 'expired', expires_at = NOW()
      WHERE project_id = p_project_id
        AND pattern_type = 'behavioral_block'
        AND status = 'active';

      INSERT INTO founder_patterns (project_id, pattern_type, description, evidence, confidence, cycles_analyzed, recommendation, status)
      SELECT
        p_project_id,
        (elem->>'pattern_type'),
        (elem->>'description'),
        COALESCE(elem->'evidence', '[]'::jsonb),
        (elem->>'confidence'),
        COALESCE((elem->>'cycles_analyzed')::integer, 1),
        (elem->>'recommendation'),
        'active'
      FROM jsonb_array_elements(v_patterns) AS elem;
    END IF;
  END IF;

  RETURN v_patterns;
END;
$$;

COMMENT ON FUNCTION detect_behavioral_block(UUID) IS
  'P8.6: Detects behavioral_block (avoidance pattern). If a project has active strategic_blocks '
  'but 0 decisions addressing that block_type in the last 3 weeks, flags as behavioral avoidance.';
