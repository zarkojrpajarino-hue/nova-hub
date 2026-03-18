-- ============================================================
-- 20260312000052_fase10_r10_2_ritual_optimus_context.sql
--
-- R10.2: get_ritual_optimus_context() — ensambla el bundle de entrada
-- para la llamada Optimus de interpretación de ciclo estratégico.
--
-- Qué hace:
--   Lee el ciclo cerrado más reciente con ritual_responses para el proyecto.
--   Carga engine_snapshot de apertura (del propio ciclo cerrado).
--   Carga engine_snapshot de cierre (del ciclo N+1, capturado en
--     close_strategic_cycle(); fallback a get_optimus_context() live si N+1
--     no existe todavía).
--   Acepta next_action como parámetro (computado por el frontend desde
--     getNextAction() — get_optimus_context no lo incluye).
--   Devuelve el bundle completo para enviar al template R10.2 de Optimus.
--
-- Sin efectos de escritura.
-- Storage del output Optimus → Opción A diferida a FASE 11 si hace falta.
--
-- Output schema de la interpretación Optimus (9 campos):
--   cycle_evaluation, summary, main_learning, key_bottleneck,
--   recommended_action, next_bet, success_signal,
--   invalidation_condition, confidence
--
-- Template Optimus: OPTIMUS_PROMPTS.md §8 (añadido en esta migración).
-- Referencias: STRATEGIC_RESET_RITUAL.md, OPTIMUS_PROMPTS.md §8
-- ============================================================


CREATE OR REPLACE FUNCTION get_ritual_optimus_context(
  p_project_id  UUID,
  p_next_action TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle           RECORD;
  v_engine_at_close JSONB;
BEGIN

  -- ── 1. Ciclo cerrado más reciente con ritual completado ─────────────────────
  --
  -- Condiciones:
  --   ritual_responses IS NOT NULL  → el founder completó el ritual
  --   closed_at IS NOT NULL         → el ciclo fue cerrado correctamente
  --
  -- Si no hay ningún ciclo que cumpla ambas condiciones, devolver NULL.
  -- El frontend debe verificar NOT NULL antes de invocar el template Optimus.

  SELECT
    sc.cycle_index,
    sc.cycle_evaluation,
    sc.ritual_responses,
    sc.engine_snapshot   AS engine_at_open   -- estado del engine en apertura del ciclo
  INTO v_cycle
  FROM strategic_cycles sc
  WHERE sc.project_id       = p_project_id
    AND sc.ritual_responses IS NOT NULL
    AND sc.closed_at        IS NOT NULL
  ORDER BY sc.closed_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- ── 2. Estado del engine al cierre ─────────────────────────────────────────
  --
  -- Opción preferida: engine_snapshot del ciclo N+1, que fue capturado en
  -- close_strategic_cycle() en el momento exacto del cierre.
  -- Este snapshot representa el estado del engine AL CERRAR el ciclo N,
  -- independientemente de cuándo se llame a esta función.
  --
  -- Fallback: get_optimus_context() live si el ciclo N+1 no existe todavía
  -- (edge case: último ciclo del proyecto sin rollover creado aún).

  SELECT sc.engine_snapshot
  INTO   v_engine_at_close
  FROM   strategic_cycles sc
  WHERE  sc.project_id  = p_project_id
    AND  sc.cycle_index = v_cycle.cycle_index + 1
  LIMIT  1;

  IF v_engine_at_close IS NULL THEN
    -- Fallback: estado actual del engine
    v_engine_at_close := get_optimus_context(p_project_id);
  END IF;

  -- ── 3. Bundle de salida ─────────────────────────────────────────────────────
  --
  -- Campos:
  --   cycle_index       → qué ciclo fue (ordinal)
  --   cycle_evaluation  → evaluación del engine: progress / stagnation / regression
  --   ritual_responses  → las 7 respuestas del founder (Q1–Q5)
  --   engine_at_open    → estado del engine al iniciar el ciclo
  --   engine_at_close   → estado del engine al cerrar el ciclo
  --   next_action       → acción recomendada por getNextAction() del frontend;
  --                       vacío si no se proveyó (Optimus ignora alineación en ese caso)

  RETURN jsonb_build_object(
    'cycle_index',      v_cycle.cycle_index,
    'cycle_evaluation', v_cycle.cycle_evaluation,
    'ritual_responses', v_cycle.ritual_responses,
    'engine_at_open',   v_cycle.engine_at_open,
    'engine_at_close',  v_engine_at_close,
    'next_action',      COALESCE(p_next_action, '')
  );

END;
$$;

COMMENT ON FUNCTION get_ritual_optimus_context(UUID, TEXT) IS
  'R10.2. Ensambla el input bundle para el template Optimus de interpretación '
  'de ciclo estratégico (OPTIMUS_PROMPTS.md §8). '
  'Lee el ciclo más reciente con ritual completado (ritual_responses NOT NULL, '
  'closed_at NOT NULL). engine_at_open = snapshot de apertura del ciclo cerrado; '
  'engine_at_close = snapshot del ciclo N+1 (estado al momento exacto del cierre) '
  'o fallback a get_optimus_context() live. '
  'p_next_action: output de getNextAction() del frontend — get_optimus_context() '
  'no lo incluye. Se pasa vacío si no está disponible. '
  'Devuelve NULL si no hay ciclo cerrado con ritual para el proyecto. '
  'Sin efectos de escritura. STABLE + SECURITY DEFINER.';
