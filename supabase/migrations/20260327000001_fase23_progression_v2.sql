-- =============================================================================
-- MIGRACIÓN FASE 23 — Motor de Progresión v2
--
-- Cambios:
--   1. Ampliar current_phase de 1-4 a 0-4 (Phase 0 = Exploración pre-idea)
--   2. Nuevos campos: entry_mode, graduation_eligible_since, graduated
--   3. Ampliar trigger_source y change_reason CHECKs
--   4. Función compute_phase0_score()
--   5. Rewrite run_phase_engine() con Phase 0, fast-track cascada, graduación
--
-- Base: migration 00022 (E4.7 — regresión). 558 líneas → ~750 líneas.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PASO 1 — ALTER constraints y columnas
-- ---------------------------------------------------------------------------

-- project_phase_state: current_phase 1-4 → 0-4
ALTER TABLE project_phase_state
  DROP CONSTRAINT IF EXISTS project_phase_state_current_phase_check;
ALTER TABLE project_phase_state
  ADD CONSTRAINT project_phase_state_current_phase_check
  CHECK (current_phase BETWEEN 0 AND 4);

-- project_phase_history: phase 1-4 → 0-4
ALTER TABLE project_phase_history
  DROP CONSTRAINT IF EXISTS project_phase_history_phase_check;
ALTER TABLE project_phase_history
  ADD CONSTRAINT project_phase_history_phase_check
  CHECK (phase BETWEEN 0 AND 4);

-- Nuevos campos en project_phase_state
ALTER TABLE project_phase_state
  ADD COLUMN IF NOT EXISTS entry_mode TEXT
    CHECK (entry_mode IN ('bootcamp', 'fast_track', 'cycle_direct')),
  ADD COLUMN IF NOT EXISTS graduation_eligible_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS graduated BOOLEAN NOT NULL DEFAULT FALSE;

-- Ampliar trigger_source CHECK
ALTER TABLE project_phase_history
  DROP CONSTRAINT IF EXISTS project_phase_history_trigger_source_check;
ALTER TABLE project_phase_history
  ADD CONSTRAINT project_phase_history_trigger_source_check
  CHECK (trigger_source IN ('weekly_job', 'acceleration', 'regression', 'onboarding_fast_track'));

-- Ampliar change_reason CHECK
ALTER TABLE project_phase_history
  DROP CONSTRAINT IF EXISTS project_phase_history_change_reason_check;
ALTER TABLE project_phase_history
  ADD CONSTRAINT project_phase_history_change_reason_check
  CHECK (change_reason IN ('threshold_met', 'acceleration_signal', 'regression', 'onboarding_fast_track'));

-- ---------------------------------------------------------------------------
-- PASO 2 — compute_phase0_score()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compute_phase0_score(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_o0_1       NUMERIC;  -- Exploración de intereses (50%)
  v_o0_2       NUMERIC;  -- Identificación de problemas (30%)
  v_o0_3       NUMERIC;  -- Selección de idea (20%)
  v_interests  JSONB;
  v_n_explor   INTEGER;
  v_has_idea   BOOLEAN;
BEGIN
  -- O0.1: onboarding_data.interests array ≥3 items → 100
  SELECT (onboarding_data::jsonb -> 'interests')
  INTO   v_interests
  FROM   projects
  WHERE  id = p_project_id;

  v_o0_1 := CASE
    WHEN v_interests IS NOT NULL AND jsonb_array_length(v_interests) >= 3 THEN 100.0
    WHEN v_interests IS NOT NULL AND jsonb_array_length(v_interests) >= 1 THEN
      LEAST(100.0, (jsonb_array_length(v_interests)::NUMERIC / 3.0) * 100.0)
    ELSE 0.0
  END;

  -- O0.2: COUNT obvs tipo='exploracion' ≥3 → 100
  SELECT COUNT(*) INTO v_n_explor
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  tipo::text = 'exploracion';

  v_o0_2 := LEAST(100.0, (v_n_explor::NUMERIC / 3.0) * 100.0);

  -- O0.3: onboarding_data.selected_idea exists → 100
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE  id = p_project_id
      AND  onboarding_data::jsonb ? 'selected_idea'
      AND  onboarding_data::jsonb -> 'selected_idea' IS NOT NULL
      AND  onboarding_data::jsonb ->> 'selected_idea' != 'null'
  ) INTO v_has_idea;

  v_o0_3 := CASE WHEN v_has_idea THEN 100.0 ELSE 0.0 END;

  RETURN ROUND(
    (v_o0_1 * 0.50) + (v_o0_2 * 0.30) + (v_o0_3 * 0.20),
    2
  );
END;
$$;

COMMENT ON FUNCTION compute_phase0_score(UUID) IS
  'FASE 23: Score de Phase 0 (Exploración). O0.1=intereses(50%), O0.2=obvs exploracion(30%), O0.3=idea seleccionada(20%).';

-- ---------------------------------------------------------------------------
-- PASO 3 — run_phase_engine() rewrite con Phase 0, fast-track, graduación
--          Base: migration 00022 (E4.7). Cambios marcados con -- [F23].
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION run_phase_engine(
  p_project_id     UUID,
  p_trigger_source TEXT DEFAULT 'weekly_job'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver              TEXT;
  v_cur_phase        SMALLINT;
  v_phase_entered    TIMESTAMPTZ;
  v_phase_changed    TIMESTAMPTZ;
  v_consecutive_low  SMALLINT;
  v_entry_mode       TEXT;                    -- [F23]
  v_grad_since       TIMESTAMPTZ;            -- [F23]
  v_graduated        BOOLEAN;                -- [F23]

  -- Phase 0 variables  [F23]
  v_phase0_score     NUMERIC;
  v_selected_idea    BOOLEAN;
  v_segment_len      INTEGER;

  -- Phase 1 variables
  v_n_interviews     INTEGER;
  v_o1_1             NUMERIC;
  v_n_positive       INTEGER;
  v_pct_dolor        NUMERIC;
  v_o1_2_base        NUMERIC;
  v_o1_2             NUMERIC;
  v_strategy_def     BOOLEAN;
  v_pivot_count      INTEGER;
  v_o1_3             NUMERIC;

  -- Phase 2 variables
  v_o2_1             NUMERIC;
  v_o2_2             NUMERIC;
  v_o2_3             NUMERIC;
  v_has_payment_obv  BOOLEAN;
  v_rev_momentum     NUMERIC;

  -- Phase 3 variables
  v_o3_1             NUMERIC;
  v_o3_2             NUMERIC;
  v_o3_3             NUMERIC;
  v_stable_months    INTEGER;
  v_tasks_done_28d_p3 INTEGER;

  -- Phase 4 variables
  v_o4_1             NUMERIC;
  v_o4_2             NUMERIC;
  v_o4_3             NUMERIC;
  v_risk_level       TEXT;

  -- Resultados compartidos
  v_phase_score      NUMERIC;
  v_hard_signal      BOOLEAN;
  v_velocity         INTEGER;
  v_phase_status     TEXT;

  -- Avance / regresión de fase
  v_new_phase        SMALLINT;
  v_advanced         BOOLEAN;
  v_change_reason    TEXT;
BEGIN

  -- -------------------------------------------------------------------------
  -- Motor activo
  -- -------------------------------------------------------------------------
  SELECT id INTO v_ver
  FROM   engine_versions
  WHERE  motor = 'phase' AND is_active = TRUE
  LIMIT  1;
  IF v_ver IS NULL THEN v_ver := 'phase_v1.0'; END IF;

  -- -------------------------------------------------------------------------
  -- Estado actual de fase  [F23: añadir entry_mode, graduation fields]
  -- -------------------------------------------------------------------------
  SELECT current_phase, phase_entered_at, phase_last_changed_at,
         COALESCE(consecutive_low_score, 0),
         entry_mode,
         graduation_eligible_since,
         COALESCE(graduated, FALSE)
  INTO   v_cur_phase, v_phase_entered, v_phase_changed, v_consecutive_low,
         v_entry_mode, v_grad_since, v_graduated
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  v_cur_phase       := COALESCE(v_cur_phase, 1);
  v_phase_entered   := COALESCE(v_phase_entered, NOW());
  v_phase_changed   := COALESCE(v_phase_changed, NOW());
  v_consecutive_low := COALESCE(v_consecutive_low, 0);
  v_graduated       := COALESCE(v_graduated, FALSE);

  -- -------------------------------------------------------------------------
  -- Init avance / regresión
  -- -------------------------------------------------------------------------
  v_advanced      := FALSE;
  v_change_reason := NULL;
  v_new_phase     := v_cur_phase;

  -- =========================================================================
  -- [F23] FAST-TRACK CASCADE — onboarding_fast_track
  --
  -- Evalúa fases en cascada usando GATES ALTERNATIVOS basados en datos del
  -- onboarding (key_metrics), NO los gates normales que requieren entrevistas,
  -- OBVs y semanas de actividad.
  --
  -- Lógica: lee MRR y total_customers de key_metrics (sedeados en onboarding).
  --   - Si tiene descripción/idea → avanza Phase 0→1
  --   - Si tiene clientes activos > 0 → avanza Phase 1→2
  --   - Si tiene MRR > 0 → avanza Phase 2→3
  --   - Si MRR > 0 y months_operating >= 6 → avanza Phase 3→4
  --   - Phase 4: terminal en fast-track
  -- =========================================================================
  IF p_trigger_source = 'onboarding_fast_track' THEN
    DECLARE
      v_ft_phase      SMALLINT := v_cur_phase;
      v_ft_score      NUMERIC := 0;
      v_ft_hard       BOOLEAN := FALSE;
      v_ft_advanced   BOOLEAN;
      v_ft_mrr        NUMERIC;
      v_ft_customers  INTEGER;
      v_ft_months     INTEGER;
      v_ft_has_idea   BOOLEAN;
      v_ft_has_desc   BOOLEAN;
    BEGIN
      -- Read onboarding-seeded data from key_metrics
      SELECT COALESCE(mrr, 0), COALESCE(total_customers, 0)
      INTO   v_ft_mrr, v_ft_customers
      FROM   key_metrics
      WHERE  project_id = p_project_id
      ORDER BY date DESC
      LIMIT  1;
      v_ft_mrr       := COALESCE(v_ft_mrr, 0);
      v_ft_customers := COALESCE(v_ft_customers, 0);

      -- Read months_operating from onboarding_data
      SELECT COALESCE(
        (onboarding_data::jsonb -> 'fase_a_answers' ->> 'months_operating')::INTEGER,
        0
      ) INTO v_ft_months
      FROM   projects
      WHERE  id = p_project_id;
      v_ft_months := COALESCE(v_ft_months, 0);

      -- Check if project has an idea/description
      SELECT
        COALESCE(LENGTH(nombre), 0) > 3 AND COALESCE(LENGTH(descripcion), 0) > 5,
        onboarding_data::jsonb ? 'selected_idea'
          AND onboarding_data::jsonb ->> 'selected_idea' != 'null'
      INTO v_ft_has_desc, v_ft_has_idea
      FROM projects
      WHERE id = p_project_id;
      v_ft_has_desc := COALESCE(v_ft_has_desc, FALSE);
      v_ft_has_idea := COALESCE(v_ft_has_idea, FALSE);

      LOOP
        v_ft_advanced := FALSE;

        IF v_ft_phase = 0 THEN
          -- Gate 0→1: tiene idea o descripción significativa
          v_ft_score := CASE WHEN v_ft_has_idea OR v_ft_has_desc THEN 80.0 ELSE 20.0 END;
          v_ft_hard  := v_ft_has_idea OR v_ft_has_desc;
          IF v_ft_hard THEN v_ft_advanced := TRUE; END IF;

        ELSIF v_ft_phase = 1 THEN
          -- Gate 1→2: tiene clientes activos > 0 O tiene MRR
          v_ft_score := CASE
            WHEN v_ft_customers > 0 OR v_ft_mrr > 0 THEN 80.0
            ELSE 30.0
          END;
          v_ft_hard := (v_ft_customers > 0 OR v_ft_mrr > 0);
          IF v_ft_hard THEN v_ft_advanced := TRUE; END IF;

        ELSIF v_ft_phase = 2 THEN
          -- Gate 2→3: tiene MRR > 0
          v_ft_score := CASE WHEN v_ft_mrr > 0 THEN 80.0 ELSE 30.0 END;
          v_ft_hard  := (v_ft_mrr > 0);
          IF v_ft_hard THEN v_ft_advanced := TRUE; END IF;

        ELSIF v_ft_phase = 3 THEN
          -- Gate 3→4: MRR > 0 y ≥6 meses operando
          v_ft_score := CASE
            WHEN v_ft_mrr > 0 AND v_ft_months >= 6 THEN 80.0
            WHEN v_ft_mrr > 0 THEN 60.0
            ELSE 30.0
          END;
          v_ft_hard := (v_ft_mrr > 0 AND v_ft_months >= 6);
          IF v_ft_hard THEN v_ft_advanced := TRUE; END IF;

        ELSE
          -- Phase 4: terminal, no advance further in fast-track
          EXIT;
        END IF;

        IF v_ft_advanced THEN
          -- Insert history entry for the phase we're leaving
          INSERT INTO project_phase_history (
            project_id, phase, phase_score, hard_signal_met, phase_status,
            change_reason, trigger_source, engine_version
          ) VALUES (
            p_project_id, v_ft_phase, v_ft_score, v_ft_hard,
            CASE WHEN v_ft_score >= 75.0 THEN 'healthy'
                 WHEN v_ft_score >= 50.0 THEN 'friction' ELSE 'critical' END,
            'onboarding_fast_track', 'onboarding_fast_track', v_ver
          );
          v_ft_phase := v_ft_phase + 1;
        ELSE
          EXIT;  -- Can't advance further
        END IF;

        EXIT WHEN v_ft_phase > 4;
      END LOOP;

      -- Determine entry_mode based on where we landed
      v_entry_mode := CASE
        WHEN v_ft_phase <= 1 THEN 'bootcamp'
        WHEN v_ft_phase <= 4 THEN 'fast_track'
        ELSE 'fast_track'
      END;

      -- Final score for the phase we landed on
      v_phase_score := COALESCE(v_ft_score, 0.0);
      v_hard_signal := COALESCE(v_ft_hard, FALSE);
      v_new_phase   := v_ft_phase;
      v_phase_status := CASE
        WHEN v_phase_score >= 75.0 THEN 'healthy'
        WHEN v_phase_score >= 50.0 THEN 'friction'
        ELSE 'critical'
      END;

      -- Single UPSERT with final phase
      INSERT INTO project_phase_state (
        project_id, current_phase, phase_score, hard_signal_met,
        phase_status, phase_entered_at, phase_last_changed_at,
        last_calculated_at, engine_version, consecutive_low_score,
        entry_mode, graduation_eligible_since, graduated
      ) VALUES (
        p_project_id, v_new_phase, v_phase_score, v_hard_signal,
        v_phase_status, NOW(), NOW(), NOW(), v_ver, 0,
        v_entry_mode, NULL, FALSE
      )
      ON CONFLICT (project_id) DO UPDATE SET
        current_phase             = EXCLUDED.current_phase,
        phase_score               = EXCLUDED.phase_score,
        hard_signal_met           = EXCLUDED.hard_signal_met,
        phase_status              = EXCLUDED.phase_status,
        phase_entered_at          = EXCLUDED.phase_entered_at,
        phase_last_changed_at     = EXCLUDED.phase_last_changed_at,
        last_calculated_at        = EXCLUDED.last_calculated_at,
        engine_version            = EXCLUDED.engine_version,
        consecutive_low_score     = EXCLUDED.consecutive_low_score,
        entry_mode                = EXCLUDED.entry_mode,
        graduation_eligible_since = EXCLUDED.graduation_eligible_since,
        graduated                 = EXCLUDED.graduated;

      -- Final history entry for the phase we landed on
      INSERT INTO project_phase_history (
        project_id, phase, phase_score, hard_signal_met,
        phase_status, change_reason, trigger_source, engine_version
      ) VALUES (
        p_project_id, v_new_phase, v_phase_score, v_hard_signal,
        v_phase_status,
        CASE WHEN v_new_phase != v_cur_phase THEN 'onboarding_fast_track' ELSE NULL END,
        'onboarding_fast_track', v_ver
      );

      RETURN;
    END;
  END IF;

  -- =========================================================================
  -- [F23] PHASE 0 — Exploración (pre-idea)
  -- Sin regresión ni racha. consecutive_low_score se preserva en 0.
  -- =========================================================================
  IF v_cur_phase = 0 THEN

    v_phase_score := compute_phase0_score(p_project_id);

    -- Hard signal Phase 0→1: selected_idea + segment_text >= 10 chars
    SELECT EXISTS (
      SELECT 1 FROM projects
      WHERE id = p_project_id
        AND onboarding_data::jsonb ? 'selected_idea'
        AND onboarding_data::jsonb ->> 'selected_idea' != 'null'
    ) INTO v_selected_idea;

    SELECT COALESCE(LENGTH(segment_text), 0)
    INTO   v_segment_len
    FROM   project_strategy_current
    WHERE  project_id = p_project_id;
    v_segment_len := COALESCE(v_segment_len, 0);

    v_hard_signal := (v_selected_idea AND v_segment_len >= 10);
    v_velocity    := compute_iteration_velocity(p_project_id);

    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      ELSE                            'critical'
    END;

    -- Gate de avance Phase 0→1
    IF v_phase_score >= 75.0
       AND v_hard_signal = TRUE
       AND v_velocity >= 2
    THEN
      v_new_phase     := 1;
      v_advanced      := TRUE;
      v_change_reason := 'threshold_met';
      v_phase_entered := NOW();
    END IF;

    INSERT INTO project_phase_state (
      project_id, current_phase, phase_score, hard_signal_met,
      phase_status, phase_entered_at, phase_last_changed_at,
      last_calculated_at, engine_version, consecutive_low_score,
      entry_mode, graduation_eligible_since, graduated
    ) VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal,
      v_phase_status, v_phase_entered,
      CASE WHEN v_advanced THEN NOW() ELSE v_phase_changed END,
      NOW(), v_ver, 0,
      v_entry_mode, v_grad_since, v_graduated
    )
    ON CONFLICT (project_id) DO UPDATE SET
      current_phase             = EXCLUDED.current_phase,
      phase_score               = EXCLUDED.phase_score,
      hard_signal_met           = EXCLUDED.hard_signal_met,
      phase_status              = EXCLUDED.phase_status,
      phase_entered_at          = EXCLUDED.phase_entered_at,
      phase_last_changed_at     = EXCLUDED.phase_last_changed_at,
      last_calculated_at        = EXCLUDED.last_calculated_at,
      engine_version            = EXCLUDED.engine_version,
      consecutive_low_score     = EXCLUDED.consecutive_low_score,
      entry_mode                = EXCLUDED.entry_mode,
      graduation_eligible_since = EXCLUDED.graduation_eligible_since,
      graduated                 = EXCLUDED.graduated;

    INSERT INTO project_phase_history (
      project_id, phase, phase_score, hard_signal_met,
      phase_status, change_reason, trigger_source, engine_version
    ) VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal,
      v_phase_status, v_change_reason, p_trigger_source, v_ver
    );

    RETURN;
  END IF;

  -- =========================================================================
  -- PHASE 3 — Operación
  -- =========================================================================
  IF v_cur_phase = 3 THEN

    v_o3_1        := compute_phase3_o31(p_project_id);
    v_o3_2        := compute_phase3_o32(p_project_id);
    v_o3_3        := compute_phase3_o33(p_project_id);
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o3_1 * 0.40) + (v_o3_2 * 0.35) + (v_o3_3 * 0.25)
      )), 2
    );

    v_stable_months := count_stable_revenue_months(p_project_id);

    SELECT COUNT(*) INTO v_tasks_done_28d_p3
    FROM   tasks
    WHERE  project_id   = p_project_id
      AND  status       = 'done'
      AND  completed_at >= NOW() - INTERVAL '28 days';

    v_hard_signal := (
      v_stable_months      >= 3
      AND v_tasks_done_28d_p3 >= 3
    );

    v_velocity := compute_iteration_velocity(p_project_id);

    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      WHEN v_stable_months = 0   THEN 'friction'
      ELSE                            'critical'
    END;

    -- Actualizar racha — solo weekly_job, solo fases > 1
    IF p_trigger_source = 'weekly_job' THEN
      IF v_phase_score < 50.0 THEN
        v_consecutive_low := v_consecutive_low + 1;
      ELSE
        v_consecutive_low := 0;
      END IF;
    END IF;

    -- Gate de avance Phase 3→4 (prioridad sobre regresión)
    IF v_phase_score >= 75.0
       AND v_hard_signal = TRUE
       AND v_velocity    >= 2
    THEN
      v_new_phase       := 4;
      v_advanced        := TRUE;
      v_change_reason   := 'threshold_met';
      v_phase_entered   := NOW();
      v_consecutive_low := 0;
    END IF;

    -- Gate de regresión Phase 3→2
    IF NOT v_advanced
       AND p_trigger_source = 'weekly_job'
       AND v_cur_phase > 1
       AND v_consecutive_low >= 6
    THEN
      v_new_phase       := 2;
      v_change_reason   := 'regression';
      v_consecutive_low := 0;
      v_phase_entered   := NOW();
    END IF;

    INSERT INTO project_phase_state (
      project_id, current_phase, phase_score, hard_signal_met,
      phase_status, phase_entered_at, phase_last_changed_at,
      last_calculated_at, engine_version, consecutive_low_score,
      entry_mode, graduation_eligible_since, graduated
    ) VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal,
      v_phase_status, v_phase_entered,
      CASE WHEN (v_advanced OR v_change_reason = 'regression') THEN NOW() ELSE v_phase_changed END,
      NOW(), v_ver, v_consecutive_low,
      v_entry_mode, v_grad_since, v_graduated
    )
    ON CONFLICT (project_id) DO UPDATE SET
      current_phase             = EXCLUDED.current_phase,
      phase_score               = EXCLUDED.phase_score,
      hard_signal_met           = EXCLUDED.hard_signal_met,
      phase_status              = EXCLUDED.phase_status,
      phase_entered_at          = EXCLUDED.phase_entered_at,
      phase_last_changed_at     = EXCLUDED.phase_last_changed_at,
      last_calculated_at        = EXCLUDED.last_calculated_at,
      engine_version            = EXCLUDED.engine_version,
      consecutive_low_score     = EXCLUDED.consecutive_low_score,
      entry_mode                = EXCLUDED.entry_mode,
      graduation_eligible_since = EXCLUDED.graduation_eligible_since,
      graduated                 = EXCLUDED.graduated;

    INSERT INTO project_phase_history (
      project_id, phase, phase_score, hard_signal_met,
      phase_status, change_reason, trigger_source, engine_version
    ) VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal,
      v_phase_status, v_change_reason, p_trigger_source, v_ver
    );

    RETURN;
  END IF;

  -- =========================================================================
  -- PHASE 4 — Escala + [F23] Graduación
  -- =========================================================================
  IF v_cur_phase = 4 THEN

    v_o4_1        := compute_phase4_o41(p_project_id);
    v_o4_2        := compute_phase4_o42(p_project_id);
    v_o4_3        := compute_phase4_o43(p_project_id);
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o4_1 * 0.40) + (v_o4_2 * 0.35) + (v_o4_3 * 0.25)
      )), 2
    );

    SELECT COALESCE(risk_level, 'low') INTO v_risk_level
    FROM   project_risk_score
    WHERE  project_id = p_project_id;
    v_risk_level := COALESCE(v_risk_level, 'low');

    v_hard_signal := (
      v_o4_1     >= 33
      AND v_o4_2 >= 50
      AND v_risk_level NOT IN ('high', 'critical')
    );

    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      ELSE                            'critical'
    END;

    -- Actualizar racha — solo weekly_job, solo fases > 1
    IF p_trigger_source = 'weekly_job' THEN
      IF v_phase_score < 50.0 THEN
        v_consecutive_low := v_consecutive_low + 1;
      ELSE
        v_consecutive_low := 0;
      END IF;
    END IF;

    -- Fase 4 no avanza (terminal) — v_advanced permanece FALSE

    -- Gate de regresión Phase 4→3
    IF p_trigger_source = 'weekly_job'
       AND v_cur_phase > 1
       AND v_consecutive_low >= 6
    THEN
      v_new_phase       := 3;
      v_change_reason   := 'regression';
      v_consecutive_low := 0;
      v_phase_entered   := NOW();
      -- [F23] Al regresar de Phase 4, resetear graduación
      v_grad_since := NULL;
      v_graduated  := FALSE;
    END IF;

    -- [F23] Lógica de graduación
    IF v_change_reason IS NULL THEN  -- Solo si no regresó
      IF v_phase_score >= 75.0 THEN
        -- Setear graduation_eligible_since si es NULL
        IF v_grad_since IS NULL THEN
          v_grad_since := NOW();
        END IF;
        -- Verificar si han pasado 28 días
        IF v_grad_since + INTERVAL '28 days' <= NOW() THEN
          v_graduated := TRUE;
        END IF;
      ELSE
        -- Score cayó por debajo: resetear elegibilidad
        v_grad_since := NULL;
      END IF;

      -- [F23] Regresión de graduación (solo weekly_job)
      -- Si graduated=TRUE y 2+ semanas consecutivas con score < 50 → graduated=FALSE
      IF v_graduated = TRUE
         AND p_trigger_source = 'weekly_job'
         AND v_consecutive_low >= 2
      THEN
        v_graduated  := FALSE;
        v_grad_since := NULL;
      END IF;
    END IF;

    INSERT INTO project_phase_state (
      project_id, current_phase, phase_score, hard_signal_met,
      phase_status, phase_entered_at, phase_last_changed_at,
      last_calculated_at, engine_version, consecutive_low_score,
      entry_mode, graduation_eligible_since, graduated
    ) VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal,
      v_phase_status, v_phase_entered,
      CASE WHEN v_change_reason = 'regression' THEN NOW() ELSE v_phase_changed END,
      NOW(), v_ver, v_consecutive_low,
      v_entry_mode, v_grad_since, v_graduated
    )
    ON CONFLICT (project_id) DO UPDATE SET
      current_phase             = EXCLUDED.current_phase,
      phase_score               = EXCLUDED.phase_score,
      hard_signal_met           = EXCLUDED.hard_signal_met,
      phase_status              = EXCLUDED.phase_status,
      phase_entered_at          = EXCLUDED.phase_entered_at,
      phase_last_changed_at     = EXCLUDED.phase_last_changed_at,
      last_calculated_at        = EXCLUDED.last_calculated_at,
      engine_version            = EXCLUDED.engine_version,
      consecutive_low_score     = EXCLUDED.consecutive_low_score,
      entry_mode                = EXCLUDED.entry_mode,
      graduation_eligible_since = EXCLUDED.graduation_eligible_since,
      graduated                 = EXCLUDED.graduated;

    INSERT INTO project_phase_history (
      project_id, phase, phase_score, hard_signal_met,
      phase_status, change_reason, trigger_source, engine_version
    ) VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal,
      v_phase_status, v_change_reason, p_trigger_source, v_ver
    );

    RETURN;
  END IF;

  -- =========================================================================
  -- PHASE 2 — Validación
  -- =========================================================================
  IF v_cur_phase = 2 THEN

    v_o2_1        := compute_phase2_o21(p_project_id);
    v_o2_2        := compute_phase2_o22(p_project_id);
    v_o2_3        := compute_phase2_o23(p_project_id);
    v_phase_score := ROUND(
      LEAST(100.0, GREATEST(0.0,
        (v_o2_1 * 0.45) + (v_o2_2 * 0.25) + (v_o2_3 * 0.30)
      )), 2
    );

    SELECT EXISTS (
      SELECT 1 FROM obvs
      WHERE  project_id    = p_project_id
        AND  tipo::text   IN ('revenue_validation', 'venta')
        AND  evidence_type = 'payment'
        AND  obv_outcome   = 'success'
        AND  created_at   >= NOW() - INTERVAL '90 days'
    ) INTO v_has_payment_obv;

    SELECT COALESCE(revenue_momentum_input, 30)
    INTO   v_rev_momentum
    FROM   project_probability
    WHERE  project_id = p_project_id;
    v_rev_momentum := COALESCE(v_rev_momentum, 30);

    v_hard_signal := (v_has_payment_obv = TRUE AND v_rev_momentum >= 40);
    v_velocity    := compute_iteration_velocity(p_project_id);

    v_phase_status := CASE
      WHEN v_phase_score >= 75.0 THEN 'healthy'
      WHEN v_phase_score >= 50.0 THEN 'friction'
      WHEN v_o2_1        = 0     THEN 'friction'
      ELSE                            'critical'
    END;

    -- Actualizar racha — solo weekly_job, solo fases > 1
    IF p_trigger_source = 'weekly_job' THEN
      IF v_phase_score < 50.0 THEN
        v_consecutive_low := v_consecutive_low + 1;
      ELSE
        v_consecutive_low := 0;
      END IF;
    END IF;

    -- Gate de avance Phase 2→3 (prioridad sobre regresión)
    IF v_phase_score >= 75.0 AND v_hard_signal = TRUE AND v_velocity >= 2 THEN
      v_new_phase       := 3;
      v_advanced        := TRUE;
      v_change_reason   := 'threshold_met';
      v_phase_entered   := NOW();
      v_consecutive_low := 0;
    END IF;

    -- Gate de regresión Phase 2→1
    IF NOT v_advanced
       AND p_trigger_source = 'weekly_job'
       AND v_cur_phase > 1
       AND v_consecutive_low >= 6
    THEN
      v_new_phase       := 1;
      v_change_reason   := 'regression';
      v_consecutive_low := 0;
      v_phase_entered   := NOW();
    END IF;

    INSERT INTO project_phase_state (
      project_id, current_phase, phase_score, hard_signal_met,
      phase_status, phase_entered_at, phase_last_changed_at,
      last_calculated_at, engine_version, consecutive_low_score,
      entry_mode, graduation_eligible_since, graduated
    ) VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal,
      v_phase_status, v_phase_entered,
      CASE WHEN (v_advanced OR v_change_reason = 'regression') THEN NOW() ELSE v_phase_changed END,
      NOW(), v_ver, v_consecutive_low,
      v_entry_mode, v_grad_since, v_graduated
    )
    ON CONFLICT (project_id) DO UPDATE SET
      current_phase             = EXCLUDED.current_phase,
      phase_score               = EXCLUDED.phase_score,
      hard_signal_met           = EXCLUDED.hard_signal_met,
      phase_status              = EXCLUDED.phase_status,
      phase_entered_at          = EXCLUDED.phase_entered_at,
      phase_last_changed_at     = EXCLUDED.phase_last_changed_at,
      last_calculated_at        = EXCLUDED.last_calculated_at,
      engine_version            = EXCLUDED.engine_version,
      consecutive_low_score     = EXCLUDED.consecutive_low_score,
      entry_mode                = EXCLUDED.entry_mode,
      graduation_eligible_since = EXCLUDED.graduation_eligible_since,
      graduated                 = EXCLUDED.graduated;

    INSERT INTO project_phase_history (
      project_id, phase, phase_score, hard_signal_met,
      phase_status, change_reason, trigger_source, engine_version
    ) VALUES (
      p_project_id, v_new_phase, v_phase_score, v_hard_signal,
      v_phase_status, v_change_reason, p_trigger_source, v_ver
    );

    RETURN;
  END IF;

  -- =========================================================================
  -- PHASE 1 — Descubrimiento
  -- Sin racha ni regresión. consecutive_low_score se preserva en 0.
  -- =========================================================================

  SELECT COUNT(*) INTO v_n_interviews
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  tipo::text IN ('customer_discovery', 'exploracion');

  v_o1_1 := LEAST(100.0, (v_n_interviews::NUMERIC / 10.0) * 100.0);

  SELECT COUNT(*) INTO v_n_positive
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  tipo::text IN ('customer_discovery', 'exploracion')
    AND  obv_outcome = 'success';

  v_pct_dolor := CASE
    WHEN v_n_interviews > 0 THEN (v_n_positive::NUMERIC / v_n_interviews) * 100.0
    ELSE 0.0
  END;

  v_o1_2_base := LEAST(100.0, (v_pct_dolor / 30.0) * 100.0);
  v_o1_2      := CASE
    WHEN v_n_interviews < 5 THEN v_o1_2_base * 0.5
    ELSE v_o1_2_base
  END;

  SELECT COALESCE(
    COALESCE(LENGTH(segment_text),   0) >= 10
    AND COALESCE(LENGTH(problem_text),  0) >= 10
    AND COALESCE(LENGTH(value_prop_text),0) >= 10,
    FALSE
  )
  INTO v_strategy_def
  FROM project_strategy_current
  WHERE project_id = p_project_id;
  v_strategy_def := COALESCE(v_strategy_def, FALSE);

  SELECT COUNT(*) INTO v_pivot_count
  FROM   strategic_model_versions
  WHERE  project_id = p_project_id
    AND  created_at >= NOW() - INTERVAL '28 days';

  v_o1_3 := CASE
    WHEN NOT v_strategy_def OR v_pivot_count >= 4  THEN   0.0
    WHEN v_pivot_count <= 1                         THEN 100.0
    WHEN v_pivot_count = 2                          THEN  75.0
    WHEN v_pivot_count = 3                          THEN  50.0
    ELSE 0.0
  END;

  v_phase_score := ROUND(
    (v_o1_1 * 0.40) + (v_o1_2 * 0.40) + (v_o1_3 * 0.20),
    2
  );

  v_hard_signal := (
    v_n_interviews >= 10 AND v_pct_dolor >= 30.0 AND v_strategy_def = TRUE
  );

  v_velocity := compute_iteration_velocity(p_project_id);

  v_phase_status := CASE
    WHEN v_phase_score >= 75.0 THEN 'healthy'
    WHEN v_phase_score >= 50.0 THEN 'friction'
    WHEN v_n_interviews = 0    THEN 'friction'
    ELSE                            'critical'
  END;

  -- Gate de avance Phase 1→2 (sin regresión posible desde Fase 1)
  IF v_cur_phase = 1
     AND v_phase_score >= 75.0
     AND v_hard_signal = TRUE
     AND v_velocity    >= 2
  THEN
    v_new_phase       := 2;
    v_advanced        := TRUE;
    v_change_reason   := 'threshold_met';
    v_phase_entered   := NOW();
  END IF;

  INSERT INTO project_phase_state (
    project_id, current_phase, phase_score, hard_signal_met,
    phase_status, phase_entered_at, phase_last_changed_at,
    last_calculated_at, engine_version, consecutive_low_score,
    entry_mode, graduation_eligible_since, graduated
  ) VALUES (
    p_project_id, v_new_phase, v_phase_score, v_hard_signal,
    v_phase_status, v_phase_entered,
    CASE WHEN v_advanced THEN NOW() ELSE v_phase_changed END,
    NOW(), v_ver, v_consecutive_low,
    v_entry_mode, v_grad_since, v_graduated
  )
  ON CONFLICT (project_id) DO UPDATE SET
    current_phase             = EXCLUDED.current_phase,
    phase_score               = EXCLUDED.phase_score,
    hard_signal_met           = EXCLUDED.hard_signal_met,
    phase_status              = EXCLUDED.phase_status,
    phase_entered_at          = EXCLUDED.phase_entered_at,
    phase_last_changed_at     = EXCLUDED.phase_last_changed_at,
    last_calculated_at        = EXCLUDED.last_calculated_at,
    engine_version            = EXCLUDED.engine_version,
    consecutive_low_score     = EXCLUDED.consecutive_low_score,
    entry_mode                = EXCLUDED.entry_mode,
    graduation_eligible_since = EXCLUDED.graduation_eligible_since,
    graduated                 = EXCLUDED.graduated;

  INSERT INTO project_phase_history (
    project_id, phase, phase_score, hard_signal_met,
    phase_status, change_reason, trigger_source, engine_version
  ) VALUES (
    p_project_id, v_new_phase, v_phase_score, v_hard_signal,
    v_phase_status, v_change_reason, p_trigger_source, v_ver
  );

END;
$$;

COMMENT ON FUNCTION run_phase_engine(UUID, TEXT) IS
  'Phase Engine v2 (FASE 23). Phase 0 + fast-track cascade + graduación Phase 4. Base: migration 00022 (E4.7).';
