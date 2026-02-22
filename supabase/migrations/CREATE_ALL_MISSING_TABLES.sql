-- =============================================
-- CREAR TODAS LAS TABLAS FALTANTES
-- Para que TODA la app funcione
-- =============================================

-- 1. TABLA: kpis
CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  valor_objetivo NUMERIC,
  valor_actual NUMERIC DEFAULT 0,
  unidad TEXT,
  periodo TEXT,
  status TEXT DEFAULT 'pending',
  evidencia_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: kpi_validaciones
CREATE TABLE IF NOT EXISTS kpi_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  approved BOOLEAN NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: pending_payments
CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  pendiente NUMERIC NOT NULL,
  due_date DATE,
  dias_vencido INTEGER DEFAULT 0,
  estado_cobro TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: master_applications
CREATE TABLE IF NOT EXISTS master_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  motivation TEXT NOT NULL,
  achievements JSONB DEFAULT '[]',
  status TEXT DEFAULT 'voting',
  voting_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: master_votes
CREATE TABLE IF NOT EXISTS master_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES master_applications(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  vote BOOLEAN NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, voter_id)
);

-- 6. TABLA: team_masters
CREATE TABLE IF NOT EXISTS team_masters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: user_insights
CREATE TABLE IF NOT EXISTS user_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: user_playbooks
CREATE TABLE IF NOT EXISTS user_playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  steps JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA: financial_metrics (métricas mensuales)
CREATE TABLE IF NOT EXISTS financial_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  facturacion NUMERIC DEFAULT 0,
  margen NUMERIC DEFAULT 0,
  obvs_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month)
);

-- =============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================

ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREAR POLÍTICAS PERMISIVAS
-- =============================================

-- kpis
CREATE POLICY "kpis_all" ON kpis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kpis_anon" ON kpis FOR ALL TO anon USING (true) WITH CHECK (true);

-- kpi_validaciones
CREATE POLICY "kpi_validaciones_all" ON kpi_validaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kpi_validaciones_anon" ON kpi_validaciones FOR ALL TO anon USING (true) WITH CHECK (true);

-- pending_payments
CREATE POLICY "pending_payments_all" ON pending_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pending_payments_anon" ON pending_payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- master_applications
CREATE POLICY "master_applications_all" ON master_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "master_applications_anon" ON master_applications FOR ALL TO anon USING (true) WITH CHECK (true);

-- master_votes
CREATE POLICY "master_votes_all" ON master_votes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "master_votes_anon" ON master_votes FOR ALL TO anon USING (true) WITH CHECK (true);

-- team_masters
CREATE POLICY "team_masters_all" ON team_masters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "team_masters_anon" ON team_masters FOR ALL TO anon USING (true) WITH CHECK (true);

-- user_insights
CREATE POLICY "user_insights_all" ON user_insights FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_insights_anon" ON user_insights FOR ALL TO anon USING (true) WITH CHECK (true);

-- user_playbooks
CREATE POLICY "user_playbooks_all" ON user_playbooks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_playbooks_anon" ON user_playbooks FOR ALL TO anon USING (true) WITH CHECK (true);

-- financial_metrics
CREATE POLICY "financial_metrics_all" ON financial_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "financial_metrics_anon" ON financial_metrics FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- CREAR ÍNDICES PARA MEJOR PERFORMANCE
-- =============================================

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

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_payments_updated_at BEFORE UPDATE ON pending_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_applications_updated_at BEFORE UPDATE ON master_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_masters_updated_at BEFORE UPDATE ON team_masters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_insights_updated_at BEFORE UPDATE ON user_insights
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_playbooks_updated_at BEFORE UPDATE ON user_playbooks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ARREGLAR FUNCIÓN get_financial_metrics_secure
-- =============================================

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

-- =============================================
-- COMPLETADO
-- =============================================
