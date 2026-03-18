-- ============================================================================
-- MIGRACIÓN 00047 — Fix G9.7 + aislamiento per-step en run_notification_batch
--
-- 1. G9.7 — viability_resolved sin evento previo
--    Root cause:
--      notify_viability_changes emite viability_resolved para CUALQUIER proyecto
--      con viability_status='healthy', incluso si nunca estuvo en critical o
--      monitoring. Un "resolved" sin problema previo destruye la confianza del
--      usuario en las notificaciones.
--
--    Fix: antes de emitir viability_resolved, verificar que exista al menos
--    una notificación viability_critical o viability_monitoring para este
--    proyecto en los últimos 60 días. Si no existe, no emitir.
--
--    Ventana 60 días: cubre el dedup_window de viability_resolved (30 días)
--    con margen suficiente para una recuperación tardía.
--
-- 2. Aislamiento per-step en run_notification_batch
--    Root cause:
--      El loop per-proyecto usaba un único BEGIN...EXCEPTION cubriendo las 5
--      funciones de notify_*. Si la función Nº4 fallaba, PostgreSQL hacía
--      rollback de las notificaciones generadas por las funciones 1-3 (dentro
--      del mismo bloque). Este fue el mecanismo de G9.11 y G9.12 (los bugs
--      previos hacían que TODA la producción de notificaciones se perdiera).
--
--    Fix: cada llamada a notify_* tiene su propio BEGIN...EXCEPTION. Un fallo
--    en una función solo descarta su propio trabajo; los demás steps del mismo
--    proyecto no se ven afectados. El WARNING incluye project_id, nombre de
--    función y SQLERRM para diagnóstico.
-- ============================================================================


-- ── 1. Fix notify_viability_changes — G9.7 ──────────────────────────────────

CREATE OR REPLACE FUNCTION notify_viability_changes(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viability_status  TEXT;
  v_cash_flow_active  BOOLEAN;
  v_project_name      TEXT;
  v_project_url       TEXT;
BEGIN
  SELECT viability_status, t2_cash_flow_active
  INTO   v_viability_status, v_cash_flow_active
  FROM   project_viability_state
  WHERE  project_id = p_project_id;

  IF v_viability_status IS NULL THEN RETURN; END IF;

  SELECT nombre INTO v_project_name FROM projects WHERE id = p_project_id;
  v_project_url := format('/proyecto/%s', p_project_id);

  -- ── L4.1: viability_critical ─────────────────────────────────────────────
  IF v_viability_status = 'critical' THEN
    PERFORM notify_all_project_members(
      p_project_id, 'viability_critical', 'critical',
      'Viabilidad crítica',
      format('"%s" ha entrado en estado de viabilidad crítica. Acción inmediata requerida.',
        v_project_name),
      v_project_url, 'Ver diagnóstico',
      jsonb_build_object('viability_status', v_viability_status),
      3
    );
  END IF;

  -- ── L4.2: viability_monitoring ────────────────────────────────────────────
  IF v_viability_status IN ('monitoring', 'stagnation') THEN
    PERFORM notify_all_project_members(
      p_project_id, 'viability_monitoring', 'medium',
      'Proyecto en vigilancia',
      format('"%s" está en monitoreo de viabilidad. Revisa los indicadores.',
        v_project_name),
      v_project_url, 'Ver indicadores',
      jsonb_build_object('viability_status', v_viability_status),
      7
    );
  END IF;

  -- ── L4.3: viability_resolved ──────────────────────────────────────────────
  -- Fix G9.7: solo emitir si hubo un evento viability_critical o
  -- viability_monitoring en los últimos 60 días. Previene "resolved" espurio
  -- para proyectos que nunca tuvieron un problema registrado.
  IF v_viability_status = 'healthy' THEN
    IF EXISTS (
      SELECT 1 FROM notifications
      WHERE  type IN ('viability_critical', 'viability_monitoring')
        AND  metadata->>'project_id' = p_project_id::text
        AND  created_at > NOW() - INTERVAL '60 days'
    ) THEN
      PERFORM notify_all_project_members(
        p_project_id, 'viability_resolved', 'low',
        'Viabilidad restaurada',
        format('"%s" ha salido del estado de alerta. Viabilidad saludable.',
          v_project_name),
        v_project_url, 'Ver estado',
        jsonb_build_object('viability_status', v_viability_status),
        30
      );
    END IF;
  END IF;

  -- ── L4.4: cash_flow_alert ─────────────────────────────────────────────────
  IF v_cash_flow_active = TRUE THEN
    PERFORM notify_all_project_members(
      p_project_id, 'cash_flow_alert', 'critical',
      'Alerta de flujo de caja',
      format('"%s" tiene un problema activo de flujo de caja (T2). Revisa el estado financiero.',
        v_project_name),
      v_project_url, 'Ver financiero',
      jsonb_build_object('t2_cash_flow_active', TRUE),
      3
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION notify_viability_changes(UUID) IS
  'L4.1–L4.4: viability_critical/monitoring/resolved/cash_flow_alert. '
  'Fix G9.7 (00047): viability_resolved solo se emite si existe notificación '
  'viability_critical o viability_monitoring en los últimos 60 días para '
  'este proyecto — previene "resolved" espurio sin problema previo.';


-- ── 2. Fix run_notification_batch — aislamiento per-step ────────────────────

CREATE OR REPLACE FUNCTION run_notification_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Layer 1: actividad (fuera del loop — sin aislamiento por proyecto)
  PERFORM notify_inactive_leads();
  PERFORM notify_overdue_tasks();
  PERFORM notify_expiring_validations();
  PERFORM notify_inactive_projects();

  -- Layers 2–5: engine events, por proyecto con aislamiento per-step.
  --
  -- Patrón: cada notify_* tiene su propio BEGIN...EXCEPTION.
  -- Si una función falla, solo su propio work se descarta (rollback
  -- del savepoint implícito de ese bloque). Las otras 4 funciones
  -- del mismo proyecto no se ven afectadas.
  --
  -- Fix 00047: antes era un solo BEGIN...EXCEPTION para las 5 funciones,
  -- lo que causaba que un fallo en notify_bottlenecks (G9.11) o en
  -- notify_probability_changes (G9.12) hiciera rollback de TODAS las
  -- notificaciones del proyecto en ese ciclo (layers 2-4 incluidas).
  FOR v_project_id IN
    SELECT id FROM projects WHERE deleted_at IS NULL
  LOOP

    BEGIN
      PERFORM notify_phase_changes(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_batch[notify_phase_changes] project %: %',
        v_project_id, SQLERRM;
    END;

    BEGIN
      PERFORM notify_viability_changes(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_batch[notify_viability_changes] project %: %',
        v_project_id, SQLERRM;
    END;

    BEGIN
      PERFORM notify_risk_changes(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_batch[notify_risk_changes] project %: %',
        v_project_id, SQLERRM;
    END;

    BEGIN
      PERFORM notify_bottlenecks(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_batch[notify_bottlenecks] project %: %',
        v_project_id, SQLERRM;
    END;

    BEGIN
      PERFORM notify_probability_changes(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_batch[notify_probability_changes] project %: %',
        v_project_id, SQLERRM;
    END;

  END LOOP;
END;
$$;

COMMENT ON FUNCTION run_notification_batch() IS
  'Batch completo: Layer 1 (actividad) + Layers 2–5 (engine events por proyecto). '
  'pg_cron cada 6h. Fix 00047: aislamiento per-step — cada notify_* tiene su '
  'propio BEGIN...EXCEPTION con RAISE WARNING(project_id, función, SQLERRM). '
  'Un fallo en una función no descarta las notificaciones de las otras.';
