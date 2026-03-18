-- ============================================================================
-- MIGRACIÓN 00037 — Calibración G9.8 + G9.9
--
-- G9.8: notify_phase_changes() — suprimir phase_critical si phase_regressed
--       ya disparó en el mismo ciclo de ejecución (intra-cycle flag).
--       Evita doble notificación critical+high para el mismo evento de deterioro.
--
-- G9.9: notify_phase_changes() + notify_probability_changes()
--       Sustituye OFFSET 1 LIMIT 1 por selección basada en MAX(calculated_at)
--       anterior. Hace la detección del registro previo robusta ante múltiples
--       ejecuciones del engine en el mismo día (retry, cron manual, bug).
-- ============================================================================

-- ── N7.1 — Phase Engine (corregido) ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_phase_changes(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_phase         SMALLINT;
  v_phase_score           NUMERIC(5,2);
  v_phase_status          TEXT;
  v_hard_signal           BOOLEAN;
  v_phase_changed         TIMESTAMPTZ;
  v_prev_phase            SMALLINT;
  v_prev_score            NUMERIC(5,2);
  v_weeks_in_phase        INTEGER;
  v_score_range           NUMERIC(5,2);
  v_project_url           TEXT;
  v_project_name          TEXT;
  v_owner_id              UUID;
  -- G9.8: supresión intra-ciclo de phase_critical si ya se emitió phase_regressed
  v_phase_regressed_fired BOOLEAN := FALSE;
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

  -- G9.9: Selección de fila anterior basada en MAX(calculated_at) previo.
  -- Evita que OFFSET 1 apunte a otra fila del mismo día cuando el engine
  -- se ejecuta varias veces en el mismo ciclo (retry, cron manual, bug).
  SELECT phase, phase_score
  INTO   v_prev_phase, v_prev_score
  FROM   project_phase_history
  WHERE  project_id    = p_project_id
    AND  calculated_at < (
           SELECT MAX(calculated_at)
           FROM   project_phase_history
           WHERE  project_id = p_project_id
         )
  ORDER  BY calculated_at DESC
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
    -- G9.8: marcar flag antes de notificar — si la condición existe,
    -- phase_critical sería redundante independientemente de si el cap
    -- o el dedup bloquean la emisión real.
    v_phase_regressed_fired := TRUE;
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
  -- G9.8: suprimido si phase_regressed ya disparó este ciclo.
  -- phase_regressed (critical) cubre el evento de deterioro completo;
  -- emitir phase_critical además generaría doble alerta para el mismo estado.
  IF v_phase_status = 'critical' AND NOT v_phase_regressed_fired THEN
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
          'project_id',     p_project_id,
          'phase',          v_current_phase,
          'weeks_in_phase', v_weeks_in_phase
        )
      );
    END IF;
  END IF;
END;
$$;

COMMENT ON FUNCTION notify_phase_changes(UUID) IS
  'G9.8: intra-cycle suppression de phase_critical si phase_regressed ya disparó. '
  'G9.9: selección del registro anterior vía MAX(calculated_at) previo (no OFFSET 1).';

-- ── N7.2 — Probability Engine (corregido) ────────────────────────────────────

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

  -- G9.9: misma corrección que phase history — MAX(calculated_at) anterior
  -- en lugar de OFFSET 1. Misma causa raíz, mismo fix.
  SELECT probability_score INTO v_prev_score
  FROM   project_probability_history
  WHERE  project_id    = p_project_id
    AND  calculated_at < (
           SELECT MAX(calculated_at)
           FROM   project_probability_history
           WHERE  project_id = p_project_id
         )
  ORDER  BY calculated_at DESC
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

COMMENT ON FUNCTION notify_probability_changes(UUID) IS
  'G9.9: selección del registro anterior vía MAX(calculated_at) previo (no OFFSET 1). '
  'Mismo fix que notify_phase_changes — patrón idéntico sobre project_probability_history.';
