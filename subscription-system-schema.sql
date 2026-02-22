-- =====================================================
-- NOVA HUB - SUBSCRIPTION SYSTEM SCHEMA
-- Plan-per-project subscription model with anti-abuse limits
-- =====================================================

-- =====================================================
-- 1. USER ACCOUNT LIMITS (Anti-Abuse)
-- =====================================================

CREATE TABLE user_account_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Verification status
  email_verified BOOLEAN DEFAULT FALSE,
  payment_method_verified BOOLEAN DEFAULT FALSE,

  -- Current limits
  total_projects_created INTEGER DEFAULT 0,
  active_projects_count INTEGER DEFAULT 0,
  trial_projects_count INTEGER DEFAULT 0,

  -- Abuse prevention tracking
  trial_projects_used_total INTEGER DEFAULT 0,
  first_trial_started_at TIMESTAMPTZ,
  last_trial_started_at TIMESTAMPTZ,

  -- Account blocking
  blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,

  -- Stripe customer
  stripe_customer_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_limits_verified ON user_account_limits(payment_method_verified);
CREATE INDEX idx_user_limits_blocked ON user_account_limits(blocked);
CREATE INDEX idx_user_limits_stripe ON user_account_limits(stripe_customer_id);

-- Enable RLS
ALTER TABLE user_account_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own limits
CREATE POLICY "Users can view own limits"
  ON user_account_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own limits (for verification)
CREATE POLICY "Users can update own limits"
  ON user_account_limits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. SUBSCRIPTION PLANS (Catalog)
-- =====================================================

CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly_eur DECIMAL(10,2) NOT NULL,
  price_yearly_eur DECIMAL(10,2),
  trial_days INTEGER DEFAULT 0,

  -- Feature limits per project
  max_members INTEGER, -- NULL = unlimited
  max_tasks INTEGER,
  max_leads INTEGER,
  max_obvs INTEGER,
  max_storage_mb INTEGER,

  -- Feature flags
  ai_role_generation BOOLEAN DEFAULT FALSE,
  ai_task_generation BOOLEAN DEFAULT FALSE,
  ai_logo_generation BOOLEAN DEFAULT FALSE,
  advanced_analytics BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  white_label BOOLEAN DEFAULT FALSE,

  -- UI metadata
  recommended BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active plans
CREATE INDEX idx_plans_active ON subscription_plans(active, display_order);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can see plans
CREATE POLICY "Plans are viewable by authenticated users"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (active = true);

-- Insert initial plans
INSERT INTO subscription_plans (
  id, name, display_name, description,
  price_monthly_eur, price_yearly_eur, trial_days,
  max_members, max_tasks, max_leads, max_obvs, max_storage_mb,
  ai_role_generation, ai_task_generation, ai_logo_generation,
  advanced_analytics, custom_branding, api_access, priority_support, white_label,
  recommended, display_order
) VALUES
-- Free Trial
(
  'free_trial',
  'Free Trial',
  'Prueba Gratis',
  'Prueba completa por 14 días sin compromiso',
  0.00,
  0.00,
  14,
  3, 50, 50, 50, 100,
  TRUE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE, FALSE,
  FALSE, 1
),
-- Starter
(
  'starter',
  'Starter',
  'Starter',
  'Perfecto para proyectos pequeños y equipos emergentes',
  9.00,
  86.40, -- 9*12 - 20% = 86.40
  0,
  10, 200, 200, 200, 500,
  TRUE, TRUE, TRUE,
  FALSE, FALSE, FALSE, FALSE, FALSE,
  FALSE, 2
),
-- Pro (RECOMMENDED)
(
  'pro',
  'Pro',
  'Pro',
  'Para equipos establecidos que necesitan analíticas y más capacidad',
  29.00,
  278.40, -- 29*12 - 20% = 278.40
  0,
  50, 1000, 1000, 1000, 5000,
  TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE, FALSE,
  TRUE, 3
),
-- Enterprise
(
  'enterprise',
  'Enterprise',
  'Enterprise',
  'Sin límites, personalización completa y soporte prioritario',
  99.00,
  950.40, -- 99*12 - 20% = 950.40
  0,
  NULL, NULL, NULL, NULL, NULL,
  TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE, TRUE,
  FALSE, 4
);

-- =====================================================
-- 3. PROJECT SUBSCRIPTIONS (Active subscriptions)
-- =====================================================

CREATE TABLE project_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),

  -- Owner (who pays)
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN (
    'trial',        -- In trial period
    'active',       -- Active and paid
    'past_due',     -- Payment failed, grace period
    'cancelled',    -- Cancelled, expires at period end
    'expired'       -- Expired, no access
  )),

  -- Billing cycle
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- Dates
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Usage tracking (cache for performance)
  current_members_count INTEGER DEFAULT 0,
  current_tasks_count INTEGER DEFAULT 0,
  current_leads_count INTEGER DEFAULT 0,
  current_obvs_count INTEGER DEFAULT 0,
  current_storage_mb INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One active subscription per project
  UNIQUE(project_id)
);

-- Indexes
CREATE INDEX idx_project_subs_project ON project_subscriptions(project_id);
CREATE INDEX idx_project_subs_owner ON project_subscriptions(owner_id);
CREATE INDEX idx_project_subs_status ON project_subscriptions(status);
CREATE INDEX idx_project_subs_trial_ends ON project_subscriptions(trial_ends_at)
  WHERE status = 'trial';
CREATE INDEX idx_project_subs_stripe_sub ON project_subscriptions(stripe_subscription_id);
CREATE INDEX idx_project_subs_plan ON project_subscriptions(plan_id);

-- Enable RLS
ALTER TABLE project_subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners can manage their project subscriptions
CREATE POLICY "Owners can manage project subscription"
  ON project_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id);

-- Project members can view subscription (to see limits)
CREATE POLICY "Project members can view subscription"
  ON project_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_subscriptions.project_id
      AND pm.member_id = auth.uid()
    )
  );

-- =====================================================
-- 4. UPDATE PROJECTS TABLE
-- =====================================================

-- Add new columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_mode TEXT DEFAULT 'team_small' CHECK (
  work_mode IN ('individual', 'team_small', 'team_established', 'no_roles')
);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS business_idea TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_work_mode ON projects(work_mode);

-- =====================================================
-- 5. TRIGGERS FOR AUTOMATIC COUNTERS
-- =====================================================

-- Function to create user limits on signup
CREATE OR REPLACE FUNCTION create_user_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_account_limits (user_id, email_verified)
  VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_limits();

-- Function to increment project count
CREATE OR REPLACE FUNCTION increment_user_project_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_account_limits
  SET
    total_projects_created = total_projects_created + 1,
    active_projects_count = active_projects_count + 1,
    updated_at = NOW()
  WHERE user_id = NEW.owner_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on project insert
CREATE OR REPLACE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_project_count();

-- Function to decrement project count on soft delete
CREATE OR REPLACE FUNCTION decrement_user_project_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE user_account_limits
    SET
      active_projects_count = GREATEST(active_projects_count - 1, 0),
      updated_at = NOW()
    WHERE user_id = NEW.owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on project soft delete
CREATE OR REPLACE TRIGGER on_project_deleted
  AFTER UPDATE ON projects
  FOR EACH ROW
  WHEN (NEW.deleted_at IS DISTINCT FROM OLD.deleted_at)
  EXECUTE FUNCTION decrement_user_project_count();

-- Function to increment trial count when subscription is created
CREATE OR REPLACE FUNCTION increment_trial_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'trial' THEN
    UPDATE user_account_limits
    SET
      trial_projects_count = trial_projects_count + 1,
      trial_projects_used_total = trial_projects_used_total + 1,
      last_trial_started_at = NOW(),
      first_trial_started_at = COALESCE(first_trial_started_at, NOW()),
      updated_at = NOW()
    WHERE user_id = NEW.owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on subscription insert
CREATE OR REPLACE TRIGGER on_subscription_created
  AFTER INSERT ON project_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION increment_trial_count();

-- Function to decrement trial count when subscription changes from trial
CREATE OR REPLACE FUNCTION decrement_trial_count()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed from trial to something else
  IF OLD.status = 'trial' AND NEW.status != 'trial' THEN
    UPDATE user_account_limits
    SET
      trial_projects_count = GREATEST(trial_projects_count - 1, 0),
      updated_at = NOW()
    WHERE user_id = NEW.owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on subscription status change
CREATE OR REPLACE TRIGGER on_subscription_status_changed
  AFTER UPDATE ON project_subscriptions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION decrement_trial_count();

-- =====================================================
-- 6. USAGE TRACKING FUNCTIONS
-- =====================================================

-- Function to update member count in subscription
CREATE OR REPLACE FUNCTION update_subscription_members_count()
RETURNS TRIGGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Count members in the project
  SELECT COUNT(*) INTO new_count
  FROM project_members
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);

  -- Update subscription
  UPDATE project_subscriptions
  SET
    current_members_count = new_count,
    updated_at = NOW()
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on project_members changes
DROP TRIGGER IF EXISTS on_project_member_changed ON project_members;
CREATE TRIGGER on_project_member_changed
  AFTER INSERT OR DELETE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_members_count();

-- Function to update tasks count (if tasks table exists)
-- TODO: Implement when tasks table is created
-- Similar pattern for leads, obvs, etc.

-- =====================================================
-- 7. VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate if user can create a project
CREATE OR REPLACE FUNCTION can_user_create_project(p_user_id UUID)
RETURNS TABLE(
  can_create BOOLEAN,
  reason TEXT,
  requires_payment_method BOOLEAN,
  requires_upgrade BOOLEAN
) AS $$
DECLARE
  v_limits RECORD;
  v_max_active INTEGER;
  v_max_trials INTEGER;
BEGIN
  -- Get user limits
  SELECT * INTO v_limits
  FROM user_account_limits
  WHERE user_id = p_user_id;

  -- If no limits record, something is wrong
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User limits not found', FALSE, FALSE;
    RETURN;
  END IF;

  -- Check if blocked
  IF v_limits.blocked THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_limits.blocked_reason, 'Account blocked'), FALSE, FALSE;
    RETURN;
  END IF;

  -- Determine max limits based on verification
  v_max_active := CASE WHEN v_limits.payment_method_verified THEN 10 ELSE 2 END;
  v_max_trials := CASE WHEN v_limits.payment_method_verified THEN 3 ELSE 1 END;

  -- Check active projects limit
  IF v_limits.active_projects_count >= v_max_active THEN
    RETURN QUERY SELECT
      FALSE,
      format('Has alcanzado el límite de %s proyectos activos', v_max_active),
      NOT v_limits.payment_method_verified,
      FALSE;
    RETURN;
  END IF;

  -- Check trial projects limit
  IF v_limits.trial_projects_count >= v_max_trials THEN
    RETURN QUERY SELECT
      FALSE,
      format('Tienes %s proyectos en período de prueba. Actualiza uno a plan de pago.', v_max_trials),
      FALSE,
      TRUE;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, NULL::TEXT, FALSE, FALSE;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate if a resource can be added to a project
CREATE OR REPLACE FUNCTION can_add_resource_to_project(
  p_project_id UUID,
  p_resource_type TEXT -- 'member', 'task', 'lead', etc.
)
RETURNS TABLE(
  can_add BOOLEAN,
  reason TEXT,
  current_count INTEGER,
  max_count INTEGER
) AS $$
DECLARE
  v_subscription RECORD;
  v_plan RECORD;
  v_current INTEGER;
  v_max INTEGER;
BEGIN
  -- Get subscription and plan
  SELECT ps.*, sp.*
  INTO v_subscription
  FROM project_subscriptions ps
  JOIN subscription_plans sp ON ps.plan_id = sp.id
  WHERE ps.project_id = p_project_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Subscription not found', 0, 0;
    RETURN;
  END IF;

  -- Check if subscription is expired
  IF v_subscription.status = 'expired' THEN
    RETURN QUERY SELECT FALSE, 'Subscription expired. Please upgrade.', 0, 0;
    RETURN;
  END IF;

  -- Get current count and max based on resource type
  CASE p_resource_type
    WHEN 'member' THEN
      v_current := v_subscription.current_members_count;
      v_max := v_subscription.max_members;
    WHEN 'task' THEN
      v_current := v_subscription.current_tasks_count;
      v_max := v_subscription.max_tasks;
    WHEN 'lead' THEN
      v_current := v_subscription.current_leads_count;
      v_max := v_subscription.max_leads;
    ELSE
      RETURN QUERY SELECT FALSE, 'Invalid resource type', 0, 0;
      RETURN;
  END CASE;

  -- NULL means unlimited
  IF v_max IS NULL THEN
    RETURN QUERY SELECT TRUE, NULL::TEXT, v_current, NULL::INTEGER;
    RETURN;
  END IF;

  -- Check if at limit
  IF v_current >= v_max THEN
    RETURN QUERY SELECT
      FALSE,
      format('Límite de %s %ss alcanzado. Actualiza tu plan.', v_max, p_resource_type),
      v_current,
      v_max;
    RETURN;
  END IF;

  -- Can add
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_current, v_max;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. VIEWS FOR CONVENIENCE
-- =====================================================

-- View: Active subscriptions with plan details
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  ps.*,
  sp.name as plan_name,
  sp.display_name as plan_display_name,
  sp.price_monthly_eur,
  sp.price_yearly_eur,
  sp.max_members,
  sp.max_tasks,
  sp.max_leads,
  sp.ai_role_generation,
  sp.ai_task_generation,
  sp.advanced_analytics,
  p.nombre as project_name,
  p.owner_id as project_owner_id,
  CASE
    WHEN ps.status = 'trial' THEN
      EXTRACT(DAY FROM (ps.trial_ends_at - NOW()))::INTEGER
    ELSE NULL
  END as days_left_in_trial
FROM project_subscriptions ps
JOIN subscription_plans sp ON ps.plan_id = sp.id
JOIN projects p ON ps.project_id = p.id
WHERE ps.status IN ('trial', 'active', 'past_due');

-- View: User subscription summary
CREATE OR REPLACE VIEW user_subscription_summary AS
SELECT
  u.id as user_id,
  u.email,
  ul.active_projects_count,
  ul.trial_projects_count,
  ul.payment_method_verified,
  COUNT(DISTINCT ps.id) FILTER (WHERE ps.status = 'active') as paid_subscriptions_count,
  SUM(CASE
    WHEN ps.billing_cycle = 'monthly' THEN sp.price_monthly_eur
    WHEN ps.billing_cycle = 'yearly' THEN sp.price_yearly_eur / 12
    ELSE 0
  END) as monthly_revenue
FROM auth.users u
LEFT JOIN user_account_limits ul ON u.id = ul.user_id
LEFT JOIN project_subscriptions ps ON u.id = ps.owner_id
LEFT JOIN subscription_plans sp ON ps.plan_id = sp.id
GROUP BY u.id, u.email, ul.active_projects_count, ul.trial_projects_count, ul.payment_method_verified;

-- =====================================================
-- 9. REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for subscription tables
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE project_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_account_limits;

-- =====================================================
-- 10. UPDATED_AT TRIGGERS
-- =====================================================

-- Trigger for user_account_limits
DROP TRIGGER IF EXISTS update_user_limits_updated_at ON user_account_limits;
CREATE TRIGGER update_user_limits_updated_at
  BEFORE UPDATE ON user_account_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger for subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger for project_subscriptions
DROP TRIGGER IF EXISTS update_project_subs_updated_at ON project_subscriptions;
CREATE TRIGGER update_project_subs_updated_at
  BEFORE UPDATE ON project_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify all tables were created
DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_account_limits') THEN
    missing_tables := array_append(missing_tables, 'user_account_limits');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    missing_tables := array_append(missing_tables, 'subscription_plans');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_subscriptions') THEN
    missing_tables := array_append(missing_tables, 'project_subscriptions');
  END IF;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ All subscription system tables created successfully!';
  END IF;
END $$;
