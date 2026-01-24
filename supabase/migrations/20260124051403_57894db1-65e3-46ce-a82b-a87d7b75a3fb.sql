-- =====================================================
-- SECURITY FIX: Address 4 error-level security issues
-- =====================================================

-- Fix 1: PROFILES - Restrict visibility to own profile, teammates, and validators
-- Current: ANY authenticated user can see ALL profiles
-- New: Only own profile, project teammates, and assigned validators

DROP POLICY IF EXISTS "Profiles viewable by authenticated users only" ON public.profiles;

-- Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = auth_id);

-- Users can view profiles of their project teammates
CREATE POLICY "Users can view project teammates profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.member_id = get_profile_id(auth.uid())
    AND pm2.member_id = profiles.id
  )
);

-- Users can view profiles of people in their validation order (for validation purposes)
CREATE POLICY "Users can view validator profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.validation_order vo1
    JOIN public.validation_order vo2 ON vo1.month_year = vo2.month_year
    WHERE vo1.user_id = get_profile_id(auth.uid())
    AND vo2.user_id = profiles.id
  )
);

-- Fix 2: LEADS - Restrict to sales roles and responsables
-- Current: ALL project members can view leads
-- New: Only responsable, admins, project leads, and sales specialists

DROP POLICY IF EXISTS "Project members can view leads" ON public.leads;

CREATE POLICY "Sales roles and responsables can view leads"
ON public.leads
FOR SELECT
USING (
  -- The responsable can always see their leads
  responsable_id = get_profile_id(auth.uid())
  OR
  -- Admins can see all leads
  has_role(get_profile_id(auth.uid()), 'admin'::app_role)
  OR
  -- Project leads can see all project leads
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = leads.project_id
    AND pm.member_id = get_profile_id(auth.uid())
    AND pm.is_lead = true
  )
  OR
  -- Project members with sales specialization can see project leads
  EXISTS (
    SELECT 1 FROM public.project_members pm
    JOIN public.profiles p ON p.id = pm.member_id
    WHERE pm.project_id = leads.project_id
    AND pm.member_id = get_profile_id(auth.uid())
    AND p.especialization = 'sales'::specialization_role
  )
);

-- Fix 3: FINANCIAL_METRICS - Create secure access function
-- financial_metrics is a VIEW, so we create a secure function wrapper
CREATE OR REPLACE FUNCTION public.get_financial_metrics_secure()
RETURNS SETOF public.financial_metrics
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fm.*
  FROM public.financial_metrics fm
  WHERE 
    -- Admin access
    has_role(get_profile_id(auth.uid()), 'admin'::app_role)
    OR
    -- Project lead access
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = fm.project_id
      AND pm.member_id = get_profile_id(auth.uid())
      AND pm.is_lead = true
    )
    OR
    -- Finance specialists can access
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = get_profile_id(auth.uid())
      AND p.especialization = 'finance'::specialization_role
    );
$$;

-- Fix 4: TASKS - Restrict to assignees and project members only
-- Current: ALL authenticated users can view ALL tasks
-- New: Only assignee, project members, or personal tasks

DROP POLICY IF EXISTS "Tasks viewable" ON public.tasks;

CREATE POLICY "Project members and assignees can view tasks"
ON public.tasks
FOR SELECT
USING (
  -- User is assigned to the task
  assignee_id = get_profile_id(auth.uid())
  OR
  -- User is a member of the project
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.member_id = get_profile_id(auth.uid())
  )
  OR
  -- Personal tasks (no project) - only visible to authenticated users
  (tasks.project_id IS NULL AND auth.uid() IS NOT NULL)
);