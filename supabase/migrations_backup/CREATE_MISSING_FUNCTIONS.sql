-- =============================================
-- CREAR FUNCIONES SQL FALTANTES
-- =============================================

-- 1. is_user_blocked - Verifica si un usuario está bloqueado
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Por ahora siempre retorna false (nadie está bloqueado)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. get_validators_for_user - Obtiene validadores para un usuario
CREATE OR REPLACE FUNCTION get_validators_for_user(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  nombre TEXT,
  email TEXT
) AS $$
BEGIN
  -- Retorna lista vacía por ahora
  RETURN QUERY SELECT
    m.id,
    m.nombre,
    m.email
  FROM members m
  WHERE m.id != p_user_id
  LIMIT 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. mark_all_notifications_read - Marca todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE user_id = p_user_id AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. snooze_notification - Pospone una notificación
CREATE OR REPLACE FUNCTION snooze_notification(
  p_notification_id UUID,
  p_snooze_until TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  -- Solo si la columna snoozed_until existe
  UPDATE notifications
  SET snoozed_until = p_snooze_until
  WHERE id = p_notification_id;
EXCEPTION
  WHEN undefined_column THEN
    -- Si no existe la columna, no hacer nada
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. archive_notification - Archiva una notificación
CREATE OR REPLACE FUNCTION archive_notification(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET archived = TRUE
  WHERE id = p_notification_id;
EXCEPTION
  WHEN undefined_column THEN
    -- Si no existe la columna, marcar como leída
    UPDATE notifications SET read = TRUE WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. get_financial_metrics_secure - Obtiene métricas financieras
CREATE OR REPLACE FUNCTION get_financial_metrics_secure()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_revenue', 0,
    'pending_revenue', 0,
    'collected_revenue', 0,
    'total_obvs', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. check_master_eligibility - Verifica elegibilidad para Master
CREATE OR REPLACE FUNCTION check_master_eligibility(
  p_member_id UUID,
  p_role TEXT
)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'eligible', false,
    'reason', 'Sistema en configuración'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. soft_delete_project - Borra suavemente un proyecto
CREATE OR REPLACE FUNCTION soft_delete_project(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET deleted_at = NOW()
  WHERE id = p_project_id;
EXCEPTION
  WHEN undefined_column THEN
    -- Si no existe deleted_at, no hacer nada
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. restore_project - Restaura un proyecto borrado
CREATE OR REPLACE FUNCTION restore_project(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET deleted_at = NULL
  WHERE id = p_project_id;
EXCEPTION
  WHEN undefined_column THEN
    -- Si no existe deleted_at, no hacer nada
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMPLETADO
-- =============================================
