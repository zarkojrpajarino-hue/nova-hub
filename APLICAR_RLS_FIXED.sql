-- =====================================================================
-- Enable RLS on Missing Critical Tables (CORREGIDO para usar 'members')
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
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- PART 2: activity_log - Users can only see their own activity
-- =====================================================================

CREATE POLICY "activity_log_select_own"
ON public.activity_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "activity_log_insert_system"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (true);


-- =====================================================================
-- PART 3: kpis - Project-based access
-- =====================================================================

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

CREATE POLICY "projects_select_all"
ON public.projects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "projects_insert_service"
ON public.projects
FOR INSERT
TO service_role
WITH CHECK (true);

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

CREATE POLICY "project_members_insert_service"
ON public.project_members
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "project_members_update_own"
ON public.project_members
FOR UPDATE
TO authenticated
USING (member_id = public.get_member_id(auth.uid()));


-- =====================================================================
-- PART 7: obv_validaciones - Validators can see validations
-- =====================================================================

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
-- PART 9: members - Privacy protection (use members_public view)
-- =====================================================================

CREATE POLICY "members_select_all"
ON public.members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "members_update_own"
ON public.members
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid());


-- =====================================================================
-- PART 10: objectives - Project-based access
-- =====================================================================

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

CREATE POLICY "notifications_select_own"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_system"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());


COMMIT;

-- =====================================================================
-- Phase 5: Critical RLS Security Policy Fixes
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Helper Function (SECURITY DEFINER)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_member_id(_auth_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.members WHERE auth_id = _auth_id LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_member_id(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_member_id IS 'Maps auth.uid() to member ID for RLS policies. SECURITY DEFINER allows execution in RLS context.';


-- =====================================================================
-- PART 2: Members Email Privacy Protection
-- =====================================================================

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
  CASE
    WHEN auth_id = auth.uid() THEN email
    ELSE NULL
  END AS email
FROM public.members;

GRANT SELECT ON public.members_public TO authenticated;

COMMENT ON VIEW public.members_public IS 'Public view of members with email privacy. Email only visible to self.';


-- =====================================================================
-- PART 3: Leads Access Control (Project-Based)
-- =====================================================================

DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

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


-- =====================================================================
-- PART 4: OBVs Financial Data Protection (Project-Based)
-- =====================================================================

DROP POLICY IF EXISTS "obvs_select_policy" ON public.obvs;
DROP POLICY IF EXISTS "obvs_insert_policy" ON public.obvs;
DROP POLICY IF EXISTS "obvs_update_policy" ON public.obvs;
DROP POLICY IF EXISTS "obvs_delete_policy" ON public.obvs;

ALTER TABLE public.obvs ENABLE ROW LEVEL SECURITY;

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


-- =====================================================================
-- PART 5: Tasks Access Control (Project-Based)
-- =====================================================================

DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

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


-- =====================================================================
-- PART 6: Lead History Access Control (Project-Based)
-- =====================================================================

DROP POLICY IF EXISTS "lead_history_select_policy" ON public.lead_history;
DROP POLICY IF EXISTS "lead_history_insert_policy" ON public.lead_history;

ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;

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

COMMIT;
