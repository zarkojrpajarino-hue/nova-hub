-- =============================================
-- FIX MISSING TABLES AND COLUMNS
-- Agrega todas las tablas y columnas que faltan
-- para que la app funcione sin errores
-- =============================================

-- 1. Agregar deleted_at a projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Agregar snoozed_until a notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ DEFAULT NULL;

-- 3. Crear tabla objectives (si no existe)
CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla member_stats (si no existe)
CREATE TABLE IF NOT EXISTS member_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  total_obvs INTEGER DEFAULT 0,
  validated_obvs INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  converted_leads INTEGER DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear tabla activity_log (si no existe)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Crear vista members_public (para compatibilidad)
CREATE OR REPLACE VIEW members_public AS
SELECT
  id,
  email,
  nombre,
  color,
  avatar,
  created_at
FROM members;

-- 7. Habilitar RLS en las nuevas tablas
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas permisivas para las nuevas tablas
CREATE POLICY "objectives_all" ON objectives FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "objectives_anon" ON objectives FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "member_stats_all" ON member_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "member_stats_anon" ON member_stats FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "activity_log_all" ON activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "activity_log_anon" ON activity_log FOR ALL TO anon USING (true) WITH CHECK (true);

-- 9. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_objectives_member ON objectives(member_id);
CREATE INDEX IF NOT EXISTS idx_objectives_project ON objectives(project_id);
CREATE INDEX IF NOT EXISTS idx_objectives_status ON objectives(status);

CREATE INDEX IF NOT EXISTS idx_member_stats_member ON member_stats(member_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_member ON activity_log(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- 10. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Crear triggers para updated_at
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON objectives
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_stats_updated_at BEFORE UPDATE ON member_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMPLETADO
-- =============================================
