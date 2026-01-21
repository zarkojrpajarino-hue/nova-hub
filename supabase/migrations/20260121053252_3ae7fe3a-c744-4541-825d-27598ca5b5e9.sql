-- Create function to notify on new OBV (notifies all other members)
CREATE OR REPLACE FUNCTION public.notify_new_obv()
RETURNS TRIGGER AS $$
DECLARE
  profile_rec RECORD;
  obv_owner_name TEXT;
BEGIN
  -- Get the owner's name
  SELECT nombre INTO obv_owner_name FROM public.profiles WHERE id = NEW.owner_id;
  
  -- Notify all other profiles
  FOR profile_rec IN SELECT id FROM public.profiles WHERE id != NEW.owner_id
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

-- Create function to notify OBV validation result
CREATE OR REPLACE FUNCTION public.notify_obv_validation()
RETURNS TRIGGER AS $$
DECLARE
  obv_rec RECORD;
  validator_name TEXT;
BEGIN
  -- Get OBV and owner info
  SELECT o.*, p.nombre as owner_name INTO obv_rec 
  FROM public.obvs o 
  JOIN public.profiles p ON p.id = o.owner_id 
  WHERE o.id = NEW.obv_id;
  
  -- Get validator name
  SELECT nombre INTO validator_name FROM public.profiles WHERE id = NEW.validator_id;
  
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to notify task assignment
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if assignee changed and is set
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN
    INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
    VALUES (
      NEW.assignee_id,
      'Tarea asignada',
      'Te han asignado: ' || NEW.titulo,
      'tarea_asignada',
      '/mi-espacio'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to notify lead closed won
CREATE OR REPLACE FUNCTION public.notify_lead_won()
RETURNS TRIGGER AS $$
DECLARE
  project_member RECORD;
  lead_name TEXT;
BEGIN
  -- Only trigger when status changes to cerrado_ganado
  IF NEW.status = 'cerrado_ganado' AND (OLD.status IS NULL OR OLD.status != 'cerrado_ganado') THEN
    lead_name := NEW.nombre;
    
    -- Notify all project members
    FOR project_member IN 
      SELECT pm.member_id FROM public.project_members pm WHERE pm.project_id = NEW.project_id
    LOOP
      INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, link)
      VALUES (
        project_member.member_id,
        '¡Lead cerrado ganado!',
        'El lead "' || lead_name || '" se ha convertido en cliente.',
        'lead_ganado',
        '/crm'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_new_obv ON public.obvs;
CREATE TRIGGER trigger_notify_new_obv
  AFTER INSERT ON public.obvs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_obv();

DROP TRIGGER IF EXISTS trigger_notify_obv_validation ON public.obv_validaciones;
CREATE TRIGGER trigger_notify_obv_validation
  AFTER INSERT ON public.obv_validaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_obv_validation();

DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON public.tasks;
CREATE TRIGGER trigger_notify_task_assigned
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assigned();

DROP TRIGGER IF EXISTS trigger_notify_lead_won ON public.leads;
CREATE TRIGGER trigger_notify_lead_won
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_lead_won();