-- ============================================================
-- 20260312000050_fase10_strategic_cycles_runtime.sql
--
-- R10.3 + R10.4: Runtime del Strategic Reset Ritual.
--
-- Qué hace esta migración:
--   1. ADD COLUMN cycle_evaluation a strategic_cycles                   (R10.3)
--   2. Reescribe fn_initialize_project_data() con engine_snapshot en ciclo 1
--   3. CREATE FUNCTION close_strategic_cycle() — cierra ciclo, evalúa, rollover
--   4. CREATE FUNCTION submit_strategic_reset() — registra ritual + llama close
--
-- Arquitectura (Opción B confirmada):
--   engine_snapshot = estado del engine al INICIO del ciclo (apertura).
--   Al cerrar: se lee engine_snapshot de apertura + estado actual vía get_optimus_context().
--   Se compara para calcular cycle_evaluation.
--   El estado actual en el momento del cierre se guarda como engine_snapshot del ciclo N+1.
--   Sin columna adicional para snapshot de cierre — solo apertura.
--
-- Referencias: STRATEGIC_RESET_RITUAL.md, SYSTEM_OVERVIEW.md, BENCHMARKS_V1.md
-- ============================================================


-- ── 1. Schema: cycle_evaluation ──────────────────────────────────────────────

ALTER TABLE strategic_cycles
  ADD COLUMN IF NOT EXISTS cycle_evaluation TEXT NULL
    CONSTRAINT chk_cycle_evaluation
      CHECK (cycle_evaluation IN ('progress', 'stagnation', 'regression'));

COMMENT ON COLUMN strategic_cycles.cycle_evaluation IS
  'R10.3. Evaluación del ciclo al cierre. '
  'progress: phase_score subió Y probability_trend=growing. '
  'regression: viability_status=critical O phase_regressed=true. '
  'stagnation: resto de casos. '
  'NULL hasta que el ciclo se cierre. '
  'Derivada comparando engine_snapshot (apertura) vs get_optimus_context() al cierre.';


-- ── 2. fn_initialize_project_data() — ciclo 1 con engine_snapshot inicial ────
--
-- Cambio mínimo respecto a la versión original (migración 00002):
-- Solo se modifica el INSERT en strategic_cycles para incluir engine_snapshot.
-- El snapshot de ciclo 1 usa los valores que la propia función acaba de insertar
-- en las tablas de engine — no llama get_optimus_context() para evitar overhead
-- en el trigger (proyecto recién creado, state tables recién insertadas).
--
-- Todos los demás bloques son idénticos al original.

CREATE OR REPLACE FUNCTION fn_initialize_project_data()
RETURNS TRIGGER AS $$
DECLARE
  v_phase_ver       TEXT;
  v_probability_ver TEXT;
  v_viability_ver   TEXT;
  v_execution_ver   TEXT;
  v_risk_ver        TEXT;
  v_start_date      DATE;
BEGIN
  -- Resolver versiones activas por motor desde DB (sin hardcodear strings).
  -- Fallback al id convencional si el seed no corrió (no debería ocurrir).
  SELECT id INTO v_phase_ver       FROM engine_versions WHERE motor = 'phase'       AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_probability_ver FROM engine_versions WHERE motor = 'probability' AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_viability_ver   FROM engine_versions WHERE motor = 'viability'   AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_execution_ver   FROM engine_versions WHERE motor = 'execution'   AND is_active = TRUE LIMIT 1;
  SELECT id INTO v_risk_ver        FROM engine_versions WHERE motor = 'risk'        AND is_active = TRUE LIMIT 1;

  IF v_phase_ver       IS NULL THEN v_phase_ver       := 'phase_v1.0';       END IF;
  IF v_probability_ver IS NULL THEN v_probability_ver := 'probability_v1.0'; END IF;
  IF v_viability_ver   IS NULL THEN v_viability_ver   := 'viability_v1.0';   END IF;
  IF v_execution_ver   IS NULL THEN v_execution_ver   := 'execution_v1.0';   END IF;
  IF v_risk_ver        IS NULL THEN v_risk_ver        := 'risk_v1.0';        END IF;

  -- Lunes de la semana actual (ISO week) para el primer ciclo estratégico.
  v_start_date := date_trunc('week', CURRENT_DATE)::date;

  -- ── project_functions (3 funciones críticas fijas) ─────────────────────────
  INSERT INTO project_functions (project_id, function_type)
  VALUES
    (NEW.id, 'demand'),
    (NEW.id, 'delivery'),
    (NEW.id, 'cash')
  ON CONFLICT (project_id, function_type) DO NOTHING;

  -- ── project_phase_state ────────────────────────────────────────────────────
  -- phase_status='friction' y no 'critical': Day 1 sin datos no es señal de crisis.
  INSERT INTO project_phase_state (
    project_id, current_phase, phase_score, hard_signal_met,
    phase_status, phase_entered_at, phase_last_changed_at,
    last_calculated_at, engine_version
  ) VALUES (
    NEW.id, 1, 0, FALSE, 'friction', NOW(), NOW(), NOW(), v_phase_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_probability ────────────────────────────────────────────────────
  -- 'inactive': <2 inputs con datos reales disponibles en Day 1.
  INSERT INTO project_probability (
    project_id, probability_status, data_completeness_score,
    last_calculated_at, engine_version
  ) VALUES (
    NEW.id, 'inactive', 0, NOW(), v_probability_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_viability_state ────────────────────────────────────────────────
  -- 'healthy': sin triggers activos en Day 1.
  INSERT INTO project_viability_state (
    project_id, viability_status, active_trigger_count,
    trigger_consecutive_max, top_trigger_consecutive,
    last_evaluated_at, engine_version
  ) VALUES (
    NEW.id, 'healthy', 0, 0, 0, NOW(), v_viability_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_risk_score ─────────────────────────────────────────────────────
  -- 'insufficient_data': 0 inputs disponibles en Day 1.
  INSERT INTO project_risk_score (
    project_id, risk_score, risk_level, risk_status,
    inputs_available, data_completeness_score,
    last_calculated_at, engine_version
  ) VALUES (
    NEW.id, NULL, 'low', 'insufficient_data',
    0, 0, NOW(), v_risk_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_strategy_current ───────────────────────────────────────────────
  -- Todos los campos de hipótesis NULL: el founder los completa en onboarding.
  INSERT INTO project_strategy_current (
    project_id, version_number, last_updated_at
  ) VALUES (
    NEW.id, 1, NOW()
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_economic_profile ───────────────────────────────────────────────
  -- Valores 'unknown': el founder declara en onboarding / perfil económico.
  INSERT INTO project_economic_profile (
    project_id, model_type, pricing_model, revenue_type,
    field_sources, confidence_score, confidence_level,
    last_updated_at, engine_version
  ) VALUES (
    NEW.id, 'unknown', 'unknown', 'mixed',
    '{}', 0, 'low', NOW(), v_execution_ver
  ) ON CONFLICT (project_id) DO NOTHING;

  -- ── project_function_coverage (3 filas — una por función crítica) ──────────
  -- score=0, level='none': sin datos de tareas, owner, blocks ni proceso.
  INSERT INTO project_function_coverage (
    project_id, function_type,
    owner_assigned_score, tasks_execution_score,
    block_health_score, process_score,
    coverage_score, coverage_level,
    last_calculated_at, engine_version
  ) VALUES
    (NEW.id, 'demand',   0, 0, 0, 0, 0, 'none', NOW(), v_phase_ver),
    (NEW.id, 'delivery', 0, 0, 0, 0, 0, 'none', NOW(), v_phase_ver),
    (NEW.id, 'cash',     0, 0, 0, 0, 0, 'none', NOW(), v_phase_ver)
  ON CONFLICT (project_id, function_type) DO NOTHING;

  -- ── strategic_cycles (ciclo 1 — con engine_snapshot de apertura) ───────────
  -- Opción B: engine_snapshot guarda el estado inicial conocido (Day 1).
  -- No se llama get_optimus_context() aquí para evitar overhead en trigger.
  -- Los valores coinciden con los que las INSERTs anteriores acaban de registrar.
  -- Ciclos N+1 (creados por close_strategic_cycle) sí usan get_optimus_context().
  INSERT INTO strategic_cycles (
    project_id, cycle_index, start_date, end_date, engine_snapshot
  ) VALUES (
    NEW.id,
    1,
    v_start_date,
    v_start_date + 27,
    jsonb_build_object(
      'phase_score',       0.0,
      'probability_score', 0.0,
      'probability_trend', 'insufficient_data',
      'viability_status',  'healthy',
      'risk_level',        'low'
    )
  ) ON CONFLICT (project_id, cycle_index) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ── 3. close_strategic_cycle() ───────────────────────────────────────────────
--
-- Cierra el ciclo activo de un proyecto, evalúa el ciclo comparando
-- engine_snapshot de apertura vs estado actual del engine, y crea el siguiente ciclo.
--
-- Evaluación (prioridad: regression > progress > stagnation):
--   regression: viability_status = 'critical' OR phase_regressed = true
--   progress:   phase_score subió Y probability_trend = 'growing' (ambas condiciones)
--   stagnation: resto de casos
--
-- Nota: 'progress' requiere AMBAS condiciones simultáneas (spec STRATEGIC_RESET_RITUAL.md §R10.3).
-- Si solo una mejora sin la otra → stagnation.
--
-- Llamada por: submit_strategic_reset() (close_reason='manual')
--              cron run_strategic_cycle_checks() (close_reason='scheduled') — R10.5, pendiente
--
-- Devuelve: cycle_evaluation ('progress'|'stagnation'|'regression') o NULL si sin ciclo activo.

CREATE OR REPLACE FUNCTION close_strategic_cycle(
  p_project_id   UUID,
  p_close_reason TEXT DEFAULT 'scheduled'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_id          UUID;
  v_cycle_index       INTEGER;
  v_snapshot_start    JSONB;
  v_context_now       JSONB;
  v_phase_score_start NUMERIC;
  v_phase_score_now   NUMERIC;
  v_prob_trend_now    TEXT;
  v_viability_now     TEXT;
  v_phase_regressed   BOOLEAN;
  v_evaluation        TEXT;
  v_next_start_date   DATE;
BEGIN
  -- Buscar ciclo activo (sin cierre)
  SELECT id, cycle_index, engine_snapshot
  INTO   v_cycle_id, v_cycle_index, v_snapshot_start
  FROM   strategic_cycles
  WHERE  project_id = p_project_id
    AND  closed_at  IS NULL
  ORDER BY cycle_index DESC
  LIMIT 1;

  -- Sin ciclo activo: salir sin error (idempotente)
  IF v_cycle_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Estado actual del engine
  v_context_now := get_optimus_context(p_project_id);

  -- Extraer señales del contexto actual
  v_phase_score_now  := COALESCE((v_context_now->>'phase_score')::NUMERIC, 0);
  v_prob_trend_now   := COALESCE(v_context_now->>'probability_trend', 'insufficient_data');
  v_viability_now    := COALESCE(v_context_now->>'viability_status', 'healthy');
  v_phase_regressed  := COALESCE((v_context_now->>'phase_regressed')::BOOLEAN, FALSE);

  -- Extraer phase_score de apertura del ciclo
  -- Para ciclos pre-migración con engine_snapshot='{}': COALESCE devuelve 0 (estado inicial)
  v_phase_score_start := COALESCE((v_snapshot_start->>'phase_score')::NUMERIC, 0);

  -- Evaluar ciclo
  IF v_viability_now = 'critical' OR v_phase_regressed = TRUE THEN
    v_evaluation := 'regression';
  ELSIF v_phase_score_now > v_phase_score_start
    AND v_prob_trend_now = 'growing' THEN
    v_evaluation := 'progress';
  ELSE
    v_evaluation := 'stagnation';
  END IF;

  -- Cerrar ciclo actual
  UPDATE strategic_cycles
  SET
    closed_at        = NOW(),
    close_reason     = p_close_reason,
    cycle_evaluation = v_evaluation
  WHERE id = v_cycle_id;

  -- Crear ciclo siguiente con engine_snapshot = estado actual (apertura del nuevo ciclo)
  -- start_date = próximo lunes (date_trunc sobre CURRENT_DATE + 7 siempre devuelve siguiente lunes)
  v_next_start_date := date_trunc('week', CURRENT_DATE + 7)::date;

  INSERT INTO strategic_cycles (
    project_id, cycle_index, start_date, end_date, engine_snapshot
  ) VALUES (
    p_project_id,
    v_cycle_index + 1,
    v_next_start_date,
    v_next_start_date + 27,
    jsonb_build_object(
      'phase_score',       v_phase_score_now,
      'probability_score', COALESCE((v_context_now->>'probability_score')::NUMERIC, 0),
      'probability_trend', v_prob_trend_now,
      'viability_status',  v_viability_now,
      'risk_level',        COALESCE(v_context_now->>'risk_level', 'insufficient_data')
    )
  ) ON CONFLICT (project_id, cycle_index) DO NOTHING;

  RETURN v_evaluation;
END;
$$;

COMMENT ON FUNCTION close_strategic_cycle(UUID, TEXT) IS
  'R10.3 + R10.4. Cierra el ciclo estratégico activo de un proyecto. '
  'Calcula cycle_evaluation comparando engine_snapshot de apertura vs get_optimus_context() actual. '
  'Crea el ciclo N+1 con engine_snapshot = estado del engine en el momento del cierre. '
  'Idempotente: devuelve NULL sin error si no hay ciclo activo. '
  'close_reason: manual (ritual) | scheduled (cron R10.5). '
  'SECURITY DEFINER para bypass RLS en strategic_cycles (service_role write). '
  'Ver STRATEGIC_RESET_RITUAL.md y SYSTEM_OVERVIEW.md.';


-- ── 4. submit_strategic_reset() ──────────────────────────────────────────────
--
-- Registra las respuestas del Strategic Reset Ritual y cierra el ciclo.
-- Llamada desde UI cuando el founder completa las 5 preguntas del ritual.
--
-- Guard anti-doble-disparo: falla si ritual_responses ya tiene datos o ciclo cerrado.
-- Valida los 7 campos del schema de STRATEGIC_RESET_RITUAL.md.
-- Requiere que auth.uid() sea miembro del proyecto.
--
-- Devuelve: cycle_evaluation ('progress'|'stagnation'|'regression')

CREATE OR REPLACE FUNCTION submit_strategic_reset(
  p_project_id       UUID,
  p_ritual_responses JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_id UUID;
  v_result   TEXT;
BEGIN
  -- Verificar pertenencia al proyecto (auth.uid() funciona en SECURITY DEFINER)
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE  project_id = p_project_id
      AND  user_id    = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of project %', p_project_id;
  END IF;

  -- Guard anti-doble-disparo: ciclo activo sin ritual previo
  SELECT id INTO v_cycle_id
  FROM   strategic_cycles
  WHERE  project_id       = p_project_id
    AND  closed_at        IS NULL
    AND  ritual_responses IS NULL
  ORDER BY cycle_index DESC
  LIMIT 1;

  IF v_cycle_id IS NULL THEN
    RAISE EXCEPTION
      'No cycle available for reset on project %. '
      'Possible causes: cycle already closed, ritual already submitted, or no active cycle.',
      p_project_id;
  END IF;

  -- Validar los 7 campos del schema de STRATEGIC_RESET_RITUAL.md
  IF NOT (
    p_ritual_responses ? 'evidence_progress'    AND
    p_ritual_responses ? 'broken_hypothesis'    AND
    p_ritual_responses ? 'main_bottleneck'       AND
    p_ritual_responses ? 'stop_doing'            AND
    p_ritual_responses ? 'next_bet'              AND
    p_ritual_responses ? 'success_signal'        AND
    p_ritual_responses ? 'invalidation_condition'
  ) THEN
    RAISE EXCEPTION
      'ritual_responses is missing required fields. '
      'Required: evidence_progress, broken_hypothesis, main_bottleneck, '
      'stop_doing, next_bet, success_signal, invalidation_condition. '
      'See STRATEGIC_RESET_RITUAL.md for schema.';
  END IF;

  -- Registrar respuestas del ritual en el ciclo activo
  UPDATE strategic_cycles
  SET    ritual_responses = p_ritual_responses
  WHERE  id = v_cycle_id;

  -- Cerrar ciclo y obtener evaluación
  v_result := close_strategic_cycle(p_project_id, 'manual');

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION submit_strategic_reset(UUID, JSONB) IS
  'R10.4. Registra las respuestas del Strategic Reset Ritual y cierra el ciclo estratégico. '
  'Guard anti-doble-disparo: falla si ritual_responses ya existe o ciclo cerrado. '
  'Valida los 7 campos del schema de STRATEGIC_RESET_RITUAL.md §Output Schema. '
  'Requiere auth.uid() como miembro del proyecto. '
  'Llama close_strategic_cycle(manual) internamente. '
  'Devuelve cycle_evaluation: progress | stagnation | regression.';


-- ── Notas de implementación ───────────────────────────────────────────────────
--
-- R10.1 (trigger cada 4 semanas) + R10.5 (cron semanal) → pendiente migración 00051.
-- El cron llamará close_strategic_cycle(project_id, 'scheduled') para proyectos
-- donde end_date < NOW() AND closed_at IS NULL AND ritual_responses IS NOT NULL.
-- (Proyectos donde el ritual se completó pero el ciclo no se cerró por cron.)
-- O directamente sin ritual si el proyecto está en modo automático.
--
-- R10.2 (integración Optimus con el ritual) → pendiente migración 00052.
-- El template de Optimus para el ciclo recibe: ritual_responses + engine_snapshot
-- de apertura + get_optimus_context() al cierre.
--
-- R10.3 lógica de evaluación 'progress':
-- Requiere AMBAS condiciones: phase_score subió Y probability_trend='growing'.
-- Si solo una mejora → stagnation. Considerar relajar a OR en v1.1 si hay
-- demasiados ciclos marcados como stagnation con una sola mejora.
--
-- Proyectos con engine_snapshot='{}' (creados antes de esta migración):
-- close_strategic_cycle() trata phase_score_start=0 vía COALESCE.
-- El primer ciclo cerrado mostrará el estado desde cero — correcto para cycle 1.
