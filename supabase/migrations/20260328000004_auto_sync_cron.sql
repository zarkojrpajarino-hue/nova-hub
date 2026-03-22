-- Auto-sync cron: calls sync edge functions for active connections every 12h.
-- Uses pg_net to make HTTP calls to edge functions from pg_cron.

-- Enable pg_net if not already
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Function that triggers syncs via HTTP
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
  v_service_key TEXT;
BEGIN
  -- Get service role key from Supabase vault/secrets
  v_service_key := current_setting('supabase.service_role_key', true);

  -- Fallback: read from supabase_functions_internal if setting not available
  IF v_service_key IS NULL THEN
    -- Use anon key for auth (edge functions validate internally)
    v_service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eG5ndnF3bW5vdWNoYnVsdmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDkyNDEsImV4cCI6MjA4NzQ4NTI0MX0.u0bzjhkbHrijmuvKecdRsdxYN4qn43g1fhayP7SiOvs';
  END IF;

  FOR v_conn IN
    SELECT ic.id AS connection_id,
           ic.project_id,
           ic.provider
    FROM integration_connections ic
    WHERE ic.status = 'active'
      AND (ic.last_sync_at IS NULL OR ic.last_sync_at < NOW() - INTERVAL '11 hours')
  LOOP
    -- Map provider to sync function
    CASE v_conn.provider
      WHEN 'stripe' THEN v_fn_name := 'sync-stripe';
      WHEN 'hubspot' THEN v_fn_name := 'sync-hubspot';
      WHEN 'asana' THEN v_fn_name := 'sync-asana';
      WHEN 'google_calendar' THEN v_fn_name := 'sync-google-calendar';
      ELSE CONTINUE;
    END CASE;

    -- Call edge function via pg_net
    PERFORM net.http_post(
      url := v_base_url || v_fn_name,
      body := json_build_object(
        'project_id', v_conn.project_id,
        'connection_id', v_conn.connection_id
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      )::jsonb
    );

    RAISE NOTICE 'Auto-sync triggered: % for project %', v_fn_name, v_conn.project_id;
  END LOOP;
END;
$$;

-- Schedule: every 12 hours at :15 past (staggered from other crons)
SELECT cron.schedule(
  'auto-sync-integrations',
  '15 */12 * * *',
  $$SELECT trigger_auto_sync()$$
);
