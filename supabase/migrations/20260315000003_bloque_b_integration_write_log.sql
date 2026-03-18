-- BLOQUE B: integration_write_log
-- Registro de todas las escrituras a tablas de motor via write_integration_to_engine_table().
-- Proporciona idempotencia estructural (UNIQUE constraint), traceabilidad y auditoría.
--
-- Referencia de diseño: INTEGRATION_WRITE_GUARD.md §8

CREATE TABLE integration_write_log (
  id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sync_run_id      UUID         NOT NULL REFERENCES integration_sync_runs(id),
  insight_id       UUID,                  -- REFERENCES integration_insights(id) — NULL si no hay insight previo
  agent_type       TEXT         NOT NULL, -- 'finance' | 'sales' | 'execution' | 'team' | 'calendar'
  target           TEXT         NOT NULL, -- 'key_metrics' | 'financial_projections' | 'project_economic_profile' | 'tasks' | 'obvs'
  logical_period   TEXT,                  -- NULL para singletons y targets sin identidad temporal
                                          -- key_metrics/financial_projections: 'YYYY-MM-01'
  operation        TEXT         NOT NULL  CHECK (operation IN ('upsert', 'insert')),
  payload_hash     TEXT         NOT NULL, -- MD5(canonical_json(payload)) — canonical_json es recursivo
  entity_ids       UUID[]       NOT NULL DEFAULT '{}',
  confidence       NUMERIC(4,3) NOT NULL  CHECK (confidence >= 0 AND confidence <= 1),
  source_timestamp TIMESTAMPTZ  NOT NULL,
  status           TEXT         NOT NULL  DEFAULT 'pending'
                                          CHECK (status IN ('pending', 'written', 'rejected', 'skipped')),
  reason           TEXT,                  -- WriteRejectionReason si status = 'rejected' | 'skipped'
  created_at       TIMESTAMPTZ  NOT NULL  DEFAULT NOW(),
  wrote_at         TIMESTAMPTZ,

  -- Garantía estructural de idempotencia.
  -- logical_period puede ser NULL → NULLS NOT DISTINCT para que dos NULL sean iguales.
  -- Requiere PostgreSQL 15+ (disponible en Supabase desde 2023).
  CONSTRAINT uq_write_log UNIQUE NULLS NOT DISTINCT
    (project_id, sync_run_id, target, logical_period, payload_hash)
);

-- Índices de acceso frecuente
CREATE INDEX idx_write_log_project   ON integration_write_log (project_id, created_at DESC);
CREATE INDEX idx_write_log_sync_run  ON integration_write_log (sync_run_id);
CREATE INDEX idx_write_log_pending   ON integration_write_log (status)
  WHERE status = 'pending';

-- RLS: solo service_role (llamado vía stored procedure SECURITY DEFINER)
ALTER TABLE integration_write_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_write_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "write_log_service_only" ON integration_write_log
  FOR ALL USING (auth.role() = 'service_role');
