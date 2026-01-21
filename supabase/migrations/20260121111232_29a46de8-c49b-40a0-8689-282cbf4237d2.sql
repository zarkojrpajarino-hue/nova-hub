
-- ============================================
-- CAPA 4: SISTEMA MASTER
-- ============================================

-- 1. TABLA: master_applications (Aplicaciones para convertirse en Master)
CREATE TABLE IF NOT EXISTS public.master_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'approved', 'rejected', 'expired')),
  motivation TEXT NOT NULL,
  achievements JSONB DEFAULT '[]'::jsonb, -- Lista de logros destacados
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  votes_required INTEGER DEFAULT 5, -- Votos necesarios para aprobar
  voting_deadline TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. TABLA: master_votes (Votos de los compañeros)
CREATE TABLE IF NOT EXISTS public.master_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.master_applications(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote BOOLEAN NOT NULL, -- true = a favor, false = en contra
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(application_id, voter_id) -- Un voto por persona por aplicación
);

-- 3. TABLA: team_masters (Masters activos del equipo)
CREATE TABLE IF NOT EXISTS public.team_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 3), -- Nivel 1, 2, 3
  title TEXT, -- Título personalizado (ej: "Master AI Tech")
  appointed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Null = permanente hasta desafío
  is_active BOOLEAN DEFAULT true,
  total_mentees INTEGER DEFAULT 0,
  successful_defenses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role_name)
);

-- 4. TABLA: master_challenges (Desafíos al Master)
CREATE TABLE IF NOT EXISTS public.master_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  master_id UUID NOT NULL REFERENCES public.team_masters(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'declined', 'expired')),
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('performance', 'project', 'peer_vote')),
  description TEXT,
  criteria JSONB DEFAULT '{}'::jsonb, -- Criterios de evaluación
  deadline TIMESTAMP WITH TIME ZONE,
  result TEXT CHECK (result IN ('challenger_wins', 'master_wins', 'draw', null)),
  result_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. TABLA: master_mentoring (Mentorías del Master)
CREATE TABLE IF NOT EXISTS public.master_mentoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID NOT NULL REFERENCES public.team_masters(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  goals JSONB DEFAULT '[]'::jsonb,
  feedback TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(master_id, mentee_id, role_name)
);

-- 6. FUNCIÓN: Verificar elegibilidad para Master
CREATE OR REPLACE FUNCTION public.check_master_eligibility(
  p_user_id UUID,
  p_role TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_performance NUMERIC;
  v_months_in_role INTEGER;
  v_is_eligible BOOLEAN;
  v_reasons TEXT[] := '{}';
BEGIN
  -- Obtener rendimiento actual
  SELECT COALESCE(AVG(calculate_role_performance_score(pm.member_id, pm.project_id, pm.role)), 0)
  INTO v_performance
  FROM public.project_members pm
  WHERE pm.member_id = p_user_id AND pm.role = p_role;
  
  -- Calcular meses en el rol
  SELECT COALESCE(
    EXTRACT(MONTH FROM AGE(now(), MIN(pm.joined_at))),
    0
  )::INTEGER
  INTO v_months_in_role
  FROM public.project_members pm
  WHERE pm.member_id = p_user_id AND pm.role = p_role;
  
  -- Verificar criterios
  v_is_eligible := true;
  
  IF v_performance < 70 THEN
    v_is_eligible := false;
    v_reasons := array_append(v_reasons, 'Rendimiento mínimo requerido: 70%');
  END IF;
  
  IF v_months_in_role < 3 THEN
    v_is_eligible := false;
    v_reasons := array_append(v_reasons, 'Mínimo 3 meses en el rol');
  END IF;
  
  -- Verificar si ya es Master
  IF EXISTS (SELECT 1 FROM public.team_masters WHERE user_id = p_user_id AND role_name = p_role AND is_active = true) THEN
    v_is_eligible := false;
    v_reasons := array_append(v_reasons, 'Ya eres Master de este rol');
  END IF;
  
  -- Verificar si tiene aplicación pendiente
  IF EXISTS (SELECT 1 FROM public.master_applications WHERE user_id = p_user_id AND role_name = p_role AND status IN ('pending', 'voting')) THEN
    v_is_eligible := false;
    v_reasons := array_append(v_reasons, 'Ya tienes una aplicación en proceso');
  END IF;
  
  v_result := jsonb_build_object(
    'eligible', v_is_eligible,
    'performance', v_performance,
    'months_in_role', v_months_in_role,
    'reasons', to_jsonb(v_reasons)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. FUNCIÓN: Procesar resultado de votación
CREATE OR REPLACE FUNCTION public.process_master_application_vote()
RETURNS TRIGGER AS $$
DECLARE
  v_app RECORD;
  v_total_votes INTEGER;
BEGIN
  -- Obtener datos de la aplicación
  SELECT * INTO v_app FROM public.master_applications WHERE id = NEW.application_id;
  
  -- Contar votos
  SELECT 
    COUNT(*) FILTER (WHERE vote = true),
    COUNT(*) FILTER (WHERE vote = false)
  INTO v_app.votes_for, v_app.votes_against
  FROM public.master_votes
  WHERE application_id = NEW.application_id;
  
  -- Actualizar conteo en la aplicación
  UPDATE public.master_applications
  SET 
    votes_for = v_app.votes_for,
    votes_against = v_app.votes_against,
    updated_at = now()
  WHERE id = NEW.application_id;
  
  -- Verificar si se alcanzó el quórum de aprobación
  IF v_app.votes_for >= v_app.votes_required THEN
    -- Aprobar y crear Master
    UPDATE public.master_applications
    SET status = 'approved', reviewed_at = now()
    WHERE id = NEW.application_id;
    
    INSERT INTO public.team_masters (user_id, role_name, level, title)
    VALUES (v_app.user_id, v_app.role_name, 1, 'Master ' || v_app.role_name)
    ON CONFLICT (user_id, role_name) DO UPDATE
    SET is_active = true, level = 1, appointed_at = now();
  END IF;
  
  -- Verificar si se alcanzó el quórum de rechazo
  IF v_app.votes_against >= v_app.votes_required THEN
    UPDATE public.master_applications
    SET status = 'rejected', reviewed_at = now()
    WHERE id = NEW.application_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. TRIGGER: Procesar votos automáticamente
DROP TRIGGER IF EXISTS trigger_process_master_vote ON public.master_votes;
CREATE TRIGGER trigger_process_master_vote
  AFTER INSERT ON public.master_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.process_master_application_vote();

-- 9. RLS POLICIES

-- master_applications
ALTER TABLE public.master_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applications viewable by authenticated"
ON public.master_applications FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create own applications"
ON public.master_applications FOR INSERT
WITH CHECK (user_id = get_profile_id(auth.uid()));

CREATE POLICY "Users can update own pending applications"
ON public.master_applications FOR UPDATE
USING (user_id = get_profile_id(auth.uid()) AND status = 'pending');

-- master_votes
ALTER TABLE public.master_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes viewable by authenticated"
ON public.master_votes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can vote"
ON public.master_votes FOR INSERT
WITH CHECK (
  voter_id = get_profile_id(auth.uid()) AND
  voter_id != (SELECT user_id FROM public.master_applications WHERE id = application_id)
);

-- team_masters
ALTER TABLE public.team_masters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters viewable by all authenticated"
ON public.team_masters FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage masters"
ON public.team_masters FOR ALL
USING (auth.uid() IS NOT NULL);

-- master_challenges
ALTER TABLE public.master_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by authenticated"
ON public.master_challenges FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can create challenges"
ON public.master_challenges FOR INSERT
WITH CHECK (challenger_id = get_profile_id(auth.uid()));

CREATE POLICY "Participants can update challenges"
ON public.master_challenges FOR UPDATE
USING (
  challenger_id = get_profile_id(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.team_masters tm WHERE tm.id = master_id AND tm.user_id = get_profile_id(auth.uid()))
);

-- master_mentoring
ALTER TABLE public.master_mentoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentoring viewable by participants"
ON public.master_mentoring FOR SELECT
USING (
  mentee_id = get_profile_id(auth.uid()) OR
  EXISTS (SELECT 1 FROM public.team_masters tm WHERE tm.id = master_id AND tm.user_id = get_profile_id(auth.uid()))
);

CREATE POLICY "Masters can create mentoring"
ON public.master_mentoring FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_masters tm WHERE tm.id = master_id AND tm.user_id = get_profile_id(auth.uid()))
);

-- 10. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_master_applications_user ON public.master_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_master_applications_status ON public.master_applications(status);
CREATE INDEX IF NOT EXISTS idx_master_votes_application ON public.master_votes(application_id);
CREATE INDEX IF NOT EXISTS idx_team_masters_user ON public.team_masters(user_id);
CREATE INDEX IF NOT EXISTS idx_team_masters_role ON public.team_masters(role_name);
CREATE INDEX IF NOT EXISTS idx_master_challenges_master ON public.master_challenges(master_id);
