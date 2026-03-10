-- =============================================================================
-- MIGRACIÓN 00020 — Engine tables: habilitar Supabase Realtime
--
-- Sin esta migración, useRealtimeSubscription se conecta pero nunca recibe
-- eventos de cambio en las tablas del engine (la publication no las incluye).
--
-- Las tablas del engine se actualizan por trigger functions (SECURITY DEFINER),
-- no por el cliente. Supabase Realtime escucha el WAL, que captura todos los
-- cambios independientemente del origen (cliente o trigger).
--
-- Tablas añadidas:
--   project_phase_state        — actualizada por run_phase_engine
--   project_probability        — actualizada por run_probability_engine
--   project_risk_score         — actualizada por run_risk_engine
--   project_function_coverage  — actualizada por coverage engine
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE project_phase_state;
ALTER PUBLICATION supabase_realtime ADD TABLE project_probability;
ALTER PUBLICATION supabase_realtime ADD TABLE project_risk_score;
ALTER PUBLICATION supabase_realtime ADD TABLE project_function_coverage;
