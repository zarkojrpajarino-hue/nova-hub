
-- Fix 1: Update KPI validator notifications to use 3 validators (not 2)
CREATE OR REPLACE FUNCTION public.notify_validators_new_kpi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_name TEXT;
  kpi_type_label TEXT;
  validator_rec RECORD;
  user_prefs JSONB;
  owner_position INTEGER;
BEGIN
  -- Only notify for pending KPIs that need validation (LP and BP)
  IF NEW.status != 'pending' OR NEW.type NOT IN ('lp', 'bp') THEN
    RETURN NEW;
  END IF;
  
  -- Get owner name and position in validation order
  SELECT p.nombre, vo.position INTO owner_name, owner_position
  FROM public.profiles p
  LEFT JOIN public.validation_order vo ON vo.user_id = NEW.owner_id 
    AND vo.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  WHERE p.id = NEW.owner_id;
  
  -- Get type label
  kpi_type_label := CASE NEW.type
    WHEN 'lp' THEN 'Learning Path'
    WHEN 'bp' THEN 'Book Point'
    ELSE NEW.type
  END;
  
  -- Get 3 validators (the 3 people ABOVE the owner in circular order)
  FOR validator_rec IN 
    SELECT vo.user_id as validator_id
    FROM public.validation_order vo
    WHERE vo.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    AND vo.user_id != NEW.owner_id
    ORDER BY 
      CASE 
        WHEN vo.position < owner_position THEN vo.position + 100
        ELSE vo.position
      END DESC
    LIMIT 3
  LOOP
    -- Check user notification preferences
    SELECT notifications INTO user_prefs
    FROM public.user_settings
    WHERE user_id = validator_rec.validator_id;
    
    -- Default to true if no settings or validaciones not set
    IF user_prefs IS NULL OR (user_prefs->>'validaciones')::boolean IS DISTINCT FROM false THEN
      INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
      VALUES (
        validator_rec.validator_id,
        'Nueva validación pendiente',
        owner_name || ' ha subido un ' || kpi_type_label || ': "' || NEW.titulo || '". Tienes 3 días para validarlo.',
        'validacion_pendiente',
        '/kpis'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Fix 2: Update OBV notifications to use 3 circular validators (not project members)
CREATE OR REPLACE FUNCTION public.notify_new_obv()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validator_rec RECORD;
  obv_owner_name TEXT;
  owner_position INTEGER;
  user_prefs JSONB;
BEGIN
  -- Get the owner's name and position in validation order
  SELECT p.nombre, vo.position INTO obv_owner_name, owner_position
  FROM public.profiles p
  LEFT JOIN public.validation_order vo ON vo.user_id = NEW.owner_id 
    AND vo.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  WHERE p.id = NEW.owner_id;
  
  -- Get 3 validators (the 3 people ABOVE the owner in circular order)
  FOR validator_rec IN 
    SELECT vo.user_id as validator_id
    FROM public.validation_order vo
    WHERE vo.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    AND vo.user_id != NEW.owner_id
    ORDER BY 
      CASE 
        WHEN vo.position < owner_position THEN vo.position + 100
        ELSE vo.position
      END DESC
    LIMIT 3
  LOOP
    -- Check user notification preferences
    SELECT notifications INTO user_prefs
    FROM public.user_settings
    WHERE user_id = validator_rec.validator_id;
    
    -- Default to true if no settings or nuevas_obvs not set
    IF user_prefs IS NULL OR (user_prefs->>'nuevas_obvs')::boolean IS DISTINCT FROM false THEN
      INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
      VALUES (
        validator_rec.validator_id,
        'Nueva OBV pendiente de validar',
        obv_owner_name || ' ha subido: "' || NEW.titulo || '". Tienes 3 días para validarla.',
        'obv_nueva',
        '/obvs'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;
