-- FASE 18 — M18.I.1: detect_meeting_triggers(p_project_id UUID)
--
-- Detecta señales en el estado del proyecto que indican que el founder
-- debería convocar una reunión. Devuelve una lista de triggers activos,
-- el total de señales, si se debe sugerir una reunión, el tipo sugerido
-- y la urgencia.
--
-- Señales detectadas:
--   1. overdue_commitments    — tasks de reunión vencidas sin completar
--   2. unresolved_blockers    — blockers aprobados sin task done vinculada
--   3. recurring_blocker      — strategic_blocks de source='meeting_pattern' activos
--   4. low_alignment          — última reunión con alignment_score < 0.5
--   5. no_recent_meeting      — última reunión completada > 14 días
--   6. pending_strategic_insights — integration_insights estratégicos pendientes
--   7. low_fulfillment        — tasa de cumplimiento media < 0.5 en últimas 5 reuniones
--
-- Lógica suggest_meeting: total_signals >= 3
-- Urgencia: high si ≥5 señales | blocker recurrente | ≥3 vencidos | >21 días sin reunión
--           medium si ≥3 señales
--           low si ≥1 señal

CREATE OR REPLACE FUNCTION detect_meeting_triggers(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_triggers         JSONB    := '[]'::jsonb;
  v_total_signals    INT      := 0;
  v_suggested_type   TEXT     := 'review';
  v_urgency          TEXT     := 'none';
  v_days_since       INT      := 0;
  v_last_meeting_at  TIMESTAMPTZ;

  -- Signal counters / values
  v_overdue_count      INT     := 0;
  v_unresolved_count   INT     := 0;
  v_recurring_count    INT     := 0;
  v_alignment_score    NUMERIC := NULL;
  v_pending_strategic  INT     := 0;
  v_avg_fulfillment    NUMERIC := NULL;
BEGIN

  -- ── 1. Overdue commitments ───────────────────────────────────────────────────
  -- tasks generadas por reunión, no completadas, con fecha límite pasada
  SELECT COUNT(*)
  INTO   v_overdue_count
  FROM   tasks
  WHERE  project_id   = p_project_id
    AND  meeting_id   IS NOT NULL
    AND  status       != 'done'
    AND  fecha_limite IS NOT NULL
    AND  fecha_limite  < CURRENT_DATE;

  IF v_overdue_count > 0 THEN
    v_triggers      := v_triggers || jsonb_build_array(jsonb_build_object(
      'key',     'overdue_commitments',
      'label',   v_overdue_count || ' compromiso(s) de reunión vencido(s) sin completar',
      'count',   v_overdue_count,
      'urgency', CASE WHEN v_overdue_count >= 3 THEN 'high' ELSE 'medium' END
    ));
    v_total_signals := v_total_signals + LEAST(v_overdue_count, 3);
  END IF;

  -- ── 2. Unresolved blockers ───────────────────────────────────────────────────
  -- blockers aprobados en reuniones recientes sin ninguna task done vinculada
  SELECT COUNT(DISTINCT mi.id)
  INTO   v_unresolved_count
  FROM   meeting_insights mi
  JOIN   meetings m ON m.id = mi.meeting_id
  WHERE  m.project_id     = p_project_id
    AND  mi.insight_type  = 'blocker'
    AND  mi.review_status = 'approved'
    AND  m.created_at     > NOW() - INTERVAL '30 days'
    AND  NOT EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.meeting_id = mi.meeting_id
        AND t.status     = 'done'
    );

  IF v_unresolved_count > 0 THEN
    v_triggers      := v_triggers || jsonb_build_array(jsonb_build_object(
      'key',     'unresolved_blockers',
      'label',   v_unresolved_count || ' blocker(s) de reunión sin resolver',
      'count',   v_unresolved_count,
      'urgency', 'medium'
    ));
    v_total_signals  := v_total_signals + 1;
    v_suggested_type := 'strategy';
  END IF;

  -- ── 3. Recurring blockers (strategic_blocks de patrones de reunión) ──────────
  SELECT COUNT(*)
  INTO   v_recurring_count
  FROM   strategic_blocks
  WHERE  project_id   = p_project_id
    AND  source       = 'meeting_pattern'
    AND  resolved_at  IS NULL;

  IF v_recurring_count > 0 THEN
    v_triggers      := v_triggers || jsonb_build_array(jsonb_build_object(
      'key',     'recurring_blocker',
      'label',   v_recurring_count || ' patrón(es) de bloqueo recurrente sin resolver',
      'count',   v_recurring_count,
      'urgency', 'high'
    ));
    v_total_signals  := v_total_signals + 2;
    v_suggested_type := 'strategy';
  END IF;

  -- ── 4. Low alignment score (última reunión completada con alignment_data) ─────
  SELECT (alignment_data->>'alignment_score')::NUMERIC
  INTO   v_alignment_score
  FROM   meetings
  WHERE  project_id   = p_project_id
    AND  status       = 'completed'
    AND  alignment_data IS NOT NULL
  ORDER  BY updated_at DESC
  LIMIT  1;

  IF v_alignment_score IS NOT NULL AND v_alignment_score < 0.5 THEN
    v_triggers      := v_triggers || jsonb_build_array(jsonb_build_object(
      'key',     'low_alignment',
      'label',   'Última reunión con alineación estratégica baja (' || ROUND(v_alignment_score * 100) || '%)',
      'count',   1,
      'urgency', 'medium'
    ));
    v_total_signals  := v_total_signals + 1;
    -- solo cambia a alignment si no es ya strategy
    IF v_suggested_type = 'review' THEN
      v_suggested_type := 'alignment';
    END IF;
  END IF;

  -- ── 5. No recent meeting ─────────────────────────────────────────────────────
  SELECT MAX(updated_at)
  INTO   v_last_meeting_at
  FROM   meetings
  WHERE  project_id = p_project_id
    AND  status     = 'completed';

  v_days_since := COALESCE(
    EXTRACT(DAY FROM NOW() - v_last_meeting_at)::INT,
    999
  );

  IF v_days_since >= 14 THEN
    v_triggers := v_triggers || jsonb_build_array(jsonb_build_object(
      'key',     'no_recent_meeting',
      'label',   CASE
        WHEN v_last_meeting_at IS NULL THEN 'Sin reuniones completadas aún'
        ELSE 'Última reunión hace ' || v_days_since || ' día(s)'
      END,
      'count',   v_days_since,
      'urgency', CASE WHEN v_days_since >= 21 THEN 'high' ELSE 'medium' END
    ));
    v_total_signals := v_total_signals + 1;
  END IF;

  -- ── 6. Pending strategic integration insights ────────────────────────────────
  SELECT COUNT(*)
  INTO   v_pending_strategic
  FROM   integration_insights
  WHERE  project_id   = p_project_id
    AND  insight_type = 'strategic_decision'
    AND  status       = 'pending'
    AND  expires_at   > NOW();

  IF v_pending_strategic > 0 THEN
    v_triggers      := v_triggers || jsonb_build_array(jsonb_build_object(
      'key',     'pending_strategic_insights',
      'label',   v_pending_strategic || ' señal(es) estratégica(s) de agentes pendientes de revisión',
      'count',   v_pending_strategic,
      'urgency', 'medium'
    ));
    v_total_signals := v_total_signals + 1;
  END IF;

  -- ── 7. Low fulfillment rate (últimas 5 reuniones completadas) ────────────────
  SELECT ROUND(AVG(sub.rate), 2)
  INTO   v_avg_fulfillment
  FROM (
    SELECT
      CASE
        WHEN COUNT(t.id) = 0 THEN NULL
        ELSE COUNT(t.id) FILTER (WHERE t.status = 'done')::NUMERIC / COUNT(t.id)
      END AS rate
    FROM   meetings m
    LEFT JOIN tasks t ON t.meeting_id = m.id
    WHERE  m.project_id = p_project_id
      AND  m.status     = 'completed'
    GROUP  BY m.id
    ORDER  BY m.created_at DESC
    LIMIT  5
  ) sub
  WHERE sub.rate IS NOT NULL;

  IF v_avg_fulfillment IS NOT NULL AND v_avg_fulfillment < 0.5 THEN
    v_triggers      := v_triggers || jsonb_build_array(jsonb_build_object(
      'key',     'low_fulfillment',
      'label',   'Tasa de cumplimiento media baja (' || ROUND(v_avg_fulfillment * 100) || '% en últimas reuniones)',
      'count',   1,
      'urgency', 'medium'
    ));
    v_total_signals := v_total_signals + 1;
  END IF;

  -- ── Urgency final ────────────────────────────────────────────────────────────
  IF  v_total_signals >= 5
   OR v_recurring_count > 0
   OR v_overdue_count  >= 3
   OR v_days_since     >= 21
  THEN
    v_urgency := 'high';
  ELSIF v_total_signals >= 3 THEN
    v_urgency := 'medium';
  ELSIF v_total_signals >= 1 THEN
    v_urgency := 'low';
  END IF;

  RETURN jsonb_build_object(
    'triggers',        v_triggers,
    'total_signals',   v_total_signals,
    'suggest_meeting', v_total_signals >= 3,
    'suggested_type',  v_suggested_type,
    'urgency',         v_urgency,
    'days_since_last', v_days_since
  );
END;
$$;

COMMENT ON FUNCTION detect_meeting_triggers(UUID) IS
  'M18.I.1: Detecta señales que indican que el founder debería convocar una reunión. '
  'Evalúa 7 tipos de señal. suggest_meeting=true cuando total_signals>=3. '
  'Usado por MeetingSuggestionBanner en MeetingHistory.';
