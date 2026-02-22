-- ============================================
-- NOTIFICATIONS V2
-- Sistema de notificaciones inteligente con prioridades
-- 10 tipos nuevos de alertas automáticas
-- ============================================

-- 1. Añadir campo priority y action_url
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('critical', 'high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_label TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- 2. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_snoozed ON public.notifications(snoozed_until) WHERE snoozed_until IS NOT NULL;

-- 3. Función helper: Crear notificación
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_priority TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    priority,
    title,
    message,
    action_url,
    action_label,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_priority,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- ============================================
-- ALERTA 1: LEADS SIN ACTIVIDAD (7+ días)
-- ============================================

CREATE OR REPLACE FUNCTION notify_inactive_leads()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
  v_lead RECORD;
BEGIN
  FOR v_lead IN
    SELECT
      l.id,
      l.nombre,
      l.empresa,
      l.responsable_id,
      l.updated_at,
      EXTRACT(DAY FROM NOW() - l.updated_at)::INTEGER as dias_inactivo
    FROM public.leads l
    WHERE l.status NOT IN ('cerrado_ganado', 'cerrado_perdido')
      AND l.updated_at < NOW() - INTERVAL '7 days'
      AND l.responsable_id IS NOT NULL
      -- No notificar si ya existe una notificación reciente
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = l.responsable_id
          AND n.type = 'lead_inactive'
          AND n.metadata->>'lead_id' = l.id::text
          AND n.created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    PERFORM create_notification(
      v_lead.responsable_id,
      'lead_inactive',
      'high',
      '🔥 Lead sin actividad',
      format('El lead "%s" de %s lleva %s días sin updates',
        v_lead.nombre,
        COALESCE(v_lead.empresa, 'empresa desconocida'),
        v_lead.dias_inactivo
      ),
      format('/crm?lead=%s', v_lead.id),
      'Actualizar lead',
      jsonb_build_object(
        'lead_id', v_lead.id,
        'lead_nombre', v_lead.nombre,
        'dias_inactivo', v_lead.dias_inactivo
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================
-- ALERTA 2: TAREAS VENCIDAS
-- ============================================

CREATE OR REPLACE FUNCTION notify_overdue_tasks()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
  v_task RECORD;
BEGIN
  FOR v_task IN
    SELECT
      t.id,
      t.title,
      t.assignee_id,
      t.due_date,
      EXTRACT(DAY FROM NOW() - t.due_date)::INTEGER as dias_vencida,
      p.nombre as project_name
    FROM public.tasks t
    LEFT JOIN public.projects p ON t.project_id = p.id
    WHERE t.status != 'done'
      AND t.due_date < NOW()
      AND t.assignee_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = t.assignee_id
          AND n.type = 'task_overdue'
          AND n.metadata->>'task_id' = t.id::text
          AND n.created_at > NOW() - INTERVAL '1 day'
      )
  LOOP
    PERFORM create_notification(
      v_task.assignee_id,
      'task_overdue',
      'high',
      '⏰ Tarea vencida',
      format('La tarea "%s" está vencida hace %s días',
        v_task.title,
        v_task.dias_vencida
      ),
      format('/proyecto/%s?tab=tareas', v_task.id),
      'Ver tarea',
      jsonb_build_object(
        'task_id', v_task.id,
        'task_title', v_task.title,
        'dias_vencida', v_task.dias_vencida,
        'project_name', v_task.project_name
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================
-- ALERTA 3: VALIDACIONES EXPIRANDO (<24h)
-- ============================================

CREATE OR REPLACE FUNCTION notify_expiring_validations()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
  v_validation RECORD;
BEGIN
  FOR v_validation IN
    SELECT
      o.id,
      o.titulo,
      o.owner_id,
      o.created_at,
      unnest(o.validators_pending) as validator_id
    FROM public.obvs o
    WHERE o.status = 'pending'
      AND o.created_at < NOW() - INTERVAL '2 days'
      AND o.created_at > NOW() - INTERVAL '3 days'
      AND cardinality(o.validators_pending) > 0
  LOOP
    -- Notificar a cada validador pendiente
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = v_validation.validator_id
        AND n.type = 'validation_expiring'
        AND n.metadata->>'obv_id' = v_validation.id::text
        AND n.created_at > NOW() - INTERVAL '12 hours'
    ) THEN
      PERFORM create_notification(
        v_validation.validator_id,
        'validation_expiring',
        'high',
        '⚠️ Validación por expirar',
        format('El OBV "%s" expira en menos de 24h. ¡Valídalo para evitar bloqueos!',
          v_validation.titulo
        ),
        format('/obvs?filter=validar'),
        'Validar ahora',
        jsonb_build_object(
          'obv_id', v_validation.id,
          'obv_titulo', v_validation.titulo
        )
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================
-- ALERTA 4: PROYECTO SIN OBVs (14+ días)
-- ============================================

CREATE OR REPLACE FUNCTION notify_inactive_projects()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
  v_project RECORD;
  v_member RECORD;
BEGIN
  FOR v_project IN
    SELECT
      p.id,
      p.nombre,
      (
        SELECT MAX(o.created_at)
        FROM public.obvs o
        WHERE o.project_id = p.id
      ) as last_obv_date
    FROM public.projects p
    WHERE p.deleted_at IS NULL
      AND p.onboarding_completed = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM public.obvs o
        WHERE o.project_id = p.id
          AND o.created_at > NOW() - INTERVAL '14 days'
      )
  LOOP
    -- Notificar a todos los miembros del proyecto
    FOR v_member IN
      SELECT DISTINCT member_id
      FROM public.project_members
      WHERE project_id = v_project.id
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = v_member.member_id
          AND n.type = 'project_inactive'
          AND n.metadata->>'project_id' = v_project.id::text
          AND n.created_at > NOW() - INTERVAL '7 days'
      ) THEN
        PERFORM create_notification(
          v_member.member_id,
          'project_inactive',
          'medium',
          '📊 Proyecto sin actividad',
          format('El proyecto "%s" no tiene OBVs hace 14+ días',
            v_project.nombre
          ),
          format('/proyecto/%s', v_project.id),
          'Ver proyecto',
          jsonb_build_object(
            'project_id', v_project.id,
            'project_nombre', v_project.nombre
          )
        );
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================
-- ALERTA 5: OBJETIVO CERCANO (90%+)
-- ============================================

CREATE OR REPLACE FUNCTION notify_near_objectives()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
  v_member RECORD;
  v_objective RECORD;
BEGIN
  -- Obtener objetivos del equipo
  FOR v_objective IN
    SELECT id, name, target_value, unit
    FROM public.objectives
    WHERE period = 'monthly'
  LOOP
    -- Verificar progreso de cada miembro
    FOR v_member IN
      SELECT
        m.id,
        m.nombre,
        CASE v_objective.name
          WHEN 'OBVs' THEN m.obvs
          WHEN 'LPs' THEN m.lps
          WHEN 'BPs' THEN m.bps
          WHEN 'CPs' THEN m.cps
          WHEN 'Facturación' THEN m.facturacion
          WHEN 'Margen' THEN m.margen
          ELSE 0
        END as current_value
      FROM public.member_stats m
    LOOP
      IF v_member.current_value >= (v_objective.target_value / 9.0 * 0.9)
         AND v_member.current_value < (v_objective.target_value / 9.0) THEN

        IF NOT EXISTS (
          SELECT 1 FROM public.notifications n
          WHERE n.user_id = v_member.id
            AND n.type = 'objective_near'
            AND n.metadata->>'objective_name' = v_objective.name
            AND n.created_at > NOW() - INTERVAL '7 days'
        ) THEN
          PERFORM create_notification(
            v_member.id,
            'objective_near',
            'medium',
            '🎯 ¡Casi lo logras!',
            format('Estás al 90%% del objetivo de %s. ¡Un último empujón!',
              v_objective.name
            ),
            '/mi-espacio',
            'Ver progreso',
            jsonb_build_object(
              'objective_name', v_objective.name,
              'current', v_member.current_value,
              'target', v_objective.target_value / 9.0
            )
          );
          v_count := v_count + 1;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================
-- ALERTA 6: BIENVENIDA NUEVO MIEMBRO
-- ============================================

CREATE OR REPLACE FUNCTION notify_welcome_member()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notificar al nuevo miembro
  PERFORM create_notification(
    NEW.id,
    'welcome',
    'low',
    '👋 ¡Bienvenido a Nova Hub!',
    format('Hola %s, completa tu perfil para empezar', NEW.nombre),
    '/settings',
    'Completar perfil',
    jsonb_build_object(
      'profile_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_welcome_member ON public.profiles;
CREATE TRIGGER trigger_welcome_member
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION notify_welcome_member();

-- ============================================
-- ALERTA 7: PROYECTO ELIMINADO
-- ============================================

CREATE OR REPLACE FUNCTION notify_project_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_member RECORD;
BEGIN
  -- Solo si se marca como eliminado (soft delete)
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Notificar a todos los miembros
    FOR v_member IN
      SELECT member_id
      FROM public.project_members
      WHERE project_id = NEW.id
    LOOP
      PERFORM create_notification(
        v_member.member_id,
        'project_deleted',
        'medium',
        '🗑️ Proyecto eliminado',
        format('El proyecto "%s" ha sido eliminado. Puedes restaurarlo desde el historial.',
          NEW.nombre
        ),
        '/proyectos',
        'Ver historial',
        jsonb_build_object(
          'project_id', NEW.id,
          'project_nombre', NEW.nombre,
          'deleted_by', NEW.deleted_by
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_project_deleted ON public.projects;
CREATE TRIGGER trigger_project_deleted
AFTER UPDATE OF deleted_at ON public.projects
FOR EACH ROW
EXECUTE FUNCTION notify_project_deleted();

-- ============================================
-- ALERTA 8: ROL ACEPTADO
-- ============================================

CREATE OR REPLACE FUNCTION notify_role_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_project RECORD;
BEGIN
  -- Solo si se acaba de aceptar el rol
  IF NEW.role_accepted = TRUE AND (OLD.role_accepted = FALSE OR OLD.role_accepted IS NULL) THEN

    SELECT id, nombre INTO v_project
    FROM public.projects
    WHERE id = NEW.project_id;

    PERFORM create_notification(
      NEW.member_id,
      'role_accepted',
      'low',
      '✅ Rol confirmado',
      format('Tu rol de %s en "%s" ha sido confirmado',
        NEW.role,
        v_project.nombre
      ),
      format('/proyecto/%s', NEW.project_id),
      'Ver proyecto',
      jsonb_build_object(
        'project_id', NEW.project_id,
        'role', NEW.role
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_role_accepted ON public.project_members;
CREATE TRIGGER trigger_role_accepted
AFTER UPDATE OF role_accepted ON public.project_members
FOR EACH ROW
EXECUTE FUNCTION notify_role_accepted();

-- ============================================
-- ALERTA 9: LEAD CERRADO-GANADO
-- ============================================

CREATE OR REPLACE FUNCTION notify_lead_won()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_member RECORD;
  v_project RECORD;
BEGIN
  -- Solo si acaba de cerrarse como ganado
  IF NEW.status = 'cerrado_ganado' AND OLD.status != 'cerrado_ganado' THEN

    SELECT nombre INTO v_project
    FROM public.projects
    WHERE id = NEW.project_id;

    -- Notificar a todos los miembros del proyecto
    FOR v_member IN
      SELECT member_id
      FROM public.project_members
      WHERE project_id = NEW.project_id
    LOOP
      PERFORM create_notification(
        v_member.member_id,
        'lead_won',
        'low',
        '🎉 ¡Lead ganado!',
        format('%s cerró el lead "%s" en %s',
          (SELECT nombre FROM public.profiles WHERE id = NEW.responsable_id),
          NEW.nombre,
          v_project.nombre
        ),
        format('/proyecto/%s?tab=crm', NEW.project_id),
        'Ver detalles',
        jsonb_build_object(
          'lead_id', NEW.id,
          'lead_nombre', NEW.nombre,
          'valor', NEW.valor_potencial
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_lead_won ON public.leads;
CREATE TRIGGER trigger_lead_won
AFTER UPDATE OF status ON public.leads
FOR EACH ROW
EXECUTE FUNCTION notify_lead_won();

-- ============================================
-- ALERTA 10: OBV VALIDADO
-- ============================================

CREATE OR REPLACE FUNCTION notify_obv_validated()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo si acaba de validarse
  IF NEW.status = 'validated' AND OLD.status != 'validated' THEN
    PERFORM create_notification(
      NEW.owner_id,
      'obv_validated',
      'low',
      '✅ OBV validado',
      format('Tu OBV "%s" ha sido validado', NEW.titulo),
      format('/obvs?obv=%s', NEW.id),
      'Ver OBV',
      jsonb_build_object(
        'obv_id', NEW.id,
        'obv_titulo', NEW.titulo
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_obv_validated ON public.obvs;
CREATE TRIGGER trigger_obv_validated
AFTER UPDATE OF status ON public.obvs
FOR EACH ROW
EXECUTE FUNCTION notify_obv_validated();

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Snooze notification
CREATE OR REPLACE FUNCTION snooze_notification(
  p_notification_id UUID,
  p_minutes INTEGER DEFAULT 60
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.notifications
  SET snoozed_until = NOW() + (p_minutes || ' minutes')::INTERVAL
  WHERE id = p_notification_id;
END;
$$;

-- Archive notification
CREATE OR REPLACE FUNCTION archive_notification(
  p_notification_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.notifications
  SET archived = TRUE, read = TRUE
  WHERE id = p_notification_id;
END;
$$;

-- Mark all as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = TRUE
  WHERE user_id = p_user_id
    AND read = FALSE
    AND archived = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION create_notification IS 'Helper para crear notificaciones con todos los campos';
COMMENT ON FUNCTION notify_inactive_leads IS 'Alerta de leads sin actividad hace 7+ días';
COMMENT ON FUNCTION notify_overdue_tasks IS 'Alerta de tareas vencidas';
COMMENT ON FUNCTION notify_expiring_validations IS 'Alerta de validaciones que expiran en <24h';
COMMENT ON FUNCTION notify_inactive_projects IS 'Alerta de proyectos sin OBVs hace 14+ días';
COMMENT ON FUNCTION notify_near_objectives IS 'Alerta cuando estás al 90% de un objetivo';
COMMENT ON FUNCTION snooze_notification IS 'Posponer notificación por X minutos';
COMMENT ON FUNCTION archive_notification IS 'Archivar notificación';
