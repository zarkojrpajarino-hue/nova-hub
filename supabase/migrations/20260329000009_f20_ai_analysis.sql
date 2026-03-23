-- F20.1 — ai_analysis_cache table
-- NOTE: Original migration was 20260325000001_fase20_ai_analysis_cache.sql
-- This file exists for completeness. IF NOT EXISTS ensures idempotency.

CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  analysis_level SMALLINT NOT NULL CHECK (analysis_level BETWEEN 1 AND 3),
  input_hash TEXT,
  result JSONB,
  output JSONB NOT NULL,
  model_used TEXT DEFAULT 'claude-sonnet-4-5-20250514',
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  tokens_used INT,
  cost_cents NUMERIC(8,2),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  last_data_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  additional_context TEXT,
  CONSTRAINT uq_analysis_cache UNIQUE(project_id, analysis_level)
);

ALTER TABLE ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Members can read analyses for their projects
CREATE POLICY IF NOT EXISTS "members_read_analysis" ON ai_analysis_cache FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = ai_analysis_cache.project_id AND pm.member_id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache ON ai_analysis_cache(project_id, analysis_level, expires_at DESC);
