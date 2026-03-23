-- Create user_role_performance view
-- Calculates performance metrics per user per role per project
-- from existing tables: project_members, tasks, obvs, profiles, projects

CREATE OR REPLACE VIEW public.user_role_performance AS
SELECT
  pm.member_id AS user_id,
  pm.specialization_role AS role_name,
  pm.project_id,
  p.nombre AS project_name,
  pr.nombre AS user_name,
  (pm.member_id = proj.created_by) AS is_lead,
  COALESCE(pm.role_accepted, true) AS role_accepted,
  -- Performance score: weighted average of completion rate + OBV validation rate
  ROUND(
    COALESCE(
      (
        COALESCE(task_stats.completion_rate, 0) * 0.4 +
        COALESCE(obv_stats.validation_rate, 0) * 0.3 +
        COALESCE(lead_stats.conversion_rate, 0) * 0.3
      ),
      0
    )::numeric, 2
  ) AS performance_score,
  COALESCE(task_stats.total_tasks, 0)::integer AS total_tasks,
  COALESCE(task_stats.completed_tasks, 0)::integer AS completed_tasks,
  COALESCE(task_stats.completion_rate, 0)::numeric(5,2) AS task_completion_rate,
  COALESCE(obv_stats.total_obvs, 0)::integer AS total_obvs,
  COALESCE(obv_stats.validated_obvs, 0)::integer AS validated_obvs,
  COALESCE(obv_stats.total_facturacion, 0)::numeric(12,2) AS total_facturacion,
  COALESCE(lead_stats.total_leads, 0)::integer AS total_leads,
  COALESCE(lead_stats.leads_ganados, 0)::integer AS leads_ganados,
  COALESCE(lead_stats.conversion_rate, 0)::numeric(5,2) AS lead_conversion_rate,
  pm.created_at AS joined_at
FROM project_members pm
JOIN profiles pr ON pr.id = pm.member_id
JOIN projects proj ON proj.id = pm.project_id
LEFT JOIN LATERAL (
  SELECT p2.nombre FROM profiles p2 WHERE p2.id = pm.member_id LIMIT 1
) p ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::bigint AS total_tasks,
    COUNT(*) FILTER (WHERE t.status = 'completed')::bigint AS completed_tasks,
    CASE WHEN COUNT(*) > 0
      THEN (COUNT(*) FILTER (WHERE t.status = 'completed')::numeric / COUNT(*)::numeric * 100)
      ELSE 0
    END AS completion_rate
  FROM tasks t
  WHERE t.project_id = pm.project_id
    AND t.assigned_to = pm.member_id
) task_stats ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::bigint AS total_obvs,
    COUNT(*) FILTER (WHERE o.status = 'validated')::bigint AS validated_obvs,
    CASE WHEN COUNT(*) > 0
      THEN (COUNT(*) FILTER (WHERE o.status = 'validated')::numeric / COUNT(*)::numeric * 100)
      ELSE 0
    END AS validation_rate,
    COALESCE(SUM(o.monto), 0) AS total_facturacion
  FROM obvs o
  WHERE o.project_id = pm.project_id
    AND o.created_by = pm.member_id
) obv_stats ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::bigint AS total_leads,
    COUNT(*) FILTER (WHERE o2.pipeline_status = 'cerrado_ganado')::bigint AS leads_ganados,
    CASE WHEN COUNT(*) > 0
      THEN (COUNT(*) FILTER (WHERE o2.pipeline_status = 'cerrado_ganado')::numeric / COUNT(*)::numeric * 100)
      ELSE 0
    END AS conversion_rate
  FROM obvs o2
  WHERE o2.project_id = pm.project_id
    AND o2.created_by = pm.member_id
    AND o2.type IN ('crm', 'lead')
) lead_stats ON true
WHERE pm.specialization_role IS NOT NULL
  AND proj.deleted_at IS NULL;

-- Grant access
GRANT SELECT ON public.user_role_performance TO authenticated;
GRANT SELECT ON public.user_role_performance TO anon;
