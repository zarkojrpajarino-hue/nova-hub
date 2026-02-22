-- =====================================================
-- SQL COMPLETO - SISTEMA DE ROTACIÓN DE ROLES
-- =====================================================
-- Implementa el schema completo para exploración y rotación de roles
-- Ver documentación completa en: SISTEMA_ROTACION_ROLES_PROFESIONAL.md
-- =====================================================

-- PASO 1: Actualizar tabla project_members (añadir campos de rotación)
-- =====================================================

ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'permanent' CHECK (assignment_type IN ('exploration', 'temporary', 'permanent')),
  ADD COLUMN IF NOT EXISTS assignment_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS assignment_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS assignment_reason TEXT,
  ADD COLUMN IF NOT EXISTS previous_role specialization_role;

CREATE INDEX IF NOT EXISTS idx_project_members_assignment_type ON public.project_members(assignment_type);
CREATE INDEX IF NOT EXISTS idx_project_members_end_date ON public.project_members(assignment_end_date);

-- PASO 2: Tabla de períodos de exploración
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_exploration_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role specialization_role NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Período
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),

  -- Resultados
  tasks_completed INTEGER DEFAULT 0,
  obvs_completed INTEGER DEFAULT 0,
  collaboration_score DECIMAL(3,2),
  self_rating INTEGER,
  team_rating DECIMAL(3,2),

  -- Decisión final
  wants_to_continue BOOLEAN,
  fit_score DECIMAL(3,2),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_exploration_member ON public.role_exploration_periods(member_id);
CREATE INDEX IF NOT EXISTS idx_role_exploration_status ON public.role_exploration_periods(status);
CREATE INDEX IF NOT EXISTS idx_role_exploration_end_date ON public.role_exploration_periods(end_date);

-- PASO 3: Tabla de preferencias de roles
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role specialization_role NOT NULL,

  -- Preferencia
  preference_level INTEGER CHECK (preference_level >= 1 AND preference_level <= 5),
  reasons TEXT[],

  -- Contexto
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  after_exploration_period_id UUID REFERENCES public.role_exploration_periods(id),

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, role)
);

CREATE INDEX IF NOT EXISTS idx_role_preferences_member ON public.role_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_role_preferences_level ON public.role_preferences(preference_level);

-- PASO 4: Tabla de métricas de performance por rol
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role specialization_role NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,

  -- Período
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Métricas cuantitativas
  tasks_assigned INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_on_time INTEGER DEFAULT 0,
  obvs_created INTEGER DEFAULT 0,
  obvs_validated INTEGER DEFAULT 0,

  -- Métricas cualitativas
  collaboration_events INTEGER DEFAULT 0,
  quality_score DECIMAL(3,2),
  initiative_score DECIMAL(3,2),

  -- Score general
  overall_score DECIMAL(3,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_performance_member_role ON public.role_performance_metrics(member_id, role);
CREATE INDEX IF NOT EXISTS idx_role_performance_period ON public.role_performance_metrics(period_end DESC);

-- PASO 5: Tabla de historial de rotaciones
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_rotation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Cambio
  from_role specialization_role,
  to_role specialization_role NOT NULL,
  rotation_type TEXT CHECK (rotation_type IN ('manual', 'suggested', 'automatic', 'request')),

  -- Razón
  reason TEXT NOT NULL,
  suggested_by UUID REFERENCES public.members(id),
  approved_by UUID REFERENCES public.members(id),

  -- Contexto
  performance_before JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_rotation_member ON public.role_rotation_history(member_id);
CREATE INDEX IF NOT EXISTS idx_role_rotation_project ON public.role_rotation_history(project_id);

-- PASO 6: Actualizar tabla projects para onboarding extendido
-- =====================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS target_markets TEXT[],
  ADD COLUMN IF NOT EXISTS mobility_plan TEXT,
  ADD COLUMN IF NOT EXISTS team_size_current INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS team_size_needed INTEGER,
  ADD COLUMN IF NOT EXISTS has_existing_team BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

CREATE INDEX IF NOT EXISTS idx_projects_country ON public.projects(country);

-- PASO 7: RLS Policies para las nuevas tablas
-- =====================================================

-- role_exploration_periods
ALTER TABLE public.role_exploration_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_exploration_select_own
  ON public.role_exploration_periods
  FOR SELECT
  TO authenticated
  USING (
    member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = role_exploration_periods.project_id
        AND p.owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY role_exploration_insert_owner
  ON public.role_exploration_periods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY role_exploration_update_own
  ON public.role_exploration_periods
  FOR UPDATE
  TO authenticated
  USING (
    member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = role_exploration_periods.project_id
        AND p.owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

-- role_preferences
ALTER TABLE public.role_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_preferences_select_own
  ON public.role_preferences
  FOR SELECT
  TO authenticated
  USING (member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

CREATE POLICY role_preferences_insert_own
  ON public.role_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

CREATE POLICY role_preferences_update_own
  ON public.role_preferences
  FOR UPDATE
  TO authenticated
  USING (member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

-- role_performance_metrics
ALTER TABLE public.role_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_performance_select_all
  ON public.role_performance_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY role_performance_insert_all
  ON public.role_performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- role_rotation_history
ALTER TABLE public.role_rotation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_rotation_select_all
  ON public.role_rotation_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY role_rotation_insert_all
  ON public.role_rotation_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- PASO 8: Triggers para updated_at
-- =====================================================

CREATE TRIGGER update_role_exploration_updated_at
  BEFORE UPDATE ON public.role_exploration_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_preferences_updated_at
  BEFORE UPDATE ON public.role_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- PASO 9: Grants (permisos)
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_exploration_periods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_performance_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_rotation_history TO authenticated;

-- PASO 10: Verificación
-- =====================================================

SELECT 'role_exploration_periods' as table_name, COUNT(*) as count FROM public.role_exploration_periods
UNION ALL
SELECT 'role_preferences', COUNT(*) FROM public.role_preferences
UNION ALL
SELECT 'role_performance_metrics', COUNT(*) FROM public.role_performance_metrics
UNION ALL
SELECT 'role_rotation_history', COUNT(*) FROM public.role_rotation_history;

-- =====================================================
-- ¡SETUP COMPLETO!
-- =====================================================
-- El sistema de rotación de roles está listo para usar
-- Próximo paso: Implementar el onboarding inteligente
-- =====================================================
