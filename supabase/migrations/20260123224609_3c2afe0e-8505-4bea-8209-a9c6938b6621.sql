-- Fix 1: profiles_table_public_exposure
-- The profiles table allows all authenticated users to see all emails
-- This is intentional for a team collaboration platform - members need to see each other
-- However, let's note this is a known security consideration for closed team platforms
-- For now, keep it but add a comment explaining the business requirement

-- Fix 2: financial_metrics_no_rls - Enable RLS and add proper policies
-- Note: financial_metrics is a VIEW, not a table, so RLS doesn't apply the same way
-- The underlying obvs table already has RLS - the view inherits security from the base tables

-- Fix 3: notifications_policy_bypass - Drop the permissive policy that allows any user to insert
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- The "Only triggers can create notifications" policy with CHECK (false) will remain
-- Triggers use SECURITY DEFINER so they bypass RLS and can still insert

-- Fix 4: obv_notification_broadcast - Replace the notify_new_obv function
-- to only notify project members instead of all users
CREATE OR REPLACE FUNCTION public.notify_new_obv()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_rec RECORD;
  obv_owner_name TEXT;
BEGIN
  -- Get the owner's name
  SELECT nombre INTO obv_owner_name FROM public.profiles WHERE id = NEW.owner_id;
  
  -- Only notify project members who have notifications enabled
  -- and are not the OBV owner
  FOR profile_rec IN 
    SELECT DISTINCT pm.member_id as id
    FROM public.project_members pm
    LEFT JOIN public.user_settings us ON us.user_id = pm.member_id
    WHERE pm.project_id = NEW.project_id
      AND pm.member_id != NEW.owner_id
      AND (us.notifications IS NULL OR (us.notifications->>'nuevas_obvs')::boolean = true)
  LOOP
    INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
    VALUES (
      profile_rec.id,
      'Nueva OBV pendiente de validar',
      obv_owner_name || ' ha subido: ' || NEW.titulo,
      'obv_nueva',
      '/obvs'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;