-- =====================================================
-- SQL: CAMINO A MASTER (PATH TO MASTER)
-- =====================================================
-- Sistema que permite explorar nuevos roles EN CUALQUIER MOMENTO
-- Incluso después de la Fase 3
-- =====================================================

-- Función para iniciar "Camino a Master"
CREATE OR REPLACE FUNCTION start_path_to_master(
  p_member_id UUID,
  p_role TEXT,
  p_project_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exploration_id UUID;
  v_project_id UUID;
BEGIN
  -- Si no se especifica proyecto, buscar uno activo
  IF p_project_id IS NULL THEN
    SELECT id INTO v_project_id
    FROM projects
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_project_id IS NULL THEN
      RAISE EXCEPTION 'No hay proyectos activos disponibles';
    END IF;
  ELSE
    v_project_id := p_project_id;
  END IF;

  -- Verificar que no esté ya explorando este rol
  IF EXISTS (
    SELECT 1
    FROM role_exploration_periods
    WHERE member_id = p_member_id
      AND role = p_role
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Ya estás explorando este rol actualmente';
  END IF;

  -- Crear nueva exploración (2 semanas iniciales)
  INSERT INTO role_exploration_periods (
    member_id,
    role,
    project_id,
    start_date,
    end_date,
    status,
    duration_days,
    tasks_completed,
    tasks_on_time,
    obvs_validated,
    initiative_obvs
  ) VALUES (
    p_member_id,
    p_role,
    v_project_id,
    NOW(),
    NOW() + INTERVAL '2 weeks',
    'active',
    14,
    0,
    0,
    0,
    0
  )
  RETURNING id INTO exploration_id;

  -- Notificar al usuario
  INSERT INTO notifications (
    user_id,
    title,
    message,
    priority,
    action_url,
    created_at
  )
  SELECT
    m.auth_id,
    '🚀 Camino a Master Iniciado',
    'Has comenzado tu exploración de ' || p_role || '. ¡Tienes 2 semanas para demostrar tu potencial!',
    'high',
    '/exploration',
    NOW()
  FROM members m
  WHERE m.id = p_member_id;

  -- Notificar al equipo del proyecto
  INSERT INTO notifications (
    user_id,
    title,
    message,
    priority,
    action_url,
    created_at
  )
  SELECT
    pm.auth_id,
    '👥 Nuevo Explorador en el Equipo',
    (SELECT nombre FROM members WHERE id = p_member_id) || ' está explorando ' || p_role,
    'medium',
    '/projects/' || v_project_id::TEXT,
    NOW()
  FROM project_members pm
  WHERE pm.project_id = v_project_id
    AND pm.auth_id != (SELECT auth_id FROM members WHERE id = p_member_id);

  RETURN exploration_id;
END;
$$;

-- Función para verificar si puede desafiar a Master
CREATE OR REPLACE FUNCTION can_challenge_master(
  p_member_id UUID,
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fit_score NUMERIC;
  v_ranking INTEGER;
  v_weeks_explored INTEGER;
  v_can_challenge BOOLEAN := FALSE;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_master_id UUID;
  v_master_name TEXT;
  v_master_fit_score NUMERIC;
  v_last_challenge_date TIMESTAMPTZ;
BEGIN
  -- Obtener fit score del retador
  SELECT AVG(fit_score) INTO v_fit_score
  FROM role_exploration_periods
  WHERE member_id = p_member_id
    AND role = p_role
    AND status = 'completed'
    AND fit_score IS NOT NULL;

  -- Obtener ranking
  SELECT ranking INTO v_ranking
  FROM role_leaderboard
  WHERE member_id = p_member_id
    AND role = p_role;

  -- Calcular semanas exploradas
  SELECT
    COALESCE(SUM(duration_days) / 7, 0)::INTEGER INTO v_weeks_explored
  FROM role_exploration_periods
  WHERE member_id = p_member_id
    AND role = p_role
    AND status IN ('active', 'completed');

  -- Obtener Master actual
  SELECT
    m.id,
    m.nombre,
    mpr.star_role_fit_score
  INTO v_master_id, v_master_name, v_master_fit_score
  FROM member_phase_progress mpr
  JOIN members m ON m.id = mpr.member_id
  WHERE mpr.star_role = p_role
    AND mpr.current_phase = 3
  ORDER BY mpr.star_role_fit_score DESC NULLS LAST
  LIMIT 1;

  -- Si no hay Master, cualquiera con fit score puede serlo
  IF v_master_id IS NULL THEN
    IF v_fit_score >= 3.5 THEN
      v_can_challenge := TRUE;
      v_reasons := array_append(v_reasons, 'No hay Master actual - puedes reclamar el título');
    END IF;
  ELSE
    -- Verificar última vez que fue desafiado
    SELECT MAX(created_at) INTO v_last_challenge_date
    FROM master_challenges
    WHERE role = p_role
      AND master_id = v_master_id
      AND status IN ('accepted', 'in_progress', 'completed');

    -- Verificar si puede desafiar
    IF v_ranking IS NOT NULL AND v_ranking <= 5 THEN
      v_can_challenge := TRUE;
      v_reasons := array_append(v_reasons, 'Estás en el Top 5 del ranking');
    END IF;

    IF v_fit_score >= 3.5 THEN
      v_can_challenge := TRUE;
      v_reasons := array_append(v_reasons, 'Tu fit score es 3.5+');
    END IF;

    IF v_weeks_explored >= 2 THEN
      v_can_challenge := TRUE;
      v_reasons := array_append(v_reasons, 'Has explorado el rol por 2+ semanas');
    END IF;

    -- Verificar cooldown del Master
    IF v_last_challenge_date IS NOT NULL
       AND v_last_challenge_date > NOW() - INTERVAL '2 months' THEN
      v_can_challenge := FALSE;
      v_reasons := ARRAY['El Master fue desafiado recientemente (cooldown de 2 meses)'];
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'can_challenge', v_can_challenge,
    'reasons', v_reasons,
    'your_fit_score', v_fit_score,
    'your_ranking', v_ranking,
    'weeks_explored', v_weeks_explored,
    'master_id', v_master_id,
    'master_name', v_master_name,
    'master_fit_score', v_master_fit_score,
    'last_challenge_date', v_last_challenge_date
  );
END;
$$;

-- Función para extender exploración (si quiere más tiempo)
CREATE OR REPLACE FUNCTION extend_exploration(
  p_exploration_id UUID,
  p_additional_weeks INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Actualizar fecha de fin
  UPDATE role_exploration_periods
  SET
    end_date = end_date + (p_additional_weeks || ' weeks')::INTERVAL,
    duration_days = duration_days + (p_additional_weeks * 7),
    updated_at = NOW()
  WHERE id = p_exploration_id
    AND status = 'active';

  -- Notificar
  INSERT INTO notifications (
    user_id,
    title,
    message,
    priority,
    created_at
  )
  SELECT
    m.auth_id,
    '⏱️ Exploración Extendida',
    'Tu exploración de ' || rep.role || ' ha sido extendida ' || p_additional_weeks || ' semana(s) más',
    'medium',
    NOW()
  FROM role_exploration_periods rep
  JOIN members m ON m.id = rep.member_id
  WHERE rep.id = p_exploration_id;

  RETURN TRUE;
END;
$$;

-- Vista: Exploraciones activas "Camino a Master"
CREATE OR REPLACE VIEW path_to_master_active AS
SELECT
  rep.id,
  rep.member_id,
  m.nombre as member_name,
  rep.role,
  rep.start_date,
  rep.end_date,
  rep.duration_days,
  rep.tasks_completed,
  rep.tasks_on_time,
  rep.obvs_validated,
  rep.fit_score,
  EXTRACT(DAYS FROM (rep.end_date - NOW()))::INTEGER as days_remaining,
  -- Progreso hacia el requisito de desafío
  CASE
    WHEN rep.fit_score >= 3.5 THEN TRUE
    ELSE FALSE
  END as can_challenge_now,
  -- Ranking actual
  (
    SELECT ranking
    FROM role_leaderboard
    WHERE member_id = rep.member_id AND role = rep.role
  ) as current_ranking
FROM role_exploration_periods rep
JOIN members m ON m.id = rep.member_id
WHERE rep.status = 'active'
  -- Solo mostrar las que NO son parte de Fase 1 o Fase 2
  AND NOT EXISTS (
    SELECT 1
    FROM member_phase_progress mpp
    WHERE mpp.member_id = rep.member_id
      AND mpp.current_phase IN (1, 2)
      AND rep.role = ANY(
        COALESCE(mpp.roles_explored_phase_1, ARRAY[]::TEXT[]) ||
        COALESCE(mpp.top_2_roles, ARRAY[]::TEXT[])
      )
  );

-- RLS Policies (público para todos los autenticados)
ALTER TABLE role_exploration_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "path_to_master_select_policy" ON role_exploration_periods;
CREATE POLICY "path_to_master_select_policy"
  ON role_exploration_periods FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "path_to_master_insert_policy" ON role_exploration_periods;
CREATE POLICY "path_to_master_insert_policy"
  ON role_exploration_periods FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "path_to_master_update_policy" ON role_exploration_periods;
CREATE POLICY "path_to_master_update_policy"
  ON role_exploration_periods FOR UPDATE
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_id = auth.uid()
    )
  );

-- Comentarios
COMMENT ON FUNCTION start_path_to_master IS 'Inicia una nueva exploración de rol (Camino a Master) - disponible siempre';
COMMENT ON FUNCTION can_challenge_master IS 'Verifica si un miembro puede desafiar al Master actual de un rol';
COMMENT ON FUNCTION extend_exploration IS 'Extiende la duración de una exploración activa';
COMMENT ON VIEW path_to_master_active IS 'Exploraciones activas del sistema Camino a Master (excluye Fase 1 y 2)';
