
-- ============================================
-- CAPA 1: FUNDACIÓN DEL SCHEMA - MI DESARROLLO
-- ============================================

-- 1. EXTENDER project_members con campos de rol
ALTER TABLE public.project_members
ADD COLUMN IF NOT EXISTS role_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS role_responsibilities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS performance_score NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_performance_update TIMESTAMP WITH TIME ZONE;

-- 2. TABLA: user_insights (Diario de aprendizajes personales)
CREATE TABLE IF NOT EXISTS public.user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  role_context TEXT, -- Rol en el que se generó el insight
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('aprendizaje', 'reflexion', 'error', 'exito', 'idea')),
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TABLA: user_playbooks (Playbooks personales generados por IA)
CREATE TABLE IF NOT EXISTS public.user_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  contenido JSONB NOT NULL, -- Estructura: {sections: [{title, content, tips}]}
  fortalezas TEXT[] DEFAULT '{}',
  areas_mejora TEXT[] DEFAULT '{}',
  objetivos_sugeridos JSONB DEFAULT '[]'::jsonb,
  ai_model TEXT, -- Modelo usado para generar
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TABLA: role_rankings (Cache de rankings por rol)
CREATE TABLE IF NOT EXISTS public.role_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ranking_position INTEGER NOT NULL,
  score NUMERIC(10,2) NOT NULL DEFAULT 0,
  previous_position INTEGER,
  metrics JSONB DEFAULT '{}'::jsonb, -- Métricas usadas para calcular
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role_name, user_id, project_id, period_start, period_end)
);

-- 5. VISTA: Rendimiento de usuario por rol (calculado en tiempo real)
CREATE OR REPLACE VIEW public.user_role_performance AS
SELECT 
  pm.member_id as user_id,
  pm.role as role_name,
  pm.project_id,
  p.nombre as project_name,
  pr.nombre as user_name,
  pm.is_lead,
  pm.role_accepted,
  pm.performance_score,
  -- Métricas de tareas
  COALESCE(task_stats.total_tasks, 0) as total_tasks,
  COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
  COALESCE(task_stats.completion_rate, 0) as task_completion_rate,
  -- Métricas de OBVs
  COALESCE(obv_stats.total_obvs, 0) as total_obvs,
  COALESCE(obv_stats.validated_obvs, 0) as validated_obvs,
  COALESCE(obv_stats.total_facturacion, 0) as total_facturacion,
  -- Métricas de leads (para roles comerciales)
  COALESCE(lead_stats.total_leads, 0) as total_leads,
  COALESCE(lead_stats.leads_ganados, 0) as leads_ganados,
  COALESCE(lead_stats.conversion_rate, 0) as lead_conversion_rate,
  pm.joined_at
FROM public.project_members pm
JOIN public.profiles pr ON pr.id = pm.member_id
JOIN public.projects p ON p.id = pm.project_id
-- Subquery para estadísticas de tareas
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
    CASE WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE status = 'done')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0 
    END as completion_rate
  FROM public.tasks t
  WHERE t.assignee_id = pm.member_id AND t.project_id = pm.project_id
) task_stats ON true
-- Subquery para estadísticas de OBVs
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_obvs,
    COUNT(*) FILTER (WHERE status = 'validated') as validated_obvs,
    COALESCE(SUM(facturacion) FILTER (WHERE status = 'validated'), 0) as total_facturacion
  FROM public.obvs o
  WHERE o.owner_id = pm.member_id AND o.project_id = pm.project_id
) obv_stats ON true
-- Subquery para estadísticas de leads
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE status = 'cerrado_ganado') as leads_ganados,
    CASE WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE status = 'cerrado_ganado')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM public.leads l
  WHERE l.responsable_id = pm.member_id AND l.project_id = pm.project_id
) lead_stats ON true;

-- 6. FUNCIÓN: Calcular score de rendimiento por rol
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
  -- Obtener métricas
  SELECT 
    COALESCE(task_completion_rate, 0),
    COALESCE(validated_obvs, 0),
    COALESCE(lead_conversion_rate, 0)
  INTO v_task_rate, v_obv_count, v_lead_rate
  FROM public.user_role_performance
  WHERE user_id = p_user_id AND project_id = p_project_id AND role_name = p_role;
  
  -- Calcular score ponderado
  v_score := (v_task_rate * v_task_weight) + 
             (LEAST(v_obv_count * 10, 100) * v_obv_weight) + 
             (v_lead_rate * v_lead_weight);
  
  -- Ajustar pesos según el rol
  IF p_role IN ('comercial', 'closer') THEN
    v_score := (v_task_rate * 0.2) + (v_obv_count * 10 * 0.3) + (v_lead_rate * 0.5);
  ELSIF p_role IN ('operaciones', 'tecnico') THEN
    v_score := (v_task_rate * 0.5) + (v_obv_count * 10 * 0.4) + (v_lead_rate * 0.1);
  END IF;
  
  RETURN ROUND(LEAST(v_score, 100), 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. FUNCIÓN: Actualizar rankings de un rol
CREATE OR REPLACE FUNCTION public.update_role_rankings(
  p_role TEXT,
  p_period_start DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE,
  p_period_end DATE DEFAULT (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::DATE
) RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_position INTEGER := 0;
BEGIN
  -- Calcular y actualizar rankings para todos los usuarios con este rol
  FOR v_user IN 
    SELECT DISTINCT 
      pm.member_id,
      pm.project_id,
      calculate_role_performance_score(pm.member_id, pm.project_id, pm.role) as score
    FROM public.project_members pm
    WHERE pm.role = p_role
    ORDER BY score DESC
  LOOP
    v_position := v_position + 1;
    
    INSERT INTO public.role_rankings (
      role_name, user_id, project_id, ranking_position, score,
      previous_position, period_start, period_end, calculated_at
    )
    VALUES (
      p_role, v_user.member_id, v_user.project_id, v_position, v_user.score,
      (SELECT ranking_position FROM public.role_rankings 
       WHERE user_id = v_user.member_id AND role_name = p_role 
       ORDER BY calculated_at DESC LIMIT 1),
      p_period_start, p_period_end, now()
    )
    ON CONFLICT (role_name, user_id, project_id, period_start, period_end) 
    DO UPDATE SET 
      ranking_position = EXCLUDED.ranking_position,
      score = EXCLUDED.score,
      previous_position = role_rankings.ranking_position,
      calculated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. RLS POLICIES

-- user_insights
ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
ON public.user_insights FOR SELECT
USING (user_id = get_profile_id(auth.uid()) OR is_private = false);

CREATE POLICY "Users can create own insights"
ON public.user_insights FOR INSERT
WITH CHECK (user_id = get_profile_id(auth.uid()));

CREATE POLICY "Users can update own insights"
ON public.user_insights FOR UPDATE
USING (user_id = get_profile_id(auth.uid()));

CREATE POLICY "Users can delete own insights"
ON public.user_insights FOR DELETE
USING (user_id = get_profile_id(auth.uid()));

-- user_playbooks
ALTER TABLE public.user_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playbooks"
ON public.user_playbooks FOR SELECT
USING (user_id = get_profile_id(auth.uid()));

CREATE POLICY "Users can create own playbooks"
ON public.user_playbooks FOR INSERT
WITH CHECK (user_id = get_profile_id(auth.uid()));

CREATE POLICY "Users can update own playbooks"
ON public.user_playbooks FOR UPDATE
USING (user_id = get_profile_id(auth.uid()));

-- role_rankings
ALTER TABLE public.role_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rankings viewable by authenticated"
ON public.role_rankings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can update rankings"
ON public.role_rankings FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can modify rankings"
ON public.role_rankings FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- 9. ÍNDICES para rendimiento
CREATE INDEX IF NOT EXISTS idx_user_insights_user ON public.user_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_insights_project ON public.user_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_user_playbooks_user ON public.user_playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_role_rankings_role ON public.role_rankings(role_name);
CREATE INDEX IF NOT EXISTS idx_role_rankings_user ON public.role_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_role_rankings_period ON public.role_rankings(period_start, period_end);
