-- =============================================================
-- Fix 1: Block direct client-side notification inserts
-- Since triggers handle all notifications, block client inserts
-- =============================================================
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create restrictive policy that blocks direct client inserts
-- Only database triggers (running with elevated privileges) can insert
CREATE POLICY "Only triggers can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (false);

-- =============================================================
-- Fix 2: Update notify_new_obv to only notify project members 
-- and respect notification preferences
-- =============================================================
CREATE OR REPLACE FUNCTION public.notify_new_obv()
RETURNS TRIGGER AS $$
DECLARE
  profile_rec RECORD;
  obv_owner_name TEXT;
BEGIN
  -- Get the owner's name
  SELECT nombre INTO obv_owner_name FROM public.profiles WHERE id = NEW.owner_id;
  
  -- Only notify project members who have notifications enabled
  -- and are not the OBV owner
  FOR profile_rec IN 
    SELECT DISTINCT pm.member_id as id
    FROM public.project_members pm
    LEFT JOIN public.user_settings us ON us.user_id = pm.member_id
    WHERE pm.project_id = NEW.project_id
      AND pm.member_id != NEW.owner_id
      AND (us.notifications IS NULL OR (us.notifications->>'nuevas_obvs')::boolean = true)
  LOOP
    INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
    VALUES (
      profile_rec.id,
      'Nueva OBV pendiente de validar',
      obv_owner_name || ' ha subido: ' || NEW.titulo,
      'obv_nueva',
      '/obvs'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================
-- Fix 3: Update notify_obv_validation to respect preferences
-- =============================================================
CREATE OR REPLACE FUNCTION public.notify_obv_validation()
RETURNS TRIGGER AS $$
DECLARE
  obv_rec RECORD;
  validator_name TEXT;
  owner_prefs JSONB;
BEGIN
  -- Get OBV and owner info
  SELECT o.*, p.nombre as owner_name INTO obv_rec 
  FROM public.obvs o 
  JOIN public.profiles p ON p.id = o.owner_id 
  WHERE o.id = NEW.obv_id;
  
  -- Get validator name
  SELECT nombre INTO validator_name FROM public.profiles WHERE id = NEW.validator_id;
  
  -- Check owner notification preferences for validations
  SELECT us.notifications INTO owner_prefs
  FROM public.user_settings us
  WHERE us.user_id = obv_rec.owner_id;
  
  -- Only notify if preferences allow (default is true)
  IF owner_prefs IS NULL OR (owner_prefs->>'validaciones')::boolean = true THEN
    -- Notify the OBV owner
    IF NEW.approved = TRUE THEN
      INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
      VALUES (
        obv_rec.owner_id,
        'Tu OBV fue aprobada',
        validator_name || ' aprobó: ' || obv_rec.titulo,
        'obv_aprobada',
        '/obvs'
      );
    ELSE
      INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
      VALUES (
        obv_rec.owner_id,
        'Tu OBV fue rechazada',
        validator_name || ' rechazó: ' || obv_rec.titulo || '. Ver comentarios.',
        'obv_rechazada',
        '/obvs'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================
-- Fix 4: Update notify_task_assigned to respect preferences
-- =============================================================
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  assignee_prefs JSONB;
BEGIN
  -- Only notify if assignee changed and is set
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN
    -- Check assignee notification preferences for tasks
    SELECT us.notifications INTO assignee_prefs
    FROM public.user_settings us
    WHERE us.user_id = NEW.assignee_id;
    
    -- Only notify if preferences allow (default is true)
    IF assignee_prefs IS NULL OR (assignee_prefs->>'tareas')::boolean = true THEN
      INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
      VALUES (
        NEW.assignee_id,
        'Tarea asignada',
        'Te han asignado: ' || NEW.titulo,
        'tarea_asignada',
        '/mi-espacio'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================
-- Fix 5: Update notify_lead_won to respect preferences
-- (already scoped to project members, just add preference check)
-- =============================================================
CREATE OR REPLACE FUNCTION public.notify_lead_won()
RETURNS TRIGGER AS $$
DECLARE
  project_member RECORD;
  lead_name TEXT;
  member_prefs JSONB;
BEGIN
  -- Only trigger when status changes to cerrado_ganado
  IF NEW.status = 'cerrado_ganado' AND (OLD.status IS NULL OR OLD.status != 'cerrado_ganado') THEN
    lead_name := NEW.nombre;
    
    -- Notify project members who have notifications enabled
    FOR project_member IN 
      SELECT pm.member_id 
      FROM public.project_members pm 
      WHERE pm.project_id = NEW.project_id
    LOOP
      -- Check member notification preferences
      SELECT us.notifications INTO member_prefs
      FROM public.user_settings us
      WHERE us.user_id = project_member.member_id;
      
      -- Only notify if preferences allow (default is true)
      IF member_prefs IS NULL OR (member_prefs->>'nuevas_obvs')::boolean = true THEN
        INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
        VALUES (
          project_member.member_id,
          '¡Lead cerrado ganado!',
          'El lead "' || lead_name || '" se ha convertido en cliente.',
          'lead_ganado',
          '/crm'
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;