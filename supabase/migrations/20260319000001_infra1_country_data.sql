-- INFRA.1 — Tabla country_data
-- Prerrequisito: F21.4 (Buyer Persona v2) + F22.4 (analyze-expansion-v1)
-- RLS: lectura pública (no datos privados — datos demográficos de acceso libre)
-- Actualización: anual (enero). Script de actualización en /scripts/refresh_country_data.sql

CREATE TABLE IF NOT EXISTS country_data (
  country_code          CHAR(2)        PRIMARY KEY,
  country_name          TEXT           NOT NULL,
  continent             TEXT           NOT NULL,

  -- Economía
  gdp_per_capita_usd    INTEGER        NOT NULL,

  -- Digital
  internet_penetration  NUMERIC(4,3)   NOT NULL CHECK (internet_penetration BETWEEN 0 AND 1),
  ecommerce_penetration NUMERIC(4,3)   NOT NULL CHECK (ecommerce_penetration BETWEEN 0 AND 1),

  -- Ecosistema startup
  startup_density_rank  SMALLINT       NOT NULL CHECK (startup_density_rank BETWEEN 1 AND 50),
  -- 1 = mejor ecosistema de startups (ej. USA, Israel), 50 = menos denso

  -- Demografía
  median_age            NUMERIC(4,1)   NOT NULL,

  -- Idiomas y cultura
  languages             TEXT[]         NOT NULL DEFAULT '{}',
  business_culture      JSONB          NOT NULL DEFAULT '{}'::jsonb,
  -- Ejemplo: {"formality": "high", "punctuality": "critical", "negotiation_style": "direct"}

  -- Índices normalizados para F22 scoring
  regulatory_ease_score NUMERIC(3,1)   NOT NULL CHECK (regulatory_ease_score BETWEEN 1.0 AND 5.0),
  -- 1.0 = muy difícil hacer negocios, 5.0 = muy fácil (escala World Bank)

  cost_of_living_index  NUMERIC(5,1)   NOT NULL,
  -- Base 100 = Madrid. >100 = más caro, <100 = más barato

  -- Metadatos
  last_updated          DATE           NOT NULL DEFAULT '2026-01-01',

  created_at            TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Índices para queries de expansion scoring
CREATE INDEX idx_country_data_continent ON country_data (continent);
CREATE INDEX idx_country_data_startup_rank ON country_data (startup_density_rank);

-- RLS
ALTER TABLE country_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "country_data_public_read" ON country_data
  FOR SELECT USING (true);
-- Solo service_role puede escribir (migrations/scripts)

-- ──────────────────────────────────────────────────────────────────────────────
-- SEED — 30 países
-- Fuentes: World Bank, Numbeo, Startup Genome, Internet World Stats (2025 est.)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT INTO country_data (
  country_code, country_name, continent,
  gdp_per_capita_usd, internet_penetration, ecommerce_penetration,
  startup_density_rank, median_age, languages, business_culture,
  regulatory_ease_score, cost_of_living_index, last_updated
) VALUES

-- ── Europa Occidental ─────────────────────────────────────────────────────────
('ES', 'España',          'Europe', 30000, 0.94, 0.72, 22, 43.9,
  ARRAY['es'], '{"formality":"medium","punctuality":"relaxed","negotiation_style":"relationship"}'::jsonb,
  3.8, 100.0, '2026-01-01'),

('DE', 'Alemania',        'Europe', 51000, 0.93, 0.82, 6,  44.1,
  ARRAY['de'], '{"formality":"high","punctuality":"critical","negotiation_style":"direct"}'::jsonb,
  4.2, 118.0, '2026-01-01'),

('FR', 'Francia',         'Europe', 43000, 0.92, 0.78, 8,  41.7,
  ARRAY['fr'], '{"formality":"high","punctuality":"moderate","negotiation_style":"analytical"}'::jsonb,
  3.9, 115.0, '2026-01-01'),

('GB', 'Reino Unido',     'Europe', 46000, 0.97, 0.87, 3,  40.6,
  ARRAY['en'], '{"formality":"medium","punctuality":"moderate","negotiation_style":"pragmatic"}'::jsonb,
  4.4, 125.0, '2026-01-01'),

('PT', 'Portugal',        'Europe', 24000, 0.81, 0.65, 25, 44.4,
  ARRAY['pt'], '{"formality":"medium","punctuality":"relaxed","negotiation_style":"relationship"}'::jsonb,
  3.7, 82.0, '2026-01-01'),

('IT', 'Italia',          'Europe', 35000, 0.84, 0.68, 18, 46.0,
  ARRAY['it'], '{"formality":"high","punctuality":"relaxed","negotiation_style":"relationship"}'::jsonb,
  3.5, 108.0, '2026-01-01'),

('NL', 'Países Bajos',    'Europe', 56000, 0.96, 0.89, 7,  42.8,
  ARRAY['nl','en'], '{"formality":"low","punctuality":"critical","negotiation_style":"direct"}'::jsonb,
  4.5, 122.0, '2026-01-01'),

('PL', 'Polonia',         'Europe', 18000, 0.90, 0.71, 20, 40.7,
  ARRAY['pl'], '{"formality":"medium","punctuality":"moderate","negotiation_style":"analytical"}'::jsonb,
  3.6, 65.0, '2026-01-01'),

('SE', 'Suecia',          'Europe', 55000, 0.97, 0.84, 5,  41.0,
  ARRAY['sv','en'], '{"formality":"low","punctuality":"critical","negotiation_style":"consensus"}'::jsonb,
  4.6, 128.0, '2026-01-01'),

('NO', 'Noruega',         'Europe', 82000, 0.98, 0.82, 9,  39.7,
  ARRAY['no','en'], '{"formality":"low","punctuality":"critical","negotiation_style":"direct"}'::jsonb,
  4.5, 148.0, '2026-01-01'),

('DK', 'Dinamarca',       'Europe', 62000, 0.98, 0.86, 10, 42.2,
  ARRAY['da','en'], '{"formality":"low","punctuality":"critical","negotiation_style":"direct"}'::jsonb,
  4.6, 138.0, '2026-01-01'),

('CH', 'Suiza',           'Europe', 87000, 0.96, 0.88, 11, 43.2,
  ARRAY['de','fr','it','en'], '{"formality":"high","punctuality":"critical","negotiation_style":"analytical"}'::jsonb,
  4.7, 162.0, '2026-01-01'),

('BE', 'Bélgica',         'Europe', 47000, 0.93, 0.80, 14, 41.7,
  ARRAY['nl','fr','de','en'], '{"formality":"medium","punctuality":"moderate","negotiation_style":"consensus"}'::jsonb,
  4.0, 120.0, '2026-01-01'),

('AT', 'Austria',         'Europe', 51000, 0.91, 0.78, 16, 44.0,
  ARRAY['de'], '{"formality":"high","punctuality":"critical","negotiation_style":"analytical"}'::jsonb,
  4.1, 119.0, '2026-01-01'),

('IE', 'Irlanda',         'Europe', 79000, 0.96, 0.85, 13, 38.6,
  ARRAY['en','ga'], '{"formality":"low","punctuality":"moderate","negotiation_style":"pragmatic"}'::jsonb,
  4.5, 132.0, '2026-01-01'),

('FI', 'Finlandia',       'Europe', 51000, 0.97, 0.83, 12, 42.8,
  ARRAY['fi','sv','en'], '{"formality":"low","punctuality":"critical","negotiation_style":"direct"}'::jsonb,
  4.4, 126.0, '2026-01-01'),

-- ── Norteamérica ──────────────────────────────────────────────────────────────
('US', 'Estados Unidos',  'North America', 63000, 0.93, 0.86, 1,  38.5,
  ARRAY['en'], '{"formality":"low","punctuality":"moderate","negotiation_style":"direct"}'::jsonb,
  4.3, 158.0, '2026-01-01'),

('CA', 'Canadá',          'North America', 52000, 0.94, 0.83, 4,  41.6,
  ARRAY['en','fr'], '{"formality":"medium","punctuality":"moderate","negotiation_style":"pragmatic"}'::jsonb,
  4.2, 142.0, '2026-01-01'),

-- ── Latinoamérica ─────────────────────────────────────────────────────────────
('MX', 'México',          'Latin America', 10000, 0.76, 0.55, 30, 29.4,
  ARRAY['es'], '{"formality":"high","punctuality":"relaxed","negotiation_style":"relationship"}'::jsonb,
  3.3, 55.0, '2026-01-01'),

('AR', 'Argentina',       'Latin America', 11000, 0.79, 0.60, 28, 32.7,
  ARRAY['es'], '{"formality":"medium","punctuality":"relaxed","negotiation_style":"expressive"}'::jsonb,
  2.8, 40.0, '2026-01-01'),

('CO', 'Colombia',        'Latin America', 6500,  0.71, 0.50, 35, 31.0,
  ARRAY['es'], '{"formality":"medium","punctuality":"relaxed","negotiation_style":"relationship"}'::jsonb,
  3.0, 43.0, '2026-01-01'),

('CL', 'Chile',           'Latin America', 15000, 0.87, 0.66, 27, 34.8,
  ARRAY['es'], '{"formality":"medium","punctuality":"moderate","negotiation_style":"analytical"}'::jsonb,
  3.5, 68.0, '2026-01-01'),

('BR', 'Brasil',          'Latin America', 9000,  0.81, 0.62, 24, 33.5,
  ARRAY['pt'], '{"formality":"medium","punctuality":"relaxed","negotiation_style":"relationship"}'::jsonb,
  2.9, 60.0, '2026-01-01'),

-- ── Asia-Pacífico ─────────────────────────────────────────────────────────────
('SG', 'Singapur',        'Asia', 65000, 0.98, 0.90, 2,  42.2,
  ARRAY['en','zh','ms','ta'], '{"formality":"high","punctuality":"critical","negotiation_style":"analytical"}'::jsonb,
  4.9, 172.0, '2026-01-01'),

('IN', 'India',           'Asia', 2400,  0.56, 0.42, 15, 28.7,
  ARRAY['hi','en'], '{"formality":"high","punctuality":"flexible","negotiation_style":"relationship"}'::jsonb,
  3.1, 35.0, '2026-01-01'),

('AU', 'Australia',       'Asia Pacific', 54000, 0.92, 0.81, 17, 37.5,
  ARRAY['en'], '{"formality":"low","punctuality":"moderate","negotiation_style":"direct"}'::jsonb,
  4.0, 152.0, '2026-01-01'),

('JP', 'Japón',           'Asia', 40000, 0.95, 0.83, 19, 48.7,
  ARRAY['ja'], '{"formality":"very_high","punctuality":"critical","negotiation_style":"consensus"}'::jsonb,
  3.8, 130.0, '2026-01-01'),

('KR', 'Corea del Sur',   'Asia', 34000, 0.97, 0.87, 23, 43.7,
  ARRAY['ko'], '{"formality":"high","punctuality":"critical","negotiation_style":"hierarchical"}'::jsonb,
  4.0, 118.0, '2026-01-01'),

-- ── Oriente Medio / Israel ────────────────────────────────────────────────────
('AE', 'Emiratos Árabes', 'Middle East', 43000, 0.99, 0.78, 21, 33.5,
  ARRAY['ar','en'], '{"formality":"high","punctuality":"moderate","negotiation_style":"relationship"}'::jsonb,
  4.1, 145.0, '2026-01-01'),

('IL', 'Israel',          'Middle East', 44000, 0.89, 0.76, 26, 30.7,
  ARRAY['he','en'], '{"formality":"low","punctuality":"flexible","negotiation_style":"direct"}'::jsonb,
  4.2, 148.0, '2026-01-01')

ON CONFLICT (country_code) DO NOTHING;

COMMENT ON TABLE country_data IS
  'Datos demográficos y ecosistema por país. Usado en F21 Buyer Persona + F22 Expansion Intelligence scoring. Actualización anual.';
