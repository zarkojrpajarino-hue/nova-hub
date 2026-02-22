-- =============================================
-- NOVA HUB - COMPLETE DATABASE SCHEMA
-- Generated: 2026-02-21
-- Production-Ready Architecture
-- =============================================
-- This file contains the consolidated schema from all migrations
-- Organized by: ENUMs, Tables, Indexes, Functions, Triggers, Views, RLS Policies
-- =============================================

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =============================================
-- SECTION 1: ENUMS (Type Definitions)
-- =============================================

-- Project management enums
CREATE TYPE project_phase AS ENUM (
  'idea',
  'problema_validado',
  'solucion_validada',
  'mvp',
  'traccion',
  'crecimiento'
);

CREATE TYPE project_type AS ENUM ('validacion', 'operacion');

-- OBV (Customer interaction) enums
CREATE TYPE obv_type AS ENUM ('exploracion', 'validacion', 'venta');

-- Lead/CRM enums
CREATE TYPE lead_status AS ENUM (
  'frio',
  'tibio',
  'hot',
  'propuesta',
  'negociacion',
  'cerrado_ganado',
  'cerrado_perdido'
);

-- Task management enums
CREATE TYPE task_status AS ENUM ('todo', 'doing', 'done', 'blocked');

-- KPI validation enums
CREATE TYPE kpi_status AS ENUM ('pending', 'validated', 'rejected');

-- Role specializations
CREATE TYPE specialization_role AS ENUM (
  'sales',
  'finance',
  'ai_tech',
  'marketing',
  'operations',
  'strategy'
);

-- Application roles
CREATE TYPE app_role AS ENUM ('admin', 'tlt', 'member');

-- =============================================
-- SECTION 2: CORE TABLES
-- =============================================

-- ---------------------------------------------
-- USER MANAGEMENT
-- ---------------------------------------------

-- Profiles (linked to auth.users)
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

-- User roles (separate table for security)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- User settings (notification preferences)
CREATE TABLE user_settings (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  notifications JSONB DEFAULT '{"nuevas_obvs": true, "validaciones": true, "tareas": true, "resumen_semanal": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member KPI base (editable baseline KPIs from external tracker)
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

-- ---------------------------------------------
-- PROJECT MANAGEMENT
-- ---------------------------------------------

-- Configurable objectives
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  target_value DECIMAL(12,2) NOT NULL,
  unit TEXT DEFAULT 'units',
  period TEXT DEFAULT 'semester', -- 'month', 'semester', 'year'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fase project_phase DEFAULT 'idea',
  tipo project_type DEFAULT 'validacion',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366F1',
  created_by UUID REFERENCES profiles(id),

  -- Soft delete
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID REFERENCES profiles(id) DEFAULT NULL,
  deletion_reason TEXT DEFAULT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project members with roles
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role specialization_role, -- Can be NULL until assigned by AI
  is_lead BOOLEAN DEFAULT FALSE,

  -- MI DESARROLLO features
  role_accepted BOOLEAN DEFAULT FALSE,
  role_accepted_at TIMESTAMPTZ,
  role_responsibilities JSONB DEFAULT '[]'::jsonb,
  performance_score NUMERIC(5,2) DEFAULT 0,
  last_performance_update TIMESTAMPTZ,

  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, member_id)
);

-- ---------------------------------------------
-- OBVs (Customer Interactions / Sales)
-- ---------------------------------------------

-- OBVs (unified with leads)
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

  -- Contact info (CRM integration)
  nombre_contacto TEXT,
  empresa TEXT,
  email_contacto TEXT,
  telefono_contacto TEXT,

  -- Pipeline status
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

-- OBV participants (for shared OBVs)
CREATE TABLE obv_participantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) NOT NULL,
  porcentaje DECIMAL(5,2),
  UNIQUE(obv_id, member_id)
);

-- OBV validations
CREATE TABLE obv_validaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES profiles(id) NOT NULL,
  approved BOOLEAN,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(obv_id, validator_id)
);

-- OBV pipeline history
CREATE TABLE obv_pipeline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  old_status lead_status,
  new_status lead_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial payments (for payment plans)
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

-- ---------------------------------------------
-- OTHER KPIs (LPs, BPs, CPs)
-- ---------------------------------------------

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

-- ---------------------------------------------
-- TASKS
-- ---------------------------------------------

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

-- ---------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------

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

-- ---------------------------------------------
-- ACTIVITY LOG
-- ---------------------------------------------

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------
-- VALIDATION SYSTEM
-- ---------------------------------------------

-- Validation order (monthly rotation)
CREATE TABLE validation_order (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  month_year TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year),
  UNIQUE(position, month_year)
);

-- Pending validations tracking
CREATE TABLE pending_validations (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Validator statistics
CREATE TABLE validator_stats (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_validations INTEGER DEFAULT 0,
  on_time_validations INTEGER DEFAULT 0,
  late_validations INTEGER DEFAULT 0,
  missed_validations INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECTION 3: MI DESARROLLO (MY DEVELOPMENT)
-- =============================================

-- User insights (personal learning diary)
CREATE TABLE user_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- User playbooks (AI-generated role playbooks)
CREATE TABLE user_playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Role rankings cache
CREATE TABLE role_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- =============================================
-- SECTION 4: MASTER SYSTEM
-- =============================================

-- Master applications
CREATE TABLE master_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'approved', 'rejected', 'expired')),
  motivation TEXT NOT NULL,
  achievements JSONB DEFAULT '[]'::jsonb,
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  votes_required INTEGER DEFAULT 5,
  voting_deadline TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master votes
CREATE TABLE master_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES master_applications(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote BOOLEAN NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, voter_id)
);

-- Team masters
CREATE TABLE team_masters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  title TEXT,
  appointed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  total_mentees INTEGER DEFAULT 0,
  successful_defenses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_name)
);

-- Master challenges
CREATE TABLE master_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  master_id UUID NOT NULL REFERENCES team_masters(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'declined', 'expired')),
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('performance', 'project', 'peer_vote')),
  description TEXT,
  criteria JSONB DEFAULT '{}'::jsonb,
  deadline TIMESTAMPTZ,
  result TEXT CHECK (result IN ('challenger_wins', 'master_wins', 'draw', null)),
  result_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Master mentoring
CREATE TABLE master_mentoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id UUID NOT NULL REFERENCES team_masters(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  goals JSONB DEFAULT '[]'::jsonb,
  feedback TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(master_id, mentee_id, role_name)
);

-- =============================================
-- SECTION 5: ROLE ROTATION SYSTEM
-- =============================================

-- Role rotation requests
CREATE TABLE role_rotation_requests (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requester_current_role TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  target_role TEXT,
  request_type TEXT NOT NULL DEFAULT 'swap' CHECK (request_type IN ('swap', 'transfer', 'rotation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  reason TEXT,
  compatibility_score NUMERIC,
  compatibility_analysis JSONB DEFAULT '{}'::jsonb,
  requester_accepted BOOLEAN DEFAULT FALSE,
  target_accepted BOOLEAN DEFAULT FALSE,
  admin_approved BOOLEAN,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Role history
CREATE TABLE role_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('assignment', 'swap', 'transfer', 'rotation', 'promotion')),
  rotation_request_id UUID REFERENCES role_rotation_requests(id),
  previous_performance_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECTION 6: STARTUP OS (for Startup projects)
-- =============================================

-- OKRs (Objectives & Key Results)
CREATE TABLE okrs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  objective TEXT NOT NULL,
  key_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  quarter TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'off_track')),
  owner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitor snapshots (automated tracking)
CREATE TABLE competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pricing JSONB,
  features JSONB DEFAULT '[]'::jsonb,
  screenshot_url TEXT,
  raw_html TEXT,
  changes_detected JSONB DEFAULT '[]'::jsonb,
  alert_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Market intelligence
CREATE TABLE market_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  trends_data JSONB,
  social_mentions JSONB,
  market_size JSONB,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content calendar
CREATE TABLE content_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ideas JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content pieces
CREATE TABLE content_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  calendar_id UUID REFERENCES content_calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('blog_post', 'twitter_thread', 'linkedin_post', 'video_script')),
  keywords JSONB DEFAULT '[]'::jsonb,
  search_volume INTEGER DEFAULT 0,
  seo_difficulty TEXT CHECK (seo_difficulty IN ('easy', 'medium', 'hard')),
  relevance_score INTEGER DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  outline JSONB,
  ai_draft TEXT,
  final_content TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'published')),
  scheduled_date DATE,
  published_date DATE,
  published_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Launch checklist
CREATE TABLE launch_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_launch_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Beta testers & testimonials
CREATE TABLE beta_testers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  feedback_submitted_at TIMESTAMPTZ,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimonial_draft TEXT,
  testimonial_approved BOOLEAN DEFAULT FALSE,
  testimonial_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial projections
CREATE TABLE financial_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  revenue DECIMAL(12, 2) DEFAULT 0,
  mrr DECIMAL(12, 2) DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  cogs DECIMAL(12, 2) DEFAULT 0,
  payroll DECIMAL(12, 2) DEFAULT 0,
  marketing_spend DECIMAL(12, 2) DEFAULT 0,
  infrastructure DECIMAL(12, 2) DEFAULT 0,
  other_costs DECIMAL(12, 2) DEFAULT 0,
  gross_profit DECIMAL(12, 2) DEFAULT 0,
  gross_margin DECIMAL(5, 2) DEFAULT 0,
  net_profit DECIMAL(12, 2) DEFAULT 0,
  cash_balance DECIMAL(12, 2) DEFAULT 0,
  burn_rate DECIMAL(12, 2) DEFAULT 0,
  runway_months INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, year, month)
);

-- Key metrics (actual data)
CREATE TABLE key_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mrr DECIMAL(12, 2) DEFAULT 0,
  arr DECIMAL(12, 2) DEFAULT 0,
  mrr_growth_rate DECIMAL(5, 2) DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  churn_rate DECIMAL(5, 2) DEFAULT 0,
  cac DECIMAL(10, 2) DEFAULT 0,
  ltv DECIMAL(10, 2) DEFAULT 0,
  ltv_cac_ratio DECIMAL(5, 2) DEFAULT 0,
  dau INTEGER DEFAULT 0,
  mau INTEGER DEFAULT 0,
  cash_balance DECIMAL(12, 2) DEFAULT 0,
  burn_rate DECIMAL(12, 2) DEFAULT 0,
  runway_months INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, date)
);

-- Metric alerts
CREATE TABLE metric_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  threshold DECIMAL(12, 2) NOT NULL,
  operator TEXT NOT NULL CHECK (operator IN ('above', 'below')),
  current_value DECIMAL(12, 2) NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI recommendations
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('pricing', 'marketing', 'product', 'hiring', 'fundraising')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  data_sources JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  implemented BOOLEAN DEFAULT FALSE,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly insights
CREATE TABLE weekly_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary TEXT NOT NULL,
  highlights JSONB DEFAULT '[]'::jsonb,
  concerns JSONB DEFAULT '[]'::jsonb,
  competitor_changes JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  next_week_priorities JSONB DEFAULT '[]'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, week_start)
);

-- AI Advisor chat
CREATE TABLE advisor_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SECTION 7: ULTRA PERSONALIZED ONBOARDING
-- =============================================

-- Onboarding sessions
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  onboarding_type TEXT NOT NULL CHECK (onboarding_type IN ('generative', 'idea', 'existing')),
  phase TEXT NOT NULL DEFAULT 'essentials' CHECK (phase IN ('essentials', 'deep_dive', 'continuous')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  answers JSONB DEFAULT '{}'::jsonb,
  location_city TEXT,
  location_country TEXT,
  location_coordinates JSONB,
  target_market TEXT[],
  founder_background TEXT,
  founder_skills TEXT[],
  linkedin_data JSONB,
  has_cofounder BOOLEAN DEFAULT FALSE,
  cofounder_session_id UUID REFERENCES onboarding_sessions(id),
  alignment_score INTEGER CHECK (alignment_score >= 0 AND alignment_score <= 100),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Geo intelligence cache
CREATE TABLE geo_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key TEXT NOT NULL UNIQUE,
  local_competitors JSONB DEFAULT '[]'::jsonb,
  local_investors JSONB DEFAULT '[]'::jsonb,
  operational_costs JSONB DEFAULT '{}'::jsonb,
  regulations JSONB DEFAULT '[]'::jsonb,
  local_events JSONB DEFAULT '[]'::jsonb,
  accelerators JSONB DEFAULT '[]'::jsonb,
  grants JSONB DEFAULT '[]'::jsonb,
  market_size JSONB DEFAULT '{}'::jsonb,
  cost_of_living INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitive analysis
CREATE TABLE competitive_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  competitors JSONB DEFAULT '[]'::jsonb,
  swot JSONB DEFAULT '{}'::jsonb,
  market_gaps JSONB DEFAULT '[]'::jsonb,
  recommended_strategy JSONB DEFAULT '{}'::jsonb,
  benchmarks JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning paths
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_gaps TEXT[],
  resources JSONB DEFAULT '[]'::jsonb,
  existing_skills TEXT[],
  completed_resources UUID[],
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cofounder alignment
CREATE TABLE cofounder_alignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  founder_a_session_id UUID NOT NULL REFERENCES onboarding_sessions(id),
  founder_b_session_id UUID NOT NULL REFERENCES onboarding_sessions(id),
  alignment_score INTEGER CHECK (alignment_score >= 0 AND alignment_score <= 100),
  vision_alignment INTEGER CHECK (vision_alignment >= 0 AND vision_alignment <= 100),
  strategy_alignment INTEGER CHECK (strategy_alignment >= 0 AND strategy_alignment <= 100),
  commitment_alignment INTEGER CHECK (commitment_alignment >= 0 AND commitment_alignment <= 100),
  values_alignment INTEGER CHECK (values_alignment >= 0 AND values_alignment <= 100),
  misalignments JSONB DEFAULT '[]'::jsonb,
  discussion_topics JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '{}'::jsonb,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated business options (generative onboarding)
CREATE TABLE generated_business_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  options JSONB DEFAULT '[]'::jsonb,
  selected_option_index INTEGER,
  founder_profile JSONB,
  constraints JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation roadmaps (idea onboarding)
CREATE TABLE validation_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hypotheses JSONB DEFAULT '[]'::jsonb,
  experiments JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  completed_experiments UUID[],
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Growth playbooks (existing onboarding)
CREATE TABLE growth_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  diagnosis JSONB DEFAULT '{}'::jsonb,
  action_plan JSONB DEFAULT '[]'::jsonb,
  scenarios JSONB DEFAULT '{}'::jsonb,
  key_metrics TEXT[],
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice onboarding transcripts
CREATE TABLE voice_onboarding_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  transcript TEXT,
  extracted_answers JSONB DEFAULT '{}'::jsonb,
  reviewed BOOLEAN DEFAULT FALSE,
  user_edits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- =============================================
-- SECTION 8: AI EVIDENCE SYSTEM
-- =============================================

-- Project documents (Tier 1 sources)
CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  raw_content TEXT,
  structured_data JSONB,
  content_language TEXT DEFAULT 'simple',
  content_tsvector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector(
      COALESCE(content_language, 'simple')::regconfig,
      COALESCE(raw_content, '')
    )
  ) STORED,
  pages_count INTEGER,
  sections JSONB,
  source_type TEXT DEFAULT 'user_document',
  authority_score INTEGER DEFAULT 100,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI source registry
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

-- User source policies
CREATE TABLE user_source_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_mode TEXT DEFAULT 'balanced' CHECK (evidence_mode IN ('strict', 'balanced', 'hypothesis')),
  tier_1_enabled BOOLEAN DEFAULT TRUE,
  tier_2_enabled BOOLEAN DEFAULT TRUE,
  tier_3_enabled BOOLEAN DEFAULT TRUE,
  tier_4_enabled BOOLEAN DEFAULT FALSE,
  blocked_domains TEXT[] DEFAULT '{}',
  allowed_domains TEXT[] DEFAULT '{}',
  max_source_age_days INTEGER,
  require_https BOOLEAN DEFAULT TRUE,
  min_reliability_score INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

-- AI generation logs
CREATE TABLE ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  prompt_used TEXT,
  evidence_mode TEXT NOT NULL,
  planned_sources JSONB,
  sources_found JSONB,
  claims_made JSONB,
  evidence_status TEXT NOT NULL,
  coverage_percentage INTEGER,
  search_duration_ms INTEGER,
  generation_duration_ms INTEGER,
  total_tokens_used INTEGER,
  generated_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECTION 9: INTEGRATIONS
-- =============================================

-- Slack webhooks
CREATE TABLE slack_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  webhook_type TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECTION 10: INDEXES
-- =============================================

-- Profiles indexes
CREATE INDEX idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Projects indexes
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_projects_active ON projects(deleted_at) WHERE deleted_at IS NULL;

-- Project members indexes
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_member ON project_members(member_id);

-- OBVs indexes
CREATE INDEX idx_obvs_owner ON obvs(owner_id);
CREATE INDEX idx_obvs_project ON obvs(project_id);
CREATE INDEX idx_obvs_status ON obvs(status);
CREATE INDEX idx_obvs_tipo ON obvs(tipo);
CREATE INDEX idx_obvs_pipeline_status ON obvs(pipeline_status);
CREATE INDEX idx_obvs_cobro_estado ON obvs(cobro_estado);
CREATE INDEX idx_obvs_cobro_fecha_esperada ON obvs(cobro_fecha_esperada) WHERE cobro_estado != 'cobrado_total';
CREATE INDEX idx_obvs_costes_detalle ON obvs USING gin(costes_detalle);

-- OBV related indexes
CREATE INDEX idx_obv_participantes_obv ON obv_participantes(obv_id);
CREATE INDEX idx_obv_participantes_member ON obv_participantes(member_id);
CREATE INDEX idx_obv_validaciones_obv ON obv_validaciones(obv_id);
CREATE INDEX idx_obv_validaciones_validator ON obv_validaciones(validator_id);
CREATE INDEX idx_obv_pipeline_history_obv_id ON obv_pipeline_history(obv_id);
CREATE INDEX idx_obv_pipeline_history_created_at ON obv_pipeline_history(created_at DESC);
CREATE INDEX idx_cobros_parciales_obv_id ON cobros_parciales(obv_id);
CREATE INDEX idx_cobros_parciales_fecha ON cobros_parciales(fecha_cobro DESC);

-- KPIs indexes
CREATE INDEX idx_kpis_owner ON kpis(owner_id);
CREATE INDEX idx_kpis_type ON kpis(type);
CREATE INDEX idx_kpis_status ON kpis(status);
CREATE INDEX idx_kpi_validaciones_kpi ON kpi_validaciones(kpi_id);
CREATE INDEX idx_kpi_validaciones_validator ON kpi_validaciones(validator_id);

-- Tasks indexes
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_priority ON notifications(priority) WHERE leida = FALSE;
CREATE INDEX idx_notifications_unread ON notifications(user_id, leida) WHERE leida = FALSE;
CREATE INDEX idx_notifications_snoozed ON notifications(snoozed_until) WHERE snoozed_until IS NOT NULL;

-- Activity log indexes
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- Validation indexes
CREATE INDEX idx_validation_order_month ON validation_order(month_year);
CREATE INDEX idx_validation_order_user ON validation_order(user_id);
CREATE INDEX idx_validator_stats_user ON validator_stats(user_id);
CREATE INDEX idx_pending_validations_validator ON pending_validations(validator_id);
CREATE INDEX idx_pending_validations_owner ON pending_validations(owner_id);

-- MI DESARROLLO indexes
CREATE INDEX idx_user_insights_user ON user_insights(user_id);
CREATE INDEX idx_user_insights_project ON user_insights(project_id);
CREATE INDEX idx_user_playbooks_user ON user_playbooks(user_id);
CREATE INDEX idx_role_rankings_role ON role_rankings(role_name);
CREATE INDEX idx_role_rankings_user ON role_rankings(user_id);
CREATE INDEX idx_role_rankings_period ON role_rankings(period_start, period_end);

-- Master system indexes
CREATE INDEX idx_master_applications_user ON master_applications(user_id);
CREATE INDEX idx_master_applications_status ON master_applications(status);
CREATE INDEX idx_master_votes_application ON master_votes(application_id);
CREATE INDEX idx_team_masters_user ON team_masters(user_id);
CREATE INDEX idx_team_masters_role ON team_masters(role_name);
CREATE INDEX idx_master_challenges_master ON master_challenges(master_id);

-- Role rotation indexes
CREATE INDEX idx_role_rotation_requester ON role_rotation_requests(requester_id);
CREATE INDEX idx_role_rotation_target ON role_rotation_requests(target_user_id);
CREATE INDEX idx_role_rotation_status ON role_rotation_requests(status);
CREATE INDEX idx_role_history_user ON role_history(user_id);
CREATE INDEX idx_role_history_project ON role_history(project_id);

-- Startup OS indexes
CREATE INDEX idx_okrs_project ON okrs(project_id);
CREATE INDEX idx_okrs_quarter ON okrs(quarter);
CREATE INDEX idx_competitor_snapshots_project ON competitor_snapshots(project_id);
CREATE INDEX idx_competitor_snapshots_competitor ON competitor_snapshots(competitor_id);
CREATE INDEX idx_competitor_snapshots_date ON competitor_snapshots(captured_at DESC);
CREATE INDEX idx_content_pieces_project ON content_pieces(project_id);
CREATE INDEX idx_content_pieces_status ON content_pieces(status);
CREATE INDEX idx_content_pieces_scheduled ON content_pieces(scheduled_date);
CREATE INDEX idx_beta_testers_project ON beta_testers(project_id);
CREATE INDEX idx_beta_testers_email ON beta_testers(email);
CREATE INDEX idx_financial_projections_project ON financial_projections(project_id);
CREATE INDEX idx_financial_projections_date ON financial_projections(year, month);
CREATE INDEX idx_key_metrics_project ON key_metrics(project_id);
CREATE INDEX idx_key_metrics_date ON key_metrics(date DESC);
CREATE INDEX idx_metric_alerts_project ON metric_alerts(project_id);
CREATE INDEX idx_metric_alerts_severity ON metric_alerts(severity);
CREATE INDEX idx_metric_alerts_acknowledged ON metric_alerts(acknowledged);
CREATE INDEX idx_ai_recommendations_project ON ai_recommendations(project_id);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX idx_ai_recommendations_dismissed ON ai_recommendations(dismissed);
CREATE INDEX idx_weekly_insights_project ON weekly_insights(project_id);
CREATE INDEX idx_weekly_insights_date ON weekly_insights(week_start DESC);
CREATE INDEX idx_advisor_chats_project ON advisor_chats(project_id);

-- Onboarding indexes
CREATE INDEX idx_onboarding_sessions_project ON onboarding_sessions(project_id);
CREATE INDEX idx_onboarding_sessions_type ON onboarding_sessions(onboarding_type);
CREATE INDEX idx_geo_cache_location ON geo_intelligence_cache(location_key);
CREATE INDEX idx_geo_cache_expiry ON geo_intelligence_cache(expires_at);
CREATE INDEX idx_competitive_analysis_project ON competitive_analysis(project_id);
CREATE INDEX idx_learning_paths_project ON learning_paths(project_id);
CREATE INDEX idx_cofounder_alignment_project ON cofounder_alignment(project_id);
CREATE INDEX idx_generated_options_project ON generated_business_options(project_id);
CREATE INDEX idx_validation_roadmaps_project ON validation_roadmaps(project_id);
CREATE INDEX idx_growth_playbooks_project ON growth_playbooks(project_id);
CREATE INDEX idx_voice_transcripts_project ON voice_onboarding_transcripts(project_id);

-- AI Evidence indexes
CREATE INDEX idx_project_documents_project ON project_documents(project_id);
CREATE INDEX idx_project_documents_user ON project_documents(user_id);
CREATE INDEX idx_project_documents_type ON project_documents(file_type);
CREATE INDEX idx_project_documents_search ON project_documents USING GIN(content_tsvector);
CREATE INDEX idx_project_documents_upload_date ON project_documents(upload_date DESC);
CREATE INDEX idx_ai_source_registry_type ON ai_source_registry(source_type);
CREATE INDEX idx_ai_source_registry_domain ON ai_source_registry(domain);
CREATE UNIQUE INDEX idx_ai_source_registry_url ON ai_source_registry(source_url);
CREATE INDEX idx_user_source_policies_project ON user_source_policies(project_id);
CREATE INDEX idx_user_source_policies_user ON user_source_policies(user_id);
CREATE INDEX idx_ai_generation_logs_project ON ai_generation_logs(project_id);
CREATE INDEX idx_ai_generation_logs_user ON ai_generation_logs(user_id);
CREATE INDEX idx_ai_generation_logs_function ON ai_generation_logs(function_name);
CREATE INDEX idx_ai_generation_logs_date ON ai_generation_logs(created_at DESC);

-- =============================================
-- SECTION 11: FUNCTIONS
-- =============================================

-- Security helper functions
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

CREATE OR REPLACE FUNCTION public.get_profile_id(_auth_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE auth_id = _auth_id LIMIT 1
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- OBV validation check
CREATE OR REPLACE FUNCTION check_obv_validations()
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

-- KPI validation check
CREATE OR REPLACE FUNCTION check_kpi_validations()
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
RETURNS TRIGGER AS $$
BEGIN
  -- Validate and calculate costs from detail
  IF NEW.costes_detalle IS NOT NULL THEN
    NEW.costes := (
      COALESCE((NEW.costes_detalle->>'materiales')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'subcontratacion')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'herramientas')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'marketing')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'logistica')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'comisiones')::DECIMAL, 0) +
      COALESCE((NEW.costes_detalle->>'otros')::DECIMAL, 0)
    );
  END IF;

  -- Create detail if costs exist but no detail
  IF NEW.costes_detalle IS NULL AND NEW.costes IS NOT NULL AND NEW.costes > 0 THEN
    NEW.costes_detalle := jsonb_build_object('otros', NEW.costes);
  END IF;

  -- Recalculate margin for sales
  IF NEW.es_venta = TRUE AND NEW.facturacion IS NOT NULL THEN
    NEW.margen := NEW.facturacion - COALESCE(NEW.costes, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update payment status based on partial payments
CREATE OR REPLACE FUNCTION actualizar_estado_cobro()
RETURNS TRIGGER AS $$
DECLARE
  total_cobrado DECIMAL(12,2);
  facturacion_total DECIMAL(12,2);
  obv_record RECORD;
BEGIN
  SELECT facturacion, es_venta INTO obv_record
  FROM obvs WHERE id = NEW.obv_id;

  IF NOT obv_record.es_venta THEN
    RETURN NEW;
  END IF;

  facturacion_total := COALESCE(obv_record.facturacion, 0);

  SELECT COALESCE(SUM(monto), 0) INTO total_cobrado
  FROM cobros_parciales WHERE obv_id = NEW.obv_id;

  IF total_cobrado >= facturacion_total AND facturacion_total > 0 THEN
    UPDATE obvs SET
      cobro_estado = 'cobrado_total',
      cobrado = TRUE,
      cobrado_parcial = total_cobrado,
      cobro_fecha_real = NEW.fecha_cobro
    WHERE id = NEW.obv_id;
  ELSIF total_cobrado > 0 THEN
    UPDATE obvs SET
      cobro_estado = 'cobrado_parcial',
      cobrado = FALSE,
      cobrado_parcial = total_cobrado
    WHERE id = NEW.obv_id;
  ELSE
    UPDATE obvs SET
      cobro_estado = 'pendiente',
      cobrado = FALSE,
      cobrado_parcial = 0
    WHERE id = NEW.obv_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Register pipeline status changes
CREATE OR REPLACE FUNCTION registrar_cambio_pipeline()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status THEN
    INSERT INTO obv_pipeline_history (
      obv_id,
      old_status,
      new_status,
      changed_by,
      created_at
    ) VALUES (
      NEW.id,
      OLD.pipeline_status,
      NEW.pipeline_status,
      (SELECT id FROM profiles WHERE auth_id = auth.uid() LIMIT 1),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profile on new user signup
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

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    (SELECT id FROM public.profiles WHERE auth_id = NEW.id),
    'member'
  );

  RETURN NEW;
END;
$$;

-- Soft delete project
CREATE OR REPLACE FUNCTION public.soft_delete_project(
  p_project_id UUID,
  p_deleted_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
    AND member_id = p_deleted_by
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para eliminar este proyecto';
  END IF;

  UPDATE public.projects
  SET
    deleted_at = NOW(),
    deleted_by = p_deleted_by,
    deletion_reason = p_reason
  WHERE id = p_project_id
  AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado o ya eliminado';
  END IF;
END;
$$;

-- Restore project
CREATE OR REPLACE FUNCTION public.restore_project(
  p_project_id UUID,
  p_restored_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
    AND member_id = p_restored_by
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para restaurar este proyecto';
  END IF;

  UPDATE public.projects
  SET
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL
  WHERE id = p_project_id
  AND deleted_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado o no está eliminado';
  END IF;
END;
$$;

-- Calculate role performance score
CREATE OR REPLACE FUNCTION public.calculate_role_performance_score(
  p_user_id UUID,
  p_project_id UUID,
  p_role TEXT
) RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
  v_task_weight NUMERIC := 0.4;
  v_obv_weight NUMERIC := 0.4;
  v_lead_weight NUMERIC := 0.2;
  v_task_rate NUMERIC;
  v_obv_count NUMERIC;
  v_lead_rate NUMERIC;
BEGIN
  SELECT
    COALESCE(task_completion_rate, 0),
    COALESCE(validated_obvs, 0),
    COALESCE(lead_conversion_rate, 0)
  INTO v_task_rate, v_obv_count, v_lead_rate
  FROM public.user_role_performance
  WHERE user_id = p_user_id AND project_id = p_project_id AND role_name = p_role;

  v_score := (v_task_rate * v_task_weight) +
             (LEAST(v_obv_count * 10, 100) * v_obv_weight) +
             (v_lead_rate * v_lead_weight);

  IF p_role IN ('comercial', 'closer') THEN
    v_score := (v_task_rate * 0.2) + (v_obv_count * 10 * 0.3) + (v_lead_rate * 0.5);
  ELSIF p_role IN ('operaciones', 'tecnico') THEN
    v_score := (v_task_rate * 0.5) + (v_obv_count * 10 * 0.4) + (v_lead_rate * 0.1);
  END IF;

  RETURN ROUND(LEAST(v_score, 100), 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Search project documents (AI Evidence System)
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
    NULL::INTEGER as page_number
  FROM project_documents pd
  WHERE
    pd.project_id = p_project_id
    AND pd.content_tsvector @@ websearch_to_tsquery('simple', p_query)
  ORDER BY relevance_rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification helper
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_priority TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    tipo,
    priority,
    titulo,
    mensaje,
    action_url,
    action_label,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_priority,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- =============================================
-- SECTION 12: TRIGGERS
-- =============================================

-- Handle new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- OBV validation triggers
CREATE TRIGGER trigger_check_obv_validations
AFTER INSERT ON obv_validaciones
FOR EACH ROW EXECUTE FUNCTION check_obv_validations();

-- KPI validation triggers
CREATE TRIGGER trigger_check_kpi_validations
AFTER INSERT ON kpi_validaciones
FOR EACH ROW EXECUTE FUNCTION check_kpi_validations();

-- Auto-calculate costs trigger
DROP TRIGGER IF EXISTS trigger_auto_calcular_costes ON obvs;
CREATE TRIGGER trigger_auto_calcular_costes
BEFORE INSERT OR UPDATE ON obvs
FOR EACH ROW
WHEN (NEW.es_venta = TRUE)
EXECUTE FUNCTION auto_calcular_costes_y_margen();

-- Update payment status trigger
DROP TRIGGER IF EXISTS trigger_actualizar_estado_cobro ON cobros_parciales;
CREATE TRIGGER trigger_actualizar_estado_cobro
AFTER INSERT OR UPDATE OR DELETE ON cobros_parciales
FOR EACH ROW EXECUTE FUNCTION actualizar_estado_cobro();

-- Pipeline change tracking
DROP TRIGGER IF EXISTS trigger_registrar_cambio_pipeline ON obvs;
CREATE TRIGGER trigger_registrar_cambio_pipeline
AFTER UPDATE ON obvs
FOR EACH ROW
WHEN (OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status)
EXECUTE FUNCTION registrar_cambio_pipeline();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obvs_updated_at BEFORE UPDATE ON obvs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON okrs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_calendars_updated_at BEFORE UPDATE ON content_calendars
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pieces_updated_at BEFORE UPDATE ON content_pieces
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_launch_checklists_updated_at BEFORE UPDATE ON launch_checklists
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_projections_updated_at BEFORE UPDATE ON financial_projections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advisor_chats_updated_at BEFORE UPDATE ON advisor_chats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SECTION 13: VIEWS
-- =============================================

-- Member stats (combines base KPIs + dynamic validated KPIs)
CREATE OR REPLACE VIEW member_stats
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.nombre,
  p.color,
  p.avatar,
  p.email,
  COALESCE(b.obvs, 0) + COALESCE((SELECT COUNT(*) FROM obvs WHERE owner_id = p.id AND status = 'validated'), 0) as obvs,
  COALESCE(b.lps, 0) + COALESCE((SELECT COUNT(*) FROM kpis WHERE owner_id = p.id AND type = 'lp' AND status = 'validated'), 0) as lps,
  COALESCE(b.bps, 0) + COALESCE((SELECT COUNT(*) FROM kpis WHERE owner_id = p.id AND type = 'bp' AND status = 'validated'), 0) as bps,
  COALESCE(b.cps, 0) + COALESCE((SELECT SUM(cp_points) FROM kpis WHERE owner_id = p.id AND type = 'cp' AND status = 'validated'), 0) as cps,
  COALESCE(b.facturacion, 0) + COALESCE((SELECT SUM(facturacion) FROM obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as facturacion,
  COALESCE(b.margen, 0) + COALESCE((SELECT SUM(margen) FROM obvs WHERE owner_id = p.id AND es_venta = TRUE AND status = 'validated'), 0) as margen,
  COALESCE(b.obvs_exploracion, 0) as obvs_exploracion,
  COALESCE(b.obvs_validacion, 0) as obvs_validacion,
  COALESCE(b.obvs_venta, 0) as obvs_venta
FROM profiles p
LEFT JOIN member_kpi_base b ON b.member_id = p.id;

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
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'validated') as obvs_validados,
  COALESCE(SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0) as facturacion,
  COALESCE(SUM(o.margen) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0) as margen
FROM projects p
LEFT JOIN project_members pm ON pm.project_id = p.id
LEFT JOIN obvs o ON o.project_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- Active projects (not deleted)
CREATE OR REPLACE VIEW active_projects AS
SELECT *
FROM projects
WHERE deleted_at IS NULL;

-- Deleted projects
CREATE OR REPLACE VIEW deleted_projects AS
SELECT
  p.*,
  deleter.nombre as deleted_by_name,
  deleter.email as deleted_by_email
FROM projects p
LEFT JOIN profiles deleter ON p.deleted_by = deleter.id
WHERE p.deleted_at IS NOT NULL
ORDER BY p.deleted_at DESC;

-- Pipeline global (CRM view)
CREATE OR REPLACE VIEW pipeline_global
WITH (security_invoker = true) AS
SELECT
  o.*,
  p.nombre as proyecto_nombre,
  p.color as proyecto_color,
  pr.nombre as responsable_nombre
FROM obvs o
JOIN projects p ON o.project_id = p.id
LEFT JOIN profiles pr ON o.responsable_id = pr.id
WHERE o.tipo IN ('exploracion', 'validacion');

-- User role performance
CREATE OR REPLACE VIEW user_role_performance
WITH (security_invoker = true) AS
SELECT
  pm.member_id as user_id,
  pm.role as role_name,
  pm.project_id,
  p.nombre as project_name,
  pr.nombre as user_name,
  pm.is_lead,
  pm.role_accepted,
  pm.performance_score,
  COALESCE(task_stats.total_tasks, 0) as total_tasks,
  COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
  COALESCE(task_stats.completion_rate, 0) as task_completion_rate,
  COALESCE(obv_stats.total_obvs, 0) as total_obvs,
  COALESCE(obv_stats.validated_obvs, 0) as validated_obvs,
  COALESCE(obv_stats.total_facturacion, 0) as total_facturacion,
  COALESCE(lead_stats.total_leads, 0) as total_leads,
  COALESCE(lead_stats.leads_ganados, 0) as leads_ganados,
  COALESCE(lead_stats.conversion_rate, 0) as lead_conversion_rate,
  pm.joined_at
FROM project_members pm
JOIN profiles pr ON pr.id = pm.member_id
JOIN projects p ON p.id = pm.project_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
    CASE WHEN COUNT(*) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE status = 'done')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END as completion_rate
  FROM tasks t
  WHERE t.assignee_id = pm.member_id AND t.project_id = pm.project_id
) task_stats ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as total_obvs,
    COUNT(*) FILTER (WHERE status = 'validated') as validated_obvs,
    COALESCE(SUM(facturacion) FILTER (WHERE status = 'validated'), 0) as total_facturacion
  FROM obvs o
  WHERE o.owner_id = pm.member_id AND o.project_id = pm.project_id
) obv_stats ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE pipeline_status = 'cerrado_ganado') as leads_ganados,
    CASE WHEN COUNT(*) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE pipeline_status = 'cerrado_ganado')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM obvs o
  WHERE o.responsable_id = pm.member_id AND o.project_id = pm.project_id
) lead_stats ON true;

-- Pending payments view
CREATE OR REPLACE VIEW pending_payments
WITH (security_invoker = true) AS
SELECT
  o.id,
  o.titulo,
  o.facturacion as importe,
  o.fecha as fecha_venta,
  o.cobro_fecha_esperada,
  o.cobro_estado,
  o.importe_cobrado,
  o.facturacion - COALESCE(o.importe_cobrado, 0) as pendiente,
  CASE
    WHEN o.cobro_fecha_esperada IS NULL THEN 0
    ELSE CURRENT_DATE - o.cobro_fecha_esperada
  END as dias_vencido,
  o.numero_factura,
  o.nombre_contacto as cliente,
  o.empresa as cliente_empresa,
  p.nombre as proyecto_nombre,
  p.color as proyecto_color,
  pr.nombre as responsable_nombre,
  pr.id as responsable_id
FROM obvs o
LEFT JOIN projects p ON o.project_id = p.id
LEFT JOIN profiles pr ON o.owner_id = pr.id
WHERE o.es_venta = TRUE
  AND o.status = 'validated'
  AND o.cobro_estado IN ('pendiente', 'cobrado_parcial')
ORDER BY o.cobro_fecha_esperada NULLS LAST;

-- Financial metrics view
CREATE OR REPLACE VIEW financial_metrics
WITH (security_invoker = true) AS
SELECT
  p.id as project_id,
  p.nombre as project_name,
  p.color as project_color,
  DATE_TRUNC('month', o.fecha) as month,
  SUM(o.facturacion) as facturacion,
  SUM(o.costes) as costes,
  SUM(o.margen) as margen,
  COUNT(*) as num_ventas,
  ROUND(AVG(o.margen / NULLIF(o.facturacion, 0) * 100), 2) as margen_percent,
  SUM(CASE WHEN o.cobro_estado = 'cobrado_total' THEN o.facturacion ELSE 0 END) as cobrado,
  SUM(CASE WHEN o.cobro_estado IN ('pendiente', 'cobrado_parcial') THEN o.facturacion - COALESCE(o.importe_cobrado, 0) ELSE 0 END) as pendiente_cobro
FROM obvs o
JOIN projects p ON o.project_id = p.id
WHERE o.es_venta = TRUE AND o.status = 'validated'
GROUP BY p.id, p.nombre, p.color, DATE_TRUNC('month', o.fecha)
ORDER BY month DESC;

-- =============================================
-- SECTION 14: RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_kpi_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE obvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE obv_pipeline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros_parciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_validaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE validator_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_mentoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_rotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofounder_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_business_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_onboarding_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_source_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_webhooks ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = auth_id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_id);

-- USER ROLES
CREATE POLICY "Roles viewable by authenticated" ON user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can insert roles" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(public.get_profile_id(auth.uid()), 'admin'));
CREATE POLICY "Only admins can update roles" ON user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(public.get_profile_id(auth.uid()), 'admin'));
CREATE POLICY "Only admins can delete roles" ON user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(public.get_profile_id(auth.uid()), 'admin'));

-- USER SETTINGS
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (user_id = get_profile_id(auth.uid()));

-- MEMBER KPI BASE
CREATE POLICY "Members can view all KPI base" ON member_kpi_base
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can insert own KPI base" ON member_kpi_base
  FOR INSERT TO authenticated WITH CHECK (member_id = get_profile_id(auth.uid()));
CREATE POLICY "Members can update own KPI base" ON member_kpi_base
  FOR UPDATE TO authenticated USING (member_id = get_profile_id(auth.uid()));
CREATE POLICY "Admins can manage all KPI base" ON member_kpi_base
  FOR ALL TO authenticated USING (has_role(get_profile_id(auth.uid()), 'admin'));

-- OBJECTIVES
CREATE POLICY "Objectives viewable" ON objectives
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify objectives" ON objectives
  FOR ALL TO authenticated
  USING (public.has_role(public.get_profile_id(auth.uid()), 'admin'));

-- PROJECTS
CREATE POLICY "Projects viewable by authenticated" ON projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create projects" ON projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Project members can update" ON projects
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = id
      AND pm.member_id = public.get_profile_id(auth.uid())
    )
  );

-- PROJECT MEMBERS
CREATE POLICY "Project members viewable" ON project_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can join projects" ON project_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Members can leave" ON project_members
  FOR DELETE TO authenticated
  USING (member_id = public.get_profile_id(auth.uid()));

-- OBVs
CREATE POLICY "OBVs viewable by authenticated" ON obvs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create OBVs" ON obvs
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owner can update OBV" ON obvs
  FOR UPDATE TO authenticated
  USING (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owner can delete OBV" ON obvs
  FOR DELETE TO authenticated
  USING (owner_id = public.get_profile_id(auth.uid()) AND status = 'pending');

-- OBV VALIDACIONES
CREATE POLICY "Validaciones viewable" ON obv_validaciones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can validate" ON obv_validaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    validator_id = public.get_profile_id(auth.uid()) AND
    validator_id != (SELECT owner_id FROM obvs WHERE id = obv_id)
  );

-- OBV PARTICIPANTES
CREATE POLICY "Participantes viewable" ON obv_participantes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "OBV owner can add participants" ON obv_participantes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM obvs WHERE id = obv_id AND owner_id = public.get_profile_id(auth.uid()))
  );

-- OBV PIPELINE HISTORY
CREATE POLICY "Pipeline history viewable" ON obv_pipeline_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert history" ON obv_pipeline_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- COBROS PARCIALES
CREATE POLICY "All authenticated can view cobros parciales" ON cobros_parciales
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated can create cobros parciales" ON cobros_parciales
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creator can update cobro parcial" ON cobros_parciales
  FOR UPDATE TO authenticated USING (created_by = get_profile_id(auth.uid()));
CREATE POLICY "Creator can delete cobro parcial" ON cobros_parciales
  FOR DELETE TO authenticated USING (created_by = get_profile_id(auth.uid()));

-- KPIs
CREATE POLICY "KPIs viewable" ON kpis
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create KPIs" ON kpis
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Owner can update KPI" ON kpis
  FOR UPDATE TO authenticated
  USING (owner_id = public.get_profile_id(auth.uid()));

-- KPI VALIDACIONES
CREATE POLICY "KPI validaciones viewable" ON kpi_validaciones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can validate KPIs" ON kpi_validaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    validator_id = public.get_profile_id(auth.uid()) AND
    validator_id != (SELECT owner_id FROM kpis WHERE id = kpi_id)
  );

-- TASKS
CREATE POLICY "Tasks viewable" ON tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Assignee can update tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (assignee_id = public.get_profile_id(auth.uid()) OR assignee_id IS NULL);
CREATE POLICY "Assignee can delete tasks" ON tasks
  FOR DELETE TO authenticated
  USING (assignee_id = public.get_profile_id(auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Own notifications viewable" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = public.get_profile_id(auth.uid()));

-- ACTIVITY LOG
CREATE POLICY "Activity viewable by authenticated" ON activity_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can log activity" ON activity_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- VALIDATION SYSTEM
CREATE POLICY "Validation order viewable by authenticated" ON validation_order
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Only admins can modify validation order" ON validation_order
  FOR ALL USING (has_role(get_profile_id(auth.uid()), 'admin'::app_role));

CREATE POLICY "Pending validations viewable by authenticated" ON pending_validations
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can manage pending validations" ON pending_validations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Validator stats viewable by authenticated" ON validator_stats
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can manage validator stats" ON validator_stats
  FOR ALL USING (auth.uid() IS NOT NULL);

-- USER INSIGHTS
CREATE POLICY "Users can view own insights" ON user_insights
  FOR SELECT USING (user_id = get_profile_id(auth.uid()) OR is_private = false);
CREATE POLICY "Users can create own insights" ON user_insights
  FOR INSERT WITH CHECK (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can update own insights" ON user_insights
  FOR UPDATE USING (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can delete own insights" ON user_insights
  FOR DELETE USING (user_id = get_profile_id(auth.uid()));

-- USER PLAYBOOKS
CREATE POLICY "Users can view own playbooks" ON user_playbooks
  FOR SELECT USING (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can create own playbooks" ON user_playbooks
  FOR INSERT WITH CHECK (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can update own playbooks" ON user_playbooks
  FOR UPDATE USING (user_id = get_profile_id(auth.uid()));

-- ROLE RANKINGS
CREATE POLICY "Rankings viewable by authenticated" ON role_rankings
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can update rankings" ON role_rankings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "System can modify rankings" ON role_rankings
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- MASTER SYSTEM
CREATE POLICY "Applications viewable by authenticated" ON master_applications
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create own applications" ON master_applications
  FOR INSERT WITH CHECK (user_id = get_profile_id(auth.uid()));
CREATE POLICY "Users can update own pending applications" ON master_applications
  FOR UPDATE USING (user_id = get_profile_id(auth.uid()) AND status = 'pending');

CREATE POLICY "Votes viewable by authenticated" ON master_votes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can vote" ON master_votes
  FOR INSERT WITH CHECK (
    voter_id = get_profile_id(auth.uid()) AND
    voter_id != (SELECT user_id FROM master_applications WHERE id = application_id)
  );

CREATE POLICY "Masters viewable by all authenticated" ON team_masters
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can manage masters" ON team_masters
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Challenges viewable by authenticated" ON master_challenges
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create challenges" ON master_challenges
  FOR INSERT WITH CHECK (challenger_id = get_profile_id(auth.uid()));
CREATE POLICY "Participants can update challenges" ON master_challenges
  FOR UPDATE USING (
    challenger_id = get_profile_id(auth.uid()) OR
    EXISTS (SELECT 1 FROM team_masters tm WHERE tm.id = master_id AND tm.user_id = get_profile_id(auth.uid()))
  );

CREATE POLICY "Mentoring viewable by participants" ON master_mentoring
  FOR SELECT USING (
    mentee_id = get_profile_id(auth.uid()) OR
    EXISTS (SELECT 1 FROM team_masters tm WHERE tm.id = master_id AND tm.user_id = get_profile_id(auth.uid()))
  );
CREATE POLICY "Masters can create mentoring" ON master_mentoring
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_masters tm WHERE tm.id = master_id AND tm.user_id = get_profile_id(auth.uid()))
  );

-- ROLE ROTATION
CREATE POLICY "Rotation requests viewable by authenticated" ON role_rotation_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create rotation requests" ON role_rotation_requests
  FOR INSERT WITH CHECK (requester_id = get_profile_id(auth.uid()));
CREATE POLICY "Participants can update rotation requests" ON role_rotation_requests
  FOR UPDATE USING (
    requester_id = get_profile_id(auth.uid()) OR
    target_user_id = get_profile_id(auth.uid()) OR
    has_role(get_profile_id(auth.uid()), 'admin')
  );

CREATE POLICY "Role history viewable by authenticated" ON role_history
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert role history" ON role_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- STARTUP OS (simplified - allow project owners full access)
CREATE POLICY "Users can view their project OKRs" ON okrs
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their project OKRs" ON okrs
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their competitor snapshots" ON competitor_snapshots
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can manage snapshots" ON competitor_snapshots
  FOR ALL USING (true);

CREATE POLICY "Users can view their market intelligence" ON market_intelligence
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can manage market intelligence" ON market_intelligence
  FOR ALL USING (true);

CREATE POLICY "Users can manage their content calendar" ON content_calendars
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their content pieces" ON content_pieces
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their launch checklist" ON launch_checklists
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their beta testers" ON beta_testers
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their financial projections" ON financial_projections
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Users can manage their key metrics" ON key_metrics
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their metric alerts" ON metric_alerts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can create alerts" ON metric_alerts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can acknowledge alerts" ON metric_alerts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their recommendations" ON ai_recommendations
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can create recommendations" ON ai_recommendations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can dismiss/implement recommendations" ON ai_recommendations
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their weekly insights" ON weekly_insights
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));
CREATE POLICY "Service role can create insights" ON weekly_insights
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their advisor chats" ON advisor_chats
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

-- ONBOARDING (simplified)
CREATE POLICY "Users can view their own onboarding sessions" ON onboarding_sessions
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = onboarding_sessions.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can create onboarding sessions" ON onboarding_sessions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = onboarding_sessions.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can update their own onboarding sessions" ON onboarding_sessions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = onboarding_sessions.project_id AND projects.created_by = auth.uid()));

CREATE POLICY "Everyone can read geo cache" ON geo_intelligence_cache
  FOR SELECT USING (true);

CREATE POLICY "Users can view their competitive analysis" ON competitive_analysis
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = competitive_analysis.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can create competitive analysis" ON competitive_analysis
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = competitive_analysis.project_id AND projects.created_by = auth.uid()));

CREATE POLICY "Users can view their learning paths" ON learning_paths
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = learning_paths.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can update their learning paths" ON learning_paths
  FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = learning_paths.project_id AND projects.created_by = auth.uid()));

CREATE POLICY "Users can view their cofounder alignment" ON cofounder_alignment
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = cofounder_alignment.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can view their generated business options" ON generated_business_options
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = generated_business_options.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can view their validation roadmaps" ON validation_roadmaps
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = validation_roadmaps.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can view their growth playbooks" ON growth_playbooks
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = growth_playbooks.project_id AND projects.created_by = auth.uid()));
CREATE POLICY "Users can view their voice transcripts" ON voice_onboarding_transcripts
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = voice_onboarding_transcripts.project_id AND projects.created_by = auth.uid()));

-- AI EVIDENCE SYSTEM
CREATE POLICY "Users can view their project documents" ON project_documents
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_documents.project_id AND p.created_by = auth.uid()));
CREATE POLICY "Users can insert their project documents" ON project_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their project documents" ON project_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their project documents" ON project_documents
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their source policies" ON user_source_policies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their source policies" ON user_source_policies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their generation logs" ON ai_generation_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert generation logs" ON ai_generation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- INTEGRATIONS
CREATE POLICY "Slack webhooks viewable by authenticated" ON slack_webhooks
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Slack webhooks manageable by authenticated" ON slack_webhooks
  FOR ALL USING (auth.uid() IS NOT NULL);

-- =============================================
-- SECTION 15: STORAGE BUCKETS
-- =============================================

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Meeting recordings bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-recordings',
  'meeting-recordings',
  true,
  104857600, -- 100 MB
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-m4a', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload meeting recordings to their projects" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'meeting-recordings' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE created_by = auth.uid())
  );
CREATE POLICY "Users can view their own meeting recordings" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'meeting-recordings' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE created_by = auth.uid())
  );
CREATE POLICY "Users can update their own meeting recordings" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'meeting-recordings' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE created_by = auth.uid())
  );
CREATE POLICY "Users can delete their own meeting recordings" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'meeting-recordings' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM projects WHERE created_by = auth.uid())
  );

-- =============================================
-- SECTION 16: SEED DATA
-- =============================================

-- Default objectives
INSERT INTO objectives (name, target_value, unit, period) VALUES
  ('obvs', 150, 'OBVs', 'semester'),
  ('lps', 18, 'LPs', 'semester'),
  ('bps', 66, 'BPs', 'semester'),
  ('cps', 40, 'CPs', 'semester'),
  ('facturacion', 15000, '€', 'semester'),
  ('margen', 7500, '€', 'semester')
ON CONFLICT (name) DO NOTHING;

-- AI Source Registry (External sources)
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
-- END OF SCHEMA
-- =============================================
-- This schema represents the complete Nova Hub architecture
-- including all features: Projects, OBVs, KPIs, Tasks, Validations,
-- MI DESARROLLO, Master System, Role Rotation, Startup OS,
-- Ultra Personalized Onboarding, and AI Evidence System.
-- =============================================
