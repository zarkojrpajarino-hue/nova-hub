-- =============================================================================
-- I15.V2.1 -- meeting_intelligence provider reservation
--
-- The integration_connections.provider column is TEXT (no enum/check constraint),
-- so no schema change is needed. This migration documents the reservation.
-- =============================================================================

-- meeting_intelligence provider type reserved for FASE 18 audio/transcription connections.
-- When implemented, integration_connections rows with provider = 'meeting_intelligence'
-- will store credentials for:
--   - Audio recording services (e.g., Otter.ai, Fireflies.ai)
--   - Calendar-linked transcription pipelines
--   - Real-time meeting note extraction
--
-- Expected entity types in integration_entities:
--   - meeting_transcript
--   - meeting_action_item
--   - meeting_decision
--
-- No schema change required — provider is TEXT, no CHECK constraint.

COMMENT ON TABLE integration_connections IS
  'I15: Conexiones de integracion. Providers activos: stripe, holded, hubspot, asana, google_calendar. '
  'Reservados: meeting_intelligence (FASE 18 audio/transcription).';
