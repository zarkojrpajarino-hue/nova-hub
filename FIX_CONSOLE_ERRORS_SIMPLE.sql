-- =============================================
-- ARREGLAR ERRORES DE CONSOLA - VERSION SIMPLE
-- =============================================

-- 1. Recrear members_public con security_invoker
DROP VIEW IF EXISTS members_public CASCADE;

CREATE VIEW members_public
WITH (security_invoker = true) AS
SELECT
  id,
  auth_id,
  email,
  nombre,
  avatar,
  color,
  especialization,
  created_at,
  updated_at
FROM members;

-- 2. Verificar si la tabla role_exploration_periods existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'role_exploration_periods'
  ) THEN
    -- Crear la tabla si no existe
    CREATE TABLE role_exploration_periods (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
      role TEXT NOT NULL,
      project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      start_date TIMESTAMPTZ DEFAULT NOW(),
      end_date TIMESTAMPTZ,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
      fit_score NUMERIC,
      tasks_completed INTEGER DEFAULT 0,
      tasks_on_time INTEGER DEFAULT 0,
      obvs_completed INTEGER DEFAULT 0,
      peer_feedback_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Habilitar RLS
    ALTER TABLE role_exploration_periods ENABLE ROW LEVEL SECURITY;
    
    -- Política: usuarios pueden ver sus propias exploraciones
    CREATE POLICY "Users can view own exploration periods"
      ON role_exploration_periods FOR SELECT
      USING (auth.uid() IN (SELECT auth_id FROM members WHERE id = member_id));
    
    -- Política: usuarios pueden insertar sus propias exploraciones
    CREATE POLICY "Users can insert own exploration periods"
      ON role_exploration_periods FOR INSERT
      WITH CHECK (auth.uid() IN (SELECT auth_id FROM members WHERE id = member_id));
  END IF;
END $$;

-- 3. Crear vista path_to_master_active
DROP VIEW IF EXISTS path_to_master_active;

CREATE VIEW path_to_master_active AS
SELECT
  rep.id,
  rep.member_id,
  rep.role,
  rep.project_id,
  rep.start_date,
  rep.end_date,
  rep.status,
  rep.fit_score,
  EXTRACT(EPOCH FROM (rep.end_date - rep.start_date)) / (24 * 60 * 60) AS duration_days,
  COALESCE(rep.tasks_completed, 0) AS tasks_completed,
  COALESCE(rep.tasks_on_time, 0) AS tasks_on_time,
  COALESCE(rep.obvs_completed, 0) AS obvs_validated,
  COALESCE(rep.peer_feedback_count, 0) AS peer_feedback_count
FROM role_exploration_periods rep
WHERE rep.status = 'active';

-- Verificar que las vistas funcionen
SELECT COUNT(*) as members_public_count FROM members_public;
SELECT COUNT(*) as path_to_master_active_count FROM path_to_master_active;
