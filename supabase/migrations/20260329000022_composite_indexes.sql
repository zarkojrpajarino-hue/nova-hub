-- ============================================================================
-- COMPOSITE INDEXES FOR FREQUENT QUERIES
-- ============================================================================
-- Purpose: Improve performance of the most common queries in the application.
-- These indexes target the hot paths identified by profiling hook usage.
-- ============================================================================

-- Tasks: filtered by project + status in every project view
-- Partial index excludes completed/cancelled tasks (rarely queried)
CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON tasks(project_id, status)
  WHERE status NOT IN ('done', 'cancelled');

-- OBVs: filtered by project + status in dashboard and OBV views
CREATE INDEX IF NOT EXISTS idx_obvs_project_status
  ON obvs(project_id, status);

-- OBVs: sales queries filter by es_venta + cobrado for revenue calculations
CREATE INDEX IF NOT EXISTS idx_obvs_project_venta
  ON obvs(project_id, es_venta, cobrado)
  WHERE es_venta = true;

-- Key metrics: time-series queries always filter by project + order by date DESC
CREATE INDEX IF NOT EXISTS idx_key_metrics_project_date
  ON key_metrics(project_id, date DESC);

-- Notifications: filtered by project_id in metadata JSONB + ordered by created_at
CREATE INDEX IF NOT EXISTS idx_notifications_project
  ON notifications((metadata->>'project_id'), created_at DESC);

-- Integration entities: filtered by project + provider + entity_type in sync views
CREATE INDEX IF NOT EXISTS idx_integration_entities_project_provider
  ON integration_entities(project_id, provider, entity_type);
