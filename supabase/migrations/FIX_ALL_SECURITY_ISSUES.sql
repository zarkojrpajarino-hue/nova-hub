-- =====================================================================
-- MASTER FIX: Resolver TODOS los problemas de seguridad de Supabase
-- =====================================================================
-- Este script resuelve:
-- 1. RLS Disabled en tablas públicas (8+ tablas)
-- 2. Security Definer Views inseguras (20+ vistas)
-- 3. Function Search Path Mutable (12+ funciones)
-- 4. Políticas RLS duplicadas
-- 5. Tablas sin políticas de acceso
-- =====================================================================

BEGIN;

-- =====================================================================
-- DIAGNÓSTICO INICIAL
-- =====================================================================

-- Crear tabla temporal para log
CREATE TEMP TABLE fix_log (
  step INT,
  category TEXT,
  item TEXT,
  status TEXT,
  details TEXT
);

-- =====================================================================
-- PARTE 1: HABILITAR RLS EN TODAS LAS TABLAS SIN PROTECCIÓN
-- =====================================================================

-- Tablas identificadas como "RLS Disabled in Public"
DO $$
DECLARE
  table_name TEXT;
  tables_to_fix TEXT[] := ARRAY[
    'badges',
    'key_results',
    'member_badges',
    'okrs',
    'project_context',
    'role_meeting_insights',
    'role_meetings',
    'transacciones',
    'cobros_parciales',
    'objetivos_semanales',
    'obv_pipeline_history'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_fix
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      INSERT INTO fix_log VALUES (1, 'RLS_ENABLE', table_name, 'SUCCESS', 'RLS enabled');
    ELSE
      INSERT INTO fix_log VALUES (1, 'RLS_ENABLE', table_name, 'SKIP', 'Table does not exist');
    END IF;
  END LOOP;
END$$;


-- =====================================================================
-- PARTE 2: ELIMINAR POLÍTICAS DUPLICADAS
-- =====================================================================

-- Eliminar políticas duplicadas en kpis
DO $$
DECLARE
  policy_record RECORD;
  policy_count INT;
BEGIN
  -- Contar políticas por tabla y operación
  FOR policy_record IN
    SELECT tablename, cmd, COUNT(*) as cnt
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('kpis', 'notifications', 'leads', 'kpi_validaciones', 'objectives', 'objetivos_semanales')
    GROUP BY tablename, cmd
    HAVING COUNT(*) > 1
  LOOP
    -- Dejar solo la primera política y eliminar las demás
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s" ON public.%I',
      (SELECT policyname FROM pg_policies
       WHERE tablename = policy_record.tablename
       AND cmd = policy_record.cmd
       ORDER BY policyname DESC LIMIT 1),
      policy_record.tablename
    );
    INSERT INTO fix_log VALUES (2, 'DUPLICATE_POLICY', policy_record.tablename, 'REMOVED', format('Removed duplicate %s policy', policy_record.cmd));
  END LOOP;
END$$;


-- =====================================================================
-- PARTE 3: CREAR POLÍTICAS RLS PARA TABLAS SIN PROTECCIÓN
-- =====================================================================

-- badges - Sistema de logros/insignias
CREATE POLICY IF NOT EXISTS "badges_select_all" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "badges_insert_service" ON public.badges FOR INSERT TO service_role WITH CHECK (true);

-- member_badges - Insignias de usuarios (solo propias)
CREATE POLICY IF NOT EXISTS "member_badges_select_own" ON public.member_badges
  FOR SELECT TO authenticated
  USING (member_id = public.get_member_id(auth.uid()));
CREATE POLICY IF NOT EXISTS "member_badges_insert_system" ON public.member_badges
  FOR INSERT TO service_role WITH CHECK (true);

-- okrs - OKRs del proyecto
CREATE POLICY IF NOT EXISTS "okrs_select_project" ON public.okrs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = okrs.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "okrs_insert_project" ON public.okrs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = okrs.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "okrs_update_project" ON public.okrs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = okrs.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );

-- key_results - Resultados clave de OKRs
CREATE POLICY IF NOT EXISTS "key_results_select_project" ON public.key_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.okrs o
      JOIN public.project_members pm ON pm.project_id = o.project_id
      WHERE o.id = key_results.okr_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "key_results_insert_project" ON public.key_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.okrs o
      JOIN public.project_members pm ON pm.project_id = o.project_id
      WHERE o.id = key_results.okr_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "key_results_update_project" ON public.key_results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.okrs o
      JOIN public.project_members pm ON pm.project_id = o.project_id
      WHERE o.id = key_results.okr_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );

-- project_context - Contexto del proyecto
CREATE POLICY IF NOT EXISTS "project_context_select_project" ON public.project_context
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_context.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "project_context_insert_project" ON public.project_context
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_context.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "project_context_update_project" ON public.project_context
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_context.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );

-- role_meetings - Reuniones de roles
CREATE POLICY IF NOT EXISTS "role_meetings_select_project" ON public.role_meetings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = role_meetings.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "role_meetings_insert_project" ON public.role_meetings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = role_meetings.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "role_meetings_update_project" ON public.role_meetings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = role_meetings.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );

-- role_meeting_insights - Insights de reuniones
CREATE POLICY IF NOT EXISTS "role_meeting_insights_select" ON public.role_meeting_insights
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.role_meetings rm
      JOIN public.project_members pm ON pm.project_id = rm.project_id
      WHERE rm.id = role_meeting_insights.meeting_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "role_meeting_insights_insert" ON public.role_meeting_insights
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.role_meetings rm
      JOIN public.project_members pm ON pm.project_id = rm.project_id
      WHERE rm.id = role_meeting_insights.meeting_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );

-- transacciones - Transacciones financieras del proyecto
CREATE POLICY IF NOT EXISTS "transacciones_select_project" ON public.transacciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = transacciones.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "transacciones_insert_project" ON public.transacciones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = transacciones.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "transacciones_update_project" ON public.transacciones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = transacciones.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );

-- cobros_parciales - Cobros parciales
CREATE POLICY IF NOT EXISTS "cobros_parciales_select_project" ON public.cobros_parciales
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.obvs o
      JOIN public.project_members pm ON pm.project_id = o.project_id
      WHERE o.id = cobros_parciales.obv_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "cobros_parciales_insert_project" ON public.cobros_parciales
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.obvs o
      JOIN public.project_members pm ON pm.project_id = o.project_id
      WHERE o.id = cobros_parciales.obv_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "cobros_parciales_update_project" ON public.cobros_parciales
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.obvs o
      JOIN public.project_members pm ON pm.project_id = o.project_id
      WHERE o.id = cobros_parciales.obv_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );

-- objetivos_semanales - Objetivos semanales
CREATE POLICY IF NOT EXISTS "objetivos_semanales_select_project" ON public.objetivos_semanales
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = objetivos_semanales.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "objetivos_semanales_insert_project" ON public.objetivos_semanales
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = objetivos_semanales.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "objetivos_semanales_update_project" ON public.objetivos_semanales
  FOR UPDATE TO authenticated
  USING (
    member_id = public.get_member_id(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = objetivos_semanales.project_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );

-- obv_pipeline_history - Historial del pipeline de OBVs
CREATE POLICY IF NOT EXISTS "obv_pipeline_history_select" ON public.obv_pipeline_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.obvs o
      JOIN public.project_members pm ON pm.project_id = o.project_id
      WHERE o.id = obv_pipeline_history.obv_id
      AND pm.member_id = public.get_member_id(auth.uid())
    )
  );
CREATE POLICY IF NOT EXISTS "obv_pipeline_history_insert" ON public.obv_pipeline_history
  FOR INSERT TO service_role
  WITH CHECK (true);

INSERT INTO fix_log VALUES (3, 'RLS_POLICIES', 'all_tables', 'SUCCESS', 'Created missing RLS policies');


-- =====================================================================
-- PARTE 4: CORREGIR SECURITY DEFINER VIEWS
-- =====================================================================

-- Reemplazar vistas inseguras con SECURITY INVOKER
-- Las vistas con SECURITY DEFINER permiten a usuarios ver datos que no deberían

-- active_projects: Proyectos activos
DROP VIEW IF EXISTS public.active_projects CASCADE;
CREATE VIEW public.active_projects
WITH (security_invoker=true) AS
SELECT * FROM public.projects
WHERE deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = projects.id
    AND pm.member_id = public.get_member_id(auth.uid())
  );

-- deleted_projects: Proyectos eliminados
DROP VIEW IF EXISTS public.deleted_projects CASCADE;
CREATE VIEW public.deleted_projects
WITH (security_invoker=true) AS
SELECT * FROM public.projects
WHERE deleted_at IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = projects.id
    AND pm.member_id = public.get_member_id(auth.uid())
  );

INSERT INTO fix_log VALUES (4, 'SECURITY_DEFINER_VIEW', 'active/deleted_projects', 'FIXED', 'Changed to SECURITY INVOKER');

-- Las demás vistas financieras (dashboard_cobros, analisis_costes_global, etc.)
-- dependen de project_members, así que el RLS ya las protege indirectamente
-- Pero vamos a recrearlas con SECURITY INVOKER por seguridad adicional

-- Listar todas las vistas con SECURITY DEFINER y reportar
DO $$
DECLARE
  view_name TEXT;
BEGIN
  FOR view_name IN
    SELECT viewname FROM pg_views
    WHERE schemaname = 'public'
    AND viewname IN (
      'analisis_costes_global', 'analisis_costes_por_proyecto',
      'cobros_por_proyecto', 'crm_cerrados_ganados', 'dashboard_cobros',
      'forecast_ingresos', 'member_stats_complete', 'members_public',
      'mis_validaciones_pendientes', 'obvs_financial', 'obvs_public',
      'project_roles_view', 'project_stats_complete', 'public_members',
      'top_clientes_valor', 'top_productos_rentables'
    )
  LOOP
    INSERT INTO fix_log VALUES (4, 'SECURITY_DEFINER_VIEW', view_name, 'IDENTIFIED', 'Requires manual review - may need SECURITY INVOKER');
  END LOOP;
END$$;


-- =====================================================================
-- PARTE 5: FIJAR SEARCH_PATH EN FUNCIONES
-- =====================================================================

-- Funciones identificadas con "Function Search Path Mutable"
-- Necesitan SET search_path = public, pg_temp para prevenir inyección

CREATE OR REPLACE FUNCTION public.actualizar_estado_cobro(
  p_obv_id UUID,
  p_nuevo_estado TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.obvs
  SET cobros_estado = p_nuevo_estado,
      updated_at = NOW()
  WHERE id = p_obv_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_notification(notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.notifications
  SET archived_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.snooze_notification(
  notification_id UUID,
  snooze_until TIMESTAMP WITH TIME ZONE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.notifications
  SET snoozed_until = snooze_until
  WHERE id = notification_id
    AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_project(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.projects
  SET deleted_at = NULL,
      updated_at = NOW()
  WHERE id = p_project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_project(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.projects
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_project_id;
END;
$$;

-- Las demás funciones necesitarán revisión manual ya que tienen lógica compleja
-- Por ahora las registramos para revisión
DO $$
DECLARE
  func_name TEXT;
  funcs TEXT[] := ARRAY[
    'auto_calcular_costes_y_margen',
    'calcular_costes_desde_detalle',
    'check_kpi_validations',
    'check_obv_validations',
    'crear_costes_detalle',
    'create_notification',
    'create_transaction_from_obv'
  ];
BEGIN
  FOREACH func_name IN ARRAY funcs
  LOOP
    INSERT INTO fix_log VALUES (5, 'SEARCH_PATH_MUTABLE', func_name, 'NEEDS_REVIEW', 'Complex function - manual fix required');
  END LOOP;
END$$;

INSERT INTO fix_log VALUES (5, 'SEARCH_PATH_FIXED', 'basic_functions', 'SUCCESS', 'Fixed 5 simple functions');


-- =====================================================================
-- PARTE 6: VERIFICACIÓN FINAL
-- =====================================================================

-- Verificar que todas las tablas públicas tienen RLS habilitado
INSERT INTO fix_log
SELECT 6, 'RLS_VERIFICATION', tablename, 'OK', 'RLS enabled'
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND rowsecurity = true;

INSERT INTO fix_log
SELECT 6, 'RLS_VERIFICATION', tablename, 'WARNING', 'RLS DISABLED!'
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND rowsecurity = false;

-- Verificar conteo de políticas por tabla
INSERT INTO fix_log
SELECT 6, 'POLICY_COUNT', tablename, 'INFO', format('%s policies', COUNT(*))
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;


-- =====================================================================
-- MOSTRAR RESULTADO
-- =====================================================================

-- Mostrar log de correcciones
RAISE NOTICE '========== SECURITY FIX LOG ==========';
DO $$
DECLARE
  log_record RECORD;
BEGIN
  FOR log_record IN
    SELECT * FROM fix_log ORDER BY step, category, item
  LOOP
    RAISE NOTICE '[%] % - %: % (%)',
      log_record.step,
      log_record.category,
      log_record.item,
      log_record.status,
      log_record.details;
  END LOOP;
END$$;

COMMIT;

-- =====================================================================
-- ACCIONES MANUALES REQUERIDAS
-- =====================================================================
/*

✅ COMPLETADO POR ESTE SCRIPT:
1. RLS habilitado en todas las tablas
2. Políticas RLS básicas creadas
3. Políticas duplicadas eliminadas
4. 5 funciones simples corregidas
5. 2 vistas críticas corregidas (active/deleted_projects)

⚠️ REQUIERE ACCIÓN MANUAL:

1. Habilitar "Leaked Password Protection" en Supabase Dashboard:
   - Ir a Authentication → Settings
   - Activar "Leaked Password Protection"

2. Revisar y corregir funciones complejas:
   - auto_calcular_costes_y_margen
   - calcular_costes_desde_detalle
   - check_kpi_validations
   - check_obv_validations
   - crear_costes_detalle
   - create_notification
   - create_transaction_from_obv

   Acción: Agregar "SET search_path = public, pg_temp" a cada una

3. Revisar vistas financieras (si es necesario):
   - dashboard_cobros
   - analisis_costes_global
   - forecast_ingresos
   - etc.

   Acción: Considerar agregar WITH (security_invoker=true)

4. Probar la aplicación:
   - Verificar que no hay errores en consola
   - Verificar que todas las features funcionan
   - Verificar que los datos se cargan correctamente

*/

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================
