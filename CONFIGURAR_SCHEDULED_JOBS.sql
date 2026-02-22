-- ============================================================================
-- CONFIGURAR SCHEDULED JOBS - Automatización Completa
-- ============================================================================
-- Este SQL configura trabajos programados que se ejecutan automáticamente
-- usando pg_cron para verificaciones diarias/semanales
-- ============================================================================

-- ============================================================================
-- 1. Habilitar extensión pg_cron (si no está habilitada)
-- ============================================================================

-- Nota: pg_cron debe estar habilitado en Supabase Dashboard
-- Settings → Database → Extensions → pg_cron → Enable

-- Verificar si pg_cron está disponible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    RAISE NOTICE '⚠️  pg_cron no está habilitado. Ir a: Settings → Database → Extensions → pg_cron';
  ELSE
    RAISE NOTICE '✅ pg_cron está habilitado';
  END IF;
END $$;

-- ============================================================================
-- 2. Limpiar jobs anteriores (si existen)
-- ============================================================================

-- Eliminar jobs anteriores para evitar duplicados
SELECT cron.unschedule('check-stale-leads-daily');
SELECT cron.unschedule('check-overdue-tasks-daily');
SELECT cron.unschedule('check-runway-weekly');

-- ============================================================================
-- 3. JOB 1: Verificar leads sin contacto (DIARIO a las 9:00 AM)
-- ============================================================================

SELECT cron.schedule(
  'check-stale-leads-daily',
  '0 9 * * *', -- Cron expression: 9:00 AM todos los días
  $$
  SELECT check_leads_without_contact();
  $$
);

RAISE NOTICE '✅ Job programado: Verificar leads sin contacto (diario 9:00 AM)';

-- ============================================================================
-- 4. JOB 2: Verificar tareas vencidas (DIARIO a las 10:00 AM)
-- ============================================================================

SELECT cron.schedule(
  'check-overdue-tasks-daily',
  '0 10 * * *', -- Cron expression: 10:00 AM todos los días
  $$
  SELECT check_overdue_tasks();
  $$
);

RAISE NOTICE '✅ Job programado: Verificar tareas vencidas (diario 10:00 AM)';

-- ============================================================================
-- 5. JOB 3: Verificar runway financiero (SEMANAL lunes 8:00 AM)
-- ============================================================================

SELECT cron.schedule(
  'check-runway-weekly',
  '0 8 * * 1', -- Cron expression: 8:00 AM todos los lunes
  $$
  SELECT check_and_alert_runway();
  $$
);

RAISE NOTICE '✅ Job programado: Verificar runway financiero (lunes 8:00 AM)';

-- ============================================================================
-- 6. Verificar jobs programados
-- ============================================================================

-- Ver todos los jobs activos
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname IN ('check-stale-leads-daily', 'check-overdue-tasks-daily', 'check-runway-weekly')
ORDER BY jobname;

-- ============================================================================
-- 7. TESTING - Ejecutar manualmente para probar
-- ============================================================================

-- Test 1: Verificar leads sin contacto
SELECT check_leads_without_contact();

-- Test 2: Verificar tareas vencidas
SELECT check_overdue_tasks();

-- Test 3: Verificar runway financiero
SELECT check_and_alert_runway();

-- ============================================================================
-- 8. Ver historial de ejecuciones (últimas 24 horas)
-- ============================================================================

SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC
LIMIT 20;

-- ============================================================================
-- 9. CONFIGURACIÓN DE TIMEZONE (Importante)
-- ============================================================================

-- pg_cron usa UTC por defecto
-- Si quieres horario local español (CET/CEST), ajusta las horas:
-- - 9:00 AM CET = 8:00 AM UTC en invierno
-- - 9:00 AM CEST = 7:00 AM UTC en verano

-- Ejemplo: Para 9:00 AM hora española
-- Invierno (CET = UTC+1): '0 8 * * *'
-- Verano (CEST = UTC+2): '0 7 * * *'

-- ============================================================================
-- 10. DOCUMENTACIÓN DE CRON EXPRESSIONS
-- ============================================================================

-- Formato: minute hour day month weekday
--
-- Ejemplos:
-- '0 9 * * *'     → 9:00 AM todos los días
-- '0 10 * * *'    → 10:00 AM todos los días
-- '0 8 * * 1'     → 8:00 AM todos los lunes
-- '0 0 1 * *'     → Medianoche el día 1 de cada mes
-- '*/15 * * * *'  → Cada 15 minutos
-- '0 */6 * * *'   → Cada 6 horas
--
-- Weekdays: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

-- ============================================================================
-- 11. TROUBLESHOOTING
-- ============================================================================

-- Si un job no se ejecuta:

-- 1. Verificar que pg_cron está habilitado:
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 2. Ver errores en los jobs:
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 10;

-- 3. Ver jobs activos:
SELECT * FROM cron.job WHERE active = true;

-- 4. Ejecutar manualmente para debug:
SELECT check_leads_without_contact();

-- 5. Ver logs de Supabase:
-- Ir a: Supabase Dashboard → Logs → Postgres Logs

-- ============================================================================
-- 12. DESACTIVAR/REACTIVAR JOBS
-- ============================================================================

-- Desactivar un job (sin eliminarlo):
-- UPDATE cron.job SET active = false WHERE jobname = 'check-stale-leads-daily';

-- Reactivar un job:
-- UPDATE cron.job SET active = true WHERE jobname = 'check-stale-leads-daily';

-- Eliminar un job completamente:
-- SELECT cron.unschedule('check-stale-leads-daily');

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCHEDULED JOBS CONFIGURADOS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Jobs activos:';
  RAISE NOTICE '  1. check-stale-leads-daily → 9:00 AM diario';
  RAISE NOTICE '  2. check-overdue-tasks-daily → 10:00 AM diario';
  RAISE NOTICE '  3. check-runway-weekly → 8:00 AM lunes';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '  - pg_cron debe estar habilitado en Extensions';
  RAISE NOTICE '  - Horarios en UTC (ajustar según tu zona)';
  RAISE NOTICE '  - Ver ejecuciones: SELECT * FROM cron.job_run_details;';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximo paso:';
  RAISE NOTICE '  - Desplegar edge function: calculate-lead-score';
  RAISE NOTICE '';
END $$;
