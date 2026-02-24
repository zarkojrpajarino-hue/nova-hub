
-- Create function to check daily upload limits
CREATE OR REPLACE FUNCTION public.check_daily_upload_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_count INTEGER;
  max_limit INTEGER;
  item_type TEXT;
BEGIN
  -- Determine item type and limit
  IF TG_TABLE_NAME = 'obvs' THEN
    item_type := 'OBV';
    max_limit := 3;
    
    SELECT COUNT(*) INTO today_count
    FROM public.obvs
    WHERE owner_id = NEW.owner_id
    AND DATE(created_at) = CURRENT_DATE;
    
  ELSIF TG_TABLE_NAME = 'kpis' THEN
    IF NEW.type = 'lp' THEN
      item_type := 'Learning Path';
      max_limit := 1;
    ELSIF NEW.type = 'bp' THEN
      item_type := 'Book Point';
      max_limit := 2;
    ELSE
      -- CP has no limit
      RETURN NEW;
    END IF;
    
    SELECT COUNT(*) INTO today_count
    FROM public.kpis
    WHERE owner_id = NEW.owner_id
    AND type = NEW.type
    AND DATE(created_at) = CURRENT_DATE;
  END IF;
  
  -- Check limit (count is before insert, so >= means we're at or over limit)
  IF today_count >= max_limit THEN
    RAISE EXCEPTION 'Has alcanzado el límite diario de % % (máximo: %)', max_limit, item_type, max_limit;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for upload limits
DROP TRIGGER IF EXISTS check_obv_daily_limit ON public.obvs;
CREATE TRIGGER check_obv_daily_limit
  BEFORE INSERT ON public.obvs
  FOR EACH ROW
  EXECUTE FUNCTION public.check_daily_upload_limit();

DROP TRIGGER IF EXISTS check_kpi_daily_limit ON public.kpis;
CREATE TRIGGER check_kpi_daily_limit
  BEFORE INSERT ON public.kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.check_daily_upload_limit();

-- Create function to notify validators when a KPI needs validation
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
BEGIN
  -- Only notify for pending KPIs that need validation (LP and BP)
  IF NEW.status != 'pending' OR NEW.type NOT IN ('lp', 'bp') THEN
    RETURN NEW;
  END IF;
  
  -- Get owner name
  SELECT nombre INTO owner_name FROM public.profiles WHERE id = NEW.owner_id;
  
  -- Get type label
  kpi_type_label := CASE NEW.type
    WHEN 'lp' THEN 'Learning Path'
    WHEN 'bp' THEN 'Book Point'
    ELSE NEW.type
  END;
  
  -- Get validators for this user from validation order
  FOR validator_rec IN 
    SELECT vo.user_id as validator_id
    FROM public.validation_order vo
    WHERE vo.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    AND vo.user_id != NEW.owner_id
    ORDER BY vo.position
    LIMIT 2  -- Get the 2 validators after the owner
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
        owner_name || ' ha subido un ' || kpi_type_label || ': "' || NEW.titulo || '". ¡Recuerda validarlo!',
        'validacion_pendiente',
        '/kpis'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for validator notifications
DROP TRIGGER IF EXISTS notify_validators_on_kpi ON public.kpis;
CREATE TRIGGER notify_validators_on_kpi
  AFTER INSERT ON public.kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_validators_new_kpi();
