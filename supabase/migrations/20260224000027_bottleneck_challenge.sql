-- =============================================================================
-- MIGRACIÓN 00027 — E4.22: Bottleneck Challenge Suggestion
--
-- Nueva tabla: project_challenges
-- Función: suggest_bottleneck_challenge(p_project_id UUID) → JSONB
-- Función: activate_challenge(p_challenge_id UUID, p_activated_by UUID) → VOID
-- Trigger: project_org_state → auto-suggest cuando aparece o cambia bottleneck_function
--
-- Flujo:
--   Org Engine detecta bottleneck → trigger → suggest_bottleneck_challenge()
--   → INSERT status='suggested' → Optimus propone al founder
--   → Founder acepta → activate_challenge() → status='active', ventana 14 días
--   → Cierre (éxito/parcial/fallo) → app layer UPDATE con completed_by + outcome
--
-- Idempotencia de suggest_bottleneck_challenge:
--   Si ya existe suggested/active para la misma source_function → devuelve existente
--   Si source_role_candidates cambió y status=suggested → actualiza candidates (contexto evolucionó)
--   Si source_function es nueva → INSERT nuevo challenge
--
-- No auto-dismiss (decisión B):
--   Cuando bottleneck cambia de función, el challenge anterior queda como está.
--   Preserva trazabilidad; el founder debe cerrar manualmente lo que ya no aplica.
--
-- Actores por transición:
--   activated_by  → activate_challenge() (recibe p_activated_by)
--   dismissed_by  → app layer UPDATE (con dismissed_at)
--   completed_by  → app layer UPDATE (con completed_at + outcome)
--
-- No en scope (futuro):
--   linked_task_ids — cuando el modelo de tasks esté consolidado
--   outcome → execution_rate — E4.24
--
-- Fuentes verificadas:
--   project_org_state    — migración 00026 (bottleneck_function, bottleneck_role_candidates)
--   project_members      — migración 00001 (member_id)
--   auth.users           — FK para actores
-- =============================================================================

-- =============================================================================
-- 1. Nueva tabla: project_challenges
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_challenges (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Tipo de challenge — 'bottleneck_relief' es el único tipo v1
  challenge_type         TEXT          NOT NULL
                           CHECK (challenge_type IN ('bottleneck_relief')),

  -- Qué engine originó la sugerencia
  source_engine          TEXT          NOT NULL
                           CHECK (source_engine IN ('org_capacity', 'manual')),

  -- Función con bottleneck que originó el challenge
  source_function        TEXT
                           CHECK (source_function IN ('demand', 'delivery', 'cash')),

  -- Todos los roles válidos para cubrir la función
  -- Viene de project_org_state.bottleneck_role_candidates
  -- E.g.: ["sales","marketing"] para demand, ["ai_tech","operations"] para delivery
  source_role_candidates JSONB,

  title                  TEXT          NOT NULL,
  description            TEXT,

  -- Ciclo de vida: suggested → active → completed | dismissed
  status                 TEXT          NOT NULL DEFAULT 'suggested'
                           CHECK (status IN ('suggested', 'active', 'completed', 'dismissed')),

  -- Ventana temporal: NULL mientras suggested; se fija al activar
  starts_at              TIMESTAMPTZ,
  ends_at                TIMESTAMPTZ,   -- starts_at + 14 días

  -- Cierre evaluable
  outcome                TEXT
                           CHECK (outcome IN ('success', 'partial', 'failed')),
  outcome_notes          TEXT,

  -- Timestamps por transición de estado
  suggested_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  activated_at           TIMESTAMPTZ,
  completed_at           TIMESTAMPTZ,
  dismissed_at           TIMESTAMPTZ,

  -- Actores por transición (trazabilidad de decisión)
  activated_by           UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  dismissed_by           UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by           UUID          REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE project_challenges IS
  'Challenges propuestos por engines o manualmente. '
  'challenge_type=bottleneck_relief: respuesta a función con coverage_level=none (E4.22). '
  'Ciclo: suggested (engine auto) → active (founder acepta) → completed|dismissed. '
  'source_role_candidates: roles válidos para cubrir la función — usar en lógica de Optimus, '
  'no solo bottleneck_role. '
  'No auto-dismiss al cambiar bottleneck: el anterior queda para trazabilidad.';

-- RLS: miembros del proyecto pueden leer y operar sus challenges
ALTER TABLE project_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_challenges_member_all" ON project_challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE  project_members.project_id = project_challenges.project_id
        AND  project_members.member_id  = auth.uid()
    )
  );

-- =============================================================================
-- 2. suggest_bottleneck_challenge
-- =============================================================================

CREATE OR REPLACE FUNCTION suggest_bottleneck_challenge(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bottleneck_fn         TEXT;
  v_bottleneck_candidates JSONB;
  v_existing_id           UUID;
  v_new_id                UUID;
  v_title                 TEXT;
  v_description           TEXT;
BEGIN

  -- Leer estado de bottleneck actual
  SELECT bottleneck_function, bottleneck_role_candidates
  INTO   v_bottleneck_fn, v_bottleneck_candidates
  FROM   project_org_state
  WHERE  project_id = p_project_id;

  -- Sin bottleneck → NULL (estado normal, sin error)
  IF v_bottleneck_fn IS NULL THEN
    RETURN NULL;
  END IF;

  -- -------------------------------------------------------------------------
  -- Idempotencia: comprobar si ya existe suggested/active para la misma función
  -- -------------------------------------------------------------------------
  SELECT id INTO v_existing_id
  FROM   project_challenges
  WHERE  project_id      = p_project_id
    AND  source_function = v_bottleneck_fn
    AND  status IN ('suggested', 'active')
  LIMIT 1;

  IF FOUND THEN
    -- Si los candidates cambiaron y el challenge sigue en 'suggested' → actualizar
    -- (contexto del bottleneck evolucionó, pero no justifica crear challenge nuevo)
    UPDATE project_challenges
    SET    source_role_candidates = v_bottleneck_candidates
    WHERE  id     = v_existing_id
      AND  status = 'suggested'
      AND  source_role_candidates IS DISTINCT FROM v_bottleneck_candidates;

    RETURN (
      SELECT jsonb_build_object(
        'challenge_id',            id,
        'challenge_type',          challenge_type,
        'title',                   title,
        'description',             description,
        'source_function',         source_function,
        'source_role_candidates',  source_role_candidates,
        'status',                  status,
        'suggested_at',            suggested_at,
        'is_new',                  FALSE
      )
      FROM project_challenges
      WHERE id = v_existing_id
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- Generar título y descripción según función con bottleneck
  -- demand  → challenge comercial / adquisición
  -- delivery → challenge de ejecución / capacidad operativa
  -- cash    → challenge financiero
  -- -------------------------------------------------------------------------
  CASE v_bottleneck_fn

    WHEN 'demand' THEN
      v_title       := 'Activar cobertura de demanda — 14 días';
      v_description :=
        'La función comercial no tiene owner activo ni ejecución registrada. '
        'Objetivo: validar si el proyecto puede generar tracción con recursos '
        'existentes o identificar la necesidad real de incorporar un perfil '
        'de sales o marketing. '
        'Criterio de cierre: ≥2 leads en pipeline late-stage '
        'o ≥1 conversación con cliente potencial calificada documentada.';

    WHEN 'delivery' THEN
      v_title       := 'Cubrir capacidad de entrega — 14 días';
      v_description :=
        'La función de entrega no tiene owner activo ni ejecución registrada. '
        'Objetivo: mapear la capacidad real del equipo para ejecutar '
        'y cubrir las tareas críticas de delivery. '
        'Criterio de cierre: owner asignado a la función delivery '
        '+ ≥1 tarea de entrega completada en la ventana de 14 días.';

    WHEN 'cash' THEN
      v_title       := 'Establecer control financiero básico — 14 días';
      v_description :=
        'La función financiera no tiene owner activo. '
        'Objetivo: implementar seguimiento básico de flujo de caja y margen. '
        'Criterio de cierre: proyección financiera actualizada '
        '+ responsable de cash flow identificado en el equipo.';

    ELSE
      -- source_function pasó validaciones de project_org_state CHECK constraint,
      -- pero si llegara un valor inesperado, falla explícitamente (no silenciosamente)
      RAISE EXCEPTION
        'suggest_bottleneck_challenge: source_function inesperada: %', v_bottleneck_fn;

  END CASE;

  -- -------------------------------------------------------------------------
  -- INSERT nueva sugerencia
  -- -------------------------------------------------------------------------
  INSERT INTO project_challenges (
    project_id,
    challenge_type,
    source_engine,
    source_function,
    source_role_candidates,
    title,
    description,
    status,
    suggested_at
  ) VALUES (
    p_project_id,
    'bottleneck_relief',
    'org_capacity',
    v_bottleneck_fn,
    v_bottleneck_candidates,
    v_title,
    v_description,
    'suggested',
    NOW()
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'challenge_id',            v_new_id,
    'challenge_type',          'bottleneck_relief',
    'title',                   v_title,
    'description',             v_description,
    'source_function',         v_bottleneck_fn,
    'source_role_candidates',  v_bottleneck_candidates,
    'status',                  'suggested',
    'suggested_at',            NOW(),
    'is_new',                  TRUE
  );

END;
$$;

COMMENT ON FUNCTION suggest_bottleneck_challenge(UUID) IS
  'E4.22. Lee project_org_state.bottleneck_function + bottleneck_role_candidates. '
  'Sin bottleneck → devuelve NULL. '
  'Idempotente: si ya existe suggested/active para la misma source_function → devuelve existente '
  '(actualiza source_role_candidates si cambió y status=suggested). '
  'Si no existe → INSERT challenge bottleneck_relief con contenido según función '
  '(demand=comercial/adquisición, delivery=ejecución/ops, cash=financiero). '
  'Devuelve JSONB con challenge_id, title, description, source_role_candidates, is_new. '
  'No auto-dismiss challenges de otras funciones (decisión B — trazabilidad).';

-- =============================================================================
-- 3. activate_challenge
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
  v_status TEXT;
BEGIN

  SELECT status INTO v_status
  FROM   project_challenges
  WHERE  id = p_challenge_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'activate_challenge: challenge % no encontrado', p_challenge_id;
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
  'Establece starts_at=NOW(), ends_at=NOW()+14d, activated_by. '
  'Valida: challenge existe + status=suggested (excepción si no). '
  'Para completar: UPDATE project_challenges SET status=completed, outcome=..., completed_by=..., completed_at=NOW(). '
  'Para descartar: UPDATE project_challenges SET status=dismissed, dismissed_by=..., dismissed_at=NOW().';

-- =============================================================================
-- 4. Trigger: project_org_state → auto-suggest cuando aparece o cambia bottleneck
--
--    INSERT: primer cálculo del engine (bottleneck_function puede ser no-NULL)
--    UPDATE: bottleneck_function cambió a un valor distinto (nueva función o desapareció y volvió)
--    No actúa si NEW.bottleneck_function IS NULL (sin bottleneck = sin sugerencia)
--    No auto-dismiss challenges de función anterior (decisión B)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_org_suggest_challenge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo actuar cuando hay un bottleneck activo
  IF NEW.bottleneck_function IS NOT NULL THEN
    -- INSERT: primer estado del proyecto en org engine
    -- UPDATE: la función con bottleneck cambió (nueva detección)
    IF TG_OP = 'INSERT'
       OR (TG_OP = 'UPDATE' AND OLD.bottleneck_function IS DISTINCT FROM NEW.bottleneck_function)
    THEN
      PERFORM suggest_bottleneck_challenge(NEW.project_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_org_suggest_challenge
  AFTER INSERT OR UPDATE OF bottleneck_function
  ON project_org_state
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_org_suggest_challenge();
