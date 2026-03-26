-- Fix auth_is_project_member: was comparing auth.uid() directly with member_id
-- auth.uid() returns auth_id (from auth.users), but project_members.member_id
-- is profile_id (from profiles). They are DIFFERENT UUIDs.
-- This fix joins through profiles to translate auth_id → profile_id.
--
-- Applied to BD via Management API on 2026-03-25. This migration ensures
-- the fix persists across db reset / new environments.

CREATE OR REPLACE FUNCTION auth_is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM project_members pm
    JOIN profiles pr ON pr.id = pm.member_id
    WHERE pm.project_id = p_project_id
      AND pr.auth_id = auth.uid()
  );
$$;
