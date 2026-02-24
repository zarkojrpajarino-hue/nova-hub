-- =============================================
-- PARTE 1: CREAR TABLAS PRINCIPALES
-- =============================================

-- Tabla: kpis
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

-- Tabla: kpi_validaciones
CREATE TABLE IF NOT EXISTS kpi_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  approved BOOLEAN NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: pending_payments
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

-- Tabla: master_applications
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

-- Tabla: master_votes
CREATE TABLE IF NOT EXISTS master_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES master_applications(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  vote BOOLEAN NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, voter_id)
);

-- Tabla: team_masters
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

-- Tabla: user_insights
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

-- Tabla: user_playbooks
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

-- Tabla: financial_metrics
CREATE TABLE IF NOT EXISTS financial_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  facturacion NUMERIC DEFAULT 0,
  margen NUMERIC DEFAULT 0,
  obvs_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month)
);
