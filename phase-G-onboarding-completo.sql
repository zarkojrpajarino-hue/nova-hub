-- ============================================================================
-- FASE G: ONBOARDING COMPLETO - De persona a emprendedor
-- ============================================================================
-- Sistema de onboarding adaptativo según el nivel del usuario:
-- 1. Sin idea → Genera ideas de negocio
-- 2. Con idea → Valida y estructura
-- 3. Con proyecto → Escala y optimiza
-- ============================================================================

-- 1. EXPANDED ONBOARDING FIELDS
-- ============================================================================

-- Añadir campos faltantes a projects.onboarding_data
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_stage TEXT CHECK (user_stage IN (
  'sin_idea',           -- Usuario quiere emprender pero no sabe qué
  'idea_generada',      -- IA le generó ideas, eligió una
  'idea_propia',        -- Usuario tiene idea clara
  'validando',          -- Validando idea con experimentos
  'mvp',                -- Construyendo MVP
  'traccion',           -- Ya tiene tracción inicial
  'escalando',          -- Escalando el negocio
  'consolidado'         -- Negocio consolidado
));

ALTER TABLE projects ADD COLUMN IF NOT EXISTS methodology TEXT CHECK (methodology IN (
  'lean_startup',       -- Para ideas y validación
  'design_thinking',    -- Para innovación y creatividad
  'jobs_to_be_done',    -- Para entender cliente profundo
  'scaling_up',         -- Para empresas escalando
  'blitzscaling'        -- Para hipercrecimiento
));

-- 2. USER INTERESTS (para usuarios sin idea)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Intereses y hobbies
  hobbies TEXT[],
  professional_background TEXT,
  skills TEXT[],

  -- Preferencias de emprendimiento
  preferred_industries TEXT[],
  /* Ejemplo: ["tecnología", "salud", "educación", "sostenibilidad"] */

  avoid_industries TEXT[],
  /* Ejemplo: ["alcohol", "tabaco", "armas"] */

  target_market_preference TEXT,
  /* "b2b", "b2c", "b2b2c", "marketplace" */

  business_model_preference TEXT[],
  /* ["saas", "ecommerce", "servicios", "marketplace", "subscription"] */

  -- Recursos disponibles
  available_budget NUMERIC,
  available_time_hours_week INTEGER,
  has_cofounder BOOLEAN DEFAULT false,
  technical_skills_level TEXT CHECK (technical_skills_level IN ('none', 'basic', 'intermediate', 'advanced')),

  -- Objetivos
  revenue_goal_monthly NUMERIC,
  lifestyle_goal TEXT,
  /* "freedom", "impact", "wealth", "innovation", "legacy" */

  risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GENERATED BUSINESS IDEAS (por IA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_business_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Idea generada
  idea_name TEXT NOT NULL,
  idea_description TEXT NOT NULL,
  tagline TEXT,

  -- Problema y solución
  problem_statement TEXT NOT NULL,
  solution_approach TEXT NOT NULL,
  target_customer TEXT NOT NULL,

  -- Viabilidad
  estimated_difficulty TEXT CHECK (estimated_difficulty IN ('easy', 'medium', 'hard', 'very_hard')),
  time_to_first_revenue TEXT, -- "1-3 meses", "6-12 meses"
  required_investment_min NUMERIC,
  required_investment_max NUMERIC,

  -- Oportunidad de mercado
  market_size_estimate TEXT,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  differentiation_angle TEXT,

  -- Modelo de negocio sugerido
  business_model TEXT,
  /* "SaaS subscription", "Marketplace con comisión", "E-commerce DTC", etc. */
  revenue_streams JSONB,
  /* [{"stream": "Subscripción mensual", "estimated_price": 29}] */

  -- Primeros pasos
  validation_experiments JSONB,
  /* [
    {"step": 1, "action": "Crear landing page", "cost": 0, "time": "2 horas"},
    {"step": 2, "action": "Hacer 20 entrevistas", "cost": 0, "time": "1 semana"}
  ] */

  mvp_scope TEXT,
  first_customers_strategy TEXT,

  -- Scoring
  opportunity_score NUMERIC, -- 0-100
  fit_score NUMERIC, -- 0-100 (qué tan bien fit con usuario)

  -- Estado
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'selected', 'rejected', 'in_validation')),
  rejection_reason TEXT,

  -- Metadata
  generated_by_ai BOOLEAN DEFAULT true,
  ai_prompt_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMPANY ASSETS (recursos existentes de la empresa)
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Digital presence
  website_url TEXT,
  social_media JSONB,
  /* {
    "instagram": "https://instagram.com/empresa",
    "linkedin": "https://linkedin.com/company/empresa",
    "tiktok": "@empresa",
    "facebook": "https://facebook.com/empresa",
    "youtube": "https://youtube.com/@empresa"
  } */

  -- Branding actual
  logo_url TEXT,
  brand_colors JSONB, -- {"primary": "#FF5733", "secondary": "#C70039"}
  typography JSONB, -- {"heading": "Montserrat", "body": "Open Sans"}
  brand_guide_url TEXT, -- URL a PDF de guía de marca

  -- Content assets
  pitch_deck_url TEXT,
  one_pager_url TEXT,
  product_images TEXT[], -- Array de URLs
  demo_video_url TEXT,

  -- Legal & business docs
  business_plan_url TEXT,
  financial_model_url TEXT,

  -- Email & domain
  company_email TEXT, -- Para enviar emails desde IA
  email_provider TEXT, -- "gmail", "gsuite", "outlook", "custom"
  email_smtp_config JSONB,

  -- Analytics & tracking
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VALIDATION EXPERIMENTS (experimentos Lean Startup)
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES generated_business_ideas(id),

  -- Experimento
  experiment_name TEXT NOT NULL,
  experiment_type TEXT NOT NULL,
  /* "landing_page", "customer_interview", "survey", "mvp_test", "ad_campaign", "waitlist" */

  hypothesis TEXT NOT NULL,
  /* "Al menos 100 personas se registrarán en la landing page en 1 semana" */

  success_criteria TEXT NOT NULL,
  /* "50+ emails capturados con tasa conversión >5%" */

  -- Ejecución
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'running', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Recursos
  budget_allocated NUMERIC DEFAULT 0,
  time_allocated_hours INTEGER,

  -- Resultados
  results JSONB,
  /* {
    "emails_captured": 127,
    "conversion_rate": 8.2,
    "cost_per_lead": 0.5,
    "key_learnings": ["Dolor principal es X", "Dispuestos a pagar Y"]
  } */

  validated BOOLEAN,
  learnings TEXT,
  next_experiment_id UUID REFERENCES validation_experiments(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ONBOARDING FLOWS (diferentes flujos según user_stage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_name TEXT NOT NULL UNIQUE,
  user_stage TEXT NOT NULL,

  -- Steps del onboarding
  steps JSONB NOT NULL,
  /* [
    {
      "step": 1,
      "title": "¿Qué te apasiona?",
      "fields": ["hobbies", "professional_background"],
      "ai_processing": "analyze_interests"
    },
    {
      "step": 2,
      "title": "¿Qué tipo de negocio te interesa?",
      "fields": ["preferred_industries", "business_model_preference"],
      "ai_processing": null
    },
    {
      "step": 3,
      "title": "Recursos disponibles",
      "fields": ["available_budget", "available_time_hours_week"],
      "ai_processing": null
    },
    {
      "step": 4,
      "title": "Generando ideas personalizadas...",
      "fields": [],
      "ai_processing": "generate_business_ideas"
    }
  ] */

  completion_triggers_ai BOOLEAN DEFAULT false,
  ai_action_on_complete TEXT,
  /* "generate_ideas", "validate_idea", "generate_mvp_roadmap" */

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert onboarding flows
INSERT INTO onboarding_flows (flow_name, user_stage, steps, completion_triggers_ai, ai_action_on_complete) VALUES
(
  'Quiero emprender pero no sé qué',
  'sin_idea',
  '[
    {"step": 1, "title": "¿Qué te apasiona?", "fields": ["hobbies", "skills"], "ai_processing": null},
    {"step": 2, "title": "¿En qué industrias te gustaría trabajar?", "fields": ["preferred_industries"], "ai_processing": null},
    {"step": 3, "title": "¿Qué recursos tienes?", "fields": ["available_budget", "available_time_hours_week"], "ai_processing": null},
    {"step": 4, "title": "IA generando ideas personalizadas...", "fields": [], "ai_processing": "generate_business_ideas"}
  ]'::jsonb,
  true,
  'generate_business_ideas'
),
(
  'Tengo una idea',
  'idea_propia',
  '[
    {"step": 1, "title": "Cuéntame tu idea", "fields": ["nombre", "descripcion", "problema_resuelve"], "ai_processing": null},
    {"step": 2, "title": "¿Quién es tu cliente ideal?", "fields": ["cliente_objetivo"], "ai_processing": null},
    {"step": 3, "title": "Recursos de tu empresa", "fields": ["website", "social_media", "email"], "ai_processing": null},
    {"step": 4, "title": "IA creando plan de validación...", "fields": [], "ai_processing": "generate_validation_plan"}
  ]'::jsonb,
  true,
  'generate_validation_plan'
),
(
  'Tengo un proyecto en marcha',
  'validando',
  '[
    {"step": 1, "title": "Cuéntame sobre tu proyecto", "fields": ["nombre", "descripcion", "fase"], "ai_processing": null},
    {"step": 2, "title": "Métricas actuales", "fields": ["clientes_actuales", "revenue_mensual"], "ai_processing": null},
    {"step": 3, "title": "Assets digitales", "fields": ["website", "social_media", "pitch_deck"], "ai_processing": null},
    {"step": 4, "title": "IA analizando y generando roadmap...", "fields": [], "ai_processing": "generate_growth_roadmap"}
  ]'::jsonb,
  true,
  'generate_growth_roadmap'
)
ON CONFLICT (flow_name) DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get appropriate onboarding flow for user
CREATE OR REPLACE FUNCTION get_onboarding_flow(p_user_stage TEXT)
RETURNS JSONB AS $$
DECLARE
  v_flow RECORD;
BEGIN
  SELECT * INTO v_flow
  FROM onboarding_flows
  WHERE user_stage = p_user_stage
  LIMIT 1;

  IF v_flow IS NULL THEN
    -- Default flow
    SELECT * INTO v_flow
    FROM onboarding_flows
    WHERE flow_name = 'Tengo una idea'
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'flow_name', v_flow.flow_name,
    'steps', v_flow.steps,
    'ai_action', v_flow.ai_action_on_complete
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_business_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interests" ON user_interests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own generated ideas" ON generated_business_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage assets of their projects" ON company_assets FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = company_assets.project_id AND pm.member_id = auth.uid())
);
CREATE POLICY "Users can manage experiments of their projects" ON validation_experiments FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = validation_experiments.project_id AND pm.member_id = auth.uid())
);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ FASE G: ONBOARDING COMPLETO - IMPLEMENTADO';
  RAISE NOTICE '🎯 3 flujos de onboarding según stage del usuario';
  RAISE NOTICE '💡 Sistema de generación de ideas de negocio';
  RAISE NOTICE '🔬 Validation experiments (Lean Startup)';
  RAISE NOTICE '📊 Company assets (web, redes, branding, email)';
  RAISE NOTICE '🚀 Metodologías: Lean Startup, Scaling Up, etc.';
  RAISE NOTICE '💎 De persona sin idea → Emprendedor exitoso';
END $$;
