-- =============================================================================
-- MIGRACIÓN B2/M14 — Tablas de monetización
--
-- 1. subscription_plans (planes disponibles)
-- 2. project_subscriptions (suscripción por proyecto)
-- 3. user_account_limits (límites por usuario — 1 trial por email)
-- 4. trial_expiration cron
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. subscription_plans
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscription_plans (
  id              TEXT    PRIMARY KEY,          -- 'free_trial', 'starter', 'pro', 'enterprise'
  name            TEXT    NOT NULL,
  display_name    TEXT    NOT NULL,
  price_monthly   NUMERIC(10,2) DEFAULT 0,
  price_yearly    NUMERIC(10,2) DEFAULT 0,
  trial_days      INTEGER DEFAULT 14,
  max_members     INTEGER DEFAULT 5,
  max_tasks       INTEGER DEFAULT 50,
  max_leads       INTEGER DEFAULT 25,
  max_obvs        INTEGER DEFAULT 10,
  ai_requests_month INTEGER DEFAULT 50,
  -- Feature flags
  ai_task_generation    BOOLEAN DEFAULT FALSE,
  ai_role_generation    BOOLEAN DEFAULT FALSE,
  advanced_analytics    BOOLEAN DEFAULT FALSE,
  api_access            BOOLEAN DEFAULT FALSE,
  priority_support      BOOLEAN DEFAULT FALSE,
  white_label           BOOLEAN DEFAULT FALSE,
  custom_domain         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed plans
INSERT INTO subscription_plans (id, name, display_name, price_monthly, price_yearly, trial_days, max_members, max_tasks, max_leads, max_obvs, ai_requests_month, ai_task_generation, ai_role_generation, advanced_analytics, api_access, priority_support, white_label, custom_domain)
VALUES
  ('free_trial', 'Free Trial', 'Prueba gratuita', 0, 0, 14, 5, 50, 25, 10, 50, false, false, false, false, false, false, false),
  ('starter', 'Starter', 'Starter', 29, 290, 0, 25, 500, 500, 500, 1000, true, true, false, false, false, false, false),
  ('pro', 'Pro', 'Pro', 79, 790, 0, 100, -1, -1, -1, -1, true, true, true, true, true, false, false),
  ('enterprise', 'Enterprise', 'Enterprise', 299, 2990, 0, -1, -1, -1, -1, -1, true, true, true, true, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. project_subscriptions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS project_subscriptions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_id               TEXT        NOT NULL REFERENCES subscription_plans(id),
  status                TEXT        NOT NULL DEFAULT 'trial'
                          CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  billing_cycle         TEXT        DEFAULT 'monthly'
                          CHECK (billing_cycle IN ('monthly', 'yearly')),
  trial_started_at      TIMESTAMPTZ,
  trial_ends_at         TIMESTAMPTZ,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_subs_status
  ON project_subscriptions (project_id, status);

-- RLS
ALTER TABLE project_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_subs: members read"
  ON project_subscriptions FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.member_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "project_subs: system write"
  ON project_subscriptions FOR ALL TO authenticated
  WITH CHECK (true);  -- Webhooks y admin escriben via service role

-- ---------------------------------------------------------------------------
-- 3. user_account_limits
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_account_limits (
  user_id               UUID    PRIMARY KEY,
  has_used_free_trial   BOOLEAN DEFAULT FALSE,
  stripe_customer_id    TEXT,
  payment_method_verified BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_account_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_limits: own read"
  ON user_account_limits FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Trial auto-expiration cron (diario)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION expire_trials()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE project_subscriptions
  SET    status = 'expired',
         updated_at = NOW()
  WHERE  status = 'trial'
    AND  trial_ends_at < NOW();
END;
$$;

SELECT cron.schedule(
  'daily-trial-expiration',
  '0 6 * * *',
  $$SELECT expire_trials()$$
);

-- ---------------------------------------------------------------------------
-- 5. Función para crear trial automáticamente
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_project_trial(p_project_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already used free trial
  IF EXISTS (SELECT 1 FROM user_account_limits WHERE user_id = p_user_id AND has_used_free_trial = TRUE) THEN
    RETURN;
  END IF;

  -- Create trial subscription
  INSERT INTO project_subscriptions (project_id, plan_id, status, trial_started_at, trial_ends_at)
  VALUES (p_project_id, 'free_trial', 'trial', NOW(), NOW() + INTERVAL '14 days')
  ON CONFLICT (project_id) DO NOTHING;

  -- Mark trial as used
  INSERT INTO user_account_limits (user_id, has_used_free_trial)
  VALUES (p_user_id, TRUE)
  ON CONFLICT (user_id) DO UPDATE SET has_used_free_trial = TRUE;
END;
$$;
