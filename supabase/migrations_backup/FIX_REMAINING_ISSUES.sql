-- =============================================
-- ARREGLAR PROBLEMAS RESTANTES
-- =============================================

-- 1. Crear vista obvs_public (obvs sin datos sensibles)
CREATE OR REPLACE VIEW obvs_public AS
SELECT
  id,
  titulo,
  descripcion,
  owner_id,
  project_id,
  status,
  deadline,
  validated_at,
  validated_by,
  metadata,
  created_at,
  updated_at
FROM obvs;

-- 2. Crear tabla tasks (tareas/tasks del sistema)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  fecha_limite DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear vista path_to_master_active (miembros activos en path to master)
CREATE OR REPLACE VIEW path_to_master_active AS
SELECT
  m.id AS member_id,
  m.nombre,
  m.email,
  m.avatar,
  m.color,
  mpp.ar_role,
  mpp.secondary_role,
  mpp.progress_percentage,
  mpp.phase_name
FROM members m
LEFT JOIN member_phase_progress mpp ON mpp.member_id = m.id
WHERE mpp.completed = false OR mpp.completed IS NULL;

-- 4. Habilitar RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para tasks
DROP POLICY IF EXISTS "tasks_all" ON tasks;
DROP POLICY IF EXISTS "tasks_anon" ON tasks;
CREATE POLICY "tasks_all" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tasks_anon" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- 7. Trigger updated_at para tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
