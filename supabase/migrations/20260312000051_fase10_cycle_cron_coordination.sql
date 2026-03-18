-- ============================================================
-- 20260312000051_fase10_cycle_cron_coordination.sql
--
-- R10.1 + R10.5: Trigger automático del ciclo y coordinación Weekly Loop vs Ritual.
--
-- Qué hace esta migración:
--   1. Modifica generate_all_weekly_reviews() para skipear proyectos en semana 4
--      del ciclo estratégico (semana 4 = ritual reemplaza el loop semanal)
--   2. Crea run_strategic_cycle_checks() — backstop semanal de ciclos estratégicos
--   3. Crea cron nuevo: lunes 08:00 UTC → run_strategic_cycle_checks()
--
-- Diseño de coordinación:
--   Sunday 23:30 UTC  → generate_all_weekly_reviews() (semanas 1-3 del ciclo)
--   Monday 08:00 UTC  → run_strategic_cycle_checks()  (semana 4 + auto-cierre)
--
-- Definición de "semana 4":
--   CURRENT_DATE >= (end_date - 6)
--   = los últimos 7 días del ciclo de 28 días.
--   Durante la semana 4 no se genera weekly_review; se espera el ritual.
--
-- Auto-cierre por cron (backstop):
--   a) Ritual completado (ritual_responses IS NOT NULL) y ciclo vencido (end_date < TODAY):
--      → close_strategic_cycle('scheduled') — el founder hizo el ritual, el cron cierra.
--      (submit_strategic_reset() ya debería haberlo cerrado; esto es un safety net.)
--   b) Ciclo vencido + sin ritual + grace period de 7 días superado:
--      → close_strategic_cycle('scheduled') — se cierra automáticamente sin ritual.
--
-- Referencias: STRATEGIC_RESET_RITUAL.md, SYSTEM_OVERVIEW.md
-- ============================================================


-- ── 1. generate_all_weekly_reviews(): skip semana 4 ──────────────────────────
--
-- Cambio respecto a migración 00034:
-- El SELECT de proyectos excluye los que están en su semana 4 (últimos 7 días del ciclo).
-- Proyectos sin ciclo activo (sc.id IS NULL) se incluyen en el review como fallback.
-- El resto del cuerpo es idéntico al original.

CREATE OR REPLACE FUNCTION generate_all_weekly_reviews()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  FOR v_project_id IN
    SELECT p.id
    FROM   projects p
    LEFT JOIN strategic_cycles sc
      ON  sc.project_id = p.id
      AND sc.closed_at  IS NULL
    WHERE p.deleted_at IS NULL
      -- R10.5: Excluir proyectos en semana 4 del ciclo (últimos 7 días).
      -- En semana 4 el ritual reemplaza el loop semanal.
      -- Proyectos sin ciclo activo (sc.id IS NULL) reciben review normalmente.
      AND (sc.id IS NULL OR CURRENT_DATE < sc.end_date - 6)
  LOOP
    BEGIN
      PERFORM generate_weekly_review_for_project(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'weekly_review: failed for project %: %', v_project_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION generate_all_weekly_reviews() IS
  'Genera weekly_review para todos los proyectos activos, excepto los en semana 4 '
  'del ciclo estratégico (últimos 7 días). '
  'En semana 4 el ritual estratégico reemplaza el loop semanal (R10.5). '
  'Cron: Sunday 23:30 UTC (weekly-reviews-generator, migración 00034). '
  'Proyectos sin ciclo activo siempre reciben review. '
  'Versión original: migración 00034. Modificada en 00051 para coordinación R10.5.';


-- ── 2. run_strategic_cycle_checks() ──────────────────────────────────────────
--
-- Backstop semanal de ciclos estratégicos.
-- Cierra ciclos vencidos (ya con ritual o tras grace period sin ritual).
-- No genera notificaciones aquí — las notificaciones de "semana de ritual"
-- van en la capa de notificaciones (R10.2, pendiente).
--
-- Orden de ejecución:
--   a) Safety net: ciclos con ritual done y vencidos (deberían estar cerrados por submit,
--      este cron es backstop).
--   b) Auto-cierre sin ritual: vencidos + 7 días de grace period superados.

CREATE OR REPLACE FUNCTION run_strategic_cycle_checks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row    RECORD;
  v_result TEXT;
BEGIN

  -- ── a) Safety net: ritual completado + ciclo vencido ─────────────────────
  -- submit_strategic_reset() ya debería haber cerrado estos ciclos.
  -- Si llegan aquí, hubo un error en el cierre manual o se envió ritual_responses
  -- directamente sin llamar submit_strategic_reset().
  FOR v_row IN
    SELECT project_id
    FROM   strategic_cycles
    WHERE  ritual_responses IS NOT NULL
      AND  closed_at        IS NULL
      AND  end_date         < CURRENT_DATE
    ORDER BY end_date ASC
  LOOP
    BEGIN
      v_result := close_strategic_cycle(v_row.project_id, 'scheduled');
      RAISE NOTICE 'cycle_checks [safety_net]: project % closed with evaluation %',
        v_row.project_id, v_result;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'cycle_checks [safety_net]: failed for project %: %',
        v_row.project_id, SQLERRM;
    END;
  END LOOP;

  -- ── b) Auto-cierre sin ritual: grace period superado ─────────────────────
  -- Proyectos que no completaron el ritual después de 7 días de haber vencido el ciclo.
  -- Se cierra el ciclo automáticamente para que el proyecto pueda continuar.
  -- cycle_evaluation se calculará sobre el engine_snapshot aunque no haya ritual_responses.
  FOR v_row IN
    SELECT project_id
    FROM   strategic_cycles
    WHERE  ritual_responses IS NULL
      AND  closed_at        IS NULL
      AND  end_date + 7     < CURRENT_DATE
    ORDER BY end_date ASC
  LOOP
    BEGIN
      v_result := close_strategic_cycle(v_row.project_id, 'scheduled');
      RAISE NOTICE 'cycle_checks [auto_close]: project % closed without ritual, evaluation %',
        v_row.project_id, v_result;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'cycle_checks [auto_close]: failed for project %: %',
        v_row.project_id, SQLERRM;
    END;
  END LOOP;

END;
$$;

COMMENT ON FUNCTION run_strategic_cycle_checks() IS
  'R10.1 + R10.5. Backstop semanal de ciclos estratégicos. '
  'Cierra ciclos vencidos con ritual completado (safety net para submit fallido). '
  'Auto-cierra ciclos sin ritual tras 7 días de grace period (close_reason=scheduled). '
  'Cron: Monday 08:00 UTC (cycle-checks, definido abajo). '
  'No genera notificaciones — eso corresponde a R10.2 (capa de notificaciones). '
  'Ver close_strategic_cycle() en migración 00050 para la lógica de cierre.';


-- ── 3. Cron: lunes 08:00 UTC → run_strategic_cycle_checks() ──────────────────
--
-- Timing: Lunes 08:00 UTC corre DESPUÉS del weekly reviews (Domingo 23:30 UTC).
-- Orden de ejecución semanal:
--   Dom 23:30 → weekly reviews (semanas 1-3 del ciclo)
--   Lun 08:00 → cycle checks (auto-cierre de ciclos vencidos)

SELECT cron.unschedule('cycle-checks')
FROM cron.job
WHERE jobname = 'cycle-checks';

SELECT cron.schedule(
  'cycle-checks',
  '0 8 * * 1',
  $$ SELECT run_strategic_cycle_checks() $$
);


-- ── Notas de implementación ───────────────────────────────────────────────────
--
-- R10.2 (integración Optimus con el ritual) → pendiente migración 00052.
-- La notificación de "semana de ritual" para el founder se implementará en R10.2.
-- Hasta entonces: no hay notificación activa cuando empieza la semana 4.
--
-- R10.1 completado por esta migración + 00050:
-- El trigger automático funciona vía:
-- (1) submit_strategic_reset() → cierre manual inmediato (founder completa ritual)
-- (2) run_strategic_cycle_checks() → cierre automático (grace period o safety net)
--
-- Comportamiento en semana 4 para el founder:
-- - No recibe weekly review (skippeado en generate_all_weekly_reviews)
-- - El ritual aparece como acción pendiente (implementación UI → FASE 11)
-- - Si no completa el ritual en 7 días, el ciclo se cierra automáticamente sin ritual_responses
--
-- Grace period de 7 días:
-- Elegido para coincidir con una semana natural de margen.
-- Si el proyecto cierra el ritual a las 23:59 del día 7 de grace period, el cron
-- del lunes siguiente no lo cerrará (ya estará cerrado por submit_strategic_reset).
-- Si no lo cierra, el lunes del día 8+ lo cierra el cron automáticamente.
