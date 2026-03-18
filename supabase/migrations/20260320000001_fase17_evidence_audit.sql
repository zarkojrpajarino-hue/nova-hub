-- =============================================================================
-- FASE 17 — T17.28: función get_evidence_audit
-- Debug interno para diagnosticar calidad de evidencia por proyecto.
-- No se expone en UI v1 — solo uso desde SQL Editor de Supabase.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_evidence_audit(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN jsonb_build_object(

    -- Distribución de insights activos por tipo de evidencia
    'insights_by_type', (
      SELECT jsonb_object_agg(evidence_type, cnt)
      FROM (
        SELECT evidence_type, COUNT(*) AS cnt
        FROM integration_insights
        WHERE project_id = p_project_id
          AND expires_at > NOW()
        GROUP BY evidence_type
      ) t
    ),

    -- Cuántos insights activos tienen baja calidad de evidencia
    'low_quality_count', (
      SELECT COUNT(*)
      FROM integration_insights
      WHERE project_id = p_project_id
        AND low_evidence_quality = TRUE
        AND expires_at > NOW()
    ),

    -- Fuentes distintas que aparecen en sources_used de insights activos
    -- Nota: sources_used es JSONB array de objetos {source, confidence, timestamp, entity_count}
    'sources_distribution', (
      SELECT jsonb_agg(DISTINCT elem->>'source')
      FROM integration_insights,
           jsonb_array_elements(sources_used) AS elem
      WHERE project_id = p_project_id
        AND expires_at > NOW()
        AND sources_used <> '[]'::jsonb
    ),

    -- Timestamp del último insight donde hubo conflicto de fuentes
    'last_conflict', (
      SELECT MAX(source_timestamp)
      FROM integration_insights
      WHERE project_id = p_project_id
        AND jsonb_array_length(sources_discarded) > 0
    )

  );
END;
$$;

-- =============================================================================
-- T17.30 — Queries de verificación post-migración (ejecutar manualmente)
-- =============================================================================
--
-- Verificar que no hay NULLs en los nuevos campos:
--   SELECT COUNT(*) FROM integration_insights WHERE evidence_type IS NULL;   -- debe ser 0
--   SELECT COUNT(*) FROM integration_insights WHERE sources_used IS NULL;    -- debe ser 0
--
-- Distribución de tipos de evidencia:
--   SELECT evidence_type, COUNT(*) FROM integration_insights GROUP BY evidence_type;
--
-- Insights sin metadata (anteriores a FASE 17) — deben tener defaults correctos:
--   SELECT COUNT(*) FROM integration_insights WHERE sources_used = '[]'::jsonb;
--
-- Uso de la función de auditoría (reemplazar con UUID real):
--   SELECT get_evidence_audit('<project_id>'::UUID);
