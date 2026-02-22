-- =====================================================
-- NOVA HUB - SETUP COMPLETO PARA NUEVA DB EN ASIA
-- =====================================================
-- Proyecto: Nova Hub
-- Región: Southeast Asia (Singapore)
-- Fecha: 2026-01-29
-- =====================================================

-- PASO 1: EXTENSIONES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- PASO 2: ENUMS
-- =====================================================

CREATE TYPE specialization_role AS ENUM (
  'sales',
  'finance',
  'ai_tech',
  'marketing',
  'operations',
  'strategy',
  'customer'
);

CREATE TYPE project_phase AS ENUM (
  'ideacion',
  'validacion',
  'desarrollo',
  'lanzamiento',
  'escalado',
  'finalizado'
);

CREATE TYPE task_status AS ENUM (
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
  'blocked'
);

CREATE TYPE obv_status AS ENUM (
  'draft',
  'pending',
  'validated',
  'rejected'
);

-- =====================================================
-- PASO 3: TABLAS PRINCIPALES
-- =====================================================

-- Tabla: members (usuarios del sistema)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  avatar TEXT,
  color TEXT DEFAULT '#6366F1',
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  especialization specialization_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para auth_id (CRÍTICO para performance)
CREATE INDEX idx_members_auth_id ON public.members(auth_id);
CREATE INDEX idx_members_email ON public.members(email);

-- Tabla: projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fase project_phase DEFAULT 'ideacion',
  owner_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_fase ON public.projects(fase);

-- Tabla: project_members (relación muchos a muchos con roles)
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role specialization_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, member_id)
);

CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_member_id ON public.project_members(member_id);
CREATE INDEX idx_project_members_role ON public.project_members(role);

-- Tabla: tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  status task_status DEFAULT 'todo',
  assignee_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 5),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Tabla: obvs (One Big Vision - objetivos/validaciones)
CREATE TABLE IF NOT EXISTS public.obvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  owner_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status obv_status DEFAULT 'draft',
  deadline TIMESTAMP WITH TIME ZONE,
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_obvs_owner_id ON public.obvs(owner_id);
CREATE INDEX idx_obvs_project_id ON public.obvs(project_id);
CREATE INDEX idx_obvs_status ON public.obvs(status);

-- Tabla: user_insights (insights generados por IA)
CREATE TABLE IF NOT EXISTS public.user_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_insights_user_id ON public.user_insights(user_id);
CREATE INDEX idx_user_insights_tipo ON public.user_insights(tipo);
CREATE INDEX idx_user_insights_created_at ON public.user_insights(created_at DESC);

-- Tabla: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- =====================================================
-- PASO 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activar RLS en todas las tablas
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para members
CREATE POLICY members_select_all
  ON public.members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY members_insert_own
  ON public.members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY members_update_own
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Políticas para projects
CREATE POLICY projects_select_all
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY projects_insert_authenticated
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY projects_update_owner
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()))
  WITH CHECK (owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

-- Políticas para project_members
CREATE POLICY project_members_select_all
  ON public.project_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY project_members_insert_project_owner
  ON public.project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

-- Políticas para tasks
CREATE POLICY tasks_select_all
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY tasks_insert_project_member
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = tasks.project_id
        AND pm.member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY tasks_update_all
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para obvs
CREATE POLICY obvs_select_all
  ON public.obvs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY obvs_insert_own
  ON public.obvs
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

CREATE POLICY obvs_update_own
  ON public.obvs
  FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()))
  WITH CHECK (owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

-- Políticas para user_insights
CREATE POLICY user_insights_select_own
  ON public.user_insights
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

CREATE POLICY user_insights_insert_all
  ON public.user_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para notifications
CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

-- =====================================================
-- PASO 5: TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obvs_updated_at
  BEFORE UPDATE ON public.obvs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PASO 6: GRANTS (Permisos)
-- =====================================================

-- Dar permisos a roles authenticated y anon
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.obvs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

GRANT SELECT ON public.members TO anon;
GRANT SELECT ON public.projects TO anon;

-- =====================================================
-- PASO 7: CREAR TU USUARIO INICIAL
-- =====================================================

-- IMPORTANTE: Reemplaza 'TU_EMAIL' y 'TU_AUTH_ID' con tus datos reales
-- El auth_id lo obtienes después de hacer login por primera vez

-- Ejecuta esto DESPUÉS de hacer tu primer login en la app:
-- INSERT INTO public.members (auth_id, email, nombre, color, especialization)
-- VALUES (
--   'TU_AUTH_ID_AQUI',  -- Se obtiene del auth.users después del primer login
--   'zarkojr.nova@gmail.com',
--   'Zarko',
--   '#F472B6',
--   'ai_tech'
-- );

-- =====================================================
-- PASO 8: VERIFICACIÓN
-- =====================================================

-- Ver todas las tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Ver políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- ¡SETUP COMPLETADO!
-- =====================================================
-- Siguiente paso: Actualizar las credenciales en la app
-- =====================================================
