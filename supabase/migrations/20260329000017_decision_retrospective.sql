-- =============================================================================
-- SR10.V2.3 -- Decision retrospective loop: outcome columns + notification
--
-- 1. Add outcome_summary TEXT and outcome_at TIMESTAMPTZ to decision_events
-- 2. Create check_decision_retrospectives() that notifies for high-importance
--    decisions older than 30 days without outcome
-- 3. Add to run_notification_batch()
--
-- Note: decision_retrospectives table already exists (migration 20260326000018).
-- These columns add direct outcome tracking on decision_events itself for
-- lightweight queries without joining decision_retrospectives.
-- =============================================================================

-- ── 1. Add columns to decision_events ───────────────────────────────────────

ALTER TABLE decision_events
  ADD COLUMN IF NOT EXISTS outcome_summary TEXT,
  ADD COLUMN IF NOT EXISTS outcome_at      TIMESTAMPTZ;

COMMENT ON COLUMN decision_events.outcome_summary IS
  'SR10.V2.3: resumen del resultado de la decision, rellenado por el founder a los 30d.';
COMMENT ON COLUMN decision_events.outcome_at IS
  'SR10.V2.3: cuando se registro el outcome.';

-- ── 2. check_decision_retrospectives ────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_decision_retrospectives()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec   RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find high-importance decisions (strategic_change, structural_change) older
  -- than 30 days without outcome, that have not been notified in 7 days.
  FOR v_rec IN
    SELECT
      de.id,
      de.project_id,
      de.title,
      p.nombre AS project_name
    FROM decision_events de
    JOIN projects p ON de.project_id = p.id AND p.deleted_at IS NULL
    WHERE de.decision_category IN ('strategic_change', 'structural_change')
      AND de.outcome_summary IS NULL
      AND de.decided_at <= NOW() - INTERVAL '30 days'
  LOOP
    v_count := v_count + notify_all_project_members(
      v_rec.project_id,
      'decision_retrospective',
      'medium',
      format('Como resulto la decision: %s?', v_rec.title),
      format('Hace mas de 30 dias tomaste la decision "%s". Es momento de evaluar como resulto.', v_rec.title),
      format('/proyecto/%s?tab=decisiones&decision=%s', v_rec.project_id, v_rec.id),
      'Evaluar resultado',
      jsonb_build_object(
        'decision_event_id', v_rec.id,
        'decision_title',    v_rec.title,
        'project_name',      v_rec.project_name
      ),
      7  -- dedup window: 7 days
    );
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION check_decision_retrospectives() IS
  'SR10.V2.3: notifica para decisiones estrategicas >30d sin outcome. Dedup 7d. Tipo: decision_retrospective, prioridad: medium.';

-- ── 3. Extend run_notification_batch ────────────────────────────────────────

CREATE OR REPLACE FUNCTION run_notification_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Layer 1: actividad
  PERFORM notify_inactive_leads();
  PERFORM notify_overdue_tasks();
  PERFORM notify_expiring_validations();
  PERFORM notify_inactive_projects();

  -- N7.V2.1: overdue tasks warning
  PERFORM notify_overdue_tasks_warning();

  -- SR10.V2.3: decision retrospective reminders
  PERFORM check_decision_retrospectives();

  -- Layers 2-5: engine events (por proyecto)
  FOR v_project_id IN
    SELECT id FROM projects WHERE deleted_at IS NULL
  LOOP
    BEGIN
      PERFORM notify_phase_changes(v_project_id);
      PERFORM notify_viability_changes(v_project_id);
      PERFORM notify_risk_changes(v_project_id);
      PERFORM notify_bottlenecks(v_project_id);
      PERFORM notify_probability_changes(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_batch: failed for project %: %', v_project_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION run_notification_batch() IS
  'Batch completo: Layer 1 + N7.V2.1 + SR10.V2.3 + Layers 2-5. pg_cron cada 6h.';
