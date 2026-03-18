-- ============================================================================
-- MIGRACIÓN 00034 — U6.12: Weekly Review digest
--
-- Tabla weekly_reviews con snapshot semanal determinista (sin IA).
-- SQL function para pg_cron (mismo patrón que viability engine).
-- ============================================================================

-- ── Tabla ───────────────────────────────────────────────────────────────────

CREATE TABLE weekly_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date   DATE NOT NULL,

  -- Snapshot de estado al cierre de semana
  phase           SMALLINT,
  phase_score     NUMERIC(5,2),
  phase_status    TEXT,
  mrr             NUMERIC(12,2),
  runway_months   INTEGER,
  tasks_completed INTEGER DEFAULT 0,
  obvs_count      INTEGER DEFAULT 0,
  sales_count     INTEGER DEFAULT 0,

  -- Resumen determinista
  summary_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { headline: string, highlights: string[], warnings: string[], next_step: string }

  -- Flags de transición
  has_regression  BOOLEAN DEFAULT FALSE,
  has_transition  BOOLEAN DEFAULT FALSE,

  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(project_id, week_end_date)
);

COMMENT ON TABLE weekly_reviews IS
  'Snapshot semanal por proyecto. Generado por pg_cron cada domingo 23:30 UTC. Sin IA — todo determinista.';

COMMENT ON COLUMN weekly_reviews.summary_json IS
  'JSON con headline (string), highlights (string[]), warnings (string[]), next_step (string).';

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_reviews: members read"
  ON weekly_reviews FOR SELECT TO authenticated
  USING (auth_is_project_member(project_id));

-- ── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_weekly_reviews_project_date
  ON weekly_reviews(project_id, week_end_date DESC);

-- ── Función de generación por proyecto ──────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_weekly_review_for_project(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_end        DATE    := CURRENT_DATE;              -- Domingo (día del cron)
  v_week_start      DATE    := CURRENT_DATE - 6;          -- Lunes anterior
  v_phase           SMALLINT;
  v_phase_score     NUMERIC(5,2);
  v_phase_status    TEXT;
  v_mrr             NUMERIC(12,2);
  v_runway          INTEGER;
  v_tasks_completed INTEGER := 0;
  v_obvs_count      INTEGER := 0;
  v_sales_count     INTEGER := 0;
  v_prev_phase      SMALLINT;
  v_has_regression  BOOLEAN := FALSE;
  v_has_transition  BOOLEAN := FALSE;
  v_highlights      JSONB   := '[]'::jsonb;
  v_warnings        JSONB   := '[]'::jsonb;
  v_headline        TEXT;
  v_next_step       TEXT;
BEGIN
  -- ── Estado de fase actual ─────────────────────────────────────────────────
  SELECT current_phase, phase_score, phase_status
  INTO   v_phase, v_phase_score, v_phase_status
  FROM   project_phase_state
  WHERE  project_id = p_project_id;

  -- ── Fase de la semana anterior (para detectar regresión/avance) ───────────
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

  -- ── OBVs registradas esta semana (por fecha de negocio) ───────────────────
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

  -- ── Warnings ─────────────────────────────────────────────────────────────
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
    summary_json, has_regression, has_transition
  ) VALUES (
    p_project_id, v_week_start, v_week_end,
    v_phase, v_phase_score, v_phase_status,
    v_mrr, v_runway,
    v_tasks_completed, v_obvs_count, v_sales_count,
    jsonb_build_object(
      'headline',   v_headline,
      'highlights', v_highlights,
      'warnings',   v_warnings,
      'next_step',  v_next_step
    ),
    v_has_regression, v_has_transition
  )
  ON CONFLICT (project_id, week_end_date) DO UPDATE SET
    phase           = EXCLUDED.phase,
    phase_score     = EXCLUDED.phase_score,
    phase_status    = EXCLUDED.phase_status,
    mrr             = EXCLUDED.mrr,
    runway_months   = EXCLUDED.runway_months,
    tasks_completed = EXCLUDED.tasks_completed,
    obvs_count      = EXCLUDED.obvs_count,
    sales_count     = EXCLUDED.sales_count,
    summary_json    = EXCLUDED.summary_json,
    has_regression  = EXCLUDED.has_regression,
    has_transition  = EXCLUDED.has_transition;
END;
$$;

-- ── Wrapper: todos los proyectos activos ─────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_all_weekly_reviews()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  FOR v_project_id IN
    SELECT id FROM projects WHERE deleted_at IS NULL
  LOOP
    BEGIN
      PERFORM generate_weekly_review_for_project(v_project_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'weekly_review: failed for project %: %', v_project_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ── Cron: cada domingo a las 23:30 UTC ───────────────────────────────────────

SELECT cron.unschedule('weekly-reviews-generator')
FROM cron.job
WHERE jobname = 'weekly-reviews-generator';

SELECT cron.schedule(
  'weekly-reviews-generator',
  '30 23 * * 0',
  $$ SELECT generate_all_weekly_reviews() $$
);
