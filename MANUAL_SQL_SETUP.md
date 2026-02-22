# 🔧 MANUAL SQL SETUP - COPY & PASTE EN SUPABASE

## INSTRUCCIONES

1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/aguuckggskweobxeosrq
2. Click en **SQL Editor** (icono </> en sidebar izquierdo)
3. Click **New Query**
4. Copia cada bloque de SQL de abajo
5. Pega en el editor
6. Click **Run** (o Ctrl+Enter)

---

## 📋 SCRIPT 1: CREAR TABLAS DEL STARTUP OS

Copia y pega este bloque completo:

```sql
-- ============================================================================
-- STARTUP OS - Database Schema (Adjusted for existing database)
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
  competitor_id UUID NOT NULL,
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

  trends_data JSONB,
  social_mentions JSONB,
  market_size JSONB,

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

-- Individual Content Pieces
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
  cogs DECIMAL(12, 2) DEFAULT 0,
  payroll DECIMAL(12, 2) DEFAULT 0,
  marketing_spend DECIMAL(12, 2) DEFAULT 0,
  infrastructure DECIMAL(12, 2) DEFAULT 0,
  other_costs DECIMAL(12, 2) DEFAULT 0,

  -- Calculated metrics
  gross_profit DECIMAL(12, 2) DEFAULT 0,
  gross_margin DECIMAL(5, 2) DEFAULT 0,
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
  mrr_growth_rate DECIMAL(5, 2) DEFAULT 0,

  -- Customers
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  churn_rate DECIMAL(5, 2) DEFAULT 0,

  -- Economics
  cac DECIMAL(10, 2) DEFAULT 0,
  ltv DECIMAL(10, 2) DEFAULT 0,
  ltv_cac_ratio DECIMAL(5, 2) DEFAULT 0,

  -- Engagement
  dau INTEGER DEFAULT 0,
  mau INTEGER DEFAULT 0,

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

-- Success message
SELECT 'Tables created successfully!' as status;
```

---

## 📋 SCRIPT 2: RLS POLICIES (Row Level Security)

```sql
-- ============================================================================
-- RLS POLICIES FOR STARTUP OS TABLES
-- ============================================================================

-- OKRs
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their project OKRs" ON okrs;
CREATE POLICY "Users can view their project OKRs" ON okrs
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their project OKRs" ON okrs;
CREATE POLICY "Users can manage their project OKRs" ON okrs
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Competitor Snapshots
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their competitor snapshots" ON competitor_snapshots;
CREATE POLICY "Users can view their competitor snapshots" ON competitor_snapshots
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage snapshots" ON competitor_snapshots;
CREATE POLICY "Service role can manage snapshots" ON competitor_snapshots
  FOR ALL USING (true);

-- Market Intelligence
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their market intelligence" ON market_intelligence;
CREATE POLICY "Users can view their market intelligence" ON market_intelligence
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage market intelligence" ON market_intelligence;
CREATE POLICY "Service role can manage market intelligence" ON market_intelligence
  FOR ALL USING (true);

-- Content Calendar
ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their content calendar" ON content_calendars;
CREATE POLICY "Users can manage their content calendar" ON content_calendars
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their content pieces" ON content_pieces;
CREATE POLICY "Users can manage their content pieces" ON content_pieces
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Launch Checklist
ALTER TABLE launch_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their launch checklist" ON launch_checklists;
CREATE POLICY "Users can manage their launch checklist" ON launch_checklists
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Beta Testers
ALTER TABLE beta_testers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their beta testers" ON beta_testers;
CREATE POLICY "Users can manage their beta testers" ON beta_testers
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Financial Projections
ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their financial projections" ON financial_projections;
CREATE POLICY "Users can manage their financial projections" ON financial_projections
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Key Metrics
ALTER TABLE key_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their key metrics" ON key_metrics;
CREATE POLICY "Users can manage their key metrics" ON key_metrics
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Metric Alerts
ALTER TABLE metric_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their metric alerts" ON metric_alerts;
CREATE POLICY "Users can view their metric alerts" ON metric_alerts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "Service role can create alerts" ON metric_alerts;
CREATE POLICY "Service role can create alerts" ON metric_alerts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can acknowledge alerts" ON metric_alerts;
CREATE POLICY "Users can acknowledge alerts" ON metric_alerts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- AI Recommendations
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their recommendations" ON ai_recommendations;
CREATE POLICY "Users can view their recommendations" ON ai_recommendations
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "Service role can create recommendations" ON ai_recommendations;
CREATE POLICY "Service role can create recommendations" ON ai_recommendations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can dismiss/implement recommendations" ON ai_recommendations;
CREATE POLICY "Users can dismiss/implement recommendations" ON ai_recommendations
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Weekly Insights
ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their weekly insights" ON weekly_insights;
CREATE POLICY "Users can view their weekly insights" ON weekly_insights
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

DROP POLICY IF EXISTS "Service role can create insights" ON weekly_insights;
CREATE POLICY "Service role can create insights" ON weekly_insights
  FOR INSERT WITH CHECK (true);

-- Advisor Chats
ALTER TABLE advisor_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their advisor chats" ON advisor_chats;
CREATE POLICY "Users can manage their advisor chats" ON advisor_chats
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- Success message
SELECT 'RLS Policies created successfully!' as status;
```

---

## 📋 SCRIPT 3: TRIGGERS (Auto-update timestamps)

```sql
-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
DROP TRIGGER IF EXISTS update_okrs_updated_at ON okrs;
CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON okrs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_calendars_updated_at ON content_calendars;
CREATE TRIGGER update_content_calendars_updated_at BEFORE UPDATE ON content_calendars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_pieces_updated_at ON content_pieces;
CREATE TRIGGER update_content_pieces_updated_at BEFORE UPDATE ON content_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_launch_checklists_updated_at ON launch_checklists;
CREATE TRIGGER update_launch_checklists_updated_at BEFORE UPDATE ON launch_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_projections_updated_at ON financial_projections;
CREATE TRIGGER update_financial_projections_updated_at BEFORE UPDATE ON financial_projections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advisor_chats_updated_at ON advisor_chats;
CREATE TRIGGER update_advisor_chats_updated_at BEFORE UPDATE ON advisor_chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Triggers created successfully!' as status;
```

---

## 📋 SCRIPT 4: CRON JOBS (Competitor Intelligence + Weekly Insights)

**IMPORTANTE**: Primero habilita la extensión pg_cron si no está habilitada:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Success message
SELECT 'pg_cron extension enabled!' as status;
```

Luego, configura los cron jobs:

```sql
-- ============================================================================
-- CRON JOBS SETUP
-- ============================================================================

-- CRON JOB 1: Competitor Intelligence (Every Monday at 9am UTC)
SELECT cron.schedule(
  'competitor-intelligence-weekly',
  '0 9 * * 1', -- Every Monday at 9am UTC
  $$
  SELECT net.http_post(
    url:='https://aguuckggskweobxeosrq.supabase.co/functions/v1/competitor-intelligence-cron',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- CRON JOB 2: Weekly Insights (Every Monday at 10am UTC)
SELECT cron.schedule(
  'weekly-insights',
  '0 10 * * 1', -- Every Monday at 10am UTC
  $$
  SELECT net.http_post(
    url:='https://aguuckggskweobxeosrq.supabase.co/functions/v1/generate-weekly-insights',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- View scheduled cron jobs
SELECT * FROM cron.job ORDER BY jobid;

-- Success message
SELECT 'Cron jobs scheduled successfully!' as status;
```

**NOTA IMPORTANTE**: Necesitas configurar el service_role_key. Ve al siguiente script.

---

## 📋 SCRIPT 5: CONFIGURAR SERVICE ROLE KEY (Para Cron Jobs)

```sql
-- ============================================================================
-- CONFIGURE SERVICE ROLE KEY FOR CRON JOBS
-- ============================================================================

-- Set the service role key (REEMPLAZA con tu service_role_key real)
-- Lo encuentras en: Project Settings → API → service_role key

ALTER DATABASE postgres SET app.settings.service_role_key TO 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndXVja2dnc2t3ZW9ieGVvc3JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI4MTU1NCwiZXhwIjoyMDUxODU3NTU0fQ.YOUR_SERVICE_ROLE_KEY_HERE';

-- Verify it's set
SELECT current_setting('app.settings.service_role_key', true) as service_role_key;
```

**¿Dónde encuentro mi service_role_key?**

1. Ve a: https://supabase.com/dashboard/project/aguuckggskweobxeosrq/settings/api
2. Busca "service_role" (secret)
3. Click "Reveal" y copia el key
4. Reemplaza `YOUR_SERVICE_ROLE_KEY_HERE` arriba

---

## 📋 SCRIPT 6: VERIFICAR QUE TODO FUNCIONA

```sql
-- ============================================================================
-- VERIFICATION SCRIPT
-- ============================================================================

-- Check all tables exist
SELECT
  'okrs' as table_name,
  COUNT(*) as row_count
FROM okrs
UNION ALL
SELECT 'competitor_snapshots', COUNT(*) FROM competitor_snapshots
UNION ALL
SELECT 'market_intelligence', COUNT(*) FROM market_intelligence
UNION ALL
SELECT 'content_calendars', COUNT(*) FROM content_calendars
UNION ALL
SELECT 'content_pieces', COUNT(*) FROM content_pieces
UNION ALL
SELECT 'launch_checklists', COUNT(*) FROM launch_checklists
UNION ALL
SELECT 'beta_testers', COUNT(*) FROM beta_testers
UNION ALL
SELECT 'financial_projections', COUNT(*) FROM financial_projections
UNION ALL
SELECT 'key_metrics', COUNT(*) FROM key_metrics
UNION ALL
SELECT 'metric_alerts', COUNT(*) FROM metric_alerts
UNION ALL
SELECT 'ai_recommendations', COUNT(*) FROM ai_recommendations
UNION ALL
SELECT 'weekly_insights', COUNT(*) FROM weekly_insights
UNION ALL
SELECT 'advisor_chats', COUNT(*) FROM advisor_chats;

-- Check cron jobs
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname IN ('competitor-intelligence-weekly', 'weekly-insights')
ORDER BY jobid;

-- Success message
SELECT '✅ All Startup OS components verified!' as status;
```

---

## ✅ CHECKLIST DE EJECUCIÓN

Ejecuta en este orden:

1. ✅ **SCRIPT 1**: Crear tablas (5 min)
2. ✅ **SCRIPT 2**: RLS Policies (2 min)
3. ✅ **SCRIPT 3**: Triggers (1 min)
4. ✅ **SCRIPT 4**: Habilitar pg_cron (30 seg)
5. ⚠️ **SCRIPT 5**: Configurar service_role_key (1 min) - **IMPORTANTE**
6. ✅ **SCRIPT 4 (parte 2)**: Crear cron jobs (1 min)
7. ✅ **SCRIPT 6**: Verificar todo (30 seg)

**Total tiempo**: ~10 minutos

---

## 🎯 DESPUÉS DE EJECUTAR

Una vez ejecutados todos los scripts, tendrás:

✅ 13 tablas creadas y listas
✅ RLS policies configuradas
✅ Triggers de auto-update
✅ 2 Cron jobs programados:
   - Competitor Intelligence (Lunes 9am UTC)
   - Weekly Insights (Lunes 10am UTC)

---

## 🐛 TROUBLESHOOTING

### Error: "relation already exists"
**Solución**: Ya está creada, continúa con el siguiente script.

### Error: "extension pg_cron does not exist"
**Solución**:
1. Ve a Database → Extensions
2. Busca "pg_cron"
3. Click "Enable"
4. Reintenta Script 4

### Error al crear cron jobs
**Solución**: Asegúrate de haber configurado el service_role_key en Script 5.

### ¿Cómo sé si los cron jobs funcionan?
Ejecuta:
```sql
SELECT * FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE '%competitor%' OR jobname LIKE '%insights%')
ORDER BY start_time DESC
LIMIT 10;
```

---

¿Listo para pegar? 🚀
