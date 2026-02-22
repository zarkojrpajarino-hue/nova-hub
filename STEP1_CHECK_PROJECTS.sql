-- PASO 1.2: Verificar si existe la tabla projects
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = 'projects'
) AS projects_exists;
