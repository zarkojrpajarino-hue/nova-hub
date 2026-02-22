/**
 * CRON JOB - AUTO ROTATION DE ROLES
 *
 * Ejecuta auto_rotate_to_next_role cada día a las 00:00 UTC
 * para rotar automáticamente los roles de usuarios en Fase 1
 * cuando finaliza su período de exploración (1 semana)
 */

-- Habilitar la extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Eliminar trabajos previos con el mismo nombre (si existen)
SELECT cron.unschedule('auto-rotate-roles-daily');

-- Crear cron job que se ejecuta diariamente a las 00:00 UTC
SELECT cron.schedule(
  'auto-rotate-roles-daily',           -- Nombre del job
  '0 0 * * *',                         -- Cron expression: todos los días a medianoche UTC
  $$
  SELECT auto_rotate_to_next_role();
  $$
);

-- Verificar que el cron job se creó correctamente
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'auto-rotate-roles-daily';

/**
 * NOTAS:
 *
 * 1. Este cron job se ejecutará automáticamente cada día a las 00:00 UTC
 *
 * 2. La función auto_rotate_to_next_role() se encarga de:
 *    - Detectar exploraciones finalizadas (end_date < NOW())
 *    - Marcarlas como completadas
 *    - Asignar el siguiente rol automáticamente (Fase 1)
 *    - Transicionar a Fase 2 después de 4 roles explorados
 *    - Calcular top 2 roles y transicionar a Fase 3
 *
 * 3. Para verificar las ejecuciones del cron job:
 *    SELECT * FROM cron.job_run_details
 *    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-rotate-roles-daily')
 *    ORDER BY start_time DESC LIMIT 10;
 *
 * 4. Para ejecutar manualmente (útil para testing):
 *    SELECT auto_rotate_to_next_role();
 *
 * 5. Para desactivar el cron job sin eliminarlo:
 *    UPDATE cron.job SET active = false WHERE jobname = 'auto-rotate-roles-daily';
 *
 * 6. Para reactivarlo:
 *    UPDATE cron.job SET active = true WHERE jobname = 'auto-rotate-roles-daily';
 *
 * 7. Para eliminar el cron job completamente:
 *    SELECT cron.unschedule('auto-rotate-roles-daily');
 */
