-- AI GENERATIONS LOGGING
-- Tabla para trackear todas las generaciones IA y medir performance

CREATE TABLE IF NOT EXISTS ai_generations_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Context
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL, -- 'analyze-competitors', 'suggest-buyer-persona', etc.

  -- Input
  input_data JSONB NOT NULL, -- Los parámetros que recibió la función

  -- Output
  output_data JSONB, -- La respuesta generada
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  -- Performance metrics
  execution_time_ms INTEGER, -- Tiempo de respuesta en milisegundos
  tokens_used INTEGER, -- Tokens consumidos (si disponible)
  model_used TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  cost_usd DECIMAL(10, 4), -- Costo aproximado en USD

  -- Quality metrics (to be filled by user feedback)
  user_accepted BOOLEAN, -- ¿El usuario aceptó el output sin editar?
  user_edited BOOLEAN, -- ¿El usuario editó el output?
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5), -- Rating 1-5
  user_feedback TEXT, -- Feedback opcional del usuario

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_log_project ON ai_generations_log(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_log_function ON ai_generations_log(function_name);
CREATE INDEX IF NOT EXISTS idx_ai_log_created ON ai_generations_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_log_success ON ai_generations_log(success);

-- RLS Policies
ALTER TABLE ai_generations_log ENABLE ROW LEVEL SECURITY;

-- Users can see logs from their own projects
CREATE POLICY "Users can view their project AI logs"
  ON ai_generations_log
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

-- Service role can insert (edge functions)
CREATE POLICY "Service role can insert AI logs"
  ON ai_generations_log
  FOR INSERT
  WITH CHECK (true);

-- Users can update quality metrics (rating, feedback)
CREATE POLICY "Users can update AI log quality metrics"
  ON ai_generations_log
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );

-- Create view for analytics
CREATE OR REPLACE VIEW ai_generations_analytics AS
SELECT
  function_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  ROUND(AVG(execution_time_ms)::numeric, 2) as avg_execution_time_ms,
  ROUND(AVG(tokens_used)::numeric, 2) as avg_tokens_used,
  ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd,
  COUNT(*) FILTER (WHERE user_accepted = true) as user_accepted_count,
  COUNT(*) FILTER (WHERE user_edited = true) as user_edited_count,
  ROUND(AVG(user_rating)::numeric, 2) as avg_user_rating,
  DATE_TRUNC('day', created_at) as date
FROM ai_generations_log
GROUP BY function_name, DATE_TRUNC('day', created_at)
ORDER BY date DESC, function_name;

COMMENT ON TABLE ai_generations_log IS 'Logs all AI generation calls for analytics, optimization, and cost tracking';
COMMENT ON VIEW ai_generations_analytics IS 'Aggregated analytics of AI generations by function and date';
