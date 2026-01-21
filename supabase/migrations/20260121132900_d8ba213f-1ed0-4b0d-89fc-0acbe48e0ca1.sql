-- =============================================
-- TABLA member_kpi_base: Datos base editables de KPIs
-- =============================================

CREATE TABLE IF NOT EXISTS public.member_kpi_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  obvs INTEGER DEFAULT 0,
  obvs_exploracion INTEGER DEFAULT 0,
  obvs_validacion INTEGER DEFAULT 0,
  obvs_venta INTEGER DEFAULT 0,
  lps INTEGER DEFAULT 0,
  bps INTEGER DEFAULT 0,
  cps INTEGER DEFAULT 0,
  facturacion DECIMAL(12,2) DEFAULT 0,
  margen DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- RLS
ALTER TABLE public.member_kpi_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view all KPI base" ON public.member_kpi_base
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can insert own KPI base" ON public.member_kpi_base
  FOR INSERT TO authenticated WITH CHECK (member_id = get_profile_id(auth.uid()));

CREATE POLICY "Members can update own KPI base" ON public.member_kpi_base
  FOR UPDATE TO authenticated USING (member_id = get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage all KPI base" ON public.member_kpi_base
  FOR ALL TO authenticated USING (has_role(get_profile_id(auth.uid()), 'admin'));

-- =============================================
-- FUNCIÓN SEED: Insertar datos reales del Excel Tracker NOVA
-- Fecha extracción: 21 Enero 2026
-- =============================================

CREATE OR REPLACE FUNCTION public.seed_member_kpi_base()
RETURNS void AS $$
BEGIN
  -- ZARKO
  INSERT INTO public.member_kpi_base (member_id, obvs, obvs_exploracion, obvs_validacion, obvs_venta, lps, bps, cps, facturacion, margen)
  SELECT id, 126, 18, 12, 10, 14, 57, 49, 1065, 509 FROM public.profiles WHERE LOWER(nombre) LIKE '%zarko%'
  ON CONFLICT (member_id) DO UPDATE SET
    obvs = 126, obvs_exploracion = 18, obvs_validacion = 12, obvs_venta = 10,
    lps = 14, bps = 57, cps = 49, facturacion = 1065, margen = 509, updated_at = now();

  -- FERNANDO S
  INSERT INTO public.member_kpi_base (member_id, obvs, obvs_exploracion, obvs_validacion, obvs_venta, lps, bps, cps, facturacion, margen)
  SELECT id, 136, 23, 14, 4, 14, 52, 43, 6516, 5956 FROM public.profiles WHERE LOWER(nombre) LIKE '%fernando s%'
  ON CONFLICT (member_id) DO UPDATE SET
    obvs = 136, obvs_exploracion = 23, obvs_validacion = 14, obvs_venta = 4,
    lps = 14, bps = 52, cps = 43, facturacion = 6516, margen = 5956, updated_at = now();

  -- ÁNGEL
  INSERT INTO public.member_kpi_base (member_id, obvs, obvs_exploracion, obvs_validacion, obvs_venta, lps, bps, cps, facturacion, margen)
  SELECT id, 117, 18, 5, 18, 13, 54, 44, 3934, 3097 FROM public.profiles WHERE LOWER(nombre) LIKE '%angel%' OR LOWER(nombre) LIKE '%ángel%'
  ON CONFLICT (member_id) DO UPDATE SET
    obvs = 117, obvs_exploracion = 18, obvs_validacion = 5, obvs_venta = 18,
    lps = 13, bps = 54, cps = 44, facturacion = 3934, margen = 3097, updated_at = now();

  -- MIGUEL ÁNGEL
  INSERT INTO public.member_kpi_base (member_id, obvs, obvs_exploracion, obvs_validacion, obvs_venta, lps, bps, cps, facturacion, margen)
  SELECT id, 103, 25, 3, 13, 12, 52, 41, 4014, 2417 FROM public.profiles WHERE LOWER(nombre) LIKE '%miguel%'
  ON CONFLICT (member_id) DO UPDATE SET
    obvs = 103, obvs_exploracion = 25, obvs_validacion = 3, obvs_venta = 13,
    lps = 12, bps = 52, cps = 41, facturacion = 4014, margen = 2417, updated_at = now();

  -- MANUEL
  INSERT INTO public.member_kpi_base (member_id, obvs, obvs_exploracion, obvs_validacion, obvs_venta, lps, bps, cps, facturacion, margen)
  SELECT id, 100, 19, 2, 20, 13, 50, 45, 1074, 1035 FROM public.profiles WHERE LOWER(nombre) LIKE '%manuel%'
  ON CONFLICT (member_id) DO UPDATE SET
    obvs = 100, obvs_exploracion = 19, obvs_validacion = 2, obvs_venta = 20,
    lps = 13, bps = 50, cps = 45, facturacion = 1074, margen = 1035, updated_at = now();

  -- FERNANDO G
  INSERT INTO public.member_kpi_base (member_id, obvs, obvs_exploracion, obvs_validacion, obvs_venta, lps, bps, cps, facturacion, margen)
  SELECT id, 109, 15, 9, 17, 13, 52, 41, 310, 144 FROM public.profiles WHERE LOWER(nombre) LIKE '%fernando g%'
  ON CONFLICT (member_id) DO UPDATE SET
    obvs = 109, obvs_exploracion = 15, obvs_validacion = 9, obvs_venta = 17,
    lps = 13, bps = 52, cps = 41, facturacion = 310, margen = 144, updated_at = now();

  -- CARLA
  INSERT INTO public.member_kpi_base (member_id, obvs, obvs_exploracion, obvs_validacion, obvs_venta, lps, bps, cps, facturacion, margen)
  SELECT id, 87, 24, 7, 10, 12, 49, 49, 387, 284 FROM public.profiles WHERE LOWER(nombre) LIKE '%carla%'
  ON CONFLICT (member_id) DO UPDATE SET
    obvs = 87, obvs_exploracion = 24, obvs_validacion = 7, obvs_venta = 10,
    lps = 12, bps = 49, cps = 49, facturacion = 387, margen = 284, updated_at = now();

  -- DIEGO
  INSERT INTO public.member_kpi_base (member_id, obvs, obvs_exploracion, obvs_validacion, obvs_venta, lps, bps, cps, facturacion, margen)
  SELECT id, 102, 10, 12, 19, 12, 54, 42, 1208, 195 FROM public.profiles WHERE LOWER(nombre) LIKE '%diego%'
  ON CONFLICT (member_id) DO UPDATE SET
    obvs = 102, obvs_exploracion = 10, obvs_validacion = 12, obvs_venta = 19,
    lps = 12, bps = 54, cps = 42, facturacion = 1208, margen = 195, updated_at = now();

  -- LUIS (Casti)
  INSERT INTO public.member_kpi_base (member_id, obvs, obvs_exploracion, obvs_validacion, obvs_venta, lps, bps, cps, facturacion, margen)
  SELECT id, 86, 15, 14, 11, 12, 51, 44, 1132, 703 FROM public.profiles WHERE LOWER(nombre) LIKE '%luis%' OR LOWER(nombre) LIKE '%casti%'
  ON CONFLICT (member_id) DO UPDATE SET
    obvs = 86, obvs_exploracion = 15, obvs_validacion = 14, obvs_venta = 11,
    lps = 12, bps = 51, cps = 44, facturacion = 1132, margen = 703, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ejecutar seed
SELECT public.seed_member_kpi_base();

-- =============================================
-- ACTUALIZAR VIEW member_stats para usar datos base + dinámicos
-- =============================================

DROP VIEW IF EXISTS public.member_stats;

CREATE VIEW public.member_stats WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.nombre,
  p.color,
  p.avatar,
  p.email,
  -- KPIs base (editables) + dinámicos (validados en app)
  COALESCE(b.obvs, 0) + COALESCE((SELECT COUNT(*) FROM public.obvs WHERE owner_id = p.id AND status = 'validated'), 0) as obvs,
  COALESCE(b.lps, 0) + COALESCE((SELECT COUNT(*) FROM public.kpis WHERE owner_id = p.id AND type = 'lp' AND status = 'validated'), 0) as lps,
  COALESCE(b.bps, 0) + COALESCE((SELECT COUNT(*) FROM public.kpis WHERE owner_id = p.id AND type = 'bp' AND status = 'validated'), 0) as bps,
  COALESCE(b.cps, 0) + COALESCE((SELECT SUM(cp_points) FROM public.kpis WHERE owner_id = p.id AND type = 'cp' AND status = 'validated'), 0) as cps,
  COALESCE(b.facturacion, 0) + COALESCE((SELECT SUM(facturacion) FROM public.obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as facturacion,
  COALESCE(b.margen, 0) + COALESCE((SELECT SUM(margen) FROM public.obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as margen,
  -- Campos adicionales para desglose
  COALESCE(b.obvs_exploracion, 0) as obvs_exploracion,
  COALESCE(b.obvs_validacion, 0) as obvs_validacion,
  COALESCE(b.obvs_venta, 0) as obvs_venta
FROM public.profiles p
LEFT JOIN public.member_kpi_base b ON b.member_id = p.id;