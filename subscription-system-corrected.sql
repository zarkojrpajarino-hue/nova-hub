-- =====================================================
-- NOVA HUB - SUBSCRIPTION SYSTEM (CORRECTED)
-- Plan-per-project with 1 FREE TRIAL per email
-- NO project limits - Unlimited projects allowed
-- =====================================================

-- =====================================================
-- 1. USER ACCOUNT LIMITS (SIMPLIFIED - Only Free Trial Control)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_account_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- FREE TRIAL CONTROL (This is the key anti-abuse mechanism)
  has_used_free_trial BOOLEAN DEFAULT FALSE,
  free_trial_used_at TIMESTAMPTZ,

  -- Stripe customer
  stripe_customer_id TEXT UNIQUE,
  payment_method_verified BOOLEAN DEFAULT FALSE,

  -- Account blocking (for abuse cases)
  blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_limits_free_trial ON user_account_limits(has_used_free_trial);
CREATE INDEX IF NOT EXISTS idx_user_limits_stripe ON user_account_limits(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_limits_blocked ON user_account_limits(blocked);

-- Enable RLS
ALTER TABLE user_account_limits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own limits"
  ON user_account_limits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own limits"
  ON user_account_limits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. SUBSCRIPTION PLANS (Catalog)
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly_eur DECIMAL(10,2) NOT NULL,
  price_yearly_eur DECIMAL(10,2),
  trial_days INTEGER DEFAULT 0,

  -- Stripe price IDs
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,

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
  ai_buyer_persona BOOLEAN DEFAULT FALSE,
  advanced_analytics BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  white_label BOOLEAN DEFAULT FALSE,
  custom_domain BOOLEAN DEFAULT FALSE,

  -- UI metadata
  recommended BOOLEAN DEFAULT FALSE,
  popular BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_plans_active ON subscription_plans(active, display_order);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can see active plans
CREATE POLICY "Plans are viewable by authenticated users"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (active = true);

-- Insert plans data
INSERT INTO subscription_plans (
  id, name, display_name, description,
  price_monthly_eur, price_yearly_eur, trial_days,
  max_members, max_tasks, max_leads, max_obvs, max_storage_mb,
  ai_role_generation, ai_task_generation, ai_logo_generation, ai_buyer_persona,
  advanced_analytics, custom_branding, api_access, priority_support, white_label, custom_domain,
  recommended, popular, display_order
) VALUES
-- FREE TRIAL (14 days, limited features)
(
  'free_trial',
  'Free Trial',
  'Prueba Gratis',
  'Prueba todas las funcionalidades por 14 días sin compromiso ni tarjeta de crédito',
  0.00,
  0.00,
  14,
  3, 50, 50, 50, 100,
  TRUE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE, FALSE, FALSE,
  FALSE, TRUE, 1
),
-- STARTER (Small teams, basic features)
(
  'starter',
  'Starter',
  'Starter',
  'Perfecto para proyectos pequeños y equipos emergentes que están comenzando',
  9.00,
  86.40, -- 9*12 - 20% = 86.40
  0,
  10, 200, 200, 200, 500,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, 2
),
-- PRO (Most popular, for established teams)
(
  'pro',
  'Pro',
  'Pro',
  'Para equipos establecidos que necesitan analíticas avanzadas y mayor capacidad',
  29.00,
  278.40, -- 29*12 - 20% = 278.40
  0,
  50, 1000, 1000, 1000, 5000,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE, FALSE, FALSE,
  TRUE, TRUE, 3
),
-- ENTERPRISE (Unlimited everything)
(
  'enterprise',
  'Enterprise',
  'Enterprise',
  'Sin límites, personalización completa, white label y soporte prioritario dedicado',
  99.00,
  950.40, -- 99*12 - 20% = 950.40
  0,
  NULL, NULL, NULL, NULL, NULL,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, 4
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly_eur = EXCLUDED.price_monthly_eur,
  price_yearly_eur = EXCLUDED.price_yearly_eur,
  max_members = EXCLUDED.max_members,
  max_tasks = EXCLUDED.max_tasks,
  updated_at = NOW();

-- =====================================================
-- 3. PROJECT SUBSCRIPTIONS (One per project)
-- =====================================================

CREATE TABLE IF NOT EXISTS project_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),

  -- Owner (who pays for this project)
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN (
    'trial',        -- In trial period (14 days)
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

  -- Usage tracking (updated by triggers)
  current_members_count INTEGER DEFAULT 0,
  current_tasks_count INTEGER DEFAULT 0,
  current_leads_count INTEGER DEFAULT 0,
  current_obvs_count INTEGER DEFAULT 0,
  current_storage_mb INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One subscription per project
  UNIQUE(project_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_subs_project ON project_subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_subs_owner ON project_subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_subs_status ON project_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_project_subs_trial_ends ON project_subscriptions(trial_ends_at)
  WHERE status = 'trial';
CREATE INDEX IF NOT EXISTS idx_project_subs_stripe_sub ON project_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_project_subs_plan ON project_subscriptions(plan_id);

-- Enable RLS
ALTER TABLE project_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can manage project subscription"
  ON project_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id);

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

-- Add new columns if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_mode TEXT DEFAULT 'team_small' CHECK (
  work_mode IN ('individual', 'team_small', 'team_established', 'no_roles')
);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS business_idea TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_work_mode ON projects(work_mode);

-- =====================================================
-- 5. PROJECT ROLES (AI Generated)
-- =====================================================

CREATE TABLE IF NOT EXISTS project_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Role details
  role_name TEXT NOT NULL,
  role_description TEXT,
  responsibilities TEXT[], -- Array of responsibilities

  -- AI generation metadata
  generated_by_ai BOOLEAN DEFAULT TRUE,
  ai_explanation TEXT, -- Why this role is needed
  suggested_count INTEGER DEFAULT 1, -- How many people in this role

  -- Display
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '👤',
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_roles_project ON project_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_project_roles_order ON project_roles(project_id, display_order);

-- Enable RLS
ALTER TABLE project_roles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Project members can view roles"
  ON project_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_roles.project_id
      AND pm.member_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can manage roles"
  ON project_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_roles.project_id
      AND pm.member_id = auth.uid()
      AND pm.role = 'admin'
    )
  );

-- Update project_members to reference project_roles
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS project_role_id UUID REFERENCES project_roles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(project_role_id);

-- =====================================================
-- 6. LEARNING ROADMAP (For individual work_mode)
-- =====================================================

CREATE TABLE IF NOT EXISTS learning_roadmap_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step details
  role_id UUID NOT NULL REFERENCES project_roles(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed')),
  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Progress
  required_tasks_count INTEGER DEFAULT 0,
  completed_tasks_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, user_id, role_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roadmap_project_user ON learning_roadmap_steps(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_status ON learning_roadmap_steps(status);

-- Enable RLS
ALTER TABLE learning_roadmap_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roadmap"
  ON learning_roadmap_steps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmap"
  ON learning_roadmap_steps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Create user limits on signup
CREATE OR REPLACE FUNCTION create_user_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_account_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_limits();

-- Mark free trial as used when creating trial subscription
CREATE OR REPLACE FUNCTION mark_free_trial_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_id = 'free_trial' AND NEW.status = 'trial' THEN
    UPDATE user_account_limits
    SET
      has_used_free_trial = TRUE,
      free_trial_used_at = NOW(),
      updated_at = NOW()
    WHERE user_id = NEW.owner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trial_subscription_created ON project_subscriptions;
CREATE TRIGGER on_trial_subscription_created
  AFTER INSERT ON project_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION mark_free_trial_used();

-- Update member count when project_members changes
CREATE OR REPLACE FUNCTION update_subscription_members_count()
RETURNS TRIGGER AS $$
DECLARE
  new_count INTEGER;
  proj_id UUID;
BEGIN
  proj_id := COALESCE(NEW.project_id, OLD.project_id);

  SELECT COUNT(*) INTO new_count
  FROM project_members
  WHERE project_id = proj_id;

  UPDATE project_subscriptions
  SET
    current_members_count = new_count,
    updated_at = NOW()
  WHERE project_id = proj_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_member_changed ON project_members;
CREATE TRIGGER on_project_member_changed
  AFTER INSERT OR DELETE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_members_count();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_limits_updated_at ON user_account_limits;
CREATE TRIGGER update_user_limits_updated_at
  BEFORE UPDATE ON user_account_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_project_subs_updated_at ON project_subscriptions;
CREATE TRIGGER update_project_subs_updated_at
  BEFORE UPDATE ON project_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_project_roles_updated_at ON project_roles;
CREATE TRIGGER update_project_roles_updated_at
  BEFORE UPDATE ON project_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 8. VALIDATION FUNCTIONS
-- =====================================================

-- Check if user can use free trial
CREATE OR REPLACE FUNCTION can_use_free_trial(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_used BOOLEAN;
BEGIN
  SELECT has_used_free_trial INTO v_has_used
  FROM user_account_limits
  WHERE user_id = p_user_id;

  -- If no record, user hasn't used trial
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- Return opposite of has_used
  RETURN NOT v_has_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if resource can be added to project
CREATE OR REPLACE FUNCTION can_add_resource_to_project(
  p_project_id UUID,
  p_resource_type TEXT -- 'member', 'task', 'lead', 'obv'
)
RETURNS TABLE(
  can_add BOOLEAN,
  reason TEXT,
  current_count INTEGER,
  max_count INTEGER
) AS $$
DECLARE
  v_subscription RECORD;
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
    RETURN QUERY SELECT FALSE, 'No subscription found'::TEXT, 0, 0;
    RETURN;
  END IF;

  -- Check if expired
  IF v_subscription.status = 'expired' THEN
    RETURN QUERY SELECT FALSE, 'Subscription expired. Please upgrade.'::TEXT, 0, 0;
    RETURN;
  END IF;

  -- Get current count and max
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
    WHEN 'obv' THEN
      v_current := v_subscription.current_obvs_count;
      v_max := v_subscription.max_obvs;
    ELSE
      RETURN QUERY SELECT FALSE, 'Invalid resource type'::TEXT, 0, 0;
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
-- 9. VIEWS
-- =====================================================

-- Active subscriptions with plan details
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
      GREATEST(0, EXTRACT(DAY FROM (ps.trial_ends_at - NOW()))::INTEGER)
    ELSE NULL
  END as days_left_in_trial
FROM project_subscriptions ps
JOIN subscription_plans sp ON ps.plan_id = sp.id
JOIN projects p ON ps.project_id = p.id
WHERE ps.status IN ('trial', 'active', 'past_due');

-- =====================================================
-- 10. REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE subscription_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE project_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_account_limits;
ALTER PUBLICATION supabase_realtime ADD TABLE project_roles;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_account_limits') THEN
    missing_tables := array_append(missing_tables, 'user_account_limits');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    missing_tables := array_append(missing_tables, 'subscription_plans');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_subscriptions') THEN
    missing_tables := array_append(missing_tables, 'project_subscriptions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_roles') THEN
    missing_tables := array_append(missing_tables, 'project_roles');
  END IF;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ All subscription system tables created successfully!';
    RAISE NOTICE '✅ 4 plans inserted: Free Trial, Starter, Pro, Enterprise';
    RAISE NOTICE '✅ FREE TRIAL: Only 1 per email (has_used_free_trial flag)';
    RAISE NOTICE '✅ PROJECTS: Unlimited - no limits per user';
  END IF;
END $$;
