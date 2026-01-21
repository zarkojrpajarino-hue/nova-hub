
-- Corregir la vista user_role_performance para usar security_invoker (no security_definer)
DROP VIEW IF EXISTS public.user_role_performance;

CREATE VIEW public.user_role_performance 
WITH (security_invoker = true) AS
SELECT 
  pm.member_id as user_id,
  pm.role as role_name,
  pm.project_id,
  p.nombre as project_name,
  pr.nombre as user_name,
  pm.is_lead,
  pm.role_accepted,
  pm.performance_score,
  -- Métricas de tareas
  COALESCE(task_stats.total_tasks, 0) as total_tasks,
  COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
  COALESCE(task_stats.completion_rate, 0) as task_completion_rate,
  -- Métricas de OBVs
  COALESCE(obv_stats.total_obvs, 0) as total_obvs,
  COALESCE(obv_stats.validated_obvs, 0) as validated_obvs,
  COALESCE(obv_stats.total_facturacion, 0) as total_facturacion,
  -- Métricas de leads (para roles comerciales)
  COALESCE(lead_stats.total_leads, 0) as total_leads,
  COALESCE(lead_stats.leads_ganados, 0) as leads_ganados,
  COALESCE(lead_stats.conversion_rate, 0) as lead_conversion_rate,
  pm.joined_at
FROM public.project_members pm
JOIN public.profiles pr ON pr.id = pm.member_id
JOIN public.projects p ON p.id = pm.project_id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
    CASE WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE status = 'done')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0 
    END as completion_rate
  FROM public.tasks t
  WHERE t.assignee_id = pm.member_id AND t.project_id = pm.project_id
) task_stats ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_obvs,
    COUNT(*) FILTER (WHERE status = 'validated') as validated_obvs,
    COALESCE(SUM(facturacion) FILTER (WHERE status = 'validated'), 0) as total_facturacion
  FROM public.obvs o
  WHERE o.owner_id = pm.member_id AND o.project_id = pm.project_id
) obv_stats ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE status = 'cerrado_ganado') as leads_ganados,
    CASE WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE status = 'cerrado_ganado')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM public.leads l
  WHERE l.responsable_id = pm.member_id AND l.project_id = pm.project_id
) lead_stats ON true;
