-- =============================================
-- FUNCIONES RPC QUE FALTAN
-- =============================================

-- 1. start_path_to_master
CREATE OR REPLACE FUNCTION start_path_to_master(
  p_member_id UUID,
  p_role TEXT,
  p_project_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exploration_id UUID;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Calcular fecha de fin (4 semanas desde ahora)
  v_end_date := NOW() + INTERVAL '4 weeks';
  
  -- Verificar si ya tiene una exploración activa de este tipo
  IF EXISTS (
    SELECT 1 FROM path_to_master_active
    WHERE member_id = p_member_id
  ) THEN
    RAISE EXCEPTION 'Ya tienes una exploración Path to Master activa';
  END IF;
  
  -- Crear período de exploración
  INSERT INTO role_exploration_periods (
    member_id,
    role,
    project_id,
    start_date,
    end_date,
    status
  ) VALUES (
    p_member_id,
    p_role,
    p_project_id,
    NOW(),
    v_end_date,
    'active'
  ) RETURNING id INTO v_exploration_id;
  
  -- Actualizar progreso del miembro
  INSERT INTO member_phase_progress (member_id, current_phase)
  VALUES (p_member_id, 1)
  ON CONFLICT (member_id) DO UPDATE
  SET current_phase = GREATEST(member_phase_progress.current_phase, 1);
  
  RETURN json_build_object(
    'success', true,
    'exploration_id', v_exploration_id,
    'end_date', v_end_date
  );
END;
$$;

-- 2. can_challenge_master
CREATE OR REPLACE FUNCTION can_challenge_master(
  p_member_id UUID,
  p_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fit_score NUMERIC;
  v_weeks_explored INTEGER;
  v_ranking INTEGER;
  v_tasks_on_time_pct NUMERIC;
  v_positive_feedback INTEGER;
  v_obvs_validated INTEGER;
  v_can_challenge BOOLEAN := true;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Obtener métricas del usuario
  SELECT 
    COALESCE(AVG(fit_score), 0),
    COALESCE(SUM(EXTRACT(EPOCH FROM (end_date - start_date)) / (7 * 24 * 60 * 60)), 0),
    1, -- ranking placeholder
    COALESCE(AVG(CASE WHEN tasks_completed > 0 THEN (tasks_on_time::NUMERIC / tasks_completed) * 100 ELSE 0 END), 0),
    COALESCE(SUM(peer_feedback_count), 0),
    COALESCE(SUM(obvs_completed), 0)
  INTO 
    v_fit_score,
    v_weeks_explored,
    v_ranking,
    v_tasks_on_time_pct,
    v_positive_feedback,
    v_obvs_validated
  FROM role_exploration_periods
  WHERE member_id = p_member_id AND role = p_role AND status = 'completed';
  
  -- Verificar requisitos
  IF v_fit_score < 4.2 THEN
    v_can_challenge := false;
    v_reasons := array_append(v_reasons, 'Fit Score debe ser >= 4.2');
  END IF;
  
  IF v_weeks_explored < 4 THEN
    v_can_challenge := false;
    v_reasons := array_append(v_reasons, 'Necesitas al menos 4 semanas de experiencia');
  END IF;
  
  IF v_ranking > 3 THEN
    v_can_challenge := false;
    v_reasons := array_append(v_reasons, 'Debes estar en Top 3 del ranking');
  END IF;
  
  IF v_tasks_on_time_pct < 80 THEN
    v_can_challenge := false;
    v_reasons := array_append(v_reasons, 'Debes tener >= 80% de tareas a tiempo');
  END IF;
  
  IF v_positive_feedback < 3 THEN
    v_can_challenge := false;
    v_reasons := array_append(v_reasons, 'Necesitas al menos 3 feedbacks positivos');
  END IF;
  
  IF v_obvs_validated < 2 THEN
    v_can_challenge := false;
    v_reasons := array_append(v_reasons, 'Necesitas al menos 2 OBVs validados');
  END IF;
  
  RETURN json_build_object(
    'can_challenge', v_can_challenge,
    'fit_score', v_fit_score,
    'weeks_explored', v_weeks_explored,
    'ranking', v_ranking,
    'tasks_on_time_pct', v_tasks_on_time_pct,
    'positive_feedback', v_positive_feedback,
    'obvs_validated', v_obvs_validated,
    'reasons', v_reasons
  );
END;
$$;

-- 3. start_master_challenge
CREATE OR REPLACE FUNCTION start_master_challenge(
  p_challenger_id UUID,
  p_role TEXT,
  p_challenge_type TEXT DEFAULT 'performance_battle'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_master_id UUID;
  v_challenge_id UUID;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Buscar el master actual del rol
  SELECT id INTO v_master_id
  FROM masters
  WHERE role = p_role AND status = 'active'
  ORDER BY achieved_at DESC
  LIMIT 1;
  
  IF v_master_id IS NULL THEN
    RAISE EXCEPTION 'No hay un master activo para este rol';
  END IF;
  
  IF v_master_id = p_challenger_id THEN
    RAISE EXCEPTION 'Ya eres el master de este rol';
  END IF;
  
  -- Calcular fecha de fin según tipo de desafío
  v_end_date := CASE p_challenge_type
    WHEN 'performance_battle' THEN NOW() + INTERVAL '2 weeks'
    WHEN 'project_showdown' THEN NOW() + INTERVAL '3 weeks'
    WHEN 'peer_vote' THEN NOW() + INTERVAL '1 week'
    ELSE NOW() + INTERVAL '2 weeks'
  END;
  
  -- Crear el desafío
  INSERT INTO master_challenges (
    master_id,
    challenger_id,
    role,
    challenge_type,
    start_date,
    end_date,
    status
  ) VALUES (
    v_master_id,
    p_challenger_id,
    p_role,
    p_challenge_type,
    NOW(),
    v_end_date,
    'in_progress'
  ) RETURNING id INTO v_challenge_id;
  
  RETURN json_build_object(
    'success', true,
    'challenge_id', v_challenge_id,
    'master_id', v_master_id,
    'end_date', v_end_date
  );
END;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION start_path_to_master TO authenticated;
GRANT EXECUTE ON FUNCTION can_challenge_master TO authenticated;
GRANT EXECUTE ON FUNCTION start_master_challenge TO authenticated;
