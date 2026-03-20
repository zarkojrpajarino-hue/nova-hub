-- I15.V2.1 — Añadir 'meeting_intelligence' como valor válido de provider
--             en integration_connections y tablas relacionadas.
--
-- El campo provider es TEXT (sin CHECK constraint), así que solo actualizamos
-- el COMMENT para documentar el nuevo valor. Otros sistemas que lean
-- WHERE provider = 'meeting_intelligence' ya funcionarán sin migración de datos.
--
-- Uso: permite registrar que un proyecto tiene Meeting Intelligence activo
-- como si fuera una integración — los engines pueden leer su last_sync_at
-- para saber cuándo fue la última reunión procesada.

COMMENT ON COLUMN integration_connections.provider IS
  'Proveedor de la integración. Valores permitidos: '
  'stripe | holded | hubspot | asana | trello | google_calendar | meeting_intelligence. '
  'I15.V2.1: meeting_intelligence registra que el proyecto usa Meeting Intelligence '
  'y permite que los engines consulten last_sync_at de la última reunión procesada.';

COMMENT ON COLUMN integration_entities.provider IS
  'Proveedor origen de la entidad. Valores: '
  'stripe | holded | hubspot | asana | trello | google_calendar | meeting_intelligence.';

COMMENT ON COLUMN integration_sync_runs.provider IS
  'Proveedor del sync. Valores: '
  'stripe | holded | hubspot | asana | trello | google_calendar | meeting_intelligence.';
