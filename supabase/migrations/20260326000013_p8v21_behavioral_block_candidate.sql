-- P8.V2.1 — behavioral_block accelerated activation
--
-- Añade `behavioral_block_candidate` a strategic_blocks.
-- Cuando ≥2 blocker insights del mismo tipo (misma área afectada) aparecen
-- en meeting_insights en las últimas 4 semanas, el bloque se marca como candidato
-- a behavioral_block para activación acelerada (sin esperar 3+ semanas de decision_events).
--
-- Decisión de diseño: "mismo tipo" = content->'affected_areas'->0 (primer área afectada).
-- Si no hay affected_areas, se agrupa por insight_type='blocker' globalmente.

-- ── 1. Columna nueva en strategic_blocks ──────────────────────────────────────

ALTER TABLE strategic_blocks
  ADD COLUMN IF NOT EXISTS behavioral_block_candidate BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN strategic_blocks.behavioral_block_candidate IS
  'P8.V2.1: TRUE si ≥2 blocker insights del mismo tipo (misma área afectada) se detectaron '
  'en meeting_insights en las últimas 4 semanas. Activa evaluación acelerada de behavioral_block.';

-- ── 2. Función que evalúa candidatos para un proyecto ─────────────────────────

CREATE OR REPLACE FUNCTION refresh_behavioral_block_candidates(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_area         TEXT;
  v_count        INTEGER;
  v_existing_id  UUID;
BEGIN
  -- Para cada área afectada con ≥2 blocker insights aprobados en últimas 4 semanas:
  FOR v_area, v_count IN
    SELECT
      COALESCE(mi.content->'affected_areas'->>0, 'general') AS area,
      COUNT(DISTINCT mi.meeting_id) AS cnt
    FROM   meeting_insights mi
    JOIN   meetings m ON m.id = mi.meeting_id
    WHERE  m.project_id     = p_project_id
      AND  mi.insight_type  = 'blocker'
      AND  mi.review_status = 'approved'
      AND  mi.created_at    > NOW() - INTERVAL '4 weeks'
    GROUP  BY area
    HAVING COUNT(DISTINCT mi.meeting_id) >= 2
  LOOP
    -- Buscar si ya existe un bloque candidato para esta área
    SELECT id INTO v_existing_id
    FROM   strategic_blocks
    WHERE  project_id                = p_project_id
      AND  behavioral_block_candidate = TRUE
      AND  description               ILIKE '%' || v_area || '%'
      AND  resolved_at               IS NULL
    LIMIT  1;

    IF v_existing_id IS NULL THEN
      -- Insertar nuevo bloque candidato
      INSERT INTO strategic_blocks (
        project_id,
        block_type,
        origin,
        source,
        description,
        behavioral_block_candidate,
        status
      ) VALUES (
        p_project_id,
        'other',
        'engine',
        'meeting_pattern',
        'Patrón recurrente: bloqueador en área "' || v_area || '" detectado en ≥2 reuniones (4 semanas)',
        TRUE,
        'active'
      )
      ON CONFLICT DO NOTHING;
    END IF;

  END LOOP;

  -- Desactivar candidatos cuyo patrón ya no cumple la condición (área ya no aparece ≥2 veces)
  UPDATE strategic_blocks sb
  SET    behavioral_block_candidate = FALSE,
         last_updated_at            = NOW()
  WHERE  sb.project_id                = p_project_id
    AND  sb.behavioral_block_candidate = TRUE
    AND  sb.resolved_at               IS NULL
    AND  NOT EXISTS (
      SELECT 1
      FROM   meeting_insights mi
      JOIN   meetings m ON m.id = mi.meeting_id
      WHERE  m.project_id     = p_project_id
        AND  mi.insight_type  = 'blocker'
        AND  mi.review_status = 'approved'
        AND  mi.created_at    > NOW() - INTERVAL '4 weeks'
        AND  COALESCE(mi.content->'affected_areas'->>0, 'general') =
               REGEXP_REPLACE(sb.description, '.*área "(.*)" detectado.*', '\1')
      HAVING COUNT(DISTINCT mi.meeting_id) >= 2
    );
END;
$$;

COMMENT ON FUNCTION refresh_behavioral_block_candidates(UUID) IS
  'P8.V2.1: Evalúa meeting_insights aprobados de tipo blocker en últimas 4 semanas. '
  'Si ≥2 meetings del mismo proyecto tienen bloqueador con la misma área afectada, '
  'marca/crea strategic_block con behavioral_block_candidate=TRUE.';

-- ── 3. Trigger en meeting_insights (after INSERT/UPDATE de review_status) ──────

CREATE OR REPLACE FUNCTION trg_refresh_behavioral_candidates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Solo activar cuando un insight de tipo blocker pasa a 'approved'
  IF NEW.insight_type = 'blocker' AND NEW.review_status = 'approved'
    AND (TG_OP = 'INSERT' OR OLD.review_status IS DISTINCT FROM 'approved')
  THEN
    SELECT m.project_id INTO v_project_id
    FROM   meetings m
    WHERE  m.id = NEW.meeting_id;

    IF v_project_id IS NOT NULL THEN
      PERFORM refresh_behavioral_block_candidates(v_project_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_meeting_insights_behavioral_candidate ON meeting_insights;
CREATE TRIGGER trg_meeting_insights_behavioral_candidate
  AFTER INSERT OR UPDATE OF review_status ON meeting_insights
  FOR EACH ROW
  EXECUTE FUNCTION trg_refresh_behavioral_candidates();
