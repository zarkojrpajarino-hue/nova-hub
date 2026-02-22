-- =====================================================
-- 1️⃣  NOVA HUB - SCHEMA STRUCTURE (NO DATA)
-- =====================================================
-- Generated: 2026-02-21
-- Description: Complete database structure without sensitive data
-- Includes: ENUMs, Tables, Indexes, Functions, Triggers, Views
-- =====================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================
-- ENUMS (Type Definitions)
-- =====================================================

CREATE TYPE project_phase AS ENUM (
  'idea',
  'problema_validado',
  'solucion_validada',
  'mvp',
  'traccion',
  'crecimiento'
);

CREATE TYPE project_type AS ENUM ('validacion', 'operacion');

CREATE TYPE obv_type AS ENUM ('exploracion', 'validacion', 'venta');

CREATE TYPE lead_status AS ENUM (
  'frio',
  'tibio',
  'hot',
  'propuesta',
  'negociacion',
  'cerrado_ganado',
  'cerrado_perdido'
);

CREATE TYPE task_status AS ENUM ('todo', 'doing', 'done', 'blocked');

CREATE TYPE kpi_status AS ENUM ('pending', 'validated', 'rejected');

CREATE TYPE specialization_role AS ENUM (
  'sales',
  'finance',
  'ai_tech',
  'marketing',
  'operations',
  'strategy'
);

CREATE TYPE app_role AS ENUM ('admin', 'tlt', 'member');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- USER MANAGEMENT
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  avatar TEXT,
  color TEXT DEFAULT '#6366F1',
  especialization specialization_role,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notifications JSONB DEFAULT '{"nuevas_obvs": true, "validaciones": true, "tareas": true, "resumen_semanal": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE member_kpi_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  obvs INTEGER DEFAULT 0,
  obvs_exploracion INTEGER DEFAULT 0,
  obvs_validacion INTEGER DEFAULT 0,
  obvs_venta INTEGER DEFAULT 0,
  lps INTEGER DEFAULT 0,
  bps INTEGER DEFAULT 0,
  cps INTEGER DEFAULT 0,
  facturacion DECIMAL(12,2) DEFAULT 0,
  margen DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- PROJECT MANAGEMENT
-- =====================================================

CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  target_value DECIMAL(12,2) NOT NULL,
  unit TEXT DEFAULT 'units',
  period TEXT DEFAULT 'semester', -- 'month', 'semester', 'year'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,

  -- Core project metadata
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  work_mode TEXT CHECK (work_mode IN ('individual', 'team_small', 'team_established', 'no_roles')),
  business_idea TEXT,
  industry TEXT,
  logo_url TEXT,

  -- Project state
  fase project_phase DEFAULT 'idea',
  tipo project_type DEFAULT 'validacion',
  facturacion DECIMAL(12,2) DEFAULT 0,
  margen DECIMAL(12,2) DEFAULT 0,

  -- Onboarding tracking
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB,

  -- UI customization
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366F1',

  -- Soft delete support
  active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID REFERENCES profiles(id) DEFAULT NULL,
  deletion_reason TEXT DEFAULT NULL,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role specialization_role,
  is_lead BOOLEAN DEFAULT FALSE,

  -- Role acceptance tracking
  role_accepted BOOLEAN DEFAULT FALSE,
  role_accepted_at TIMESTAMPTZ,
  role_responsibilities JSONB DEFAULT '[]'::jsonb,
  performance_score NUMERIC(5,2) DEFAULT 0,
  last_performance_update TIMESTAMPTZ,

  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, member_id)
);

-- OBVs (UNIFIED CRM + SALES)
-- =====================================================

CREATE TABLE obvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Basic info
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  evidence_url TEXT,

  -- Type and validation
  tipo obv_type NOT NULL,
  status kpi_status DEFAULT 'pending',
  validated_at TIMESTAMPTZ,

  -- CRM contact info
  nombre_contacto TEXT,
  empresa TEXT,
  email_contacto TEXT,
  telefono_contacto TEXT,

  -- Pipeline management
  pipeline_status lead_status DEFAULT 'frio',
  valor_potencial DECIMAL(12,2),
  notas TEXT,
  proxima_accion TEXT,
  proxima_accion_fecha DATE,
  responsable_id UUID REFERENCES profiles(id),

  -- Sales data
  es_venta BOOLEAN DEFAULT FALSE,
  producto TEXT,
  cantidad INT,
  precio_unitario DECIMAL(12,2),
  facturacion DECIMAL(12,2),

  -- Costs (detailed breakdown)
  costes DECIMAL(12,2),
  costes_detalle JSONB, -- {materiales, subcontratacion, herramientas, marketing, logistica, comisiones, otros}
  margen DECIMAL(12,2),

  -- Payment tracking
  iva_porcentaje NUMERIC DEFAULT 21,
  iva_importe NUMERIC DEFAULT 0,
  total_factura NUMERIC DEFAULT 0,
  forma_pago TEXT DEFAULT 'transferencia',
  numero_factura TEXT,
  numero_presupuesto TEXT,

  -- Collection tracking
  cobro_estado TEXT DEFAULT 'pendiente',
  cobro_fecha_esperada DATE,
  cobro_fecha_real DATE,
  cobro_metodo TEXT,
  cobro_dias_retraso INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN cobro_estado IN ('pendiente', 'cobrado_parcial') AND cobro_fecha_esperada IS NOT NULL
      THEN GREATEST(0, EXTRACT(DAY FROM (CURRENT_DATE - cobro_fecha_esperada))::INTEGER)
      ELSE 0
    END
  ) STORED,

  cobrado BOOLEAN DEFAULT FALSE,
  cobrado_parcial DECIMAL(12,2),
  estado_cobro TEXT DEFAULT 'pendiente',
  importe_cobrado NUMERIC DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE obv_participantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) NOT NULL,
  porcentaje DECIMAL(5,2),
  UNIQUE(obv_id, member_id)
);

CREATE TABLE obv_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES profiles(id) NOT NULL,
  approved BOOLEAN,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(obv_id, validator_id)
);

CREATE TABLE obv_pipeline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  old_status lead_status,
  new_status lead_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cobros_parciales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  fecha_cobro DATE NOT NULL,
  metodo TEXT,
  notas TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADS (LEGACY - UNIFIED INTO OBVs)
-- =====================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  empresa TEXT,
  email TEXT,
  telefono TEXT,
  status lead_status DEFAULT 'frio',
  valor_potencial DECIMAL(12,2),
  notas TEXT,
  proxima_accion TEXT,
  proxima_accion_fecha DATE,
  responsable_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  old_status lead_status,
  new_status lead_status,
  changed_by UUID REFERENCES profiles(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTHER KPIs (LPs, BPs, CPs)
-- =====================================================

CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lp', 'bp', 'cp')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  evidence_url TEXT,
  cp_points INT DEFAULT 1,
  status kpi_status DEFAULT 'pending',
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kpi_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES profiles(id) NOT NULL,
  approved BOOLEAN,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kpi_id, validator_id)
);

-- TASKS
-- =====================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  status task_status DEFAULT 'todo',
  prioridad INT DEFAULT 2,
  fecha_limite DATE,
  ai_generated BOOLEAN DEFAULT FALSE,

  -- AI playbook features
  playbook JSONB DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  tiempo_estimado_horas NUMERIC DEFAULT NULL,
  tipo_tarea TEXT DEFAULT NULL,
  relacionada_con_leads UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  tipo TEXT,
  titulo TEXT,
  mensaje TEXT,
  leida BOOLEAN DEFAULT FALSE,
  link TEXT,

  -- V2 features
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  snoozed_until TIMESTAMPTZ DEFAULT NULL,
  archived BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOG
-- =====================================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VALIDATION SYSTEM
-- =====================================================

CREATE TABLE validation_order (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  month_year TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year),
  UNIQUE(position, month_year)
);

CREATE TABLE pending_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE,
  validator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('kpi', 'obv')),
  deadline TIMESTAMPTZ NOT NULL,
  validated_at TIMESTAMPTZ,
  is_late BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_one_item CHECK (
    (kpi_id IS NOT NULL AND obv_id IS NULL) OR
    (kpi_id IS NULL AND obv_id IS NOT NULL)
  )
);

CREATE TABLE validator_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_validations INTEGER DEFAULT 0,
  on_time_validations INTEGER DEFAULT 0,
  late_validations INTEGER DEFAULT 0,
  missed_validations INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MI DESARROLLO (PERSONAL DEVELOPMENT)
-- =====================================================

CREATE TABLE user_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  role_context TEXT,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('aprendizaje', 'reflexion', 'error', 'exito', 'idea')),
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  contenido JSONB NOT NULL,
  fortalezas TEXT[] DEFAULT '{}',
  areas_mejora TEXT[] DEFAULT '{}',
  objetivos_sugeridos JSONB DEFAULT '[]'::jsonb,
  ai_model TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  ranking_position INTEGER NOT NULL,
  score NUMERIC(10,2) NOT NULL DEFAULT 0,
  previous_position INTEGER,
  metrics JSONB DEFAULT '{}'::jsonb,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_name, user_id, project_id, period_start, period_end)
);

-- =====================================================
-- MASTER SYSTEM
-- =====================================================

CREATE TABLE master_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'approved', 'rejected', 'expired')),
  motivation TEXT NOT NULL,
  achievements JSONB DEFAULT '[]'::jsonb,
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  votes_required INTEGER DEFAULT 5,
  voting_deadline TIMESTAMPTZ,
  result_announced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE master_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES master_applications(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote BOOLEAN NOT NULL, -- true = a favor, false = en contra
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, voter_id)
);

CREATE TABLE team_masters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  appointed_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,
  UNIQUE(role_name, project_id, user_id)
);

CREATE TABLE master_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id UUID REFERENCES team_masters(id) ON DELETE CASCADE NOT NULL,
  challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  challenge_type TEXT CHECK (challenge_type IN ('performance_contest', 'direct_challenge')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  challenge_description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  metrics JSONB DEFAULT '{}'::jsonb,
  winner_id UUID REFERENCES profiles(id),
  result_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE master_mentoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id UUID REFERENCES team_masters(id) ON DELETE CASCADE NOT NULL,
  mentee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_focus TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  goals JSONB DEFAULT '[]'::jsonb,
  sessions_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- ROLE ROTATION
-- =====================================================

CREATE TABLE role_rotation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  current_role TEXT NOT NULL,
  desired_role TEXT NOT NULL,
  request_type TEXT CHECK (request_type IN ('swap', 'transfer', 'promote')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  motivation TEXT,
  compatibility_score NUMERIC(5,2),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  old_role TEXT,
  new_role TEXT,
  change_type TEXT CHECK (change_type IN ('assignment', 'swap', 'transfer', 'promotion', 'resignation')),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- =====================================================
-- STARTUP OS (Full suite for startups)
-- =====================================================

CREATE TABLE okrs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('objective', 'key_result')),
  parent_id UUID REFERENCES okrs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'at_risk', 'cancelled')),
  owner_id UUID REFERENCES profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  competitor_name TEXT NOT NULL,
  website TEXT,
  pricing JSONB,
  features JSONB DEFAULT '[]'::jsonb,
  strengths TEXT[],
  weaknesses TEXT[],
  market_position TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE market_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  intel_type TEXT CHECK (intel_type IN ('trend', 'competitor_move', 'customer_feedback', 'market_shift')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  actionable BOOLEAN DEFAULT FALSE,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL,
  themes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, month_year)
);

CREATE TABLE content_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id UUID REFERENCES content_calendars(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT CHECK (content_type IN ('blog', 'social', 'email', 'video', 'infographic')),
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT,
  scheduled_date DATE,
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'outlined', 'drafted', 'reviewed', 'published')),
  ai_generated BOOLEAN DEFAULT FALSE,
  draft_content TEXT,
  published_url TEXT,
  performance_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE launch_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  checklist_type TEXT DEFAULT 'mvp_launch',
  items JSONB NOT NULL,
  progress INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE beta_testers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  nombre TEXT,
  empresa TEXT,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  feedback_count INTEGER DEFAULT 0,
  last_feedback_at TIMESTAMPTZ,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'churned'))
);

CREATE TABLE financial_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL,
  revenue_projected NUMERIC DEFAULT 0,
  revenue_actual NUMERIC DEFAULT 0,
  expenses_projected NUMERIC DEFAULT 0,
  expenses_actual NUMERIC DEFAULT 0,
  mrr_projected NUMERIC DEFAULT 0,
  mrr_actual NUMERIC DEFAULT 0,
  churn_rate NUMERIC DEFAULT 0,
  cac NUMERIC DEFAULT 0,
  ltv NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, month_year)
);

CREATE TABLE key_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  current_value NUMERIC,
  target_value NUMERIC,
  unit TEXT,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE metric_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  alert_type TEXT CHECK (alert_type IN ('target_missed', 'negative_trend', 'anomaly')),
  message TEXT,
  severity TEXT CHECK (severity IN ('critical', 'warning', 'info')),
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  recommendation_type TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  implemented BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  summary TEXT NOT NULL,
  highlights JSONB DEFAULT '[]'::jsonb,
  concerns JSONB DEFAULT '[]'::jsonb,
  next_steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE advisor_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')),
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ULTRA PERSONALIZED ONBOARDING
-- =====================================================

CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  onboarding_type TEXT CHECK (onboarding_type IN ('generative', 'idea', 'existing')),
  stage TEXT DEFAULT 'fast_start',
  progress JSONB DEFAULT '{}'::jsonb,
  responses JSONB DEFAULT '{}'::jsonb,
  generated_data JSONB DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE geo_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_query TEXT NOT NULL UNIQUE,
  geo_data JSONB NOT NULL,
  market_insights JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE competitive_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  competitor_name TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  path_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cofounder_alignment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  alignment_data JSONB NOT NULL,
  score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_business_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE NOT NULL,
  option_data JSONB NOT NULL,
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE validation_roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  roadmap_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE growth_playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  playbook_type TEXT,
  playbook_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE voice_onboarding_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  extracted_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AI EVIDENCE SYSTEM
-- =====================================================

CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  text_vector TSVECTOR,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_documents_vector ON project_documents USING GIN(text_vector);

CREATE TABLE ai_source_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name TEXT NOT NULL UNIQUE,
  source_type TEXT CHECK (source_type IN ('api', 'web_scrape', 'user_upload', 'manual_input', 'database')),
  reliability_score NUMERIC(3,2) DEFAULT 0.5 CHECK (reliability_score BETWEEN 0 AND 1),
  last_verified TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_source_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  source_id UUID REFERENCES ai_source_registry(id) ON DELETE CASCADE NOT NULL,
  consent_given BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, source_id)
);

CREATE TABLE ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  generation_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  sources_used JSONB DEFAULT '[]'::jsonb,
  model_used TEXT,
  evidence_quality NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidence_generation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  generation_type TEXT NOT NULL,
  retrieval_time_ms INTEGER,
  generation_time_ms INTEGER,
  sources_found INTEGER DEFAULT 0,
  sources_cited INTEGER DEFAULT 0,
  evidence_status TEXT CHECK (evidence_status IN ('complete', 'partial', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidence_user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INTEGRATIONS
-- =====================================================

CREATE TABLE slack_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES (Performance Optimization)
-- =====================================================

-- User indexes
CREATE INDEX idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Project indexes
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_active ON projects(active) WHERE active = true;
CREATE INDEX idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_member ON project_members(member_id);

-- OBV indexes
CREATE INDEX idx_obvs_owner ON obvs(owner_id);
CREATE INDEX idx_obvs_project ON obvs(project_id);
CREATE INDEX idx_obvs_status ON obvs(status);
CREATE INDEX idx_obvs_pipeline ON obvs(pipeline_status);
CREATE INDEX idx_obvs_fecha ON obvs(fecha);
CREATE INDEX idx_obvs_cobro_estado ON obvs(cobro_estado);
CREATE INDEX idx_obvs_es_venta ON obvs(es_venta) WHERE es_venta = true;

-- Lead indexes
CREATE INDEX idx_leads_project ON leads(project_id);
CREATE INDEX idx_leads_responsable ON leads(responsable_id);
CREATE INDEX idx_leads_status ON leads(status);

-- KPI indexes
CREATE INDEX idx_kpis_owner ON kpis(owner_id);
CREATE INDEX idx_kpis_type ON kpis(type);
CREATE INDEX idx_kpis_status ON kpis(status);

-- Task indexes
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_fecha_limite ON tasks(fecha_limite);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_leida ON notifications(leida) WHERE leida = false;

-- Validation indexes
CREATE INDEX idx_pending_validations_validator ON pending_validations(validator_id);
CREATE INDEX idx_pending_validations_deadline ON pending_validations(deadline);

-- Startup OS indexes
CREATE INDEX idx_okrs_project ON okrs(project_id);
CREATE INDEX idx_competitor_snapshots_project ON competitor_snapshots(project_id);
CREATE INDEX idx_content_pieces_calendar ON content_pieces(calendar_id);
CREATE INDEX idx_financial_projections_project ON financial_projections(project_id);

-- Onboarding indexes
CREATE INDEX idx_onboarding_sessions_project ON onboarding_sessions(project_id);
CREATE INDEX idx_onboarding_sessions_user ON onboarding_sessions(user_id);

-- AI Evidence indexes
CREATE INDEX idx_project_documents_project ON project_documents(project_id);
CREATE INDEX idx_ai_generation_logs_project ON ai_generation_logs(project_id);
CREATE INDEX idx_ai_generation_logs_user ON ai_generation_logs(user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Security helper: Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get profile id from auth id
CREATE OR REPLACE FUNCTION public.get_profile_id(_auth_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE auth_id = _auth_id LIMIT 1
$$;

-- Auto-validate OBV when 2 approvals
CREATE OR REPLACE FUNCTION public.check_obv_validations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.obv_validaciones
    WHERE obv_id = NEW.obv_id AND approved = TRUE
  ) >= 2 THEN
    UPDATE public.obvs SET status = 'validated', validated_at = NOW()
    WHERE id = NEW.obv_id;
  ELSIF (
    SELECT COUNT(*) FROM public.obv_validaciones
    WHERE obv_id = NEW.obv_id AND approved = FALSE
  ) >= 2 THEN
    UPDATE public.obvs SET status = 'rejected' WHERE id = NEW.obv_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-validate KPI when 2 approvals
CREATE OR REPLACE FUNCTION public.check_kpi_validations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.kpi_validaciones
    WHERE kpi_id = NEW.kpi_id AND approved = TRUE
  ) >= 2 THEN
    UPDATE public.kpis SET status = 'validated', validated_at = NOW()
    WHERE id = NEW.kpi_id;
  ELSIF (
    SELECT COUNT(*) FROM public.kpi_validaciones
    WHERE kpi_id = NEW.kpi_id AND approved = FALSE
  ) >= 2 THEN
    UPDATE public.kpis SET status = 'rejected' WHERE id = NEW.kpi_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-calculate costs and margin for OBVs
CREATE OR REPLACE FUNCTION auto_calcular_costes_y_margen()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_costes NUMERIC := 0;
BEGIN
  IF NEW.costes_detalle IS NOT NULL THEN
    total_costes := COALESCE((NEW.costes_detalle->>'materiales')::NUMERIC, 0) +
                    COALESCE((NEW.costes_detalle->>'subcontratacion')::NUMERIC, 0) +
                    COALESCE((NEW.costes_detalle->>'herramientas')::NUMERIC, 0) +
                    COALESCE((NEW.costes_detalle->>'marketing')::NUMERIC, 0) +
                    COALESCE((NEW.costes_detalle->>'logistica')::NUMERIC, 0) +
                    COALESCE((NEW.costes_detalle->>'comisiones')::NUMERIC, 0) +
                    COALESCE((NEW.costes_detalle->>'otros')::NUMERIC, 0);
    NEW.costes := total_costes;
  END IF;

  IF NEW.facturacion IS NOT NULL AND NEW.costes IS NOT NULL THEN
    NEW.margen := NEW.facturacion - NEW.costes;
  END IF;

  RETURN NEW;
END;
$$;

-- Update payment status based on partial payments
CREATE OR REPLACE FUNCTION actualizar_estado_cobro()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_cobrado NUMERIC;
  factura_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(monto), 0)
  INTO total_cobrado
  FROM cobros_parciales
  WHERE obv_id = NEW.obv_id;

  SELECT total_factura
  INTO factura_total
  FROM obvs
  WHERE id = NEW.obv_id;

  UPDATE obvs
  SET importe_cobrado = total_cobrado,
      cobro_estado = CASE
        WHEN total_cobrado = 0 THEN 'pendiente'
        WHEN total_cobrado >= factura_total THEN 'cobrado'
        ELSE 'cobrado_parcial'
      END,
      cobrado = (total_cobrado >= factura_total),
      cobro_fecha_real = CASE
        WHEN total_cobrado >= factura_total THEN NEW.fecha_cobro
        ELSE NULL
      END
  WHERE id = NEW.obv_id;

  RETURN NEW;
END;
$$;

-- Track pipeline status changes
CREATE OR REPLACE FUNCTION track_pipeline_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status THEN
    INSERT INTO obv_pipeline_history (obv_id, old_status, new_status, changed_by, notas)
    VALUES (NEW.id, OLD.pipeline_status, NEW.pipeline_status, NEW.responsable_id, NEW.notas);
  END IF;
  RETURN NEW;
END;
$$;

-- Calculate role performance score
CREATE OR REPLACE FUNCTION calculate_role_performance_score(
  _project_id UUID,
  _member_id UUID,
  _role_name TEXT
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  score NUMERIC := 0;
  obvs_count INT;
  kpis_count INT;
  tasks_completed INT;
BEGIN
  SELECT COUNT(*) INTO obvs_count
  FROM obvs
  WHERE owner_id = _member_id
    AND project_id = _project_id
    AND status = 'validated';

  SELECT COUNT(*) INTO kpis_count
  FROM kpis
  WHERE owner_id = _member_id
    AND status = 'validated';

  SELECT COUNT(*) INTO tasks_completed
  FROM tasks
  WHERE assignee_id = _member_id
    AND project_id = _project_id
    AND status = 'done';

  score := (obvs_count * 10) + (kpis_count * 5) + (tasks_completed * 2);

  RETURN score;
END;
$$;

-- Soft delete project
CREATE OR REPLACE FUNCTION soft_delete_project(_project_id UUID, _deleted_by UUID, _reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE projects
  SET deleted_at = NOW(),
      deleted_by = _deleted_by,
      deletion_reason = _reason,
      active = false
  WHERE id = _project_id;
END;
$$;

-- Restore deleted project
CREATE OR REPLACE FUNCTION restore_project(_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE projects
  SET deleted_at = NULL,
      deleted_by = NULL,
      deletion_reason = NULL,
      active = true
  WHERE id = _project_id;
END;
$$;

-- Search project documents (full-text search)
CREATE OR REPLACE FUNCTION search_project_documents(
  _project_id UUID,
  _search_query TEXT
) RETURNS TABLE(
  doc_id UUID,
  file_name TEXT,
  relevance REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    file_name,
    ts_rank(text_vector, plainto_tsquery('english', _search_query)) AS relevance
  FROM project_documents
  WHERE project_id = _project_id
    AND text_vector @@ plainto_tsquery('english', _search_query)
  ORDER BY relevance DESC;
END;
$$;

-- Create notification helper
CREATE OR REPLACE FUNCTION create_notification(
  _user_id UUID,
  _tipo TEXT,
  _titulo TEXT,
  _mensaje TEXT,
  _link TEXT DEFAULT NULL,
  _priority TEXT DEFAULT 'medium'
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, tipo, titulo, mensaje, link, priority)
  VALUES (_user_id, _tipo, _titulo, _mensaje, _link, _priority)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1))
  );

  -- Assign default 'member' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    (SELECT id FROM public.profiles WHERE auth_id = NEW.id),
    'member'
  );

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- User signup trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- OBV validation trigger
CREATE TRIGGER trigger_check_obv_validations
AFTER INSERT ON obv_validaciones
FOR EACH ROW EXECUTE FUNCTION check_obv_validations();

-- KPI validation trigger
CREATE TRIGGER trigger_check_kpi_validations
AFTER INSERT ON kpi_validaciones
FOR EACH ROW EXECUTE FUNCTION check_kpi_validations();

-- Auto-calculate OBV costs and margins
CREATE TRIGGER trigger_calcular_costes_margen
BEFORE INSERT OR UPDATE ON obvs
FOR EACH ROW
WHEN (NEW.es_venta = true)
EXECUTE FUNCTION auto_calcular_costes_y_margen();

-- Track partial payments
CREATE TRIGGER trigger_actualizar_estado_cobro
AFTER INSERT OR UPDATE ON cobros_parciales
FOR EACH ROW EXECUTE FUNCTION actualizar_estado_cobro();

-- Track pipeline changes
CREATE TRIGGER trigger_track_pipeline_changes
AFTER UPDATE ON obvs
FOR EACH ROW EXECUTE FUNCTION track_pipeline_changes();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_projects_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_obvs_timestamp
BEFORE UPDATE ON obvs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_leads_timestamp
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS
-- =====================================================

-- Member stats with calculated KPIs
CREATE OR REPLACE VIEW member_stats
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.nombre,
  p.color,
  p.avatar,
  p.email,
  COALESCE((SELECT COUNT(*) FROM obvs WHERE owner_id = p.id AND status = 'validated'), 0) as obvs,
  COALESCE((SELECT COUNT(*) FROM kpis WHERE owner_id = p.id AND type = 'lp' AND status = 'validated'), 0) as lps,
  COALESCE((SELECT COUNT(*) FROM kpis WHERE owner_id = p.id AND type = 'bp' AND status = 'validated'), 0) as bps,
  COALESCE((SELECT SUM(cp_points) FROM kpis WHERE owner_id = p.id AND type = 'cp' AND status = 'validated'), 0) as cps,
  COALESCE((SELECT SUM(facturacion) FROM obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as facturacion,
  COALESCE((SELECT SUM(margen) FROM obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as margen
FROM profiles p;

-- Project stats
CREATE OR REPLACE VIEW project_stats
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.nombre,
  p.fase,
  p.tipo,
  p.icon,
  p.color,
  p.onboarding_completed,
  COUNT(DISTINCT pm.member_id) as num_members,
  COUNT(DISTINCT o.id) as total_obvs,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'cerrado_ganado') as leads_ganados,
  COALESCE(SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0) as facturacion,
  COALESCE(SUM(o.margen) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0) as margen
FROM projects p
LEFT JOIN project_members pm ON pm.project_id = p.id
LEFT JOIN obvs o ON o.project_id = p.id
LEFT JOIN leads l ON l.project_id = p.id
WHERE p.active = true
GROUP BY p.id;

-- Active projects (soft delete support)
CREATE OR REPLACE VIEW active_projects
WITH (security_invoker = true) AS
SELECT * FROM projects WHERE deleted_at IS NULL;

-- Deleted projects
CREATE OR REPLACE VIEW deleted_projects
WITH (security_invoker = true) AS
SELECT * FROM projects WHERE deleted_at IS NOT NULL;

-- Pipeline global
CREATE OR REPLACE VIEW pipeline_global
WITH (security_invoker = true) AS
SELECT
  l.*,
  p.nombre as proyecto_nombre,
  p.color as proyecto_color,
  pr.nombre as responsable_nombre
FROM leads l
JOIN projects p ON l.project_id = p.id
LEFT JOIN profiles pr ON l.responsable_id = pr.id;

-- User role performance
CREATE OR REPLACE VIEW user_role_performance
WITH (security_invoker = true) AS
SELECT
  pm.member_id,
  pm.project_id,
  pm.role,
  pm.performance_score,
  pm.last_performance_update,
  p.nombre as project_name,
  pr.nombre as member_name
FROM project_members pm
JOIN projects p ON pm.project_id = p.id
JOIN profiles pr ON pm.member_id = pr.id;

-- Pending payments
CREATE OR REPLACE VIEW pending_payments
WITH (security_invoker = true) AS
SELECT
  o.id,
  o.titulo,
  o.empresa,
  o.total_factura,
  o.importe_cobrado,
  o.total_factura - o.importe_cobrado as pendiente,
  o.cobro_fecha_esperada,
  o.cobro_dias_retraso,
  p.nombre as proyecto_nombre
FROM obvs o
JOIN projects p ON o.project_id = p.id
WHERE o.cobro_estado IN ('pendiente', 'cobrado_parcial')
  AND o.es_venta = true;

-- Financial metrics by month
CREATE OR REPLACE VIEW financial_metrics
WITH (security_invoker = true) AS
SELECT
  DATE_TRUNC('month', o.fecha) as mes,
  SUM(o.facturacion) FILTER (WHERE o.status = 'validated') as facturacion_total,
  SUM(o.costes) FILTER (WHERE o.status = 'validated') as costes_totales,
  SUM(o.margen) FILTER (WHERE o.status = 'validated') as margen_total,
  COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated') as ventas_cerradas
FROM obvs o
GROUP BY DATE_TRUNC('month', o.fecha)
ORDER BY mes DESC;

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Meeting recordings bucket (private, 100MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('meeting-recordings', 'meeting-recordings', false, 104857600);

-- =====================================================
-- END OF SCHEMA STRUCTURE
-- =====================================================
