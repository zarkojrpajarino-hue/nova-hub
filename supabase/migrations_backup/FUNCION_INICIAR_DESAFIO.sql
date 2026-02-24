/**
 * FUNCIÓN: INICIAR DESAFÍO
 *
 * Permite a un usuario desafiar al Master actual de un rol
 * si cumple TODOS los requisitos
 */

CREATE OR REPLACE FUNCTION start_master_challenge(
  p_challenger_id UUID,
  p_role TEXT,
  p_challenge_type TEXT -- 'performance_battle', 'project_showdown', 'peer_vote'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_can_challenge BOOLEAN;
  v_requirements JSON;
  v_current_master_id UUID;
  v_challenge_id UUID;
  v_end_date TIMESTAMP;
  v_duration_days INTEGER;
BEGIN
  -- Verificar si puede desafiar
  SELECT can_challenge INTO v_can_challenge
  FROM can_challenge_master(p_challenger_id, p_role);

  IF NOT v_can_challenge THEN
    SELECT requirements INTO v_requirements
    FROM can_challenge_master(p_challenger_id, p_role);

    RETURN json_build_object(
      'success', false,
      'error', 'No cumples todos los requisitos para desafiar',
      'requirements', v_requirements
    );
  END IF;

  -- Obtener el Master actual
  SELECT member_id INTO v_current_master_id
  FROM member_phase_progress
  WHERE star_role::TEXT = p_role
    AND current_phase = 3
  ORDER BY star_role_fit_score DESC
  LIMIT 1;

  IF v_current_master_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No hay Master actual para este rol'
    );
  END IF;

  -- No puedes desafiarte a ti mismo
  IF v_current_master_id = p_challenger_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ya eres el Master de este rol'
    );
  END IF;

  -- Verificar cooldown del Master (3 meses desde último desafío)
  IF EXISTS (
    SELECT 1
    FROM master_challenges
    WHERE master_id = v_current_master_id
      AND role::TEXT = p_role
      AND status IN ('completed', 'in_progress')
      AND created_at > NOW() - INTERVAL '3 months'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El Master tiene cooldown activo. Debe esperar 3 meses entre desafíos.'
    );
  END IF;

  -- Calcular duración según tipo de desafío
  CASE p_challenge_type
    WHEN 'performance_battle' THEN
      v_duration_days := 14; -- 2 semanas
    WHEN 'project_showdown' THEN
      v_duration_days := 21; -- 3 semanas
    WHEN 'peer_vote' THEN
      v_duration_days := 7; -- 1 semana
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Tipo de desafío inválido'
      );
  END CASE;

  v_end_date := NOW() + (v_duration_days || ' days')::INTERVAL;

  -- Crear el desafío
  INSERT INTO master_challenges (
    master_id,
    challenger_id,
    role,
    challenge_type,
    status,
    start_date,
    end_date,
    master_score,
    challenger_score,
    voting_threshold_master,
    voting_threshold_challenger
  ) VALUES (
    v_current_master_id,
    p_challenger_id,
    p_role::specialization_role,
    p_challenge_type,
    'in_progress',
    NOW(),
    v_end_date,
    0.0,
    0.0,
    CASE WHEN p_challenge_type = 'peer_vote' THEN 0.51 ELSE NULL END,
    CASE WHEN p_challenge_type = 'peer_vote' THEN 0.60 ELSE NULL END
  )
  RETURNING id INTO v_challenge_id;

  -- Notificar al Master
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    priority
  ) VALUES (
    v_current_master_id,
    'Te han desafiado!',
    'Un miembro del equipo ha lanzado un desafio para disputar tu titulo de Master en ' || p_role || '. El desafio comienza ahora.',
    'challenge',
    '/path-to-master',
    'high'
  );

  -- Notificar al retador
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    priority
  ) VALUES (
    p_challenger_id,
    'Desafio iniciado!',
    'Tu desafio por el rol ' || p_role || ' ha comenzado. Tienes ' || v_duration_days || ' dias para demostrar tu valía.',
    'challenge',
    '/path-to-master',
    'high'
  );

  -- Notificar al resto del equipo
  INSERT INTO notifications (user_id, title, message, type, action_url, priority)
  SELECT
    id,
    'Nuevo desafio en curso!',
    'Hay un desafio activo por el rol ' || p_role || '. Puedes seguir el progreso en tiempo real.',
    'challenge',
    '/path-to-master',
    'medium'
  FROM members
  WHERE id NOT IN (v_current_master_id, p_challenger_id);

  RETURN json_build_object(
    'success', true,
    'challenge_id', v_challenge_id,
    'master_id', v_current_master_id,
    'challenger_id', p_challenger_id,
    'role', p_role,
    'type', p_challenge_type,
    'end_date', v_end_date,
    'message', 'Desafio creado exitosamente!'
  );
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION start_master_challenge(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION start_master_challenge IS 'Inicia un desafío formal contra el Master actual de un rol si el retador cumple todos los requisitos';
