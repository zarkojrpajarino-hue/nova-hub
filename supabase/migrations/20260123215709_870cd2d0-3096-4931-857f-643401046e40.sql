-- Fix 1: Profiles table - Require authentication to view profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users only"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 2: Leads table - Restrict to project members only
DROP POLICY IF EXISTS "Leads viewable by authenticated" ON public.leads;
CREATE POLICY "Project members can view leads"
ON public.leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = leads.project_id
    AND pm.member_id = get_profile_id(auth.uid())
  )
);

-- Fix 3: OBVs table - Restrict to owner, participants, or project members
DROP POLICY IF EXISTS "OBVs viewable by authenticated" ON public.obvs;
CREATE POLICY "OBVs viewable by owner or project members"
ON public.obvs
FOR SELECT
USING (
  owner_id = get_profile_id(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.obv_participantes op
    WHERE op.obv_id = obvs.id
    AND op.member_id = get_profile_id(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = obvs.project_id
    AND pm.member_id = get_profile_id(auth.uid())
  )
  OR (
    -- Allow viewing OBVs without project (legacy data) if user is authenticated
    obvs.project_id IS NULL AND auth.uid() IS NOT NULL
  )
);