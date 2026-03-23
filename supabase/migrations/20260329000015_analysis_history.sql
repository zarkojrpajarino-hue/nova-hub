-- Fix agujero #3: ai_analysis_cache es UNIQUE por nivel — no guarda histórico.
-- AnalysisDiff necesita comparar análisis anterior vs actual.
-- Solución: eliminar el UNIQUE constraint y permitir múltiples filas por nivel.
-- La lógica de "cache hit" se basa en input_hash + expires_at, no en UNIQUE.

ALTER TABLE ai_analysis_cache DROP CONSTRAINT IF EXISTS ai_analysis_cache_project_id_analysis_level_key;
ALTER TABLE ai_analysis_cache DROP CONSTRAINT IF EXISTS uq_analysis_cache;

-- Add index for efficient lookup (replaces the UNIQUE constraint for queries)
CREATE INDEX IF NOT EXISTS idx_analysis_cache_lookup
  ON ai_analysis_cache(project_id, analysis_level, generated_at DESC);
