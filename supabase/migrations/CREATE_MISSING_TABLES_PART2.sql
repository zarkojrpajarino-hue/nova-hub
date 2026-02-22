-- =============================================
-- PARTE 2: HABILITAR RLS Y CREAR POLÍTICAS
-- =============================================

-- Habilitar RLS
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para kpis
DROP POLICY IF EXISTS "kpis_all" ON kpis;
DROP POLICY IF EXISTS "kpis_anon" ON kpis;
CREATE POLICY "kpis_all" ON kpis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kpis_anon" ON kpis FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para kpi_validaciones
DROP POLICY IF EXISTS "kpi_validaciones_all" ON kpi_validaciones;
DROP POLICY IF EXISTS "kpi_validaciones_anon" ON kpi_validaciones;
CREATE POLICY "kpi_validaciones_all" ON kpi_validaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kpi_validaciones_anon" ON kpi_validaciones FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para pending_payments
DROP POLICY IF EXISTS "pending_payments_all" ON pending_payments;
DROP POLICY IF EXISTS "pending_payments_anon" ON pending_payments;
CREATE POLICY "pending_payments_all" ON pending_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pending_payments_anon" ON pending_payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para master_applications
DROP POLICY IF EXISTS "master_applications_all" ON master_applications;
DROP POLICY IF EXISTS "master_applications_anon" ON master_applications;
CREATE POLICY "master_applications_all" ON master_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "master_applications_anon" ON master_applications FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para master_votes
DROP POLICY IF EXISTS "master_votes_all" ON master_votes;
DROP POLICY IF EXISTS "master_votes_anon" ON master_votes;
CREATE POLICY "master_votes_all" ON master_votes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "master_votes_anon" ON master_votes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para team_masters
DROP POLICY IF EXISTS "team_masters_all" ON team_masters;
DROP POLICY IF EXISTS "team_masters_anon" ON team_masters;
CREATE POLICY "team_masters_all" ON team_masters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "team_masters_anon" ON team_masters FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para user_insights
DROP POLICY IF EXISTS "user_insights_all" ON user_insights;
DROP POLICY IF EXISTS "user_insights_anon" ON user_insights;
CREATE POLICY "user_insights_all" ON user_insights FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_insights_anon" ON user_insights FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para user_playbooks
DROP POLICY IF EXISTS "user_playbooks_all" ON user_playbooks;
DROP POLICY IF EXISTS "user_playbooks_anon" ON user_playbooks;
CREATE POLICY "user_playbooks_all" ON user_playbooks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_playbooks_anon" ON user_playbooks FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para financial_metrics
DROP POLICY IF EXISTS "financial_metrics_all" ON financial_metrics;
DROP POLICY IF EXISTS "financial_metrics_anon" ON financial_metrics;
CREATE POLICY "financial_metrics_all" ON financial_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "financial_metrics_anon" ON financial_metrics FOR ALL TO anon USING (true) WITH CHECK (true);
