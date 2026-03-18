-- =============================================
-- BLOQUE 0 — I15.0.6: Fix slack_webhooks schema
-- Aplicado: 2026-03-17 via Management API
-- Motivo: columnas required por SlackIntegration.tsx y send-slack-notification ausentes
-- =============================================

-- Renombrar is_active → enabled (componente usa 'enabled', no 'is_active')
ALTER TABLE slack_webhooks RENAME COLUMN is_active TO enabled;

-- Añadir columnas faltantes
ALTER TABLE slack_webhooks
  ADD COLUMN IF NOT EXISTS notification_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Resultado final: id, project_id, webhook_url, webhook_type, enabled, created_at,
--                  notification_types, last_used_at, created_by
