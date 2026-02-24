-- ============================================================================
-- STARTUP OS - Database Schema
-- Operating System completo para founders
-- ============================================================================

-- ============================================================================
-- STRATEGY LAYER
-- ============================================================================

-- OKRs (Objectives & Key Results)
CREATE TABLE IF NOT EXISTS okrs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),

  objective TEXT NOT NULL,
  key_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  quarter TEXT NOT NULL, -- Q1 2026, Q2 2026, etc.
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'off_track')),
  owner TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitor Snapshots (for automated tracking)
CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL, -- Reference to competitor from onboarding
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pricing JSONB,
  features JSONB DEFAULT '[]'::jsonb,
  screenshot_url TEXT,
  raw_html TEXT,

  -- Change detection
  changes_detected JSONB DEFAULT '[]'::jsonb,
  alert_sent BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Market Intelligence (updated periodically)
CREATE TABLE IF NOT EXISTS market_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  trends_data JSONB, -- Google Trends analysis
  social_mentions JSONB, -- Reddit/Twitter
  market_size JSONB, -- TAM/SAM

  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EXECUTION LAYER
-- ============================================================================

-- Content Calendar
CREATE TABLE IF NOT EXISTS content_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  ideas JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual Content Pieces (for easier querying)
CREATE TABLE IF NOT EXISTS content_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  calendar_id UUID REFERENCES content_calendars(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('blog_post', 'twitter_thread', 'linkedin_post', 'video_script')),
  keywords JSONB DEFAULT '[]'::jsonb,

  search_volume INTEGER DEFAULT 0,
  seo_difficulty TEXT CHECK (seo_difficulty IN ('easy', 'medium', 'hard')),
  relevance_score INTEGER DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),

  outline JSONB,
  ai_draft TEXT,
  final_content TEXT,

  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'published')),
  scheduled_date DATE,
  published_date DATE,
  published_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Launch Checklist
CREATE TABLE IF NOT EXISTS launch_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_launch_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Beta Testers & Testimonials
CREATE TABLE IF NOT EXISTS beta_testers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,

  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  feedback_submitted_at TIMESTAMPTZ,

  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  testimonial_draft TEXT,
  testimonial_approved BOOLEAN DEFAULT FALSE,
  testimonial_approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- METRICS LAYER
-- ============================================================================

-- Financial Projections
CREATE TABLE IF NOT EXISTS financial_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),

  -- Revenue
  revenue DECIMAL(12, 2) DEFAULT 0,
  mrr DECIMAL(12, 2) DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,

  -- Costs
  cogs DECIMAL(12, 2) DEFAULT 0, -- Cost of Goods Sold
  payroll DECIMAL(12, 2) DEFAULT 0,
  marketing_spend DECIMAL(12, 2) DEFAULT 0,
  infrastructure DECIMAL(12, 2) DEFAULT 0,
  other_costs DECIMAL(12, 2) DEFAULT 0,

  -- Calculated metrics
  gross_profit DECIMAL(12, 2) DEFAULT 0,
  gross_margin DECIMAL(5, 2) DEFAULT 0, -- percentage
  net_profit DECIMAL(12, 2) DEFAULT 0,
  cash_balance DECIMAL(12, 2) DEFAULT 0,
  burn_rate DECIMAL(12, 2) DEFAULT 0,
  runway_months INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, year, month)
);

-- Key Metrics (actual data)
CREATE TABLE IF NOT EXISTS key_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Growth
  mrr DECIMAL(12, 2) DEFAULT 0,
  arr DECIMAL(12, 2) DEFAULT 0,
  mrr_growth_rate DECIMAL(5, 2) DEFAULT 0, -- percentage

  -- Customers
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  churn_rate DECIMAL(5, 2) DEFAULT 0, -- percentage

  -- Economics
  cac DECIMAL(10, 2) DEFAULT 0, -- Customer Acquisition Cost
  ltv DECIMAL(10, 2) DEFAULT 0, -- Lifetime Value
  ltv_cac_ratio DECIMAL(5, 2) DEFAULT 0,

  -- Engagement
  dau INTEGER DEFAULT 0, -- Daily Active Users
  mau INTEGER DEFAULT 0, -- Monthly Active Users

  -- Financial
  cash_balance DECIMAL(12, 2) DEFAULT 0,
  burn_rate DECIMAL(12, 2) DEFAULT 0,
  runway_months INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, date)
);

-- Metric Alerts
CREATE TABLE IF NOT EXISTS metric_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  metric TEXT NOT NULL,
  threshold DECIMAL(12, 2) NOT NULL,
  operator TEXT NOT NULL CHECK (operator IN ('above', 'below')),
  current_value DECIMAL(12, 2) NOT NULL,

  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  message TEXT NOT NULL,

  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INTELLIGENCE LAYER
-- ============================================================================

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  category TEXT NOT NULL CHECK (category IN ('pricing', 'marketing', 'product', 'hiring', 'fundraising')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL,

  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  data_sources JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,

  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,

  implemented BOOLEAN DEFAULT FALSE,
  implemented_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly Insights
CREATE TABLE IF NOT EXISTS weekly_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  summary TEXT NOT NULL,
  highlights JSONB DEFAULT '[]'::jsonb,
  concerns JSONB DEFAULT '[]'::jsonb,

  competitor_changes JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,

  next_week_priorities JSONB DEFAULT '[]'::jsonb,

  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, week_start)
);

-- AI Advisor Chat
CREATE TABLE IF NOT EXISTS advisor_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  messages JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_okrs_project ON okrs(project_id);
CREATE INDEX IF NOT EXISTS idx_okrs_quarter ON okrs(quarter);

CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_project ON competitor_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_competitor ON competitor_snapshots(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_date ON competitor_snapshots(captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_pieces_project ON content_pieces(project_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_status ON content_pieces(status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_scheduled ON content_pieces(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_beta_testers_project ON beta_testers(project_id);
CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON beta_testers(email);

CREATE INDEX IF NOT EXISTS idx_financial_projections_project ON financial_projections(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_projections_date ON financial_projections(year, month);

CREATE INDEX IF NOT EXISTS idx_key_metrics_project ON key_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_key_metrics_date ON key_metrics(date DESC);

CREATE INDEX IF NOT EXISTS idx_metric_alerts_project ON metric_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_metric_alerts_severity ON metric_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_metric_alerts_acknowledged ON metric_alerts(acknowledged);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_project ON ai_recommendations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_dismissed ON ai_recommendations(dismissed);

CREATE INDEX IF NOT EXISTS idx_weekly_insights_project ON weekly_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_weekly_insights_date ON weekly_insights(week_start DESC);

CREATE INDEX IF NOT EXISTS idx_advisor_chats_project ON advisor_chats(project_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- OKRs
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their project OKRs" ON okrs
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their project OKRs" ON okrs
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Competitor Snapshots
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their competitor snapshots" ON competitor_snapshots
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can manage snapshots" ON competitor_snapshots
  FOR ALL USING (true);

-- Market Intelligence
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their market intelligence" ON market_intelligence
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can manage market intelligence" ON market_intelligence
  FOR ALL USING (true);

-- Content Calendar
ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their content calendar" ON content_calendars
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their content pieces" ON content_pieces
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Launch Checklist
ALTER TABLE launch_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their launch checklist" ON launch_checklists
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Beta Testers
ALTER TABLE beta_testers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their beta testers" ON beta_testers
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Financial Projections
ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their financial projections" ON financial_projections
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Key Metrics
ALTER TABLE key_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their key metrics" ON key_metrics
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Metric Alerts
ALTER TABLE metric_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their metric alerts" ON metric_alerts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can create alerts" ON metric_alerts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can acknowledge alerts" ON metric_alerts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- AI Recommendations
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their recommendations" ON ai_recommendations
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can create recommendations" ON ai_recommendations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can dismiss/implement recommendations" ON ai_recommendations
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Weekly Insights
ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their weekly insights" ON weekly_insights
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can create insights" ON weekly_insights
  FOR INSERT WITH CHECK (true);

-- Advisor Chats
ALTER TABLE advisor_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their advisor chats" ON advisor_chats
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON okrs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_calendars_updated_at BEFORE UPDATE ON content_calendars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pieces_updated_at BEFORE UPDATE ON content_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_launch_checklists_updated_at BEFORE UPDATE ON launch_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_projections_updated_at BEFORE UPDATE ON financial_projections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advisor_chats_updated_at BEFORE UPDATE ON advisor_chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE okrs IS 'Objectives and Key Results tracking for projects';
COMMENT ON TABLE competitor_snapshots IS 'Automated snapshots of competitor websites for change detection';
COMMENT ON TABLE market_intelligence IS 'Periodic market research data (trends, social, market size)';
COMMENT ON TABLE content_calendars IS 'Content marketing calendar with AI-generated ideas';
COMMENT ON TABLE content_pieces IS 'Individual content pieces with AI drafts';
COMMENT ON TABLE launch_checklists IS 'Pre-launch checklist with progress tracking';
COMMENT ON TABLE beta_testers IS 'Beta testers database with testimonial generation';
COMMENT ON TABLE financial_projections IS 'Forward-looking financial projections (3 years)';
COMMENT ON TABLE key_metrics IS 'Actual business metrics tracked over time';
COMMENT ON TABLE metric_alerts IS 'Automated alerts when metrics hit thresholds';
COMMENT ON TABLE ai_recommendations IS 'AI-generated strategic recommendations';
COMMENT ON TABLE weekly_insights IS 'Weekly summary emails with insights and recommendations';
COMMENT ON TABLE advisor_chats IS 'Chat conversations with AI business advisor';
