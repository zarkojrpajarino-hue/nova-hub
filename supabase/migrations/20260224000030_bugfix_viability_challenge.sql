-- =============================================================================
-- MIGRACIÓN 00030 — Bugfixes pre-Fase 5
--
-- Fix 1: _upsert_viability_trigger — decision_event_id no se limpiaba al expirar cooldown
--   Bug: tras apply_viability_decision (cooldown 7/14/30d), cuando el cron corre post-cooldown
--   el UPDATE en el path "trigger ya activo" no tocaba decision_event_id.
--   Resultado: apply_viability_decision lanzaba excepción "ya tiene una decisión aplicada"
--   aunque el cooldown hubiera expirado → founder bloqueado sin intervención manual.
--   Fix: en ese path, limpiar decision_event_id y hidden_until cuando expired.
--
-- Fix 2: activate_challenge — SECURITY DEFINER sin validación de membresía
--   Bug: cualquier usuario autenticado que conociera el UUID podía activar un challenge
--   ajeno. La función no verificaba que el caller fuera miembro del proyecto.
--   Fix: añadir check de auth.uid() + auth_is_project_member antes de activar.
--
-- Fix 3 (minor): índice en project_challenges(project_id, status)
--   La query de idempotencia en suggest_bottleneck_challenge filtra por ambas columnas.
--   Sin índice hace scan completo por project_id. Añadido preventivamente.
-- =============================================================================

-- =============================================================================
-- Fix 1: _upsert_viability_trigger
--
-- Cambio quirúrgico: solo el UPDATE del path "trigger ya activo post-cooldown".
-- El resto de la función es idéntico a migración 00009.
--
-- Lógica del fix:
--   CASE WHEN hidden_until IS NOT NULL AND hidden_until < NOW()
--     THEN NULL   ← cooldown expiró → limpiar para permitir nueva decisión
--     ELSE <valor actual>   ← todavía en cooldown o nunca tuvo cooldown
--   END
--
-- Condición del WHERE ya garantiza hidden_until IS NULL OR hidden_until < NOW(),
-- pero el CASE discrimina el sub-caso "expiró" del "nunca tuvo".
-- =============================================================================

CREATE OR REPLACE FUNCTION _upsert_viability_trigger(
  p_project_id   UUID,
  p_trigger_type TEXT,
  p_active       BOOLEAN,
  p_confidence   TEXT DEFAULT 'low',
  p_engine_ver   TEXT DEFAULT 'viability_v1.0'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_resolved TIMESTAMPTZ;
  v_existing_consec   INTEGER;
BEGIN
  IF p_active THEN
    -- Trigger está activo: INSERT o UPDATE con incremento de consecutive_count

    SELECT resolved_at, consecutive_count
    INTO   v_existing_resolved, v_existing_consec
    FROM   viability_events
    WHERE  project_id   = p_project_id
      AND  trigger_type = p_trigger_type;

    IF NOT FOUND THEN
      -- Primera vez → INSERT
      INSERT INTO viability_events (
        project_id,        trigger_type,
        consecutive_count, confidence_level,
        first_triggered_at, last_evaluated_at,
        resolved_at,       engine_version
      ) VALUES (
        p_project_id,      p_trigger_type,
        1,                 p_confidence,
        NOW(),             NOW(),
        NULL,              p_engine_ver
      );

    ELSIF v_existing_resolved IS NOT NULL THEN
      -- Trigger estaba resuelto, se reactiva → reset completo
      UPDATE viability_events SET
        consecutive_count  = 1,
        confidence_level   = p_confidence,
        first_triggered_at = NOW(),
        last_evaluated_at  = NOW(),
        resolved_at        = NULL,
        decision_event_id  = NULL,
        hidden_until       = NULL,
        engine_version     = p_engine_ver
      WHERE project_id   = p_project_id
        AND trigger_type = p_trigger_type;

    ELSE
      -- Trigger ya activo → incrementar (solo si hidden_until no bloquea)
      -- Fix: cuando el cooldown acaba de expirar (hidden_until IS NOT NULL AND < NOW()),
      --   limpiar decision_event_id y hidden_until para permitir nueva decisión.
      --   Sin este fix, apply_viability_decision lanzaba excepción post-cooldown.
      UPDATE viability_events SET
        consecutive_count = consecutive_count + 1,
        confidence_level  = p_confidence,
        last_evaluated_at = NOW(),
        engine_version    = p_engine_ver,
        decision_event_id = CASE
          WHEN hidden_until IS NOT NULL AND hidden_until < NOW() THEN NULL
          ELSE decision_event_id
        END,
        hidden_until      = CASE
          WHEN hidden_until IS NOT NULL AND hidden_until < NOW() THEN NULL
          ELSE hidden_until
        END
      WHERE project_id   = p_project_id
        AND trigger_type = p_trigger_type
        AND (hidden_until IS NULL OR hidden_until < NOW());
      -- Si en cooldown activo: no incrementa, decision_event_id intacto
    END IF;

  ELSE
    -- Trigger inactivo: resolver si estaba activo
    UPDATE viability_events SET
      resolved_at       = NOW(),
      last_evaluated_at = NOW()
    WHERE project_id   = p_project_id
      AND trigger_type = p_trigger_type
      AND resolved_at  IS NULL;
  END IF;
END;
$$;

COMMENT ON FUNCTION _upsert_viability_trigger(UUID, TEXT, BOOLEAN, TEXT, TEXT) IS
  'Helper interno de run_viability_engine. UPSERT de viability_events: '
  'activo→incrementa/reset, inactivo→resuelve. '
  'Fix mig 00030: limpia decision_event_id y hidden_until cuando cooldown expiró '
  '(hidden_until IS NOT NULL AND hidden_until < NOW()), '
  'permitiendo nueva decisión sin intervención manual. '
  'No llamar directamente desde app.';

-- =============================================================================
-- Fix 2: activate_challenge — validación de membresía
--
-- Añade:
--   1. Leer project_id junto con status (en el mismo SELECT)
--   2. Verificar auth.uid() IS NOT NULL (requiere usuario autenticado)
--   3. Verificar auth_is_project_member(v_project_id) (helper de migración 00002)
-- El resto de la función es idéntico a migración 00027.
-- =============================================================================

CREATE OR REPLACE FUNCTION activate_challenge(
  p_challenge_id UUID,
  p_activated_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status     TEXT;
  v_project_id UUID;
BEGIN

  SELECT status, project_id
  INTO   v_status, v_project_id
  FROM   project_challenges
  WHERE  id = p_challenge_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'activate_challenge: challenge % no encontrado', p_challenge_id;
  END IF;

  -- Autenticación requerida
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'activate_challenge: se requiere usuario autenticado';
  END IF;

  -- Solo miembros del proyecto pueden activar un challenge
  IF NOT auth_is_project_member(v_project_id) THEN
    RAISE EXCEPTION
      'activate_challenge: acceso denegado — el usuario no es miembro del proyecto %',
      v_project_id;
  END IF;

  IF v_status <> 'suggested' THEN
    RAISE EXCEPTION
      'activate_challenge: challenge % está en estado ''%''. '
      'Solo se puede activar desde ''suggested''.',
      p_challenge_id, v_status;
  END IF;

  UPDATE project_challenges
  SET
    status       = 'active',
    starts_at    = NOW(),
    ends_at      = NOW() + INTERVAL '14 days',
    activated_at = NOW(),
    activated_by = p_activated_by
  WHERE id = p_challenge_id;

END;
$$;

COMMENT ON FUNCTION activate_challenge(UUID, UUID) IS
  'Transiciona challenge de suggested → active. '
  'Fix mig 00030: valida auth.uid() IS NOT NULL + auth_is_project_member. '
  'Establece starts_at=NOW(), ends_at=NOW()+14d, activated_by. '
  'Valida: challenge existe + status=suggested + usuario autenticado y miembro. '
  'Para completar: UPDATE directo con completed_by + outcome. '
  'Para descartar: UPDATE directo con dismissed_by + dismissed_at.';

-- =============================================================================
-- Fix 3 (minor): índice en project_challenges(project_id, status)
--
-- suggest_bottleneck_challenge filtra: project_id = X AND status IN ('suggested','active')
-- Sin índice → sequential scan. Con índice → index scan directo.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_project_challenges_project_status
  ON project_challenges (project_id, status);
