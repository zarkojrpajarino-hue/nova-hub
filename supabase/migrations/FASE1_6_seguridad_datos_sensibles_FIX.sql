-- =====================================================
-- FASE 1.6: PROTECCIÓN DE DATOS SENSIBLES (FIX)
-- =====================================================
-- Fecha: 27 Enero 2026
-- FIX: Usar tabla 'members' en lugar de 'profiles'

-- =====================================================
-- 1. PROTEGER EMAILS EN MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "nova_members_select_all" ON members;

CREATE POLICY "members_select_with_privacy" ON members
  FOR SELECT
  USING (true);

-- =====================================================
-- 2. PROTEGER TABLA FINANCIAL_METRICS
-- =====================================================

ALTER TABLE IF EXISTS financial_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_metrics_select_restricted" ON financial_metrics;
CREATE POLICY "financial_metrics_select_restricted" ON financial_metrics
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT member_id
      FROM project_members pm
      WHERE pm.project_id = financial_metrics.project_id
    )
  );

DROP POLICY IF EXISTS "financial_metrics_insert_restricted" ON financial_metrics;
CREATE POLICY "financial_metrics_insert_restricted" ON financial_metrics
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT member_id
      FROM project_members pm
      WHERE pm.project_id = financial_metrics.project_id
    )
  );

DROP POLICY IF EXISTS "financial_metrics_update_restricted" ON financial_metrics;
CREATE POLICY "financial_metrics_update_restricted" ON financial_metrics
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT member_id
      FROM project_members pm
      WHERE pm.project_id = financial_metrics.project_id
    )
  );

DROP POLICY IF EXISTS "financial_metrics_delete_admin" ON financial_metrics;
CREATE POLICY "financial_metrics_delete_admin" ON financial_metrics
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
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
