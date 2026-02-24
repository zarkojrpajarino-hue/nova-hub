-- ============================================
-- CRON JOBS PARA NOTIFICACIONES AUTOMÁTICAS
-- Ejecuta las funciones de notificación en horarios específicos
-- Requiere extensión pg_cron
-- ============================================

-- 1. Habilitar extensión pg_cron (solo si no está habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Job: Leads sin actividad (cada día a las 9am)
SELECT cron.schedule(
  'notify-inactive-leads',
  '0 9 * * *',
  $$SELECT notify_inactive_leads();$$
);

-- 3. Job: Tareas vencidas (cada día a las 8am y 6pm)
SELECT cron.schedule(
  'notify-overdue-tasks-morning',
  '0 8 * * *',
  $$SELECT notify_overdue_tasks();$$
);

SELECT cron.schedule(
  'notify-overdue-tasks-evening',
  '0 18 * * *',
  $$SELECT notify_overdue_tasks();$$
);

-- 4. Job: Validaciones expirando (cada 6 horas)
SELECT cron.schedule(
  'notify-expiring-validations',
  '0 */6 * * *',
  $$SELECT notify_expiring_validations();$$
);

-- 5. Job: Proyectos sin OBVs (cada lunes a las 10am)
SELECT cron.schedule(
  'notify-inactive-projects',
  '0 10 * * 1',
  $$SELECT notify_inactive_projects();$$
);

-- 6. Job: Objetivos cercanos (cada domingo a las 20:00)
SELECT cron.schedule(
  'notify-near-objectives',
  '0 20 * * 0',
  $$SELECT notify_near_objectives();$$
);

-- 7. Limpiar notificaciones archivadas antiguas (cada mes)
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 1 * *',
  $$
    DELETE FROM public.notifications
    WHERE archived = TRUE
      AND created_at < NOW() - INTERVAL '3 months';
  $$
);

-- Ver todos los cron jobs activos
-- SELECT * FROM cron.job;

-- Para desactivar un job:
-- SELECT cron.unschedule('notify-inactive-leads');

COMMENT ON EXTENSION pg_cron IS 'Cron jobs para notificaciones automáticas';
