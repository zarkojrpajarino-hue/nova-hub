-- =============================================================================
-- MIGRACIÓN 00010 — ENGINE VERSION DEFAULTS
--
-- Problema: project_economic_profile.engine_version era NOT NULL sin DEFAULT.
-- El UI tenía que hardcodear 'risk_v1.0' — si se deploya risk_v2.0, rompe.
--
-- Solución:
--   1. get_active_engine_version(p_motor) → helper SQL para leer versión activa.
--   2. ALTER TABLE ... SET DEFAULT → el UI ya no gestiona versiones.
--
-- Tablas escritas por motores (no UI) mantienen engine_version explícito
-- porque los runners pasan la versión correcta en runtime.
-- Solo project_economic_profile es escrita directamente por el UI.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_active_engine_version(p_motor TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM   engine_versions
  WHERE  motor     = p_motor
    AND  is_active = true
  LIMIT  1;
$$;

COMMENT ON FUNCTION get_active_engine_version(TEXT) IS
  'Devuelve el id de la versión activa para el motor dado. Usado como DEFAULT en columnas engine_version escritas por UI. Si no hay versión activa → NULL (fallará FK, señal de config incorrecta).';

-- Aplicar DEFAULT a la única tabla escrita directamente por el UI
ALTER TABLE project_economic_profile
  ALTER COLUMN engine_version SET DEFAULT get_active_engine_version('risk');
