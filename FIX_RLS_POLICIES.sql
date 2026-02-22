-- =============================================
-- ARREGLAR POLÍTICAS RLS PARA EVITAR ERRORES 400/404/406
-- =============================================

-- 1. Políticas para obvs_public (vista)
DROP POLICY IF EXISTS "Users can view all obvs" ON obvs;
CREATE POLICY "Users can view all obvs"
  ON obvs FOR SELECT
  TO authenticated
  USING (true);

-- 2. Políticas para pending_validations (vista)
DROP POLICY IF EXISTS "Users can view pending validations" ON obv_validaciones;
CREATE POLICY "Users can view pending validations"
  ON obv_validaciones FOR SELECT
  TO authenticated
  USING (true);

-- 3. Políticas para tasks
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
CREATE POLICY "Users can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true);

-- 4. Políticas para kpis
DROP POLICY IF EXISTS "Users can view all kpis" ON kpis;
CREATE POLICY "Users can view all kpis"
  ON kpis FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert kpis" ON kpis;
CREATE POLICY "Users can insert kpis"
  ON kpis FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update kpis" ON kpis;
CREATE POLICY "Users can update kpis"
  ON kpis FOR UPDATE
  TO authenticated
  USING (true);

-- 5. Políticas para members
DROP POLICY IF EXISTS "Users can view all members" ON members;
CREATE POLICY "Users can view all members"
  ON members FOR SELECT
  TO authenticated
  USING (true);

-- 6. Políticas para projects
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
CREATE POLICY "Users can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

-- 7. Políticas para leads
DROP POLICY IF EXISTS "Users can view all leads" ON leads;
CREATE POLICY "Users can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert leads" ON leads;
CREATE POLICY "Users can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update leads" ON leads;
CREATE POLICY "Users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true);

-- 8. Verificar que RLS está habilitado
ALTER TABLE obvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_validaciones ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT 'Políticas RLS aplicadas correctamente' as status;
