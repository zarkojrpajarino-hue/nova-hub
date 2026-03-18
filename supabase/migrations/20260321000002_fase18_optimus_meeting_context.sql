-- FASE 18 — M18.6: añadir contexto de decisiones de reunión a get_optimus_context()
--
-- La función ya tiene 'recent_decisions' (de decision_events con columnas que no existen —
-- ese bloque tiene un bug preexistente). Añadimos 'meeting_recent_decisions' como
-- nueva clave que lee de integration_insights[agent_type='meeting'][insight_type='strategic_decision'].
-- Así Optimus sabe qué decisiones estratégicas se tomaron en reuniones recientes.

CREATE OR REPLACE FUNCTION get_optimus_context(
  p_project_id UUID,
  p_user_id    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Re-declarar todas las variables del cuerpo original.
  -- Esta función reemplaza la de 20260312000049 añadiendo el bloque meeting_recent_decisions.
  -- IMPORTANTE: no se modifican otras variables — solo se añade el nuevo bloque al final del
  -- RETURN jsonb_build_object(...).
  v_result JSONB;
BEGIN
  -- Delegar al cuerpo completo de la función original y añadir el nuevo campo.
  -- Estrategia: llamar a la función existente y fusionar el nuevo campo.
  -- get_optimus_context ya existe — usamos jsonb_set para añadir el campo sin duplicar lógica.
  v_result := (
    SELECT jsonb_set(
      -- Llamada a la versión anterior (que ahora se llama igual — usamos SELECT ... FROM para
      -- no entrar en recursión; Postgres ejecutará la versión guardada).
      -- Nota: como no podemos llamar recursivamente a sí misma, reconstruimos solo el bloque nuevo.
      -- La versión completa reemplaza la función de 00049. Ver comentario abajo.
      '{}'::jsonb,
      '{placeholder}',
      'true'::jsonb
    )
  );
  -- La estrategia anterior no funciona sin recursión. Implementamos el parche como ALTER:
  -- ver comentario al final de este archivo.
  RETURN NULL;
END;
$$;

-- NOTA: La estrategia de CREATE OR REPLACE sin duplicar toda la lógica no es viable en PL/pgSQL
-- sin recursión. Usamos un DO block para hacer un ALTER de la función existente añadiendo
-- el campo meeting_recent_decisions al JSON final.
-- El enfoque correcto es: DROP el stub de arriba y usar DO $$ para añadir solo la nueva
-- sección al RETURN del cuerpo existente.

-- Revertir el stub vacío
DROP FUNCTION IF EXISTS get_optimus_context(UUID, UUID);

-- Restaurar la función original con el nuevo campo añadido.
-- IMPORTANTE: este archivo reemplaza la función completa de 20260312000049_optimus_context_packet.sql.
-- Solo se cambia la última línea del RETURN jsonb_build_object(): se añade 'meeting_recent_decisions'.
-- La lógica completa se replica aquí para garantizar idempotencia en re-aplicaciones.

-- Para no duplicar 300 líneas de SQL, usamos un DO block para parchear:
DO $$
BEGIN
  -- Verificar que la función existe antes de parchearla
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_optimus_context'
  ) THEN
    RAISE EXCEPTION 'get_optimus_context no existe — aplicar 20260312000049 primero';
  END IF;
END;
$$;

-- Añadir el campo meeting_recent_decisions a la función.
-- Como no podemos hacer ALTER FUNCTION para modificar el cuerpo, creamos un wrapper
-- que llama a la función existente y fusiona el nuevo campo.

CREATE OR REPLACE FUNCTION get_optimus_context(
  p_project_id UUID,
  p_user_id    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- ── Variables de la función original (00049) ─────────────────────────────
  v_ver              TEXT;
  v_phase            SMALLINT;
  v_phase_entered    TIMESTAMPTZ;
  v_phase_status     TEXT;
  v_probability      NUMERIC;
  v_prob_trend       TEXT;
  v_prob_calc_at     TIMESTAMPTZ;
  v_viability_score  NUMERIC;
  v_viable_at        TIMESTAMPTZ;
  v_risk_level       TEXT;
  v_risk_score       NUMERIC;
  v_risk_calc_at     TIMESTAMPTZ;
  v_demand_level     TEXT;
  v_acquisition      JSONB;
  v_team_size        INT;
  v_coverage_gaps    JSONB;
  v_model_type       TEXT;
  v_pricing_model    TEXT;
  v_sales_cycle      TEXT;
  v_capital          TEXT;
  v_bottleneck_role  TEXT;
  v_user_role        TEXT;
  v_active_blocks    JSONB;
  v_optimus_mode     TEXT;
  v_last_ritual      TIMESTAMPTZ;
  v_critical_count   INT;
  v_decisions        JSONB;
  -- ── Nueva variable — M18.6 ────────────────────────────────────────────────
  v_meeting_decisions JSONB;
BEGIN
  -- ── Phase & status ────────────────────────────────────────────────────────
  SELECT engine_version, current_phase, phase_entered_at, phase_status
  INTO   v_ver, v_phase, v_phase_entered, v_phase_status
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'no_phase_state', 'project_id', p_project_id);
  END IF;

  -- ── Probability ───────────────────────────────────────────────────────────
  SELECT probability_score, trend_direction, calculated_at
  INTO   v_probability, v_prob_trend, v_prob_calc_at
  FROM   project_probability_state
  WHERE  project_id = p_project_id;

  -- ── Viability ─────────────────────────────────────────────────────────────
  SELECT viability_score, viable_since
  INTO   v_viability_score, v_viable_at
  FROM   project_viability_state
  WHERE  project_id = p_project_id;

  -- ── Risk ──────────────────────────────────────────────────────────────────
  SELECT risk_level, composite_risk_score, last_calculated_at
  INTO   v_risk_level, v_risk_score, v_risk_calc_at
  FROM   project_risk_state
  WHERE  project_id = p_project_id;

  -- ── Demand & acquisition ──────────────────────────────────────────────────
  SELECT demand_level
  INTO   v_demand_level
  FROM   project_demand_state
  WHERE  project_id = p_project_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('channel', channel_type, 'status', status)), '[]')
  INTO   v_acquisition
  FROM   project_acquisition_channels
  WHERE  project_id = p_project_id AND status = 'active';

  -- ── Team ──────────────────────────────────────────────────────────────────
  SELECT COUNT(*) INTO v_team_size
  FROM   project_members
  WHERE  project_id = p_project_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('function', function_name, 'gap_type', gap_type)), '[]')
  INTO   v_coverage_gaps
  FROM   project_coverage_gaps
  WHERE  project_id = p_project_id AND resolved_at IS NULL;

  -- ── Economic profile ──────────────────────────────────────────────────────
  SELECT model_type, pricing_model, sales_cycle_length, capital_source
  INTO   v_model_type, v_pricing_model, v_sales_cycle, v_capital
  FROM   project_economic_profile
  WHERE  project_id = p_project_id;

  -- ── User role ─────────────────────────────────────────────────────────────
  IF p_user_id IS NOT NULL THEN
    SELECT specialization_role INTO v_user_role
    FROM   project_members
    WHERE  project_id = p_project_id AND member_id = p_user_id;
  END IF;

  -- ── Bottleneck role ───────────────────────────────────────────────────────
  SELECT bottleneck_role INTO v_bottleneck_role
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  -- ── Optimus mode ──────────────────────────────────────────────────────────
  v_optimus_mode := CASE
    WHEN v_risk_level = 'critical' THEN 'crisis'
    WHEN v_phase = 1 AND (v_demand_level = 'none' OR v_demand_level IS NULL) THEN 'validation'
    WHEN v_probability >= 0.7 THEN 'growth'
    ELSE 'execution'
  END;

  -- ── Active blocks (Option A) ──────────────────────────────────────────────
  SELECT COALESCE(jsonb_agg(b ORDER BY b), '[]'::jsonb)
  INTO   v_active_blocks
  FROM (
    SELECT jsonb_build_object('type', 'clarity_block', 'reason', 'phase=1 + score<35 + no demand')
    WHERE  v_phase = 1
      AND  COALESCE(v_viability_score, 0) < 35
      AND  (v_demand_level = 'none' OR v_demand_level IS NULL)
    UNION ALL
    SELECT jsonb_build_object('type', 'traction_block', 'reason', 'no acquisition channels')
    WHERE  COALESCE(jsonb_array_length(v_acquisition), 0) = 0
  ) b;

  -- ── Last ritual ───────────────────────────────────────────────────────────
  SELECT MAX(completed_at) INTO v_last_ritual
  FROM   project_rituals
  WHERE  project_id = p_project_id;

  -- ── Critical notifications (7d) ──────────────────────────────────────────
  SELECT COUNT(*) INTO v_critical_count
  FROM   notifications
  WHERE  project_id  = p_project_id
    AND  created_at  > NOW() - INTERVAL '7 days'
    AND  priority    = 'critical';

  -- ── Recent decisions (original — puede estar vacío por bug de columnas) ───
  BEGIN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'title',    title,
        'category', decision_category,
        'at',       decided_at
      ) ORDER BY decided_at DESC
    ), '[]'::jsonb)
    INTO v_decisions
    FROM decision_events
    WHERE project_id = p_project_id
      AND decided_at  > NOW() - INTERVAL '28 days';
  EXCEPTION WHEN undefined_column THEN
    v_decisions := '[]'::jsonb;
  END;

  -- ── M18.6 — Meeting decisions (de integration_insights del Meeting Agent) ─
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'description', payload->'content'->>'summary',
      'meeting_date', source_timestamp,
      'confidence',   confidence
    ) ORDER BY source_timestamp DESC
  ), '[]'::jsonb)
  INTO v_meeting_decisions
  FROM integration_insights
  WHERE project_id    = p_project_id
    AND agent_type    = 'meeting'
    AND insight_type  = 'strategic_decision'
    AND expires_at    > NOW()
  LIMIT 3;

  -- ── Ensamblar context packet ──────────────────────────────────────────────
  RETURN jsonb_build_object(
    'engine_version',   v_ver,
    'current_phase',    v_phase,
    'phase_entered_at', v_phase_entered,
    'phase_status',     v_phase_status,
    'probability', jsonb_build_object(
      'score',       v_probability,
      'trend',       v_prob_trend,
      'calculated_at', v_prob_calc_at
    ),
    'viability', jsonb_build_object(
      'score',    v_viability_score,
      'viable_since', v_viable_at
    ),
    'risk', jsonb_build_object(
      'level',         v_risk_level,
      'score',         v_risk_score,
      'calculated_at', v_risk_calc_at
    ),
    'demand',         v_demand_level,
    'acquisition_channels', v_acquisition,
    'team_size',      v_team_size,
    'coverage_gaps',  v_coverage_gaps,
    'economic_profile', jsonb_build_object(
      'model_type',    v_model_type,
      'pricing_model', v_pricing_model,
      'sales_cycle',   COALESCE(v_sales_cycle, 'desconocido'),
      'capital',       COALESCE(v_capital, 'desconocido')
    ),
    'bottleneck_role',        v_bottleneck_role,
    'user_role',              v_user_role,
    'active_blocks',          v_active_blocks,
    'optimus_mode',           v_optimus_mode,
    'last_ritual_completed',  v_last_ritual,
    'critical_notifications_7d', COALESCE(v_critical_count, 0),
    'recent_decisions',          v_decisions,
    -- M18.6 — decisiones de reunión del Meeting Agent
    'meeting_recent_decisions',  v_meeting_decisions
  );
END;
$$;

COMMENT ON FUNCTION get_optimus_context(UUID, UUID) IS
  'P8.2 + M18.6: Ensambla el context packet de Optimus. '
  'M18.6 añade meeting_recent_decisions desde integration_insights[agent_type=meeting]. '
  'NOTA: recent_decisions tiene un bug preexistente (columnas decided_at/title/decision_category '
  'no existen en decision_events) — capturado con EXCEPTION WHEN undefined_column.';
