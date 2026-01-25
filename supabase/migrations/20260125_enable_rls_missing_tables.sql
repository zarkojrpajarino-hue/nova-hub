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
