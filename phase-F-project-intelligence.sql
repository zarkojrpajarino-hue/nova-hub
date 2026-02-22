-- ============================================================================
-- FASE F: PROJECT INTELLIGENCE SYSTEM 🧠
-- ============================================================================
-- Sistema que acumula contexto rico para que la IA genere outputs de calidad
-- La IA mejora con cada interacción y aprende del feedback del usuario
-- ============================================================================

-- 1. BUYER PERSONA DETALLADO
-- ============================================================================

CREATE TABLE IF NOT EXISTS buyer_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Perfil básico
  persona_name TEXT NOT NULL, -- "Dueño de restaurante familiar"
  age_range TEXT,
  role TEXT,
  industry TEXT,

  -- Pain points (LO MÁS IMPORTANTE)
  pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  /* Ejemplo:
  [
    {
      "pain": "Pierde 30% de reservas porque no contesta rápido",
      "severity": "high",
      "frequency": "daily",
      "current_workaround": "Contratar recepcionista (€1,200/mes)"
    }
  ]
  */

  -- Presupuesto y decisión
  budget_min NUMERIC,
  budget_max NUMERIC,
  budget_frequency TEXT, -- monthly, yearly, one-time
  decision_process JSONB,
  /* Ejemplo:
  {
    "decision_maker": "Dueño",
    "influencers": ["Cocinero jefe", "Socio"],
    "decision_time": "1-2 semanas",
    "requires_approval": false
  }
  */

  -- Objeciones comunes
  common_objections JSONB DEFAULT '[]'::jsonb,
  /* Ejemplo:
  [
    {
      "objection": "No tengo tiempo para aprender sistema nuevo",
      "counter_argument": "Setup en 10 minutos, sin capacitación necesaria",
      "success_rate": 0.8
    }
  ]
  */

  -- Canales de comunicación
  preferred_channels JSONB DEFAULT '[]'::jsonb,
  /* Ejemplo:
  [
    {"channel": "whatsapp", "response_rate": 0.7, "best_time": "10-11am"},
    {"channel": "phone", "response_rate": 0.5, "best_time": "14-15pm"},
    {"channel": "email", "response_rate": 0.2, "best_time": "morning"}
  ]
  */

  -- Comportamiento
  buying_triggers JSONB,
  /* Ejemplo:
  {
    "urgency_triggers": ["Temporada alta cercana", "Mala reseña reciente"],
    "value_triggers": ["ROI claro", "Caso de éxito local"],
    "social_proof": ["Testimonios de restaurantes cercanos"]
  }
  */

  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VALUE PROPOSITION DETALLADA
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_propositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Core value prop
  headline TEXT NOT NULL, -- "Sistema de reservas + reseñas en 1 plataforma"
  subheadline TEXT,

  -- Diferenciación
  unique_selling_points JSONB NOT NULL,
  /* Ejemplo:
  [
    {
      "point": "Único que combina reservas + gestión reseñas",
      "vs_competitor": "Competencia solo hace reservas",
      "proof": "Patent pending en España"
    }
  ]
  */

  -- Beneficios (NO features)
  benefits JSONB NOT NULL,
  /* Ejemplo:
  [
    {
      "benefit": "+40% más reservas",
      "how": "Sistema automático responde 24/7",
      "proof": "Promedio de 12 clientes actuales",
      "timeframe": "Primeros 2 meses"
    }
  ]
  */

  -- ROI y proof
  roi_examples JSONB,
  /* Ejemplo:
  [
    {
      "customer": "Restaurante La Tasca",
      "investment": 99,
      "return": 1200,
      "period": "monthly",
      "multiplier": 12.1,
      "testimonial": "Mejor decisión del año"
    }
  ]
  */

  -- Casos de éxito
  success_stories JSONB,
  /* Ejemplo:
  [
    {
      "customer_name": "Miguel @ El Rincón",
      "industry": "Restaurante familiar",
      "location": "Malasaña, Madrid",
      "before": "3.2★, 60% ocupación",
      "after": "4.8★, 95% ocupación",
      "timeframe": "3 meses",
      "quote": "Recuperé mi vida. Ya no pierdo llamadas."
    }
  ]
  */

  -- Pricing positioning
  pricing_justification JSONB,
  /* Ejemplo:
  {
    "price": 99,
    "frequency": "monthly",
    "comparison": "Recepcionista = €1,200/mes, nosotros = €99/mes",
    "roi_calculation": "3 reservas extra = €300, pagas €99 = ROI 3x",
    "payment_terms": "Sin compromiso, cancela cuando quieras"
  }
  */

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BRAND GUIDELINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Visual identity
  logo_url TEXT,
  primary_color TEXT, -- "#FF5733"
  secondary_color TEXT,
  accent_colors JSONB,
  typography JSONB, -- {"heading": "Montserrat", "body": "Open Sans"}

  -- Tone of voice
  tone_attributes JSONB NOT NULL,
  /* Ejemplo:
  {
    "formality": "informal", -- formal, semi-formal, informal
    "energy": "enthusiastic", -- calm, moderate, enthusiastic
    "humor": "light", -- none, light, heavy
    "technical": "minimal", -- none, minimal, moderate, technical
    "you_vs_usted": "tú"
  }
  */

  -- Language do's and don'ts
  preferred_words JSONB,
  /* Ejemplo:
  {
    "use": ["sencillo", "rápido", "sin complicaciones", "automatizado"],
    "avoid": ["CRM", "funnel", "SaaS", "plataforma enterprise"],
    "replace": {
      "sistema": "herramienta",
      "software": "app"
    }
  }
  */

  -- Example communications
  example_good JSONB,
  /* Ejemplo:
  {
    "email_subject": "María, ¿cuántas reservas pierdes al día?",
    "email_body": "Hola María, vi que...",
    "why_good": "Directo, usa nombre, plantea problema específico"
  }
  */

  example_bad JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMPETITIVE INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  competitor_name TEXT NOT NULL,
  website TEXT,

  -- Qué ofrecen
  features JSONB,
  pricing JSONB,
  target_market TEXT,

  -- Fortalezas y debilidades
  strengths JSONB,
  weaknesses JSONB,

  -- Cómo competimos
  our_advantage JSONB,
  /* Ejemplo:
  {
    "price": "€99/mes vs €199/mes de ellos",
    "features": "Nosotros: reservas + reseñas. Ellos: solo reservas",
    "support": "Soporte en español 24/7 vs solo inglés business hours",
    "onboarding": "10 minutos vs 2 semanas de setup"
  }
  */

  -- Battle cards (cómo responder cuando cliente dice "ya uso X")
  battle_card JSONB,
  /* Ejemplo:
  {
    "when_customer_says": "Ya uso OpenTable",
    "response": "Genial. OpenTable es bueno para reservas, pero ¿quién gestiona tus reseñas de Google? Con nosotros todo en un lugar.",
    "follow_up": "Muchos clientes usan ambos: OpenTable para reservas internacionales, nosotros para local + reseñas."
  }
  */

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONVERSATION MEMORY (Lead interactions almacenadas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('email', 'call', 'meeting', 'whatsapp', 'linkedin')),
  conversation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contenido
  subject TEXT,
  content TEXT NOT NULL, -- Email body, call notes, etc.
  sentiment TEXT, -- positive, neutral, negative

  -- Extracciones automáticas
  objections_mentioned TEXT[],
  pain_points_mentioned TEXT[],
  competitors_mentioned TEXT[],
  budget_mentioned NUMERIC,
  urgency_level TEXT, -- low, medium, high

  -- Outcome
  outcome TEXT, -- interested, not_interested, needs_time, converted
  next_action TEXT,
  next_action_date DATE,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_conversations_lead ON lead_conversations(lead_id, conversation_date DESC);
CREATE INDEX idx_lead_conversations_project ON lead_conversations(project_id, conversation_date DESC);

-- 6. LEARNING LOOPS (AI feedback y mejora continua)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_output_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES ai_task_executions(id),

  -- Output generado
  output_type TEXT NOT NULL, -- email, design, script, etc.
  ai_generated_content JSONB NOT NULL,

  -- Feedback del usuario
  user_action TEXT NOT NULL CHECK (user_action IN ('approved', 'rejected', 'edited', 'ignored')),
  user_edits TEXT, -- Si editó, qué cambió
  rejection_reason TEXT,

  -- Aprendizajes extraídos
  learnings JSONB,
  /* Ejemplo:
  {
    "what_worked": ["Mencionar caso de éxito local", "Email corto <100 palabras"],
    "what_failed": ["Subject demasiado largo", "Tono muy formal"],
    "apply_to_future": true
  }
  */

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROJECT KNOWLEDGE BASE (contexto acumulado)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,

  -- Patterns detectados
  successful_patterns JSONB DEFAULT '[]'::jsonb,
  /* Ejemplo:
  [
    {
      "pattern": "Emails <100 palabras tienen 3x más respuestas",
      "confidence": 0.9,
      "sample_size": 45,
      "detected_at": "2026-01-15"
    }
  ]
  */

  failed_experiments JSONB DEFAULT '[]'::jsonb,
  /* Ejemplo:
  [
    {
      "experiment": "Emails con descuento en subject",
      "result": "0% conversión vs 15% sin descuento",
      "reason": "Pareció spam",
      "avoid_in_future": true
    }
  ]
  */

  -- Market insights
  market_trends JSONB,
  seasonal_patterns JSONB,

  -- AI preferences aprendidas
  ai_preferences JSONB DEFAULT '{}'::jsonb,
  /* Ejemplo:
  {
    "email_length": "short", -- learned from user feedback
    "tone": "casual_but_professional",
    "include_emojis": false,
    "include_case_studies": true,
    "subject_line_style": "question_based"
  }
  */

  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get rich context for AI execution
CREATE OR REPLACE FUNCTION get_project_intelligence(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'buyer_personas', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', persona_name,
          'pain_points', pain_points,
          'budget', jsonb_build_object('min', budget_min, 'max', budget_max),
          'decision_process', decision_process,
          'objections', common_objections,
          'channels', preferred_channels,
          'triggers', buying_triggers
        )
      )
      FROM buyer_personas WHERE project_id = p_project_id
    ),
    'value_proposition', (
      SELECT jsonb_build_object(
        'headline', headline,
        'unique_points', unique_selling_points,
        'benefits', benefits,
        'roi_examples', roi_examples,
        'success_stories', success_stories,
        'pricing', pricing_justification
      )
      FROM value_propositions WHERE project_id = p_project_id AND is_active = true LIMIT 1
    ),
    'brand', (
      SELECT jsonb_build_object(
        'visual', jsonb_build_object('primary_color', primary_color, 'secondary_color', secondary_color),
        'tone', tone_attributes,
        'language', jsonb_build_object('use', preferred_words->'use', 'avoid', preferred_words->'avoid')
      )
      FROM brand_guidelines WHERE project_id = p_project_id LIMIT 1
    ),
    'competitors', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', competitor_name,
          'our_advantage', our_advantage,
          'battle_card', battle_card
        )
      )
      FROM competitors WHERE project_id = p_project_id
    ),
    'knowledge', (
      SELECT jsonb_build_object(
        'successful_patterns', successful_patterns,
        'failed_experiments', failed_experiments,
        'ai_preferences', ai_preferences
      )
      FROM project_knowledge_base WHERE project_id = p_project_id
    ),
    'recent_conversations', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', conversation_type,
          'date', conversation_date,
          'objections', objections_mentioned,
          'outcome', outcome
        )
      )
      FROM lead_conversations
      WHERE project_id = p_project_id
      ORDER BY conversation_date DESC
      LIMIT 10
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_propositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_output_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage buyer personas of their projects" ON buyer_personas FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = buyer_personas.project_id AND pm.member_id = auth.uid())
);

CREATE POLICY "Users can manage value props of their projects" ON value_propositions FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = value_propositions.project_id AND pm.member_id = auth.uid())
);

CREATE POLICY "Users can manage brand guidelines of their projects" ON brand_guidelines FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = brand_guidelines.project_id AND pm.member_id = auth.uid())
);

CREATE POLICY "Users can manage competitors of their projects" ON competitors FOR ALL USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = competitors.project_id AND pm.member_id = auth.uid())
);

CREATE POLICY "Users can view conversations of their projects" ON lead_conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = lead_conversations.project_id AND pm.member_id = auth.uid())
);

CREATE POLICY "Users can view AI feedback of their projects" ON ai_output_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = ai_output_feedback.project_id AND pm.member_id = auth.uid())
);

CREATE POLICY "Users can view knowledge base of their projects" ON project_knowledge_base FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = project_knowledge_base.project_id AND pm.member_id = auth.uid())
);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ FASE F: PROJECT INTELLIGENCE SYSTEM - COMPLETADO';
  RAISE NOTICE '🧠 Sistema de contexto rico implementado';
  RAISE NOTICE '📊 Buyer personas detallados';
  RAISE NOTICE '💎 Value propositions con ROI y pruebas';
  RAISE NOTICE '🎨 Brand guidelines para consistencia';
  RAISE NOTICE '⚔️ Competitive intelligence con battle cards';
  RAISE NOTICE '💬 Memory de conversaciones con leads';
  RAISE NOTICE '📈 Learning loops - IA mejora con feedback';
  RAISE NOTICE '🔥 La IA ahora tiene contexto REAL para generar outputs de calidad';
END $$;
