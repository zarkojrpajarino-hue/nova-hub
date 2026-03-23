-- =============================================================================
-- INFRA.3 -- Seed expansion_events with curated governance/expansion data
--
-- Initial seed of relevant startup/tech events across key expansion markets.
-- Data is illustrative and should be updated quarterly.
-- =============================================================================

INSERT INTO expansion_events (country, city, sector, event_name, event_date, url, cost_eur_approx, why_relevant_template, reference_hubs)
VALUES
  -- Spain
  ('ES', 'Barcelona', ARRAY['saas', 'fintech', 'healthtech'],
   'Mobile World Congress', '2026-02-23',
   'https://www.mwcbarcelona.com', 800,
   'Mayor evento tech en Europa sur. Ideal para validar producto B2B y hacer networking con corporates.',
   '{"hubs": ["Barcelona Tech City", "Pier01"], "accelerators": ["Seedrocket", "Lanzadera"]}'::jsonb),

  ('ES', 'Madrid', ARRAY['saas', 'fintech', 'edtech'],
   'South Summit', '2026-06-04',
   'https://www.southsummit.co', 300,
   'Punto de encuentro entre startups latam y europeas. Muy bueno para fundraising y partnerships.',
   '{"hubs": ["Google for Startups Madrid", "Campus Madrid"], "accelerators": ["Wayra", "Plug and Play"]}'::jsonb),

  -- UK
  ('GB', 'London', ARRAY['saas', 'fintech', 'deeptech'],
   'London Tech Week', '2026-06-09',
   'https://londontechweek.com', 500,
   'Ecosistema fintech mas maduro de Europa. Acceso a VCs tier-1 y corporates financieros.',
   '{"hubs": ["Level39", "Plexal"], "accelerators": ["Techstars London", "Entrepreneur First"]}'::jsonb),

  -- Germany
  ('DE', 'Berlin', ARRAY['saas', 'marketplace', 'climate'],
   'TOA (Tech Open Air)', '2026-07-08',
   'https://toa.berlin', 400,
   'Berlin es el hub startup mas grande de Europa continental. Fuerte en B2B SaaS.',
   '{"hubs": ["Factory Berlin", "betahaus"], "accelerators": ["Techstars Berlin", "APX"]}'::jsonb),

  -- Portugal
  ('PT', 'Lisboa', ARRAY['saas', 'fintech', 'web3'],
   'Web Summit', '2026-11-03',
   'https://websummit.com', 1200,
   'Mayor conferencia tech del mundo. 70k+ asistentes. Excelente para visibilidad y fundraising.',
   '{"hubs": ["Startup Lisboa", "Factory Lisbon"], "accelerators": ["Techstars Lisbon", "Building Global Innovators"]}'::jsonb),

  -- France
  ('FR', 'Paris', ARRAY['saas', 'deeptech', 'greentech'],
   'VivaTech', '2026-06-11',
   'https://vivatechnology.com', 600,
   'Hub de innovacion frances. Fuerte presencia de corporates y programas de open innovation.',
   '{"hubs": ["Station F", "Le Cargo"], "accelerators": ["Y Combinator Paris", "50 Partners"]}'::jsonb),

  -- Netherlands
  ('NL', 'Amsterdam', ARRAY['saas', 'fintech', 'logistics'],
   'TNW Conference', '2026-06-18',
   'https://thenextweb.com/conference', 350,
   'Evento tech de alta calidad. Amsterdam tiene un ecosistema SaaS B2B muy activo.',
   '{"hubs": ["B. Amsterdam", "Rockstart"], "accelerators": ["Startupbootcamp", "Rockstart"]}'::jsonb),

  -- LATAM - Mexico
  ('MX', 'Ciudad de Mexico', ARRAY['saas', 'fintech', 'edtech'],
   'INCmty', '2026-10-15',
   'https://www.incmty.com', 200,
   'Principal evento de emprendimiento en LATAM. Acceso al mercado mexicano (130M+ hab).',
   '{"hubs": ["Distrito Tec", "WeWork CDMX"], "accelerators": ["500 Global Mexico", "Endeavor Mexico"]}'::jsonb),

  -- LATAM - Colombia
  ('CO', 'Bogota', ARRAY['saas', 'fintech', 'agritech'],
   'Colombia Startup & Investor Summit', '2026-09-10',
   'https://colombiastartup.com', 150,
   'Puerta de entrada al mercado andino. Colombia crece rapido en adopcion SaaS.',
   '{"hubs": ["Ruta N Medellin", "Innpulsa"], "accelerators": ["Rockstart Latam", "Endeavor Colombia"]}'::jsonb),

  -- USA
  ('US', 'San Francisco', ARRAY['saas', 'ai', 'deeptech'],
   'TechCrunch Disrupt', '2026-10-20',
   'https://techcrunch.com/events/disrupt', 2000,
   'Referencia global para startups early-stage. Alta visibilidad con VCs de Silicon Valley.',
   '{"hubs": ["Y Combinator", "500 Global"], "accelerators": ["Y Combinator", "Techstars SF"]}'::jsonb),

  -- Chile
  ('CL', 'Santiago', ARRAY['saas', 'fintech', 'mining_tech'],
   'Startup Chile Demo Day', '2026-05-15',
   'https://startupchile.org', 0,
   'Programa de gobierno referente en LATAM. Acceso a funding no dilutivo y red regional.',
   '{"hubs": ["IF Blanco", "Movistar Innova"], "accelerators": ["Startup Chile", "Magical"]}'::jsonb),

  -- UAE
  ('AE', 'Dubai', ARRAY['fintech', 'proptech', 'logistics'],
   'GITEX Global', '2026-10-13',
   'https://gitex.com', 1500,
   'Mayor evento tech de Medio Oriente. Puerta de entrada a mercados del Golfo.',
   '{"hubs": ["Dubai Internet City", "DIFC Innovation Hub"], "accelerators": ["Hub71", "Startupbootcamp Dubai"]}'::jsonb)

ON CONFLICT DO NOTHING;
