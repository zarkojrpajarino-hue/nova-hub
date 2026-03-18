-- Prerrequisitos de sincronización — I15.41 + I15.43
-- Aplicado via Management API 2026-03-18

-- I15.41: last_seen_at en integration_entities
-- Actualizado en cada sync run que vuelve a ver la entidad.
-- Permite distinguir "sigue existiendo" de "residuo de sync antiguo".
-- NULL = entidad creada antes de esta migración (sin información de last_seen).
ALTER TABLE integration_entities
  ADD COLUMN last_seen_at TIMESTAMPTZ;

-- I15.43: cursor y estado partial en integration_sync_runs
-- pagination_cursor: opaque string del provider (starting_after, paginationToken, etc.)
-- is_partial: true si el sync superó el límite de páginas y hay más datos pendientes.
ALTER TABLE integration_sync_runs
  ADD COLUMN pagination_cursor TEXT,
  ADD COLUMN is_partial BOOLEAN NOT NULL DEFAULT false;
