-- DEUDA.PE.17 — behavioral_block_candidate: añadir columna blocker_area
--               para evitar REGEXP_REPLACE frágil sobre description.
--
-- DEUDA.PE.19 — Actualizar COMMENT ON COLUMN tasks.source con los nuevos valores.
--
-- DEUDA.PE.20 — check_bet_invalidations: añadir RAISE NOTICE cuando el histórico
--               de riesgo es insuficiente para evaluar la escalada.

-- ── DEUDA.PE.17: columna blocker_area en strategic_blocks ────────────────────

ALTER TABLE strategic_blocks
  ADD COLUMN IF NOT EXISTS blocker_area TEXT;

COMMENT ON COLUMN strategic_blocks.blocker_area IS
  'DEUDA.PE.17: área funcional del bloque para behavioral_block_candidate. '
  'Sustituye la extracción con REGEXP_REPLACE sobre description. '
  'Valores: demand | delivery | cash | alignment | (libre)';

-- Actualizar refresh_behavioral_block_candidates para usar blocker_area en INSERT y limpieza

CREATE OR REPLACE FUNCTION refresh_behavioral_block_candidates(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_area  RECORD;
  v_block_exists BOOLEAN;
BEGIN
  -- ── 1. Detectar áreas con ≥2 blockers distintos en las últimas 4 semanas ──
  FOR v_area IN
    SELECT
      COALESCE(mi.content->>'affected_area', 'general') AS affected_area,
      COUNT(DISTINCT mi.meeting_id) AS meeting_count
    FROM meeting_insights mi
    JOIN meetings m ON m.id = mi.meeting_id
    WHERE m.project_id   = p_project_id
      AND mi.insight_type  = 'blocker'
      AND mi.review_status = 'approved'
      AND m.created_at   > NOW() - INTERVAL '4 weeks'
    GROUP BY COALESCE(mi.content->>'affected_area', 'general')
    HAVING COUNT(DISTINCT mi.meeting_id) >= 2
  LOOP
    -- ── 2. ¿Ya existe un behavioral_block_candidate activo para esta área? ──
    SELECT EXISTS (
      SELECT 1 FROM strategic_blocks
      WHERE  project_id              = p_project_id
        AND  behavioral_block_candidate = TRUE
        AND  blocker_area            = v_area.affected_area  -- PE.17: usar columna directa
        AND  resolved_at             IS NULL
    ) INTO v_block_exists;

    IF NOT v_block_exists THEN
      INSERT INTO strategic_blocks (
        project_id,
        block_type,
        severity,
        description,
        resolution_hint,
        behavioral_block_candidate,
        blocker_area,              -- PE.17: guardar área directamente
        engine_version
      ) VALUES (
        p_project_id,
        'behavioral_pattern',
        'medium',
        'Patrón conductual detectado: blocker recurrente en área "' || v_area.affected_area || '" '
          || 'en ' || v_area.meeting_count || ' reuniones de las últimas 4 semanas.',
        'Dedicar un bloque de trabajo específico para resolver el bloqueador de ' || v_area.affected_area || '.',
        TRUE,
        v_area.affected_area,      -- PE.17: columna directa
        'v1'
      );
    END IF;
  END LOOP;

  -- ── 3. Desactivar candidatos cuya área ya no tiene ≥2 blockers recientes ──
  -- PE.17 fix: usar blocker_area directamente (sin REGEXP)
  UPDATE strategic_blocks sb
  SET    resolved_at = NOW()
  WHERE  sb.project_id              = p_project_id
    AND  sb.behavioral_block_candidate = TRUE
    AND  sb.resolved_at             IS NULL
    AND  sb.blocker_area IS NOT NULL
    AND  NOT EXISTS (
      SELECT 1
      FROM meeting_insights mi
      JOIN meetings m ON m.id = mi.meeting_id
      WHERE m.project_id   = p_project_id
        AND mi.insight_type  = 'blocker'
        AND mi.review_status = 'approved'
        AND m.created_at   > NOW() - INTERVAL '4 weeks'
        AND COALESCE(mi.content->>'affected_area', 'general') = sb.blocker_area
      GROUP BY COALESCE(mi.content->>'affected_area', 'general')
      HAVING COUNT(DISTINCT mi.meeting_id) >= 2
    );
END;
$$;

COMMENT ON FUNCTION refresh_behavioral_block_candidates(UUID) IS
  'P8.V2.1 + DEUDA.PE.17: detecta patrones conductuales en meeting_insights. '
  'PE.17: usa columna blocker_area directamente (no REGEXP_REPLACE sobre description).';

-- ── DEUDA.PE.19: COMMENT actualizado en tasks.source ─────────────────────────

COMMENT ON COLUMN tasks.source IS
  'M18.14: origen de la tarea. '
  'Valores: meeting_intelligence | ai_executor | manual | playbook | optimus | emergency_onboarding. '
  'DEUDA.PE.19: optimus (AUD.M.7 análisis urgente) y emergency_onboarding (O5.V2.3 modo crisis) añadidos.';

-- ── DEUDA.PE.20: NOTICE en check_bet_invalidations ───────────────────────────

CREATE OR REPLACE FUNCTION check_bet_invalidations(p_project_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_decision     RECORD;
  v_prob_current NUMERIC;
  v_prob_at_dec  NUMERIC;
  v_risk_current TEXT;
  v_risk_at_dec  TEXT;
  v_block_id     UUID;
  v_new_count    INTEGER := 0;
BEGIN
  SELECT probability INTO v_prob_current
  FROM   project_probability
  WHERE  project_id = p_project_id;

  SELECT risk_level INTO v_risk_current
  FROM   project_risk_score
  WHERE  project_id = p_project_id;

  FOR v_decision IN
    SELECT de.id, de.payload, de.created_at
    FROM   decision_events de
    WHERE  de.project_id = p_project_id
      AND  de.event_type = 'strategic_decision'
      AND  de.created_at > NOW() - INTERVAL '90 days'
  LOOP
    -- ── Señal 1: caída de probabilidad ≥15pp ──────────────────────────────
    SELECT probability INTO v_prob_at_dec
    FROM   project_probability_history
    WHERE  project_id = p_project_id
      AND  computed_at <= v_decision.created_at
    ORDER  BY computed_at DESC
    LIMIT  1;

    IF v_prob_at_dec IS NULL THEN
      -- PE.20: NOTICE cuando no hay histórico suficiente
      RAISE NOTICE 'check_bet_invalidations: no probability history before % for project % — skipping probability_drop check',
        v_decision.created_at, p_project_id;
    ELSIF v_prob_current IS NOT NULL
      AND (v_prob_at_dec - v_prob_current) >= 0.15
      AND NOT EXISTS (
        SELECT 1 FROM strategic_bet_invalidations
        WHERE decision_event_id = v_decision.id
          AND invalidation_reason = 'probability_drop'
      )
    THEN
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

    -- ── Señal 2: escalada a risk high/critical ─────────────────────────────
    IF v_risk_current IN ('high', 'critical') THEN
      -- PE.20 fix: variable directa, no DECLARE anidado
      SELECT risk_level INTO v_risk_at_dec
      FROM   project_risk_score_history
      WHERE  project_id = p_project_id
        AND  calculated_at <= v_decision.created_at
      ORDER  BY calculated_at DESC
      LIMIT  1;

      IF v_risk_at_dec IS NULL THEN
        -- PE.20: NOTICE cuando no hay histórico de riesgo
        RAISE NOTICE 'check_bet_invalidations: no risk history before % for project % — skipping risk_escalation check',
          v_decision.created_at, p_project_id;
      ELSIF v_risk_at_dec IN ('low', 'medium')
        AND NOT EXISTS (
          SELECT 1 FROM strategic_bet_invalidations
          WHERE decision_event_id = v_decision.id
            AND invalidation_reason = 'risk_escalation'
        )
      THEN
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
    END IF;

  END LOOP;

  RETURN v_new_count;
END;
$$;

COMMENT ON FUNCTION check_bet_invalidations(UUID) IS
  'AUD.M.1 + DEUDA.PE.20: detecta apuestas estratégicas invalidadas. '
  'PE.20: variable v_risk_at_dec movida al scope principal (no DECLARE anidado). '
  'RAISE NOTICE cuando no hay histórico suficiente para evaluar la señal.';
