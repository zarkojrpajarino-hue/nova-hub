-- =====================================================================
-- Enhanced Audit Logging
-- =====================================================================
-- Implements comprehensive audit trail for critical operations
-- Tracks all changes to sensitive tables for security and compliance
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Generic Audit Function
-- =====================================================================
-- Creates a reusable trigger function that logs all changes to activity_log

CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the change to activity_log
  INSERT INTO activity_log (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    auth.uid(),
    TG_OP, -- INSERT, UPDATE, DELETE
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'old_values', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      'new_values', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
      'changed_at', NOW()
    )
  );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION audit_table_changes IS 'Generic audit trigger function that logs all changes to activity_log. Used by audit triggers on critical tables.';


-- =====================================================================
-- PART 2: Audit Triggers for Critical Tables
-- =====================================================================
-- Apply audit logging to sensitive tables

-- Audit project_members changes (role assignments, membership changes)
DROP TRIGGER IF EXISTS audit_project_members_changes ON project_members;
CREATE TRIGGER audit_project_members_changes
  AFTER INSERT OR UPDATE OR DELETE ON project_members
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

COMMENT ON TRIGGER audit_project_members_changes ON project_members IS 'Logs all changes to project membership and roles';


-- Audit obvs changes (financial data: facturacion, margen)
DROP TRIGGER IF EXISTS audit_obv_changes ON obvs;
CREATE TRIGGER audit_obv_changes
  AFTER INSERT OR UPDATE OR DELETE ON obvs
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

COMMENT ON TRIGGER audit_obv_changes ON obvs IS 'Logs all changes to OBVs, especially financial data (facturacion, margen)';


-- Audit leads changes (customer contact information)
DROP TRIGGER IF EXISTS audit_leads_changes ON leads;
CREATE TRIGGER audit_leads_changes
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

COMMENT ON TRIGGER audit_leads_changes ON leads IS 'Logs all changes to customer leads and contact information';


-- Audit objectives changes (system configuration)
DROP TRIGGER IF EXISTS audit_objectives_changes ON objectives;
CREATE TRIGGER audit_objectives_changes
  AFTER INSERT OR UPDATE OR DELETE ON objectives
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

COMMENT ON TRIGGER audit_objectives_changes ON objectives IS 'Logs changes to system objectives configuration';


-- Audit user_roles changes (admin role assignments)
DROP TRIGGER IF EXISTS audit_user_roles_changes ON user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

COMMENT ON TRIGGER audit_user_roles_changes ON user_roles IS 'Logs changes to user role assignments (admin, tlt, member)';


-- Audit kpi_validaciones changes (validation approvals/rejections)
DROP TRIGGER IF EXISTS audit_kpi_validaciones_changes ON kpi_validaciones;
CREATE TRIGGER audit_kpi_validaciones_changes
  AFTER INSERT OR UPDATE OR DELETE ON kpi_validaciones
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

COMMENT ON TRIGGER audit_kpi_validaciones_changes ON kpi_validaciones IS 'Logs all KPI validation decisions';


-- Audit obv_validaciones changes (OBV validation approvals/rejections)
DROP TRIGGER IF EXISTS audit_obv_validaciones_changes ON obv_validaciones;
CREATE TRIGGER audit_obv_validaciones_changes
  AFTER INSERT OR UPDATE OR DELETE ON obv_validaciones
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

COMMENT ON TRIGGER audit_obv_validaciones_changes ON obv_validaciones IS 'Logs all OBV validation decisions';


-- =====================================================================
-- PART 3: Audit Log Query Helpers
-- =====================================================================
-- Convenience functions to query audit logs

-- Function to get audit history for a specific entity
CREATE OR REPLACE FUNCTION get_audit_history(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE (
  logged_at TIMESTAMPTZ,
  user_id UUID,
  user_email TEXT,
  action TEXT,
  old_values JSONB,
  new_values JSONB
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    a.created_at as logged_at,
    a.user_id,
    p.email as user_email,
    a.action,
    a.metadata->'old_values' as old_values,
    a.metadata->'new_values' as new_values
  FROM activity_log a
  LEFT JOIN profiles p ON p.auth_id = a.user_id
  WHERE a.entity_type = p_entity_type
    AND a.entity_id = p_entity_id
  ORDER BY a.created_at DESC;
$$;

COMMENT ON FUNCTION get_audit_history IS 'Returns audit history for a specific entity with user details';


-- Function to get recent audit log for a user
CREATE OR REPLACE FUNCTION get_user_audit_log(
  p_user_id UUID,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  logged_at TIMESTAMPTZ,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    created_at as logged_at,
    action,
    entity_type,
    entity_id,
    metadata as changes
  FROM activity_log
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_user_audit_log IS 'Returns recent audit log entries for a specific user';


-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
  p_window_minutes INT DEFAULT 5,
  p_threshold INT DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  action_count BIGINT,
  first_action TIMESTAMPTZ,
  last_action TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    a.user_id,
    p.email as user_email,
    COUNT(*) as action_count,
    MIN(a.created_at) as first_action,
    MAX(a.created_at) as last_action
  FROM activity_log a
  LEFT JOIN profiles p ON p.auth_id = a.user_id
  WHERE a.created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL
  GROUP BY a.user_id, p.email
  HAVING COUNT(*) > p_threshold
  ORDER BY action_count DESC;
$$;

COMMENT ON FUNCTION detect_suspicious_activity IS 'Detects users with unusually high activity (potential attack or automation)';


-- =====================================================================
-- PART 4: Create Indexes for Performance
-- =====================================================================
-- Indexes on activity_log for efficient audit queries

CREATE INDEX IF NOT EXISTS idx_activity_log_entity_lookup
  ON activity_log (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_lookup
  ON activity_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_action_type
  ON activity_log (action, created_at DESC);

COMMENT ON INDEX idx_activity_log_entity_lookup IS 'Optimizes queries for entity audit history';
COMMENT ON INDEX idx_activity_log_user_lookup IS 'Optimizes queries for user audit logs';
COMMENT ON INDEX idx_activity_log_action_type IS 'Optimizes queries for specific action types';


-- =====================================================================
-- Verification Queries
-- =====================================================================
-- Run these in Supabase SQL Editor to verify audit logging works:

-- 1. Test audit triggers (should create entry in activity_log)
-- UPDATE obvs SET facturacion = 1000 WHERE id = 'some-uuid';
-- SELECT * FROM activity_log WHERE entity_type = 'obvs' ORDER BY created_at DESC LIMIT 5;

-- 2. Get audit history for a specific OBV
-- SELECT * FROM get_audit_history('obvs', 'some-uuid');

-- 3. Get recent activity for current user
-- SELECT * FROM get_user_audit_log(auth.uid(), 50);

-- 4. Detect suspicious activity
-- SELECT * FROM detect_suspicious_activity(5, 20);

COMMIT;
