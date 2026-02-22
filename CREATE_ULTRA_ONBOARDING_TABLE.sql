-- CREAR TABLA ULTRA ONBOARDING RESPONSES
-- Ejecutar en Supabase SQL Editor

-- Crear tabla principal
CREATE TABLE IF NOT EXISTS ultra_onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_type TEXT NOT NULL CHECK (onboarding_type IN ('generative', 'idea', 'existing')),

  -- Auto-fill & Location (NUEVOS)
  auto_fill_data JSONB,
  location_data JSONB,

  -- Phase 1: Quick Wins
  reality_check JSONB,
  team_structure JSONB,
  goals_strategy JSONB,
  your_why JSONB,

  -- Phase 2: Personalization
  your_edge JSONB,
  current_traction JSONB,
  timing_analysis JSONB,
  industry_selection JSONB,
  industry_specific_answers JSONB,

  -- Phase 3: Advanced Analysis
  deep_metrics JSONB,
  pmf_assessment JSONB,
  competitive_landscape JSONB,
  moat_analysis JSONB,
  network_access JSONB,
  fundraising_history JSONB,
  team_breakdown JSONB,

  -- Metadata
  completion_percentage INT DEFAULT 0,
  phase TEXT DEFAULT 'essentials',
  red_flags JSONB,
  pmf_score INT,
  validation_score INT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_ultra_onboarding_project
  ON ultra_onboarding_responses(project_id);

CREATE INDEX IF NOT EXISTS idx_ultra_onboarding_user
  ON ultra_onboarding_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_ultra_onboarding_type
  ON ultra_onboarding_responses(onboarding_type);

CREATE INDEX IF NOT EXISTS idx_ultra_onboarding_completion
  ON ultra_onboarding_responses(completion_percentage);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_ultra_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para auto-update de updated_at
DROP TRIGGER IF EXISTS ultra_onboarding_updated_at_trigger ON ultra_onboarding_responses;
CREATE TRIGGER ultra_onboarding_updated_at_trigger
  BEFORE UPDATE ON ultra_onboarding_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_ultra_onboarding_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE ultra_onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own onboarding responses"
  ON ultra_onboarding_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding responses"
  ON ultra_onboarding_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding responses"
  ON ultra_onboarding_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding responses"
  ON ultra_onboarding_responses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Mensaje de confirmación
SELECT 'Tabla ultra_onboarding_responses creada correctamente!' AS status;
