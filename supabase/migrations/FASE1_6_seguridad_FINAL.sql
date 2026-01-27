-- =====================================================
-- FASE 1.6: PROTECCIÓN DE DATOS SENSIBLES (FINAL)
-- =====================================================
-- Fecha: 27 Enero 2026
-- Adaptado a la estructura real de la base de datos

-- =====================================================
-- 1. PROTEGER EMAILS EN MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "nova_members_select_all" ON members;

CREATE POLICY "members_select_with_privacy" ON members
  FOR SELECT
  USING (true);

-- =====================================================
-- 2. PROTEGER TABLAS FINANCIERAS
-- =====================================================

-- 2.1. OBVS_FINANCIAL
ALTER TABLE IF EXISTS obvs_financial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "obvs_financial_select_restricted" ON obvs_financial;
CREATE POLICY "obvs_financial_select_restricted" ON obvs_financial
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT member_id
      FROM project_members pm
      WHERE pm.project_id = obvs_financial.project_id
    )
  );

-- 2.2. ANALYSIS_COSTES_GLOBAL
ALTER TABLE IF EXISTS analysis_costes_global ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_costes_global_select" ON analysis_costes_global;
CREATE POLICY "analysis_costes_global_select" ON analysis_costes_global
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (SELECT auth_id FROM members)
  );

-- 2.3. ANALYSIS_COSTES_POR_PROYECTO
ALTER TABLE IF EXISTS analysis_costes_por_proyecto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_costes_proyecto_select" ON analysis_costes_por_proyecto;
CREATE POLICY "analysis_costes_proyecto_select" ON analysis_costes_por_proyecto
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT member_id
      FROM project_members pm
      WHERE pm.project_id = analysis_costes_por_proyecto.project_id
    )
  );

-- 2.4. DASHBOARD_COBROS
ALTER TABLE IF EXISTS dashboard_cobros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_cobros_select" ON dashboard_cobros;
CREATE POLICY "dashboard_cobros_select" ON dashboard_cobros
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (SELECT auth_id FROM members)
  );

-- 2.5. FORECAST_INGRESOS
ALTER TABLE IF EXISTS forecast_ingresos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forecast_ingresos_select" ON forecast_ingresos;
CREATE POLICY "forecast_ingresos_select" ON forecast_ingresos
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (SELECT auth_id FROM members)
  );

-- 2.6. COBROS_PARCIALES
ALTER TABLE IF EXISTS cobros_parciales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cobros_parciales_select" ON cobros_parciales;
CREATE POLICY "cobros_parciales_select" ON cobros_parciales
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (SELECT auth_id FROM members)
  );

DROP POLICY IF EXISTS "cobros_parciales_insert" ON cobros_parciales;
CREATE POLICY "cobros_parciales_insert" ON cobros_parciales
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM members)
  );

-- 2.7. COBROS_POR_PROYECTO
ALTER TABLE IF EXISTS cobros_por_proyecto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cobros_por_proyecto_select" ON cobros_por_proyecto;
CREATE POLICY "cobros_por_proyecto_select" ON cobros_por_proyecto
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT member_id
      FROM project_members pm
      WHERE pm.project_id = cobros_por_proyecto.project_id
    )
  );

-- =====================================================
-- 3. CORREGIR POLÍTICAS EN OBVS Y KPIS
-- =====================================================

DROP POLICY IF EXISTS "nova_obvs_insert_all" ON obvs;
CREATE POLICY "nova_obvs_insert_all" ON obvs
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM members)
  );

DROP POLICY IF EXISTS "nova_obvs_update_all" ON obvs;
CREATE POLICY "nova_obvs_update_all" ON obvs
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT auth_id FROM members)
  );

DROP POLICY IF EXISTS "nova_kpis_insert_all" ON kpis;
CREATE POLICY "nova_kpis_insert_all" ON kpis
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM members)
  );

DROP POLICY IF EXISTS "nova_kpis_update_all" ON kpis;
CREATE POLICY "nova_kpis_update_all" ON kpis
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT auth_id FROM members)
  );

-- =====================================================
-- 4. CREAR VIEW PÚBLICA SIN EMAILS
-- =====================================================

CREATE OR REPLACE VIEW public_members AS
SELECT
  id,
  auth_id,
  nombre,
  avatar,
  color,
  rol,
  especializacion,
  CASE
    WHEN auth.uid() = auth_id THEN email
    WHEN auth.uid() IN (SELECT auth_id FROM members WHERE role = 'admin') THEN email
    ELSE NULL
  END as email,
  created_at,
  updated_at
FROM members;

GRANT SELECT ON public_members TO authenticated;

-- FIN DE MIGRACIÓN
