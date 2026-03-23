-- GUARD.1 — compute_unlock_progress(project_id)
-- Returns unlock status for each F29/F30/F31 feature.
-- Never shows "blocked" — always shows progress toward unlock.

CREATE OR REPLACE FUNCTION compute_unlock_progress(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tasks_30d INT;
  v_obvs_30d INT;
  v_cycles_completed INT;
  v_key_metrics_months INT;
  v_has_integrations BOOLEAN;
  v_result JSONB := '[]'::JSONB;
BEGIN
  -- Count tasks in last 30 days
  SELECT COUNT(*) INTO v_tasks_30d
  FROM tasks WHERE project_id = p_project_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Count OBVs in last 30 days
  SELECT COUNT(*) INTO v_obvs_30d
  FROM obvs WHERE project_id = p_project_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Count completed strategic cycles
  SELECT COUNT(*) INTO v_cycles_completed
  FROM strategic_cycles WHERE project_id = p_project_id
    AND status = 'completed';

  -- Count distinct months with key_metrics entries
  SELECT COUNT(DISTINCT DATE_TRUNC('month', created_at)) INTO v_key_metrics_months
  FROM key_metrics WHERE project_id = p_project_id;

  -- Check if any integration is active
  SELECT EXISTS(
    SELECT 1 FROM integration_connections
    WHERE project_id = p_project_id AND status = 'active'
  ) INTO v_has_integrations;

  -- F31 Cycle Intelligence
  v_result := v_result || jsonb_build_object(
    'feature', 'cycle_intelligence',
    'phase', 31,
    'unlocked', v_cycles_completed >= 1,
    'progress_percent', LEAST(100, ROUND(
      CASE WHEN v_cycles_completed >= 1 THEN 100
      ELSE 0 END
    )),
    'steps', jsonb_build_array(
      jsonb_build_object('done', v_cycles_completed >= 1, 'label', 'Completar 1 ciclo estratégico', 'cta_action', '/project/cycles')
    )
  );

  -- F31 Founder Patterns v2 (needs 2 cycles)
  v_result := v_result || jsonb_build_object(
    'feature', 'founder_patterns_v2',
    'phase', 31,
    'unlocked', v_cycles_completed >= 2,
    'progress_percent', LEAST(100, ROUND((v_cycles_completed::NUMERIC / 2) * 100)),
    'steps', jsonb_build_array(
      jsonb_build_object('done', v_cycles_completed >= 1, 'label', 'Completar ciclo 1', 'cta_action', '/project/cycles'),
      jsonb_build_object('done', v_cycles_completed >= 2, 'label', 'Completar ciclo 2', 'cta_action', '/project/cycles')
    )
  );

  -- F29 Execution Trends
  v_result := v_result || jsonb_build_object(
    'feature', 'execution_trends',
    'phase', 29,
    'unlocked', v_tasks_30d >= 10 AND v_obvs_30d >= 5,
    'progress_percent', LEAST(100, ROUND(
      (LEAST(v_tasks_30d, 10)::NUMERIC / 10 * 60) +
      (LEAST(v_obvs_30d, 5)::NUMERIC / 5 * 40)
    )),
    'steps', jsonb_build_array(
      jsonb_build_object('done', v_tasks_30d >= 5, 'label', '5 tareas creadas (30d)', 'cta_action', '/tasks'),
      jsonb_build_object('done', v_tasks_30d >= 10, 'label', '10 tareas creadas (30d)', 'cta_action', '/tasks'),
      jsonb_build_object('done', v_obvs_30d >= 3, 'label', '3 OBVs registradas (30d)', 'cta_action', '/obv-center'),
      jsonb_build_object('done', v_obvs_30d >= 5, 'label', '5 OBVs registradas (30d)', 'cta_action', '/obv-center')
    )
  );

  -- F29 Pipeline Velocity
  v_result := v_result || jsonb_build_object(
    'feature', 'pipeline_velocity',
    'phase', 29,
    'unlocked', v_obvs_30d >= 5,
    'progress_percent', LEAST(100, ROUND((LEAST(v_obvs_30d, 5)::NUMERIC / 5) * 100)),
    'steps', jsonb_build_array(
      jsonb_build_object('done', v_obvs_30d >= 3, 'label', '3 OBVs con pipeline', 'cta_action', '/obv-center'),
      jsonb_build_object('done', v_obvs_30d >= 5, 'label', '5 OBVs con pipeline', 'cta_action', '/obv-center')
    )
  );

  -- F30 MRR Forecast
  v_result := v_result || jsonb_build_object(
    'feature', 'mrr_forecast',
    'phase', 30,
    'unlocked', v_key_metrics_months >= 6 OR (v_has_integrations AND v_key_metrics_months >= 3),
    'progress_percent', LEAST(100, ROUND(
      CASE WHEN v_has_integrations
        THEN (LEAST(v_key_metrics_months, 3)::NUMERIC / 3) * 100
        ELSE (LEAST(v_key_metrics_months, 6)::NUMERIC / 6) * 100
      END
    )),
    'steps', jsonb_build_array(
      jsonb_build_object('done', v_key_metrics_months >= 1, 'label', 'Registrar métricas mes 1', 'cta_action', '/financiero'),
      jsonb_build_object('done', v_key_metrics_months >= 3, 'label', 'Registrar métricas mes 3', 'cta_action', '/financiero'),
      jsonb_build_object('done', v_key_metrics_months >= 6 OR (v_has_integrations AND v_key_metrics_months >= 3),
        'label', CASE WHEN v_has_integrations THEN '3 meses con integración' ELSE '6 meses de datos' END,
        'cta_action', '/financiero'),
      jsonb_build_object('done', v_has_integrations, 'label', 'Conectar Stripe o Holded (acelera a 3 meses)', 'cta_action', '/integrations')
    )
  );

  -- F30 Stress Test
  v_result := v_result || jsonb_build_object(
    'feature', 'stress_test',
    'phase', 30,
    'unlocked', v_key_metrics_months >= 3,
    'progress_percent', LEAST(100, ROUND((LEAST(v_key_metrics_months, 3)::NUMERIC / 3) * 100)),
    'steps', jsonb_build_array(
      jsonb_build_object('done', v_key_metrics_months >= 1, 'label', 'Registrar métricas mes 1', 'cta_action', '/financiero'),
      jsonb_build_object('done', v_key_metrics_months >= 2, 'label', 'Registrar métricas mes 2', 'cta_action', '/financiero'),
      jsonb_build_object('done', v_key_metrics_months >= 3, 'label', 'Registrar métricas mes 3', 'cta_action', '/financiero')
    )
  );

  RETURN v_result;
END;
$$;
