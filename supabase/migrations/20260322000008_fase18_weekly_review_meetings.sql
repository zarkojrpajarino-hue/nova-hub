-- FASE 18 — M18.26: Integrar meetings en generate_weekly_review_for_project()
--
-- Añade 3 columnas a weekly_reviews:
--   meetings_count         — reuniones completadas esa semana
--   commitments_generated  — tasks creadas desde reuniones esa semana
--   commitments_fulfilled  — tasks de reunión marcadas 'done' esa semana
--
-- Actualiza generate_weekly_review_for_project() para computar y guardar estos
-- valores y añadir un highlight cuando hay reuniones completadas.

-- ── Nuevas columnas ───────────────────────────────────────────────────────────

ALTER TABLE weekly_reviews
  ADD COLUMN IF NOT EXISTS meetings_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commitments_generated INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commitments_fulfilled INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN weekly_reviews.meetings_count        IS 'M18.26: Reuniones completadas esa semana.';
COMMENT ON COLUMN weekly_reviews.commitments_generated IS 'M18.26: Tasks creadas desde reuniones completadas esa semana.';
COMMENT ON COLUMN weekly_reviews.commitments_fulfilled IS 'M18.26: Tasks de reunión con status=done esa semana.';

-- ── Función actualizada ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_weekly_review_for_project(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_end             DATE    := CURRENT_DATE;
  v_week_start           DATE    := CURRENT_DATE - 6;
  v_phase                SMALLINT;
  v_phase_score          NUMERIC(5,2);
  v_phase_status         TEXT;
  v_mrr                  NUMERIC(12,2);
  v_runway               INTEGER;
  v_tasks_completed      INTEGER := 0;
  v_obvs_count           INTEGER := 0;
  v_sales_count          INTEGER := 0;
  v_meetings_count       INTEGER := 0;
  v_commitments_gen      INTEGER := 0;
  v_commitments_fulfilled INTEGER := 0;
  v_prev_phase           SMALLINT;
  v_has_regression       BOOLEAN := FALSE;
  v_has_transition       BOOLEAN := FALSE;
  v_highlights           JSONB   := '[]'::jsonb;
  v_warnings             JSONB   := '[]'::jsonb;
  v_headline             TEXT;
  v_next_step            TEXT;
BEGIN
  -- ── Estado de fase actual ─────────────────────────────────────────────────
  SELECT current_phase, phase_score, phase_status
  INTO   v_phase, v_phase_score, v_phase_status
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  -- ── Fase de la semana anterior ────────────────────────────────────────────
  SELECT phase INTO v_prev_phase
  FROM   weekly_reviews
  WHERE  project_id = p_project_id
  ORDER  BY week_end_date DESC
  LIMIT  1;

  IF v_prev_phase IS NOT NULL AND v_phase IS NOT NULL THEN
    v_has_regression := v_phase < v_prev_phase;
    v_has_transition := v_phase > v_prev_phase;
  END IF;

  -- ── Métricas más recientes ────────────────────────────────────────────────
  SELECT mrr, runway_months
  INTO   v_mrr, v_runway
  FROM   key_metrics
  WHERE  project_id = p_project_id
  ORDER  BY date DESC
  LIMIT  1;

  -- ── Tareas completadas esta semana ────────────────────────────────────────
  SELECT COUNT(*)::INTEGER INTO v_tasks_completed
  FROM   tasks
  WHERE  project_id    = p_project_id
    AND  status        = 'done'
    AND  completed_at >= v_week_start::TIMESTAMPTZ
    AND  completed_at <  (v_week_end + 1)::TIMESTAMPTZ;

  -- ── OBVs registradas esta semana ─────────────────────────────────────────
  SELECT COUNT(*)::INTEGER INTO v_obvs_count
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  fecha      >= v_week_start
    AND  fecha      <= v_week_end;

  -- ── Ventas registradas esta semana ────────────────────────────────────────
  SELECT COUNT(*)::INTEGER INTO v_sales_count
  FROM   obvs
  WHERE  project_id = p_project_id
    AND  es_venta   = TRUE
    AND  fecha      >= v_week_start
    AND  fecha      <= v_week_end;

  -- ── M18.26: reuniones completadas esta semana ─────────────────────────────
  -- Usa updated_at como proxy de "cuándo se completó" (apply-meeting-insights lo actualiza)
  SELECT COUNT(*)::INTEGER INTO v_meetings_count
  FROM   meetings
  WHERE  project_id  = p_project_id
    AND  status      = 'completed'
    AND  updated_at >= v_week_start::TIMESTAMPTZ
    AND  updated_at <  (v_week_end + 1)::TIMESTAMPTZ;

  -- ── M18.26: compromisos de reuniones de esta semana ───────────────────────
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE t.status = 'done')::INTEGER
  INTO v_commitments_gen, v_commitments_fulfilled
  FROM tasks t
  JOIN meetings m ON m.id = t.meeting_id
  WHERE m.project_id  = p_project_id
    AND m.status      = 'completed'
    AND m.updated_at >= v_week_start::TIMESTAMPTZ
    AND m.updated_at <  (v_week_end + 1)::TIMESTAMPTZ;

  -- ── Highlights ────────────────────────────────────────────────────────────
  IF v_has_transition THEN
    v_highlights := v_highlights || jsonb_build_array('Avance de fase alcanzado');
  END IF;

  IF v_tasks_completed > 0 THEN
    v_highlights := v_highlights || jsonb_build_array(
      v_tasks_completed || ' tarea' ||
      CASE WHEN v_tasks_completed > 1 THEN 's completadas' ELSE ' completada' END ||
      ' esta semana'
    );
  END IF;

  IF v_sales_count > 0 THEN
    v_highlights := v_highlights || jsonb_build_array(
      v_sales_count || ' venta' ||
      CASE WHEN v_sales_count > 1 THEN 's registradas' ELSE ' registrada' END
    );
  END IF;

  IF v_obvs_count > 0 AND v_sales_count = 0 THEN
    v_highlights := v_highlights || jsonb_build_array(
      v_obvs_count || ' observaci' ||
      CASE WHEN v_obvs_count > 1 THEN 'ones registradas' ELSE 'ón registrada' END
    );
  END IF;

  -- M18.26 — meeting highlight
  IF v_meetings_count > 0 THEN
    v_highlights := v_highlights || jsonb_build_array(
      v_meetings_count || ' reuni' ||
      CASE WHEN v_meetings_count > 1 THEN 'ones completadas' ELSE 'ón completada' END ||
      CASE
        WHEN v_commitments_gen > 0 THEN
          ' · ' || v_commitments_gen || ' compromisos · ' ||
          ROUND(v_commitments_fulfilled::NUMERIC / v_commitments_gen * 100) || '% cumplidos'
        ELSE ''
      END
    );
  END IF;

  -- ── Warnings ──────────────────────────────────────────────────────────────
  IF v_has_regression THEN
    v_warnings := v_warnings || jsonb_build_array('Regresión de fase detectada');
  END IF;

  IF v_runway IS NOT NULL AND v_runway < 3 THEN
    v_warnings := v_warnings || jsonb_build_array(
      'Runway crítico: ' || v_runway || ' mes' ||
      CASE WHEN v_runway = 1 THEN '' ELSE 'es' END
    );
  END IF;

  IF v_tasks_completed = 0 AND v_obvs_count = 0 THEN
    v_warnings := v_warnings || jsonb_build_array('Sin actividad registrada esta semana');
  END IF;

  -- ── Headline ──────────────────────────────────────────────────────────────
  v_headline := CASE
    WHEN v_has_transition                          THEN 'Semana de avance: nuevo nivel alcanzado'
    WHEN v_has_regression                          THEN 'Semana de alerta: revisión necesaria'
    WHEN v_sales_count > 0                         THEN 'Semana productiva: venta(s) registrada(s)'
    WHEN v_tasks_completed > 2                     THEN 'Buena semana de ejecución'
    WHEN v_tasks_completed = 0 AND v_obvs_count = 0 THEN 'Semana sin actividad registrada'
    ELSE                                                'Semana activa'
  END;

  -- ── Next step (por fase) ──────────────────────────────────────────────────
  v_next_step := CASE v_phase
    WHEN 1  THEN 'Registra al menos 3 conversaciones con usuarios potenciales'
    WHEN 2  THEN 'Valida al menos una hipótesis con datos reales'
    WHEN 3  THEN 'Consolida métricas clave: MRR y clientes activos'
    WHEN 4  THEN 'Mantén el ritmo: revisa OKRs y ajusta si es necesario'
    ELSE         'Continúa ejecutando y registrando avances'
  END;

  -- ── Upsert ────────────────────────────────────────────────────────────────
  INSERT INTO weekly_reviews (
    project_id, week_start_date, week_end_date,
    phase, phase_score, phase_status,
    mrr, runway_months,
    tasks_completed, obvs_count, sales_count,
    meetings_count, commitments_generated, commitments_fulfilled,
    summary_json, has_regression, has_transition
  ) VALUES (
    p_project_id, v_week_start, v_week_end,
    v_phase, v_phase_score, v_phase_status,
    v_mrr, v_runway,
    v_tasks_completed, v_obvs_count, v_sales_count,
    v_meetings_count, v_commitments_gen, v_commitments_fulfilled,
    jsonb_build_object(
      'headline',   v_headline,
      'highlights', v_highlights,
      'warnings',   v_warnings,
      'next_step',  v_next_step
    ),
    v_has_regression, v_has_transition
  )
  ON CONFLICT (project_id, week_end_date) DO UPDATE SET
    phase                  = EXCLUDED.phase,
    phase_score            = EXCLUDED.phase_score,
    phase_status           = EXCLUDED.phase_status,
    mrr                    = EXCLUDED.mrr,
    runway_months          = EXCLUDED.runway_months,
    tasks_completed        = EXCLUDED.tasks_completed,
    obvs_count             = EXCLUDED.obvs_count,
    sales_count            = EXCLUDED.sales_count,
    meetings_count         = EXCLUDED.meetings_count,
    commitments_generated  = EXCLUDED.commitments_generated,
    commitments_fulfilled  = EXCLUDED.commitments_fulfilled,
    summary_json           = EXCLUDED.summary_json,
    has_regression         = EXCLUDED.has_regression,
    has_transition         = EXCLUDED.has_transition;
END;
$$;

COMMENT ON FUNCTION generate_weekly_review_for_project(UUID) IS
  'M18.26: Incluye reuniones completadas + compromisos de reunión en el resumen semanal.';
