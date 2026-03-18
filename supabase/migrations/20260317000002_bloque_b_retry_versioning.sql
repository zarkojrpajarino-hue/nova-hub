-- =============================================
-- BLOQUE B — I15.27 + I15.29: Retry tracking y versioning de integraciones
-- Aplicado: 2026-03-17 via Management API
-- =============================================

-- I15.27 — retry_count: cuántos intentos reales usó el sync (0 = primer intento ok)
ALTER TABLE integration_sync_runs
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- I15.29 — adapter_version: versión de la edge function/lógica que creó este sync_run
ALTER TABLE integration_sync_runs
  ADD COLUMN IF NOT EXISTS adapter_version TEXT NOT NULL DEFAULT '1.0';

-- I15.29 — contract_version: versión del ContractEntity schema con que se normalizó la entidad
ALTER TABLE integration_entities
  ADD COLUMN IF NOT EXISTS contract_version TEXT NOT NULL DEFAULT '1.0';

-- Comentarios de diseño:
-- retry_count = attempts - 1 (0 si el primer intento fue exitoso, 1 si hubo 1 reintento, etc.)
-- adapter_version = incrementar manualmente cuando cambia la lógica de sync (e.g. '1.1', '2.0')
-- contract_version = incrementar manualmente cuando cambia INTEGRATION_DATA_CONTRACT.md
-- No hay auto-migration en v1: las filas antiguas quedan en '1.0' — correcto por ser el estado inicial.
