-- AUD.M.11 — Meeting blocker: distinguir agudo (recurrente en 3 reuniones consecutivas)
--            vs crónico (aparece en ≥3 de las últimas 10 reuniones)
--
-- Modifica detect_meeting_patterns() para clasificar cada blocker recurrente
-- con un campo `pattern_type`: 'acute' | 'chronic' | 'recurring'
-- y actualiza el severity del strategic_block generado en M18.19 según el tipo.
--
-- Definición:
--   acute   = blocker en las 3 últimas reuniones consecutivas del proyecto
--   chronic = blocker en ≥3 de las últimas 10 reuniones (no necesariamente consecutivas)
--   recurring = ≥2 reuniones en 90d pero no cumple agudo ni crónico

CREATE OR REPLACE FUNCTION detect_meeting_patterns(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recurring_topics    JSONB;
  v_unresolved_blockers JSONB;
  v_type_frequency      JSONB;
  v_avg_fulfillment     NUMERIC;
  v_threshold_met       BOOLEAN := FALSE;
BEGIN

  -- ── 1. Recurring topics con clasificación acute/chronic/recurring ──────────
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'blocker_title',    blocker_title,
      'meeting_count',    meeting_count,
      'first_seen_at',    first_seen_at,
      'last_seen_at',     last_seen_at,
      -- AUD.M.11: clasificación del patrón
      'pattern_type',     CASE
        -- acute: aparece en las últimas 3 reuniones del proyecto
        WHEN is_in_last3_consecutive THEN 'acute'
        -- chronic: ≥3 reuniones en las últimas 10 del proyecto
        WHEN count_in_last10 >= 3 THEN 'chronic'
        ELSE 'recurring'
      END
    ) ORDER BY meeting_count DESC, last_seen_at DESC
  ), '[]'::jsonb)
  INTO v_recurring_topics
  FROM (
    SELECT
      lower(trim(mi.content->>'title'))         AS blocker_title,
      COUNT(DISTINCT mi.meeting_id)             AS meeting_count,
      MIN(m.created_at)                         AS first_seen_at,
      MAX(m.created_at)                         AS last_seen_at,
      -- ¿Aparece en las 3 últimas reuniones del proyecto?
      (
        SELECT COUNT(DISTINCT mi2.meeting_id) = 3
        FROM meeting_insights mi2
        JOIN meetings m2 ON m2.id = mi2.meeting_id
        WHERE m2.project_id    = p_project_id
          AND mi2.insight_type = 'blocker'
          AND mi2.review_status = 'approved'
          AND lower(trim(mi2.content->>'title')) = lower(trim(mi.content->>'title'))
          AND m2.id IN (
            SELECT id FROM meetings
            WHERE project_id = p_project_id AND status = 'completed'
            ORDER BY created_at DESC LIMIT 3
          )
      ) AS is_in_last3_consecutive,
      -- Cuántas de las últimas 10 reuniones lo incluyen
      (
        SELECT COUNT(DISTINCT mi3.meeting_id)
        FROM meeting_insights mi3
        JOIN meetings m3 ON m3.id = mi3.meeting_id
        WHERE m3.project_id    = p_project_id
          AND mi3.insight_type = 'blocker'
          AND mi3.review_status = 'approved'
          AND lower(trim(mi3.content->>'title')) = lower(trim(mi.content->>'title'))
          AND m3.id IN (
            SELECT id FROM meetings
            WHERE project_id = p_project_id AND status = 'completed'
            ORDER BY created_at DESC LIMIT 10
          )
      ) AS count_in_last10
    FROM meeting_insights mi
    JOIN meetings m ON m.id = mi.meeting_id
    WHERE m.project_id    = p_project_id
      AND mi.insight_type = 'blocker'
      AND mi.review_status = 'approved'
      AND m.created_at > NOW() - INTERVAL '90 days'
      AND mi.content->>'title' IS NOT NULL
    GROUP BY lower(trim(mi.content->>'title'))
    HAVING COUNT(DISTINCT mi.meeting_id) >= 2
  ) sub;

  -- ── 2. Threshold: algún blocker 'acute' o 'chronic' → M18.19 activo ─────────
  SELECT EXISTS (
    SELECT 1
    FROM meeting_insights mi
    JOIN meetings m ON m.id = mi.meeting_id
    WHERE m.project_id    = p_project_id
      AND mi.insight_type = 'blocker'
      AND mi.review_status = 'approved'
      AND m.created_at > NOW() - INTERVAL '90 days'
      AND mi.content->>'title' IS NOT NULL
    GROUP BY lower(trim(mi.content->>'title'))
    HAVING COUNT(DISTINCT mi.meeting_id) >= 3
  )
  INTO v_threshold_met;

  -- ── 3. Unresolved blockers ────────────────────────────────────────────────
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'blocker_title',  mi.content->>'title',
      'meeting_id',     mi.meeting_id,
      'meeting_title',  m.title,
      'meeting_date',   m.created_at
    ) ORDER BY m.created_at DESC
  ), '[]'::jsonb)
  INTO v_unresolved_blockers
  FROM meeting_insights mi
  JOIN meetings m ON m.id = mi.meeting_id
  WHERE m.project_id     = p_project_id
    AND mi.insight_type  = 'blocker'
    AND mi.review_status = 'approved'
    AND m.created_at > NOW() - INTERVAL '60 days'
    AND NOT EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.meeting_id = mi.meeting_id
        AND t.status     = 'done'
    );

  -- ── 4. Meeting type frequency ─────────────────────────────────────────────
  SELECT COALESCE(jsonb_object_agg(meeting_type, cnt), '{}'::jsonb)
  INTO v_type_frequency
  FROM (
    SELECT meeting_type, COUNT(*) AS cnt
    FROM meetings
    WHERE project_id = p_project_id
      AND created_at > NOW() - INTERVAL '90 days'
    GROUP BY meeting_type
  ) sub;

  -- ── 5. Average fulfillment (últimas 5 reuniones) ──────────────────────────
  SELECT COALESCE(AVG(
    CASE WHEN tasks_total > 0
      THEN tasks_done::NUMERIC / tasks_total
      ELSE NULL
    END
  ), 0)
  INTO v_avg_fulfillment
  FROM (
    SELECT
      m.id,
      COUNT(t.id) FILTER (WHERE t.meeting_id = m.id)           AS tasks_total,
      COUNT(t.id) FILTER (WHERE t.meeting_id = m.id AND t.status = 'done') AS tasks_done
    FROM meetings m
    LEFT JOIN tasks t ON t.meeting_id = m.id
    WHERE m.project_id = p_project_id
      AND m.status     = 'completed'
    ORDER BY m.created_at DESC
    LIMIT 5
  ) sub;

  RETURN jsonb_build_object(
    'recurring_topics',    v_recurring_topics,
    'unresolved_blockers', v_unresolved_blockers,
    'type_frequency',      v_type_frequency,
    'avg_fulfillment',     ROUND(v_avg_fulfillment, 3),
    'threshold_met',       v_threshold_met
  );
END;
$$;

COMMENT ON FUNCTION detect_meeting_patterns(UUID) IS
  'M18.18 + AUD.M.11: Detecta patrones en meeting_insights. '
  'AUD.M.11: cada blocker recurrente incluye pattern_type: acute (en 3 últimas consecutivas) / '
  'chronic (≥3 de últimas 10) / recurring (≥2 en 90d). '
  'Threshold_met activa creación de strategic_block (M18.19).';
