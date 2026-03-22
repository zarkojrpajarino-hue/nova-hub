-- =============================================================================
-- M2.3 — Resource Enforcement RPC
--
-- Función que verifica si un proyecto puede crear un recurso según su plan.
-- Retorna TRUE si el límite permite crear, FALSE si se ha alcanzado.
-- -1 en max_* = ilimitado.
-- =============================================================================

CREATE OR REPLACE FUNCTION check_resource_limit(
  p_project_id UUID,
  p_resource_type TEXT  -- 'members', 'tasks', 'leads', 'obvs'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get the limit from the subscription plan
  SELECT
    CASE p_resource_type
      WHEN 'members' THEN sp.max_members
      WHEN 'tasks' THEN sp.max_tasks
      WHEN 'leads' THEN sp.max_leads
      WHEN 'obvs' THEN sp.max_obvs
      ELSE -1
    END
  INTO v_plan_limit
  FROM project_subscriptions ps
  JOIN subscription_plans sp ON sp.id = ps.plan_id
  WHERE ps.project_id = p_project_id
    AND ps.status IN ('trial', 'active')
  LIMIT 1;

  -- No subscription found → allow (graceful fallback)
  IF v_plan_limit IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Unlimited
  IF v_plan_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Count current resources
  CASE p_resource_type
    WHEN 'members' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM project_members WHERE project_id = p_project_id;
    WHEN 'tasks' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM tasks WHERE project_id = p_project_id
        AND status NOT IN ('completed', 'archived');
    WHEN 'leads' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM obvs WHERE project_id = p_project_id AND tipo = 'crm';
    WHEN 'obvs' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM obvs WHERE project_id = p_project_id AND tipo != 'crm';
    ELSE
      RETURN TRUE;
  END CASE;

  RETURN v_current_count < v_plan_limit;
END;
$$;
