-- =============================================================================
-- MIGRACIÓN 20260326000006 — D2.V2.2: obvs.source column
--
-- Prerrequisito para CRM híbrido (internal + hubspot + asana + …).
-- Sin este campo, no es posible distinguir OBVs creadas internamente de OBVs
-- importadas desde integraciones externas — lo que bloquea filtros y lógica
-- de deduplicación futura.
--
-- Diseño:
--   source TEXT NOT NULL DEFAULT 'internal'
--   Valores canónicos: 'internal' | 'hubspot' | 'asana' | 'stripe' | …
--   El índice partial excluye 'internal' (mayoría) → cobertura eficiente de
--   queries que filtran fuentes externas (JOIN con integration_entities, etc.)
-- =============================================================================

ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'internal';

-- Índice parcial: solo filas de fuentes externas (≪ volumen que 'internal')
CREATE INDEX IF NOT EXISTS idx_obvs_source
  ON obvs(source)
  WHERE source != 'internal';

COMMENT ON COLUMN obvs.source IS
  'D2.V2.2: Origen de la OBV. ''internal'' = creada en app; ''hubspot'' | ''asana'' | …= importada. '
  'DEFAULT ''internal'' garantiza backward compatibility. Prerequisito del CRM híbrido.';
