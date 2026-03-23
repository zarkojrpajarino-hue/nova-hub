-- HOLE-1: Fix notification INSERT policy
-- Current: any authenticated user can insert notifications for ANY user
-- Fix: users can only insert notifications for themselves
-- Triggers (notify_welcome_member, notify_lead_won, etc.) run as table owner
-- and bypass RLS, so they can still create notifications for other users.

DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Users can create own notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_profile_id(auth.uid()));

-- Also add DELETE policy — only own notifications (for cleanup)
-- In practice we prefer archive, but the policy should exist for safety
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
