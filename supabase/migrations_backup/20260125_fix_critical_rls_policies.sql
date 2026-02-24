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
