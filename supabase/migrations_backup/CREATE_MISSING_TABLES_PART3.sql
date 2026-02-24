-- =============================================
-- PARTE 3: ÍNDICES, TRIGGERS Y FUNCIONES
-- =============================================

-- Índices
CREATE INDEX IF NOT EXISTS idx_kpis_owner ON kpis(owner_id);
CREATE INDEX IF NOT EXISTS idx_kpis_project ON kpis(project_id);
CREATE INDEX IF NOT EXISTS idx_kpis_status ON kpis(status);
CREATE INDEX IF NOT EXISTS idx_kpi_validaciones_kpi ON kpi_validaciones(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_validaciones_validator ON kpi_validaciones(validator_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_project ON pending_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(estado_cobro);
CREATE INDEX IF NOT EXISTS idx_master_applications_user ON master_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_master_applications_status ON master_applications(status);
CREATE INDEX IF NOT EXISTS idx_master_votes_application ON master_votes(application_id);
CREATE INDEX IF NOT EXISTS idx_master_votes_voter ON master_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_team_masters_member ON team_masters(member_id);
CREATE INDEX IF NOT EXISTS idx_team_masters_role ON team_masters(role_name);
CREATE INDEX IF NOT EXISTS idx_team_masters_active ON team_masters(is_active);
CREATE INDEX IF NOT EXISTS idx_user_insights_user ON user_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_insights_type ON user_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_user_playbooks_user ON user_playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playbooks_role ON user_playbooks(role_name);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_month ON financial_metrics(month);

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_kpis_updated_at ON kpis;
CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pending_payments_updated_at ON pending_payments;
CREATE TRIGGER update_pending_payments_updated_at BEFORE UPDATE ON pending_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_master_applications_updated_at ON master_applications;
CREATE TRIGGER update_master_applications_updated_at BEFORE UPDATE ON master_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_masters_updated_at ON team_masters;
CREATE TRIGGER update_team_masters_updated_at BEFORE UPDATE ON team_masters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_insights_updated_at ON user_insights;
CREATE TRIGGER update_user_insights_updated_at BEFORE UPDATE ON user_insights
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_playbooks_updated_at ON user_playbooks;
CREATE TRIGGER update_user_playbooks_updated_at BEFORE UPDATE ON user_playbooks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función get_financial_metrics_secure arreglada
DROP FUNCTION IF EXISTS get_financial_metrics_secure();
CREATE OR REPLACE FUNCTION get_financial_metrics_secure()
RETURNS SETOF financial_metrics
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM financial_metrics
  ORDER BY month DESC;
END;
$$;
