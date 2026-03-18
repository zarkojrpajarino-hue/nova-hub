-- ============================================================
-- Migration 00033 — Fix notifications table column names
-- Purpose: rename Spanish column names to English so the V2
--   notification system (useNotificationsV2, NotificationCenterV2)
--   matches the actual DB schema.
--   titulo  → title
--   mensaje → message
--   leida   → read
--   tipo    → type
-- No data loss: no rows exist in production yet.
-- 2026-03-11
-- ============================================================

-- 1. Drop partial indexes that reference 'leida' before rename
--    (Postgres may auto-update these, but being explicit avoids any
--     version-dependent behaviour)
DROP INDEX IF EXISTS idx_notifications_priority;
DROP INDEX IF EXISTS idx_notifications_unread;

-- 2. Rename columns
ALTER TABLE notifications RENAME COLUMN titulo  TO title;
ALTER TABLE notifications RENAME COLUMN mensaje TO message;
ALTER TABLE notifications RENAME COLUMN leida   TO read;
ALTER TABLE notifications RENAME COLUMN tipo    TO type;

-- 3. Recreate indexes with updated column name
CREATE INDEX idx_notifications_priority
  ON notifications(priority)
  WHERE read = FALSE;

CREATE INDEX idx_notifications_unread
  ON notifications(user_id, read)
  WHERE read = FALSE;

-- 4. Replace create_notification — update INSERT column names
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id    UUID,
  p_type       TEXT,
  p_priority   TEXT,
  p_title      TEXT,
  p_message    TEXT,
  p_action_url   TEXT    DEFAULT NULL,
  p_action_label TEXT    DEFAULT NULL,
  p_metadata     JSONB   DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    priority,
    title,
    message,
    action_url,
    action_label,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_priority,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- 5. Add mark_all_notifications_read (direct UPDATE, returns count marked)
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET    read = TRUE
  WHERE  user_id  = p_user_id
    AND  read     = FALSE
    AND  archived = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 6. Add archive_notification (direct UPDATE, also marks as read)
CREATE OR REPLACE FUNCTION archive_notification(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.notifications
  SET    archived = TRUE,
         read     = TRUE
  WHERE  id = p_notification_id;
END;
$$;

-- Note: snooze_notification deferred to v2 (U6.13 spec, 2026-03-11)
