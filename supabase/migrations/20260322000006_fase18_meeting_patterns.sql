-- FASE 18 — M18.18: detect_meeting_patterns(p_project_id UUID)
--           Añade strategic_blocks.source para trazabilidad de origen.

-- ── strategic_blocks.source ──────────────────────────────────────────────────
-- La spec M18.19 requiere source='meeting_pattern' pero la tabla no tenía esa columna.
ALTER TABLE strategic_blocks
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'engine';

COMMENT ON COLUMN strategic_blocks.source IS
  'Origen del bloqueo: engine | manual | meeting_pattern. '
  'meeting_pattern = creado automáticamente por detect_meeting_patterns().';

-- ── M18.18: detect_meeting_patterns
--           M18.19: upsert_recurring_blocker_as_strategic_block() — helper para M18.19
--
-- M18.18: analiza meeting_insights de las últimas 10 reuniones y detecta:
--   recurring_topics    — blockers/temas que aparecen en ≥ 2 reuniones distintas
--   unresolved_blockers — blockers aprobados de reunión sin task completada asociada
--   meeting_type_frequency — distribución de tipos de reunión (señal de uso)
--   avg_fulfillment_rate   — media de fulfillment de las últimas 5 reuniones completadas
--   blocker_threshold_met  — true si algún blocker aparece en ≥ 3 reuniones (trigger M18.19)
--
-- Implementación pragmática: no usa ML. Compara titles de blockers por
--   lower(trim(title)) — exact match normalizado — para evitar falsos positivos
--   de similaridad difusa que requieren extensiones (pg_trgm) opcionales.
--
-- M18.19: helper SQL que el servicio TypeScript llama para upsert de strategic_block.
--   Upsert = si ya existe un strategic_block con source='meeting_pattern' y la misma
--   description (normalizada) para el proyecto → no duplicar.

-- ── M18.18: detect_meeting_patterns ─────────────────────────────────────────

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

  -- ── 1. Recurring topics: blockers que aparecen en ≥ 2 reuniones distintas ──
  --   Agrupa por title normalizado (lower + trim), cuenta reuniones únicas.
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'blocker_title',    blocker_title,
      'meeting_count',    meeting_count,
      'first_seen_at',    first_seen_at,
      'last_seen_at',     last_seen_at
    ) ORDER BY meeting_count DESC, last_seen_at DESC
  ), '[]'::jsonb)
  INTO v_recurring_topics
  FROM (
    SELECT
      lower(trim(mi.content->>'title'))         AS blocker_title,
      COUNT(DISTINCT mi.meeting_id)             AS meeting_count,
      MIN(m.created_at)                         AS first_seen_at,
      MAX(m.created_at)                         AS last_seen_at
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

  -- ── 2. Threshold: algún blocker en ≥ 3 reuniones → trigger para M18.19 ────
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

  -- ── 3. Unresolved blockers: blocker aprobado sin task done vinculada ────────
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
    -- sin task done asociada a esta reunión
    AND NOT EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.meeting_id = mi.meeting_id
        AND t.status     = 'done'
    );

  -- ── 4. Meeting type frequency (últimas 10 reuniones completadas) ────────────
  SELECT COALESCE(jsonb_object_agg(meeting_type, cnt), '{}'::jsonb)
  INTO v_type_frequency
  FROM (
    SELECT meeting_type, COUNT(*) AS cnt
    FROM meetings
    WHERE project_id = p_project_id
      AND status     = 'completed'
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) freq
  GROUP BY meeting_type, cnt;

  -- ── 5. Avg fulfillment rate de las últimas 5 reuniones completadas ──────────
  SELECT ROUND(AVG(sub.fulfillment_rate), 3)
  INTO v_avg_fulfillment
  FROM (
    SELECT
      CASE WHEN COUNT(t.id) = 0 THEN NULL
        ELSE COUNT(t.id) FILTER (WHERE t.status = 'done')::NUMERIC / COUNT(t.id)
      END AS fulfillment_rate
    FROM meetings m
    LEFT JOIN tasks t ON t.meeting_id = m.id
    WHERE m.project_id = p_project_id
      AND m.status     = 'completed'
    GROUP BY m.id
    ORDER BY m.created_at DESC
    LIMIT 5
  ) sub
  WHERE sub.fulfillment_rate IS NOT NULL;

  RETURN jsonb_build_object(
    'recurring_topics',       v_recurring_topics,
    'unresolved_blockers',    v_unresolved_blockers,
    'meeting_type_frequency', v_type_frequency,
    'avg_fulfillment_rate',   v_avg_fulfillment,
    'blocker_threshold_met',  v_threshold_met
  );
END;
$$;

COMMENT ON FUNCTION detect_meeting_patterns(UUID) IS
  'M18.18: Detecta patrones en historial de reuniones del proyecto. '
  'recurring_topics = blockers en ≥2 reuniones · blocker_threshold_met = ≥3 reuniones.';

-- ── M18.19: upsert_recurring_blocker_as_strategic_block ──────────────────────
--
-- Llamada por meetingAgentService.ts cuando blocker_threshold_met=true.
-- Upsert: si ya existe un strategic_block con source='meeting_pattern' y
-- el mismo description (normalizado) → no crea duplicado, retorna el id existente.

CREATE OR REPLACE FUNCTION upsert_recurring_blocker_as_strategic_block(
  p_project_id      UUID,
  p_description     TEXT,
  p_first_seen_at   TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Buscar bloque existente con mismo description normalizado
  SELECT id INTO v_id
  FROM strategic_blocks
  WHERE project_id    = p_project_id
    AND lower(trim(description)) = lower(trim(p_description))
    AND resolved_at IS NULL
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;  -- ya existe, no duplicar
  END IF;

  -- Crear nuevo strategic_block
  INSERT INTO strategic_blocks (
    project_id,
    block_type,
    severity,
    description,
    source,
    engine_version,
    created_at
  ) VALUES (
    p_project_id,
    'structural',
    'medium',
    p_description,
    'meeting_pattern',
    'v1',
    COALESCE(p_first_seen_at, NOW())
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION upsert_recurring_blocker_as_strategic_block(UUID, TEXT, TIMESTAMPTZ) IS
  'M18.19: Crea un strategic_block de tipo structural cuando un blocker aparece en ≥3 reuniones. '
  'Upsert seguro: no duplica si ya existe el mismo description (normalizado) sin resolver.';
