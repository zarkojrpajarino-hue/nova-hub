-- ============================================================================
-- MIGRACIÓN 00046 — Fix: notify_probability_changes — %.0f inválido en format()
--
-- Root cause:
--   notify_probability_changes() (migrations 00036, 00037) usa el especificador
--   %.0f en las llamadas a format(). PostgreSQL format() solo soporta %s, %I,
--   %L, %% y %n. El especificador %.0f es de C-printf y no es reconocido:
--     ERROR 22023: unrecognized format() type specifier "."
--
--   Impacto:
--   - probability_critical: se lanza para CADA proyecto con probability_score < 20
--   - probability_drop: se lanza para proyectos con delta < -15
--   - probability_recovered: se lanza para proyectos con delta > 20 y prev < 30
--
--   Como notify_probability_changes es el paso 5 del loop per-proyecto en
--   run_notification_batch(), el EXCEPTION WHEN OTHERS captura el error y
--   hace ROLLBACK de todas las notificaciones de ese proyecto (fases 1-4).
--
-- Fix: reemplazar %.0f con %s + ROUND(value)::TEXT en los 3 format() calls.
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_probability_changes(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_score  NUMERIC(5,2);
  v_current_status TEXT;
  v_prev_score     NUMERIC(5,2);
  v_delta          NUMERIC(5,2);
  v_project_name   TEXT;
  v_project_url    TEXT;
BEGIN
  SELECT probability_score, probability_status
  INTO   v_current_score, v_current_status
  FROM   project_probability
  WHERE  project_id = p_project_id;

  IF v_current_status IS NULL OR v_current_status = 'inactive' THEN RETURN; END IF;

  SELECT nombre INTO v_project_name FROM projects WHERE id = p_project_id;
  v_project_url := format('/proyecto/%s', p_project_id);

  -- G9.9: selección del registro anterior vía MAX(calculated_at) previo.
  SELECT probability_score INTO v_prev_score
  FROM   project_probability_history
  WHERE  project_id    = p_project_id
    AND  calculated_at < (
           SELECT MAX(calculated_at)
           FROM   project_probability_history
           WHERE  project_id = p_project_id
         )
  ORDER  BY calculated_at DESC
  LIMIT  1;

  IF v_prev_score IS NOT NULL AND v_current_score IS NOT NULL THEN
    v_delta := v_current_score - v_prev_score;

    -- ── L3.1: probability_drop ───────────────────────────────────────────────
    -- Fix 00046: %.0f → %s con ROUND()::TEXT (format() no soporta %.0f)
    IF v_delta < -15 THEN
      PERFORM notify_all_project_members(
        p_project_id, 'probability_drop', 'high',
        'Probabilidad cayó significativamente',
        format('"%s" perdió %s pts de probabilidad (ahora %s%%). Revisa los inputs.',
          v_project_name, ROUND(ABS(v_delta))::TEXT, ROUND(v_current_score)::TEXT),
        v_project_url, 'Ver análisis',
        jsonb_build_object(
          'from_score', v_prev_score,
          'to_score',   v_current_score,
          'delta',      v_delta
        ),
        3
      );
    END IF;

    -- ── L3.3: probability_recovered ─────────────────────────────────────────
    -- Fix 00046: %.0f → %s con ROUND()::TEXT
    IF v_delta > 20 AND v_prev_score < 30 THEN
      PERFORM notify_all_project_members(
        p_project_id, 'probability_recovered', 'low',
        'Probabilidad se recuperó',
        format('"%s" recuperó %s pts de probabilidad (ahora %s%%). Buen trabajo.',
          v_project_name, ROUND(v_delta)::TEXT, ROUND(v_current_score)::TEXT),
        v_project_url, 'Ver progreso',
        jsonb_build_object(
          'from_score', v_prev_score,
          'to_score',   v_current_score,
          'delta',      v_delta
        ),
        7
      );
    END IF;
  END IF;

  -- ── L3.2: probability_critical ───────────────────────────────────────────
  -- Fix 00046: %.0f%% → %s%% con ROUND()::TEXT
  IF v_current_score IS NOT NULL AND v_current_score < 20 THEN
    PERFORM notify_all_project_members(
      p_project_id, 'probability_critical', 'critical',
      'Probabilidad crítica',
      format('"%s" tiene una probabilidad de éxito del %s%%. Acción urgente necesaria.',
        v_project_name, ROUND(v_current_score)::TEXT),
      v_project_url, 'Ver diagnóstico',
      jsonb_build_object('probability_score', v_current_score),
      7
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION notify_probability_changes(UUID) IS
  'G9.9: selección del registro anterior vía MAX(calculated_at) previo (no OFFSET 1). '
  'Fix 00046: format() %.0f → %s+ROUND()::TEXT (PostgreSQL format() no soporta %.0f).';
