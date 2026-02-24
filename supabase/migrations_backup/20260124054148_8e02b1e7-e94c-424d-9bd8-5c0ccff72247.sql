-- =====================================================
-- Security Fix: Activity Log Access Control
-- =====================================================
-- Issue: activity_log is viewable by all authenticated users
-- Fix: Restrict to own activities, project member activities, and admins

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Activity viewable by authenticated" ON public.activity_log;

-- Create restrictive policy for viewing activity logs
-- Users can see:
-- 1. Their own activities
-- 2. Activities from users who are in the same project(s)
-- 3. Admins can see all activities
CREATE POLICY "Users can view own and project member activities"
ON public.activity_log
FOR SELECT
USING (
  -- Own activities
  user_id = get_profile_id(auth.uid())
  -- Admin access
  OR has_role(get_profile_id(auth.uid()), 'admin'::app_role)
  -- Activities from project teammates
  OR EXISTS (
    SELECT 1 FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.member_id = activity_log.user_id
    AND pm2.member_id = get_profile_id(auth.uid())
  )
);