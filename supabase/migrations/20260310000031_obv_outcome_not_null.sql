-- =============================================================================
-- MIGRACIÓN 00031 — obv_outcome NOT NULL
--
-- Contexto:
--   Migration 00003 añadió obv_outcome como TEXT nullable, con comportamiento
--   documentado: NULL = "no documentado, no cuenta como iteración".
--
--   Ese diseño correspondía a un producto donde el campo era opcional en UI.
--   El contrato ha cambiado:
--     - Gap 1 (UI): obv_outcome se hizo obligatorio en OBVFormLogic.
--     - El engine depende de que todo OBV tenga resultado documentado.
--     - Dejar la BD permisiva mantiene una puerta a datos rotos por inserción
--       directa, Edge Functions u otros clientes.
--
-- Estado previo a aplicar:
--   SELECT COUNT(*) FROM obvs WHERE obv_outcome IS NULL; → 0
--   (verificado 2026-03-10 — tabla vacía, no hay NULLs legacy)
--   Si hubiera NULLs, el ALTER TABLE fallaría. Backfill no requerido.
--
-- Cambios:
--   1. ALTER COLUMN obv_outcome SET NOT NULL
--   2. Actualizar COMMENT para reflejar el nuevo contrato
--
-- Guards IS NOT NULL en engine functions (00003, 00019, etc.) quedan
-- redundantes pero se mantienen por claridad — no afectan correctitud.
-- =============================================================================

ALTER TABLE obvs
  ALTER COLUMN obv_outcome SET NOT NULL;

COMMENT ON COLUMN obvs.obv_outcome IS
  'Resultado del OBV documentado por el founder. Obligatorio desde 2026-03 (UI enforcement + DB NOT NULL). success=hipótesis confirmada (100pts), partial=señal mixta (60pts), fail=hipótesis refutada (20pts). Los guards IS NOT NULL en engine functions son redundantes pero se mantienen para claridad.';
