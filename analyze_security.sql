-- =====================================================================
-- COMPREHENSIVE SECURITY AUDIT SCRIPT
-- Run this in Supabase SQL Editor to get complete security analysis
-- =====================================================================

-- =====================================================================
-- 1. CHECK ALL TABLES AND THEIR RLS STATUS
-- =====================================================================
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;

-- =====================================================================
-- 2. COUNT POLICIES PER TABLE
-- =====================================================================
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count DESC;

-- =====================================================================
-- 3. LIST ALL POLICIES WITH DETAILS
-- =====================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================================
-- 4. FIND TABLES WITH RLS ENABLED BUT NO POLICIES
-- =====================================================================
SELECT
  t.tablename,
  '⚠️ RLS ENABLED but NO POLICIES' as issue
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = t.schemaname
      AND p.tablename = t.tablename
  )
ORDER BY t.tablename;

-- =====================================================================
-- 5. CHECK ALL SECURITY DEFINER FUNCTIONS
-- =====================================================================
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS is_security_definer,
  p.proconfig AS config_settings,
  CASE
    WHEN p.proconfig::text LIKE '%search_path%' THEN '✅ SAFE'
    ELSE '❌ VULNERABLE'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY security_status, p.proname;

-- =====================================================================
-- 6. LIST ALL VIEWS
-- =====================================================================
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- =====================================================================
-- 7. CHECK FOREIGN KEY RELATIONSHIPS
-- =====================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================================
-- 8. CHECK TRIGGERS
-- =====================================================================
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS trigger_event,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================================
-- 9. SUMMARY STATISTICS
-- =====================================================================
SELECT
  'Total Tables' as metric,
  COUNT(*)::text as value
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Tables with RLS Enabled',
  COUNT(*)::text
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT
  'Tables with RLS Disabled',
  COUNT(*)::text
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
UNION ALL
SELECT
  'Total RLS Policies',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Total SECURITY DEFINER Functions',
  COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prosecdef = true
UNION ALL
SELECT
  'Total Views',
  COUNT(*)::text
FROM pg_views
WHERE schemaname = 'public';
