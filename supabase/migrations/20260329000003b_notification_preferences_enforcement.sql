-- Enforce notification preferences from user_settings
-- Critical priority always bypasses preferences
-- Maps notification types to preference keys

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id      UUID,
  p_type         TEXT,
  p_priority     TEXT,
  p_title        TEXT,
  p_message      TEXT,
  p_action_url   TEXT    DEFAULT NULL,
  p_action_label TEXT    DEFAULT NULL,
  p_metadata     JSONB   DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_id UUID;
  v_settings JSONB;
  v_pref_key TEXT;
BEGIN
  -- Critical priority always sends
  IF p_priority != 'critical' THEN
    -- Check user notification preferences
    SELECT us.notifications::jsonb
    INTO v_settings
    FROM user_settings us
    WHERE us.user_id = p_user_id;

    IF v_settings IS NOT NULL THEN
      -- Map notification type to preference key
      v_pref_key := CASE
        WHEN p_type IN ('nuevas_obvs', 'obv_validated', 'validation_expiring') THEN 'nuevas_obvs'
        WHEN p_type IN ('validaciones') THEN 'validaciones'
        WHEN p_type IN ('tareas', 'task_overdue', 'overdue_tasks_warning') THEN 'tareas'
        WHEN p_type IN ('phase_advanced', 'phase_regressed', 'phase_critical', 'phase_stagnant',
                        'hard_signal_reached', 'probability_drop', 'probability_critical', 'probability_recovered',
                        'viability_critical', 'viability_monitoring', 'viability_resolved', 'cash_flow_alert',
                        'risk_critical', 'risk_elevated', 'bottleneck_detected', 'proactive_moment',
                        'focus_block_suggestion', 'expansion_readiness') THEN 'alertas_motor'
        WHEN p_type IN ('meeting_action_due') THEN 'reuniones'
        WHEN p_type IN ('cycle_started', 'cycle_ending') THEN 'ciclos'
        WHEN p_type IN ('team_invite_accepted', 'role_accepted') THEN 'equipo'
        ELSE NULL -- Types not in preferences are always allowed
      END;

      -- If preference exists and is disabled, skip
      IF v_pref_key IS NOT NULL AND (v_settings->>v_pref_key)::boolean = false THEN
        RETURN NULL;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.notifications (
    user_id, type, priority, title, message,
    action_url, action_label, metadata
  ) VALUES (
    p_user_id, p_type, p_priority, p_title, p_message,
    p_action_url, p_action_label, p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Also add snooze_notification RPC that the hook calls but was missing
CREATE OR REPLACE FUNCTION snooze_notification(
  p_notification_id UUID,
  p_minutes INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.notifications
  SET snoozed_until = NOW() + (p_minutes || ' minutes')::interval
  WHERE id = p_notification_id;
END;
$$;
