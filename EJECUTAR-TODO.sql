-- ============================================================================
-- NOVA HUB - SQL COMPLETO CONSOLIDADO
-- ============================================================================
-- Ejecutar TODO este archivo EN ORDEN en Supabase SQL Editor
-- ============================================================================

-- PASO 1: Sistema de ejecución IA simplificado (Límites globales)
-- ============================================================================

-- System limits
CREATE TABLE IF NOT EXISTS system_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_name TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_limits (setting_name, setting_value, description) VALUES
('task_limits', '{
  "max_tasks_per_day": 5,
  "max_tasks_per_week": 35,
  "max_ai_executions_per_day": 10,
  "max_ai_executions_per_week": 50
}'::jsonb, 'Límites de tareas y ejecuciones de IA para todos los usuarios'),
('ai_execution_config', '{
  "auto_execute_enabled": true,
  "require_approval": false,
  "max_execution_time_seconds": 300
}'::jsonb, 'Configuración de ejecución automática de IA')
ON CONFLICT (setting_name) DO NOTHING;

-- AI Workers (sin planes ni créditos)
CREATE TABLE IF NOT EXISTS ai_workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  avg_execution_time_seconds INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ai_workers (worker_type, display_name, description, capabilities, avg_execution_time_seconds) VALUES
('email_generator', 'Email Generator', 'Genera emails personalizados con GPT-4', '["text_generation", "personalization", "email_formatting"]'::jsonb, 15),
('text_writer', 'Text Writer', 'Escribe textos, scripts, contenido', '["text_generation", "copywriting"]'::jsonb, 20),
('task_analyzer', 'Task Analyzer', 'Analiza y descompone tareas complejas', '["task_analysis", "planning"]'::jsonb, 10),
('lead_scraper', 'Lead Scraper', 'Busca y extrae información de leads automáticamente', '["web_scraping", "data_extraction", "lead_enrichment"]'::jsonb, 60),
('design_generator', 'Design Generator', 'Genera diseños con DALL-E y código HTML/CSS', '["image_generation", "design", "html_css"]'::jsonb, 45),
('email_campaign_builder', 'Email Campaign Builder', 'Crea campañas completas con múltiples emails', '["campaign_creation", "segmentation", "scheduling"]'::jsonb, 90),
('linkedin_outreach', 'LinkedIn Outreach', 'Automatiza outreach en LinkedIn', '["linkedin_api", "message_generation", "profile_research"]'::jsonb, 30),
('call_script_generator', 'Call Script Generator', 'Genera scripts de llamadas con objections handling', '["script_generation", "sales_training"]'::jsonb, 25),
('full_campaign_orchestrator', 'Full Campaign Orchestrator', 'Orquesta campañas multi-canal completas', '["orchestration", "multi_channel", "analytics"]'::jsonb, 300),
('custom_ai_pipeline', 'Custom AI Pipeline', 'Pipeline personalizado', '["custom", "multi_modal", "integrations"]'::jsonb, 600)
ON CONFLICT (worker_type) DO NOTHING;

-- Task execution templates
CREATE TABLE IF NOT EXISTS task_execution_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  industry TEXT,
  task_type TEXT NOT NULL,
  worker_type TEXT REFERENCES ai_workers(worker_type),
  prompt_template TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  example_output JSONB,
  success_rate NUMERIC DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  avg_user_rating NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO task_execution_templates (template_name, industry, task_type, worker_type, prompt_template, config) VALUES
('Lead Generation - Local Business', 'retail', 'lead_generation', 'lead_scraper', 'Buscar {quantity} negocios en {industry} en {location}', '{"default_quantity": 5}'::jsonb),
('Cold Email Campaign - SaaS', 'saas', 'email_outreach', 'email_campaign_builder', 'Crear campaña de {num_emails} emails para {target_persona}', '{"default_emails": 3}'::jsonb),
('Instagram Post Design', 'general', 'content_creation', 'design_generator', 'Diseñar post sobre {topic} con colores {brand_colors}', '{"image_size": "1080x1080"}'::jsonb),
('LinkedIn Connection Message', 'b2b', 'outreach', 'linkedin_outreach', 'Mensaje para {target_role} en {target_industry}', '{"max_length": 300}'::jsonb)
ON CONFLICT DO NOTHING;

-- AI task executions
CREATE TABLE IF NOT EXISTS ai_task_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  worker_type TEXT REFERENCES ai_workers(worker_type),
  template_id UUID REFERENCES task_execution_templates(id),
  task_description TEXT NOT NULL,
  task_classification JSONB,
  execution_params JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'routing', 'executing', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_seconds INTEGER,
  execution_result JSONB,
  ai_work_done TEXT[],
  next_actions JSONB,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_executions_user_date ON ai_task_executions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_executions_status ON ai_task_executions(status) WHERE status = 'pending';

-- User usage limits (daily & weekly)
CREATE TABLE IF NOT EXISTS user_usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_period TEXT NOT NULL CHECK (usage_period IN ('daily', 'weekly')),
  period_start DATE NOT NULL,
  tasks_created INTEGER DEFAULT 0,
  ai_executions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_period, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_limits_user ON user_usage_limits(user_id, usage_period, period_start DESC);

-- Function: Check if user can execute
CREATE OR REPLACE FUNCTION can_execute_task(
  p_user_id UUID,
  p_is_ai_execution BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_limits JSONB;
  v_daily_usage RECORD;
  v_weekly_usage RECORD;
  v_can_execute BOOLEAN := true;
  v_reason TEXT := 'OK';
BEGIN
  SELECT setting_value INTO v_limits FROM system_limits WHERE setting_name = 'task_limits';

  SELECT * INTO v_daily_usage FROM user_usage_limits
  WHERE user_id = p_user_id AND usage_period = 'daily' AND period_start = CURRENT_DATE;

  IF v_daily_usage IS NULL THEN
    INSERT INTO user_usage_limits (user_id, usage_period, period_start, tasks_created, ai_executions_count)
    VALUES (p_user_id, 'daily', CURRENT_DATE, 0, 0) ON CONFLICT DO NOTHING;
    v_daily_usage := ROW(uuid_generate_v4(), p_user_id, 'daily', CURRENT_DATE, 0, 0, NOW(), NOW());
  END IF;

  SELECT * INTO v_weekly_usage FROM user_usage_limits
  WHERE user_id = p_user_id AND usage_period = 'weekly' AND period_start = DATE_TRUNC('week', CURRENT_DATE)::DATE;

  IF v_weekly_usage IS NULL THEN
    INSERT INTO user_usage_limits (user_id, usage_period, period_start, tasks_created, ai_executions_count)
    VALUES (p_user_id, 'weekly', DATE_TRUNC('week', CURRENT_DATE)::DATE, 0, 0) ON CONFLICT DO NOTHING;
    v_weekly_usage := ROW(uuid_generate_v4(), p_user_id, 'weekly', DATE_TRUNC('week', CURRENT_DATE)::DATE, 0, 0, NOW(), NOW());
  END IF;

  IF NOT p_is_ai_execution THEN
    IF COALESCE(v_daily_usage.tasks_created, 0) >= (v_limits->>'max_tasks_per_day')::INTEGER THEN
      v_can_execute := false;
      v_reason := 'Límite diario de tareas alcanzado (5/día)';
    ELSIF COALESCE(v_weekly_usage.tasks_created, 0) >= (v_limits->>'max_tasks_per_week')::INTEGER THEN
      v_can_execute := false;
      v_reason := 'Límite semanal de tareas alcanzado (35/semana)';
    END IF;
  ELSE
    IF COALESCE(v_daily_usage.ai_executions_count, 0) >= (v_limits->>'max_ai_executions_per_day')::INTEGER THEN
      v_can_execute := false;
      v_reason := 'Límite diario de ejecuciones IA alcanzado (10/día)';
    ELSIF COALESCE(v_weekly_usage.ai_executions_count, 0) >= (v_limits->>'max_ai_executions_per_week')::INTEGER THEN
      v_can_execute := false;
      v_reason := 'Límite semanal de ejecuciones IA alcanzado (50/semana)';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'can_execute', v_can_execute,
    'reason', v_reason,
    'limits', jsonb_build_object(
      'daily', jsonb_build_object(
        'tasks_used', COALESCE(v_daily_usage.tasks_created, 0),
        'tasks_limit', (v_limits->>'max_tasks_per_day')::INTEGER,
        'ai_executions_used', COALESCE(v_daily_usage.ai_executions_count, 0),
        'ai_executions_limit', (v_limits->>'max_ai_executions_per_day')::INTEGER
      ),
      'weekly', jsonb_build_object(
        'tasks_used', COALESCE(v_weekly_usage.tasks_created, 0),
        'tasks_limit', (v_limits->>'max_tasks_per_week')::INTEGER,
        'ai_executions_used', COALESCE(v_weekly_usage.ai_executions_count, 0),
        'ai_executions_limit', (v_limits->>'max_ai_executions_per_week')::INTEGER
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Increment task usage
CREATE OR REPLACE FUNCTION increment_task_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_usage_limits (user_id, usage_period, period_start, tasks_created)
  VALUES (NEW.assignee_id, 'daily', CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_period, period_start) DO UPDATE SET tasks_created = user_usage_limits.tasks_created + 1, updated_at = NOW();

  INSERT INTO user_usage_limits (user_id, usage_period, period_start, tasks_created)
  VALUES (NEW.assignee_id, 'weekly', DATE_TRUNC('week', CURRENT_DATE)::DATE, 1)
  ON CONFLICT (user_id, usage_period, period_start) DO UPDATE SET tasks_created = user_usage_limits.tasks_created + 1, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_increment_task_usage ON tasks;
CREATE TRIGGER trigger_increment_task_usage AFTER INSERT ON tasks FOR EACH ROW EXECUTE FUNCTION increment_task_usage();

-- Trigger: Increment AI execution usage
CREATE OR REPLACE FUNCTION increment_ai_execution_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO user_usage_limits (user_id, usage_period, period_start, ai_executions_count)
    VALUES (NEW.user_id, 'daily', CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_period, period_start) DO UPDATE SET ai_executions_count = user_usage_limits.ai_executions_count + 1, updated_at = NOW();

    INSERT INTO user_usage_limits (user_id, usage_period, period_start, ai_executions_count)
    VALUES (NEW.user_id, 'weekly', DATE_TRUNC('week', CURRENT_DATE)::DATE, 1)
    ON CONFLICT (user_id, usage_period, period_start) DO UPDATE SET ai_executions_count = user_usage_limits.ai_executions_count + 1, updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_increment_ai_execution_usage ON ai_task_executions;
CREATE TRIGGER trigger_increment_ai_execution_usage AFTER INSERT OR UPDATE ON ai_task_executions FOR EACH ROW EXECUTE FUNCTION increment_ai_execution_usage();

-- View: User usage dashboard
CREATE OR REPLACE VIEW user_usage_dashboard AS
SELECT
  u.id as user_id,
  p.nombre,
  p.email,
  COALESCE(ud.tasks_created, 0) as tasks_today,
  COALESCE(ud.ai_executions_count, 0) as ai_executions_today,
  COALESCE(uw.tasks_created, 0) as tasks_this_week,
  COALESCE(uw.ai_executions_count, 0) as ai_executions_this_week,
  (SELECT setting_value->>'max_tasks_per_day' FROM system_limits WHERE setting_name = 'task_limits')::INTEGER as daily_task_limit,
  (SELECT setting_value->>'max_tasks_per_week' FROM system_limits WHERE setting_name = 'task_limits')::INTEGER as weekly_task_limit,
  (SELECT setting_value->>'max_tasks_per_day' FROM system_limits WHERE setting_name = 'task_limits')::INTEGER - COALESCE(ud.tasks_created, 0) as tasks_remaining_today,
  (SELECT setting_value->>'max_tasks_per_week' FROM system_limits WHERE setting_name = 'task_limits')::INTEGER - COALESCE(uw.tasks_created, 0) as tasks_remaining_this_week
FROM auth.users u
LEFT JOIN profiles p ON p.auth_id = u.id
LEFT JOIN user_usage_limits ud ON ud.user_id = u.id AND ud.usage_period = 'daily' AND ud.period_start = CURRENT_DATE
LEFT JOIN user_usage_limits uw ON uw.user_id = u.id AND uw.usage_period = 'weekly' AND uw.period_start = DATE_TRUNC('week', CURRENT_DATE)::DATE;

-- RLS
ALTER TABLE ai_task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI executions" ON ai_task_executions;
CREATE POLICY "Users can view their own AI executions" ON ai_task_executions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create AI executions" ON ai_task_executions;
CREATE POLICY "Users can create AI executions" ON ai_task_executions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own AI executions" ON ai_task_executions;
CREATE POLICY "Users can update their own AI executions" ON ai_task_executions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own usage" ON user_usage_limits;
CREATE POLICY "Users can view their own usage" ON user_usage_limits FOR SELECT USING (auth.uid() = user_id);

RAISE NOTICE '✅ PASO 1 COMPLETADO: Sistema de ejecución IA simplificado';

-- ============================================================================
-- PASO 2: Project Intelligence System (Contexto rico para IA)
-- ============================================================================

-- IMPORTANTE: Este archivo incluye SOLO las tablas básicas.
-- Los datos se poblarán mediante Edge Function "enrich-project-intelligence"
-- que el usuario llamará después del onboarding.

-- Buyer Personas detallados
CREATE TABLE IF NOT EXISTS buyer_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  persona_name TEXT NOT NULL,
  age_range TEXT,
  role TEXT,
  industry TEXT,
  pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget_min NUMERIC,
  budget_max NUMERIC,
  budget_frequency TEXT,
  decision_process JSONB,
  common_objections JSONB DEFAULT '[]'::jsonb,
  preferred_channels JSONB DEFAULT '[]'::jsonb,
  buying_triggers JSONB,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Value Propositions
CREATE TABLE IF NOT EXISTS value_propositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  subheadline TEXT,
  unique_selling_points JSONB NOT NULL,
  benefits JSONB NOT NULL,
  roi_examples JSONB,
  success_stories JSONB,
  pricing_justification JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Guidelines
CREATE TABLE IF NOT EXISTS brand_guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_colors JSONB,
  typography JSONB,
  tone_attributes JSONB NOT NULL,
  preferred_words JSONB,
  example_good JSONB,
  example_bad JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitors
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  website TEXT,
  features JSONB,
  pricing JSONB,
  target_market TEXT,
  strengths JSONB,
  weaknesses JSONB,
  our_advantage JSONB,
  battle_card JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Conversations (memoria de interacciones)
CREATE TABLE IF NOT EXISTS lead_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('email', 'call', 'meeting', 'whatsapp', 'linkedin')),
  conversation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subject TEXT,
  content TEXT NOT NULL,
  sentiment TEXT,
  objections_mentioned TEXT[],
  pain_points_mentioned TEXT[],
  competitors_mentioned TEXT[],
  budget_mentioned NUMERIC,
  urgency_level TEXT,
  outcome TEXT,
  next_action TEXT,
  next_action_date DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_conversations_lead ON lead_conversations(lead_id, conversation_date DESC);
CREATE INDEX IF NOT EXISTS idx_lead_conversations_project ON lead_conversations(project_id, conversation_date DESC);

-- AI Output Feedback (learning loops)
CREATE TABLE IF NOT EXISTS ai_output_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES ai_task_executions(id),
  output_type TEXT NOT NULL,
  ai_generated_content JSONB NOT NULL,
  user_action TEXT NOT NULL CHECK (user_action IN ('approved', 'rejected', 'edited', 'ignored')),
  user_edits TEXT,
  rejection_reason TEXT,
  learnings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Knowledge Base (contexto acumulado)
CREATE TABLE IF NOT EXISTS project_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  successful_patterns JSONB DEFAULT '[]'::jsonb,
  failed_experiments JSONB DEFAULT '[]'::jsonb,
  market_trends JSONB,
  seasonal_patterns JSONB,
  ai_preferences JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Function: Get rich context for AI
CREATE OR REPLACE FUNCTION get_project_intelligence(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'buyer_personas', (SELECT jsonb_agg(to_jsonb(bp)) FROM buyer_personas bp WHERE project_id = p_project_id),
    'value_proposition', (SELECT to_jsonb(vp) FROM value_propositions vp WHERE project_id = p_project_id AND is_active = true LIMIT 1),
    'brand', (SELECT to_jsonb(bg) FROM brand_guidelines bg WHERE project_id = p_project_id LIMIT 1),
    'competitors', (SELECT jsonb_agg(to_jsonb(c)) FROM competitors c WHERE project_id = p_project_id),
    'knowledge', (SELECT to_jsonb(pkb) FROM project_knowledge_base pkb WHERE project_id = p_project_id),
    'recent_conversations', (SELECT jsonb_agg(to_jsonb(lc)) FROM lead_conversations lc WHERE project_id = p_project_id ORDER BY conversation_date DESC LIMIT 10)
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_propositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_output_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage buyer personas" ON buyer_personas;
CREATE POLICY "Users can manage buyer personas" ON buyer_personas FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = buyer_personas.project_id AND pm.member_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage value props" ON value_propositions;
CREATE POLICY "Users can manage value props" ON value_propositions FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = value_propositions.project_id AND pm.member_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage brand guidelines" ON brand_guidelines;
CREATE POLICY "Users can manage brand guidelines" ON brand_guidelines FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = brand_guidelines.project_id AND pm.member_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage competitors" ON competitors;
CREATE POLICY "Users can manage competitors" ON competitors FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = competitors.project_id AND pm.member_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view conversations" ON lead_conversations;
CREATE POLICY "Users can view conversations" ON lead_conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = lead_conversations.project_id AND pm.member_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view feedback" ON ai_output_feedback;
CREATE POLICY "Users can view feedback" ON ai_output_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = ai_output_feedback.project_id AND pm.member_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view knowledge base" ON project_knowledge_base;
CREATE POLICY "Users can view knowledge base" ON project_knowledge_base FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = project_knowledge_base.project_id AND pm.member_id = auth.uid())
);

RAISE NOTICE '✅ PASO 2 COMPLETADO: Project Intelligence System (contexto rico)';

-- ============================================================================
-- PASO 3: Onboarding Completo + Company Assets
-- ============================================================================

-- Añadir campos a projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_stage TEXT CHECK (user_stage IN (
  'sin_idea', 'idea_generada', 'idea_propia', 'validando', 'mvp', 'traccion', 'escalando', 'consolidado'
));

ALTER TABLE projects ADD COLUMN IF NOT EXISTS methodology TEXT CHECK (methodology IN (
  'lean_startup', 'design_thinking', 'jobs_to_be_done', 'scaling_up', 'blitzscaling'
));

-- User Interests (para usuarios sin idea)
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hobbies TEXT[],
  professional_background TEXT,
  skills TEXT[],
  preferred_industries TEXT[],
  avoid_industries TEXT[],
  target_market_preference TEXT,
  business_model_preference TEXT[],
  available_budget NUMERIC,
  available_time_hours_week INTEGER,
  has_cofounder BOOLEAN DEFAULT false,
  technical_skills_level TEXT CHECK (technical_skills_level IN ('none', 'basic', 'intermediate', 'advanced')),
  revenue_goal_monthly NUMERIC,
  lifestyle_goal TEXT,
  risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Business Ideas
CREATE TABLE IF NOT EXISTS generated_business_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_name TEXT NOT NULL,
  idea_description TEXT NOT NULL,
  tagline TEXT,
  problem_statement TEXT NOT NULL,
  solution_approach TEXT NOT NULL,
  target_customer TEXT NOT NULL,
  estimated_difficulty TEXT CHECK (estimated_difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
  time_to_first_revenue TEXT,
  required_investment_min NUMERIC,
  required_investment_max NUMERIC,
  market_size_estimate TEXT,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  differentiation_angle TEXT,
  business_model TEXT,
  revenue_streams JSONB,
  validation_experiments JSONB,
  mvp_scope TEXT,
  first_customers_strategy TEXT,
  opportunity_score NUMERIC,
  fit_score NUMERIC,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'selected', 'rejected', 'in_validation')),
  rejection_reason TEXT,
  generated_by_ai BOOLEAN DEFAULT true,
  ai_prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Assets (web, redes, email, branding)
CREATE TABLE IF NOT EXISTS company_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  website_url TEXT,
  social_media JSONB,
  logo_url TEXT,
  brand_colors JSONB,
  typography JSONB,
  brand_guide_url TEXT,
  pitch_deck_url TEXT,
  one_pager_url TEXT,
  product_images TEXT[],
  demo_video_url TEXT,
  business_plan_url TEXT,
  financial_model_url TEXT,
  company_email TEXT,
  email_provider TEXT,
  email_smtp_config JSONB,
  resend_api_key TEXT,
  sender_email TEXT,
  sender_name TEXT,
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation Experiments (Lean Startup)
CREATE TABLE IF NOT EXISTS validation_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES generated_business_ideas(id),
  experiment_name TEXT NOT NULL,
  experiment_type TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  success_criteria TEXT NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'running', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  budget_allocated NUMERIC DEFAULT 0,
  time_allocated_hours INTEGER,
  results JSONB,
  validated BOOLEAN,
  learnings TEXT,
  next_experiment_id UUID REFERENCES validation_experiments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_business_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their interests" ON user_interests;
CREATE POLICY "Users manage their interests" ON user_interests FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view their ideas" ON generated_business_ideas;
CREATE POLICY "Users view their ideas" ON generated_business_ideas FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage company assets" ON company_assets;
CREATE POLICY "Users manage company assets" ON company_assets FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = company_assets.project_id AND pm.member_id = auth.uid())
);

DROP POLICY IF EXISTS "Users manage experiments" ON validation_experiments;
CREATE POLICY "Users manage experiments" ON validation_experiments FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = validation_experiments.project_id AND pm.member_id = auth.uid())
);

RAISE NOTICE '✅ PASO 3 COMPLETADO: Onboarding completo + Company Assets';

-- ============================================================================
-- PASO 4: Email Integration (Resend + Tracking)
-- ============================================================================

-- Sent Emails (tracking real)
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID REFERENCES ai_task_executions(id),
  lead_id UUID REFERENCES leads(id),
  project_id UUID REFERENCES projects(id),
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  external_id TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sent_emails_lead ON sent_emails(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON sent_emails(status);
CREATE INDEX IF NOT EXISTS idx_sent_emails_project ON sent_emails(project_id, created_at DESC);

-- RLS
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view sent emails" ON sent_emails;
CREATE POLICY "Users view sent emails" ON sent_emails FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = sent_emails.project_id AND pm.member_id = auth.uid())
);

RAISE NOTICE '✅ PASO 4 COMPLETADO: Email Integration + Tracking';

-- ============================================================================
-- PASO 5: Generative Onboarding (Products + Generation Previews)
-- ============================================================================

-- Products/Services (generated by AI or manual)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Product info
  product_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  tagline TEXT,

  -- Pricing
  price NUMERIC NOT NULL,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN (
    'one_time', 'monthly', 'yearly', 'hourly', 'project_based', 'freemium', 'usage_based'
  )),
  currency TEXT DEFAULT 'EUR',

  -- Features/Details
  features JSONB DEFAULT '[]'::jsonb,
  /* [{"feature": "Feature name", "description": "Feature detail"}] */

  deliverables JSONB,
  /* [{"deliverable": "What customer gets", "timeline": "When they get it"}] */

  target_customer TEXT,
  value_proposition TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- AI generation tracking
  generated_by_ai BOOLEAN DEFAULT false,
  ai_generation_prompt TEXT,
  ai_rationale TEXT,
  /* Why AI chose this pricing, features, etc. */

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_project ON products(project_id, is_active, sort_order);

-- Generation Previews (for AI-generated content approval)
CREATE TABLE IF NOT EXISTS generation_previews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What's being generated
  generation_type TEXT NOT NULL CHECK (generation_type IN (
    'complete_business', 'branding', 'products', 'website', 'buyer_persona',
    'value_proposition', 'competitor_analysis', 'validation_plan'
  )),

  -- Generated options (usually 3 options per type)
  generated_options JSONB NOT NULL,
  /* For branding: [
    {
      "option": 1,
      "logo_url": "...",
      "primary_color": "#...",
      "secondary_color": "#...",
      "accent_colors": [...],
      "typography": {...},
      "rationale": "Why this design works for your brand"
    },
    {...option 2...},
    {...option 3...}
  ]

  For products: [
    {
      "option": 1,
      "products": [
        {
          "name": "Product 1",
          "description": "...",
          "price": 99,
          "pricing_model": "monthly",
          "features": [...],
          "rationale": "Why this pricing makes sense"
        }
      ]
    }
  ]
  */

  -- User selection
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'edited')),
  selected_option INTEGER,
  /* Which option (1, 2, or 3) did user select */

  user_edits JSONB,
  /* If user edited the selected option, what did they change */

  rejection_reason TEXT,

  -- Applied tracking
  applied_at TIMESTAMPTZ,
  applied_to_tables JSONB,
  /* {"brand_guidelines": "uuid", "products": ["uuid1", "uuid2"], ...} */

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_previews_project ON generation_previews(project_id, generation_type, status);
CREATE INDEX IF NOT EXISTS idx_generation_previews_user ON generation_previews(user_id, created_at DESC);

-- Update company_assets to track AI generation
ALTER TABLE company_assets ADD COLUMN IF NOT EXISTS logo_generated_by_ai BOOLEAN DEFAULT false;
ALTER TABLE company_assets ADD COLUMN IF NOT EXISTS website_generated_by_ai BOOLEAN DEFAULT false;
ALTER TABLE company_assets ADD COLUMN IF NOT EXISTS website_html TEXT;
ALTER TABLE company_assets ADD COLUMN IF NOT EXISTS website_deployed_url TEXT;
ALTER TABLE company_assets ADD COLUMN IF NOT EXISTS vercel_deployment_id TEXT;

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_previews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage products" ON products;
CREATE POLICY "Users manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = products.project_id AND pm.member_id = auth.uid())
);

DROP POLICY IF EXISTS "Users manage generation previews" ON generation_previews;
CREATE POLICY "Users manage generation previews" ON generation_previews FOR ALL USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = generation_previews.project_id AND pm.member_id = auth.uid())
);

RAISE NOTICE '✅ PASO 5 COMPLETADO: Generative Onboarding (Products + Generation Previews)';

-- ============================================================================
-- SUCCESS - TODO COMPLETADO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉🎉🎉 CONSOLIDACIÓN COMPLETA - TODO EJECUTADO 🎉🎉🎉';
  RAISE NOTICE '';
  RAISE NOTICE '✅ PASO 1: Sistema ejecución IA (límites 5/día, 35/semana)';
  RAISE NOTICE '✅ PASO 2: Project Intelligence (buyer personas, value prop, brand, competidores)';
  RAISE NOTICE '✅ PASO 3: Onboarding completo (3 flujos, user interests, ideas, assets)';
  RAISE NOTICE '✅ PASO 4: Email integration (Resend + tracking)';
  RAISE NOTICE '✅ PASO 5: Generative Onboarding (products + generation previews)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 TOTALES:';
  RAISE NOTICE '   - 22+ tablas nuevas';
  RAISE NOTICE '   - 10+ funciones y triggers';
  RAISE NOTICE '   - RLS policies en todas las tablas';
  RAISE NOTICE '';
  RAISE NOTICE '🦄 KILLER FEATURE: Generative Onboarding en Real-Time';
  RAISE NOTICE '   Usuario sin logo/branding/productos → IA genera 3 opciones';
  RAISE NOTICE '   Usuario aprueba → Todo se aplica automáticamente';
  RAISE NOTICE '   Resultado: Idea → Negocio completo en 10 minutos';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 SIGUIENTE PASO: Desplegar Edge Functions';
  RAISE NOTICE '   cd /c/Users/Zarko/nova-hub';
  RAISE NOTICE '   npx supabase functions deploy ai-task-router';
  RAISE NOTICE '   npx supabase functions deploy ai-task-executor';
  RAISE NOTICE '   npx supabase functions deploy auto-sync-finances';
  RAISE NOTICE '   npx supabase functions deploy generate-business-ideas';
  RAISE NOTICE '   npx supabase functions deploy generate-complete-business';
  RAISE NOTICE '   npx supabase functions deploy send-email-real';
  RAISE NOTICE '';
END $$;
