-- V5.6.9 — Move deprecated tables to 'deprecated' schema
-- Tables: lead_history, objectives, slack_webhooks

CREATE SCHEMA IF NOT EXISTS deprecated;

-- Move lead_history (replaced by obv_pipeline_history)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_history') THEN
    ALTER TABLE public.lead_history SET SCHEMA deprecated;
  END IF;
END $$;

-- Move objectives (replaced by OBVs/KPIs system)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'objectives') THEN
    ALTER TABLE public.objectives SET SCHEMA deprecated;
  END IF;
END $$;

-- Move slack_webhooks (replaced by integration_connections)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'slack_webhooks') THEN
    ALTER TABLE public.slack_webhooks SET SCHEMA deprecated;
  END IF;
END $$;

COMMENT ON SCHEMA deprecated IS 'Tables moved here during V5.6.9 data cleanup. Safe to drop after 90 days if no queries reference them.';
