
-- Tabla para solicitudes de rotación/intercambio de roles
CREATE TABLE public.role_rotation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id),
  requester_project_id UUID NOT NULL REFERENCES public.projects(id),
  requester_current_role TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id),
  target_project_id UUID REFERENCES public.projects(id),
  target_role TEXT,
  request_type TEXT NOT NULL DEFAULT 'swap' CHECK (request_type IN ('swap', 'transfer', 'rotation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  reason TEXT,
  compatibility_score NUMERIC,
  compatibility_analysis JSONB DEFAULT '{}'::jsonb,
  requester_accepted BOOLEAN DEFAULT false,
  target_accepted BOOLEAN DEFAULT false,
  admin_approved BOOLEAN,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla para historial de cambios de rol
CREATE TABLE public.role_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  old_role TEXT,
  new_role TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('assignment', 'swap', 'transfer', 'rotation', 'promotion')),
  rotation_request_id UUID REFERENCES public.role_rotation_requests(id),
  previous_performance_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.role_rotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_history ENABLE ROW LEVEL SECURITY;

-- Políticas para role_rotation_requests
CREATE POLICY "Rotation requests viewable by authenticated"
ON public.role_rotation_requests FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create rotation requests"
ON public.role_rotation_requests FOR INSERT
WITH CHECK (requester_id = get_profile_id(auth.uid()));

CREATE POLICY "Participants can update rotation requests"
ON public.role_rotation_requests FOR UPDATE
USING (
  requester_id = get_profile_id(auth.uid()) OR 
  target_user_id = get_profile_id(auth.uid()) OR
  has_role(get_profile_id(auth.uid()), 'admin')
);

-- Políticas para role_history
CREATE POLICY "Role history viewable by authenticated"
ON public.role_history FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert role history"
ON public.role_history FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Función para calcular compatibilidad de rotación
CREATE OR REPLACE FUNCTION public.calculate_rotation_compatibility(
  p_user1_id UUID,
  p_user2_id UUID,
  p_role1 TEXT,
  p_role2 TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user1_perf NUMERIC;
  v_user2_perf NUMERIC;
  v_user1_experience INTEGER;
  v_user2_experience INTEGER;
  v_compatibility_score NUMERIC;
  v_analysis JSONB;
BEGIN
  -- Obtener rendimiento actual de cada usuario en su rol
  SELECT COALESCE(AVG(performance_score), 50) INTO v_user1_perf
  FROM public.project_members WHERE member_id = p_user1_id;
  
  SELECT COALESCE(AVG(performance_score), 50) INTO v_user2_perf
  FROM public.project_members WHERE member_id = p_user2_id;
  
  -- Calcular experiencia (meses en roles similares)
  SELECT COUNT(*) INTO v_user1_experience
  FROM public.role_history WHERE user_id = p_user1_id AND new_role = p_role2;
  
  SELECT COUNT(*) INTO v_user2_experience
  FROM public.role_history WHERE user_id = p_user2_id AND new_role = p_role1;
  
  -- Calcular score de compatibilidad
  v_compatibility_score := (
    (v_user1_perf + v_user2_perf) / 2 * 0.4 +
    LEAST((v_user1_experience + v_user2_experience) * 10, 30) +
    30 -- Base score
  );
  
  v_analysis := jsonb_build_object(
    'score', ROUND(v_compatibility_score, 2),
    'user1_performance', v_user1_perf,
    'user2_performance', v_user2_perf,
    'user1_target_experience', v_user1_experience,
    'user2_target_experience', v_user2_experience,
    'recommendation', CASE 
      WHEN v_compatibility_score >= 80 THEN 'highly_recommended'
      WHEN v_compatibility_score >= 60 THEN 'recommended'
      WHEN v_compatibility_score >= 40 THEN 'neutral'
      ELSE 'not_recommended'
    END,
    'risks', CASE 
      WHEN v_user1_perf < 50 OR v_user2_perf < 50 THEN '["low_performance_risk"]'::jsonb
      ELSE '[]'::jsonb
    END
  );
  
  RETURN v_analysis;
END;
$$;

-- Función para procesar la rotación cuando ambas partes aceptan
CREATE OR REPLACE FUNCTION public.process_role_rotation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_req RECORD;
BEGIN
  -- Solo procesar si ambos aceptaron y es un swap
  IF NEW.requester_accepted = true AND NEW.target_accepted = true AND NEW.status = 'pending' AND NEW.request_type = 'swap' THEN
    SELECT * INTO v_req FROM public.role_rotation_requests WHERE id = NEW.id;
    
    -- Registrar en historial para el solicitante
    INSERT INTO public.role_history (user_id, project_id, old_role, new_role, change_type, rotation_request_id, previous_performance_score)
    SELECT 
      NEW.requester_id, 
      NEW.requester_project_id, 
      NEW.requester_current_role,
      NEW.target_role,
      'swap',
      NEW.id,
      pm.performance_score
    FROM public.project_members pm 
    WHERE pm.member_id = NEW.requester_id AND pm.project_id = NEW.requester_project_id
    LIMIT 1;
    
    -- Registrar en historial para el objetivo
    INSERT INTO public.role_history (user_id, project_id, old_role, new_role, change_type, rotation_request_id, previous_performance_score)
    SELECT 
      NEW.target_user_id, 
      NEW.target_project_id, 
      NEW.target_role,
      NEW.requester_current_role,
      'swap',
      NEW.id,
      pm.performance_score
    FROM public.project_members pm 
    WHERE pm.member_id = NEW.target_user_id AND pm.project_id = NEW.target_project_id
    LIMIT 1;
    
    -- Actualizar roles (resetear performance scores)
    UPDATE public.project_members 
    SET role = NEW.target_role::specialization_role, performance_score = 0, role_accepted = false
    WHERE member_id = NEW.requester_id AND project_id = NEW.requester_project_id;
    
    UPDATE public.project_members 
    SET role = NEW.requester_current_role::specialization_role, performance_score = 0, role_accepted = false
    WHERE member_id = NEW.target_user_id AND project_id = NEW.target_project_id;
    
    -- Marcar como completado
    NEW.status := 'completed';
    NEW.completed_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para procesar rotaciones
CREATE TRIGGER trigger_process_role_rotation
BEFORE UPDATE ON public.role_rotation_requests
FOR EACH ROW
EXECUTE FUNCTION public.process_role_rotation();

-- Índices para performance
CREATE INDEX idx_rotation_requests_requester ON public.role_rotation_requests(requester_id);
CREATE INDEX idx_rotation_requests_target ON public.role_rotation_requests(target_user_id);
CREATE INDEX idx_rotation_requests_status ON public.role_rotation_requests(status);
CREATE INDEX idx_role_history_user ON public.role_history(user_id);
CREATE INDEX idx_role_history_project ON public.role_history(project_id);
