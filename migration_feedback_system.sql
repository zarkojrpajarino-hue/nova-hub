-- =====================================================
-- MIGRATION: SISTEMA DE FEEDBACK 360° Y EVALUACIÓN
-- =====================================================
-- Implementa el sistema completo de peer feedback y evaluación de roles
-- Ver documentación: SISTEMA_FEEDBACK_Y_EVALUACION_PROFESIONAL.md
-- =====================================================

-- PASO 1: Crear tabla de peer feedback (360°)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.peer_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Metadata
  from_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  to_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role_evaluated specialization_role NOT NULL,
  exploration_period_id UUID REFERENCES public.role_exploration_periods(id) ON DELETE CASCADE,

  -- Ratings (1-5 estrellas)
  collaboration_rating INTEGER CHECK (collaboration_rating >= 1 AND collaboration_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  initiative_rating INTEGER CHECK (initiative_rating >= 1 AND initiative_rating <= 5),
  technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),

  -- Comentarios
  strengths TEXT,
  improvements TEXT,
  would_work_again BOOLEAN,

  -- Configuración
  is_anonymous BOOLEAN DEFAULT false,
  feedback_type TEXT DEFAULT 'end_exploration' CHECK (feedback_type IN ('mid_exploration', 'end_exploration', 'ongoing')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CHECK (from_member_id != to_member_id),
  UNIQUE(from_member_id, to_member_id, exploration_period_id)
);

-- Índices para peer_feedback
CREATE INDEX IF NOT EXISTS idx_peer_feedback_to_member ON public.peer_feedback(to_member_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_from_member ON public.peer_feedback(from_member_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_exploration ON public.peer_feedback(exploration_period_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_project ON public.peer_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_created ON public.peer_feedback(created_at DESC);

-- =====================================================
-- PASO 2: Actualizar tabla role_exploration_periods
-- =====================================================

ALTER TABLE public.role_exploration_periods
  ADD COLUMN IF NOT EXISTS peer_feedback_avg DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS peer_feedback_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner_fit_rating INTEGER CHECK (owner_fit_rating >= 1 AND owner_fit_rating <= 5),
  ADD COLUMN IF NOT EXISTS owner_impact_rating INTEGER CHECK (owner_impact_rating >= 1 AND owner_impact_rating <= 5),
  ADD COLUMN IF NOT EXISTS owner_comments TEXT,
  ADD COLUMN IF NOT EXISTS initiative_obvs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS competing_with UUID[],
  ADD COLUMN IF NOT EXISTS is_shared_role BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS final_decision TEXT CHECK (final_decision IN ('assigned', 'extended', 'rotated', 'removed'));

-- =====================================================
-- PASO 3: Crear tabla de resultados de competencia
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_competition_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role specialization_role NOT NULL,

  -- Participantes
  participants UUID[] NOT NULL,

  -- Resultados
  winners UUID[],
  fit_scores JSONB,
  decision_type TEXT CHECK (decision_type IN ('clear_winner', 'shared_role', 'extended_all', 'rotated_all')),

  -- Razón y contexto
  decision_reason TEXT,
  decided_by UUID REFERENCES public.members(id),
  decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_competition_project ON public.role_competition_results(project_id);
CREATE INDEX IF NOT EXISTS idx_role_competition_role ON public.role_competition_results(role);
CREATE INDEX IF NOT EXISTS idx_role_competition_created ON public.role_competition_results(created_at DESC);

-- =====================================================
-- PASO 4: Crear tabla de historial de feedback
-- =====================================================

CREATE TABLE IF NOT EXISTS public.feedback_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  role specialization_role,

  -- Período
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Promedios
  avg_collaboration DECIMAL(3,2),
  avg_quality DECIMAL(3,2),
  avg_communication DECIMAL(3,2),
  avg_initiative DECIMAL(3,2),
  avg_technical DECIMAL(3,2),
  avg_overall DECIMAL(3,2),

  -- Metadata
  total_feedback_received INTEGER DEFAULT 0,
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_summary_member ON public.feedback_summary(member_id);
CREATE INDEX IF NOT EXISTS idx_feedback_summary_role ON public.feedback_summary(role);
CREATE INDEX IF NOT EXISTS idx_feedback_summary_period ON public.feedback_summary(period_end DESC);

-- =====================================================
-- PASO 5: RLS Policies para peer_feedback
-- =====================================================

ALTER TABLE public.peer_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Ver feedback que TE dieron (si no es anónimo) o que TÚ diste
CREATE POLICY peer_feedback_select_involved
  ON public.peer_feedback
  FOR SELECT
  TO authenticated
  USING (
    -- Puedes ver feedback que diste
    from_member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    OR
    -- Puedes ver feedback que te dieron (solo si no es anónimo)
    (to_member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()) AND is_anonymous = false)
    OR
    -- Project owners pueden ver todo el feedback de su proyecto
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = peer_feedback.project_id
        AND p.owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

-- Policy: Insertar feedback
CREATE POLICY peer_feedback_insert_own
  ON public.peer_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Solo puedes dar feedback desde tu propia cuenta
    from_member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    AND
    -- Debes ser miembro del proyecto
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = peer_feedback.project_id
        AND pm.member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

-- Policy: Actualizar tu propio feedback
CREATE POLICY peer_feedback_update_own
  ON public.peer_feedback
  FOR UPDATE
  TO authenticated
  USING (from_member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()))
  WITH CHECK (from_member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid()));

-- =====================================================
-- PASO 6: RLS Policies para role_competition_results
-- =====================================================

ALTER TABLE public.role_competition_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY competition_results_select_involved
  ON public.role_competition_results
  FOR SELECT
  TO authenticated
  USING (
    -- Puedes ver si participaste
    (SELECT id FROM public.members WHERE auth_id = auth.uid()) = ANY(participants)
    OR
    -- O si eres el owner del proyecto
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = role_competition_results.project_id
        AND p.owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY competition_results_insert_owner
  ON public.role_competition_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

-- =====================================================
-- PASO 7: RLS Policies para feedback_summary
-- =====================================================

ALTER TABLE public.feedback_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_summary_select_own
  ON public.feedback_summary
  FOR SELECT
  TO authenticated
  USING (
    member_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = feedback_summary.project_id
        AND p.owner_id = (SELECT id FROM public.members WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY feedback_summary_insert_all
  ON public.feedback_summary
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- PASO 8: Función para calcular promedio de peer feedback
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_peer_feedback_average(exploration_period_id_param UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  avg_score DECIMAL(3,2);
BEGIN
  SELECT
    ROUND(AVG(
      (collaboration_rating + quality_rating + communication_rating +
       initiative_rating + technical_skills_rating) / 5.0
    ), 2)
  INTO avg_score
  FROM public.peer_feedback
  WHERE exploration_period_id = exploration_period_id_param;

  RETURN COALESCE(avg_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 9: Trigger para actualizar peer_feedback_avg automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_exploration_peer_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el promedio y contador en role_exploration_periods
  UPDATE public.role_exploration_periods
  SET
    peer_feedback_avg = calculate_peer_feedback_average(NEW.exploration_period_id),
    peer_feedback_count = (
      SELECT COUNT(*)
      FROM public.peer_feedback
      WHERE exploration_period_id = NEW.exploration_period_id
    )
  WHERE id = NEW.exploration_period_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_peer_feedback_avg
  AFTER INSERT OR UPDATE ON public.peer_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_exploration_peer_feedback();

-- =====================================================
-- PASO 10: Vista para ver feedback recibido (agregado)
-- =====================================================

CREATE OR REPLACE VIEW public.member_feedback_overview AS
SELECT
  m.id as member_id,
  m.nombre,
  m.email,
  pf.role_evaluated,
  COUNT(pf.id) as total_feedback_received,
  ROUND(AVG(pf.collaboration_rating), 2) as avg_collaboration,
  ROUND(AVG(pf.quality_rating), 2) as avg_quality,
  ROUND(AVG(pf.communication_rating), 2) as avg_communication,
  ROUND(AVG(pf.initiative_rating), 2) as avg_initiative,
  ROUND(AVG(pf.technical_skills_rating), 2) as avg_technical,
  ROUND(AVG((pf.collaboration_rating + pf.quality_rating + pf.communication_rating +
             pf.initiative_rating + pf.technical_skills_rating) / 5.0), 2) as avg_overall,
  SUM(CASE WHEN pf.would_work_again = true THEN 1 ELSE 0 END) as would_work_again_count
FROM public.members m
LEFT JOIN public.peer_feedback pf ON pf.to_member_id = m.id
GROUP BY m.id, m.nombre, m.email, pf.role_evaluated;

-- Dar permisos a la vista
GRANT SELECT ON public.member_feedback_overview TO authenticated;

-- =====================================================
-- PASO 11: Vista para competiciones activas
-- =====================================================

CREATE OR REPLACE VIEW public.active_role_competitions AS
SELECT
  rep.project_id,
  p.nombre as project_name,
  rep.role,
  COUNT(DISTINCT rep.member_id) as participants_count,
  ARRAY_AGG(DISTINCT m.nombre) as participant_names,
  MIN(rep.end_date) as competition_end_date,
  AVG(rep.fit_score) as avg_fit_score,
  MAX(rep.fit_score) as top_fit_score
FROM public.role_exploration_periods rep
JOIN public.projects p ON p.id = rep.project_id
JOIN public.members m ON m.id = rep.member_id
WHERE rep.status = 'active'
  AND rep.competing_with IS NOT NULL
  AND array_length(rep.competing_with, 1) > 0
GROUP BY rep.project_id, p.nombre, rep.role;

GRANT SELECT ON public.active_role_competitions TO authenticated;

-- =====================================================
-- PASO 12: Grants (Permisos)
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.peer_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_competition_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_summary TO authenticated;

-- Permitir usar la función de cálculo
GRANT EXECUTE ON FUNCTION calculate_peer_feedback_average(UUID) TO authenticated;

-- =====================================================
-- PASO 13: Datos de ejemplo (OPCIONAL - para testing)
-- =====================================================

-- Descomentar esto si quieres datos de prueba

/*
-- Ejemplo de peer feedback
INSERT INTO public.peer_feedback (
  from_member_id,
  to_member_id,
  project_id,
  role_evaluated,
  collaboration_rating,
  quality_rating,
  communication_rating,
  initiative_rating,
  technical_skills_rating,
  strengths,
  improvements,
  would_work_again,
  is_anonymous
) VALUES (
  'member-id-1',
  'member-id-2',
  'project-id',
  'marketing',
  5,
  4,
  5,
  4,
  4,
  'Excelente colaboración y comunicación. Siempre dispuesto a ayudar.',
  'Podría mejorar en la organización de tareas.',
  true,
  false
);
*/

-- =====================================================
-- PASO 14: Verificación
-- =====================================================

-- Ver tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('peer_feedback', 'role_competition_results', 'feedback_summary')
ORDER BY table_name;

-- Ver vistas creadas
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('member_feedback_overview', 'active_role_competitions')
ORDER BY table_name;

-- Ver políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('peer_feedback', 'role_competition_results', 'feedback_summary')
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ MIGRATION COMPLETADA
-- =====================================================
-- El sistema de feedback 360° está listo para usar
-- Próximo paso: Implementar UI components
-- =====================================================
