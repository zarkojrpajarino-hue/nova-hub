-- PASO 1.1: Verificar tablas existentes
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%onboarding%';
