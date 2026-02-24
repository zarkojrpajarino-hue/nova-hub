-- =============================================
-- CREAR TODAS LAS TABLAS FALTANTES PARA 100% FUNCIONALIDAD
-- =============================================

-- 1. Tabla: validation_order (orden de validación mensual)
CREATE TABLE IF NOT EXISTS validation_order (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  month_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- 2. Tabla: validator_stats (estadísticas de validadores)
CREATE TABLE IF NOT EXISTS validator_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_validations INTEGER DEFAULT 0,
  on_time_validations INTEGER DEFAULT 0,
  late_validations INTEGER DEFAULT 0,
  missed_validations INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla: pending_validations (validaciones pendientes)
CREATE TABLE IF NOT EXISTS pending_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE,
  validator_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('kpi', 'obv')),
  deadline TIMESTAMPTZ NOT NULL,
  validated_at TIMESTAMPTZ,
  is_late BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla: obv_validaciones (validaciones de OBVs)
CREATE TABLE IF NOT EXISTS obv_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  approved BOOLEAN NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(obv_id, validator_id)
);

-- 5. Tabla: role_rotation_requests (solicitudes de rotación de roles)
CREATE TABLE IF NOT EXISTS role_rotation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  requester_project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  requester_current_role TEXT NOT NULL,
  target_user_id UUID REFERENCES members(id) ON DELETE CASCADE,
  target_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  target_role TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('swap', 'transfer', 'rotation')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  reason TEXT,
  compatibility_score NUMERIC,
  compatibility_analysis JSONB DEFAULT '{}',
  requester_accepted BOOLEAN DEFAULT false,
  target_accepted BOOLEAN DEFAULT false,
  admin_approved BOOLEAN,
  approved_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 6. Tabla: role_history (historial de cambios de rol)
CREATE TABLE IF NOT EXISTS role_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  old_role TEXT,
  new_role TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('assignment', 'swap', 'transfer', 'rotation', 'promotion')),
  rotation_request_id UUID REFERENCES role_rotation_requests(id) ON DELETE SET NULL,
  previous_performance_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla: user_roles (roles actuales de usuarios - vista materializada más rápida)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- 8. Tabla: user_role_performance (performance por rol de usuario)
CREATE TABLE IF NOT EXISTS user_role_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  performance_score NUMERIC DEFAULT 0,
  total_obvs INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  avg_completion_time NUMERIC,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_name)
);

-- 9. Tabla: role_rankings (rankings por rol)
CREATE TABLE IF NOT EXISTS role_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  ranking_position INTEGER,
  score NUMERIC DEFAULT 0,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_name, period)
);

-- 10. Tabla: member_phase_progress (progreso de miembro por fase)
CREATE TABLE IF NOT EXISTS member_phase_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  ar_role TEXT,
  secondary_role TEXT,
  phase_name TEXT NOT NULL,
  progress_percentage NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, phase_name)
);

-- 11. Tabla: slack_webhooks (webhooks de Slack)
CREATE TABLE IF NOT EXISTS slack_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  webhook_type TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Tabla: role_competition_results (resultados de competencias por rol)
CREATE TABLE IF NOT EXISTS role_competition_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID,
  user_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  rank INTEGER,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Tabla: forecast_ingresos (forecast de ingresos)
CREATE TABLE IF NOT EXISTS forecast_ingresos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  forecasted_amount NUMERIC NOT NULL,
  actual_amount NUMERIC,
  confidence_level NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, month_year)
);

-- 14. Tabla: leads (leads de CRM)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  empresa TEXT,
  email TEXT,
  telefono TEXT,
  status TEXT DEFAULT 'prospecto' CHECK (status IN ('prospecto', 'contactado', 'cualificado', 'propuesta', 'en_negociacion', 'ganado', 'perdido')),
  valor_potencial NUMERIC,
  notas TEXT,
  proxima_accion TEXT,
  proxima_accion_fecha TIMESTAMPTZ,
  responsable_id UUID REFERENCES members(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Tabla: lead_history (historial de cambios de leads)
CREATE TABLE IF NOT EXISTS lead_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID REFERENCES members(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Vista: pipeline_global (pipeline global de ventas)
CREATE OR REPLACE VIEW pipeline_global AS
SELECT
  'prospeccion' AS stage,
  COUNT(*)::INTEGER AS count,
  COALESCE(SUM(valor_potencial), 0)::NUMERIC AS total_value
FROM leads
WHERE status = 'prospecto'
UNION ALL
SELECT
  'negociacion' AS stage,
  COUNT(*)::INTEGER AS count,
  COALESCE(SUM(valor_potencial), 0)::NUMERIC AS total_value
FROM leads
WHERE status = 'en_negociacion'
UNION ALL
SELECT
  'ganado' AS stage,
  COUNT(*)::INTEGER AS count,
  COALESCE(SUM(valor_potencial), 0)::NUMERIC AS total_value
FROM leads
WHERE status = 'ganado';

-- =============================================
-- HABILITAR RLS
-- =============================================

ALTER TABLE validation_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE validator_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_rotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_phase_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS (todas permisivas por simplicidad)
-- =============================================

-- validation_order
DROP POLICY IF EXISTS "validation_order_all" ON validation_order;
DROP POLICY IF EXISTS "validation_order_anon" ON validation_order;
CREATE POLICY "validation_order_all" ON validation_order FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "validation_order_anon" ON validation_order FOR ALL TO anon USING (true) WITH CHECK (true);

-- validator_stats
DROP POLICY IF EXISTS "validator_stats_all" ON validator_stats;
DROP POLICY IF EXISTS "validator_stats_anon" ON validator_stats;
CREATE POLICY "validator_stats_all" ON validator_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "validator_stats_anon" ON validator_stats FOR ALL TO anon USING (true) WITH CHECK (true);

-- pending_validations
DROP POLICY IF EXISTS "pending_validations_all" ON pending_validations;
DROP POLICY IF EXISTS "pending_validations_anon" ON pending_validations;
CREATE POLICY "pending_validations_all" ON pending_validations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pending_validations_anon" ON pending_validations FOR ALL TO anon USING (true) WITH CHECK (true);

-- obv_validaciones
DROP POLICY IF EXISTS "obv_validaciones_all" ON obv_validaciones;
DROP POLICY IF EXISTS "obv_validaciones_anon" ON obv_validaciones;
CREATE POLICY "obv_validaciones_all" ON obv_validaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "obv_validaciones_anon" ON obv_validaciones FOR ALL TO anon USING (true) WITH CHECK (true);

-- role_rotation_requests
DROP POLICY IF EXISTS "role_rotation_requests_all" ON role_rotation_requests;
DROP POLICY IF EXISTS "role_rotation_requests_anon" ON role_rotation_requests;
CREATE POLICY "role_rotation_requests_all" ON role_rotation_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "role_rotation_requests_anon" ON role_rotation_requests FOR ALL TO anon USING (true) WITH CHECK (true);

-- role_history
DROP POLICY IF EXISTS "role_history_all" ON role_history;
DROP POLICY IF EXISTS "role_history_anon" ON role_history;
CREATE POLICY "role_history_all" ON role_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "role_history_anon" ON role_history FOR ALL TO anon USING (true) WITH CHECK (true);

-- user_roles
DROP POLICY IF EXISTS "user_roles_all" ON user_roles;
DROP POLICY IF EXISTS "user_roles_anon" ON user_roles;
CREATE POLICY "user_roles_all" ON user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_roles_anon" ON user_roles FOR ALL TO anon USING (true) WITH CHECK (true);

-- user_role_performance
DROP POLICY IF EXISTS "user_role_performance_all" ON user_role_performance;
DROP POLICY IF EXISTS "user_role_performance_anon" ON user_role_performance;
CREATE POLICY "user_role_performance_all" ON user_role_performance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_role_performance_anon" ON user_role_performance FOR ALL TO anon USING (true) WITH CHECK (true);

-- role_rankings
DROP POLICY IF EXISTS "role_rankings_all" ON role_rankings;
DROP POLICY IF EXISTS "role_rankings_anon" ON role_rankings;
CREATE POLICY "role_rankings_all" ON role_rankings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "role_rankings_anon" ON role_rankings FOR ALL TO anon USING (true) WITH CHECK (true);

-- member_phase_progress
DROP POLICY IF EXISTS "member_phase_progress_all" ON member_phase_progress;
DROP POLICY IF EXISTS "member_phase_progress_anon" ON member_phase_progress;
CREATE POLICY "member_phase_progress_all" ON member_phase_progress FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "member_phase_progress_anon" ON member_phase_progress FOR ALL TO anon USING (true) WITH CHECK (true);

-- slack_webhooks
DROP POLICY IF EXISTS "slack_webhooks_all" ON slack_webhooks;
DROP POLICY IF EXISTS "slack_webhooks_anon" ON slack_webhooks;
CREATE POLICY "slack_webhooks_all" ON slack_webhooks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "slack_webhooks_anon" ON slack_webhooks FOR ALL TO anon USING (true) WITH CHECK (true);

-- role_competition_results
DROP POLICY IF EXISTS "role_competition_results_all" ON role_competition_results;
DROP POLICY IF EXISTS "role_competition_results_anon" ON role_competition_results;
CREATE POLICY "role_competition_results_all" ON role_competition_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "role_competition_results_anon" ON role_competition_results FOR ALL TO anon USING (true) WITH CHECK (true);

-- forecast_ingresos
DROP POLICY IF EXISTS "forecast_ingresos_all" ON forecast_ingresos;
DROP POLICY IF EXISTS "forecast_ingresos_anon" ON forecast_ingresos;
CREATE POLICY "forecast_ingresos_all" ON forecast_ingresos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "forecast_ingresos_anon" ON forecast_ingresos FOR ALL TO anon USING (true) WITH CHECK (true);

-- leads
DROP POLICY IF EXISTS "leads_all" ON leads;
DROP POLICY IF EXISTS "leads_anon" ON leads;
CREATE POLICY "leads_all" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "leads_anon" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);

-- lead_history
DROP POLICY IF EXISTS "lead_history_all" ON lead_history;
DROP POLICY IF EXISTS "lead_history_anon" ON lead_history;
CREATE POLICY "lead_history_all" ON lead_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lead_history_anon" ON lead_history FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_validation_order_month ON validation_order(month_year);
CREATE INDEX IF NOT EXISTS idx_validation_order_user ON validation_order(user_id);
CREATE INDEX IF NOT EXISTS idx_validator_stats_user ON validator_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_validations_validator ON pending_validations(validator_id);
CREATE INDEX IF NOT EXISTS idx_pending_validations_owner ON pending_validations(owner_id);
CREATE INDEX IF NOT EXISTS idx_obv_validaciones_obv ON obv_validaciones(obv_id);
CREATE INDEX IF NOT EXISTS idx_obv_validaciones_validator ON obv_validaciones(validator_id);
CREATE INDEX IF NOT EXISTS idx_role_rotation_requester ON role_rotation_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_role_rotation_target ON role_rotation_requests(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_rotation_status ON role_rotation_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_history_user ON role_history(user_id);
CREATE INDEX IF NOT EXISTS idx_role_history_project ON role_history(project_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_performance_user ON user_role_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_role_rankings_user ON role_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_role_rankings_role ON role_rankings(role_name);
CREATE INDEX IF NOT EXISTS idx_member_phase_progress_member ON member_phase_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_slack_webhooks_project ON slack_webhooks(project_id);
CREATE INDEX IF NOT EXISTS idx_forecast_ingresos_project ON forecast_ingresos(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_responsable ON leads(responsable_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_lead_history_lead ON lead_history(lead_id);

-- =============================================
-- TRIGGERS updated_at
-- =============================================

DROP TRIGGER IF EXISTS update_validator_stats_updated_at ON validator_stats;
CREATE TRIGGER update_validator_stats_updated_at BEFORE UPDATE ON validator_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_role_rotation_requests_updated_at ON role_rotation_requests;
CREATE TRIGGER update_role_rotation_requests_updated_at BEFORE UPDATE ON role_rotation_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_phase_progress_updated_at ON member_phase_progress;
CREATE TRIGGER update_member_phase_progress_updated_at BEFORE UPDATE ON member_phase_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
