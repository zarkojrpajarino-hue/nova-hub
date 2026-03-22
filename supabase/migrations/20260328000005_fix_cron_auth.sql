-- Fix: use service_role key for auto-sync cron (anon key fails validateAuth)
CREATE OR REPLACE FUNCTION trigger_auto_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
  v_conn RECORD;
  v_fn_name TEXT;
  v_base_url TEXT := 'https://zzxngvqwmnouchbulvlo.supabase.co/functions/v1/';
  v_service_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eG5ndnF3bW5vdWNoYnVsdmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkwOTI0MSwiZXhwIjoyMDg3NDg1MjQxfQ.WWVGMBPSiaXNwciYsgiretHYxpfzPZTsoiVAhoWnxwg';
BEGIN
  FOR v_conn IN
    SELECT ic.id AS connection_id, ic.project_id, ic.provider
    FROM integration_connections ic
    WHERE ic.status = 'active'
      AND (ic.last_sync_at IS NULL OR ic.last_sync_at < NOW() - INTERVAL '11 hours')
  LOOP
    CASE v_conn.provider
      WHEN 'stripe' THEN v_fn_name := 'sync-stripe';
      WHEN 'hubspot' THEN v_fn_name := 'sync-hubspot';
      WHEN 'asana' THEN v_fn_name := 'sync-asana';
      WHEN 'google_calendar' THEN v_fn_name := 'sync-google-calendar';
      ELSE CONTINUE;
    END CASE;

    PERFORM net.http_post(
      url := v_base_url || v_fn_name,
      body := json_build_object(
        'project_id', v_conn.project_id,
        'connection_id', v_conn.connection_id
      )::jsonb,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      )::jsonb,
      timeout_milliseconds := 30000
    );
  END LOOP;
END;
$$;
