-- =====================================================
-- FIX SECURITY WARNINGS - SUPABASE
-- =====================================================
-- Arregla los 7 warnings detectados en Supabase Advisor
-- =====================================================

-- =====================================================
-- WARNING 1: Function Search Path Mutable
-- =====================================================
-- PROBLEMA: public.update_updated_at_column no tiene search_path configurado
-- SOLUCIÓN: Recrear la función con SECURITY DEFINER y search_path fijo

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recrear triggers (se eliminaron con CASCADE)
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obvs_updated_at
  BEFORE UPDATE ON public.obvs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_exploration_updated_at
  BEFORE UPDATE ON public.role_exploration_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_preferences_updated_at
  BEFORE UPDATE ON public.role_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- WARNING 2: Extension in Public Schema
-- =====================================================
-- PROBLEMA: pg_trgm está en public schema
-- SOLUCIÓN: Mover a extensions schema (o dejar en public si es necesario)

-- Nota: pg_trgm es necesario para búsquedas de texto completo
-- No lo movemos porque puede romper funcionalidad existente
-- ACEPTAR este warning como conocido

-- =====================================================
-- WARNINGS 3-6: RLS Policy Always True
-- =====================================================
-- PROBLEMA: Políticas con USING(true) son muy permisivas
-- SOLUCIÓN: Restringir políticas para ser más seguras

-- WARNING 3: public.projects
-- Restringir SELECT para que solo vean proyectos donde son miembros
DROP POLICY IF EXISTS projects_select_all ON public.projects;

CREATE POLICY projects_select_member_projects
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    -- Eres el owner
    owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    OR
    -- Eres miembro del proyecto
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = projects.id
        AND pm.member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

-- WARNING 4: public.rate_limits (si existe esta tabla)
-- Verificar si existe primero
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limits') THEN
    EXECUTE 'DROP POLICY IF EXISTS rate_limits_select_all ON public.rate_limits';

    EXECUTE '
      CREATE POLICY rate_limits_select_own
        ON public.rate_limits
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid())
    ';
  END IF;
END $$;

-- WARNING 5: public.tasks
-- Restringir SELECT para que solo vean tareas de sus proyectos
DROP POLICY IF EXISTS tasks_select_all ON public.tasks;

CREATE POLICY tasks_select_project_tasks
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = tasks.project_id
        AND pm.member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

-- WARNING 6: public.user_insights
-- Restringir SELECT para que solo vean sus propios insights
DROP POLICY IF EXISTS user_insights_select_own ON public.user_insights;

CREATE POLICY user_insights_select_own
  ON public.user_insights
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

-- =====================================================
-- WARNING 7: Leaked Password Protection Disabled
-- =====================================================
-- PROBLEMA: La protección contra contraseñas filtradas está desactivada
-- SOLUCIÓN: Habilitar en el dashboard de Supabase

-- IMPORTANTE: Este no se puede arreglar con SQL
-- Debes ir a:
-- Supabase Dashboard → Authentication → Policies → Enable "Leaked Password Protection"

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver políticas actualizadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'tasks', 'user_insights')
ORDER BY tablename, policyname;

-- Ver función actualizada
SELECT
  routine_name,
  routine_type,
  security_type,
  external_language
FROM information_schema.routines
WHERE routine_name = 'update_updated_at_column'
  AND routine_schema = 'public';

-- =====================================================
-- ✅ WARNINGS ARREGLADOS
-- =====================================================
-- ✅ 1. Function Search Path Mutable - FIXED
-- ⚠️ 2. Extension in Public - ACEPTADO (necesario)
-- ✅ 3. RLS Policy Always True (projects) - FIXED
-- ✅ 4. RLS Policy Always True (rate_limits) - FIXED
-- ✅ 5. RLS Policy Always True (tasks) - FIXED
-- ✅ 6. RLS Policy Always True (user_insights) - FIXED
-- 📝 7. Leaked Password Protection - MANUAL (ver arriba)
-- =====================================================
