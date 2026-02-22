-- ============================================================================
-- FASE E: AI TASK EXECUTION SYSTEM - UNICORN LEVEL 🦄
-- ============================================================================
-- Sistema completo para ejecutar tareas automáticamente con IA
-- Incluye límites por plan, créditos, workers especializados, y aprobaciones
-- ============================================================================

-- 1. PLANES Y CRÉDITOS DE IA
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_name TEXT NOT NULL UNIQUE CHECK (plan_name IN ('free', 'pro', 'enterprise')),
  ai_credits_monthly INTEGER NOT NULL DEFAULT 0,
  max_tasks_per_day INTEGER NOT NULL DEFAULT 0,
  max_ai_executions_per_day INTEGER NOT NULL DEFAULT 0,
  can_auto_execute BOOLEAN DEFAULT false,
  price_monthly NUMERIC DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar planes por defecto
INSERT INTO subscription_plans (plan_name, ai_credits_monthly, max_tasks_per_day, max_ai_executions_per_day, can_auto_execute, price_monthly, features) VALUES
('free', 50, 5, 3, false, 0, '[
  "5 tareas por día",
  "3 ejecuciones de IA por día",
  "50 créditos de IA/mes",
  "Aprobación manual requerida",
  "Ejecución básica de tareas"
]'::jsonb),
('pro', 500, 50, 30, true, 29, '[
  "50 tareas por día",
  "30 ejecuciones de IA por día",
  "500 créditos de IA/mes",
  "Ejecución automática",
  "Workers multi-modal (GPT-4, DALL-E, scraping)",
  "Templates personalizados",
  "Prioridad en procesamiento"
]'::jsonb),
('enterprise', 9999, 999, 999, true, 99, '[
  "Tareas ilimitadas",
  "Ejecuciones ilimitadas",
  "Créditos ilimitados",
  "Ejecución automática",
  "Workers premium (Claude Opus, GPT-4V, etc.)",
  "Custom workers bajo demanda",
  "SLA garantizado",
  "Soporte prioritario"
]'::jsonb)
ON CONFLICT (plan_name) DO NOTHING;

-- Añadir plan a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_credits_remaining INTEGER DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_credits_reset_date DATE DEFAULT CURRENT_DATE + INTERVAL '1 month';

-- 2. AI WORKERS - Tipos de ejecutores especializados
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  credit_cost_per_execution INTEGER DEFAULT 1,
  avg_execution_time_seconds INTEGER DEFAULT 30,
  required_plan TEXT DEFAULT 'free' CHECK (required_plan IN ('free', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar workers disponibles
INSERT INTO ai_workers (worker_type, display_name, description, capabilities, credit_cost_per_execution, avg_execution_time_seconds, required_plan) VALUES
-- BÁSICOS (FREE)
('email_generator', 'Email Generator', 'Genera emails personalizados con GPT-4', '["text_generation", "personalization", "email_formatting"]'::jsonb, 1, 15, 'free'),
('text_writer', 'Text Writer', 'Escribe textos, scripts, contenido', '["text_generation", "copywriting"]'::jsonb, 1, 20, 'free'),
('task_analyzer', 'Task Analyzer', 'Analiza y descompone tareas complejas', '["task_analysis", "planning"]'::jsonb, 1, 10, 'free'),

-- PRO
('lead_scraper', 'Lead Scraper', 'Busca y extrae información de leads automáticamente', '["web_scraping", "data_extraction", "lead_enrichment"]'::jsonb, 3, 60, 'pro'),
('design_generator', 'Design Generator', 'Genera diseños con DALL-E y código HTML/CSS', '["image_generation", "design", "html_css"]'::jsonb, 5, 45, 'pro'),
('email_campaign_builder', 'Email Campaign Builder', 'Crea campañas completas con múltiples emails', '["campaign_creation", "segmentation", "scheduling"]'::jsonb, 4, 90, 'pro'),
('linkedin_outreach', 'LinkedIn Outreach', 'Automatiza outreach en LinkedIn', '["linkedin_api", "message_generation", "profile_research"]'::jsonb, 3, 30, 'pro'),
('call_script_generator', 'Call Script Generator', 'Genera scripts de llamadas con objections handling', '["script_generation", "sales_training"]'::jsonb, 2, 25, 'pro'),

-- ENTERPRISE
('full_campaign_orchestrator', 'Full Campaign Orchestrator', 'Orquesta campañas multi-canal completas', '["orchestration", "multi_channel", "analytics"]'::jsonb, 10, 300, 'enterprise'),
('custom_ai_pipeline', 'Custom AI Pipeline', 'Pipeline personalizado para cliente', '["custom", "multi_modal", "integrations"]'::jsonb, 15, 600, 'enterprise')
ON CONFLICT (worker_type) DO NOTHING;

-- 3. TASK EXECUTION TEMPLATES - Templates pre-configurados
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_execution_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  industry TEXT, -- retail, saas, services, etc.
  task_type TEXT NOT NULL, -- lead_gen, content_creation, design, outreach, etc.
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

-- Templates de ejemplo
INSERT INTO task_execution_templates (template_name, industry, task_type, worker_type, prompt_template, config) VALUES
(
  'Lead Generation - Local Business',
  'retail',
  'lead_generation',
  'lead_scraper',
  'Buscar {quantity} negocios en {industry} en {location} que cumplan: {criteria}',
  '{"default_quantity": 5, "search_radius_km": 10}'::jsonb
),
(
  'Cold Email Campaign - SaaS',
  'saas',
  'email_outreach',
  'email_campaign_builder',
  'Crear campaña de {num_emails} emails para {target_persona} sobre {product_value_prop}',
  '{"default_emails": 3, "tone": "professional"}'::jsonb
),
(
  'Instagram Post Design',
  'general',
  'content_creation',
  'design_generator',
  'Diseñar post de Instagram sobre {topic} con colores {brand_colors} y estilo {style}',
  '{"image_size": "1080x1080", "format": "PNG"}'::jsonb
),
(
  'LinkedIn Connection Message',
  'b2b',
  'outreach',
  'linkedin_outreach',
  'Mensaje de conexión para {target_role} en {target_industry} mencionando {pain_point}',
  '{"max_length": 300, "tone": "professional"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 4. AI TASK EXECUTIONS - Historial de ejecuciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_task_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  worker_type TEXT REFERENCES ai_workers(worker_type),
  template_id UUID REFERENCES task_execution_templates(id),

  -- Input
  task_description TEXT NOT NULL,
  task_classification JSONB, -- Clasificación automática de la tarea
  execution_params JSONB, -- Parámetros específicos de ejecución

  -- Execution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'routing', 'executing', 'completed', 'failed', 'requires_approval')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_seconds INTEGER,

  -- Output
  execution_result JSONB, -- Resultado de la ejecución (emails generados, diseños, etc.)
  ai_work_done TEXT[], -- Lista de lo que hizo la IA
  next_actions JSONB, -- Acciones finales para el usuario

  -- Costs & Limits
  credits_consumed INTEGER DEFAULT 0,

  -- Approval (si required_plan no permite auto-ejecución)
  requires_approval BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),

  -- Metadata
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_executions_user_date ON ai_task_executions(user_id, created_at DESC);
CREATE INDEX idx_ai_executions_status ON ai_task_executions(status) WHERE status IN ('pending', 'requires_approval');

-- 5. EXECUTION APPROVALS - Para usuarios free que necesitan aprobación
-- ============================================================================

CREATE TABLE IF NOT EXISTS execution_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID REFERENCES ai_task_executions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preview de lo que va a hacer
  preview_data JSONB NOT NULL,
  estimated_credits INTEGER NOT NULL,
  estimated_time_seconds INTEGER,

  -- Approval
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DAILY USAGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,

  tasks_created INTEGER DEFAULT 0,
  ai_executions_count INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,

  executions_by_type JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, usage_date)
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Check if user can execute AI task
CREATE OR REPLACE FUNCTION can_execute_ai_task(
  p_user_id UUID,
  p_credits_needed INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_plan RECORD;
  v_usage RECORD;
  v_can_execute BOOLEAN := false;
  v_reason TEXT;
BEGIN
  -- Get user profile and plan
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id OR auth_id = p_user_id LIMIT 1;
  SELECT * INTO v_plan FROM subscription_plans WHERE plan_name = v_profile.subscription_plan;

  -- Get today's usage
  SELECT * INTO v_usage FROM daily_ai_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  IF v_usage IS NULL THEN
    v_usage := ROW(
      uuid_generate_v4(), p_user_id, CURRENT_DATE, 0, 0, 0, '{}'::jsonb, NOW(), NOW()
    );
  END IF;

  -- Check limits
  IF v_plan.max_ai_executions_per_day <= v_usage.ai_executions_count THEN
    v_can_execute := false;
    v_reason := 'Daily execution limit reached';
  ELSIF v_profile.ai_credits_remaining < p_credits_needed THEN
    v_can_execute := false;
    v_reason := 'Insufficient AI credits';
  ELSE
    v_can_execute := true;
    v_reason := 'OK';
  END IF;

  RETURN jsonb_build_object(
    'can_execute', v_can_execute,
    'reason', v_reason,
    'credits_remaining', v_profile.ai_credits_remaining,
    'executions_remaining', v_plan.max_ai_executions_per_day - COALESCE(v_usage.ai_executions_count, 0),
    'requires_approval', NOT v_plan.can_auto_execute,
    'plan', v_profile.subscription_plan
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update usage when execution completes
CREATE OR REPLACE FUNCTION update_ai_usage_on_execution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update daily usage
    INSERT INTO daily_ai_usage (user_id, usage_date, ai_executions_count, credits_consumed)
    VALUES (NEW.user_id, CURRENT_DATE, 1, NEW.credits_consumed)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET
      ai_executions_count = daily_ai_usage.ai_executions_count + 1,
      credits_consumed = daily_ai_usage.credits_consumed + NEW.credits_consumed,
      updated_at = NOW();

    -- Deduct credits from user
    UPDATE profiles
    SET ai_credits_remaining = ai_credits_remaining - NEW.credits_consumed
    WHERE id = NEW.user_id OR auth_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_ai_usage
AFTER UPDATE ON ai_task_executions
FOR EACH ROW
EXECUTE FUNCTION update_ai_usage_on_execution();

-- Trigger: Reset credits monthly
CREATE OR REPLACE FUNCTION reset_monthly_ai_credits()
RETURNS void AS $$
BEGIN
  UPDATE profiles p
  SET
    ai_credits_remaining = sp.ai_credits_monthly,
    ai_credits_reset_date = CURRENT_DATE + INTERVAL '1 month'
  FROM subscription_plans sp
  WHERE p.subscription_plan = sp.plan_name
    AND p.ai_credits_reset_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS & DASHBOARDS
-- ============================================================================

CREATE OR REPLACE VIEW user_ai_limits_dashboard AS
SELECT
  p.id as user_id,
  p.nombre,
  p.email,
  p.subscription_plan,
  p.ai_credits_remaining,
  p.ai_credits_reset_date,
  sp.ai_credits_monthly,
  sp.max_tasks_per_day,
  sp.max_ai_executions_per_day,
  sp.can_auto_execute,
  COALESCE(du.tasks_created, 0) as tasks_created_today,
  COALESCE(du.ai_executions_count, 0) as ai_executions_today,
  COALESCE(du.credits_consumed, 0) as credits_consumed_today,
  sp.max_ai_executions_per_day - COALESCE(du.ai_executions_count, 0) as executions_remaining_today
FROM profiles p
JOIN subscription_plans sp ON p.subscription_plan = sp.plan_name
LEFT JOIN daily_ai_usage du ON du.user_id = p.id AND du.usage_date = CURRENT_DATE;

CREATE OR REPLACE VIEW ai_execution_stats AS
SELECT
  user_id,
  DATE_TRUNC('day', created_at) as execution_date,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
  SUM(credits_consumed) as total_credits_consumed,
  AVG(execution_time_seconds) as avg_execution_time,
  jsonb_object_agg(
    worker_type,
    COUNT(*)
  ) FILTER (WHERE worker_type IS NOT NULL) as executions_by_worker
FROM ai_task_executions
GROUP BY user_id, DATE_TRUNC('day', created_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE ai_task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI executions" ON ai_task_executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create AI executions" ON ai_task_executions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI executions" ON ai_task_executions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own approvals" ON execution_approvals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own approvals" ON execution_approvals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage" ON daily_ai_usage FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ FASE E: AI TASK EXECUTION SYSTEM - COMPLETADO';
  RAISE NOTICE '🦄 Sistema de ejecución automática con IA implementado';
  RAISE NOTICE '📊 Límites por plan: Free (5 tareas/día), Pro (50), Enterprise (ilimitado)';
  RAISE NOTICE '💳 Sistema de créditos de IA implementado';
  RAISE NOTICE '🤖 10 AI Workers especializados disponibles';
  RAISE NOTICE '📝 Templates de ejecución por industria';
  RAISE NOTICE '✅ Sistema de aprobaciones para plan free';
  RAISE NOTICE '📈 Dashboard de monitoreo de uso';
END $$;
