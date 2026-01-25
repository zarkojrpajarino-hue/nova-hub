-- =====================================================================
-- Script de Verificación: RLS Policies Aplicadas Correctamente
-- =====================================================================
-- Ejecuta este script DESPUÉS de aplicar las migrations RLS
-- para verificar que todo está configurado correctamente
-- =====================================================================

-- =====================================================================
-- TEST 1: Verificar que TODAS las tablas tienen RLS habilitado
-- =====================================================================

SELECT
  'TEST 1: Verificación de RLS Habilitado' as test,
  '' as resultado;

SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ Protegida'
    ELSE '❌ SIN PROTECCIÓN'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'activity_log', 'kpis', 'kpi_validaciones', 'projects',
    'project_members', 'obv_validaciones', 'obv_participantes',
    'profiles', 'objectives', 'notifications',
    'leads', 'obvs', 'tasks', 'badges', 'key_results'
  )
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO: Todas las filas deben mostrar rls_enabled = true


-- =====================================================================
-- TEST 2: Contar Policies por Tabla
-- =====================================================================

SELECT
  'TEST 2: Conteo de Policies por Tabla' as test,
  '' as resultado;

SELECT
  tablename,
  COUNT(*) as num_policies,
  CASE
    WHEN COUNT(*) >= 2 THEN '✅ OK'
    WHEN COUNT(*) = 1 THEN '⚠️ Pocas policies'
    ELSE '❌ Sin policies'
  END as estado
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ✅ RESULTADO ESPERADO:
-- - activity_log: 2+ policies
-- - kpis: 3+ policies
-- - projects: 3+ policies
-- - notifications: 4+ policies


-- =====================================================================
-- TEST 3: Verificar Policies Críticas Específicas
-- =====================================================================

SELECT
  'TEST 3: Verificación de Policies Críticas' as test,
  '' as resultado;

SELECT
  tablename,
  policyname,
  cmd as operacion,
  CASE
    WHEN roles @> ARRAY['authenticated'::name] THEN '✅ Para usuarios autenticados'
    WHEN roles @> ARRAY['service_role'::name] THEN '🔧 Solo service role'
    ELSE '⚠️ Roles: ' || array_to_string(roles, ', ')
  END as permisos
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('activity_log', 'notifications', 'profiles', 'project_members')
ORDER BY tablename, policyname;


-- =====================================================================
-- TEST 4: Verificar Funciones Helper
-- =====================================================================

SELECT
  'TEST 4: Funciones Helper Necesarias' as test,
  '' as resultado;

SELECT
  proname as funcion,
  pg_get_function_arguments(oid) as argumentos,
  CASE
    WHEN proname = 'get_member_id' THEN '✅ Necesaria para RLS'
    WHEN proname = 'audit_table_changes' THEN '✅ Audit logging'
    WHEN proname = 'get_audit_history' THEN '✅ Query helper'
    ELSE '✅ Disponible'
  END as estado
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_member_id',
    'audit_table_changes',
    'get_audit_history',
    'get_user_audit_log',
    'detect_suspicious_activity'
  )
ORDER BY proname;

-- ✅ RESULTADO ESPERADO: Al menos get_member_id debe existir


-- =====================================================================
-- TEST 5: Verificar que las Policies Usan las Funciones Correctas
-- =====================================================================

SELECT
  'TEST 5: Verificación de Expresiones en Policies' as test,
  '' as resultado;

-- Buscar policies que usan get_member_id (crítico para RLS)
SELECT
  tablename,
  policyname,
  'Usa get_member_id()' as verificacion,
  '✅ OK' as estado
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual::text LIKE '%get_member_id%'
    OR with_check::text LIKE '%get_member_id%'
  )
ORDER BY tablename, policyname
LIMIT 10;


-- =====================================================================
-- TEST 6: Detectar Tablas SIN Policies (Vulnerables)
-- =====================================================================

SELECT
  'TEST 6: Tablas con RLS Habilitado pero SIN Policies (VULNERABLES)' as test,
  '' as resultado;

SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  COALESCE(p.policy_count, 0) as num_policies,
  CASE
    WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) = 0 THEN '❌ VULNERABLE (RLS sin policies)'
    WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) > 0 THEN '✅ Protegida'
    WHEN NOT t.rowsecurity THEN '❌ SIN RLS'
    ELSE '⚠️ Revisar'
  END as estado
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
ORDER BY
  CASE
    WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) = 0 THEN 1
    WHEN NOT t.rowsecurity THEN 2
    ELSE 3
  END,
  t.tablename;

-- ⚠️ ALERTA: Si aparecen tablas con "VULNERABLE", necesitan policies


-- =====================================================================
-- TEST 7: Verificar View members_public (Protección de Emails)
-- =====================================================================

SELECT
  'TEST 7: View members_public (Protección de Privacidad)' as test,
  '' as resultado;

SELECT
  schemaname,
  viewname,
  definition as definicion_parcial
FROM pg_views
WHERE viewname = 'members_public'
  AND schemaname = 'public';

-- ✅ RESULTADO ESPERADO: El view debe existir y ocultar emails de otros usuarios


-- =====================================================================
-- RESUMEN FINAL
-- =====================================================================

SELECT
  'RESUMEN FINAL' as seccion,
  '' as resultado;

WITH stats AS (
  SELECT
    COUNT(*) FILTER (WHERE rowsecurity) as tablas_con_rls,
    COUNT(*) as total_tablas,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') as tablas_con_policies
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
)
SELECT
  tablas_con_rls || ' de ' || total_tablas || ' tablas tienen RLS habilitado' as rls_status,
  total_policies || ' policies creadas en ' || tablas_con_policies || ' tablas' as policies_status,
  CASE
    WHEN tablas_con_rls >= 25 AND total_policies >= 80 THEN '✅ SEGURIDAD ÓPTIMA'
    WHEN tablas_con_rls >= 20 AND total_policies >= 50 THEN '✅ SEGURIDAD BUENA'
    WHEN tablas_con_rls >= 10 THEN '⚠️ SEGURIDAD PARCIAL'
    ELSE '❌ INSEGURO'
  END as calificacion_general
FROM stats;


-- =====================================================================
-- INSTRUCCIONES DE INTERPRETACIÓN
-- =====================================================================

/*
✅ TODO CORRECTO SI:
1. Test 1: Todas las tablas críticas muestran "✅ Protegida"
2. Test 2: Todas las tablas tienen al menos 2 policies
3. Test 3: Policies existen para usuarios autenticados
4. Test 4: Función get_member_id() existe
5. Test 5: Varias policies usan get_member_id()
6. Test 6: NO aparecen tablas VULNERABLES
7. Resumen Final: "✅ SEGURIDAD ÓPTIMA" o "✅ SEGURIDAD BUENA"

❌ PROBLEMAS SI:
- Test 1: Alguna tabla muestra "❌ SIN PROTECCIÓN"
  → Aplicar migration: 20260125_enable_rls_missing_tables.sql

- Test 2: Alguna tabla tiene 0 policies
  → Revisar y crear policies para esa tabla

- Test 6: Aparecen tablas "VULNERABLE"
  → Tablas tienen RLS pero no policies = ACCESO DENEGADO TOTAL
  → Crear policies apropiadas

- Resumen Final: "❌ INSEGURO"
  → Aplicar todas las migrations RLS pendientes
*/
