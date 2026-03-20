-- DEUDA.PE.21 — submit_strategic_reset ahora inserta en decision_events
--               con event_type='strategic_decision' al registrar la apuesta (next_bet).
--
-- Problema: trg_decision_retrospective_create dispara en event_type='strategic_decision'
--           pero ningún flujo insertaba ese tipo. El ritual tiene `next_bet` que ES
--           la apuesta estratégica del próximo ciclo → es el momento correcto.
--
-- Fix: extender submit_strategic_reset para insertar el decision_event tras registrar
--      las respuestas del ritual. Solo si `next_bet` no está vacío.

CREATE OR REPLACE FUNCTION submit_strategic_reset(
  p_project_id       UUID,
  p_ritual_responses JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_id UUID;
  v_result   TEXT;
  v_next_bet TEXT;
BEGIN
  -- Verificar pertenencia al proyecto
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE  project_id = p_project_id
      AND  member_id  = auth.uid()
    UNION
    SELECT 1 FROM projects
    WHERE  id         = p_project_id
      AND  created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of project %', p_project_id;
  END IF;

  -- Guard anti-doble-disparo
  SELECT id INTO v_cycle_id
  FROM   strategic_cycles
  WHERE  project_id       = p_project_id
    AND  closed_at        IS NULL
    AND  ritual_responses IS NULL
  ORDER BY cycle_index DESC
  LIMIT 1;

  IF v_cycle_id IS NULL THEN
    RAISE EXCEPTION
      'No cycle available for reset on project %. '
      'Possible causes: cycle already closed, ritual already submitted, or no active cycle.',
      p_project_id;
  END IF;

  -- Validar los 7 campos requeridos
  IF NOT (
    p_ritual_responses ? 'evidence_progress'    AND
    p_ritual_responses ? 'broken_hypothesis'    AND
    p_ritual_responses ? 'main_bottleneck'       AND
    p_ritual_responses ? 'stop_doing'            AND
    p_ritual_responses ? 'next_bet'              AND
    p_ritual_responses ? 'success_signal'        AND
    p_ritual_responses ? 'invalidation_condition'
  ) THEN
    RAISE EXCEPTION
      'ritual_responses is missing required fields. '
      'Required: evidence_progress, broken_hypothesis, main_bottleneck, '
      'stop_doing, next_bet, success_signal, invalidation_condition.';
  END IF;

  -- Registrar respuestas en el ciclo activo
  UPDATE strategic_cycles
  SET    ritual_responses = p_ritual_responses
  WHERE  id = v_cycle_id;

  -- Cerrar ciclo
  v_result := close_strategic_cycle(p_project_id, 'manual');

  -- ── DEUDA.PE.21: insertar decisión estratégica en decision_events ─────────
  -- El `next_bet` del ritual es la apuesta del próximo ciclo → genera retrospectiva 30d
  v_next_bet := TRIM(p_ritual_responses->>'next_bet');
  IF v_next_bet IS NOT NULL AND LENGTH(v_next_bet) > 0 THEN
    INSERT INTO decision_events (
      project_id,
      event_type,
      payload,
      triggered_by,
      engine_version
    ) VALUES (
      p_project_id,
      'strategic_decision',
      jsonb_build_object(
        'summary',               v_next_bet,
        'success_signal',        p_ritual_responses->>'success_signal',
        'invalidation_condition', p_ritual_responses->>'invalidation_condition',
        'cycle_id',              v_cycle_id,
        'source',                'ritual'
      ),
      'ritual',
      'v2'
    );
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION submit_strategic_reset(UUID, JSONB) IS
  'R10.4 + DEUDA.PE.21: registra ritual + cierra ciclo. '
  'PE.21: al registrar next_bet, inserta decision_events (event_type=strategic_decision) '
  'para que trg_decision_retrospective_create genere retrospectiva a los 30 días. '
  'También corregido: project_members usa member_id (no user_id).';
