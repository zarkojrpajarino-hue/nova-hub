-- =============================================================================
-- MIGRACIÓN FASE 28 — Optimus Personalization
--
-- 1. Tabla optimus_profile (perfil personalizado por founder×proyecto)
-- 2. Función compute_optimus_profile() (agrega feedbacks → preferencias)
-- 3. Función update_all_optimus_profiles() (cron wrapper)
-- 4. Cron semanal
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. optimus_profile
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS optimus_profile (
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL,
  preferred_depth  TEXT        NOT NULL DEFAULT 'equilibrado'
                     CHECK (preferred_depth IN ('conciso', 'equilibrado', 'detallado')),
  risk_tolerance   TEXT        NOT NULL DEFAULT 'moderado'
                     CHECK (risk_tolerance IN ('conservador', 'moderado', 'agresivo')),
  response_style   TEXT        NOT NULL DEFAULT 'default'
                     CHECK (response_style IN ('default', 'más específico', 'más estratégico', 'más motivacional')),
  feedback_summary JSONB       NOT NULL DEFAULT '{}',
  total_feedbacks  INTEGER     NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

COMMENT ON TABLE optimus_profile IS
  'FASE 28: Perfil personalizado de Optimus por founder×proyecto. Derivado automáticamente del feedback.';

-- RLS: usuario solo lee/escribe su propio perfil
ALTER TABLE optimus_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "optimus_profile: user reads own"
  ON optimus_profile FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- Service role writes (compute function is SECURITY DEFINER)

-- ---------------------------------------------------------------------------
-- 2. compute_optimus_profile(project_id, user_id)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compute_optimus_profile(p_project_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total          INTEGER;
  v_down_count     INTEGER;
  v_too_obvious    INTEGER;
  v_not_actionable INTEGER;
  v_wrong_context  INTEGER;
  v_disagree       INTEGER;
  v_helpful        INTEGER;
  v_depth          TEXT := 'equilibrado';
  v_risk           TEXT := 'moderado';
  v_style          TEXT := 'default';
  v_summary        JSONB;
BEGIN
  -- Aggregate last 30 feedbacks
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE vote = 'down'),
    COUNT(*) FILTER (WHERE category = 'too_obvious'),
    COUNT(*) FILTER (WHERE category = 'not_actionable'),
    COUNT(*) FILTER (WHERE category = 'wrong_context'),
    COUNT(*) FILTER (WHERE category = 'disagree'),
    COUNT(*) FILTER (WHERE category = 'helpful')
  INTO v_total, v_down_count, v_too_obvious, v_not_actionable, v_wrong_context, v_disagree, v_helpful
  FROM (
    SELECT vote, category
    FROM   optimus_feedback_events
    WHERE  project_id = p_project_id
      AND  user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 30
  ) recent;

  -- Need at least 5 feedbacks to derive preferences
  IF v_total < 5 THEN
    RETURN;
  END IF;

  -- Build summary
  v_summary := jsonb_build_object(
    'total', v_total,
    'up', v_total - v_down_count,
    'down', v_down_count,
    'too_obvious', v_too_obvious,
    'not_actionable', v_not_actionable,
    'wrong_context', v_wrong_context,
    'disagree', v_disagree,
    'helpful', v_helpful
  );

  -- Derive preferred_depth
  -- >50% too_obvious → founder wants more depth
  IF v_too_obvious::NUMERIC / v_total > 0.5 THEN
    v_depth := 'detallado';
  -- >70% thumbs UP (vote='up') → current depth is good, keep concise
  -- Note: v_helpful counts category='helpful' (thumbs down). For depth,
  -- we use thumbs UP ratio: (total - down_count) / total
  ELSIF (v_total - v_down_count)::NUMERIC / v_total > 0.7 THEN
    v_depth := 'conciso';
  END IF;

  -- Derive risk_tolerance
  -- >30% disagree → founder is more conservative than Optimus
  IF v_disagree::NUMERIC / v_total > 0.3 THEN
    v_risk := 'conservador';
  -- Very few disagrees + mostly up → founder trusts bold moves
  ELSIF v_disagree::NUMERIC / v_total < 0.1 AND v_down_count::NUMERIC / v_total < 0.2 THEN
    v_risk := 'agresivo';
  END IF;

  -- Derive response_style
  IF v_not_actionable::NUMERIC / v_total > 0.4 THEN
    v_style := 'más específico';
  ELSIF v_wrong_context::NUMERIC / v_total > 0.3 THEN
    v_style := 'más estratégico';
  ELSIF v_too_obvious::NUMERIC / v_total > 0.3 AND v_not_actionable::NUMERIC / v_total < 0.2 THEN
    v_style := 'más motivacional';
  END IF;

  -- UPSERT
  INSERT INTO optimus_profile (project_id, user_id, preferred_depth, risk_tolerance, response_style, feedback_summary, total_feedbacks, updated_at)
  VALUES (p_project_id, p_user_id, v_depth, v_risk, v_style, v_summary, v_total, NOW())
  ON CONFLICT (project_id, user_id) DO UPDATE SET
    preferred_depth  = EXCLUDED.preferred_depth,
    risk_tolerance   = EXCLUDED.risk_tolerance,
    response_style   = EXCLUDED.response_style,
    feedback_summary = EXCLUDED.feedback_summary,
    total_feedbacks   = EXCLUDED.total_feedbacks,
    updated_at       = EXCLUDED.updated_at;
END;
$$;

COMMENT ON FUNCTION compute_optimus_profile(UUID, UUID) IS
  'FASE 28: Agrega últimos 30 feedbacks y deriva preferencias (depth, risk, style). Min 5 feedbacks.';

-- ---------------------------------------------------------------------------
-- 3. update_all_optimus_profiles() — cron wrapper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_all_optimus_profiles()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT project_id, user_id
    FROM   optimus_feedback_events
    WHERE  created_at >= NOW() - INTERVAL '30 days'
    GROUP BY project_id, user_id
    HAVING COUNT(*) >= 5
  LOOP
    PERFORM compute_optimus_profile(v_rec.project_id, v_rec.user_id);
  END LOOP;
END;
$$;

-- 4. Cron: domingo 22:00 UTC
SELECT cron.schedule(
  'weekly-optimus-profiles',
  '0 22 * * 0',
  $$SELECT update_all_optimus_profiles()$$
);

-- ---------------------------------------------------------------------------
-- 5. Overlay: añadir optimus_profile al context packet
-- Crea función wrapper que llama get_optimus_context() + añade perfil
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_optimus_context_with_profile(
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
  v_context JSONB;
  v_profile RECORD;
BEGIN
  -- Get base context packet
  v_context := get_optimus_context(p_project_id, p_user_id);

  -- Add optimus_profile if available
  IF p_user_id IS NOT NULL THEN
    SELECT preferred_depth, risk_tolerance, response_style, total_feedbacks
    INTO   v_profile
    FROM   optimus_profile
    WHERE  project_id = p_project_id
      AND  user_id = p_user_id;

    IF FOUND THEN
      v_context := v_context || jsonb_build_object(
        'optimus_profile', jsonb_build_object(
          'preferred_depth', v_profile.preferred_depth,
          'risk_tolerance', v_profile.risk_tolerance,
          'response_style', v_profile.response_style,
          'total_feedbacks', v_profile.total_feedbacks
        )
      );
    END IF;
  END IF;

  RETURN v_context;
END;
$$;

COMMENT ON FUNCTION get_optimus_context_with_profile(UUID, UUID) IS
  'FASE 28: Wrapper de get_optimus_context() que añade optimus_profile al output JSONB.';
