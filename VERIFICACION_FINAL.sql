-- ============================================================================
-- VERIFICACIÓN FINAL - TODO EL SISTEMA
-- ============================================================================
-- Este script verifica que TODAS las interconexiones y funciones están activas
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║     VERIFICACIÓN FINAL - NOVA HUB SYSTEM CHECK            ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. VERIFICAR TRIGGERS ACTIVOS
-- ============================================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  RAISE NOTICE '1️⃣  VERIFICANDO TRIGGERS...';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name IN (
      'trigger_auto_revenue_from_won_lead',
      'trigger_auto_points_for_task',
      'trigger_notify_okr_at_risk',
      'trigger_update_monthly_metrics',
      'trigger_update_lead_contact',
      'trigger_notify_project_milestone'
    );

  IF v_trigger_count >= 6 THEN
    RAISE NOTICE '  ✅ Triggers activos: % de 6 esperados', v_trigger_count;
  ELSE
    RAISE WARNING '  ⚠️  Solo % triggers encontrados (esperados: 6)', v_trigger_count;
  END IF;

  -- Listar triggers
  RAISE NOTICE '';
  RAISE NOTICE '  Triggers encontrados:';
  FOR v_rec IN (
    SELECT
      trigger_name,
      event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name LIKE 'trigger_%'
    ORDER BY event_object_table
  ) LOOP
    RAISE NOTICE '    - %: %', v_rec.event_object_table, v_rec.trigger_name;
  END LOOP;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 2. VERIFICAR FUNCIONES SQL
-- ============================================================================

DO $$
DECLARE
  v_function_count INTEGER;
BEGIN
  RAISE NOTICE '2️⃣  VERIFICANDO FUNCIONES SQL...';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN (
    'auto_create_revenue_from_won_lead',
    'auto_award_points_for_task',
    'notify_okr_at_risk',
    'update_monthly_metrics_on_transaction',
    'check_leads_without_contact',
    'check_overdue_tasks',
    'check_and_alert_runway',
    'calculate_burn_rate_and_runway',
    'calculate_lead_score_sql'
  );

  IF v_function_count >= 9 THEN
    RAISE NOTICE '  ✅ Funciones encontradas: %', v_function_count;
  ELSE
    RAISE WARNING '  ⚠️  Solo % funciones encontradas', v_function_count;
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 3. VERIFICAR VISTAS (VIEWS)
-- ============================================================================

DO $$
DECLARE
  v_view_count INTEGER;
BEGIN
  RAISE NOTICE '3️⃣  VERIFICANDO VISTAS...';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO v_view_count
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND table_name IN (
      'dashboard_interconnections',
      'financial_health_dashboard',
      'monthly_business_metrics'
    );

  IF v_view_count >= 3 THEN
    RAISE NOTICE '  ✅ Vistas encontradas: %', v_view_count;
  ELSE
    RAISE WARNING '  ⚠️  Solo % vistas encontradas', v_view_count;
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 4. VERIFICAR TABLA POINTS
-- ============================================================================

DO $$
DECLARE
  v_exists BOOLEAN;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '4️⃣  VERIFICANDO SISTEMA DE GAMIFICACIÓN...';
  RAISE NOTICE '';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'points'
  ) INTO v_exists;

  IF v_exists THEN
    SELECT COUNT(*) INTO v_count FROM points;
    RAISE NOTICE '  ✅ Tabla points existe';
    RAISE NOTICE '  📊 Puntos registrados: %', v_count;
  ELSE
    RAISE WARNING '  ❌ Tabla points NO existe';
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 5. VERIFICAR SLACK WEBHOOKS
-- ============================================================================

DO $$
DECLARE
  v_exists BOOLEAN;
  v_count INTEGER;
  v_enabled INTEGER;
BEGIN
  RAISE NOTICE '5️⃣  VERIFICANDO SLACK INTEGRATION...';
  RAISE NOTICE '';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'slack_webhooks'
  ) INTO v_exists;

  IF v_exists THEN
    SELECT COUNT(*) INTO v_count FROM slack_webhooks;
    SELECT COUNT(*) INTO v_enabled FROM slack_webhooks WHERE enabled = true;

    RAISE NOTICE '  ✅ Tabla slack_webhooks existe';
    RAISE NOTICE '  📊 Webhooks totales: %', v_count;
    RAISE NOTICE '  ✅ Webhooks habilitados: %', v_enabled;

    IF v_enabled = 0 THEN
      RAISE NOTICE '  ⚠️  No hay webhooks habilitados - configurar en /integraciones';
    END IF;
  ELSE
    RAISE WARNING '  ❌ Tabla slack_webhooks NO existe';
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 6. TEST DASHBOARD DE INTERCONEXIONES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '6️⃣  VERIFICANDO DASHBOARD DE INTERCONEXIONES...';
  RAISE NOTICE '';
END $$;

SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '  ✅ Dashboard funcionando - Datos:'
    ELSE '  ℹ️  Dashboard sin datos (normal si no hay actividad)'
  END AS status
FROM dashboard_interconnections;

-- Mostrar primeras 5 filas
SELECT
  interconnection_type,
  source_count,
  target_count,
  last_created
FROM dashboard_interconnections
LIMIT 5;

-- ============================================================================
-- 7. TEST FINANCIAL HEALTH
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '7️⃣  VERIFICANDO FINANCIAL HEALTH DASHBOARD...';
  RAISE NOTICE '';
END $$;

SELECT
  total_cash,
  avg_monthly_burn,
  runway_months,
  runway_alert_level,
  'Financial health calculado correctamente' AS status
FROM financial_health_dashboard;

-- ============================================================================
-- 8. VERIFICAR PG_CRON (Scheduled Jobs)
-- ============================================================================

DO $$
DECLARE
  v_exists BOOLEAN;
  v_job_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '8️⃣  VERIFICANDO SCHEDULED JOBS (pg_cron)...';
  RAISE NOTICE '';

  -- Verificar si pg_cron está instalado
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '  ✅ pg_cron está habilitado';

    -- Contar jobs activos
    SELECT COUNT(*) INTO v_job_count
    FROM cron.job
    WHERE jobname IN (
      'check-stale-leads-daily',
      'check-overdue-tasks-daily',
      'check-runway-weekly'
    );

    IF v_job_count > 0 THEN
      RAISE NOTICE '  ✅ Jobs programados: %', v_job_count;
    ELSE
      RAISE NOTICE '  ⚠️  No hay jobs programados - ejecutar: CONFIGURAR_SCHEDULED_JOBS.sql';
    END IF;
  ELSE
    RAISE NOTICE '  ⚠️  pg_cron NO está habilitado';
    RAISE NOTICE '  📋 Acción: Settings → Database → Extensions → pg_cron → Enable';
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 9. VERIFICAR COLUMNAS NECESARIAS
-- ============================================================================

DO $$
DECLARE
  v_missing INTEGER := 0;
BEGIN
  RAISE NOTICE '9️⃣  VERIFICANDO ESTRUCTURA DE TABLAS...';
  RAISE NOTICE '';

  -- Verificar leads.last_contact_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'last_contact_date'
  ) THEN
    RAISE WARNING '  ❌ leads.last_contact_date - FALTA';
    v_missing := v_missing + 1;
  END IF;

  -- Verificar tasks.source_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'source_type'
  ) THEN
    RAISE WARNING '  ❌ tasks.source_type - FALTA';
    v_missing := v_missing + 1;
  END IF;

  -- Verificar financial_metrics.source_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_metrics' AND column_name = 'source_type'
  ) THEN
    RAISE WARNING '  ❌ financial_metrics.source_type - FALTA';
    v_missing := v_missing + 1;
  END IF;

  -- Verificar notifications.category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'category'
  ) THEN
    RAISE WARNING '  ❌ notifications.category - FALTA';
    v_missing := v_missing + 1;
  END IF;

  IF v_missing = 0 THEN
    RAISE NOTICE '  ✅ Todas las columnas necesarias existen';
  ELSE
    RAISE WARNING '  ⚠️  Faltan % columnas - ejecutar: VERIFICAR_Y_PREPARAR_TABLAS.sql', v_missing;
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 10. RESUMEN FINAL
-- ============================================================================

DO $$
DECLARE
  v_triggers INTEGER;
  v_functions INTEGER;
  v_views INTEGER;
  v_score NUMERIC;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                   RESUMEN FINAL                            ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';

  -- Contar componentes
  SELECT COUNT(*) INTO v_triggers
  FROM information_schema.triggers
  WHERE trigger_schema = 'public' AND trigger_name LIKE 'trigger_%';

  SELECT COUNT(*) INTO v_functions
  FROM pg_proc
  WHERE proname IN (
    'auto_create_revenue_from_won_lead',
    'auto_award_points_for_task',
    'check_leads_without_contact',
    'calculate_burn_rate_and_runway'
  );

  SELECT COUNT(*) INTO v_views
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND table_name IN ('dashboard_interconnections', 'financial_health_dashboard');

  -- Calcular score (de 100)
  v_score := (
    (v_triggers::NUMERIC / 6 * 40) +  -- 40% triggers
    (v_functions::NUMERIC / 9 * 30) + -- 30% funciones
    (v_views::NUMERIC / 3 * 30)       -- 30% vistas
  );

  RAISE NOTICE '📊 COMPONENTES ACTIVOS:';
  RAISE NOTICE '  - Triggers: % de 6', v_triggers;
  RAISE NOTICE '  - Funciones: % de 9', v_functions;
  RAISE NOTICE '  - Vistas: % de 3', v_views;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 SCORE DE IMPLEMENTACIÓN: %/100', ROUND(v_score);
  RAISE NOTICE '';

  IF v_score >= 90 THEN
    RAISE NOTICE '✅ SISTEMA COMPLETAMENTE FUNCIONAL';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '  1. Habilitar pg_cron y ejecutar CONFIGURAR_SCHEDULED_JOBS.sql';
    RAISE NOTICE '  2. Deploy edge function: calculate-lead-score';
    RAISE NOTICE '  3. Configurar Slack webhook en /integraciones';
    RAISE NOTICE '  4. Test end-to-end del sistema completo';
  ELSIF v_score >= 70 THEN
    RAISE NOTICE '⚠️  SISTEMA PARCIALMENTE FUNCIONAL';
    RAISE NOTICE '';
    RAISE NOTICE 'Acciones requeridas:';
    RAISE NOTICE '  1. Revisar componentes faltantes arriba';
    RAISE NOTICE '  2. Ejecutar SQL scripts pendientes';
    RAISE NOTICE '  3. Verificar logs de errores';
  ELSE
    RAISE WARNING '❌ SISTEMA INCOMPLETO';
    RAISE NOTICE '';
    RAISE NOTICE 'Ejecutar en orden:';
    RAISE NOTICE '  1. VERIFICAR_Y_PREPARAR_TABLAS.sql';
    RAISE NOTICE '  2. IMPLEMENTAR_INTERCONEXIONES_CRITICAS.sql';
    RAISE NOTICE '  3. CONFIGURAR_SCHEDULED_JOBS.sql';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 11. TESTS OPCIONALES - Comentados para no crear data
-- ============================================================================

-- Si quieres probar las interconexiones, descomenta y ejecuta:

/*
-- TEST A: Crear lead y marcarlo como ganado
INSERT INTO leads (empresa, status, valor_potencial, assignee_id)
VALUES ('Test Lead Final', 'prospecto', 15000, auth.uid())
RETURNING id;

-- Copiar el ID y usarlo aquí:
UPDATE leads
SET status = 'ganado'
WHERE id = 'UUID-DEL-LEAD';

-- Verificar que se creó revenue automáticamente:
SELECT * FROM financial_metrics
WHERE source_type = 'lead'
ORDER BY created_at DESC
LIMIT 1;
*/

/*
-- TEST B: Crear y completar tarea
INSERT INTO tasks (titulo, status, assignee_id)
VALUES ('Test Task Final', 'todo', auth.uid())
RETURNING id;

-- Copiar el ID y usarlo aquí:
UPDATE tasks
SET status = 'done'
WHERE id = 'UUID-DE-TASK';

-- Verificar puntos otorgados:
SELECT * FROM points
WHERE source_type = 'task'
ORDER BY created_at DESC
LIMIT 1;
*/

-- ============================================================================
-- FIN DE VERIFICACIÓN
-- ============================================================================
