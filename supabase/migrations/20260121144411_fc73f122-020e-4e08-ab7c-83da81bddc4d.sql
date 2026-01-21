-- Tabla para el orden de validación (rotativo mensual)
CREATE TABLE public.validation_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  position INTEGER NOT NULL,
  month_year TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, month_year),
  UNIQUE(position, month_year)
);

-- Tabla para tracking de validaciones pendientes
CREATE TABLE public.pending_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_id UUID REFERENCES public.kpis(id) ON DELETE CASCADE,
  obv_id UUID REFERENCES public.obvs(id) ON DELETE CASCADE,
  validator_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('kpi', 'obv')),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  validated_at TIMESTAMP WITH TIME ZONE,
  is_late BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT check_one_item CHECK (
    (kpi_id IS NOT NULL AND obv_id IS NULL) OR
    (kpi_id IS NULL AND obv_id IS NOT NULL)
  )
);

-- Tabla para estadísticas de validador
CREATE TABLE public.validator_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_validations INTEGER DEFAULT 0,
  on_time_validations INTEGER DEFAULT 0,
  late_validations INTEGER DEFAULT 0,
  missed_validations INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.validation_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validator_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para validation_order
CREATE POLICY "Validation order viewable by authenticated"
  ON public.validation_order FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify validation order"
  ON public.validation_order FOR ALL
  USING (has_role(get_profile_id(auth.uid()), 'admin'::app_role));

-- Políticas para pending_validations
CREATE POLICY "Pending validations viewable by authenticated"
  ON public.pending_validations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage pending validations"
  ON public.pending_validations FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Políticas para validator_stats
CREATE POLICY "Validator stats viewable by authenticated"
  ON public.validator_stats FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage validator stats"
  ON public.validator_stats FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Función para obtener los 3 validadores de un usuario
CREATE OR REPLACE FUNCTION public.get_validators_for_user(p_user_id UUID)
RETURNS TABLE(validator_id UUID) AS $$
DECLARE
  v_position INTEGER;
  v_month TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
  v_total INTEGER;
BEGIN
  -- Obtener posición del usuario
  SELECT position INTO v_position
  FROM public.validation_order
  WHERE user_id = p_user_id AND month_year = v_month;
  
  -- Obtener total de usuarios
  SELECT COUNT(*) INTO v_total
  FROM public.validation_order
  WHERE month_year = v_month;
  
  IF v_position IS NULL OR v_total < 4 THEN
    RETURN;
  END IF;
  
  -- Retornar los 3 usuarios por encima (circular)
  RETURN QUERY
  SELECT vo.user_id
  FROM public.validation_order vo
  WHERE vo.month_year = v_month
    AND vo.position IN (
      CASE WHEN v_position - 1 < 1 THEN v_total + (v_position - 1) ELSE v_position - 1 END,
      CASE WHEN v_position - 2 < 1 THEN v_total + (v_position - 2) ELSE v_position - 2 END,
      CASE WHEN v_position - 3 < 1 THEN v_total + (v_position - 3) ELSE v_position - 3 END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función para verificar si un usuario está bloqueado
CREATE OR REPLACE FUNCTION public.is_user_blocked(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.validator_stats
    WHERE user_id = p_user_id 
    AND is_blocked = true 
    AND (blocked_until IS NULL OR blocked_until > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para crear pending_validations cuando se sube un KPI
CREATE OR REPLACE FUNCTION public.create_kpi_pending_validations()
RETURNS TRIGGER AS $$
DECLARE
  v_validator UUID;
BEGIN
  -- Solo para nuevos KPIs pendientes
  IF NEW.status = 'pending' THEN
    -- Crear una entrada de pending_validation para cada validador
    FOR v_validator IN 
      SELECT validator_id FROM public.get_validators_for_user(NEW.owner_id)
    LOOP
      INSERT INTO public.pending_validations (
        kpi_id, validator_id, owner_id, item_type, deadline
      ) VALUES (
        NEW.id, v_validator, NEW.owner_id, 'kpi', now() + INTERVAL '3 days'
      );
      
      -- Enviar notificación al validador
      INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
      VALUES (
        v_validator,
        'KPI pendiente de validar',
        'Tienes 3 días para validar un KPI. ¡No te retrases!',
        'validacion_pendiente',
        '/kpis'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_kpi_pending_validations
  AFTER INSERT ON public.kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.create_kpi_pending_validations();

-- Trigger para crear pending_validations cuando se sube una OBV
CREATE OR REPLACE FUNCTION public.create_obv_pending_validations()
RETURNS TRIGGER AS $$
DECLARE
  v_validator UUID;
BEGIN
  -- Solo para nuevas OBVs pendientes
  IF NEW.status = 'pending' THEN
    -- Crear una entrada de pending_validation para cada validador
    FOR v_validator IN 
      SELECT validator_id FROM public.get_validators_for_user(NEW.owner_id)
    LOOP
      INSERT INTO public.pending_validations (
        obv_id, validator_id, owner_id, item_type, deadline
      ) VALUES (
        NEW.id, v_validator, NEW.owner_id, 'obv', now() + INTERVAL '3 days'
      );
      
      -- Enviar notificación al validador
      INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
      VALUES (
        v_validator,
        'OBV pendiente de validar',
        'Tienes 3 días para validar una OBV. ¡No te retrases!',
        'validacion_pendiente',
        '/obvs'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_obv_pending_validations
  AFTER INSERT ON public.obvs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_obv_pending_validations();

-- Función para marcar validación como completada y actualizar stats
CREATE OR REPLACE FUNCTION public.mark_validation_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_pending RECORD;
  v_is_late BOOLEAN;
BEGIN
  -- Buscar pending_validation correspondiente para KPIs
  IF TG_TABLE_NAME = 'kpi_validaciones' THEN
    SELECT * INTO v_pending
    FROM public.pending_validations
    WHERE kpi_id = NEW.kpi_id 
      AND validator_id = NEW.validator_id
      AND validated_at IS NULL
    LIMIT 1;
  -- Para OBVs
  ELSIF TG_TABLE_NAME = 'obv_validaciones' THEN
    SELECT * INTO v_pending
    FROM public.pending_validations
    WHERE obv_id = NEW.obv_id 
      AND validator_id = NEW.validator_id
      AND validated_at IS NULL
    LIMIT 1;
  END IF;
  
  IF v_pending IS NOT NULL THEN
    v_is_late := now() > v_pending.deadline;
    
    -- Actualizar pending_validation
    UPDATE public.pending_validations
    SET validated_at = now(), is_late = v_is_late
    WHERE id = v_pending.id;
    
    -- Actualizar stats del validador
    INSERT INTO public.validator_stats (user_id, total_validations, on_time_validations, late_validations)
    VALUES (NEW.validator_id, 1, CASE WHEN v_is_late THEN 0 ELSE 1 END, CASE WHEN v_is_late THEN 1 ELSE 0 END)
    ON CONFLICT (user_id) DO UPDATE SET
      total_validations = validator_stats.total_validations + 1,
      on_time_validations = validator_stats.on_time_validations + CASE WHEN v_is_late THEN 0 ELSE 1 END,
      late_validations = validator_stats.late_validations + CASE WHEN v_is_late THEN 1 ELSE 0 END,
      -- Desbloquear si no tiene pendientes vencidas
      is_blocked = EXISTS (
        SELECT 1 FROM public.pending_validations pv
        WHERE pv.validator_id = NEW.validator_id
        AND pv.validated_at IS NULL
        AND pv.deadline < now()
      ),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_kpi_validation_complete
  AFTER INSERT ON public.kpi_validaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_validation_complete();

CREATE TRIGGER trigger_obv_validation_complete
  AFTER INSERT ON public.obv_validaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_validation_complete();

-- Función para bloquear usuarios con validaciones vencidas
CREATE OR REPLACE FUNCTION public.check_and_block_late_validators()
RETURNS void AS $$
BEGIN
  -- Bloquear usuarios con validaciones vencidas no completadas
  UPDATE public.validator_stats vs
  SET 
    is_blocked = true,
    missed_validations = (
      SELECT COUNT(*) FROM public.pending_validations pv
      WHERE pv.validator_id = vs.user_id
      AND pv.validated_at IS NULL
      AND pv.deadline < now()
    ),
    updated_at = now()
  WHERE EXISTS (
    SELECT 1 FROM public.pending_validations pv
    WHERE pv.validator_id = vs.user_id
    AND pv.validated_at IS NULL
    AND pv.deadline < now()
  );
  
  -- Enviar notificación de bloqueo
  INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
  SELECT DISTINCT pv.validator_id, 
    '⚠️ Estás bloqueado',
    'No puedes subir KPIs hasta que valides tus pendientes.',
    'bloqueo',
    '/kpis'
  FROM public.pending_validations pv
  JOIN public.validator_stats vs ON vs.user_id = pv.validator_id
  WHERE pv.validated_at IS NULL
  AND pv.deadline < now()
  AND vs.is_blocked = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función para rotar el orden mensualmente
CREATE OR REPLACE FUNCTION public.rotate_validation_order()
RETURNS void AS $$
DECLARE
  v_month TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
  v_last_month TEXT := to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM');
  v_user RECORD;
  v_new_position INTEGER;
  v_total INTEGER;
BEGIN
  -- Verificar si ya existe para este mes
  IF EXISTS (SELECT 1 FROM public.validation_order WHERE month_year = v_month) THEN
    RETURN;
  END IF;
  
  -- Obtener total del mes anterior
  SELECT COUNT(*) INTO v_total
  FROM public.validation_order
  WHERE month_year = v_last_month;
  
  -- Si hay datos del mes anterior, rotar
  IF v_total > 0 THEN
    FOR v_user IN 
      SELECT user_id, position FROM public.validation_order 
      WHERE month_year = v_last_month
      ORDER BY position
    LOOP
      -- Rotar posición (mover 1 hacia arriba, circular)
      v_new_position := CASE 
        WHEN v_user.position = 1 THEN v_total 
        ELSE v_user.position - 1 
      END;
      
      INSERT INTO public.validation_order (user_id, position, month_year)
      VALUES (v_user.user_id, v_new_position, v_month);
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;