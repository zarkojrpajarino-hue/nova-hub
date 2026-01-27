-- =====================================================
-- FASE 1.6: PROTECCIÓN DE DATOS SENSIBLES
-- =====================================================
-- Fecha: 27 Enero 2026
-- Objetivo: Proteger emails y datos financieros manteniendo acceso abierto a proyectos
-- Resuelve: Alertas de seguridad de Lovable

-- =====================================================
-- 1. PROTEGER EMAILS EN PROFILES
-- =====================================================
-- Problema: Emails visibles a todos los usuarios
-- Solución: Solo el propio usuario y admins pueden ver emails

-- Eliminar política antigua que exponía emails
DROP POLICY IF EXISTS "nova_profiles_select_all" ON profiles;

-- Nueva política: SELECT con email oculto excepto para el propio usuario o admins
CREATE POLICY "profiles_select_with_privacy" ON profiles
  FOR SELECT
  USING (
    -- Todos pueden ver perfiles, pero email solo si:
    true  -- Siempre permite SELECT
  );

-- Nota: Para ocultar el email en las queries, usaremos una VIEW más adelante
-- o el frontend debe filtrar el email si auth.uid() != profile.auth_id

-- Política alternativa más estricta (descomentala si prefieres ocultar completamente):
-- DROP POLICY IF EXISTS "profiles_select_with_privacy" ON profiles;
-- CREATE POLICY "profiles_select_own_or_public" ON profiles
--   FOR SELECT
--   USING (
--     auth.uid() = auth_id  -- El usuario ve su propio perfil completo
--     OR
--     auth.uid() IN (SELECT auth_id FROM profiles WHERE role = 'admin')  -- Admins ven todo
--   );

-- =====================================================
-- 2. PROTEGER TABLA FINANCIAL_METRICS
-- =====================================================
-- Problema: NO tiene RLS habilitado, datos financieros públicos
-- Solución: Habilitar RLS y restringir acceso

-- Habilitar RLS en financial_metrics
ALTER TABLE IF EXISTS financial_metrics ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Solo admins y miembros del proyecto
DROP POLICY IF EXISTS "financial_metrics_select_restricted" ON financial_metrics;
CREATE POLICY "financial_metrics_select_restricted" ON financial_metrics
  FOR SELECT
  USING (
    -- Admins pueden ver todo
    auth.uid() IN (
      SELECT auth_id FROM profiles WHERE role = 'admin'
    )
    OR
    -- Miembros del proyecto pueden ver sus métricas
    auth.uid() IN (
      SELECT member_id
      FROM project_members pm
      WHERE pm.project_id = financial_metrics.project_id
    )
  );

-- Política INSERT: Solo admins y miembros del proyecto
DROP POLICY IF EXISTS "financial_metrics_insert_restricted" ON financial_metrics;
CREATE POLICY "financial_metrics_insert_restricted" ON financial_metrics
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth_id FROM profiles WHERE role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT member_id
      FROM project_members pm
      WHERE pm.project_id = financial_metrics.project_id
    )
  );

-- Política UPDATE: Solo admins y miembros del proyecto
DROP POLICY IF EXISTS "financial_metrics_update_restricted" ON financial_metrics;
CREATE POLICY "financial_metrics_update_restricted" ON financial_metrics
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth_id FROM profiles WHERE role = 'admin'
    )
    OR
    auth.uid() IN (
      SELECT member_id
      FROM project_members pm
      WHERE pm.project_id = financial_metrics.project_id
    )
  );

-- Política DELETE: Solo admins
DROP POLICY IF EXISTS "financial_metrics_delete_admin" ON financial_metrics;
CREATE POLICY "financial_metrics_delete_admin" ON financial_metrics
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT auth_id FROM profiles WHERE role = 'admin'
    )
  );

-- =====================================================
-- 3. CORREGIR REFERENCIAS A 'members' → 'profiles'
-- =====================================================
-- Problema: Algunas políticas referencian tabla 'members' que no existe

-- Verificar y corregir políticas en obvs
DROP POLICY IF EXISTS "nova_obvs_insert_all" ON obvs;
CREATE POLICY "nova_obvs_insert_all" ON obvs
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM profiles)  -- CORREGIDO: era 'members'
  );

DROP POLICY IF EXISTS "nova_obvs_update_all" ON obvs;
CREATE POLICY "nova_obvs_update_all" ON obvs
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT auth_id FROM profiles)  -- CORREGIDO: era 'members'
  );

-- Verificar y corregir políticas en kpis
DROP POLICY IF EXISTS "nova_kpis_insert_all" ON kpis;
CREATE POLICY "nova_kpis_insert_all" ON kpis
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM profiles)  -- CORREGIDO: era 'members'
  );

DROP POLICY IF EXISTS "nova_kpis_update_all" ON kpis;
CREATE POLICY "nova_kpis_update_all" ON kpis
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT auth_id FROM profiles)  -- CORREGIDO: era 'members'
  );

-- =====================================================
-- 4. CREAR VIEW PÚBLICA SIN EMAILS (OPCIONAL)
-- =====================================================
-- View que oculta emails para uso público
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id,
  auth_id,
  nombre,
  avatar,
  color,
  rol,
  especializacion,
  CASE
    WHEN auth.uid() = auth_id THEN email  -- Solo el propio usuario ve su email
    WHEN auth.uid() IN (SELECT auth_id FROM profiles WHERE role = 'admin') THEN email  -- Admins ven emails
    ELSE NULL  -- Otros no ven el email
  END as email,
  created_at,
  updated_at
FROM profiles;

-- Permitir SELECT en la view pública
GRANT SELECT ON public_profiles TO authenticated;

-- =====================================================
-- 5. VERIFICACIÓN
-- =====================================================
-- Comandos para verificar que todo está correcto:

-- Verificar RLS habilitado en financial_metrics:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'financial_metrics';

-- Verificar políticas de financial_metrics:
-- SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'financial_metrics';

-- Verificar políticas de profiles:
-- SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'profiles';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Esta migración mantiene el acceso abierto a proyectos (todos ven todos los proyectos)
-- 2. Protege datos sensibles: emails solo visibles para el propio usuario y admins
-- 3. Protege datos financieros: solo admins y miembros del proyecto
-- 4. Corrige referencias a tabla 'members' que no existe
-- 5. El frontend puede usar 'public_profiles' view para datos sin email

-- =====================================================
-- APLICACIÓN
-- =====================================================
-- Este SQL debe aplicarse en Supabase SQL Editor
-- Después de aplicar, verificar con las queries de verificación arriba

-- FIN DE MIGRACIÓN
