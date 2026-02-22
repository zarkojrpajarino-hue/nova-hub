-- =====================================================
-- SQL: CAMINO A MASTER v2 (REQUISITOS ESTRICTOS)
-- =====================================================
-- Sistema profesional con estándares altos para desafiar
-- =====================================================

-- Función para verificar si puede desafiar (VERSIÓN ESTRICTA)
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
  v_fit_score_variance NUMERIC;
  v_ranking INTEGER;
  v_weeks_explored NUMERIC;
  v_tasks_on_time_percent NUMERIC;
  v_positive_feedback_count INTEGER;
  v_obvs_validated_count INTEGER;
  v_projects_count INTEGER;
  v_can_challenge BOOLEAN := TRUE;
  v_failed_requirements TEXT[] := ARRAY[]::TEXT[];
  v_met_requirements TEXT[] := ARRAY[]::TEXT[];
  v_master_id UUID;
  v_master_name TEXT;
  v_master_fit_score NUMERIC;
  v_last_challenge_date TIMESTAMPTZ;
BEGIN
  -- ========================================
  -- REQUISITO 1: Fit Score >= 4.2
  -- ========================================
  SELECT AVG(fit_score), STDDEV(fit_score) INTO v_fit_score, v_fit_score_variance
  FROM role_exploration_periods
  WHERE member_id = p_member_id
    AND role = p_role
    AND status = 'completed'
    AND fit_score IS NOT NULL;

  IF v_fit_score IS NULL OR v_fit_score < 4.2 THEN
    v_can_challenge := FALSE;
    v_failed_requirements := array_append(
      v_failed_requirements,
      'Fit score mínimo 4.2 (actual: ' || COALESCE(v_fit_score::TEXT, 'N/A') || ')'
    );
  ELSE
    v_met_requirements := array_append(v_met_requirements, 'Fit score 4.2+ ✅');
  END IF;

  -- ========================================
  -- REQUISITO 2: Mínimo 4 semanas
  -- ========================================
  SELECT SUM(duration_days) / 7.0 INTO v_weeks_explored
  FROM role_exploration_periods
  WHERE member_id = p_member_id
    AND role = p_role
    AND status IN ('active', 'completed');

  IF v_weeks_explored IS NULL OR v_weeks_explored < 4 THEN
    v_can_challenge := FALSE;
    v_failed_requirements := array_append(
      v_failed_requirements,
      'Mínimo 4 semanas explorando (actual: ' || COALESCE(ROUND(v_weeks_explored, 1)::TEXT, '0') || ')'
    );
  ELSE
    v_met_requirements := array_append(v_met_requirements, '4+ semanas de experiencia ✅');
  END IF;

  -- ========================================
  -- REQUISITO 3: Top 3 del ranking
  -- ========================================
  SELECT ranking INTO v_ranking
  FROM role_leaderboard
  WHERE member_id = p_member_id
    AND role = p_role;

  IF v_ranking IS NULL OR v_ranking > 3 THEN
    v_can_challenge := FALSE;
    v_failed_requirements := array_append(
      v_failed_requirements,
      'Debes estar en Top 3 (actual: #' || COALESCE(v_ranking::TEXT, '?') || ')'
    );
  ELSE
    v_met_requirements := array_append(v_met_requirements, 'Top 3 del ranking ✅');
  END IF;

  -- ========================================
  -- REQUISITO 4: 80%+ tareas a tiempo
  -- ========================================
  SELECT
    CASE
      WHEN SUM(tasks_completed) > 0
      THEN (SUM(tasks_on_time)::NUMERIC / SUM(tasks_completed)::NUMERIC) * 100
      ELSE 0
    END
  INTO v_tasks_on_time_percent
  FROM role_exploration_periods
  WHERE member_id = p_member_id
    AND role = p_role
    AND status IN ('active', 'completed');

  IF v_tasks_on_time_percent IS NULL OR v_tasks_on_time_percent < 80 THEN
    v_can_challenge := FALSE;
    v_failed_requirements := array_append(
      v_failed_requirements,
      'Mínimo 80% tareas a tiempo (actual: ' || COALESCE(ROUND(v_tasks_on_time_percent)::TEXT, '0') || '%)'
    );
  ELSE
    v_met_requirements := array_append(v_met_requirements, '80%+ tareas a tiempo ✅');
  END IF;

  -- ========================================
  -- REQUISITO 5: 3+ feedback positivos
  -- ========================================
  SELECT COUNT(*) INTO v_positive_feedback_count
  FROM peer_feedback pf
  JOIN role_exploration_periods rep ON rep.id = pf.exploration_period_id
  WHERE rep.member_id = p_member_id
    AND rep.role = p_role
    AND pf.rating >= 4
    AND pf.created_at >= NOW() - INTERVAL '90 days'; -- Últimos 3 meses

  IF v_positive_feedback_count < 3 THEN
    v_can_challenge := FALSE;
    v_failed_requirements := array_append(
      v_failed_requirements,
      'Mínimo 3 feedback positivos (actual: ' || v_positive_feedback_count::TEXT || ')'
    );
  ELSE
    v_met_requirements := array_append(v_met_requirements, '3+ feedback positivos ✅');
  END IF;

  -- ========================================
  -- REQUISITO 6: 2+ OBVs validados
  -- ========================================
  SELECT SUM(obvs_validated) INTO v_obvs_validated_count
  FROM role_exploration_periods
  WHERE member_id = p_member_id
    AND role = p_role
    AND status IN ('active', 'completed');

  IF v_obvs_validated_count IS NULL OR v_obvs_validated_count < 2 THEN
    v_can_challenge := FALSE;
    v_failed_requirements := array_append(
      v_failed_requirements,
      'Mínimo 2 OBVs validados (actual: ' || COALESCE(v_obvs_validated_count::TEXT, '0') || ')'
    );
  ELSE
    v_met_requirements := array_append(v_met_requirements, '2+ OBVs validados ✅');
  END IF;

  -- ========================================
  -- REQUISITO 7: Al menos 2 proyectos diferentes
  -- ========================================
  SELECT COUNT(DISTINCT project_id) INTO v_projects_count
  FROM role_exploration_periods
  WHERE member_id = p_member_id
    AND role = p_role
    AND status IN ('active', 'completed');

  IF v_projects_count < 2 THEN
    v_can_challenge := FALSE;
    v_failed_requirements := array_append(
      v_failed_requirements,
      'Mínimo 2 proyectos diferentes (actual: ' || v_projects_count::TEXT || ')'
    );
  ELSE
    v_met_requirements := array_append(v_met_requirements, '2+ proyectos completados ✅');
  END IF;

  -- ========================================
  -- REQUISITO 8: Consistencia (varianza < 0.5)
  -- ========================================
  IF v_fit_score_variance IS NOT NULL AND v_fit_score_variance > 0.5 THEN
    v_can_challenge := FALSE;
    v_failed_requirements := array_append(
      v_failed_requirements,
      'Fit score inconsistente (varianza: ' || ROUND(v_fit_score_variance, 2)::TEXT || ', máx: 0.5)'
    );
  ELSE
    v_met_requirements := array_append(v_met_requirements, 'Rendimiento consistente ✅');
  END IF;

  -- ========================================
  -- Obtener Master actual
  -- ========================================
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

  -- Si no hay Master, cualquiera con requisitos puede serlo
  IF v_master_id IS NULL THEN
    IF v_can_challenge THEN
      v_met_requirements := array_append(v_met_requirements, 'No hay Master actual - puedes reclamar el título');
    END IF;
  ELSE
    -- Verificar cooldown del Master (3 meses)
    SELECT MAX(created_at) INTO v_last_challenge_date
    FROM master_challenges
    WHERE role = p_role
      AND master_id = v_master_id
      AND status IN ('accepted', 'in_progress', 'completed');

    IF v_last_challenge_date IS NOT NULL
       AND v_last_challenge_date > NOW() - INTERVAL '3 months' THEN
      v_can_challenge := FALSE;
      v_failed_requirements := array_prepend(
        'El Master fue desafiado recientemente (cooldown de 3 meses)',
        v_failed_requirements
      );
    END IF;
  END IF;

  -- ========================================
  -- Retornar resultado
  -- ========================================
  RETURN jsonb_build_object(
    'can_challenge', v_can_challenge,
    'met_requirements', v_met_requirements,
    'failed_requirements', v_failed_requirements,
    'your_fit_score', v_fit_score,
    'your_ranking', v_ranking,
    'weeks_explored', v_weeks_explored,
    'tasks_on_time_percent', v_tasks_on_time_percent,
    'positive_feedback_count', v_positive_feedback_count,
    'obvs_validated_count', v_obvs_validated_count,
    'projects_count', v_projects_count,
    'fit_score_variance', v_fit_score_variance,
    'master_id', v_master_id,
    'master_name', v_master_name,
    'master_fit_score', v_master_fit_score,
    'last_challenge_date', v_last_challenge_date
  );
END;
$$;

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
    'Has comenzado tu exploración de ' || p_role || '. Tienes 2 semanas para demostrar tu potencial. Requisitos: Fit score 4.2+, Top 3, 4+ semanas, 80% tareas a tiempo.',
    'high',
    '/path-to-master',
    NOW()
  FROM members m
  WHERE m.id = p_member_id;

  RETURN exploration_id;
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
  -- Verificar elegibilidad para desafiar
  (can_challenge_master(rep.member_id, rep.role))->>'can_challenge' as can_challenge_now,
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
  );

-- RLS Policies
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

-- Comentarios
COMMENT ON FUNCTION can_challenge_master IS 'Verifica TODOS los requisitos estrictos para desafiar al Master';
COMMENT ON FUNCTION start_path_to_master IS 'Inicia una nueva exploración de rol (Camino a Master)';
COMMENT ON VIEW path_to_master_active IS 'Exploraciones activas del sistema Camino a Master';
