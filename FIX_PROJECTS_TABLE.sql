-- =============================================
-- FIX PROJECTS TABLE SCHEMA
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Verificar columnas existentes en la tabla projects
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
ORDER BY ordinal_position;

-- 2. Agregar columna created_by si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'projects'
          AND column_name = 'created_by'
    ) THEN
        ALTER TABLE projects ADD COLUMN created_by UUID REFERENCES profiles(id);
        RAISE NOTICE 'Columna created_by agregada';
    ELSE
        RAISE NOTICE 'Columna created_by ya existe';
    END IF;
END $$;

-- 3. Agregar columna onboarding_data si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'projects'
          AND column_name = 'onboarding_data'
    ) THEN
        ALTER TABLE projects ADD COLUMN onboarding_data JSONB;
        RAISE NOTICE 'Columna onboarding_data agregada';
    ELSE
        RAISE NOTICE 'Columna onboarding_data ya existe';
    END IF;
END $$;

-- 4. Verificar que la tabla profiles existe
SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
) AS profiles_exists;

-- 5. Verificar las políticas RLS de projects
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'projects';

-- 6. Mensaje final
SELECT 'Verificación completada. Revisa los resultados arriba.' AS status;
