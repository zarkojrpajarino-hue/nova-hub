-- V5.5.9 / V5.5.10 / V5.5.11 — RLS Hardening Migration
--
-- V5.5.9:  Replace WITH CHECK(true) on metric_alerts, ai_recommendations, weekly_insights
--          with project_id NOT NULL + project exists check.
--
-- V5.5.10: Replace USING(true) SELECT on kpis, obvs, tasks, member_kpi_base
--          with project-member filter using EXISTS.
--
-- V5.5.11: Replace project_id IN (SELECT...) patterns on okrs, competitor_snapshots
--          with EXISTS(project_members) join for better performance.
--
-- Safety: All policies are DROP IF EXISTS + CREATE, making migration idempotent.

BEGIN;

-- ============================================================================
-- V5.5.9 — Harden INSERT/UPDATE WITH CHECK policies
-- ============================================================================

-- metric_alerts: require project_id NOT NULL + user is project member
DO $$ BEGIN
  DROP POLICY IF EXISTS "metric_alerts_insert" ON metric_alerts;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "metric_alerts_insert" ON metric_alerts
    FOR INSERT WITH CHECK (
      project_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = metric_alerts.project_id
          AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ai_recommendations: require project_id NOT NULL + user is project member
DO $$ BEGIN
  DROP POLICY IF EXISTS "ai_recommendations_insert" ON ai_recommendations;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "ai_recommendations_insert" ON ai_recommendations
    FOR INSERT WITH CHECK (
      project_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = ai_recommendations.project_id
          AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- weekly_insights: require project_id NOT NULL + user is project member
DO $$ BEGIN
  DROP POLICY IF EXISTS "weekly_insights_insert" ON weekly_insights;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "weekly_insights_insert" ON weekly_insights
    FOR INSERT WITH CHECK (
      project_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = weekly_insights.project_id
          AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- V5.5.10 — Harden SELECT USING(true) → project-member filter
-- ============================================================================

-- kpis: only see KPIs for projects you belong to
DO $$ BEGIN
  DROP POLICY IF EXISTS "kpis_select" ON kpis;
  DROP POLICY IF EXISTS "Users can read all kpis" ON kpis;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "kpis_select_member" ON kpis
    FOR SELECT USING (
      kpis.owner_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.member_id = kpis.owner_id
          AND pm.member_id IN (
            SELECT pm2.member_id FROM project_members pm2
            WHERE pm2.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
              AND pm2.project_id = pm.project_id
          )
      )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- obvs: only see OBVs for projects you belong to
DO $$ BEGIN
  DROP POLICY IF EXISTS "obvs_select" ON obvs;
  DROP POLICY IF EXISTS "Users can read all obvs" ON obvs;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "obvs_select_member" ON obvs
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = obvs.project_id
          AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
      OR obvs.owner_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- tasks: only see tasks for projects you belong to
DO $$ BEGIN
  DROP POLICY IF EXISTS "tasks_select" ON tasks;
  DROP POLICY IF EXISTS "Users can read all tasks" ON tasks;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tasks_select_member" ON tasks
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tasks.project_id
          AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
      OR tasks.owner_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      OR tasks.assigned_to = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- member_kpi_base: only see stats for projects you belong to
DO $$ BEGIN
  DROP POLICY IF EXISTS "member_kpi_base_select" ON member_kpi_base;
  DROP POLICY IF EXISTS "Users can read member_kpi_base" ON member_kpi_base;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "member_kpi_base_select_member" ON member_kpi_base
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = member_kpi_base.project_id
          AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- V5.5.11 — Replace IN (SELECT...) with EXISTS for performance
-- ============================================================================

-- okrs: replace project_id IN (SELECT...) with EXISTS
DO $$ BEGIN
  DROP POLICY IF EXISTS "okrs_select" ON okrs;
  DROP POLICY IF EXISTS "Users can read okrs" ON okrs;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "okrs_select_member" ON okrs
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = okrs.project_id
          AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- competitor_snapshots: replace project_id IN (SELECT...) with EXISTS
DO $$ BEGIN
  DROP POLICY IF EXISTS "competitor_snapshots_select" ON competitor_snapshots;
  DROP POLICY IF EXISTS "Users can read competitor_snapshots" ON competitor_snapshots;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "competitor_snapshots_select_member" ON competitor_snapshots
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = competitor_snapshots.project_id
          AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

COMMIT;
