-- ULTRA PERSONALIZED ONBOARDING SCHEMA
-- Soporte para las 10 capas de personalización en los 3 tipos de onboarding

-- ============================================================================
-- TABLA: onboarding_sessions
-- Trackea cada sesión de onboarding con su tipo y progreso
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  onboarding_type TEXT NOT NULL CHECK (onboarding_type IN ('generative', 'idea', 'existing')),

  -- Progressive profiling (Capa 9)
  phase TEXT NOT NULL DEFAULT 'essentials' CHECK (phase IN ('essentials', 'deep_dive', 'continuous')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  -- Datos recolectados
  answers JSONB DEFAULT '{}'::jsonb,

  -- Geo-Intelligence (Capa 1)
  location_city TEXT,
  location_country TEXT,
  location_coordinates JSONB, -- {lat, lng}
  target_market TEXT[], -- ['local', 'national', 'regional', 'global']

  -- Founder Profiling (Capa 3)
  founder_background TEXT,
  founder_skills TEXT[],
  linkedin_data JSONB,

  -- Collaborative (Capa 7)
  has_cofounder BOOLEAN DEFAULT false,
  cofounder_session_id UUID REFERENCES onboarding_sessions(id),
  alignment_score INTEGER CHECK (alignment_score >= 0 AND alignment_score <= 100),

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id)
);

CREATE INDEX idx_onboarding_sessions_project ON onboarding_sessions(project_id);
CREATE INDEX idx_onboarding_sessions_type ON onboarding_sessions(onboarding_type);

-- ============================================================================
-- TABLA: geo_intelligence_cache
-- Cache de datos geo para evitar llamadas repetidas a APIs externas
-- ============================================================================

CREATE TABLE IF NOT EXISTS geo_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key TEXT NOT NULL UNIQUE, -- "madrid_spain" or "barcelona_spain"

  -- Competidores locales
  local_competitors JSONB DEFAULT '[]'::jsonb,

  -- Inversores locales
  local_investors JSONB DEFAULT '[]'::jsonb,

  -- Costos operativos
  operational_costs JSONB DEFAULT '{}'::jsonb, -- {dev_salary, marketing_salary, coworking, etc}

  -- Regulaciones
  regulations JSONB DEFAULT '[]'::jsonb,

  -- Eventos y recursos
  local_events JSONB DEFAULT '[]'::jsonb,
  accelerators JSONB DEFAULT '[]'::jsonb,
  grants JSONB DEFAULT '[]'::jsonb,

  -- Market data
  market_size JSONB DEFAULT '{}'::jsonb,
  cost_of_living INTEGER, -- Index 0-100

  -- Cache metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geo_cache_location ON geo_intelligence_cache(location_key);
CREATE INDEX idx_geo_cache_expiry ON geo_intelligence_cache(expires_at);

-- ============================================================================
-- TABLA: competitive_analysis
-- Análisis competitivo personalizado (Capa 4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitive_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Competidores identificados
  competitors JSONB DEFAULT '[]'::jsonb, -- [{name, url, pricing, strengths, weaknesses, market_position}]

  -- SWOT personalizado
  swot JSONB DEFAULT '{}'::jsonb, -- {strengths, weaknesses, opportunities, threats}

  -- Gaps identificados
  market_gaps JSONB DEFAULT '[]'::jsonb, -- [{gap, opportunity_score, reasoning}]

  -- Estrategia recomendada
  recommended_strategy JSONB DEFAULT '{}'::jsonb, -- {positioning, gtm, differentiation}

  -- Benchmarking (solo para 'existing')
  benchmarks JSONB DEFAULT '{}'::jsonb, -- {metric: {us, competitor_avg, best_in_class}}

  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitive_analysis_project ON competitive_analysis(project_id);

-- ============================================================================
-- TABLA: learning_paths
-- Rutas de aprendizaje personalizadas (Capa 6)
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Gaps detectados
  skill_gaps TEXT[],

  -- Resources recomendados
  resources JSONB DEFAULT '[]'::jsonb,
  -- [{
  --   title, type (book/course/video), url,
  --   priority (critical/high/medium/low),
  --   estimated_time, reasoning
  -- }]

  -- Skills que ya tiene (skip)
  existing_skills TEXT[],

  -- Progress tracking
  completed_resources UUID[],

  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_paths_project ON learning_paths(project_id);

-- ============================================================================
-- TABLA: cofounder_alignment
-- Análisis de alineamiento entre co-founders (Capa 7)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cofounder_alignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Sessions de ambos co-founders
  founder_a_session_id UUID NOT NULL REFERENCES onboarding_sessions(id),
  founder_b_session_id UUID NOT NULL REFERENCES onboarding_sessions(id),

  -- Análisis de alineamiento
  alignment_score INTEGER CHECK (alignment_score >= 0 AND alignment_score <= 100),

  -- Categorías de alineamiento
  vision_alignment INTEGER CHECK (vision_alignment >= 0 AND vision_alignment <= 100),
  strategy_alignment INTEGER CHECK (strategy_alignment >= 0 AND strategy_alignment <= 100),
  commitment_alignment INTEGER CHECK (commitment_alignment >= 0 AND commitment_alignment <= 100),
  values_alignment INTEGER CHECK (values_alignment >= 0 AND values_alignment <= 100),

  -- Desalineamientos detectados
  misalignments JSONB DEFAULT '[]'::jsonb,
  -- [{category, severity (critical/important/minor), founder_a_answer, founder_b_answer, impact}]

  -- Preguntas para discutir
  discussion_topics JSONB DEFAULT '[]'::jsonb,
  -- [{topic, question, reasoning, priority}]

  -- Recomendaciones
  recommendations JSONB DEFAULT '{}'::jsonb,

  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cofounder_alignment_project ON cofounder_alignment(project_id);

-- ============================================================================
-- TABLA: generated_business_options
-- Opciones de negocio generadas (solo para onboarding 'generative')
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_business_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Opciones generadas (típicamente 3)
  options JSONB DEFAULT '[]'::jsonb,
  -- [{
  --   title, description, fit_score,
  --   reasoning, pros, cons,
  --   financial_projections: {initial_investment, breakeven_months, year_1_revenue},
  --   implementation_roadmap: [{phase, duration, tasks}]
  -- }]

  -- Opción seleccionada por el usuario
  selected_option_index INTEGER,

  -- Context usado para generar
  founder_profile JSONB,
  constraints JSONB, -- {capital, time, skills}

  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_options_project ON generated_business_options(project_id);

-- ============================================================================
-- TABLA: validation_roadmaps
-- Roadmaps de validación (solo para onboarding 'idea')
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Hipótesis a validar
  hypotheses JSONB DEFAULT '[]'::jsonb,
  -- [{hypothesis, validation_method, success_criteria, timeline}]

  -- Experimentos recomendados
  experiments JSONB DEFAULT '[]'::jsonb,
  -- [{name, description, cost, time, expected_learnings, how_to}]

  -- Milestones
  milestones JSONB DEFAULT '[]'::jsonb,
  -- [{name, criteria, target_date, status}]

  -- Progress
  completed_experiments UUID[],

  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_validation_roadmaps_project ON validation_roadmaps(project_id);

-- ============================================================================
-- TABLA: growth_playbooks
-- Playbooks de crecimiento (solo para onboarding 'existing')
-- ============================================================================

CREATE TABLE IF NOT EXISTS growth_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Diagnóstico
  diagnosis JSONB DEFAULT '{}'::jsonb,
  -- {current_phase, main_bottleneck, health_score, critical_issues}

  -- Plan de acción priorizado
  action_plan JSONB DEFAULT '[]'::jsonb,
  -- [{
  --   priority, category (acquisition/retention/product/ops),
  --   action, reasoning, expected_impact, timeline, resources_needed
  -- }]

  -- Escenarios proyectados
  scenarios JSONB DEFAULT '{}'::jsonb,
  -- {status_quo, optimistic, realistic, pessimistic}

  -- Métricas a trackear
  key_metrics TEXT[],

  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_growth_playbooks_project ON growth_playbooks(project_id);

-- ============================================================================
-- TABLA: voice_onboarding_transcripts
-- Transcripciones de onboarding por voz (Capa 8)
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_onboarding_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Audio file
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,

  -- Transcripción
  transcript TEXT,

  -- Respuestas extraídas por IA
  extracted_answers JSONB DEFAULT '{}'::jsonb,

  -- Estado de review
  reviewed BOOLEAN DEFAULT false,
  user_edits JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_voice_transcripts_project ON voice_onboarding_transcripts(project_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofounder_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_business_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_onboarding_transcripts ENABLE ROW LEVEL SECURITY;

-- onboarding_sessions policies
CREATE POLICY "Users can view their own onboarding sessions"
  ON onboarding_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = onboarding_sessions.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create onboarding sessions"
  ON onboarding_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = onboarding_sessions.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own onboarding sessions"
  ON onboarding_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = onboarding_sessions.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- geo_intelligence_cache policies (read-only for users, managed by functions)
CREATE POLICY "Everyone can read geo cache"
  ON geo_intelligence_cache FOR SELECT
  USING (true);

-- competitive_analysis policies
CREATE POLICY "Users can view their competitive analysis"
  ON competitive_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitive_analysis.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create competitive analysis"
  ON competitive_analysis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitive_analysis.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- learning_paths policies
CREATE POLICY "Users can view their learning paths"
  ON learning_paths FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = learning_paths.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their learning paths"
  ON learning_paths FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = learning_paths.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view their cofounder alignment"
  ON cofounder_alignment FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = cofounder_alignment.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their generated business options"
  ON generated_business_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = generated_business_options.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their validation roadmaps"
  ON validation_roadmaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = validation_roadmaps.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their growth playbooks"
  ON growth_playbooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = growth_playbooks.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their voice transcripts"
  ON voice_onboarding_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = voice_onboarding_transcripts.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER onboarding_sessions_updated_at
  BEFORE UPDATE ON onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER competitive_analysis_updated_at
  BEFORE UPDATE ON competitive_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER learning_paths_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER validation_roadmaps_updated_at
  BEFORE UPDATE ON validation_roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER growth_playbooks_updated_at
  BEFORE UPDATE ON growth_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();
