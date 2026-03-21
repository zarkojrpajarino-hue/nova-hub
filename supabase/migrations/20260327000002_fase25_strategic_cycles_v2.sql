-- =============================================================================
-- MIGRACIÓN FASE 25 — Ciclos Estratégicos v2
--
-- Evoluciona strategic_cycles de "contenedor de 4 semanas con snapshot" a
-- "ciclo estratégico de 90 días con objetivos IA".
--
-- Cambios:
--   1. ALTER strategic_cycles: añadir columnas de ciclos v2
--   2. CREATE cycle_objective_progress: tracking por objetivo
--   3. CREATE compute_cycle_score(): RPC para calcular score ponderado
--   4. RLS para cycle_objective_progress
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PASO 1 — ALTER strategic_cycles: añadir columnas v2
-- ---------------------------------------------------------------------------

-- Relajar cycle_index para permitir Ciclo 0 (Estabilización)
ALTER TABLE strategic_cycles
  DROP CONSTRAINT IF EXISTS strategic_cycles_cycle_index_check;
ALTER TABLE strategic_cycles
  ADD CONSTRAINT strategic_cycles_cycle_index_check
  CHECK (cycle_index >= 0);

-- Nuevas columnas para ciclos estratégicos
ALTER TABLE strategic_cycles
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS objectives JSONB,
  ADD COLUMN IF NOT EXISTS cycle_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'revised', 'abandoned', 'paused')),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS previous_cycle_id UUID REFERENCES strategic_cycles(id),
  ADD COLUMN IF NOT EXISTS generation_context JSONB;

-- Migrar ciclos v1 cerrados a status='completed'
UPDATE strategic_cycles
SET    status = 'completed'
WHERE  closed_at IS NOT NULL
  AND  status = 'active';

-- Índice para buscar ciclo activo rápido
CREATE INDEX IF NOT EXISTS idx_strategic_cycles_active
  ON strategic_cycles (project_id, status)
  WHERE status = 'active';

-- Constraint: máximo 1 ciclo active por proyecto
-- (usa partial unique index en vez de constraint porque PostgreSQL lo soporta)
CREATE UNIQUE INDEX IF NOT EXISTS idx_strategic_cycles_one_active
  ON strategic_cycles (project_id)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- PASO 2 — cycle_objective_progress
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cycle_objective_progress (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id      UUID        NOT NULL REFERENCES strategic_cycles(id) ON DELETE CASCADE,
  objective_id  TEXT        NOT NULL,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value         NUMERIC     NOT NULL,
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_cycle_obj_progress_cycle
  ON cycle_objective_progress (cycle_id, objective_id, recorded_at DESC);

COMMENT ON TABLE cycle_objective_progress IS
  'FASE 25: Tracking de progreso por objetivo dentro de un ciclo estratégico. Registrado por cron semanal o manualmente.';

-- RLS
ALTER TABLE cycle_objective_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cycle_objective_progress: project members can read"
  ON cycle_objective_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM strategic_cycles sc
      JOIN project_members pm ON pm.project_id = sc.project_id
      WHERE sc.id = cycle_objective_progress.cycle_id
        AND pm.member_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "cycle_objective_progress: project members can insert"
  ON cycle_objective_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM strategic_cycles sc
      JOIN project_members pm ON pm.project_id = sc.project_id
      WHERE sc.id = cycle_objective_progress.cycle_id
        AND pm.member_id = (SELECT id FROM members WHERE auth_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- PASO 3 — compute_cycle_score(cycle_id)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compute_cycle_score(p_cycle_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_objectives   JSONB;
  v_obj          JSONB;
  v_total_score  NUMERIC := 0;
  v_weight       NUMERIC;
  v_target       NUMERIC;
  v_current      NUMERIC;
  v_obj_score    NUMERIC;
BEGIN
  SELECT objectives INTO v_objectives
  FROM   strategic_cycles
  WHERE  id = p_cycle_id;

  IF v_objectives IS NULL OR jsonb_array_length(v_objectives) = 0 THEN
    RETURN 0;
  END IF;

  FOR v_obj IN SELECT * FROM jsonb_array_elements(v_objectives)
  LOOP
    v_weight  := COALESCE((v_obj ->> 'weight')::NUMERIC, 0);
    v_target  := COALESCE((v_obj ->> 'target_value')::NUMERIC, 1);
    v_current := COALESCE((v_obj ->> 'current_value')::NUMERIC, 0);

    -- Evitar división por 0
    IF v_target <= 0 THEN
      v_obj_score := 0;
    ELSE
      v_obj_score := LEAST(100.0, (v_current / v_target) * 100.0);
    END IF;

    v_total_score := v_total_score + (v_obj_score * v_weight);
  END LOOP;

  RETURN ROUND(v_total_score, 2);
END;
$$;

COMMENT ON FUNCTION compute_cycle_score(UUID) IS
  'FASE 25: Calcula cycle_score ponderado de los objetivos JSONB. obj_score = MIN(100, current/target * 100). cycle_score = SUM(obj_score * weight).';

-- ---------------------------------------------------------------------------
-- PASO 4 — Trigger: pausar ciclo activo cuando graduated pasa a FALSE
-- CE25.8: Si graduated cambia TRUE→FALSE, pausar el ciclo activo del proyecto.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pause_cycle_on_degraduation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo actuar cuando graduated cambia de TRUE a FALSE
  IF OLD.graduated = TRUE AND NEW.graduated = FALSE THEN
    UPDATE strategic_cycles
    SET    status = 'paused'
    WHERE  project_id = NEW.project_id
      AND  status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pause_cycle_on_degraduation ON project_phase_state;
CREATE TRIGGER trg_pause_cycle_on_degraduation
  AFTER UPDATE OF graduated ON project_phase_state
  FOR EACH ROW
  EXECUTE FUNCTION pause_cycle_on_degraduation();
