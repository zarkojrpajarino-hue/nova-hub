-- ============================================================
-- NOVA HUB - RLS SECURITY FIX
-- Fecha: 2026-02-23
-- 
-- Problemas que resuelve:
-- 1. Políticas anon que dan acceso SIN autenticación
-- 2. Políticas DELETE con USING(true) que permiten borrar datos ajenos
-- 3. Políticas duplicadas que anulan las correctas
-- ============================================================

-- ============================================================
-- FASE 1: ELIMINAR TODAS LAS POLÍTICAS ANON (acceso sin auth)
-- Estas son el problema más crítico - cualquier persona sin cuenta
-- puede leer, insertar, actualizar y borrar datos.
-- ============================================================

DROP POLICY IF EXISTS "badge_definitions_anon_all" ON badge_definitions;
DROP POLICY IF EXISTS "feedback_summary_anon_all" ON feedback_summary;
DROP POLICY IF EXISTS "forecast_ingresos_anon" ON forecast_ingresos;
DROP POLICY IF EXISTS "lead_history_anon" ON lead_history;
DROP POLICY IF EXISTS "leads_anon" ON leads;
DROP POLICY IF EXISTS "member_badges_anon_all" ON member_badges;
DROP POLICY IF EXISTS "member_phase_progress_anon" ON member_phase_progress;
DROP POLICY IF EXISTS "notifications_anon_all" ON notifications;
DROP POLICY IF EXISTS "objectives_anon" ON objectives;
DROP POLICY IF EXISTS "obv_validaciones_anon" ON obv_validaciones;
DROP POLICY IF EXISTS "obvs_anon_all" ON obvs;
DROP POLICY IF EXISTS "project_members_anon_all" ON project_members;
DROP POLICY IF EXISTS "projects_anon_all" ON projects;
DROP POLICY IF EXISTS "rate_limits_anon_all" ON rate_limits;
DROP POLICY IF EXISTS "role_competition_results_anon" ON role_competition_results;
DROP POLICY IF EXISTS "role_competition_results_anon_all" ON role_competition_results;
DROP POLICY IF EXISTS "role_exploration_periods_anon_all" ON role_exploration_periods;
DROP POLICY IF EXISTS "role_history_anon" ON role_history;
DROP POLICY IF EXISTS "role_performance_metrics_anon_all" ON role_performance_metrics;
DROP POLICY IF EXISTS "role_preferences_anon_all" ON role_preferences;
DROP POLICY IF EXISTS "role_rankings_anon" ON role_rankings;
DROP POLICY IF EXISTS "role_rotation_history_anon_all" ON role_rotation_history;
DROP POLICY IF EXISTS "role_rotation_requests_anon" ON role_rotation_requests;
DROP POLICY IF EXISTS "slack_webhooks_anon" ON slack_webhooks;
DROP POLICY IF EXISTS "tasks_anon" ON tasks;
DROP POLICY IF EXISTS "tasks_anon_all" ON tasks;
DROP POLICY IF EXISTS "user_insights_anon_all" ON user_insights;
DROP POLICY IF EXISTS "user_role_performance_anon" ON user_role_performance;
DROP POLICY IF EXISTS "user_roles_anon" ON user_roles;
DROP POLICY IF EXISTS "validation_order_anon" ON validation_order;
DROP POLICY IF EXISTS "validator_stats_anon" ON validator_stats;
DROP POLICY IF EXISTS "kpis_anon" ON kpis;
DROP POLICY IF EXISTS "kpi_validaciones_anon" ON kpi_validaciones;
DROP POLICY IF EXISTS "team_masters_anon" ON team_masters;
DROP POLICY IF EXISTS "master_applications_anon" ON master_applications;
DROP POLICY IF EXISTS "master_votes_anon" ON master_votes;
DROP POLICY IF EXISTS "pending_payments_anon" ON pending_payments;
DROP POLICY IF EXISTS "pending_validations_anon" ON pending_validations;
DROP POLICY IF EXISTS "user_playbooks_anon" ON user_playbooks;

-- ============================================================
-- FASE 2: ELIMINAR POLÍTICAS DELETE CON USING(true)
-- Cualquier usuario autenticado puede borrar registros ajenos
-- ============================================================

-- projects
DROP POLICY IF EXISTS "Authenticated users can delete" ON projects;

-- project_members
DROP POLICY IF EXISTS "Authenticated users can delete" ON project_members;

-- obvs
DROP POLICY IF EXISTS "Authenticated users can delete" ON obvs;

-- tasks
DROP POLICY IF EXISTS "Authenticated users can delete" ON tasks;

-- leads
DROP POLICY IF EXISTS "Authenticated users can delete" ON leads;

-- lead_history
DROP POLICY IF EXISTS "Authenticated users can delete" ON lead_history;

-- kpis
DROP POLICY IF EXISTS "Authenticated users can delete" ON kpis;

-- kpi_validaciones
DROP POLICY IF EXISTS "Authenticated users can delete" ON kpi_validaciones;

-- obv_validaciones
DROP POLICY IF EXISTS "Authenticated users can delete" ON obv_validaciones;

-- notifications
DROP POLICY IF EXISTS "Authenticated users can delete" ON notifications;

-- user_insights
DROP POLICY IF EXISTS "Authenticated users can delete" ON user_insights;

-- user_roles
DROP POLICY IF EXISTS "Authenticated users can delete" ON user_roles;

-- master_applications
DROP POLICY IF EXISTS "Authenticated users can delete" ON master_applications;

-- master_votes
DROP POLICY IF EXISTS "Authenticated users can delete" ON master_votes;

-- team_masters
DROP POLICY IF EXISTS "Authenticated users can delete" ON team_masters;

-- member_badges
DROP POLICY IF EXISTS "Authenticated users can delete" ON member_badges;

-- badge_definitions
DROP POLICY IF EXISTS "Authenticated users can delete" ON badge_definitions;

-- validation_order
DROP POLICY IF EXISTS "Authenticated users can delete" ON validation_order;

-- validator_stats
DROP POLICY IF EXISTS "Authenticated users can delete" ON validator_stats;

-- role_history
DROP POLICY IF EXISTS "Authenticated users can delete" ON role_history;

-- role_rankings
DROP POLICY IF EXISTS "Authenticated users can delete" ON role_rankings;

-- role_rotation_history
DROP POLICY IF EXISTS "Authenticated users can delete" ON role_rotation_history;

-- role_rotation_requests
DROP POLICY IF EXISTS "Authenticated users can delete" ON role_rotation_requests;

-- role_competition_results
DROP POLICY IF EXISTS "Authenticated users can delete" ON role_competition_results;

-- role_performance_metrics
DROP POLICY IF EXISTS "Authenticated users can delete" ON role_performance_metrics;

-- role_preferences
DROP POLICY IF EXISTS "Authenticated users can delete" ON role_preferences;

-- role_exploration_periods
DROP POLICY IF EXISTS "Authenticated users can delete" ON role_exploration_periods;

-- member_phase_progress
DROP POLICY IF EXISTS "Authenticated users can delete" ON member_phase_progress;

-- pending_payments
DROP POLICY IF EXISTS "Authenticated users can delete" ON pending_payments;

-- pending_validations
DROP POLICY IF EXISTS "Authenticated users can delete" ON pending_validations;

-- user_role_performance
DROP POLICY IF EXISTS "Authenticated users can delete" ON user_role_performance;

-- user_playbooks
DROP POLICY IF EXISTS "Authenticated users can delete" ON user_playbooks;

-- slack_webhooks
DROP POLICY IF EXISTS "Authenticated users can delete" ON slack_webhooks;

-- forecast_ingresos
DROP POLICY IF EXISTS "Authenticated users can delete" ON forecast_ingresos;

-- feedback_summary
DROP POLICY IF EXISTS "Authenticated users can delete" ON feedback_summary;

-- objectives
DROP POLICY IF EXISTS "Authenticated users can delete" ON objectives;

-- ============================================================
-- FASE 3: ELIMINAR POLÍTICAS SELECT DUPLICADAS que anulan las correctas
-- ============================================================

-- projects: DROP las que dan acceso total, mantener las correctas
DROP POLICY IF EXISTS "projects_all_access" ON projects;
DROP POLICY IF EXISTS "projects_authenticated_all" ON projects;
DROP POLICY IF EXISTS "projects_select_public" ON projects;
DROP POLICY IF EXISTS "Authenticated users can view" ON projects;
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
-- MANTENER: "Users can read own projects" (tiene USING correcto con project_members join)
-- MANTENER: "Users can create projects"
-- MANTENER: "Owners can update own projects" y "projects_update_owner"

-- project_members: DROP broad, mantener project-scoped
DROP POLICY IF EXISTS "project_members_all_access" ON project_members;
DROP POLICY IF EXISTS "project_members_authenticated_all" ON project_members;
DROP POLICY IF EXISTS "project_members_select_all" ON project_members;
DROP POLICY IF EXISTS "Authenticated users can view" ON project_members;
DROP POLICY IF EXISTS "Authenticated users can update" ON project_members;

-- obvs: DROP broad, mantener scoped
DROP POLICY IF EXISTS "obvs_all_access" ON obvs;
DROP POLICY IF EXISTS "obvs_authenticated_all" ON obvs;
DROP POLICY IF EXISTS "obvs_select_all" ON obvs;
DROP POLICY IF EXISTS "Authenticated users can view" ON obvs;
DROP POLICY IF EXISTS "Authenticated users can update" ON obvs;
DROP POLICY IF EXISTS "Users can view all obvs" ON obvs;

-- tasks: DROP broad, mantener scoped
DROP POLICY IF EXISTS "tasks_all" ON tasks;
DROP POLICY IF EXISTS "tasks_all_access" ON tasks;
DROP POLICY IF EXISTS "tasks_authenticated_all" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can view" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update" ON tasks;
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_update_all" ON tasks;
-- MANTENER: "tasks_select_project_tasks" (tiene USING correcto)

-- leads: DROP broad, mantener scoped
DROP POLICY IF EXISTS "leads_all" ON leads;
DROP POLICY IF EXISTS "Authenticated users can view" ON leads;
DROP POLICY IF EXISTS "Authenticated users can update" ON leads;
DROP POLICY IF EXISTS "Users can view all leads" ON leads;

-- kpis: Las políticas "USING (true)" son intencionales para el leaderboard
-- Solo eliminamos las más peligrosas de UPDATE/DELETE sin restricción
DROP POLICY IF EXISTS "Authenticated users can update" ON kpis;

-- kpi_validaciones
DROP POLICY IF EXISTS "Authenticated users can view" ON kpi_validaciones;
DROP POLICY IF EXISTS "Authenticated users can update" ON kpi_validaciones;

-- obv_validaciones
DROP POLICY IF EXISTS "obv_validaciones_all" ON obv_validaciones;
DROP POLICY IF EXISTS "Authenticated users can view" ON obv_validaciones;
DROP POLICY IF EXISTS "Authenticated users can update" ON obv_validaciones;

-- members: El _all_access con true es necesario para leaderboard pero demasiado permisivo
-- Lo reemplazamos con una política que solo ve miembros en tus proyectos
DROP POLICY IF EXISTS "members_authenticated_all" ON members;

-- user_roles: DROP broad
DROP POLICY IF EXISTS "user_roles_all" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can view" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can update" ON user_roles;

-- ============================================================
-- FASE 4: CREAR POLÍTICAS CORRECTAS donde hacen falta
-- ============================================================

-- projects: SELECT correcto (ya existe "Users can read own projects" con el USING correcto)
-- Asegurar que existe si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Users can read own projects'
  ) THEN
    CREATE POLICY "Users can read own projects" ON projects
      FOR SELECT TO authenticated
      USING (
        owner_id = auth.uid() OR
        id IN (SELECT project_id FROM project_members WHERE member_id = auth.uid())
      );
  END IF;
END $$;

-- project_members: SELECT - ver miembros de tus proyectos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'project_members' 
    AND policyname = 'project_members_select_own_projects'
  ) THEN
    CREATE POLICY "project_members_select_own_projects" ON project_members
      FOR SELECT TO authenticated
      USING (
        project_id IN (
          SELECT id FROM projects
          WHERE owner_id = auth.uid()
          UNION
          SELECT project_id FROM project_members pm2 WHERE pm2.member_id = auth.uid()
        )
      );
  END IF;
END $$;

-- project_members: UPDATE - solo dueño del proyecto puede cambiar miembros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'project_members' 
    AND policyname = 'project_members_update_owner'
  ) THEN
    CREATE POLICY "project_members_update_owner" ON project_members
      FOR UPDATE TO authenticated
      USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
      );
  END IF;
END $$;

-- project_members: DELETE - solo dueño del proyecto puede remover miembros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'project_members' 
    AND policyname = 'project_members_delete_owner'
  ) THEN
    CREATE POLICY "project_members_delete_owner" ON project_members
      FOR DELETE TO authenticated
      USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
        OR member_id = auth.uid()
      );
  END IF;
END $$;

-- obvs: SELECT - ver OBVs de proyectos donde eres miembro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'obvs' 
    AND policyname = 'obvs_select_project_members'
  ) THEN
    CREATE POLICY "obvs_select_project_members" ON obvs
      FOR SELECT TO authenticated
      USING (
        project_id IN (
          SELECT project_id FROM project_members WHERE member_id = auth.uid()
        )
      );
  END IF;
END $$;

-- obvs: UPDATE - solo el owner puede editar su OBV
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'obvs' 
    AND policyname = 'obvs_update_owner_v2'
  ) THEN
    CREATE POLICY "obvs_update_owner_v2" ON obvs
      FOR UPDATE TO authenticated
      USING (
        owner_id = (SELECT id FROM members WHERE auth_id = auth.uid())
        OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
      );
  END IF;
END $$;

-- obvs: DELETE - solo el owner o admin del proyecto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'obvs' 
    AND policyname = 'obvs_delete_owner'
  ) THEN
    CREATE POLICY "obvs_delete_owner" ON obvs
      FOR DELETE TO authenticated
      USING (
        owner_id = (SELECT id FROM members WHERE auth_id = auth.uid())
        OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
      );
  END IF;
END $$;

-- tasks: UPDATE - miembros del proyecto pueden actualizar tareas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname = 'tasks_update_project_members'
  ) THEN
    CREATE POLICY "tasks_update_project_members" ON tasks
      FOR UPDATE TO authenticated
      USING (
        project_id IN (
          SELECT project_id FROM project_members 
          WHERE member_id = auth.uid()
        )
      );
  END IF;
END $$;

-- tasks: DELETE - solo owner de la tarea o admin del proyecto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname = 'tasks_delete_owner_or_admin'
  ) THEN
    CREATE POLICY "tasks_delete_owner_or_admin" ON tasks
      FOR DELETE TO authenticated
      USING (
        assignee_id = auth.uid()
        OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
      );
  END IF;
END $$;

-- leads: SELECT - ver leads de tus proyectos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leads' 
    AND policyname = 'leads_select_project_members'
  ) THEN
    CREATE POLICY "leads_select_project_members" ON leads
      FOR SELECT TO authenticated
      USING (
        project_id IN (
          SELECT project_id FROM project_members WHERE member_id = auth.uid()
        )
      );
  END IF;
END $$;

-- leads: UPDATE - miembros del proyecto pueden editar leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leads' 
    AND policyname = 'leads_update_project_members'
  ) THEN
    CREATE POLICY "leads_update_project_members" ON leads
      FOR UPDATE TO authenticated
      USING (
        project_id IN (
          SELECT project_id FROM project_members WHERE member_id = auth.uid()
        )
      );
  END IF;
END $$;

-- leads: DELETE - solo admin del proyecto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leads' 
    AND policyname = 'leads_delete_admin'
  ) THEN
    CREATE POLICY "leads_delete_admin" ON leads
      FOR DELETE TO authenticated
      USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
      );
  END IF;
END $$;

-- members: ver perfiles de miembros en tus proyectos (para leaderboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'members' 
    AND policyname = 'members_select_shared_projects'
  ) THEN
    CREATE POLICY "members_select_shared_projects" ON members
      FOR SELECT TO authenticated
      USING (
        -- Puede ver tu propio perfil
        auth_id = auth.uid()
        OR
        -- Puede ver perfiles de miembros en los mismos proyectos
        id IN (
          SELECT pm.member_id FROM project_members pm
          WHERE pm.project_id IN (
            SELECT project_id FROM project_members WHERE member_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- user_roles: ver roles de miembros en tus proyectos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'user_roles_select_shared_projects'
  ) THEN
    CREATE POLICY "user_roles_select_shared_projects" ON user_roles
      FOR SELECT TO authenticated
      USING (
        user_id = auth.uid()
        OR
        user_id IN (
          SELECT pm.member_id FROM project_members pm
          WHERE pm.project_id IN (
            SELECT project_id FROM project_members WHERE member_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- user_roles: UPDATE - solo admin puede cambiar roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'user_roles_update_admin'
  ) THEN
    CREATE POLICY "user_roles_update_admin" ON user_roles
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role_name = 'admin'
        )
        OR user_id = auth.uid()
      );
  END IF;
END $$;

-- user_roles: DELETE - solo admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'user_roles_delete_admin'
  ) THEN
    CREATE POLICY "user_roles_delete_admin" ON user_roles
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role_name = 'admin'
        )
      );
  END IF;
END $$;

-- obv_validaciones: SELECT - miembros del proyecto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'obv_validaciones' 
    AND policyname = 'obv_validaciones_select_project_members'
  ) THEN
    CREATE POLICY "obv_validaciones_select_project_members" ON obv_validaciones
      FOR SELECT TO authenticated
      USING (
        obv_id IN (
          SELECT id FROM obvs
          WHERE project_id IN (
            SELECT project_id FROM project_members WHERE member_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- obv_validaciones: UPDATE - solo el validador puede actualizar su voto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'obv_validaciones' 
    AND policyname = 'obv_validaciones_update_own_vote'
  ) THEN
    CREATE POLICY "obv_validaciones_update_own_vote" ON obv_validaciones
      FOR UPDATE TO authenticated
      USING (validator_id = auth.uid());
  END IF;
END $$;

-- kpi_validaciones: SELECT - miembros pueden ver validaciones (para leaderboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kpi_validaciones' 
    AND policyname = 'kpi_validaciones_select_authenticated'
  ) THEN
    CREATE POLICY "kpi_validaciones_select_authenticated" ON kpi_validaciones
      FOR SELECT TO authenticated
      USING (true);
    -- Intencional: las validaciones de KPI son públicas para el leaderboard
  END IF;
END $$;

-- kpi_validaciones: UPDATE/DELETE - solo el validador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kpi_validaciones' 
    AND policyname = 'kpi_validaciones_update_own'
  ) THEN
    CREATE POLICY "kpi_validaciones_update_own" ON kpi_validaciones
      FOR UPDATE TO authenticated
      USING (validator_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kpi_validaciones' 
    AND policyname = 'kpi_validaciones_delete_own'
  ) THEN
    CREATE POLICY "kpi_validaciones_delete_own" ON kpi_validaciones
      FOR DELETE TO authenticated
      USING (validator_id = auth.uid());
  END IF;
END $$;

-- projects: DELETE - solo el owner puede borrar su proyecto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'projects_delete_owner'
  ) THEN
    CREATE POLICY "projects_delete_owner" ON projects
      FOR DELETE TO authenticated
      USING (owner_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- FASE 5: VERIFICACIÓN FINAL
-- ============================================================
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE roles = '{anon}') as anon_policies,
  COUNT(*) FILTER (WHERE qual = 'true' AND cmd = 'DELETE') as dangerous_deletes
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
HAVING 
  COUNT(*) FILTER (WHERE roles = '{anon}') > 0
  OR COUNT(*) FILTER (WHERE qual = 'true' AND cmd = 'DELETE') > 0
ORDER BY tablename;
