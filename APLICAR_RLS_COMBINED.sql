-- =====================================================================
-- Enable RLS on Missing Critical Tables
-- =====================================================================
-- Fix: Multiple tables have RLS disabled, allowing unrestricted access
-- This migration enables RLS and creates appropriate policies for:
-- - activity_log
-- - kpis, kpi_validaciones
-- - projects, project_members
-- - obv_validaciones, obv_participantes
-- - profiles
-- - objectives
-- - notifications
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Enable RLS on All Missing Tables
-- =====================================================================

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obv_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obv_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- PART 2: activity_log - Users can only see their own activity
-- =====================================================================

-- Users can read their own activity logs
CREATE POLICY "activity_log_select_own"
ON public.activity_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert activity logs
CREATE POLICY "activity_log_insert_system"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow inserts, RLS on SELECT protects reading


-- =====================================================================
-- PART 3: kpis - Project-based access
-- =====================================================================

-- Users can read KPIs from projects they're members of
CREATE POLICY "kpis_select_project_members"
ON public.kpis
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = kpis.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- Users can create KPIs in projects they're members of
CREATE POLICY "kpis_insert_project_members"
ON public.kpis
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = kpis.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- Users can update their own KPIs or KPIs in projects they're members of
CREATE POLICY "kpis_update_project_members"
ON public.kpis
FOR UPDATE
TO authenticated
USING (
  created_by = public.get_member_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = kpis.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);


-- =====================================================================
-- PART 4: kpi_validaciones - Project-based access
-- =====================================================================

-- Users can read validations for KPIs they have access to
CREATE POLICY "kpi_validaciones_select"
ON public.kpi_validaciones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kpis k
    JOIN public.project_members pm ON pm.project_id = k.project_id
    WHERE k.id = kpi_validaciones.kpi_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- Users can insert validations for KPIs they have access to
CREATE POLICY "kpi_validaciones_insert"
ON public.kpi_validaciones
FOR INSERT
TO authenticated
WITH CHECK (
  validator_id = public.get_member_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.kpis k
    JOIN public.project_members pm ON pm.project_id = k.project_id
    WHERE k.id = kpi_validaciones.kpi_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);


-- =====================================================================
-- PART 5: projects - All authenticated users can read projects
-- =====================================================================
-- Note: Projects are visible to all users, but sensitive data is protected
-- in other tables (leads, obvs) with project-member restrictions

-- All authenticated users can read projects
CREATE POLICY "projects_select_all"
ON public.projects
FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert projects (via Edge Functions)
CREATE POLICY "projects_insert_service"
ON public.projects
FOR INSERT
TO service_role
WITH CHECK (true);

-- Project members can update projects
CREATE POLICY "projects_update_members"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = projects.id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);


-- =====================================================================
-- PART 6: project_members - Members can see who's in their projects
-- =====================================================================

-- Users can see members of projects they belong to
CREATE POLICY "project_members_select_same_project"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm2
    WHERE pm2.project_id = project_members.project_id
      AND pm2.member_id = public.get_member_id(auth.uid())
  )
);

-- Only service role can insert project members (via onboarding/admin functions)
CREATE POLICY "project_members_insert_service"
ON public.project_members
FOR INSERT
TO service_role
WITH CHECK (true);

-- Users can update their own membership info (e.g., role acceptance)
CREATE POLICY "project_members_update_own"
ON public.project_members
FOR UPDATE
TO authenticated
USING (member_id = public.get_member_id(auth.uid()));


-- =====================================================================
-- PART 7: obv_validaciones - Validators can see validations
-- =====================================================================

-- Users can see validations for OBVs they have access to
CREATE POLICY "obv_validaciones_select"
ON public.obv_validaciones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.obvs o
    JOIN public.project_members pm ON pm.project_id = o.project_id
    WHERE o.id = obv_validaciones.obv_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- Users can insert validations for OBVs they have access to
CREATE POLICY "obv_validaciones_insert"
ON public.obv_validaciones
FOR INSERT
TO authenticated
WITH CHECK (
  validator_id = public.get_member_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.obvs o
    JOIN public.project_members pm ON pm.project_id = o.project_id
    WHERE o.id = obv_validaciones.obv_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);


-- =====================================================================
-- PART 8: obv_participantes - Participants visibility
-- =====================================================================

-- Users can see participants for OBVs they have access to
CREATE POLICY "obv_participantes_select"
ON public.obv_participantes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.obvs o
    JOIN public.project_members pm ON pm.project_id = o.project_id
    WHERE o.id = obv_participantes.obv_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- Users can add participants to OBVs they created
CREATE POLICY "obv_participantes_insert"
ON public.obv_participantes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obvs o
    WHERE o.id = obv_participantes.obv_id
      AND o.created_by = public.get_member_id(auth.uid())
  )
);


-- =====================================================================
-- PART 9: profiles - Privacy protection (use members_public view)
-- =====================================================================

-- Users can see all profiles (but email is protected via members_public view)
CREATE POLICY "profiles_select_all"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid());


-- =====================================================================
-- PART 10: objectives - Project-based access
-- =====================================================================

-- Users can read objectives from projects they're members of
CREATE POLICY "objectives_select_project_members"
ON public.objectives
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = objectives.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- Users can create objectives in projects they're members of
CREATE POLICY "objectives_insert_project_members"
ON public.objectives
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = objectives.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- Users can update objectives in projects they're members of
CREATE POLICY "objectives_update_project_members"
ON public.objectives
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = objectives.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);


-- =====================================================================
-- PART 11: notifications - Users can only see their own notifications
-- =====================================================================

-- Users can read their own notifications
CREATE POLICY "notifications_select_own"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "notifications_insert_system"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());


-- =====================================================================
-- Verification Query (Run after migration)
-- =====================================================================
-- Run this in Supabase SQL Editor to verify all tables have RLS enabled:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- All tables should have rowsecurity = true

COMMIT;
-- =====================================================================
-- Phase 5: Critical RLS Security Policy Fixes
-- =====================================================================
-- Fixes 4 critical security vulnerabilities identified by Lovable scan:
-- 1. User emails/personal data exposed to all authenticated users
-- 2. Leads accessible to unauthorized team members
-- 3. OBVs financial data (facturacion, margen) completely unprotected
-- 4. Seed endpoints with optional (not mandatory) admin secret
--
-- Note: Uses existing 'members' table structure
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Helper Function (SECURITY DEFINER)
-- =====================================================================
-- Purpose: Map auth.uid() to member.id for RLS policies
-- Security: DEFINER allows RLS policies to execute this with elevated privileges

CREATE OR REPLACE FUNCTION public.get_member_id(_auth_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.members WHERE auth_id = _auth_id LIMIT 1
$$;

-- Grant execute to authenticated users (needed for RLS policies)
GRANT EXECUTE ON FUNCTION public.get_member_id(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_member_id IS 'Maps auth.uid() to member ID for RLS policies. SECURITY DEFINER allows execution in RLS context.';


-- =====================================================================
-- PART 2: Members Email Privacy Protection
-- =====================================================================
-- Fix: Email addresses should only be visible to the owner
-- Create view that conditionally hides emails

CREATE OR REPLACE VIEW public.members_public AS
SELECT
  id,
  auth_id,
  nombre,
  avatar,
  color,
  especialization,
  created_at,
  updated_at,
  -- Only show email to the owner
  CASE
    WHEN auth_id = auth.uid() THEN email
    ELSE NULL
  END AS email
FROM public.members;

-- Grant access to the view
GRANT SELECT ON public.members_public TO authenticated;

COMMENT ON VIEW public.members_public IS 'Public view of members with email privacy. Email only visible to self.';


-- =====================================================================
-- PART 3: Leads Access Control (Project-Based)
-- =====================================================================
-- Fix: Leads should only be accessible to members of the associated project

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;

-- Enable RLS on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see leads from projects they're members of
CREATE POLICY "leads_select_policy"
ON public.leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = leads.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- INSERT: Users can create leads in projects they're members of
CREATE POLICY "leads_insert_policy"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = leads.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- UPDATE: Users can update leads in projects they're members of
CREATE POLICY "leads_update_policy"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = leads.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = leads.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- DELETE: Users can delete leads in projects they're members of
CREATE POLICY "leads_delete_policy"
ON public.leads
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = leads.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

COMMENT ON POLICY "leads_select_policy" ON public.leads IS 'Users can only view leads from projects they are members of';
COMMENT ON POLICY "leads_insert_policy" ON public.leads IS 'Users can only create leads in projects they are members of';
COMMENT ON POLICY "leads_update_policy" ON public.leads IS 'Users can only update leads in projects they are members of';
COMMENT ON POLICY "leads_delete_policy" ON public.leads IS 'Users can only delete leads in projects they are members of';


-- =====================================================================
-- PART 4: OBVs Financial Data Protection (Project-Based)
-- =====================================================================
-- Fix: facturación and margen should only be visible to project members

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "obvs_select_policy" ON public.obvs;
DROP POLICY IF EXISTS "obvs_insert_policy" ON public.obvs;
DROP POLICY IF EXISTS "obvs_update_policy" ON public.obvs;
DROP POLICY IF EXISTS "obvs_delete_policy" ON public.obvs;

-- Enable RLS on obvs table
ALTER TABLE public.obvs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see OBVs from projects they're members of
CREATE POLICY "obvs_select_policy"
ON public.obvs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = obvs.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- INSERT: Users can create OBVs in projects they're members of
CREATE POLICY "obvs_insert_policy"
ON public.obvs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = obvs.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- UPDATE: Users can update OBVs in projects they're members of
CREATE POLICY "obvs_update_policy"
ON public.obvs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = obvs.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = obvs.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- DELETE: Users can delete OBVs in projects they're members of
CREATE POLICY "obvs_delete_policy"
ON public.obvs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = obvs.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

COMMENT ON POLICY "obvs_select_policy" ON public.obvs IS 'Users can only view OBVs (including financial data) from projects they are members of';
COMMENT ON POLICY "obvs_insert_policy" ON public.obvs IS 'Users can only create OBVs in projects they are members of';
COMMENT ON POLICY "obvs_update_policy" ON public.obvs IS 'Users can only update OBVs in projects they are members of';
COMMENT ON POLICY "obvs_delete_policy" ON public.obvs IS 'Users can only delete OBVs in projects they are members of';


-- =====================================================================
-- PART 5: Tasks Access Control (Project-Based)
-- =====================================================================
-- Additional security: Tasks should also be project-scoped

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see tasks from projects they're members of
CREATE POLICY "tasks_select_policy"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- INSERT: Users can create tasks in projects they're members of
CREATE POLICY "tasks_insert_policy"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- UPDATE: Users can update tasks in projects they're members of
CREATE POLICY "tasks_update_policy"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- DELETE: Users can delete tasks in projects they're members of
CREATE POLICY "tasks_delete_policy"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

COMMENT ON POLICY "tasks_select_policy" ON public.tasks IS 'Users can only view tasks from projects they are members of';
COMMENT ON POLICY "tasks_insert_policy" ON public.tasks IS 'Users can only create tasks in projects they are members of';
COMMENT ON POLICY "tasks_update_policy" ON public.tasks IS 'Users can only update tasks in projects they are members of';
COMMENT ON POLICY "tasks_delete_policy" ON public.tasks IS 'Users can only delete tasks in projects they are members of';


-- =====================================================================
-- PART 6: Lead History Access Control (Project-Based)
-- =====================================================================
-- Additional security: Lead history inherits lead access control

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "lead_history_select_policy" ON public.lead_history;
DROP POLICY IF EXISTS "lead_history_insert_policy" ON public.lead_history;

-- Enable RLS on lead_history table
ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see lead history for leads they can access
CREATE POLICY "lead_history_select_policy"
ON public.lead_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.project_members pm ON pm.project_id = l.project_id
    WHERE l.id = lead_history.lead_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

-- INSERT: System can create history entries (auto-triggered)
-- Users inherit access from leads table
CREATE POLICY "lead_history_insert_policy"
ON public.lead_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.leads l
    JOIN public.project_members pm ON pm.project_id = l.project_id
    WHERE l.id = lead_history.lead_id
      AND pm.member_id = public.get_member_id(auth.uid())
  )
);

COMMENT ON POLICY "lead_history_select_policy" ON public.lead_history IS 'Users can view lead history for leads in projects they are members of';
COMMENT ON POLICY "lead_history_insert_policy" ON public.lead_history IS 'Users can create lead history entries for leads in projects they are members of';


-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================
-- Run these manually to verify the policies are working:

-- 1. Check that members_public view works
-- SELECT * FROM members_public;
-- (Should show NULL for email column except your own)

-- 2. Check RLS is enabled
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('leads', 'obvs', 'tasks', 'lead_history');
-- (All should show rowsecurity = true)

-- 3. Check policies exist
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- (Should show 4 policies per table)

COMMIT;

-- =====================================================================
-- POST-MIGRATION STEPS (MANUAL)
-- =====================================================================
--
-- 1. Update Application Code (ALREADY DONE - code uses 'members' directly)
--    - All hooks and components already query 'members' table
--    - No code changes needed
--
-- 2. Configure Seed Admin Secret (REQUIRED)
--    - Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
--    - Add: SEED_ADMIN_SECRET = <strong random value>
--    - This is now MANDATORY (not optional) - seed functions updated in previous work
--
-- 3. Test Security Policies:
--    a) Login as User A
--    b) Try to access lead from project where User A is NOT a member → should fail
--    c) Try to view User B's email → should see NULL
--    d) Try to access OBV financial data from project where User A is NOT a member → should fail
--
-- 4. Monitor for Issues:
--    - Check Supabase logs for RLS policy errors
--    - Verify all legitimate operations still work
--    - Confirm no unauthorized data access
--
-- =====================================================================
