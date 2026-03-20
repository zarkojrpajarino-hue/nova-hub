-- SR10.V2.3 — Decision retrospective loop
--
-- Seguimiento de outcome a los 30 días de cada decisión estratégica.
-- La tabla captura qué pasó con la decisión 30d después y si fue acertada.
--
-- Flujo:
--   1. decision_events INSERT con event_type = 'strategic_decision'
--      → trigger crea automáticamente un retrospective_due en 30d
--   2. A los 30d, el banner en UI muestra decisiones pendientes de retrospectiva
--   3. Founder completa: outcome_text + was_correct (bool) + filled_at
--
-- Nota: NO usamos pg_cron para el recordatorio — el frontend lo computa
-- comparando retrospective_due_at <= NOW() AND filled_at IS NULL

-- ── 1. Tabla ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS decision_retrospectives (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  decision_event_id     UUID        REFERENCES decision_events(id) ON DELETE SET NULL,
  decision_summary      TEXT        NOT NULL,   -- texto de la decisión original
  decision_made_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retrospective_due_at  TIMESTAMPTZ NOT NULL,   -- decision_made_at + 30d
  -- Outcome (rellenado por el founder)
  outcome_text          TEXT,                   -- qué pasó realmente
  was_correct           BOOLEAN,               -- ¿la decisión fue acertada?
  filled_at             TIMESTAMPTZ,           -- cuándo se completó la retrospectiva
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_retro_project
  ON decision_retrospectives (project_id, retrospective_due_at DESC);

CREATE INDEX IF NOT EXISTS idx_decision_retro_pending
  ON decision_retrospectives (project_id, filled_at)
  WHERE filled_at IS NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE decision_retrospectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decision_retrospectives: member access"
  ON decision_retrospectives FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE member_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE member_id = auth.uid()
      UNION
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

-- ── 2. Trigger: auto-crear retrospectiva al insertar decisión estratégica ─────

CREATE OR REPLACE FUNCTION trg_fn_decision_retrospective_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo para decisiones estratégicas explícitas
  IF NEW.event_type = 'strategic_decision' THEN
    INSERT INTO decision_retrospectives (
      project_id,
      decision_event_id,
      decision_summary,
      decision_made_at,
      retrospective_due_at
    ) VALUES (
      NEW.project_id,
      NEW.id,
      COALESCE(NEW.payload->>'summary', NEW.payload->>'title', 'Decisión estratégica'),
      NEW.created_at,
      NEW.created_at + INTERVAL '30 days'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decision_retrospective_create ON decision_events;
CREATE TRIGGER trg_decision_retrospective_create
  AFTER INSERT ON decision_events
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_decision_retrospective_create();

COMMENT ON TABLE decision_retrospectives IS
  'SR10.V2.3: seguimiento de outcome a los 30 días de cada decisión estratégica. '
  'retrospective_due_at = decision_made_at + 30d. '
  'filled_at IS NULL indica que la retrospectiva está pendiente de completar.';
