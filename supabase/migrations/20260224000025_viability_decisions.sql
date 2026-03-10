-- =============================================================================
-- MIGRACIÓN 00025 — E4.12/E4.13: Viability Decisions
--
-- E4.11 (evaluate-viability) ya implementado en migration 00009.
--
-- E4.12 — Cooldown de 30 días post-decisión estratégica
-- E4.13 — Registro de las 3 Paths (pivot_segment, pivot_value, pause)
--
-- Implementación: función apply_viability_decision sobre decision_events existente.
-- No se crea tabla nueva — decision_events (migración 00002) ya es la tabla correcta.
--
-- Decisiones y cooldowns:
--   pivot_segment → 30 días  (decisión estratégica — cambio de ICP/segmento)
--   pivot_value   → 30 días  (decisión estratégica — cambio de propuesta de valor)
--   pause         → 30 días  (decisión estratégica — pausar experimento)
--   postpone      → 14 días  (gestión del aviso — aplazar revisión)
--   ignore        →  7 días  (gestión del aviso — descartar temporalmente)
--
-- Validaciones de seguridad:
--   1. trigger_type debe ser uno de los 4 valores válidos
--   2. decision_type debe ser uno de los 5 valores válidos
--   3. El trigger debe existir para el proyecto
--   4. El trigger no debe estar ya resuelto (resolved_at IS NULL)
--   5. El trigger no debe tener ya una decisión aplicada (decision_event_id IS NULL)
--      → evita doble decisión accidental sobre el mismo evento
--
-- metadata capturada (aprendizaje de producto):
--   viability_decision_type  → tipo canónico de la decisión
--   trigger_type             → qué trigger originó la decisión
--   cooldown_days            → duración explícita del cooldown aplicado
--   previous_state           → viability_status antes de la decisión
--   applied_from             → 'viability_engine' (trazabilidad)
--   trigger_snapshot         → contexto específico del trigger al momento de decidir:
--     consecutive_count      → semanas activo
--     confidence_level       → confianza del engine
--     previous_hidden_until  → cooldown previo si existía
--     T1 stagnation:   phase_score
--     T2 margin_risk:  avg_net_profit_2m (promedio 2 meses financieros)
--     T3 overload:     capacity_health
--     T4 weak_valid.:  validation_strength
--   notes (opcional)         → texto libre del founder
--
-- Arquitectura de linking:
--   decision_events.related_entity_type = 'viability_trigger'
--   decision_events.related_entity_id   = NULL (viability_events no tiene UUID PK)
--   viability_events.decision_event_id  ← se actualiza con el nuevo decision_event.id
--   viability_events.hidden_until       ← se actualiza con el cooldown calculado
--
-- Fuentes verificadas:
--   decision_events          — migración 00002 (D2.9)
--   viability_events         — migración 00002 (D2.25), PK: (project_id, trigger_type)
--   project_viability_state  — migración 00002
--   project_probability      — migración 00007 (.validation_strength_input, .capacity_health_input)
--   project_phase_state      — migración 00002 (.phase_score)
--   financial_projections    — migración 00001 (.net_profit, .year, .month)
-- =============================================================================

CREATE OR REPLACE FUNCTION apply_viability_decision(
  p_project_id    UUID,
  p_trigger_type  TEXT,
  p_decision_type TEXT,
  p_decided_by    UUID,
  p_notes         TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event             viability_events%ROWTYPE;
  v_viab_status       TEXT;
  v_cooldown_days     INT;
  v_hidden_until      TIMESTAMPTZ;
  v_decision_id       UUID;
  v_title             TEXT;
  v_trigger_snapshot  JSONB;
  v_metadata          JSONB;

  -- Trigger-specific metrics
  v_phase_score       NUMERIC;
  v_val_strength      NUMERIC;
  v_cap_health        NUMERIC;
  v_avg_net_profit    NUMERIC;
BEGIN

  -- -------------------------------------------------------------------------
  -- Validar decision_type
  -- -------------------------------------------------------------------------
  IF p_decision_type NOT IN ('pivot_segment', 'pivot_value', 'pause', 'postpone', 'ignore') THEN
    RAISE EXCEPTION
      'apply_viability_decision: decision_type inválido: %. Valores permitidos: pivot_segment, pivot_value, pause, postpone, ignore',
      p_decision_type;
  END IF;

  -- -------------------------------------------------------------------------
  -- Validar trigger_type
  -- -------------------------------------------------------------------------
  IF p_trigger_type NOT IN ('stagnation', 'margin_risk', 'overload', 'weak_validation') THEN
    RAISE EXCEPTION
      'apply_viability_decision: trigger_type inválido: %. Valores permitidos: stagnation, margin_risk, overload, weak_validation',
      p_trigger_type;
  END IF;

  -- -------------------------------------------------------------------------
  -- Leer estado actual del trigger
  -- -------------------------------------------------------------------------
  SELECT * INTO v_event
  FROM   viability_events
  WHERE  project_id   = p_project_id
    AND  trigger_type = p_trigger_type;

  -- Validación 1: el trigger debe existir
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'apply_viability_decision: trigger % no encontrado para proyecto %',
      p_trigger_type, p_project_id;
  END IF;

  -- Validación 2: el trigger no debe estar ya resuelto
  IF v_event.resolved_at IS NOT NULL THEN
    RAISE EXCEPTION
      'apply_viability_decision: trigger % ya está resuelto para proyecto %. resolved_at = %',
      p_trigger_type, p_project_id, v_event.resolved_at;
  END IF;

  -- Validación 3: no aplicar segunda decisión sobre el mismo evento activo
  -- Si ya tiene decision_event_id → decisión ya aplicada → error
  IF v_event.decision_event_id IS NOT NULL THEN
    RAISE EXCEPTION
      'apply_viability_decision: trigger % ya tiene una decisión aplicada (decision_event_id = %). '
      'Si quieres reemplazarla, primero limpia decision_event_id manualmente.',
      p_trigger_type, v_event.decision_event_id;
  END IF;

  -- -------------------------------------------------------------------------
  -- Estado previo del proyecto (para metadata)
  -- -------------------------------------------------------------------------
  SELECT viability_status INTO v_viab_status
  FROM   project_viability_state
  WHERE  project_id = p_project_id;
  v_viab_status := COALESCE(v_viab_status, 'unknown');

  -- -------------------------------------------------------------------------
  -- Cooldown según tipo de decisión
  -- Estratégica (30d) vs gestión de aviso (14d / 7d)
  -- -------------------------------------------------------------------------
  v_cooldown_days := CASE p_decision_type
    WHEN 'pivot_segment' THEN 30
    WHEN 'pivot_value'   THEN 30
    WHEN 'pause'         THEN 30
    WHEN 'postpone'      THEN 14
    WHEN 'ignore'        THEN  7
  END;

  v_hidden_until := NOW() + (v_cooldown_days || ' days')::INTERVAL;

  -- -------------------------------------------------------------------------
  -- Trigger snapshot — métricas específicas por tipo de trigger
  -- Base común para todos: consecutive_count, confidence_level, previous_hidden_until
  -- -------------------------------------------------------------------------
  v_trigger_snapshot := jsonb_build_object(
    'consecutive_count',     v_event.consecutive_count,
    'confidence_level',      v_event.confidence_level,
    'previous_hidden_until', v_event.hidden_until  -- NULL si no había cooldown activo
  );

  -- T1 — stagnation: captura phase_score en el momento de la decisión
  IF p_trigger_type = 'stagnation' THEN
    SELECT phase_score INTO v_phase_score
    FROM   project_phase_state
    WHERE  project_id = p_project_id;

    v_trigger_snapshot := v_trigger_snapshot
      || jsonb_build_object('phase_score', v_phase_score);
  END IF;

  -- T2 — margin_risk: captura promedio de net_profit de últimos 2 meses registrados
  IF p_trigger_type = 'margin_risk' THEN
    SELECT AVG(net_profit) INTO v_avg_net_profit
    FROM (
      SELECT net_profit
      FROM   financial_projections
      WHERE  project_id = p_project_id
      ORDER  BY year DESC, month DESC
      LIMIT  2
    ) sub;

    v_trigger_snapshot := v_trigger_snapshot
      || jsonb_build_object('avg_net_profit_2m', v_avg_net_profit);
  END IF;

  -- T3 — overload: captura capacity_health del engine de probabilidad
  IF p_trigger_type = 'overload' THEN
    SELECT capacity_health_input INTO v_cap_health
    FROM   project_probability
    WHERE  project_id = p_project_id;

    v_trigger_snapshot := v_trigger_snapshot
      || jsonb_build_object('capacity_health', v_cap_health);
  END IF;

  -- T4 — weak_validation: captura validation_strength del engine de probabilidad
  IF p_trigger_type = 'weak_validation' THEN
    SELECT validation_strength_input INTO v_val_strength
    FROM   project_probability
    WHERE  project_id = p_project_id;

    v_trigger_snapshot := v_trigger_snapshot
      || jsonb_build_object('validation_strength', v_val_strength);
  END IF;

  -- -------------------------------------------------------------------------
  -- Título auto-generado (requerido por decision_events.title NOT NULL)
  -- -------------------------------------------------------------------------
  v_title := CASE p_decision_type
    WHEN 'pivot_segment' THEN 'Pivot de segmento — ' || p_trigger_type
    WHEN 'pivot_value'   THEN 'Pivot de propuesta de valor — ' || p_trigger_type
    WHEN 'pause'         THEN 'Pausa del experimento — ' || p_trigger_type
    WHEN 'postpone'      THEN 'Posponer revisión — ' || p_trigger_type
    WHEN 'ignore'        THEN 'Ignorar señal — ' || p_trigger_type
  END;

  -- -------------------------------------------------------------------------
  -- Metadata completa
  -- -------------------------------------------------------------------------
  v_metadata := jsonb_build_object(
    'viability_decision_type', p_decision_type,
    'trigger_type',            p_trigger_type,
    'cooldown_days',           v_cooldown_days,
    'previous_state',          v_viab_status,
    'applied_from',            'viability_engine',
    'trigger_snapshot',        v_trigger_snapshot
  );

  -- Añadir notes solo si se proporcionan (no contaminan el JSONB con nulls)
  IF p_notes IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('notes', p_notes);
  END IF;

  -- -------------------------------------------------------------------------
  -- INSERT en decision_events
  -- -------------------------------------------------------------------------
  INSERT INTO decision_events (
    project_id,
    decision_category,
    origin,
    title,
    related_entity_type,
    related_entity_id,
    metadata,
    decided_at,
    decided_by
  ) VALUES (
    p_project_id,
    'system_recommendation',
    'system',
    v_title,
    'viability_trigger',
    NULL,               -- viability_events no tiene UUID PK — contexto en metadata
    v_metadata,
    NOW(),
    p_decided_by
  )
  RETURNING id INTO v_decision_id;

  -- -------------------------------------------------------------------------
  -- UPDATE viability_events — aplicar cooldown y linkar decisión
  -- -------------------------------------------------------------------------
  UPDATE viability_events
  SET
    hidden_until      = v_hidden_until,
    decision_event_id = v_decision_id
  WHERE project_id   = p_project_id
    AND trigger_type = p_trigger_type;

  RETURN v_decision_id;

END;
$$;

COMMENT ON FUNCTION apply_viability_decision(UUID, TEXT, TEXT, UUID, TEXT) IS
  'Registra la decisión del founder ante un viability trigger activo. '
  'Crea decision_event con metadata de aprendizaje (decision_type, trigger_snapshot, previous_state). '
  'Aplica cooldown en viability_events.hidden_until: pivot/pause=30d, postpone=14d, ignore=7d. '
  'Valida: trigger existe, no resuelto, sin decisión previa (evita doble aplicación). '
  'Retorna decision_event.id. Paths E4.13: pivot_segment, pivot_value, pause.';
