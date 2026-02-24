-- =============================================
-- CREAR FUNCIONES SQL FALTANTES
-- =============================================

CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION get_validators_for_user(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  nombre TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT
    m.id,
    m.nombre,
    m.email
  FROM members m
  WHERE m.id != p_user_id
  LIMIT 0;
END;
$$;

CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE user_id = p_user_id AND read = FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION snooze_notification(
  p_notification_id UUID,
  p_snooze_until TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET snoozed_until = p_snooze_until
  WHERE id = p_notification_id;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
END;
$$;

CREATE OR REPLACE FUNCTION archive_notification(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET archived = TRUE
  WHERE id = p_notification_id;
EXCEPTION
  WHEN undefined_column THEN
    UPDATE notifications SET read = TRUE WHERE id = p_notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_financial_metrics_secure()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'total_revenue', 0,
    'pending_revenue', 0,
    'collected_revenue', 0,
    'total_obvs', 0
  );
END;
$$;

CREATE OR REPLACE FUNCTION check_master_eligibility(
  p_member_id UUID,
  p_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'eligible', false,
    'reason', 'Sistema en configuracion'
  );
END;
$$;

CREATE OR REPLACE FUNCTION soft_delete_project(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET deleted_at = NOW()
  WHERE id = p_project_id;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
END;
$$;

CREATE OR REPLACE FUNCTION restore_project(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET deleted_at = NULL
  WHERE id = p_project_id;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
END;
$$;
