-- =============================================================================
-- MIGRACIÓN 20260326000007 — AUD.C.5 / DEUDA.PE.3: HubSpot sync → engines
--
-- Problema (DEUDA.PE.3): los datos de HubSpot (deals, contactos) entran en
-- integration_entities y luego en integration_insights, pero el Probability
-- Engine y el Risk Engine NO se re-ejecutan automáticamente al terminar el sync.
-- El resultado: scores obsoletos hasta el siguiente cron semanal, aunque el
-- fundador acaba de sincronizar HubSpot con datos frescos.
--
-- Solución: trigger AFTER UPDATE en integration_sync_runs.
--   - Dispara cuando status pasa de cualquier estado a 'completed'.
--   - Solo para provider = 'hubspot' (scoped al caso de uso descrito en AUD.C.5).
--   - Llama a run_probability_engine (trigger_source = 'acceleration' — datos
--     frescos de HubSpot pueden mejorar revenue_momentum y validation_strength).
--   - Llama a run_risk_engine (trigger_source = 'block_event' — único valor
--     permitido por el CHECK constraint de project_risk_score_history).
--
-- Impacto esperado: tras una sincronización HubSpot, el Focus Block muestra
-- probability y risk actualizados sin esperar al cron semanal.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_fn_hubspot_sync_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo cuando el sync pasa a 'completed' (no ya estaba en completed)
  IF OLD.status = 'completed' OR NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Scoped a HubSpot (AUD.C.5)
  IF NEW.provider != 'hubspot' THEN
    RETURN NEW;
  END IF;

  -- Re-ejecutar Probability Engine con datos frescos de HubSpot
  -- 'acceleration': los deals de HubSpot pueden impactar revenue_momentum
  -- y validation_strength positivamente.
  PERFORM run_probability_engine(NEW.project_id, 'acceleration');

  -- Re-ejecutar Risk Engine
  -- 'block_event': único valor no-cron permitido por el CHECK constraint de
  -- project_risk_score_history.trigger_source.
  PERFORM run_risk_engine(NEW.project_id, 'block_event');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_fn_hubspot_sync_completed() IS
  'AUD.C.5 / DEUDA.PE.3: Cuando integration_sync_runs.status → completed y provider=hubspot, '
  'llama a run_probability_engine(acceleration) y run_risk_engine(block_event). '
  'Cierra el loop: HubSpot sync → engines re-calculados sin esperar al cron semanal.';

DROP TRIGGER IF EXISTS trg_hubspot_sync_completed ON integration_sync_runs;

CREATE TRIGGER trg_hubspot_sync_completed
  AFTER UPDATE OF status ON integration_sync_runs
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_hubspot_sync_completed();

COMMENT ON TRIGGER trg_hubspot_sync_completed ON integration_sync_runs IS
  'AUD.C.5: AFTER UPDATE OF status — cuando HubSpot sync pasa a completed → re-ejecuta engines. '
  'Solo provider=hubspot. trigger_source: probability=acceleration, risk=block_event.';
