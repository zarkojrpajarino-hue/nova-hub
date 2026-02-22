-- Verificar estado actual de la base de datos

-- 1. Ver qué tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar si existen las tablas del sistema de rotación
SELECT
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'role_exploration_periods') as has_exploration,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'role_preferences') as has_preferences,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'role_performance_metrics') as has_performance,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'role_rotation_history') as has_rotation;

-- 3. Ver columnas de project_members para verificar si tiene campos de rotación
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'project_members'
ORDER BY ordinal_position;

-- 4. Verificar RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Contar usuarios existentes
SELECT COUNT(*) as total_members FROM public.members;

-- 6. Ver usuarios que existen
SELECT id, email, nombre, especialization, role FROM public.members;
