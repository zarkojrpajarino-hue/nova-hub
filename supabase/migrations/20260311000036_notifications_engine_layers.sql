-- ============================================================================
-- MIGRACIÓN 00036 — N7.1-N7.5: Notification Layers 2–5 (Engine events)
--
-- Orden de ejecución: N7.1 → N7.3 → N7.4 → N7.2 (per user spec)
--
-- Patrón:
--   - Funciones notify_*_changes(project_id): leen tablas de output del motor,
--     comparan con última notificación del mismo tipo, emiten si hay cambio.
--   - run_notification_batch() se extiende para llamarlas en cada ciclo.
--   - NO se tocan los engine runners — arquitectura limpia.
--
-- N7.5 (hard caps): ya implementado en 00035 como check_notification_cap().
-- ============================================================================

-- ── Helper: owner de un proyecto ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_project_owner(p_project_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT created_by FROM projects WHERE id = p_project_id;
$$;

-- ── N7.1 — Phase Engine ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_phase_changes(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_phase   SMALLINT;
  v_phase_score     NUMERIC(5,2);
  v_phase_status    TEXT;
  v_hard_signal     BOOLEAN;
  v_phase_changed   TIMESTAMPTZ;
  v_prev_phase      SMALLINT;
  v_prev_score      NUMERIC(5,2);
  v_weeks_in_phase  INTEGER;
  v_score_range     NUMERIC(5,2);
  v_project_url     TEXT;
  v_project_name    TEXT;
  v_owner_id        UUID;
BEGIN
  -- Current state
  SELECT current_phase, phase_score, phase_status, hard_signal_met, phase_last_changed_at
  INTO   v_current_phase, v_phase_score, v_phase_status, v_hard_signal, v_phase_changed
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  IF v_current_phase IS NULL THEN RETURN; END IF;

  SELECT nombre INTO v_project_name FROM projects WHERE id = p_project_id;
  v_owner_id    := get_project_owner(p_project_id);
  v_project_url := format('/proyecto/%s', p_project_id);

  -- Previous phase from history (second most recent row)
  SELECT phase, phase_score
  INTO   v_prev_phase, v_prev_score
  FROM   project_phase_history
  WHERE  project_id = p_project_id
  ORDER  BY calculated_at DESC
  OFFSET 1
  LIMIT  1;

  -- ── L2.1: phase_advanced ─────────────────────────────────────────────────
  IF v_prev_phase IS NOT NULL AND v_current_phase > v_prev_phase THEN
    PERFORM notify_all_project_members(
      p_project_id, 'phase_advanced', 'high',
      format('Proyecto avanzó a Fase %s', v_current_phase),
      format('"%s" ha alcanzado la Fase %s. El motor detectó progreso significativo.',
        v_project_name, v_current_phase),
      v_project_url, 'Ver dashboard',
      jsonb_build_object('from_phase', v_prev_phase, 'to_phase', v_current_phase),
      7
    );
  END IF;

  -- ── L2.2: phase_regressed ────────────────────────────────────────────────
  IF v_prev_phase IS NOT NULL AND v_current_phase < v_prev_phase THEN
    PERFORM notify_all_project_members(
      p_project_id, 'phase_regressed', 'critical',
      format('Regresión de fase: Fase %s → %s', v_prev_phase, v_current_phase),
      format('"%s" ha regresado de Fase %s a Fase %s. Revisa los indicadores del motor.',
        v_project_name, v_prev_phase, v_current_phase),
      v_project_url, 'Ver qué cambió',
      jsonb_build_object('from_phase', v_prev_phase, 'to_phase', v_current_phase),
      7
    );
  END IF;

  -- ── L2.3: phase_critical ─────────────────────────────────────────────────
  IF v_phase_status = 'critical' THEN
    PERFORM notify_all_project_members(
      p_project_id, 'phase_critical', 'high',
      'Proyecto en estado crítico',
      format('"%s" está en estado crítico en Fase %s. Requiere atención inmediata.',
        v_project_name, v_current_phase),
      v_project_url, 'Ver dashboard',
      jsonb_build_object('phase', v_current_phase, 'phase_score', v_phase_score),
      7
    );
  END IF;

  -- ── L2.4: hard_signal_reached ────────────────────────────────────────────
  IF v_hard_signal = TRUE AND v_owner_id IS NOT NULL THEN
    IF check_notification_cap(v_owner_id, 'high') AND NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_owner_id
        AND type    = 'hard_signal_reached'
        AND metadata->>'project_id' = p_project_id::text
        AND created_at > NOW() - INTERVAL '30 days'
    ) THEN
      PERFORM create_notification(
        v_owner_id, 'hard_signal_reached', 'high',
        'Señal dura alcanzada',
        format('"%s" ha cumplido la señal dura de Fase %s. Estás listo para avanzar.',
          v_project_name, v_current_phase),
        v_project_url, 'Ver progreso',
        jsonb_build_object(
          'project_id', p_project_id,
          'phase',      v_current_phase
        )
      );
    END IF;
  END IF;

  -- ── L2.5: phase_stagnant ─────────────────────────────────────────────────
  -- Misma fase 3+ semanas con delta de score < 5 pts
  SELECT
    COUNT(DISTINCT DATE_TRUNC('week', calculated_at)),
    COALESCE(MAX(phase_score) - MIN(phase_score), 0)
  INTO v_weeks_in_phase, v_score_range
  FROM project_phase_history
  WHERE project_id = p_project_id
    AND phase       = v_current_phase
    AND calculated_at > NOW() - INTERVAL '21 days';

  IF v_weeks_in_phase >= 3 AND v_score_range < 5 AND v_owner_id IS NOT NULL THEN
    IF check_notification_cap(v_owner_id, 'medium') AND NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_owner_id
        AND type    = 'phase_stagnant'
        AND metadata->>'project_id' = p_project_id::text
        AND created_at > NOW() - INTERVAL '7 days'
    ) THEN
      PERFORM create_notification(
        v_owner_id, 'phase_stagnant', 'medium',
        'Proyecto estancado',
        format('"%s" lleva 3+ semanas en Fase %s sin progreso significativo.',
          v_project_name, v_current_phase),
        v_project_url, 'Ver qué falta',
        jsonb_build_object(
          'project_id',    p_project_id,
          'phase',         v_current_phase,
          'weeks_in_phase', v_weeks_in_phase
        )
      );
    END IF;
  END IF;
END;
$$;

-- ── N7.3 — Viability Engine ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_viability_changes(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viability_status  TEXT;
  v_cash_flow_active  BOOLEAN;
  v_project_name      TEXT;
  v_project_url       TEXT;
BEGIN
  SELECT viability_status, t2_cash_flow_active
  INTO   v_viability_status, v_cash_flow_active
  FROM   project_viability_state
  WHERE  project_id = p_project_id;

  IF v_viability_status IS NULL THEN RETURN; END IF;

  SELECT nombre INTO v_project_name FROM projects WHERE id = p_project_id;
  v_project_url := format('/proyecto/%s', p_project_id);

  -- ── L4.1: viability_critical ─────────────────────────────────────────────
  IF v_viability_status = 'critical' THEN
    PERFORM notify_all_project_members(
      p_project_id, 'viability_critical', 'critical',
      'Viabilidad crítica',
      format('"%s" ha entrado en estado de viabilidad crítica. Acción inmediata requerida.',
        v_project_name),
      v_project_url, 'Ver diagnóstico',
      jsonb_build_object('viability_status', v_viability_status),
      3
    );
  END IF;

  -- ── L4.2: viability_monitoring ────────────────────────────────────────────
  IF v_viability_status IN ('monitoring', 'stagnation') THEN
    PERFORM notify_all_project_members(
      p_project_id, 'viability_monitoring', 'medium',
      'Proyecto en vigilancia',
      format('"%s" está en monitoreo de viabilidad. Revisa los indicadores.',
        v_project_name),
      v_project_url, 'Ver indicadores',
      jsonb_build_object('viability_status', v_viability_status),
      7
    );
  END IF;

  -- ── L4.3: viability_resolved ──────────────────────────────────────────────
  IF v_viability_status = 'healthy' THEN
    PERFORM notify_all_project_members(
      p_project_id, 'viability_resolved', 'low',
      'Viabilidad restaurada',
      format('"%s" ha salido del estado de alerta. Viabilidad saludable.',
        v_project_name),
      v_project_url, 'Ver estado',
      jsonb_build_object('viability_status', v_viability_status),
      30
    );
  END IF;

  -- ── L4.4: cash_flow_alert ─────────────────────────────────────────────────
  IF v_cash_flow_active = TRUE THEN
    PERFORM notify_all_project_members(
      p_project_id, 'cash_flow_alert', 'critical',
      'Alerta de flujo de caja',
      format('"%s" tiene un problema activo de flujo de caja (T2). Revisa el estado financiero.',
        v_project_name),
      v_project_url, 'Ver financiero',
      jsonb_build_object('t2_cash_flow_active', TRUE),
      3
    );
  END IF;
END;
$$;

-- ── N7.4 — Risk / Org Engine ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_risk_changes(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risk_level    TEXT;
  v_risk_status   TEXT;
  v_project_name  TEXT;
  v_project_url   TEXT;
BEGIN
  SELECT risk_level, risk_status
  INTO   v_risk_level, v_risk_status
  FROM   project_risk_score
  WHERE  project_id = p_project_id;

  IF v_risk_level IS NULL OR v_risk_status = 'insufficient_data' THEN RETURN; END IF;

  SELECT nombre INTO v_project_name FROM projects WHERE id = p_project_id;
  v_project_url := format('/proyecto/%s', p_project_id);

  -- ── L5.1: risk_critical ───────────────────────────────────────────────────
  IF v_risk_level = 'critical' THEN
    PERFORM notify_all_project_members(
      p_project_id, 'risk_critical', 'critical',
      'Riesgo crítico',
      format('"%s" tiene riesgo operacional crítico. Intervención inmediata necesaria.',
        v_project_name),
      v_project_url, 'Ver riesgos',
      jsonb_build_object('risk_level', v_risk_level),
      3
    );
  END IF;

  -- ── L5.2: risk_elevated ───────────────────────────────────────────────────
  IF v_risk_level = 'high' THEN
    PERFORM notify_all_project_members(
      p_project_id, 'risk_elevated', 'high',
      'Riesgo elevado',
      format('"%s" tiene riesgo operacional elevado. Revisa los factores de riesgo.',
        v_project_name),
      v_project_url, 'Ver riesgos',
      jsonb_build_object('risk_level', v_risk_level),
      7
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION notify_bottlenecks(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_block       RECORD;
  v_owner_id    UUID;
  v_project_name TEXT;
  v_project_url TEXT;
BEGIN
  v_owner_id    := get_project_owner(p_project_id);
  IF v_owner_id IS NULL THEN RETURN; END IF;

  SELECT nombre INTO v_project_name FROM projects WHERE id = p_project_id;
  v_project_url := format('/proyecto/%s', p_project_id);

  -- ── L5.3: bottleneck_detected ─────────────────────────────────────────────
  -- Bloqueos activos creados en las últimas 6 horas (nueva aparición en este ciclo)
  FOR v_block IN
    SELECT id, block_type, description
    FROM strategic_blocks
    WHERE project_id  = p_project_id
      AND resolved_at IS NULL
      AND created_at  > NOW() - INTERVAL '6 hours'
  LOOP
    IF NOT check_notification_cap(v_owner_id, 'high') THEN
      EXIT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_owner_id
        AND type    = 'bottleneck_detected'
        AND metadata->>'block_id' = v_block.id::text
        AND created_at > NOW() - INTERVAL '7 days'
    ) THEN
      PERFORM create_notification(
        v_owner_id, 'bottleneck_detected', 'high',
        'Bloqueo detectado',
        format('"%s" tiene un nuevo bloqueo activo: %s',
          v_project_name,
          COALESCE(v_block.description, v_block.block_type)
        ),
        v_project_url, 'Ver bloqueos',
        jsonb_build_object(
          'project_id', p_project_id,
          'block_id',   v_block.id,
          'block_type', v_block.block_type
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- ── N7.2 — Probability Engine ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_probability_changes(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_score  NUMERIC(5,2);
  v_current_status TEXT;
  v_prev_score     NUMERIC(5,2);
  v_delta          NUMERIC(5,2);
  v_project_name   TEXT;
  v_project_url    TEXT;
BEGIN
  SELECT probability_score, probability_status
  INTO   v_current_score, v_current_status
  FROM   project_probability
  WHERE  project_id = p_project_id;

  IF v_current_status IS NULL OR v_current_status = 'inactive' THEN RETURN; END IF;

  SELECT nombre INTO v_project_name FROM projects WHERE id = p_project_id;
  v_project_url := format('/proyecto/%s', p_project_id);

  -- Previous score from history
  SELECT probability_score INTO v_prev_score
  FROM   project_probability_history
  WHERE  project_id = p_project_id
  ORDER  BY calculated_at DESC
  OFFSET 1
  LIMIT  1;

  IF v_prev_score IS NOT NULL AND v_current_score IS NOT NULL THEN
    v_delta := v_current_score - v_prev_score;

    -- ── L3.1: probability_drop ───────────────────────────────────────────────
    IF v_delta < -15 THEN
      PERFORM notify_all_project_members(
        p_project_id, 'probability_drop', 'high',
        'Probabilidad cayó significativamente',
        format('"%s" perdió %.0f pts de probabilidad (ahora %.0f%%). Revisa los inputs.',
          v_project_name, ABS(v_delta), v_current_score),
        v_project_url, 'Ver análisis',
        jsonb_build_object(
          'from_score', v_prev_score,
          'to_score',   v_current_score,
          'delta',      v_delta
        ),
        3
      );
    END IF;

    -- ── L3.3: probability_recovered ─────────────────────────────────────────
    IF v_delta > 20 AND v_prev_score < 30 THEN
      PERFORM notify_all_project_members(
        p_project_id, 'probability_recovered', 'low',
        'Probabilidad se recuperó',
        format('"%s" recuperó %.0f pts de probabilidad (ahora %.0f%%). Buen trabajo.',
          v_project_name, v_delta, v_current_score),
        v_project_url, 'Ver progreso',
        jsonb_build_object(
          'from_score', v_prev_score,
          'to_score',   v_current_score,
          'delta',      v_delta
        ),
        7
      );
    END IF;
  END IF;

  -- ── L3.2: probability_critical ───────────────────────────────────────────
  IF v_current_score IS NOT NULL AND v_current_score < 20 THEN
    PERFORM notify_all_project_members(
      p_project_id, 'probability_critical', 'critical',
      'Probabilidad crítica',
      format('"%s" tiene una probabilidad de éxito del %.0f%%. Acción urgente necesaria.',
        v_project_name, v_current_score),
      v_project_url, 'Ver diagnóstico',
      jsonb_build_object('probability_score', v_current_score),
      7
    );
  END IF;
END;
$$;

-- ── Extender run_notification_batch con layers 2–5 ───────────────────────────

CREATE OR REPLACE FUNCTION run_notification_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Layer 1: actividad
  PERFORM notify_inactive_leads();
  PERFORM notify_overdue_tasks();
  PERFORM notify_expiring_validations();
  PERFORM notify_inactive_projects();

  -- Layers 2–5: engine events (por proyecto)
  FOR v_project_id IN
    SELECT id FROM projects WHERE deleted_at IS NULL
  LOOP
    BEGIN
      PERFORM notify_phase_changes(v_project_id);
      PERFORM notify_viability_changes(v_project_id);
      PERFORM notify_risk_changes(v_project_id);
      PERFORM notify_bottlenecks(v_project_id);
      PERFORM notify_probability_changes(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_batch: failed for project %: %', v_project_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION run_notification_batch() IS
  'Batch completo: Layer 1 (actividad) + Layers 2–5 (engine events). pg_cron cada 6h.';
