-- =============================================
-- ARREGLAR TODAS LAS POLÍTICAS RLS - COMPLETO
-- =============================================

-- Listar todas las tablas
DO $$
DECLARE
  tabla RECORD;
BEGIN
  FOR tabla IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
  LOOP
    -- Habilitar RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tabla.tablename);
    
    -- Eliminar políticas existentes
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can view" ON %I', tabla.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can insert" ON %I', tabla.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update" ON %I', tabla.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete" ON %I', tabla.tablename);
    
    -- Crear políticas permisivas
    EXECUTE format('CREATE POLICY "Authenticated users can view" ON %I FOR SELECT TO authenticated USING (true)', tabla.tablename);
    EXECUTE format('CREATE POLICY "Authenticated users can insert" ON %I FOR INSERT TO authenticated WITH CHECK (true)', tabla.tablename);
    EXECUTE format('CREATE POLICY "Authenticated users can update" ON %I FOR UPDATE TO authenticated USING (true)', tabla.tablename);
    EXECUTE format('CREATE POLICY "Authenticated users can delete" ON %I FOR DELETE TO authenticated USING (true)', tabla.tablename);
    
    RAISE NOTICE 'Políticas aplicadas a tabla: %', tabla.tablename;
  END LOOP;
END $$;

-- Verificar
SELECT 'Todas las políticas RLS han sido aplicadas' as status;
