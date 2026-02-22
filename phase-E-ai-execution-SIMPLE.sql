-- ============================================================================
-- FASE E: AI TASK EXECUTION SYSTEM - VERSIÓN SIMPLIFICADA (Uso Interno)
-- ============================================================================
-- Sistema de ejecución automática de tareas con IA
-- SIN planes de pago, SIN créditos - Solo límites simples de uso
-- Para uso interno de empresa: 5 tareas/día, 35/semana por usuario
-- ============================================================================

-- 1. LÍMITES GLOBALES (Configuración simple)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_name TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración de límites globales
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

-- 2. AI WORKERS - Tipos de ejecutores especializados
-- ============================================================================
-- MISMA TABLA pero SIN credit_cost y required_plan

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

-- Insertar workers disponibles (SIN restricciones de plan)
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
('custom_ai_pipeline', 'Custom AI Pipeline', 'Pipeline personalizado para necesidades específicas', '["custom", "multi_modal", "integrations"]'::jsonb, 600)
ON CONFLICT (worker_type) DO NOTHING;

-- 3. TASK EXECUTION TEMPLATES - Templates pre-configurados
-- ============================================================================
-- MISMA TABLA sin cambios

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
-- SIN credits_consumed, requires_approval, approved_by

CREATE TABLE IF NOT EXISTS ai_task_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  worker_type TEXT REFERENCES ai_workers(worker_type),
  template_id UUID REFERENCES task_execution_templates(id),

  -- Input
  task_description TEXT NOT NULL,
  task_classification JSONB,
  execution_params JSONB,

  -- Execution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'routing', 'executing', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_seconds INTEGER,

  -- Output
  execution_result JSONB,
  ai_work_done TEXT[],
  next_actions JSONB,

  -- Metadata
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_executions_user_date ON ai_task_executions(user_id, created_at DESC);
CREATE INDEX idx_ai_executions_status ON ai_task_executions(status) WHERE status = 'pending';

-- 5. DAILY & WEEKLY USAGE TRACKING (SIMPLIFICADO)
-- ============================================================================

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

CREATE INDEX idx_usage_limits_user ON user_usage_limits(user_id, usage_period, period_start DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Check if user can execute task (SIMPLIFICADO)
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
  -- Get system limits
  SELECT setting_value INTO v_limits
  FROM system_limits WHERE setting_name = 'task_limits';

  -- Get daily usage
  SELECT * INTO v_daily_usage FROM user_usage_limits
  WHERE user_id = p_user_id AND usage_period = 'daily' AND period_start = CURRENT_DATE;

  IF v_daily_usage IS NULL THEN
    INSERT INTO user_usage_limits (user_id, usage_period, period_start, tasks_created, ai_executions_count)
    VALUES (p_user_id, 'daily', CURRENT_DATE, 0, 0)
    ON CONFLICT DO NOTHING;
    v_daily_usage := ROW(uuid_generate_v4(), p_user_id, 'daily', CURRENT_DATE, 0, 0, NOW(), NOW());
  END IF;

  -- Get weekly usage (Monday-Sunday)
  SELECT * INTO v_weekly_usage FROM user_usage_limits
  WHERE user_id = p_user_id AND usage_period = 'weekly'
    AND period_start = DATE_TRUNC('week', CURRENT_DATE)::DATE;

  IF v_weekly_usage IS NULL THEN
    INSERT INTO user_usage_limits (user_id, usage_period, period_start, tasks_created, ai_executions_count)
    VALUES (p_user_id, 'weekly', DATE_TRUNC('week', CURRENT_DATE)::DATE, 0, 0)
    ON CONFLICT DO NOTHING;
    v_weekly_usage := ROW(uuid_generate_v4(), p_user_id, 'weekly', DATE_TRUNC('week', CURRENT_DATE)::DATE, 0, 0, NOW(), NOW());
  END IF;

  -- Check daily limits
  IF NOT p_is_ai_execution THEN
    -- Task creation
    IF COALESCE(v_daily_usage.tasks_created, 0) >= (v_limits->>'max_tasks_per_day')::INTEGER THEN
      v_can_execute := false;
      v_reason := 'Límite diario de tareas alcanzado (5/día)';
    ELSIF COALESCE(v_weekly_usage.tasks_created, 0) >= (v_limits->>'max_tasks_per_week')::INTEGER THEN
      v_can_execute := false;
      v_reason := 'Límite semanal de tareas alcanzado (35/semana)';
    END IF;
  ELSE
    -- AI execution
    IF COALESCE(v_daily_usage.ai_executions_count, 0) >= (v_limits->>'max_ai_executions_per_day')::INTEGER THEN
      v_can_execute := false;
      v_reason := 'Límite diario de ejecuciones de IA alcanzado (10/día)';
    ELSIF COALESCE(v_weekly_usage.ai_executions_count, 0) >= (v_limits->>'max_ai_executions_per_week')::INTEGER THEN
      v_can_execute := false;
      v_reason := 'Límite semanal de ejecuciones de IA alcanzado (50/semana)';
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

-- Trigger: Increment usage when task is created
CREATE OR REPLACE FUNCTION increment_task_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Daily
  INSERT INTO user_usage_limits (user_id, usage_period, period_start, tasks_created)
  VALUES (NEW.assignee_id, 'daily', CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_period, period_start)
  DO UPDATE SET
    tasks_created = user_usage_limits.tasks_created + 1,
    updated_at = NOW();

  -- Weekly
  INSERT INTO user_usage_limits (user_id, usage_period, period_start, tasks_created)
  VALUES (NEW.assignee_id, 'weekly', DATE_TRUNC('week', CURRENT_DATE)::DATE, 1)
  ON CONFLICT (user_id, usage_period, period_start)
  DO UPDATE SET
    tasks_created = user_usage_limits.tasks_created + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_task_usage
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION increment_task_usage();

-- Trigger: Increment AI execution usage
CREATE OR REPLACE FUNCTION increment_ai_execution_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Daily
    INSERT INTO user_usage_limits (user_id, usage_period, period_start, ai_executions_count)
    VALUES (NEW.user_id, 'daily', CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_period, period_start)
    DO UPDATE SET
      ai_executions_count = user_usage_limits.ai_executions_count + 1,
      updated_at = NOW();

    -- Weekly
    INSERT INTO user_usage_limits (user_id, usage_period, period_start, ai_executions_count)
    VALUES (NEW.user_id, 'weekly', DATE_TRUNC('week', CURRENT_DATE)::DATE, 1)
    ON CONFLICT (user_id, usage_period, period_start)
    DO UPDATE SET
      ai_executions_count = user_usage_limits.ai_executions_count + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_ai_execution_usage
AFTER INSERT OR UPDATE ON ai_task_executions
FOR EACH ROW
EXECUTE FUNCTION increment_ai_execution_usage();

-- ============================================================================
-- VIEWS & DASHBOARDS
-- ============================================================================

CREATE OR REPLACE VIEW user_usage_dashboard AS
SELECT
  u.id as user_id,
  p.nombre,
  p.email,

  -- Daily stats
  COALESCE(ud.tasks_created, 0) as tasks_today,
  COALESCE(ud.ai_executions_count, 0) as ai_executions_today,

  -- Weekly stats
  COALESCE(uw.tasks_created, 0) as tasks_this_week,
  COALESCE(uw.ai_executions_count, 0) as ai_executions_this_week,

  -- Limits
  (SELECT setting_value->>'max_tasks_per_day' FROM system_limits WHERE setting_name = 'task_limits')::INTEGER as daily_task_limit,
  (SELECT setting_value->>'max_tasks_per_week' FROM system_limits WHERE setting_name = 'task_limits')::INTEGER as weekly_task_limit,

  -- Remaining
  (SELECT setting_value->>'max_tasks_per_day' FROM system_limits WHERE setting_name = 'task_limits')::INTEGER - COALESCE(ud.tasks_created, 0) as tasks_remaining_today,
  (SELECT setting_value->>'max_tasks_per_week' FROM system_limits WHERE setting_name = 'task_limits')::INTEGER - COALESCE(uw.tasks_created, 0) as tasks_remaining_this_week

FROM auth.users u
LEFT JOIN profiles p ON p.auth_id = u.id
LEFT JOIN user_usage_limits ud ON ud.user_id = u.id AND ud.usage_period = 'daily' AND ud.period_start = CURRENT_DATE
LEFT JOIN user_usage_limits uw ON uw.user_id = u.id AND uw.usage_period = 'weekly' AND uw.period_start = DATE_TRUNC('week', CURRENT_DATE)::DATE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE ai_task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI executions" ON ai_task_executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create AI executions" ON ai_task_executions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI executions" ON ai_task_executions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage" ON user_usage_limits FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ FASE E: AI TASK EXECUTION SYSTEM (SIMPLIFICADO) - COMPLETADO';
  RAISE NOTICE '📊 Límites globales: 5 tareas/día, 35/semana por usuario';
  RAISE NOTICE '🤖 10 AI Workers especializados disponibles para TODOS';
  RAISE NOTICE '📝 Templates de ejecución por industria';
  RAISE NOTICE '📈 Tracking de uso diario y semanal';
  RAISE NOTICE '🚀 SIN planes de pago, SIN créditos - Uso interno simplificado';
  RAISE NOTICE '💡 Todos los usuarios tienen acceso a todas las funcionalidades';
END $$;
