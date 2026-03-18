-- =============================================================================
-- MIGRACIÓN 00029 — RLS cleanup: project_org_state
--
-- Auditoría completa de RLS (2026-03-10):
--   Tablas de engine state con RLS ya definido (migración 00002):
--     project_phase_state, project_phase_history, project_probability,
--     project_probability_history, project_viability_state, viability_events,
--     project_economic_profile, project_economic_profile_history,
--     project_risk_score, project_risk_score_history, project_function_coverage,
--     decision_events, strategic_blocks, engine_versions, benchmarks
--   Tablas de fase 4 nuevas con RLS:
--     project_acquisition_channel (migración 00012)
--     project_challenges (migración 00027)
--   Sin RLS: project_org_state (migración 00026) ← única deuda
--
-- Patrón aplicado: Pattern 2 (tablas de engine)
--   Lectura: miembros autenticados del proyecto (auth_is_project_member)
--   Escritura: sin política de autenticados — las escrituras vienen de
--     run_org_capacity_engine() que es SECURITY DEFINER (bypass RLS)
--     y del cron job (service_role)
--
-- Helper functions usadas (definidas en migración 00002):
--   auth_is_project_member(p_project_id UUID) → BOOLEAN
-- =============================================================================

ALTER TABLE project_org_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_state: members read"
  ON project_org_state
  FOR SELECT
  TO authenticated
  USING (auth_is_project_member(project_id));
