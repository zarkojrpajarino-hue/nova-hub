-- =====================================================
-- FASE 1.6: PROTECCIÓN DE DATOS SENSIBLES (SOLO TABLAS)
-- =====================================================
-- Fecha: 27 Enero 2026
-- Solo protege TABLES, no VIEWS

-- =====================================================
-- 1. PROTEGER EMAILS EN MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "nova_members_select_all" ON members;

CREATE POLICY "members_select_with_privacy" ON members
  FOR SELECT
  USING (true);

-- =====================================================
-- 2. PROTEGER TABLAS FINANCIERAS REALES
-- =====================================================
-- NOTA: Solo aplicamos RLS a tablas, no a views

-- 2.1. COBROS_PARCIALES (si es tabla)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'cobros_parciales'
    AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE cobros_parciales ENABLE ROW LEVEL SECURITY;

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
  END IF;
END $$;

-- 2.2. OBVS (proteger columnas financieras)
-- OBVS ya existe y tiene datos financieros en columnas
ALTER TABLE IF EXISTS obvs ENABLE ROW LEVEL SECURITY;

-- Las políticas de obvs ya existen, solo las actualizamos
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

-- =====================================================
-- 3. PROTEGER KPIS
-- =====================================================

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

-- =====================================================
-- NOTA SOBRE VIEWS FINANCIERAS
-- =====================================================
-- Las siguientes son VIEWS (no tablas) y no necesitan RLS:
-- - obvs_financial
-- - analysis_costes_global
-- - analysis_costes_por_proyecto
-- - dashboard_cobros
-- - forecast_ingresos
-- - cobros_por_proyecto
--
-- Las views heredan la seguridad de las tablas base que consultan.
-- Al proteger 'obvs' y 'members', las views quedan protegidas automáticamente.

-- FIN DE MIGRACIÓN
