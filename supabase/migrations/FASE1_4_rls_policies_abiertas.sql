-- =====================================================
-- FASE 1.4: RLS POLICIES ABIERTAS - ACCESO TOTAL
-- =====================================================
-- Fecha: 26 Enero 2026
-- Objetivo: Todos los usuarios de Nova ven TODOS los datos
-- Restricción: Solo owner puede editar lo suyo
-- =====================================================

-- IMPORTANTE: Eliminar views privadas anteriores y policies restrictivas
-- ----------------------------------------------------

-- Eliminar views con restricciones
DROP VIEW IF EXISTS members_public CASCADE;
DROP VIEW IF EXISTS obvs_public CASCADE;
DROP VIEW IF EXISTS obvs_financial CASCADE;

-- Eliminar función helper antigua
DROP FUNCTION IF EXISTS get_member_id(UUID) CASCADE;

-- =====================================================
-- PASO 1: ELIMINAR TODAS LAS POLICIES EXISTENTES
-- =====================================================

-- MEMBERS (anteriormente profiles)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON members;
DROP POLICY IF EXISTS "All authenticated users can view all profiles" ON members;
DROP POLICY IF EXISTS "Users can update own profile" ON members;
DROP POLICY IF EXISTS "Users can insert own profile" ON members;
DROP POLICY IF EXISTS "Members can view all members" ON members;
DROP POLICY IF EXISTS "Members can update own member" ON members;

-- USER_ROLES
DROP POLICY IF EXISTS "Roles viewable by authenticated" ON user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON user_roles;

-- PROJECTS
DROP POLICY IF EXISTS "Projects viewable by authenticated" ON projects;
DROP POLICY IF EXISTS "All authenticated can view all projects" ON projects;
DROP POLICY IF EXISTS "Authenticated can create projects" ON projects;
DROP POLICY IF EXISTS "All authenticated can create projects" ON projects;
DROP POLICY IF EXISTS "Project members can update" ON projects;
DROP POLICY IF EXISTS "Project members can update project" ON projects;
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Project members can update projects" ON projects;

-- PROJECT_MEMBERS
DROP POLICY IF EXISTS "Project members viewable" ON project_members;
DROP POLICY IF EXISTS "All authenticated can view project members" ON project_members;
DROP POLICY IF EXISTS "Authenticated can join projects" ON project_members;
DROP POLICY IF EXISTS "All authenticated can join projects" ON project_members;
DROP POLICY IF EXISTS "Members can leave" ON project_members;
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Users can join projects" ON project_members;

-- OBVs
DROP POLICY IF EXISTS "OBVs viewable by authenticated" ON obvs;
DROP POLICY IF EXISTS "All authenticated can view all obvs" ON obvs;
DROP POLICY IF EXISTS "Authenticated can create OBVs" ON obvs;
DROP POLICY IF EXISTS "All authenticated can create obvs" ON obvs;
DROP POLICY IF EXISTS "Owner can update OBV" ON obvs;
DROP POLICY IF EXISTS "Owner can update own obv" ON obvs;
DROP POLICY IF EXISTS "Owner can delete OBV" ON obvs;
DROP POLICY IF EXISTS "Owner can delete own obv if pending" ON obvs;
DROP POLICY IF EXISTS "Users can view obvs from their projects" ON obvs;
DROP POLICY IF EXISTS "Users can insert obvs" ON obvs;
DROP POLICY IF EXISTS "Users can update own obvs" ON obvs;
DROP POLICY IF EXISTS "Users can delete own pending obvs" ON obvs;

-- OBV_VALIDACIONES
DROP POLICY IF EXISTS "Validaciones viewable" ON obv_validaciones;
DROP POLICY IF EXISTS "All can view obv validations" ON obv_validaciones;
DROP POLICY IF EXISTS "Authenticated can validate" ON obv_validaciones;
DROP POLICY IF EXISTS "Validators can validate obvs" ON obv_validaciones;
DROP POLICY IF EXISTS "Users can view obv validations" ON obv_validaciones;
DROP POLICY IF EXISTS "Users can validate obvs" ON obv_validaciones;

-- OBV_PARTICIPANTES
DROP POLICY IF EXISTS "Participantes viewable" ON obv_participantes;
DROP POLICY IF EXISTS "OBV owner can add participants" ON obv_participantes;
DROP POLICY IF EXISTS "Users can view obv participants" ON obv_participantes;
DROP POLICY IF EXISTS "OBV owners can manage participants" ON obv_participantes;

-- KPIs
DROP POLICY IF EXISTS "KPIs viewable" ON kpis;
DROP POLICY IF EXISTS "All authenticated can view all kpis" ON kpis;
DROP POLICY IF EXISTS "Authenticated can create KPIs" ON kpis;
DROP POLICY IF EXISTS "All authenticated can create kpis" ON kpis;
DROP POLICY IF EXISTS "Owner can update KPI" ON kpis;
DROP POLICY IF EXISTS "Owner can update own kpi" ON kpis;
DROP POLICY IF EXISTS "Users can view kpis" ON kpis;
DROP POLICY IF EXISTS "Users can insert kpis" ON kpis;
DROP POLICY IF EXISTS "Users can update own kpis" ON kpis;

-- KPI_VALIDACIONES
DROP POLICY IF EXISTS "KPI validaciones viewable" ON kpi_validaciones;
DROP POLICY IF EXISTS "All can view kpi validations" ON kpi_validaciones;
DROP POLICY IF EXISTS "Authenticated can validate KPIs" ON kpi_validaciones;
DROP POLICY IF EXISTS "Validators can validate kpis" ON kpi_validaciones;
DROP POLICY IF EXISTS "Users can view kpi validations" ON kpi_validaciones;
DROP POLICY IF EXISTS "Users can validate kpis" ON kpi_validaciones;

-- TASKS
DROP POLICY IF EXISTS "Tasks viewable" ON tasks;
DROP POLICY IF EXISTS "All authenticated can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated can create tasks" ON tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Assignee can update tasks" ON tasks;
DROP POLICY IF EXISTS "Assignee or project member can update task" ON tasks;
DROP POLICY IF EXISTS "Assignee can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Assignee can delete own task" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Project members can create and manage tasks" ON tasks;

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Own notifications viewable" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- ACTIVITY_LOG
DROP POLICY IF EXISTS "Activity viewable by authenticated" ON activity_log;
DROP POLICY IF EXISTS "System can log activity" ON activity_log;
DROP POLICY IF EXISTS "Users can view activity log" ON activity_log;
DROP POLICY IF EXISTS "System can create activity log" ON activity_log;

-- OBJECTIVES
DROP POLICY IF EXISTS "Objectives viewable" ON objectives;
DROP POLICY IF EXISTS "Only admins can modify objectives" ON objectives;
DROP POLICY IF EXISTS "Users can view objectives" ON objectives;
DROP POLICY IF EXISTS "Admins can manage objectives" ON objectives;

-- OBJETIVOS_SEMANALES (si existe)
DROP POLICY IF EXISTS "Users can view objetivos semanales" ON objetivos_semanales;
DROP POLICY IF EXISTS "Users can manage own objetivos" ON objetivos_semanales;

-- VALIDATION_ORDER
DROP POLICY IF EXISTS "Users can view validation order" ON validation_order;

-- VALIDATOR_STATS
DROP POLICY IF EXISTS "Users can view validator stats" ON validator_stats;

-- PENDING_VALIDATIONS
DROP POLICY IF EXISTS "Users can view pending validations" ON pending_validations;

-- =====================================================
-- PASO 2: CREAR POLICIES ABIERTAS (TODOS VEN TODO)
-- =====================================================

-- ----------------------------------------------------
-- MEMBERS (tabla principal de usuarios)
-- ----------------------------------------------------
CREATE POLICY "nova_members_select_all"
  ON members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_members_insert_own"
  ON members FOR INSERT TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "nova_members_update_own"
  ON members FOR UPDATE TO authenticated
  USING (auth_id = auth.uid());

-- ----------------------------------------------------
-- USER_ROLES (roles de app: admin, tlt, member)
-- ----------------------------------------------------
CREATE POLICY "nova_user_roles_select_all"
  ON user_roles FOR SELECT TO authenticated
  USING (true);

-- Solo admins pueden gestionar roles
CREATE POLICY "nova_user_roles_admin_only"
  ON user_roles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM members WHERE auth_id = auth.uid())
        AND ur.role = 'admin'
    )
  );

-- ----------------------------------------------------
-- PROJECTS (proyectos de Nova)
-- ----------------------------------------------------
CREATE POLICY "nova_projects_select_all"
  ON projects FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_projects_insert_all"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo miembros del proyecto pueden editarlo
CREATE POLICY "nova_projects_update_members"
  ON projects FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = id
        AND pm.member_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    )
  );

-- ----------------------------------------------------
-- PROJECT_MEMBERS (asignaciones a proyectos)
-- ----------------------------------------------------
CREATE POLICY "nova_project_members_select_all"
  ON project_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_project_members_insert_all"
  ON project_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "nova_project_members_update_all"
  ON project_members FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "nova_project_members_delete_own"
  ON project_members FOR DELETE TO authenticated
  USING (member_id = (SELECT id FROM members WHERE auth_id = auth.uid()));

-- ----------------------------------------------------
-- OBVs (TODOS VEN TODAS, solo owner edita las suyas)
-- ----------------------------------------------------
CREATE POLICY "nova_obvs_select_all"
  ON obvs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_obvs_insert_own"
  ON obvs FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT id FROM members WHERE auth_id = auth.uid()));

CREATE POLICY "nova_obvs_update_own"
  ON obvs FOR UPDATE TO authenticated
  USING (owner_id = (SELECT id FROM members WHERE auth_id = auth.uid()));

CREATE POLICY "nova_obvs_delete_own_pending"
  ON obvs FOR DELETE TO authenticated
  USING (
    owner_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    AND status = 'pending'
  );

-- ----------------------------------------------------
-- OBV_VALIDACIONES (todos ven, cualquiera valida excepto owner)
-- ----------------------------------------------------
CREATE POLICY "nova_obv_validaciones_select_all"
  ON obv_validaciones FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_obv_validaciones_insert_validator"
  ON obv_validaciones FOR INSERT TO authenticated
  WITH CHECK (
    validator_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    AND validator_id != (SELECT owner_id FROM obvs WHERE id = obv_id)
  );

-- ----------------------------------------------------
-- OBV_PARTICIPANTES
-- ----------------------------------------------------
CREATE POLICY "nova_obv_participantes_select_all"
  ON obv_participantes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_obv_participantes_insert_owner"
  ON obv_participantes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM obvs
      WHERE id = obv_id
        AND owner_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    )
  );

-- ----------------------------------------------------
-- OBV_PIPELINE_HISTORY (historial de cambios pipeline)
-- ----------------------------------------------------
CREATE POLICY "nova_obv_pipeline_history_select_all"
  ON obv_pipeline_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_obv_pipeline_history_insert_all"
  ON obv_pipeline_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------
-- KPIs (LPs, BPs, CPs - todos ven, solo owner edita)
-- ----------------------------------------------------
CREATE POLICY "nova_kpis_select_all"
  ON kpis FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_kpis_insert_own"
  ON kpis FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT id FROM members WHERE auth_id = auth.uid()));

CREATE POLICY "nova_kpis_update_own"
  ON kpis FOR UPDATE TO authenticated
  USING (owner_id = (SELECT id FROM members WHERE auth_id = auth.uid()));

-- ----------------------------------------------------
-- KPI_VALIDACIONES
-- ----------------------------------------------------
CREATE POLICY "nova_kpi_validaciones_select_all"
  ON kpi_validaciones FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_kpi_validaciones_insert_validator"
  ON kpi_validaciones FOR INSERT TO authenticated
  WITH CHECK (
    validator_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    AND validator_id != (SELECT owner_id FROM kpis WHERE id = kpi_id)
  );

-- ----------------------------------------------------
-- TASKS (todos ven, solo miembros de proyecto crean/editan)
-- ----------------------------------------------------
CREATE POLICY "nova_tasks_select_all"
  ON tasks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_tasks_insert_project_members"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
        AND pm.member_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "nova_tasks_update_assignee_or_project_member"
  ON tasks FOR UPDATE TO authenticated
  USING (
    assignee_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
        AND pm.member_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "nova_tasks_delete_assignee"
  ON tasks FOR DELETE TO authenticated
  USING (assignee_id = (SELECT id FROM members WHERE auth_id = auth.uid()));

-- ----------------------------------------------------
-- COBROS_PARCIALES (todos ven, todos pueden registrar)
-- ----------------------------------------------------
CREATE POLICY "nova_cobros_parciales_select_all"
  ON cobros_parciales FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_cobros_parciales_insert_all"
  ON cobros_parciales FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "nova_cobros_parciales_update_creator"
  ON cobros_parciales FOR UPDATE TO authenticated
  USING (created_by = (SELECT id FROM members WHERE auth_id = auth.uid()));

CREATE POLICY "nova_cobros_parciales_delete_creator"
  ON cobros_parciales FOR DELETE TO authenticated
  USING (created_by = (SELECT id FROM members WHERE auth_id = auth.uid()));

-- ----------------------------------------------------
-- NOTIFICATIONS (solo propias)
-- ----------------------------------------------------
CREATE POLICY "nova_notifications_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM members WHERE auth_id = auth.uid()));

CREATE POLICY "nova_notifications_insert_system"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "nova_notifications_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = (SELECT id FROM members WHERE auth_id = auth.uid()));

-- ----------------------------------------------------
-- ACTIVITY_LOG (todos ven, sistema crea)
-- ----------------------------------------------------
CREATE POLICY "nova_activity_log_select_all"
  ON activity_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_activity_log_insert_system"
  ON activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------
-- OBJECTIVES (todos ven, solo admins editan)
-- ----------------------------------------------------
CREATE POLICY "nova_objectives_select_all"
  ON objectives FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "nova_objectives_admin_only"
  ON objectives FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM members WHERE auth_id = auth.uid())
        AND ur.role = 'admin'
    )
  );

-- ----------------------------------------------------
-- OBJETIVOS_SEMANALES (si existe)
-- ----------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'objetivos_semanales') THEN
    EXECUTE 'CREATE POLICY "nova_objetivos_semanales_select_all"
      ON objetivos_semanales FOR SELECT TO authenticated
      USING (true)';

    EXECUTE 'CREATE POLICY "nova_objetivos_semanales_insert_all"
      ON objetivos_semanales FOR INSERT TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL)';

    EXECUTE 'CREATE POLICY "nova_objetivos_semanales_update_own"
      ON objetivos_semanales FOR UPDATE TO authenticated
      USING (owner_id = (SELECT id FROM members WHERE auth_id = auth.uid()))';
  END IF;
END $$;

-- ----------------------------------------------------
-- VALIDATION_ORDER (todos ven)
-- ----------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'validation_order') THEN
    EXECUTE 'CREATE POLICY "nova_validation_order_select_all"
      ON validation_order FOR SELECT TO authenticated
      USING (true)';
  END IF;
END $$;

-- ----------------------------------------------------
-- VALIDATOR_STATS (todos ven)
-- ----------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'validator_stats') THEN
    EXECUTE 'CREATE POLICY "nova_validator_stats_select_all"
      ON validator_stats FOR SELECT TO authenticated
      USING (true)';
  END IF;
END $$;

-- ----------------------------------------------------
-- PENDING_VALIDATIONS (todos ven)
-- ----------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_validations') THEN
    EXECUTE 'CREATE POLICY "nova_pending_validations_select_all"
      ON pending_validations FOR SELECT TO authenticated
      USING (true)';
  END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecuta estas queries para verificar las policies:

-- 1. Ver todas las policies activas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- 2. Ver policies de una tabla específica:
-- SELECT policyname, cmd, qual::text
-- FROM pg_policies
-- WHERE tablename = 'obvs';

-- 3. Contar policies por tabla:
-- SELECT tablename, COUNT(*) as num_policies
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY tablename
-- ORDER BY tablename;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. TODOS los usuarios autenticados ven TODOS los datos (SELECT sin restricción)
-- 2. Solo el owner puede INSERT/UPDATE/DELETE lo suyo
-- 3. Notificaciones: cada usuario solo ve las suyas
-- 4. Roles de admin: pueden gestionar roles y objectives
-- 5. Tasks: solo miembros del proyecto pueden crear/editar
-- 6. Validaciones: cualquiera puede validar excepto el owner del item
-- 7. Projects: solo miembros pueden editar el proyecto
--
-- TODAS LAS POLICIES ANTERIORES RESTRICTIVAS HAN SIDO ELIMINADAS
-- TODOS LOS VIEWS PRIVADOS (members_public, obvs_public) HAN SIDO ELIMINADOS
