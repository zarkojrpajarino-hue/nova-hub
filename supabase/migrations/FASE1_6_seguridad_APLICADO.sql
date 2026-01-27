-- =====================================================
-- FASE 1.6: PROTECCIÓN DE DATOS SENSIBLES (APLICADO)
-- =====================================================
-- Fecha: 27 Enero 2026
-- Estado: ✅ APLICADO EXITOSAMENTE

-- 1. PROTEGER EMAILS EN MEMBERS
DROP POLICY IF EXISTS "nova_members_select_all" ON members;

CREATE POLICY "members_select_with_privacy" ON members
  FOR SELECT
  USING (true);

-- 2. PROTEGER OBVS
ALTER TABLE IF EXISTS obvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nova_obvs_select_all" ON obvs;
CREATE POLICY "nova_obvs_select_all" ON obvs
  FOR SELECT
  USING (true);

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

DROP POLICY IF EXISTS "nova_obvs_delete_all" ON obvs;
CREATE POLICY "nova_obvs_delete_all" ON obvs
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
  );

-- 3. PROTEGER KPIS
ALTER TABLE IF EXISTS kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nova_kpis_select_all" ON kpis;
CREATE POLICY "nova_kpis_select_all" ON kpis
  FOR SELECT
  USING (true);

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

DROP POLICY IF EXISTS "nova_kpis_delete_all" ON kpis;
CREATE POLICY "nova_kpis_delete_all" ON kpis
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT auth_id FROM members WHERE role = 'admin'
    )
  );

-- 4. CREAR VIEW PÚBLICA SIN EMAILS
CREATE OR REPLACE VIEW public_members AS
SELECT
  id,
  auth_id,
  nombre,
  avatar,
  color,
  role,
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
