-- BLOQUE B: Infraestructura de integraciones — tablas base
-- Crea las tablas de plomería del sistema de integraciones externas.
-- Prerequisito para integration_write_log y write_integration_to_engine_table().
--
-- Orden de creación (por dependencias FK):
-- 1. integration_connections  (padre: projects, profiles)
-- 2. integration_sync_runs    (padre: integration_connections)
-- 3. integration_entities     (padre: integration_connections, integration_sync_runs)
-- 4. integration_insights     (padre: integration_entities, integration_sync_runs)
-- 5. integration_credentials  (padre: integration_connections)
--
-- Referencia de diseño: INTEGRATION_ARCHITECTURE.md · INTEGRATION_DATA_CONTRACT.md

-- ---------------------------------------------
-- 1. INTEGRATION_CONNECTIONS
-- Una fila por (project_id, provider). Estado de la conexión.
-- ---------------------------------------------

CREATE TABLE integration_connections (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider          TEXT        NOT NULL,   -- 'stripe' | 'holded' | 'hubspot' | 'asana' | 'trello' | 'google_calendar'
  status            TEXT        NOT NULL DEFAULT 'pending',
                                            -- 'pending' | 'active' | 'paused' | 'error' | 'disconnected'
  connected_at      TIMESTAMPTZ,            -- NOW() al conectar — NUNCA retroactivo (ver INTEGRATION_WRITE_GUARD.md §5.4)
  disconnected_at   TIMESTAMPTZ,
  last_sync_at      TIMESTAMPTZ,
  error_message     TEXT,
  metadata          JSONB       NOT NULL DEFAULT '{}'::jsonb,
                                            -- datos del provider no normalizados (account_id, etc.)
  connected_by      UUID        NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_connection UNIQUE (project_id, provider)
);

CREATE INDEX idx_integration_connections_project ON integration_connections (project_id);
CREATE INDEX idx_integration_connections_active  ON integration_connections (project_id, provider)
  WHERE status = 'active';

-- ---------------------------------------------
-- 2. INTEGRATION_SYNC_RUNS
-- Una fila por ejecución de sync. Padre de entities e insights.
-- Incluye pre/post engine snapshot para narrativa causal (INTEGRATION_ARCHITECTURE.md §14).
-- ---------------------------------------------

CREATE TABLE integration_sync_runs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id         UUID        NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider              TEXT        NOT NULL,
  trigger_type          TEXT        NOT NULL DEFAULT 'manual',
                                              -- 'manual' | 'scheduled' | 'webhook'
  status                TEXT        NOT NULL DEFAULT 'running',
                                              -- 'running' | 'completed' | 'failed' | 'partial'
  entities_processed    INTEGER     NOT NULL DEFAULT 0,
  entities_written      INTEGER     NOT NULL DEFAULT 0,
  entities_rejected     INTEGER     NOT NULL DEFAULT 0,
  entities_skipped      INTEGER     NOT NULL DEFAULT 0,
  error_message         TEXT,

  -- Snapshots de estado de motores (INTEGRATION_ARCHITECTURE.md §14)
  -- Capturar ANTES del primer write y DESPUÉS del último write.
  -- Nunca guardar narrativa aquí — generar en lectura con engine-delta.ts.
  -- Campos: { probability: {value, status}, phase: {current_phase, phase_score},
  --           risk: {level, score}, economic_profile: {mrr, runway_months} }
  pre_engine_snapshot   JSONB,
  post_engine_snapshot  JSONB,

  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_runs_connection  ON integration_sync_runs (connection_id, started_at DESC);
CREATE INDEX idx_sync_runs_project     ON integration_sync_runs (project_id, started_at DESC);
CREATE INDEX idx_sync_runs_running     ON integration_sync_runs (status)
  WHERE status = 'running';

-- ---------------------------------------------
-- 3. INTEGRATION_ENTITIES
-- Entidades normalizadas recibidas del provider.
-- Staging antes de que los agentes generen insights.
-- ---------------------------------------------

CREATE TABLE integration_entities (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id    UUID        NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  sync_run_id      UUID        NOT NULL REFERENCES integration_sync_runs(id) ON DELETE CASCADE,
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider         TEXT        NOT NULL,
  entity_type      TEXT        NOT NULL,   -- 'invoice' | 'subscription' | 'deal' | 'task' | 'event' | ...
  external_id      TEXT        NOT NULL,   -- ID de la entidad en el sistema del provider
  occurred_at      TIMESTAMPTZ NOT NULL,   -- cuándo ocurrió en el provider
  source_timestamp TIMESTAMPTZ NOT NULL,   -- cuándo el provider dice que fue creada/actualizada
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence       NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  payload          JSONB       NOT NULL,   -- ContractEntity normalizado (INTEGRATION_DATA_CONTRACT.md §3)
  status           TEXT        NOT NULL DEFAULT 'pending',
                                           -- 'pending' | 'processed' | 'rejected' | 'stale'

  CONSTRAINT uq_entity UNIQUE (connection_id, provider, entity_type, external_id)
);

CREATE INDEX idx_entities_sync_run  ON integration_entities (sync_run_id);
CREATE INDEX idx_entities_project   ON integration_entities (project_id, entity_type, occurred_at DESC);
CREATE INDEX idx_entities_pending   ON integration_entities (sync_run_id)
  WHERE status = 'pending';

-- ---------------------------------------------
-- 4. INTEGRATION_INSIGHTS
-- Insights derivados por agentes desde integration_entities.
-- Intermediarios antes de write_integration_to_engine_table().
-- ---------------------------------------------

CREATE TABLE integration_insights (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id      UUID        NOT NULL REFERENCES integration_sync_runs(id) ON DELETE CASCADE,
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_type       TEXT        NOT NULL,   -- 'finance' | 'sales' | 'execution' | 'team' | 'calendar'
  insight_type     TEXT        NOT NULL,   -- e.g. 'mrr_trend' | 'pipeline_velocity' | 'task_completion_rate'
  entity_ids       UUID[]      NOT NULL DEFAULT '{}',
                                           -- IDs de integration_entities que originaron este insight
  payload          JSONB       NOT NULL,   -- insight content (AGENTS_CONTRACT.md)
  confidence       NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source_timestamp TIMESTAMPTZ NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending',
                                           -- 'pending' | 'written' | 'rejected' | 'skipped'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insights_sync_run  ON integration_insights (sync_run_id);
CREATE INDEX idx_insights_project   ON integration_insights (project_id, agent_type);
CREATE INDEX idx_insights_pending   ON integration_insights (sync_run_id)
  WHERE status = 'pending';

-- ---------------------------------------------
-- 5. INTEGRATION_CREDENTIALS
-- Credenciales cifradas por provider.
-- NUNCA almacenar api_key en TEXT plano.
-- En v1: cifrado via pgp_sym_encrypt (pg_crypto). Si Vault disponible, migrar a Vault en v2.
-- ---------------------------------------------

CREATE TABLE integration_credentials (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id  UUID        NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider       TEXT        NOT NULL,
  credential_key TEXT        NOT NULL,   -- nombre del campo: 'api_key' | 'access_token' | 'refresh_token' | ...
  credential_enc TEXT        NOT NULL,   -- valor cifrado: pgp_sym_encrypt(value, app_secret)
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_credential UNIQUE (connection_id, credential_key)
);

-- Sin índice adicional: acceso siempre por connection_id (FK implica índice en PK)
CREATE INDEX idx_credentials_connection ON integration_credentials (connection_id);

-- ---------------------------------------------
-- RLS — todas las tablas restringidas a miembros del proyecto
-- Patrón: member_id = public.get_profile_id(auth.uid())
-- ---------------------------------------------

ALTER TABLE integration_connections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_entities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_insights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials  ENABLE ROW LEVEL SECURITY;

-- integration_connections
CREATE POLICY "integration_connections_project_member" ON integration_connections
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE member_id = public.get_profile_id(auth.uid())
    )
  );

-- integration_sync_runs
CREATE POLICY "integration_sync_runs_project_member" ON integration_sync_runs
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE member_id = public.get_profile_id(auth.uid())
    )
  );

-- integration_entities
CREATE POLICY "integration_entities_project_member" ON integration_entities
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE member_id = public.get_profile_id(auth.uid())
    )
  );

-- integration_insights
CREATE POLICY "integration_insights_project_member" ON integration_insights
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE member_id = public.get_profile_id(auth.uid())
    )
  );

-- integration_credentials: solo service_role puede leer/escribir
-- Las credenciales nunca se exponen a través del cliente JS
ALTER TABLE integration_credentials FORCE ROW LEVEL SECURITY;
CREATE POLICY "integration_credentials_service_only" ON integration_credentials
  FOR ALL USING (auth.role() = 'service_role');
