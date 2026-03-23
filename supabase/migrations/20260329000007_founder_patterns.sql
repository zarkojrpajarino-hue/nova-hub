-- =============================================================================
-- F31 Bloque B — Founder Patterns: tabla + RPC detect_founder_patterns
--
-- CI31.5: Tabla founder_patterns (patrones de comportamiento del founder)
-- CI31.6: RPC detect_founder_patterns(project_id) — progresivo por ciclos
--
-- Lógica progresiva:
--   v1 (1 ciclo):  observaciones simples del delta
--   v2 (2 ciclos): comparación entre deltas
--   v3 (3+ ciclos): patrones consolidados con alta confianza
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabla founder_patterns
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS founder_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'optimism_bias' | 'execution_decay' | 'cash_blindspot' | 'category_imbalance' | 'commitment_gap'
  description TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]', -- [{cycle_id, metric, expected, actual}]
  confidence TEXT NOT NULL CHECK (confidence IN ('observation', 'early_signal', 'pattern')), -- 1 cycle / 2 cycles / 3+
  cycles_analyzed INT NOT NULL DEFAULT 1,
  recommendation TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- patterns can be re-evaluated
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired'))
);

ALTER TABLE founder_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read patterns" ON founder_patterns FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = founder_patterns.project_id
      AND pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
  )
);

CREATE INDEX idx_founder_patterns_project ON founder_patterns(project_id, status, detected_at DESC);

COMMENT ON TABLE founder_patterns IS
  'F31 Bloque B: Patrones de comportamiento del founder detectados automáticamente al analizar ciclos estratégicos.';

-- ---------------------------------------------------------------------------
-- 2. RPC detect_founder_patterns(project_id)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION detect_founder_patterns(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle RECORD;
  v_delta JSONB;
  v_deltas JSONB[] := '{}';
  v_cycle_ids UUID[] := '{}';
  v_num_cycles INTEGER := 0;
  v_patterns JSONB := '[]'::jsonb;
  v_pattern JSONB;
  -- v1 variables
  v_commitments_count INTEGER;
  v_tasks_total INTEGER;
  v_by_category JSONB;
  v_committed_dist JSONB;
  -- v2 variables
  v_prev_delta JSONB;
  v_curr_delta JSONB;
  v_prev_tasks INTEGER;
  v_curr_tasks INTEGER;
  -- v3 variables
  v_total_committed INTEGER := 0;
  v_total_completed INTEGER := 0;
  v_category_ignored_counts JSONB := '{}'::jsonb;
  v_avg_gap NUMERIC;
  v_cat TEXT;
  v_cat_count INTEGER;
  v_i INTEGER;
BEGIN
  -- ── Gather all completed cycles with their deltas ──────────────────────
  FOR v_cycle IN
    SELECT id, cycle_index, start_date, end_date, closed_at, commitments_json
    FROM strategic_cycles
    WHERE project_id = p_project_id
      AND status IN ('completed', 'revised')
      AND closed_at IS NOT NULL
    ORDER BY closed_at ASC
  LOOP
    -- Compute delta for this cycle
    v_delta := compute_cycle_delta(v_cycle.id);

    -- Skip if delta returned an error
    IF v_delta ? 'error' THEN
      CONTINUE;
    END IF;

    v_deltas := array_append(v_deltas, v_delta);
    v_cycle_ids := array_append(v_cycle_ids, v_cycle.id);
    v_num_cycles := v_num_cycles + 1;
  END LOOP;

  -- ── Edge case: 0 cycles → return empty ─────────────────────────────────
  IF v_num_cycles = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- v1: OBSERVATIONS (from latest cycle delta)
  -- ══════════════════════════════════════════════════════════════════════════
  v_curr_delta := v_deltas[v_num_cycles];
  v_tasks_total := COALESCE((v_curr_delta->>'tasks_total')::integer, 0);
  v_by_category := COALESCE(v_curr_delta->'by_category', '{}'::jsonb);
  v_committed_dist := COALESCE(v_curr_delta->'committed_distribution', '{}'::jsonb);

  -- Count commitments from latest cycle
  v_commitments_count := COALESCE(jsonb_array_length(v_curr_delta->'commitments'), 0);

  -- Observation: commitment completion gap
  IF v_commitments_count > 0 THEN
    -- Count how many commitment categories had 0 tasks
    DECLARE
      v_fulfilled INTEGER := 0;
      v_commitment_cats TEXT[];
      v_cc TEXT;
    BEGIN
      SELECT array_agg(DISTINCT elem->>'category')
      INTO v_commitment_cats
      FROM jsonb_array_elements(v_curr_delta->'commitments') AS elem;

      IF v_commitment_cats IS NOT NULL THEN
        FOREACH v_cc IN ARRAY v_commitment_cats LOOP
          -- Map 'team' → 'support' for task lookup
          IF COALESCE((v_by_category->>CASE WHEN v_cc = 'team' THEN 'support' ELSE v_cc END)::integer, 0) > 0 THEN
            v_fulfilled := v_fulfilled + 1;
          END IF;
        END LOOP;

        IF v_fulfilled < array_length(v_commitment_cats, 1) THEN
          v_pattern := jsonb_build_object(
            'pattern_type', 'commitment_gap',
            'description', format('Prometiste %s compromisos, cumpliste actividad en %s categorías',
              v_commitments_count, v_fulfilled),
            'evidence', jsonb_build_array(jsonb_build_object(
              'cycle_id', v_cycle_ids[v_num_cycles],
              'committed', v_commitments_count,
              'completed', v_fulfilled
            )),
            'confidence', 'observation',
            'cycles_analyzed', 1,
            'recommendation', 'Reduce el número de compromisos en el próximo ciclo y focaliza en menos categorías'
          );
          v_patterns := v_patterns || v_pattern;
        END IF;
      END IF;
    END;
  END IF;

  -- Observation: category with 0 tasks (blind spot)
  FOR v_cat IN SELECT unnest(ARRAY['demand', 'delivery', 'cash', 'support']) LOOP
    IF COALESCE((v_by_category->>v_cat)::integer, 0) = 0 THEN
      v_pattern := jsonb_build_object(
        'pattern_type', 'cash_blindspot',
        'description', format('0 tareas en %s durante todo el ciclo',
          CASE WHEN v_cat = 'support' THEN 'team' ELSE v_cat END),
        'evidence', jsonb_build_array(jsonb_build_object(
          'cycle_id', v_cycle_ids[v_num_cycles],
          'metric', v_cat,
          'expected', 'actividad',
          'actual', 0
        )),
        'confidence', 'observation',
        'cycles_analyzed', 1,
        'recommendation', format('Dedica al menos una tarea a %s en el próximo ciclo',
          CASE WHEN v_cat = 'support' THEN 'team' ELSE v_cat END)
      );
      v_patterns := v_patterns || v_pattern;
    END IF;
  END LOOP;

  -- ══════════════════════════════════════════════════════════════════════════
  -- v2: EARLY SIGNALS (compare 2 cycles)
  -- ══════════════════════════════════════════════════════════════════════════
  IF v_num_cycles >= 2 THEN
    v_prev_delta := v_deltas[v_num_cycles - 1];
    v_prev_tasks := COALESCE((v_prev_delta->>'tasks_total')::integer, 0);
    v_curr_tasks := COALESCE((v_curr_delta->>'tasks_total')::integer, 0);

    -- Early signal: declining execution
    IF v_prev_tasks > 0 AND v_curr_tasks < v_prev_tasks * 0.7 THEN
      v_pattern := jsonb_build_object(
        'pattern_type', 'execution_decay',
        'description', format('Tu ejecución bajó de %s a %s tareas entre los últimos 2 ciclos (-%.0f%%)',
          v_prev_tasks, v_curr_tasks, (1 - v_curr_tasks::numeric / v_prev_tasks) * 100),
        'evidence', jsonb_build_array(
          jsonb_build_object('cycle_id', v_cycle_ids[v_num_cycles - 1], 'metric', 'tasks_total', 'actual', v_prev_tasks),
          jsonb_build_object('cycle_id', v_cycle_ids[v_num_cycles], 'metric', 'tasks_total', 'actual', v_curr_tasks)
        ),
        'confidence', 'early_signal',
        'cycles_analyzed', 2,
        'recommendation', 'Investiga si hay un bloqueo estructural o si los ciclos son demasiado ambiciosos'
      );
      v_patterns := v_patterns || v_pattern;
    END IF;

    -- Early signal: same category ignored in both cycles
    FOR v_cat IN SELECT unnest(ARRAY['demand', 'delivery', 'cash', 'support']) LOOP
      IF COALESCE((COALESCE(v_prev_delta->'by_category', '{}'::jsonb)->>v_cat)::integer, 0) = 0
         AND COALESCE((v_by_category->>v_cat)::integer, 0) = 0 THEN
        v_pattern := jsonb_build_object(
          'pattern_type', 'category_imbalance',
          'description', format('Categoría %s ignorada en los últimos 2 ciclos consecutivos',
            CASE WHEN v_cat = 'support' THEN 'team' ELSE v_cat END),
          'evidence', jsonb_build_array(
            jsonb_build_object('cycle_id', v_cycle_ids[v_num_cycles - 1], 'metric', v_cat, 'actual', 0),
            jsonb_build_object('cycle_id', v_cycle_ids[v_num_cycles], 'metric', v_cat, 'actual', 0)
          ),
          'confidence', 'early_signal',
          'cycles_analyzed', 2,
          'recommendation', format('Considera si %s es relevante para tu fase actual — si lo es, está siendo un punto ciego recurrente',
            CASE WHEN v_cat = 'support' THEN 'team' ELSE v_cat END)
        );
        v_patterns := v_patterns || v_pattern;
      END IF;
    END LOOP;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- v3: PATTERNS (3+ cycles — strong signals)
  -- ══════════════════════════════════════════════════════════════════════════
  IF v_num_cycles >= 3 THEN
    -- Pattern: optimism bias — average commitment gap across all cycles
    v_total_committed := 0;
    v_total_completed := 0;

    FOR v_i IN 1..v_num_cycles LOOP
      DECLARE
        v_d JSONB := v_deltas[v_i];
        v_c_count INTEGER;
        v_t_count INTEGER;
      BEGIN
        v_c_count := COALESCE(jsonb_array_length(v_d->'commitments'), 0);
        v_t_count := COALESCE((v_d->>'tasks_total')::integer, 0);
        IF v_c_count > 0 THEN
          v_total_committed := v_total_committed + v_c_count;
          -- Count categories with any activity
          DECLARE
            v_cats_with_activity INTEGER := 0;
            v_cc2 TEXT;
            v_commitment_cats2 TEXT[];
          BEGIN
            SELECT array_agg(DISTINCT elem->>'category')
            INTO v_commitment_cats2
            FROM jsonb_array_elements(v_d->'commitments') AS elem;

            IF v_commitment_cats2 IS NOT NULL THEN
              FOREACH v_cc2 IN ARRAY v_commitment_cats2 LOOP
                IF COALESCE((COALESCE(v_d->'by_category', '{}'::jsonb)->>
                  CASE WHEN v_cc2 = 'team' THEN 'support' ELSE v_cc2 END)::integer, 0) > 0 THEN
                  v_cats_with_activity := v_cats_with_activity + 1;
                END IF;
              END LOOP;
              v_total_completed := v_total_completed + v_cats_with_activity;
            END IF;
          END;
        END IF;
      END;
    END LOOP;

    IF v_total_committed > 0 THEN
      v_avg_gap := ROUND((1 - v_total_completed::numeric / v_total_committed) * 100);
      IF v_avg_gap > 20 THEN
        v_pattern := jsonb_build_object(
          'pattern_type', 'optimism_bias',
          'description', format('Subestimas tu capacidad de ejecución: en promedio dejas sin cubrir el %.0f%% de tus compromisos', v_avg_gap),
          'evidence', jsonb_build_array(jsonb_build_object(
            'metric', 'avg_commitment_gap',
            'committed', v_total_committed,
            'completed', v_total_completed,
            'gap_pct', v_avg_gap
          )),
          'confidence', 'pattern',
          'cycles_analyzed', v_num_cycles,
          'recommendation', format('Reduce compromisos un %.0f%% en el próximo ciclo — mejor cumplir 3 que fallar 5', LEAST(v_avg_gap, 50))
        );
        v_patterns := v_patterns || v_pattern;
      END IF;
    END IF;

    -- Pattern: category consistently ignored across 3+ cycles
    FOR v_cat IN SELECT unnest(ARRAY['demand', 'delivery', 'cash', 'support']) LOOP
      v_cat_count := 0;
      FOR v_i IN 1..v_num_cycles LOOP
        IF COALESCE((COALESCE(v_deltas[v_i]->'by_category', '{}'::jsonb)->>v_cat)::integer, 0) = 0 THEN
          v_cat_count := v_cat_count + 1;
        END IF;
      END LOOP;

      IF v_cat_count >= 3 THEN
        v_pattern := jsonb_build_object(
          'pattern_type', 'category_imbalance',
          'description', format('Patrón: siempre ignoras %s (%s de %s ciclos sin actividad)',
            CASE WHEN v_cat = 'support' THEN 'team' ELSE v_cat END,
            v_cat_count, v_num_cycles),
          'evidence', jsonb_build_array(jsonb_build_object(
            'metric', v_cat,
            'cycles_ignored', v_cat_count,
            'total_cycles', v_num_cycles
          )),
          'confidence', 'pattern',
          'cycles_analyzed', v_num_cycles,
          'recommendation', format('Si %s es importante, establece una meta mínima obligatoria. Si no lo es, elimínalo de tus categorías.',
            CASE WHEN v_cat = 'support' THEN 'team' ELSE v_cat END)
        );
        v_patterns := v_patterns || v_pattern;
      END IF;
    END LOOP;

    -- Pattern: execution decay if tasks drop in majority of cycles
    DECLARE
      v_decay_count INTEGER := 0;
      v_prev_t INTEGER;
      v_curr_t INTEGER;
    BEGIN
      FOR v_i IN 2..v_num_cycles LOOP
        v_prev_t := COALESCE((v_deltas[v_i - 1]->>'tasks_total')::integer, 0);
        v_curr_t := COALESCE((v_deltas[v_i]->>'tasks_total')::integer, 0);
        IF v_prev_t > 0 AND v_curr_t < v_prev_t * 0.8 THEN
          v_decay_count := v_decay_count + 1;
        END IF;
      END LOOP;

      -- If decay happened in majority of transitions
      IF v_decay_count >= (v_num_cycles - 1) * 0.5 AND v_decay_count >= 2 THEN
        v_pattern := jsonb_build_object(
          'pattern_type', 'execution_decay',
          'description', format('Patrón de caída: tu ejecución baja ciclo tras ciclo (%s de %s transiciones)', v_decay_count, v_num_cycles - 1),
          'evidence', jsonb_build_array(jsonb_build_object(
            'metric', 'execution_decay_transitions',
            'decay_count', v_decay_count,
            'total_transitions', v_num_cycles - 1
          )),
          'confidence', 'pattern',
          'cycles_analyzed', v_num_cycles,
          'recommendation', 'Revisa si tus ciclos son demasiado largos o si el burnout se está acumulando'
        );
        v_patterns := v_patterns || v_pattern;
      END IF;
    END;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- UPSERT into founder_patterns: expire old, insert new
  -- ══════════════════════════════════════════════════════════════════════════

  -- Expire previous patterns for this project
  UPDATE founder_patterns
  SET status = 'expired', expires_at = NOW()
  WHERE project_id = p_project_id
    AND status = 'active';

  -- Insert new patterns
  IF jsonb_array_length(v_patterns) > 0 THEN
    INSERT INTO founder_patterns (project_id, pattern_type, description, evidence, confidence, cycles_analyzed, recommendation, status)
    SELECT
      p_project_id,
      (elem->>'pattern_type'),
      (elem->>'description'),
      COALESCE(elem->'evidence', '[]'::jsonb),
      (elem->>'confidence'),
      COALESCE((elem->>'cycles_analyzed')::integer, 1),
      (elem->>'recommendation'),
      'active'
    FROM jsonb_array_elements(v_patterns) AS elem;
  END IF;

  RETURN v_patterns;
END;
$$;

COMMENT ON FUNCTION detect_founder_patterns(UUID) IS
  'F31 Bloque B: Detecta patrones de comportamiento del founder analizando ciclos completados. '
  'Progresivo: v1 (1 ciclo) observaciones, v2 (2 ciclos) señales tempranas, v3 (3+) patrones consolidados. '
  'Upsert: expira patrones previos e inserta nuevos en founder_patterns.';
