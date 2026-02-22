-- =====================================================
-- 3️⃣  NOVA HUB - CONFIGURATION TABLES
-- =====================================================
-- Catalog tables and configuration data (non-sensitive)
-- Generated: 2026-02-21
-- =====================================================

-- =============================================
-- OBJECTIVES (Configurable business goals)
-- =============================================
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  target_value DECIMAL(12,2) NOT NULL,
  unit TEXT DEFAULT 'units',
  period TEXT DEFAULT 'semester', -- 'month', 'semester', 'year'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default objectives seed data
INSERT INTO objectives (name, target_value, unit, period) VALUES
  ('obvs', 150, 'OBVs', 'semester'),
  ('lps', 18, 'LPs', 'semester'),
  ('bps', 66, 'BPs', 'semester'),
  ('cps', 40, 'CPs', 'semester'),
  ('facturacion', 15000, '€', 'semester'),
  ('margen', 7500, '€', 'semester')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- AI SOURCE REGISTRY (External data sources)
-- =============================================
CREATE TABLE ai_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  reliability_score INTEGER DEFAULT 50 CHECK (reliability_score BETWEEN 0 AND 100),
  reliability_rationale TEXT,
  domain TEXT,
  parent_organization TEXT,
  country TEXT,
  language TEXT,
  last_updated TIMESTAMPTZ,
  update_frequency TEXT,
  api_endpoint TEXT,
  requires_api_key BOOLEAN DEFAULT FALSE,
  rate_limit_per_minute INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI source registry seed data
INSERT INTO ai_source_registry (source_name, source_url, source_type, reliability_score, domain, country, reliability_rationale, update_frequency) VALUES
  ('SEC EDGAR Database', 'https://www.sec.gov/edgar', 'official_api', 95, 'sec.gov', 'US', 'US Government official filings, legally required accuracy', 'real-time'),
  ('US Census Bureau', 'https://www.census.gov/data.html', 'official_api', 95, 'census.gov', 'US', 'Official US demographic and economic data', 'quarterly'),
  ('World Bank Open Data', 'https://data.worldbank.org/', 'official_api', 90, 'worldbank.org', 'GLOBAL', 'International development statistics', 'quarterly'),
  ('Bureau of Labor Statistics', 'https://www.bls.gov/data/', 'official_api', 95, 'bls.gov', 'US', 'Official US employment and economic data', 'monthly'),
  ('Federal Reserve Economic Data (FRED)', 'https://fred.stlouisfed.org/', 'official_api', 95, 'stlouisfed.org', 'US', 'Federal Reserve economic time series', 'daily'),
  ('Crunchbase', 'https://www.crunchbase.com/', 'business_data', 75, 'crunchbase.com', 'GLOBAL', 'Crowdsourced startup data, good for funding trends', 'daily'),
  ('PitchBook', 'https://pitchbook.com/', 'business_data', 80, 'pitchbook.com', 'GLOBAL', 'Professional VC/PE data, subscription-verified', 'daily'),
  ('CB Insights', 'https://www.cbinsights.com/', 'business_data', 80, 'cbinsights.com', 'GLOBAL', 'Tech market intelligence, analyst-curated', 'weekly'),
  ('TechCrunch', 'https://techcrunch.com/', 'news', 60, 'techcrunch.com', 'US', 'Tech news, good for trends but needs verification', 'real-time'),
  ('Bloomberg', 'https://www.bloomberg.com/', 'news', 75, 'bloomberg.com', 'US', 'Financial news, higher journalistic standards', 'real-time'),
  ('Reuters', 'https://www.reuters.com/', 'news', 75, 'reuters.com', 'GLOBAL', 'International news agency, fact-checked', 'real-time')
ON CONFLICT (source_url) DO NOTHING;

-- =============================================
-- END OF CONFIGURATION TABLES
-- =============================================
