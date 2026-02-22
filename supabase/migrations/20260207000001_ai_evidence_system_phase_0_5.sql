-- =====================================================
-- Phase 0.5: AI Evidence System - User Documents & Source Registry
-- Days 1-2: Database Infrastructure
-- =====================================================

-- 1. PROJECT DOCUMENTS TABLE (Tier 1 sources - highest priority)
-- Language-aware full-text search for user-uploaded documents
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document metadata
  name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'csv', 'xlsx', 'txt'
  file_size_bytes INTEGER,
  upload_date TIMESTAMPTZ DEFAULT now(),

  -- Content extraction
  raw_content TEXT, -- Full extracted text
  structured_data JSONB, -- For CSV/XLSX parsed data

  -- Search optimization
  content_language TEXT DEFAULT 'simple', -- 'simple', 'english', 'spanish', etc.
  content_tsvector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector(
      COALESCE(content_language, 'simple')::regconfig,
      COALESCE(raw_content, '')
    )
  ) STORED,

  -- Document structure for citations
  pages_count INTEGER, -- For PDFs
  sections JSONB, -- [{page: 1, heading: "...", start_char: 0, end_char: 1000}]

  -- Authority tracking
  source_type TEXT DEFAULT 'user_document', -- Always 'user_document' for this table
  authority_score INTEGER DEFAULT 100, -- User docs start at max authority

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast retrieval
CREATE INDEX idx_project_documents_project ON project_documents(project_id);
CREATE INDEX idx_project_documents_user ON project_documents(user_id);
CREATE INDEX idx_project_documents_type ON project_documents(file_type);
CREATE INDEX idx_project_documents_search ON project_documents USING GIN(content_tsvector);
CREATE INDEX idx_project_documents_upload_date ON project_documents(upload_date DESC);

-- RLS Policies
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project documents"
  ON project_documents FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_documents.project_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their project documents"
  ON project_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their project documents"
  ON project_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their project documents"
  ON project_documents FOR DELETE
  USING (auth.uid() = user_id);


-- =====================================================
-- 2. AI SOURCE REGISTRY (All external sources)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source identification
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'official_api', 'business_data', 'news', 'web'

  -- Reliability scoring (external quality, NOT project-specific)
  reliability_score INTEGER DEFAULT 50 CHECK (reliability_score BETWEEN 0 AND 100),
  reliability_rationale TEXT, -- Why this score?

  -- Source metadata
  domain TEXT, -- For independence checking
  parent_organization TEXT, -- For lineage tracking
  country TEXT,
  language TEXT,

  -- Freshness
  last_updated TIMESTAMPTZ,
  update_frequency TEXT, -- 'real-time', 'daily', 'weekly', 'static'

  -- API configuration (for official sources)
  api_endpoint TEXT,
  requires_api_key BOOLEAN DEFAULT false,
  rate_limit_per_minute INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_source_registry_type ON ai_source_registry(source_type);
CREATE INDEX idx_ai_source_registry_domain ON ai_source_registry(domain);
CREATE UNIQUE INDEX idx_ai_source_registry_url ON ai_source_registry(source_url);

-- No RLS - this is a shared reference table


-- =====================================================
-- 3. USER SOURCE POLICIES (Per-project source preferences)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_source_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Evidence mode
  evidence_mode TEXT DEFAULT 'balanced' CHECK (evidence_mode IN ('strict', 'balanced', 'hypothesis')),

  -- Source tier preferences
  tier_1_enabled BOOLEAN DEFAULT true, -- User documents
  tier_2_enabled BOOLEAN DEFAULT true, -- Official APIs
  tier_3_enabled BOOLEAN DEFAULT true, -- Business data
  tier_4_enabled BOOLEAN DEFAULT false, -- News (disabled by default)

  -- Domain controls
  blocked_domains TEXT[] DEFAULT '{}',
  allowed_domains TEXT[] DEFAULT '{}', -- Empty = allow all (except blocked)

  -- Age limits
  max_source_age_days INTEGER, -- NULL = no limit

  -- Advanced settings
  require_https BOOLEAN DEFAULT true,
  min_reliability_score INTEGER DEFAULT 40,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(project_id)
);

-- Indexes
CREATE INDEX idx_user_source_policies_project ON user_source_policies(project_id);
CREATE INDEX idx_user_source_policies_user ON user_source_policies(user_id);

-- RLS
ALTER TABLE user_source_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their source policies"
  ON user_source_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their source policies"
  ON user_source_policies FOR ALL
  USING (auth.uid() = user_id);


-- =====================================================
-- 4. AI GENERATION LOGS (Audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Generation context
  function_name TEXT NOT NULL, -- 'business-model-canvas', 'financial-projections', etc.
  prompt_used TEXT,
  evidence_mode TEXT NOT NULL,

  -- Pre-generation plan
  planned_sources JSONB, -- Sources we PLANNED to search

  -- Post-generation results
  sources_found JSONB, -- Actual sources retrieved
  claims_made JSONB, -- Structured claims with citations
  evidence_status TEXT NOT NULL, -- 'evidence_backed', 'partial_evidence', 'no_evidence', 'conflicting'
  coverage_percentage INTEGER,

  -- Performance metrics
  search_duration_ms INTEGER,
  generation_duration_ms INTEGER,
  total_tokens_used INTEGER,

  -- Output
  generated_content JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_generation_logs_project ON ai_generation_logs(project_id);
CREATE INDEX idx_ai_generation_logs_user ON ai_generation_logs(user_id);
CREATE INDEX idx_ai_generation_logs_function ON ai_generation_logs(function_name);
CREATE INDEX idx_ai_generation_logs_date ON ai_generation_logs(created_at DESC);

-- RLS
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their generation logs"
  ON ai_generation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert generation logs"
  ON ai_generation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Search user documents with ranking
CREATE OR REPLACE FUNCTION search_project_documents(
  p_project_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  document_id UUID,
  document_name TEXT,
  file_type TEXT,
  upload_date TIMESTAMPTZ,
  relevance_rank REAL,
  matched_content TEXT,
  page_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.id,
    pd.name,
    pd.file_type,
    pd.upload_date,
    ts_rank(pd.content_tsvector, websearch_to_tsquery('simple', p_query)) as relevance_rank,
    ts_headline(
      'simple',
      pd.raw_content,
      websearch_to_tsquery('simple', p_query),
      'MaxWords=50, MinWords=20, MaxFragments=3'
    ) as matched_content,
    NULL::INTEGER as page_number -- Will be computed client-side from character position
  FROM project_documents pd
  WHERE
    pd.project_id = p_project_id
    AND pd.content_tsvector @@ websearch_to_tsquery('simple', p_query)
  ORDER BY relevance_rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get or create default source policy for project
CREATE OR REPLACE FUNCTION get_project_source_policy(p_project_id UUID)
RETURNS user_source_policies AS $$
DECLARE
  v_policy user_source_policies;
  v_user_id UUID;
BEGIN
  -- Get project owner
  SELECT user_id INTO v_user_id FROM projects WHERE id = p_project_id;

  -- Try to get existing policy
  SELECT * INTO v_policy
  FROM user_source_policies
  WHERE project_id = p_project_id;

  -- Create default if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO user_source_policies (project_id, user_id)
    VALUES (p_project_id, v_user_id)
    RETURNING * INTO v_policy;
  END IF;

  RETURN v_policy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 6. SEED DATA: Official Source Registry
-- =====================================================
INSERT INTO ai_source_registry (source_name, source_url, source_type, reliability_score, domain, country, reliability_rationale, update_frequency) VALUES
  -- Tier 2: Official APIs (High reliability)
  ('SEC EDGAR Database', 'https://www.sec.gov/edgar', 'official_api', 95, 'sec.gov', 'US', 'US Government official filings, legally required accuracy', 'real-time'),
  ('US Census Bureau', 'https://www.census.gov/data.html', 'official_api', 95, 'census.gov', 'US', 'Official US demographic and economic data', 'quarterly'),
  ('World Bank Open Data', 'https://data.worldbank.org/', 'official_api', 90, 'worldbank.org', 'GLOBAL', 'International development statistics', 'quarterly'),
  ('Bureau of Labor Statistics', 'https://www.bls.gov/data/', 'official_api', 95, 'bls.gov', 'US', 'Official US employment and economic data', 'monthly'),
  ('Federal Reserve Economic Data (FRED)', 'https://fred.stlouisfed.org/', 'official_api', 95, 'stlouisfed.org', 'US', 'Federal Reserve economic time series', 'daily'),

  -- Tier 3: Business Data (Medium-high reliability)
  ('Crunchbase', 'https://www.crunchbase.com/', 'business_data', 75, 'crunchbase.com', 'GLOBAL', 'Crowdsourced startup data, good for funding trends', 'daily'),
  ('PitchBook', 'https://pitchbook.com/', 'business_data', 80, 'pitchbook.com', 'GLOBAL', 'Professional VC/PE data, subscription-verified', 'daily'),
  ('CB Insights', 'https://www.cbinsights.com/', 'business_data', 80, 'cbinsights.com', 'GLOBAL', 'Tech market intelligence, analyst-curated', 'weekly'),

  -- Tier 4: News (Lower reliability, needs multiple confirmation)
  ('TechCrunch', 'https://techcrunch.com/', 'news', 60, 'techcrunch.com', 'US', 'Tech news, good for trends but needs verification', 'real-time'),
  ('Bloomberg', 'https://www.bloomberg.com/', 'news', 75, 'bloomberg.com', 'US', 'Financial news, higher journalistic standards', 'real-time'),
  ('Reuters', 'https://www.reuters.com/', 'news', 75, 'reuters.com', 'GLOBAL', 'International news agency, fact-checked', 'real-time')
ON CONFLICT (source_url) DO NOTHING;


-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE project_documents IS 'Tier 1: User-uploaded documents (PDFs, CSVs, XLSX) with full-text search';
COMMENT ON TABLE ai_source_registry IS 'Registry of external sources with reliability scoring';
COMMENT ON TABLE user_source_policies IS 'Per-project preferences for source selection and evidence requirements';
COMMENT ON TABLE ai_generation_logs IS 'Audit trail of all AI generations with sources and evidence status';
COMMENT ON FUNCTION search_project_documents IS 'Full-text search across user documents with relevance ranking';
COMMENT ON FUNCTION get_project_source_policy IS 'Get or create default source policy for a project';
