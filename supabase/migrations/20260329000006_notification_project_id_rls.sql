-- HOLE-3b: Add RLS policy that filters notifications by project membership
-- If notification has project_id, user must be a member of that project
-- If notification has no project_id (personal notifications), only owner sees it

-- Drop and recreate SELECT policy to include project_id check
DROP POLICY IF EXISTS "Own notifications viewable" ON notifications;

CREATE POLICY "Own notifications viewable" ON notifications
  FOR SELECT TO authenticated
  USING (
    user_id = public.get_profile_id(auth.uid())
    AND (
      -- Personal notification (no project) — always visible to owner
      project_id IS NULL
      OR
      -- Project notification — must be member of that project
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = notifications.project_id
          AND pm.member_id = public.get_profile_id(auth.uid())
      )
    )
  );
