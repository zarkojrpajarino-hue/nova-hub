-- FASE 21 — Founder Toolkit
-- Tabla de caché para las 6 herramientas generativas del founder.
-- UNIQUE (project_id, tool_type) → upsert seguro por herramienta.
-- TTL variable por tool: buyer_persona/brand_kit/comms_guide=30d · sales_playbook/customer_journey=14d · lead_scoring=7d

CREATE TYPE founder_tool_type AS ENUM (
  'buyer_persona',
  'lead_scoring',
  'sales_playbook',
  'brand_kit',
  'comms_guide',
  'customer_journey'
);

CREATE TABLE founder_tool_cache (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tool_type         founder_tool_type NOT NULL,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  data_sources      JSONB       NOT NULL DEFAULT '[]',
  output            JSONB       NOT NULL,
  tokens_used       INTEGER,
  model             TEXT        NOT NULL DEFAULT 'claude-sonnet-4-6',

  UNIQUE (project_id, tool_type)
);

-- RLS
ALTER TABLE founder_tool_cache ENABLE ROW LEVEL SECURITY;

-- Los miembros del proyecto pueden leer
CREATE POLICY "founder_tool_cache_select"
  ON founder_tool_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = founder_tool_cache.project_id
        AND project_members.member_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = founder_tool_cache.project_id
        AND projects.created_by = auth.uid()
    )
  );

-- Solo el owner o miembros del proyecto pueden insertar/actualizar
CREATE POLICY "founder_tool_cache_upsert"
  ON founder_tool_cache FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = founder_tool_cache.project_id
        AND project_members.member_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = founder_tool_cache.project_id
        AND projects.created_by = auth.uid()
    )
  );

-- Índice para lookups por proyecto
CREATE INDEX idx_founder_tool_cache_project ON founder_tool_cache(project_id);
CREATE INDEX idx_founder_tool_cache_expires  ON founder_tool_cache(project_id, expires_at);
