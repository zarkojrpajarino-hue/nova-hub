-- =====================================================================
-- Verificación de Estructura de Base de Datos
-- =====================================================================
-- Ejecuta este script COMPLETO en Supabase SQL Editor
-- Copia todos los resultados para determinar las soluciones exactas
-- =====================================================================

-- =====================================================================
-- TEST 1: ¿Existe la tabla financial_metrics?
-- =====================================================================

SELECT
  'TEST 1: Tabla financial_metrics' as test,
  '' as resultado;

SELECT
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'financial_metrics'
  ) as financial_metrics_exists,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'financial_metrics'
    ) THEN '✅ Tabla existe - necesita RLS'
    ELSE '❌ Tabla NO existe - ignorar error de Lovable'
  END as estado;


-- =====================================================================
-- TEST 2: Estructura de project_members (¿tiene columna role?)
-- =====================================================================

SELECT
  'TEST 2: Columnas de project_members' as test,
  '' as resultado;

SELECT
  column_name,
  data_type,
  is_nullable,
  CASE
    WHEN column_name = 'role' THEN '✅ Columna role existe - podemos usar roles'
    WHEN column_name = 'member_id' THEN '✅ Necesaria para policies'
    WHEN column_name = 'project_id' THEN '✅ Necesaria para policies'
    ELSE '📋 Otra columna'
  END as importancia
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'project_members'
ORDER BY ordinal_position;


-- =====================================================================
-- TEST 3: Columnas financieras en tabla obvs
-- =====================================================================

SELECT
  'TEST 3: Columnas financieras en obvs' as test,
  '' as resultado;

SELECT
  column_name,
  data_type,
  is_nullable,
  '💰 Dato financiero sensible' as tipo
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'obvs'
  AND column_name IN (
    'numero_factura',
    'cantidad_a_cobrar',
    'margen',
    'datos_bancarios',
    'facturacion',
    'costes',
    'precio_unitario',
    'total_invoice'
  )
ORDER BY ordinal_position;


-- =====================================================================
-- TEST 4: ¿Existe tabla user_roles o roles?
-- =====================================================================

SELECT
  'TEST 4: Tablas de roles del sistema' as test,
  '' as resultado;

SELECT
  table_name,
  CASE
    WHEN table_name = 'user_roles' THEN '✅ Podemos usar para control de acceso'
    WHEN table_name = 'roles' THEN '✅ Definiciones de roles disponibles'
    WHEN table_name = 'member_roles' THEN '✅ Roles por miembro'
    ELSE '📋 Tabla de roles'
  END as proposito
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%role%'
ORDER BY table_name;


-- =====================================================================
-- TEST 5: Policies actuales en tabla members
-- =====================================================================

SELECT
  'TEST 5: Policies actuales en tabla members' as test,
  '' as resultado;

SELECT
  policyname,
  cmd as operacion,
  roles,
  CASE
    WHEN policyname LIKE '%select%' THEN '⚠️ Policy de lectura - revisar si oculta emails'
    WHEN policyname LIKE '%update%' THEN '✅ Policy de actualización'
    ELSE '📋 Otra policy'
  END as tipo
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'members'
ORDER BY policyname;


-- =====================================================================
-- TEST 6: ¿Existe el view members_public?
-- =====================================================================

SELECT
  'TEST 6: View members_public' as test,
  '' as resultado;

SELECT
  viewname,
  '✅ View para privacidad de emails ya existe' as estado
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'members_public'
UNION ALL
SELECT
  'members_public' as viewname,
  '❌ View NO existe - necesita crearse' as estado
WHERE NOT EXISTS (
  SELECT FROM pg_views
  WHERE schemaname = 'public'
    AND viewname = 'members_public'
);


-- =====================================================================
-- TEST 7: Permisos en tabla members
-- =====================================================================

SELECT
  'TEST 7: Permisos de tabla members' as test,
  '' as resultado;

SELECT
  grantee,
  privilege_type,
  CASE
    WHEN grantee = 'authenticated' AND privilege_type = 'SELECT' THEN '⚠️ Usuarios autenticados pueden hacer SELECT directo'
    WHEN grantee = 'authenticated' AND privilege_type = 'UPDATE' THEN '✅ UPDATE permitido (normal)'
    ELSE '📋 Otro permiso'
  END as implicacion
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'members'
ORDER BY grantee, privilege_type;


-- =====================================================================
-- TEST 8: Estructura completa de financial_metrics (si existe)
-- =====================================================================

SELECT
  'TEST 8: Columnas de financial_metrics (si existe)' as test,
  '' as resultado;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'financial_metrics'
ORDER BY ordinal_position;


-- =====================================================================
-- TEST 9: RLS habilitado en tablas críticas
-- =====================================================================

SELECT
  'TEST 9: Estado RLS de tablas críticas' as test,
  '' as resultado;

SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ RLS habilitado'
    ELSE '❌ RLS DESHABILITADO'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('members', 'obvs', 'financial_metrics')
ORDER BY tablename;


-- =====================================================================
-- RESUMEN: Qué datos necesitamos
-- =====================================================================

/*
📋 DESPUÉS DE EJECUTAR ESTE SCRIPT, NECESITO QUE ME COMPARTAS:

1. ✅ TEST 1: ¿Existe financial_metrics?
   → Si existe, crearemos policies
   → Si NO existe, ignoraremos ese error de Lovable

2. ✅ TEST 2: ¿project_members tiene columna 'role'?
   → Si existe, podemos hacer restricción por roles
   → Si NO existe, haremos restricción diferente

3. ✅ TEST 3: ¿Qué columnas financieras tiene obvs?
   → Para saber exactamente qué ocultar

4. ✅ TEST 4: ¿Hay tablas de roles?
   → Para implementar control de acceso basado en roles

5. ✅ TEST 6: ¿Existe members_public view?
   → Si ya existe, solo necesitamos forzar su uso
   → Si NO existe, lo crearemos

6. ✅ TEST 7: ¿authenticated tiene SELECT en members?
   → Si tiene SELECT directo, necesitamos revocarlo
   → Para forzar uso de members_public view

Con esta información, prepararé el SQL EXACTO para resolver cada error.
*/
