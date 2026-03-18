-- MIGRACIÓN 00055 — EC13.4 PIVOT CLOSE
--
-- Añade close_reason='pivot' al CHECK constraint de strategic_cycles.
-- Crea close_cycle_for_pivot() para cerrar un ciclo sin ritual cuando el
-- founder hace un pivot total (los tres pilares del modelo cambian a la vez).
--
-- Contexto: FASE 13 edge case EC13.4 — "Cambio radical de modelo de negocio".
-- El ciclo se archiva sin ritual_responses. El siguiente ciclo empieza con el
-- engine_snapshot actual (post-pivot) como estado de apertura.

-- =============================================================================
-- 1. Ampliar CHECK constraint close_reason
-- =============================================================================
-- El constraint es anónimo (creado inline en migration 00002).
-- Usamos DO block dinámico para encontrar y eliminar el constraint por contenido,
-- sin depender del nombre auto-generado por PostgreSQL.
-- =============================================================================

DO $$
DECLARE v_cname TEXT;
BEGIN
  SELECT conname INTO v_cname
  FROM pg_constraint
  WHERE conrelid = 'public.strategic_cycles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%close_reason%';
  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE strategic_cycles DROP CONSTRAINT %I', v_cname);
  END IF;
END $$;

ALTER TABLE strategic_cycles
  ADD CONSTRAINT strategic_cycles_close_reason_check
    CHECK (close_reason IN ('manual', 'scheduled', 'pivot'));

-- =============================================================================
-- 2. close_cycle_for_pivot(p_project_id UUID) → TEXT
--
-- Wrapper con auth check para close_strategic_cycle() con close_reason='pivot'.
-- Llamado desde UI cuando el founder confirma un pivot total en StrategyEditor.
--
-- Devuelve: cycle_evaluation ('progress'|'stagnation'|'regression') o NULL si
--           no hay ciclo activo (idempotente vía close_strategic_cycle).
-- =============================================================================

CREATE OR REPLACE FUNCTION close_cycle_for_pivot(p_project_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar pertenencia al proyecto
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE  project_id = p_project_id
      AND  user_id    = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of project %', p_project_id;
  END IF;

  RETURN close_strategic_cycle(p_project_id, 'pivot');
END;
$$;

COMMENT ON FUNCTION close_cycle_for_pivot(UUID) IS
  'EC13.4: Cierra el ciclo estratégico activo sin ritual cuando el founder hace un pivot total '
  '(los tres pilares del modelo de negocio cambian en una sola edición). '
  'close_reason=pivot distingue de cierre manual (ritual) y programado (cron). '
  'Delega en close_strategic_cycle() — captura engine_snapshot actual y crea ciclo N+1. '
  'Idempotente: devuelve NULL sin error si no hay ciclo activo. '
  'Requiere que auth.uid() sea miembro del proyecto (SECURITY DEFINER).';
