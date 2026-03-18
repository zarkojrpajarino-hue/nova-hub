-- ============================================================================
-- MIGRACIÓN 00041 — Fix: seed_simulation_data — cascade triggers
--
-- Bug root cause: dos triggers re-ejecutan engines durante los UPDATEs de
-- simulación (pasos 11-15), sobrescribiendo los valores simulados:
--
--   trg_coverage_phase     (project_function_coverage → run_phase_engine)
--     UPDATE coverage_score, coverage_level dispara run_phase_engine() que
--     sobrescribe project_phase_state y añade phase_history rows a NOW().
--     Resultado: G9.9 no detecta regresión porque el engine row en NOW()
--     tiene la misma fase que el row simulado anterior.
--
--   trg_phase_state_probability  (project_phase_state → run_probability_engine)
--     UPDATE phase_score, current_phase, phase_status dispara
--     run_probability_engine() que sobrescribe project_probability y
--     probability_history.
--
-- Fix: deshabilitar ambos triggers ANTES del loop de proyectos, re-habilitar
-- justo antes de run_notification_batch(). Las funciones son SECURITY DEFINER
-- owned by postgres (superuser) → ALTER TABLE es permitido.
--
-- Re-habilitación garantizada también en el bloque EXCEPTION para evitar
-- dejar los triggers deshabilitados si la función falla a mitad.
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_simulation_data(p_owner_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Contadores
  v_projects_created INTEGER  := 0;

  -- Versiones de motor (con fallback a IDs convencionales del seed 00002)
  v_phase_ver        TEXT;
  v_prob_ver         TEXT;
  v_viab_ver         TEXT;
  v_risk_ver         TEXT;

  -- Iteración sobre specs de proyecto
  v_spec             JSONB;
  v_hist             JSONB;
  v_project_id       UUID;

  -- Phase history
  v_last_phase_hist  JSONB;
  v_prev_phase       SMALLINT;
  v_this_phase       SMALLINT;
  v_trigger_src      TEXT;
  v_change_reason    TEXT;

  -- Values computados por spec
  v_prob_score_val   NUMERIC;
  v_risk_score_val   NUMERIC;
  v_top_trigger      TEXT;
  v_active_count     INTEGER;

  -- OBV mapping
  v_obv_tipo         TEXT;
  v_evtype           TEXT;
  i                  INTEGER;
BEGIN
  -- ── Engine versions ────────────────────────────────────────────────────────
  SELECT id INTO v_phase_ver FROM engine_versions WHERE motor = 'phase'       AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_prob_ver  FROM engine_versions WHERE motor = 'probability' AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_viab_ver  FROM engine_versions WHERE motor = 'viability'   AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_risk_ver  FROM engine_versions WHERE motor = 'risk'        AND is_active = TRUE LIMIT 1;

  IF v_phase_ver IS NULL THEN v_phase_ver := 'phase_v1.0';       END IF;
  IF v_prob_ver  IS NULL THEN v_prob_ver  := 'probability_v1.0'; END IF;
  IF v_viab_ver  IS NULL THEN v_viab_ver  := 'viability_v1.0';   END IF;
  IF v_risk_ver  IS NULL THEN v_risk_ver  := 'risk_v1.0';        END IF;

  -- ── Validar owner ──────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_owner_id) THEN
    RAISE EXCEPTION 'seed_simulation_data: profile not found for %', p_owner_id;
  END IF;

  -- ── Deshabilitar triggers de cascada ───────────────────────────────────────
  -- trg_coverage_phase:       project_function_coverage → run_phase_engine
  -- trg_phase_state_probability: project_phase_state → run_probability_engine
  -- Ambos sobrescriben los valores simulados de los pasos 11-15.
  -- Se re-habilitan antes de run_notification_batch() para que el batch lea
  -- el estado simulado final (no el recalculado por el engine).
  ALTER TABLE project_function_coverage DISABLE TRIGGER trg_coverage_phase;
  ALTER TABLE project_phase_state       DISABLE TRIGGER trg_phase_state_probability;

  BEGIN  -- BEGIN con EXCEPTION para garantizar re-habilitación de triggers

  -- ── Loop principal: 20 proyectos ───────────────────────────────────────────
  FOR v_spec IN SELECT jsonb_array_elements('[
    {"nombre":"NovaCRM Seed","familia":"idea_temprana","fase":1,"phase_score":14,"phase_status":"healthy","hard_signal_met":false,"probability_status":"active","probability_score":18,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"medium","risk_status":"active","inputs_available":3,"mrr":0,"runway_months":12,"phase_history":[{"phase":1,"score":8,"delta_days_ago":14},{"phase":1,"score":14,"delta_days_ago":1}],"probability_history":[{"score":12,"delta_days_ago":14},{"score":18,"delta_days_ago":1}],"obv_types":[],"evidence_types":[],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"FitLoop Discovery","familia":"idea_temprana","fase":1,"phase_score":24,"phase_status":"healthy","hard_signal_met":false,"probability_status":"low_confidence","probability_score":24,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"low","risk_status":"active","inputs_available":4,"mrr":0,"runway_months":10,"phase_history":[{"phase":1,"score":16,"delta_days_ago":10},{"phase":1,"score":24,"delta_days_ago":1}],"probability_history":[{"score":19,"delta_days_ago":10},{"score":24,"delta_days_ago":1}],"obv_types":["discovery"],"evidence_types":["interview_notes"],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"MarketMesh False Progress","familia":"idea_temprana","fase":1,"phase_score":32,"phase_status":"friction","hard_signal_met":false,"probability_status":"low_confidence","probability_score":21,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"medium","risk_status":"active","inputs_available":4,"mrr":0,"runway_months":8,"phase_history":[{"phase":1,"score":12,"delta_days_ago":21},{"phase":1,"score":24,"delta_days_ago":7},{"phase":1,"score":32,"delta_days_ago":1}],"probability_history":[{"score":18,"delta_days_ago":21},{"score":19,"delta_days_ago":7},{"score":21,"delta_days_ago":1}],"obv_types":["discovery","discovery","revenue_validation","revenue_validation"],"evidence_types":["self_report","self_report","landing_page","waitlist"],"n_tasks_overdue":1,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"CashCrash Prototype","familia":"idea_temprana","fase":1,"phase_score":8,"phase_status":"critical","hard_signal_met":false,"probability_status":"active","probability_score":9,"viability_status":"critical","t2_cash_flow_active":true,"risk_level":"critical","risk_status":"active","inputs_available":5,"mrr":0,"runway_months":1,"phase_history":[{"phase":1,"score":18,"delta_days_ago":10},{"phase":1,"score":8,"delta_days_ago":1}],"probability_history":[{"score":22,"delta_days_ago":10},{"score":9,"delta_days_ago":1}],"obv_types":[],"evidence_types":[],"n_tasks_overdue":2,"has_strategic_block":true,"has_inactive_lead":false},
    {"nombre":"SalesPilot SaaS","familia":"validacion_demanda","fase":2,"phase_score":58,"phase_status":"healthy","hard_signal_met":false,"probability_status":"active","probability_score":46,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"medium","risk_status":"active","inputs_available":4,"mrr":0,"runway_months":9,"phase_history":[{"phase":2,"score":46,"delta_days_ago":14},{"phase":2,"score":58,"delta_days_ago":1}],"probability_history":[{"score":32,"delta_days_ago":14},{"score":46,"delta_days_ago":1}],"obv_types":["revenue_validation","revenue_validation","discovery"],"evidence_types":["paid_test","interview_notes","landing_page"],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":true},
    {"nombre":"ClinicFlow Advance","familia":"validacion_demanda","fase":2,"phase_score":82,"phase_status":"healthy","hard_signal_met":true,"probability_status":"active","probability_score":61,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"low","risk_status":"active","inputs_available":5,"mrr":300,"runway_months":11,"phase_history":[{"phase":1,"score":68,"delta_days_ago":7},{"phase":2,"score":82,"delta_days_ago":1}],"probability_history":[{"score":38,"delta_days_ago":7},{"score":61,"delta_days_ago":1}],"obv_types":["revenue_validation","revenue_validation","revenue_validation","discovery"],"evidence_types":["pilot_revenue","paid_test","customer_commitment","interview_notes"],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"LocalLoop Regressed","familia":"validacion_demanda","fase":1,"phase_score":38,"phase_status":"critical","hard_signal_met":false,"probability_status":"active","probability_score":27,"viability_status":"monitoring","t2_cash_flow_active":false,"risk_level":"high","risk_status":"active","inputs_available":5,"mrr":0,"runway_months":6,"phase_history":[{"phase":2,"score":61,"delta_days_ago":8},{"phase":1,"score":38,"delta_days_ago":1}],"probability_history":[{"score":46,"delta_days_ago":8},{"score":27,"delta_days_ago":1}],"obv_types":["revenue_validation","discovery"],"evidence_types":["landing_page","interview_notes"],"n_tasks_overdue":1,"has_strategic_block":true,"has_inactive_lead":true},
    {"nombre":"CreatorStack Stagnant","familia":"validacion_demanda","fase":2,"phase_score":52,"phase_status":"friction","hard_signal_met":false,"probability_status":"low_confidence","probability_score":33,"viability_status":"stagnation","t2_cash_flow_active":false,"risk_level":"medium","risk_status":"active","inputs_available":4,"mrr":0,"runway_months":7,"phase_history":[{"phase":2,"score":51,"delta_days_ago":28},{"phase":2,"score":53,"delta_days_ago":14},{"phase":2,"score":52,"delta_days_ago":1}],"probability_history":[{"score":31,"delta_days_ago":28},{"score":35,"delta_days_ago":14},{"score":33,"delta_days_ago":1}],"obv_types":["discovery"],"evidence_types":["interview_notes"],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"OpsBoard Stable","familia":"operacion_inicial","fase":3,"phase_score":71,"phase_status":"healthy","hard_signal_met":true,"probability_status":"active","probability_score":64,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"medium","risk_status":"active","inputs_available":5,"mrr":1200,"runway_months":14,"phase_history":[{"phase":3,"score":62,"delta_days_ago":14},{"phase":3,"score":71,"delta_days_ago":1}],"probability_history":[{"score":52,"delta_days_ago":14},{"score":64,"delta_days_ago":1}],"obv_types":["operational_system","operational_system","revenue_validation","revenue_validation"],"evidence_types":["delivery_kpi","cash_tracking","pilot_revenue","customer_commitment"],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"LogiCore Ops Weak","familia":"operacion_inicial","fase":3,"phase_score":64,"phase_status":"friction","hard_signal_met":false,"probability_status":"active","probability_score":49,"viability_status":"monitoring","t2_cash_flow_active":false,"risk_level":"high","risk_status":"active","inputs_available":5,"mrr":800,"runway_months":5,"phase_history":[{"phase":3,"score":69,"delta_days_ago":10},{"phase":3,"score":64,"delta_days_ago":1}],"probability_history":[{"score":57,"delta_days_ago":10},{"score":49,"delta_days_ago":1}],"obv_types":["operational_system","revenue_validation"],"evidence_types":["delivery_kpi","pilot_revenue"],"n_tasks_overdue":2,"has_strategic_block":true,"has_inactive_lead":false},
    {"nombre":"RunwayZero Crisis","familia":"operacion_inicial","fase":3,"phase_score":41,"phase_status":"critical","hard_signal_met":false,"probability_status":"active","probability_score":16,"viability_status":"critical","t2_cash_flow_active":true,"risk_level":"critical","risk_status":"active","inputs_available":5,"mrr":900,"runway_months":1,"phase_history":[{"phase":3,"score":63,"delta_days_ago":7},{"phase":3,"score":41,"delta_days_ago":1}],"probability_history":[{"score":39,"delta_days_ago":7},{"score":16,"delta_days_ago":1}],"obv_types":["operational_system","operational_system","revenue_validation"],"evidence_types":["cash_tracking","delivery_kpi","invoice_revenue"],"n_tasks_overdue":3,"has_strategic_block":true,"has_inactive_lead":false},
    {"nombre":"RecoverFlow","familia":"operacion_inicial","fase":3,"phase_score":78,"phase_status":"healthy","hard_signal_met":true,"probability_status":"active","probability_score":58,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"low","risk_status":"active","inputs_available":5,"mrr":1500,"runway_months":9,"phase_history":[{"phase":3,"score":52,"delta_days_ago":14},{"phase":3,"score":78,"delta_days_ago":1}],"probability_history":[{"score":34,"delta_days_ago":14},{"score":58,"delta_days_ago":1}],"obv_types":["operational_system","revenue_validation","revenue_validation","operational_system"],"evidence_types":["cash_tracking","pilot_revenue","invoice_revenue","delivery_kpi"],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"ScaleDesk","familia":"escala_estable","fase":4,"phase_score":91,"phase_status":"healthy","hard_signal_met":true,"probability_status":"active","probability_score":79,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"low","risk_status":"active","inputs_available":5,"mrr":8000,"runway_months":18,"phase_history":[{"phase":4,"score":86,"delta_days_ago":14},{"phase":4,"score":91,"delta_days_ago":1}],"probability_history":[{"score":73,"delta_days_ago":14},{"score":79,"delta_days_ago":1}],"obv_types":["revenue_validation","operational_system","operational_system","revenue_validation","operational_system"],"evidence_types":["invoice_revenue","cash_tracking","delivery_kpi","customer_commitment","team_process"],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"ScaleDesk Risky","familia":"escala_estable","fase":4,"phase_score":87,"phase_status":"friction","hard_signal_met":true,"probability_status":"active","probability_score":63,"viability_status":"monitoring","t2_cash_flow_active":false,"risk_level":"high","risk_status":"active","inputs_available":5,"mrr":7600,"runway_months":4,"phase_history":[{"phase":4,"score":92,"delta_days_ago":10},{"phase":4,"score":87,"delta_days_ago":1}],"probability_history":[{"score":70,"delta_days_ago":10},{"score":63,"delta_days_ago":1}],"obv_types":["operational_system","revenue_validation","operational_system","revenue_validation"],"evidence_types":["cash_tracking","invoice_revenue","delivery_kpi","customer_commitment"],"n_tasks_overdue":1,"has_strategic_block":true,"has_inactive_lead":false},
    {"nombre":"MRRUp FlatPhase","familia":"escala_estable","fase":4,"phase_score":90,"phase_status":"healthy","hard_signal_met":true,"probability_status":"active","probability_score":76,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"low","risk_status":"active","inputs_available":5,"mrr":13000,"runway_months":20,"phase_history":[{"phase":4,"score":89,"delta_days_ago":14},{"phase":4,"score":90,"delta_days_ago":1}],"probability_history":[{"score":72,"delta_days_ago":14},{"score":76,"delta_days_ago":1}],"obv_types":["revenue_validation","operational_system","operational_system"],"evidence_types":["invoice_revenue","cash_tracking","team_process"],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"ScaleSlip","familia":"escala_estable","fase":4,"phase_score":62,"phase_status":"critical","hard_signal_met":false,"probability_status":"active","probability_score":28,"viability_status":"critical","t2_cash_flow_active":true,"risk_level":"critical","risk_status":"active","inputs_available":5,"mrr":6000,"runway_months":2,"phase_history":[{"phase":4,"score":86,"delta_days_ago":7},{"phase":4,"score":62,"delta_days_ago":1}],"probability_history":[{"score":54,"delta_days_ago":7},{"score":28,"delta_days_ago":1}],"obv_types":["operational_system","revenue_validation","operational_system","revenue_validation"],"evidence_types":["delivery_kpi","invoice_revenue","cash_tracking","customer_commitment"],"n_tasks_overdue":2,"has_strategic_block":true,"has_inactive_lead":true},
    {"nombre":"SparseHistory","familia":"edge_cases","fase":2,"phase_score":44,"phase_status":"friction","hard_signal_met":false,"probability_status":"inactive","probability_score":null,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"medium","risk_status":"insufficient_data","inputs_available":2,"mrr":0,"runway_months":9,"phase_history":[{"phase":2,"score":44,"delta_days_ago":1}],"probability_history":[],"obv_types":["discovery"],"evidence_types":["interview_notes"],"n_tasks_overdue":0,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"PartialData","familia":"edge_cases","fase":2,"phase_score":47,"phase_status":"friction","hard_signal_met":false,"probability_status":"low_confidence","probability_score":34,"viability_status":"monitoring","t2_cash_flow_active":false,"risk_level":"medium","risk_status":"insufficient_data","inputs_available":2,"mrr":0,"runway_months":6,"phase_history":[{"phase":2,"score":39,"delta_days_ago":10},{"phase":2,"score":47,"delta_days_ago":1}],"probability_history":[{"score":28,"delta_days_ago":10},{"score":34,"delta_days_ago":1}],"obv_types":["discovery","revenue_validation"],"evidence_types":["interview_notes","waitlist"],"n_tasks_overdue":1,"has_strategic_block":false,"has_inactive_lead":false},
    {"nombre":"ActivityWithoutOutcome","familia":"edge_cases","fase":2,"phase_score":55,"phase_status":"friction","hard_signal_met":false,"probability_status":"low_confidence","probability_score":37,"viability_status":"healthy","t2_cash_flow_active":false,"risk_level":"medium","risk_status":"active","inputs_available":4,"mrr":0,"runway_months":5,"phase_history":[{"phase":2,"score":31,"delta_days_ago":21},{"phase":2,"score":42,"delta_days_ago":7},{"phase":2,"score":55,"delta_days_ago":1}],"probability_history":[{"score":23,"delta_days_ago":21},{"score":31,"delta_days_ago":7},{"score":37,"delta_days_ago":1}],"obv_types":["discovery","discovery","revenue_validation","revenue_validation","revenue_validation","discovery"],"evidence_types":["self_report","self_report","landing_page","waitlist","self_report","interview_notes"],"n_tasks_overdue":2,"has_strategic_block":false,"has_inactive_lead":true},
    {"nombre":"NotificationStress","familia":"edge_cases","fase":3,"phase_score":48,"phase_status":"critical","hard_signal_met":false,"probability_status":"active","probability_score":19,"viability_status":"critical","t2_cash_flow_active":true,"risk_level":"high","risk_status":"active","inputs_available":5,"mrr":400,"runway_months":3,"phase_history":[{"phase":3,"score":67,"delta_days_ago":7},{"phase":2,"score":48,"delta_days_ago":1}],"probability_history":[{"score":41,"delta_days_ago":7},{"score":19,"delta_days_ago":1}],"obv_types":["revenue_validation","operational_system","operational_system"],"evidence_types":["paid_test","cash_tracking","delivery_kpi"],"n_tasks_overdue":4,"has_strategic_block":true,"has_inactive_lead":true}
  ]'::jsonb) LOOP

    -- ── 1. Crear proyecto ──────────────────────────────────────────────────────
    INSERT INTO projects (nombre, descripcion, fase, tipo, created_by, icon, color)
    VALUES (
      v_spec->>'nombre',
      'Simulación (' || (v_spec->>'familia') || ')',
      CASE (v_spec->>'fase')::int
        WHEN 1 THEN 'idea'::project_phase
        WHEN 2 THEN 'problema_validado'::project_phase
        WHEN 3 THEN 'mvp'::project_phase
        WHEN 4 THEN 'crecimiento'::project_phase
      END,
      'validacion'::project_type,
      p_owner_id,
      '🧪',
      '#64748b'
    )
    RETURNING id INTO v_project_id;

    -- ── 2. Añadir owner como miembro ──────────────────────────────────────────
    INSERT INTO project_members (project_id, member_id, is_lead)
    VALUES (v_project_id, p_owner_id, TRUE)
    ON CONFLICT (project_id, member_id) DO NOTHING;

    -- ── 3. Insertar OBVs ──────────────────────────────────────────────────────
    -- trg_obvs_phase y trg_obvs_probability se disparan → run_phase_engine /
    -- run_probability_engine. Los triggers de cascada (trg_coverage_phase,
    -- trg_phase_state_probability) ya están deshabilitados: el engine escribe
    -- project_phase_state y project_phase_history pero NO hay cascada secundaria.
    -- El historial generado aquí se elimina en el paso 8.
    FOR i IN 0..(jsonb_array_length(v_spec->'obv_types') - 1) LOOP
      v_obv_tipo := CASE (v_spec->'obv_types'->>i)
        WHEN 'discovery'          THEN 'exploracion'
        WHEN 'revenue_validation' THEN 'venta'
        WHEN 'operational_system' THEN 'validacion'
        ELSE 'exploracion'
      END;
      v_evtype := CASE (v_spec->'evidence_types'->>i)
        WHEN 'paid_test'           THEN 'payment'
        WHEN 'pilot_revenue'       THEN 'payment'
        WHEN 'invoice_revenue'     THEN 'payment'
        WHEN 'customer_commitment' THEN 'doc'
        WHEN 'interview_notes'     THEN 'doc'
        WHEN 'cash_tracking'       THEN 'doc'
        WHEN 'delivery_kpi'        THEN 'doc'
        WHEN 'team_process'        THEN 'doc'
        WHEN 'landing_page'        THEN 'public_url'
        WHEN 'waitlist'            THEN 'public_url'
        WHEN 'self_report'         THEN 'other'
        ELSE NULL
      END;
      INSERT INTO obvs (
        owner_id, project_id, titulo, tipo, evidence_type,
        obv_outcome, status, fecha
      ) VALUES (
        p_owner_id,
        v_project_id,
        'OBV ' || (i + 1) || ' — ' || (v_spec->>'nombre'),
        v_obv_tipo::obv_type,
        v_evtype,
        CASE (v_spec->>'nombre') WHEN 'ActivityWithoutOutcome' THEN 'partial' ELSE 'success' END,
        CASE (v_spec->>'nombre') WHEN 'ActivityWithoutOutcome'
          THEN 'pending'::kpi_status
          ELSE 'validated'::kpi_status
        END,
        CURRENT_DATE - (i * 5)
      );
    END LOOP;

    -- ── 4. Insertar tareas vencidas ────────────────────────────────────────────
    FOR i IN 1..(v_spec->>'n_tasks_overdue')::int LOOP
      INSERT INTO tasks (
        project_id, assignee_id, titulo, status, prioridad, fecha_limite
      ) VALUES (
        v_project_id,
        p_owner_id,
        'Tarea vencida ' || i || ' — ' || (v_spec->>'nombre'),
        'todo'::task_status,
        1,
        CURRENT_DATE - (i * 7)
      );
    END LOOP;

    -- ── 5. Insertar bloqueo estratégico ────────────────────────────────────────
    -- created_by omitido: FK references auth.users(id), no profiles(id).
    -- origin='engine' → created_by NULL es semánticamente correcto.
    IF (v_spec->>'has_strategic_block')::boolean THEN
      INSERT INTO strategic_blocks (
        project_id, block_type, origin, description,
        impact_weight, weeks_active, status,
        first_detected_at, last_updated_at
      ) VALUES (
        v_project_id,
        CASE (v_spec->>'viability_status')
          WHEN 'critical' THEN 'cash_bottleneck'
          ELSE 'execution_drop'
        END,
        'engine',
        'Bloqueo simulado — ' || (v_spec->>'nombre'),
        CASE (v_spec->>'viability_status') WHEN 'critical' THEN 75.0 ELSE 50.0 END,
        2,
        'active',
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '1 hour'
      );
    END IF;

    -- ── 6. Insertar lead inactivo ──────────────────────────────────────────────
    IF (v_spec->>'has_inactive_lead')::boolean THEN
      INSERT INTO obvs (
        owner_id, project_id, titulo, tipo, pipeline_status,
        nombre_contacto, responsable_id, obv_outcome, updated_at
      ) VALUES (
        p_owner_id,
        v_project_id,
        'Lead inactivo — ' || (v_spec->>'nombre'),
        'venta'::obv_type,
        'hot'::lead_status,
        'Lead Simulado',
        p_owner_id,
        'partial',
        NOW() - INTERVAL '10 days'
      );
    END IF;

    -- ── 7. Insertar métricas financieras ─────────────────────────────────────
    IF (v_spec->>'mrr')::numeric > 0 THEN
      INSERT INTO key_metrics (
        project_id, date, mrr, arr,
        cash_balance, burn_rate, runway_months,
        total_customers, new_customers
      ) VALUES (
        v_project_id,
        CURRENT_DATE,
        (v_spec->>'mrr')::numeric,
        (v_spec->>'mrr')::numeric * 12,
        (v_spec->>'mrr')::numeric * (v_spec->>'runway_months')::int,
        (v_spec->>'mrr')::numeric * 0.6,
        (v_spec->>'runway_months')::int,
        GREATEST(1, ((v_spec->>'mrr')::numeric / 300)::int),
        1
      );
    END IF;

    -- ── 8. Limpiar historial generado por engine triggers ─────────────────────
    -- Los triggers de OBV (trg_obvs_phase, trg_obvs_probability) generaron
    -- entradas en project_phase_history y project_probability_history.
    -- Las borramos todas para insertar el historial simulado con timestamps
    -- correctos. Con trg_coverage_phase y trg_phase_state_probability
    -- deshabilitados, no hay cascadas secundarias que regeneren historia.
    DELETE FROM project_phase_history       WHERE project_id = v_project_id;
    DELETE FROM project_probability_history WHERE project_id = v_project_id;

    -- ── 9. Insertar historial de fase (simulado) ──────────────────────────────
    v_prev_phase := NULL;
    FOR v_hist IN SELECT jsonb_array_elements(v_spec->'phase_history') LOOP
      v_this_phase := (v_hist->>'phase')::smallint;
      IF v_prev_phase IS NULL THEN
        v_trigger_src   := 'weekly_job';
        v_change_reason := NULL;
      ELSIF v_this_phase > v_prev_phase THEN
        v_trigger_src   := 'acceleration';
        v_change_reason := 'threshold_met';
      ELSIF v_this_phase < v_prev_phase THEN
        v_trigger_src   := 'regression';
        v_change_reason := 'regression';
      ELSE
        v_trigger_src   := 'weekly_job';
        v_change_reason := NULL;
      END IF;

      INSERT INTO project_phase_history (
        project_id, phase, phase_score, hard_signal_met,
        phase_status, change_reason, trigger_source,
        calculated_at, engine_version
      ) VALUES (
        v_project_id,
        v_this_phase,
        (v_hist->>'score')::numeric,
        (v_spec->>'hard_signal_met')::boolean,
        v_spec->>'phase_status',
        v_change_reason,
        v_trigger_src,
        NOW() - ((v_hist->>'delta_days_ago')::int || ' days')::interval,
        v_phase_ver
      );
      v_prev_phase := v_this_phase;
    END LOOP;

    -- ── 10. Insertar historial de probabilidad (simulado) ─────────────────────
    FOR v_hist IN SELECT jsonb_array_elements(v_spec->'probability_history') LOOP
      INSERT INTO project_probability_history (
        project_id, probability_score, probability_status,
        data_completeness_score, trigger_source,
        calculated_at, engine_version
      ) VALUES (
        v_project_id,
        (v_hist->>'score')::numeric,
        v_spec->>'probability_status',
        CASE (v_spec->>'probability_status')
          WHEN 'low_confidence' THEN 45.0
          ELSE 70.0
        END,
        'weekly_job',
        NOW() - ((v_hist->>'delta_days_ago')::int || ' days')::interval,
        v_prob_ver
      );
    END LOOP;

    -- ── 11. UPDATE project_phase_state ────────────────────────────────────────
    -- trg_phase_state_probability DESHABILITADO: este UPDATE no re-ejecuta
    -- run_probability_engine → project_probability no es sobrescrito.
    -- current_phase = última entrada del historial (no v_spec->>'fase').
    -- NotificationStress: fase=3 en JSON pero última entrada es phase=2
    -- → current_phase=2 → phase_regressed se detecta correctamente.
    v_last_phase_hist := v_spec->'phase_history'->(
      jsonb_array_length(v_spec->'phase_history') - 1
    );
    UPDATE project_phase_state
    SET
      current_phase         = (v_last_phase_hist->>'phase')::smallint,
      phase_score           = (v_last_phase_hist->>'score')::numeric,
      hard_signal_met       = (v_spec->>'hard_signal_met')::boolean,
      phase_status          = v_spec->>'phase_status',
      phase_entered_at      = NOW() - ((v_last_phase_hist->>'delta_days_ago')::int || ' days')::interval,
      phase_last_changed_at = NOW() - ((v_last_phase_hist->>'delta_days_ago')::int || ' days')::interval,
      last_calculated_at    = NOW() - ((v_last_phase_hist->>'delta_days_ago')::int || ' days')::interval,
      engine_version        = v_phase_ver
    WHERE project_id = v_project_id;

    -- ── 12. UPDATE project_probability ───────────────────────────────────────
    UPDATE project_probability
    SET
      probability_score       = CASE (v_spec->>'probability_status')
                                  WHEN 'inactive' THEN NULL
                                  ELSE (v_spec->>'probability_score')::numeric
                                END,
      probability_status      = v_spec->>'probability_status',
      data_completeness_score = CASE (v_spec->>'probability_status')
                                  WHEN 'inactive'       THEN 20.0
                                  WHEN 'low_confidence' THEN 45.0
                                  ELSE 70.0
                                END,
      last_calculated_at      = NOW() - INTERVAL '1 day',
      engine_version          = v_prob_ver
    WHERE project_id = v_project_id;

    -- ── 13. UPDATE project_viability_state ────────────────────────────────────
    v_top_trigger := CASE (v_spec->>'viability_status')
      WHEN 'stagnation' THEN 'stagnation'
      WHEN 'monitoring' THEN 'margin_risk'
      WHEN 'critical'   THEN 'margin_risk'
      ELSE NULL
    END;
    v_active_count := CASE (v_spec->>'viability_status')
      WHEN 'monitoring' THEN 1
      WHEN 'stagnation' THEN 1
      WHEN 'critical'   THEN 3
      ELSE 0
    END;
    UPDATE project_viability_state
    SET
      viability_status        = v_spec->>'viability_status',
      active_trigger_count    = v_active_count,
      trigger_consecutive_max = v_active_count,
      top_trigger_consecutive = v_active_count,
      top_trigger_type        = v_top_trigger,
      t2_cash_flow_active     = (v_spec->>'t2_cash_flow_active')::boolean,
      last_evaluated_at       = NOW() - INTERVAL '1 day',
      engine_version          = v_viab_ver
    WHERE project_id = v_project_id;

    -- ── 14. UPDATE project_risk_score ─────────────────────────────────────────
    UPDATE project_risk_score
    SET
      risk_score              = CASE (v_spec->>'risk_status')
                                  WHEN 'insufficient_data' THEN NULL
                                  ELSE CASE (v_spec->>'risk_level')
                                    WHEN 'critical' THEN 82.0
                                    WHEN 'high'     THEN 65.0
                                    WHEN 'medium'   THEN 45.0
                                    ELSE                 20.0
                                  END
                                END,
      risk_level              = v_spec->>'risk_level',
      risk_status             = v_spec->>'risk_status',
      inputs_available        = (v_spec->>'inputs_available')::smallint,
      data_completeness_score = CASE (v_spec->>'risk_status')
                                  WHEN 'insufficient_data' THEN 30.0
                                  ELSE 70.0
                                END,
      last_calculated_at      = NOW() - INTERVAL '1 day',
      engine_version          = v_risk_ver
    WHERE project_id = v_project_id;

    -- ── 15. UPDATE project_function_coverage ─────────────────────────────────
    -- trg_coverage_phase DESHABILITADO: este UPDATE no re-ejecuta
    -- run_phase_engine → project_phase_state no es sobrescrito con valores
    -- calculados desde OBVs reales (score incorrecto).
    UPDATE project_function_coverage
    SET
      owner_assigned_score  = CASE (v_spec->>'phase_status') WHEN 'healthy' THEN 30 WHEN 'friction' THEN 30 ELSE 0 END,
      tasks_execution_score = CASE (v_spec->>'phase_status') WHEN 'healthy' THEN 30 ELSE 0 END,
      block_health_score    = CASE (v_spec->>'phase_status') WHEN 'healthy' THEN 20 WHEN 'friction' THEN 20 ELSE 0 END,
      process_score         = CASE (v_spec->>'phase_status') WHEN 'healthy' THEN 20 ELSE 0 END,
      coverage_score        = CASE (v_spec->>'phase_status') WHEN 'healthy' THEN 100 WHEN 'friction' THEN 50 ELSE 0 END,
      coverage_level        = CASE (v_spec->>'phase_status') WHEN 'healthy' THEN 'strong' WHEN 'friction' THEN 'basic' ELSE 'none' END,
      last_calculated_at    = NOW() - INTERVAL '1 day',
      engine_version        = v_phase_ver
    WHERE project_id = v_project_id;

    v_projects_created := v_projects_created + 1;
  END LOOP;

  -- ── Re-habilitar triggers de cascada ─────────────────────────────────────
  ALTER TABLE project_function_coverage ENABLE TRIGGER trg_coverage_phase;
  ALTER TABLE project_phase_state       ENABLE TRIGGER trg_phase_state_probability;

  EXCEPTION WHEN OTHERS THEN
    -- Re-habilitar triggers aunque la función falle para no dejar el schema
    -- en estado inconsistente.
    ALTER TABLE project_function_coverage ENABLE TRIGGER trg_coverage_phase;
    ALTER TABLE project_phase_state       ENABLE TRIGGER trg_phase_state_probability;
    RAISE;
  END;

  -- ── Ejecutar batch de notificaciones ────────────────────────────────────────
  -- Con el estado simulado final y los triggers de cascada re-habilitados,
  -- el batch lee los valores correctos y genera las notificaciones esperadas.
  PERFORM run_notification_batch();

  RETURN jsonb_build_object(
    'projects_created', v_projects_created,
    'notifications_generated', (
      SELECT COUNT(*)
      FROM   notifications
      WHERE  user_id   = p_owner_id
        AND  created_at > NOW() - INTERVAL '5 minutes'
    )
  );
END;
$$;

COMMENT ON FUNCTION seed_simulation_data(UUID) IS
  'Bootstrapping para calibration gate pre-FASE 8. '
  'Crea 20 proyectos simulados (5 familias × 4 variaciones) con estados de motor '
  'precargados y ejecuta run_notification_batch() al final. '
  'Fix 00041: deshabilita trg_coverage_phase y trg_phase_state_probability durante '
  'los UPDATEs de simulación para evitar cascadas que sobrescriben valores simulados. '
  'Limpieza: DELETE FROM projects WHERE created_by = $owner AND icon = ''🧪''.';
