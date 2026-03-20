-- F20.V2.4 — Persistir additional_context en ai_analysis_cache
-- Permite rellenar el campo en el UI de regeneración con el último contexto usado.

ALTER TABLE ai_analysis_cache
  ADD COLUMN IF NOT EXISTS additional_context TEXT;

COMMENT ON COLUMN ai_analysis_cache.additional_context IS
  'Contexto adicional del founder al momento de generar el análisis. Usado para pre-rellenar el campo en regeneraciones futuras.';
