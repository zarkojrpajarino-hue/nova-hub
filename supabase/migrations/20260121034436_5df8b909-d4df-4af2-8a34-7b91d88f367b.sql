-- =============================================
-- NOVA PLATFORM - SCHEMA CORREGIDO
-- =============================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE project_phase AS ENUM (
  'idea', 
  'problema_validado', 
  'solucion_validada', 
  'mvp', 
  'traccion', 
  'crecimiento'
);

CREATE TYPE project_type AS ENUM ('validacion', 'operacion');
CREATE TYPE obv_type AS ENUM ('exploracion', 'validacion', 'venta');
CREATE TYPE lead_status AS ENUM (
  'frio', 
  'tibio', 
  'hot', 
  'propuesta', 
  'negociacion', 
  'cerrado_ganado', 
  'cerrado_perdido'
);
CREATE TYPE task_status AS ENUM ('todo', 'doing', 'done', 'blocked');
CREATE TYPE kpi_status AS ENUM ('pending', 'validated', 'rejected');
CREATE TYPE specialization_role AS ENUM (
  'sales',
  'finance', 
  'ai_tech',
  'marketing',
  'operations',
  'strategy'
);
CREATE TYPE app_role AS ENUM ('admin', 'tlt', 'member');

-- =============================================
-- PROFILES (linked to auth.users)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  avatar TEXT,
  color TEXT DEFAULT '#6366F1',
  especialization specialization_role,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER ROLES (separate table for security)
-- =============================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- =============================================
-- OBJECTIVES (configurable goals)
-- =============================================
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  target_value DECIMAL(12,2) NOT NULL,
  unit TEXT DEFAULT 'units',
  period TEXT DEFAULT 'semester', -- 'month', 'semester', 'year'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default objectives
INSERT INTO objectives (name, target_value, unit, period) VALUES
  ('obvs', 150, 'OBVs', 'semester'),
  ('lps', 18, 'LPs', 'semester'),
  ('bps', 66, 'BPs', 'semester'),
  ('cps', 40, 'CPs', 'semester'),
  ('facturacion', 15000, '€', 'semester'),
  ('margen', 7500, '€', 'semester');

-- =============================================
-- PROJECTS
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fase project_phase DEFAULT 'idea',
  tipo project_type DEFAULT 'validacion',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366F1',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROJECT MEMBERS with roles
-- =============================================
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role specialization_role NOT NULL,
  is_lead BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, member_id)
);

-- =============================================
-- LEADS / CRM
-- =============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  empresa TEXT,
  email TEXT,
  telefono TEXT,
  status lead_status DEFAULT 'frio',
  valor_potencial DECIMAL(12,2),
  notas TEXT,
  proxima_accion TEXT,
  proxima_accion_fecha DATE,
  responsable_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  old_status lead_status,
  new_status lead_status,
  changed_by UUID REFERENCES profiles(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- OBVs
-- =============================================
CREATE TABLE obvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  lead_id UUID REFERENCES leads(id),
  
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  evidence_url TEXT,
  
  tipo obv_type NOT NULL,
  status kpi_status DEFAULT 'pending',
  
  -- Si es venta
  es_venta BOOLEAN DEFAULT FALSE,
  producto TEXT,
  cantidad INT,
  precio_unitario DECIMAL(12,2),
  facturacion DECIMAL(12,2),
  costes DECIMAL(12,2),
  margen DECIMAL(12,2),
  cobrado BOOLEAN DEFAULT FALSE,
  cobrado_parcial DECIMAL(12,2),
  
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE obv_participantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) NOT NULL,
  porcentaje DECIMAL(5,2),
  UNIQUE(obv_id, member_id)
);

CREATE TABLE obv_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES profiles(id) NOT NULL,
  approved BOOLEAN,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(obv_id, validator_id)
);

-- =============================================
-- OTHER KPIs (LPs, BPs, CPs)
-- =============================================
CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lp', 'bp', 'cp')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  evidence_url TEXT,
  cp_points INT DEFAULT 1,
  status kpi_status DEFAULT 'pending',
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kpi_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES profiles(id) NOT NULL,
  approved BOOLEAN,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kpi_id, validator_id)
);

-- =============================================
-- TASKS
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  status task_status DEFAULT 'todo',
  prioridad INT DEFAULT 2,
  fecha_limite DATE,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  tipo TEXT,
  titulo TEXT,
  mensaje TEXT,
  leida BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACTIVITY LOG
-- =============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get profile id from auth id
CREATE OR REPLACE FUNCTION public.get_profile_id(_auth_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE auth_id = _auth_id LIMIT 1
$$;

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE obvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES: Everyone can see, only own can update
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = auth_id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_id);

-- USER ROLES: Only admins can manage, all authenticated can view
CREATE POLICY "Roles viewable by authenticated" ON user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can insert roles" ON user_roles
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(public.get_profile_id(auth.uid()), 'admin'));
CREATE POLICY "Only admins can update roles" ON user_roles
  FOR UPDATE TO authenticated 
  USING (public.has_role(public.get_profile_id(auth.uid()), 'admin'));
CREATE POLICY "Only admins can delete roles" ON user_roles
  FOR DELETE TO authenticated 
  USING (public.has_role(public.get_profile_id(auth.uid()), 'admin'));

-- PROJECTS: All authenticated can view and create
CREATE POLICY "Projects viewable by authenticated" ON projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create projects" ON projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Project members can update" ON projects
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = id 
      AND pm.member_id = public.get_profile_id(auth.uid())
    )
  );

-- PROJECT MEMBERS
CREATE POLICY "Project members viewable" ON project_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can join projects" ON project_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Members can leave" ON project_members
  FOR DELETE TO authenticated 
  USING (member_id = public.get_profile_id(auth.uid()));

-- LEADS
CREATE POLICY "Leads viewable by authenticated" ON leads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create leads" ON leads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Responsable can update leads" ON leads
  FOR UPDATE TO authenticated USING (
    responsable_id = public.get_profile_id(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = leads.project_id 
      AND pm.member_id = public.get_profile_id(auth.uid())
    )
  );
CREATE POLICY "Project members can delete leads" ON leads
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = leads.project_id 
      AND pm.member_id = public.get_profile_id(auth.uid())
    )
  );

-- LEAD HISTORY
CREATE POLICY "Lead history viewable" ON lead_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert history" ON lead_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- OBVs
CREATE POLICY "OBVs viewable by authenticated" ON obvs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create OBVs" ON obvs
  FOR INSERT TO authenticated 
  WITH CHECK (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owner can update OBV" ON obvs
  FOR UPDATE TO authenticated 
  USING (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owner can delete OBV" ON obvs
  FOR DELETE TO authenticated 
  USING (owner_id = public.get_profile_id(auth.uid()) AND status = 'pending');

-- OBV VALIDACIONES
CREATE POLICY "Validaciones viewable" ON obv_validaciones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can validate" ON obv_validaciones
  FOR INSERT TO authenticated 
  WITH CHECK (
    validator_id = public.get_profile_id(auth.uid()) AND
    validator_id != (SELECT owner_id FROM obvs WHERE id = obv_id)
  );

-- OBV PARTICIPANTES
CREATE POLICY "Participantes viewable" ON obv_participantes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "OBV owner can add participants" ON obv_participantes
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM obvs WHERE id = obv_id AND owner_id = public.get_profile_id(auth.uid()))
  );

-- KPIs
CREATE POLICY "KPIs viewable" ON kpis
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create KPIs" ON kpis
  FOR INSERT TO authenticated 
  WITH CHECK (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owner can update KPI" ON kpis
  FOR UPDATE TO authenticated 
  USING (owner_id = public.get_profile_id(auth.uid()));

-- KPI VALIDACIONES
CREATE POLICY "KPI validaciones viewable" ON kpi_validaciones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can validate KPIs" ON kpi_validaciones
  FOR INSERT TO authenticated 
  WITH CHECK (
    validator_id = public.get_profile_id(auth.uid()) AND
    validator_id != (SELECT owner_id FROM kpis WHERE id = kpi_id)
  );

-- TASKS
CREATE POLICY "Tasks viewable" ON tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Assignee can update tasks" ON tasks
  FOR UPDATE TO authenticated 
  USING (assignee_id = public.get_profile_id(auth.uid()) OR assignee_id IS NULL);
CREATE POLICY "Assignee can delete tasks" ON tasks
  FOR DELETE TO authenticated 
  USING (assignee_id = public.get_profile_id(auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Own notifications viewable" ON notifications
  FOR SELECT TO authenticated 
  USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated 
  USING (user_id = public.get_profile_id(auth.uid()));

-- ACTIVITY LOG
CREATE POLICY "Activity viewable by authenticated" ON activity_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can log activity" ON activity_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- OBJECTIVES
CREATE POLICY "Objectives viewable" ON objectives
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify objectives" ON objectives
  FOR ALL TO authenticated 
  USING (public.has_role(public.get_profile_id(auth.uid()), 'admin'));

-- =============================================
-- TRIGGERS FOR VALIDATION
-- =============================================

-- Auto-validate OBV when 2 approvals
CREATE OR REPLACE FUNCTION check_obv_validations()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM obv_validaciones 
    WHERE obv_id = NEW.obv_id AND approved = TRUE
  ) >= 2 THEN
    UPDATE obvs SET status = 'validated', validated_at = NOW() 
    WHERE id = NEW.obv_id;
  ELSIF (
    SELECT COUNT(*) FROM obv_validaciones 
    WHERE obv_id = NEW.obv_id AND approved = FALSE
  ) >= 2 THEN
    UPDATE obvs SET status = 'rejected' WHERE id = NEW.obv_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_obv_validations
AFTER INSERT ON obv_validaciones
FOR EACH ROW EXECUTE FUNCTION check_obv_validations();

-- Auto-validate KPI when 2 approvals
CREATE OR REPLACE FUNCTION check_kpi_validations()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM kpi_validaciones 
    WHERE kpi_id = NEW.kpi_id AND approved = TRUE
  ) >= 2 THEN
    UPDATE kpis SET status = 'validated', validated_at = NOW() 
    WHERE id = NEW.kpi_id;
  ELSIF (
    SELECT COUNT(*) FROM kpi_validaciones 
    WHERE kpi_id = NEW.kpi_id AND approved = FALSE
  ) >= 2 THEN
    UPDATE kpis SET status = 'rejected' WHERE id = NEW.kpi_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_kpi_validations
AFTER INSERT ON kpi_validaciones
FOR EACH ROW EXECUTE FUNCTION check_kpi_validations();

-- =============================================
-- VIEWS
-- =============================================

-- Member stats with calculated KPIs
CREATE OR REPLACE VIEW member_stats AS
SELECT 
  p.id,
  p.nombre,
  p.color,
  p.avatar,
  p.email,
  COALESCE((SELECT COUNT(*) FROM obvs WHERE owner_id = p.id AND status = 'validated'), 0) as obvs,
  COALESCE((SELECT COUNT(*) FROM kpis WHERE owner_id = p.id AND type = 'lp' AND status = 'validated'), 0) as lps,
  COALESCE((SELECT COUNT(*) FROM kpis WHERE owner_id = p.id AND type = 'bp' AND status = 'validated'), 0) as bps,
  COALESCE((SELECT SUM(cp_points) FROM kpis WHERE owner_id = p.id AND type = 'cp' AND status = 'validated'), 0) as cps,
  COALESCE((SELECT SUM(facturacion) FROM obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as facturacion,
  COALESCE((SELECT SUM(margen) FROM obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as margen
FROM profiles p;

-- Project stats
CREATE OR REPLACE VIEW project_stats AS
SELECT 
  p.id,
  p.nombre,
  p.fase,
  p.tipo,
  p.icon,
  p.color,
  p.onboarding_completed,
  COUNT(DISTINCT pm.member_id) as num_members,
  COUNT(DISTINCT o.id) as total_obvs,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'cerrado_ganado') as leads_ganados,
  COALESCE(SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0) as facturacion,
  COALESCE(SUM(o.margen) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0) as margen
FROM projects p
LEFT JOIN project_members pm ON pm.project_id = p.id
LEFT JOIN obvs o ON o.project_id = p.id
LEFT JOIN leads l ON l.project_id = p.id
GROUP BY p.id;

-- Pipeline global
CREATE OR REPLACE VIEW pipeline_global AS
SELECT 
  l.*,
  p.nombre as proyecto_nombre,
  p.color as proyecto_color,
  pr.nombre as responsable_nombre
FROM leads l
JOIN projects p ON l.project_id = p.id
LEFT JOIN profiles pr ON l.responsable_id = pr.id;

-- =============================================
-- FUNCTION TO CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'member' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    (SELECT id FROM public.profiles WHERE auth_id = NEW.id),
    'member'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();