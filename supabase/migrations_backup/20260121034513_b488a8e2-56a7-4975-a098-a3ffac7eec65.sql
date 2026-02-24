-- =============================================
-- FIX SECURITY WARNINGS
-- =============================================

-- Drop and recreate views with security_invoker = true
DROP VIEW IF EXISTS member_stats;
DROP VIEW IF EXISTS project_stats;
DROP VIEW IF EXISTS pipeline_global;

-- Member stats with SECURITY INVOKER (respects RLS of calling user)
CREATE VIEW member_stats 
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.nombre,
  p.color,
  p.avatar,
  p.email,
  COALESCE((SELECT COUNT(*) FROM obvs WHERE owner_id = p.id AND status = 'validated'), 0) as obvs,
  COALESCE((SELECT COUNT(*) FROM kpis WHERE owner_id = p.id AND type = 'lp' AND status = 'validated'), 0) as lps,
  COALESCE((SELECT COUNT(*) FROM kpis WHERE owner_id = p.id AND type = 'bp' AND status = 'validated'), 0) as bps,
  COALESCE((SELECT SUM(cp_points) FROM kpis WHERE owner_id = p.id AND type = 'cp' AND status = 'validated'), 0) as cps,
  COALESCE((SELECT SUM(facturacion) FROM obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as facturacion,
  COALESCE((SELECT SUM(margen) FROM obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as margen
FROM profiles p;

-- Project stats with SECURITY INVOKER
CREATE VIEW project_stats 
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.nombre,
  p.fase,
  p.tipo,
  p.icon,
  p.color,
  p.onboarding_completed,
  COUNT(DISTINCT pm.member_id) as num_members,
  COUNT(DISTINCT o.id) as total_obvs,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'cerrado_ganado') as leads_ganados,
  COALESCE(SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0) as facturacion,
  COALESCE(SUM(o.margen) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0) as margen
FROM projects p
LEFT JOIN project_members pm ON pm.project_id = p.id
LEFT JOIN obvs o ON o.project_id = p.id
LEFT JOIN leads l ON l.project_id = p.id
GROUP BY p.id;

-- Pipeline global with SECURITY INVOKER
CREATE VIEW pipeline_global 
WITH (security_invoker = true) AS
SELECT 
  l.*,
  p.nombre as proyecto_nombre,
  p.color as proyecto_color,
  pr.nombre as responsable_nombre
FROM leads l
JOIN projects p ON l.project_id = p.id
LEFT JOIN profiles pr ON l.responsable_id = pr.id;

-- Fix trigger functions with proper search_path
CREATE OR REPLACE FUNCTION public.check_obv_validations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.obv_validaciones 
    WHERE obv_id = NEW.obv_id AND approved = TRUE
  ) >= 2 THEN
    UPDATE public.obvs SET status = 'validated', validated_at = NOW() 
    WHERE id = NEW.obv_id;
  ELSIF (
    SELECT COUNT(*) FROM public.obv_validaciones 
    WHERE obv_id = NEW.obv_id AND approved = FALSE
  ) >= 2 THEN
    UPDATE public.obvs SET status = 'rejected' WHERE id = NEW.obv_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_kpi_validations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.kpi_validaciones 
    WHERE kpi_id = NEW.kpi_id AND approved = TRUE
  ) >= 2 THEN
    UPDATE public.kpis SET status = 'validated', validated_at = NOW() 
    WHERE id = NEW.kpi_id;
  ELSIF (
    SELECT COUNT(*) FROM public.kpi_validaciones 
    WHERE kpi_id = NEW.kpi_id AND approved = FALSE
  ) >= 2 THEN
    UPDATE public.kpis SET status = 'rejected' WHERE id = NEW.kpi_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'member' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    (SELECT id FROM public.profiles WHERE auth_id = NEW.id),
    'member'
  );
  
  RETURN NEW;
END;
$$;