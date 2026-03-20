-- AUD.M.1 — Strategic Reset: apuesta fallida
--
-- Una "apuesta estratégica" es un decision_event con event_type='strategic_decision'.
-- Se invalida cuando la evidencia posterior contradice la hipótesis de la decisión.
--
-- Señales de invalidación (cualquiera de estas):
--   1. Probabilidad actual < probabilidad en momento de decisión - 15pp
--   2. risk_level escaló de 'low'/'medium' a 'high'/'critical' tras la decisión
--   3. El founder la marca manualmente como invalidada
--
-- Flujo:
--   1. check_bet_invalidations(p_project_id) detecta bets invalidadas
--   2. Inserta en strategic_bet_invalidations con evidence JSONB
--   3. Crea un strategic_block tipo 'bet_invalidation' para surface en UI
--   4. pg_cron diario ejecuta refresh_bet_invalidations() para todos los proyectos

-- ── 1. Tabla ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS strategic_bet_invalidations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  decision_event_id     UUID        REFERENCES decision_events(id) ON DELETE SET NULL,
  decision_summary      TEXT        NOT NULL,
  decision_made_at      TIMESTAMPTZ NOT NULL,
  -- Señal que disparó la invalidación
  invalidation_reason   TEXT        NOT NULL CHECK (invalidation_reason IN (
                           'probability_drop',   -- prob cayó ≥15pp vs momento de decisión
                           'risk_escalation',    -- riesgo subió a high/critical
                           'manual'              -- founder lo marcó manualmente
                         )),
  evidence              JSONB       NOT NULL DEFAULT '{}',  -- datos concretos de la invalidación
  -- Cierre de loop: strategic_block generado
  strategic_block_id    UUID        REFERENCES strategic_blocks(id) ON DELETE SET NULL,
  -- Resolución
  acknowledged_at       TIMESTAMPTZ,  -- founder reconoció la invalidación
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sbi_decision_reason
  ON strategic_bet_invalidations (decision_event_id, invalidation_reason)
  WHERE decision_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sbi_project
  ON strategic_bet_invalidations (project_id, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE strategic_bet_invalidations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "strategic_bet_invalidations: member access"
  ON strategic_bet_invalidations FOR ALL
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

-- ── 2. Función principal de chequeo ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_bet_invalidations(p_project_id UUID)
RETURNS INTEGER  -- nº de invalidaciones nuevas detectadas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_decision     RECORD;
  v_prob_current NUMERIC;
  v_prob_at_dec  NUMERIC;
  v_risk_current TEXT;
  v_block_id     UUID;
  v_new_count    INTEGER := 0;
BEGIN
  -- Probabilidad actual del proyecto
  SELECT probability INTO v_prob_current
  FROM   project_probability
  WHERE  project_id = p_project_id;

  -- Risk level actual
  SELECT risk_level INTO v_risk_current
  FROM   project_risk_score
  WHERE  project_id = p_project_id;

  -- Iterar sobre todas las decisiones estratégicas del proyecto
  FOR v_decision IN
    SELECT de.id, de.payload, de.created_at
    FROM   decision_events de
    WHERE  de.project_id = p_project_id
      AND  de.event_type = 'strategic_decision'
      AND  de.created_at > NOW() - INTERVAL '90 days'  -- solo decisiones recientes
  LOOP
    -- ── Señal 1: caída de probabilidad ≥15pp ──────────────────────────────
    SELECT probability INTO v_prob_at_dec
    FROM   project_probability_history
    WHERE  project_id = p_project_id
      AND  computed_at <= v_decision.created_at
    ORDER  BY computed_at DESC
    LIMIT  1;

    IF v_prob_at_dec IS NOT NULL
      AND v_prob_current IS NOT NULL
      AND (v_prob_at_dec - v_prob_current) >= 0.15
      AND NOT EXISTS (
        SELECT 1 FROM strategic_bet_invalidations
        WHERE decision_event_id = v_decision.id
          AND invalidation_reason = 'probability_drop'
      )
    THEN
      -- Crear strategic_block
      INSERT INTO strategic_blocks (
        project_id, block_type, severity, description, resolution_hint, engine_version
      ) VALUES (
        p_project_id,
        'bet_invalidation',
        'high',
        'Decisión estratégica puede haber quedado invalidada: la probabilidad de éxito cayó ' ||
          ROUND((v_prob_at_dec - v_prob_current) * 100)::TEXT || 'pp desde que se tomó.',
        'Revisa si las hipótesis de esta decisión siguen siendo válidas con los datos actuales.',
        'v1'
      )
      RETURNING id INTO v_block_id;

      INSERT INTO strategic_bet_invalidations (
        project_id, decision_event_id, decision_summary, decision_made_at,
        invalidation_reason, evidence, strategic_block_id
      ) VALUES (
        p_project_id,
        v_decision.id,
        COALESCE(v_decision.payload->>'summary', v_decision.payload->>'title', 'Decisión estratégica'),
        v_decision.created_at,
        'probability_drop',
        jsonb_build_object(
          'prob_at_decision', v_prob_at_dec,
          'prob_current',     v_prob_current,
          'drop_pp',          ROUND((v_prob_at_dec - v_prob_current) * 100)
        ),
        v_block_id
      );
      v_new_count := v_new_count + 1;
    END IF;

    -- ── Señal 2: escalada a risk high/critical (decisión en low/medium) ────
    IF v_risk_current IN ('high', 'critical')
      AND NOT EXISTS (
        SELECT 1 FROM strategic_bet_invalidations
        WHERE decision_event_id = v_decision.id
          AND invalidation_reason = 'risk_escalation'
      )
    THEN
      -- Solo invalidar si la decisión se tomó en un contexto de riesgo menor
      DECLARE
        v_risk_at_dec TEXT;
      BEGIN
        SELECT risk_level INTO v_risk_at_dec
        FROM   project_risk_score_history prsh
        WHERE  project_id = p_project_id
          AND  calculated_at <= v_decision.created_at
        ORDER  BY calculated_at DESC
        LIMIT  1;

        IF v_risk_at_dec IN ('low', 'medium') THEN
          INSERT INTO strategic_blocks (
            project_id, block_type, severity, description, resolution_hint, engine_version
          ) VALUES (
            p_project_id,
            'bet_invalidation',
            'critical',
            'El contexto de riesgo ha cambiado drásticamente desde que se tomó esta decisión.',
            'Reevalúa si esta decisión estratégica sigue siendo válida con el nivel de riesgo actual.',
            'v1'
          )
          RETURNING id INTO v_block_id;

          INSERT INTO strategic_bet_invalidations (
            project_id, decision_event_id, decision_summary, decision_made_at,
            invalidation_reason, evidence, strategic_block_id
          ) VALUES (
            p_project_id,
            v_decision.id,
            COALESCE(v_decision.payload->>'summary', v_decision.payload->>'title', 'Decisión estratégica'),
            v_decision.created_at,
            'risk_escalation',
            jsonb_build_object(
              'risk_at_decision', v_risk_at_dec,
              'risk_current',     v_risk_current
            ),
            v_block_id
          );
          v_new_count := v_new_count + 1;
        END IF;
      END;
    END IF;

  END LOOP;

  RETURN v_new_count;
END;
$$;

-- ── 3. Función batch para todos los proyectos activos ─────────────────────────

CREATE OR REPLACE FUNCTION refresh_bet_invalidations()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proj RECORD;
BEGIN
  FOR v_proj IN
    SELECT DISTINCT project_id
    FROM   decision_events
    WHERE  event_type = 'strategic_decision'
      AND  created_at > NOW() - INTERVAL '90 days'
  LOOP
    BEGIN
      PERFORM check_bet_invalidations(v_proj.project_id);
    EXCEPTION WHEN OTHERS THEN
      -- No abortar batch si un proyecto falla
      NULL;
    END;
  END LOOP;
END;
$$;

-- ── 4. pg_cron: ejecutar diariamente a las 08:00 UTC ─────────────────────────

SELECT cron.schedule(
  'daily_bet_invalidation_check',
  '0 8 * * *',
  'SELECT refresh_bet_invalidations()'
);

COMMENT ON TABLE strategic_bet_invalidations IS
  'AUD.M.1: registra cuando una apuesta estratégica (decision_events con event_type=strategic_decision) '
  'queda invalidada por evidencia posterior. '
  'Señales: probability_drop (≥15pp) | risk_escalation (low/medium→high/critical) | manual. '
  'Genera strategic_block tipo bet_invalidation para surface en UI.';

COMMENT ON FUNCTION check_bet_invalidations(UUID) IS
  'AUD.M.1: detecta apuestas estratégicas invalidadas en un proyecto. '
  'Retorna el número de invalidaciones nuevas generadas.';
