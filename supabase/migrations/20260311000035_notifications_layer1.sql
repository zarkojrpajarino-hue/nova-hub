-- ============================================================================
-- MIGRACIÓN 00035 — N7.0: Notification Layer 1 + Helpers base
--
-- Contenido:
--   1. check_notification_cap()         — hard cap helper (daily/weekly)
--   2. notify_all_project_members()     — helper loop con cap + dedup
--   3. notify_inactive_leads()          — cron: leads sin actividad 7d
--   4. notify_overdue_tasks()           — cron: tareas vencidas
--   5. notify_expiring_validations()    — cron: validaciones pendientes 2-3d
--   6. notify_inactive_projects()       — cron: proyectos sin OBVs 14d
--   7. notify_welcome_member()          — trigger INSERT profiles
--   8. notify_project_deleted()         — trigger UPDATE projects.deleted_at
--   9. notify_role_accepted()           — trigger UPDATE project_members.role_accepted
--  10. notify_lead_won()                — trigger UPDATE obvs.pipeline_status
--  11. notify_obv_validated()           — trigger UPDATE obvs.status
--  12. run_notification_batch()         — batch wrapper para pg_cron
--  13. pg_cron 0 */6 * * *
-- ============================================================================

-- ── 1. check_notification_cap ────────────────────────────────────────────────
-- Devuelve TRUE si el usuario puede recibir más notificaciones.
-- critical siempre pasa (bypass).
-- daily cap: 5; weekly cap: 15.

CREATE OR REPLACE FUNCTION check_notification_cap(
  p_user_id  UUID,
  p_priority TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_count  INTEGER;
  v_weekly_count INTEGER;
BEGIN
  -- critical bypasses all caps
  IF p_priority = 'critical' THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*) INTO v_daily_count
  FROM notifications
  WHERE user_id   = p_user_id
    AND created_at > NOW() - INTERVAL '1 day';

  IF v_daily_count >= 5 THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_weekly_count
  FROM notifications
  WHERE user_id   = p_user_id
    AND created_at > NOW() - INTERVAL '7 days';

  IF v_weekly_count >= 15 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION check_notification_cap(UUID, TEXT) IS
  'Hard cap: 5/día y 15/semana por usuario. critical siempre pasa.';

-- ── 2. notify_all_project_members ────────────────────────────────────────────
-- Envía una notificación a todos los miembros de un proyecto.
-- Aplica cap + dedup por ventana (días).
-- p_dedup_days=0 desactiva la dedup (para eventos one-shot como welcome).

CREATE OR REPLACE FUNCTION notify_all_project_members(
  p_project_id   UUID,
  p_type         TEXT,
  p_priority     TEXT,
  p_title        TEXT,
  p_message      TEXT,
  p_action_url   TEXT    DEFAULT NULL,
  p_action_label TEXT    DEFAULT NULL,
  p_metadata     JSONB   DEFAULT '{}'::jsonb,
  p_dedup_days   INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_count  INTEGER := 0;
  v_meta   JSONB;
BEGIN
  v_meta := p_metadata || jsonb_build_object('project_id', p_project_id);

  FOR v_member IN
    SELECT member_id FROM project_members WHERE project_id = p_project_id
  LOOP
    -- Cap check
    IF NOT check_notification_cap(v_member.member_id, p_priority) THEN
      CONTINUE;
    END IF;

    -- Dedup check
    IF p_dedup_days > 0 AND EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id   = v_member.member_id
        AND type      = p_type
        AND metadata->>'project_id' = p_project_id::text
        AND created_at > NOW() - (p_dedup_days || ' days')::INTERVAL
    ) THEN
      CONTINUE;
    END IF;

    PERFORM create_notification(
      v_member.member_id, p_type, p_priority, p_title, p_message,
      p_action_url, p_action_label, v_meta
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION notify_all_project_members IS
  'Notifica a todos los miembros de un proyecto con cap y dedup incorporados.';

-- ── 3. notify_inactive_leads ─────────────────────────────────────────────────
-- Leads (obvs en pipeline activo) sin actividad hace 7+ días.
-- "lead" = OBV con pipeline_status activo (no cerrado).

CREATE OR REPLACE FUNCTION notify_inactive_leads()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_lead  RECORD;
BEGIN
  FOR v_lead IN
    SELECT
      o.id,
      o.titulo,
      o.empresa,
      o.responsable_id,
      o.updated_at,
      EXTRACT(DAY FROM NOW() - o.updated_at)::INTEGER AS dias_inactivo
    FROM obvs o
    WHERE o.pipeline_status NOT IN ('cerrado_ganado', 'cerrado_perdido')
      AND o.responsable_id IS NOT NULL
      AND o.updated_at < NOW() - INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = o.responsable_id
          AND n.type    = 'lead_inactive'
          AND n.metadata->>'lead_id' = o.id::text
          AND n.created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    IF NOT check_notification_cap(v_lead.responsable_id, 'high') THEN
      CONTINUE;
    END IF;

    PERFORM create_notification(
      v_lead.responsable_id,
      'lead_inactive',
      'high',
      'Lead sin actividad',
      format('El lead "%s"%s lleva %s días sin updates',
        v_lead.titulo,
        CASE WHEN v_lead.empresa IS NOT NULL THEN ' de ' || v_lead.empresa ELSE '' END,
        v_lead.dias_inactivo
      ),
      format('/crm?lead=%s', v_lead.id),
      'Actualizar lead',
      jsonb_build_object(
        'lead_id',        v_lead.id,
        'lead_titulo',    v_lead.titulo,
        'dias_inactivo',  v_lead.dias_inactivo
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── 4. notify_overdue_tasks ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_overdue_tasks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_task  RECORD;
BEGIN
  FOR v_task IN
    SELECT
      t.id,
      t.titulo,
      t.assignee_id,
      t.fecha_limite,
      EXTRACT(DAY FROM NOW() - t.fecha_limite::TIMESTAMPTZ)::INTEGER AS dias_vencida,
      p.nombre AS project_name,
      t.project_id
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.status      != 'done'
      AND t.fecha_limite IS NOT NULL
      AND t.fecha_limite  < CURRENT_DATE
      AND t.assignee_id  IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = t.assignee_id
          AND n.type    = 'task_overdue'
          AND n.metadata->>'task_id' = t.id::text
          AND n.created_at > NOW() - INTERVAL '1 day'
      )
  LOOP
    IF NOT check_notification_cap(v_task.assignee_id, 'high') THEN
      CONTINUE;
    END IF;

    PERFORM create_notification(
      v_task.assignee_id,
      'task_overdue',
      'high',
      'Tarea vencida',
      format('"%s" está vencida hace %s día%s',
        v_task.titulo,
        v_task.dias_vencida,
        CASE WHEN v_task.dias_vencida = 1 THEN '' ELSE 's' END
      ),
      format('/proyecto/%s?tab=tareas', v_task.project_id),
      'Ver tarea',
      jsonb_build_object(
        'task_id',      v_task.id,
        'task_titulo',  v_task.titulo,
        'dias_vencida', v_task.dias_vencida,
        'project_name', v_task.project_name,
        'project_id',   v_task.project_id
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── 5. notify_expiring_validations ───────────────────────────────────────────
-- OBVs con status=pending que llevan 2-3 días sin recibir validación.
-- Notifica a los validadores pendientes (obv_validaciones WHERE approved IS NULL).

CREATE OR REPLACE FUNCTION notify_expiring_validations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count      INTEGER := 0;
  v_obv        RECORD;
  v_validator  RECORD;
BEGIN
  FOR v_obv IN
    SELECT o.id, o.titulo, o.project_id
    FROM obvs o
    WHERE o.status     = 'pending'
      AND o.created_at < NOW() - INTERVAL '2 days'
      AND o.created_at > NOW() - INTERVAL '3 days'
      AND EXISTS (
        SELECT 1 FROM obv_validaciones ov
        WHERE ov.obv_id   = o.id
          AND ov.approved IS NULL
      )
  LOOP
    FOR v_validator IN
      SELECT ov.validator_id
      FROM obv_validaciones ov
      WHERE ov.obv_id   = v_obv.id
        AND ov.approved IS NULL
    LOOP
      IF NOT check_notification_cap(v_validator.validator_id, 'high') THEN
        CONTINUE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = v_validator.validator_id
          AND n.type    = 'validation_expiring'
          AND n.metadata->>'obv_id' = v_obv.id::text
          AND n.created_at > NOW() - INTERVAL '12 hours'
      ) THEN
        PERFORM create_notification(
          v_validator.validator_id,
          'validation_expiring',
          'high',
          'Validación por expirar',
          format('El OBV "%s" expira en menos de 24h. ¡Valídalo para evitar bloqueos!',
            v_obv.titulo
          ),
          '/obvs?filter=validar',
          'Validar ahora',
          jsonb_build_object(
            'obv_id',      v_obv.id,
            'obv_titulo',  v_obv.titulo,
            'project_id',  v_obv.project_id
          )
        );
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── 6. notify_inactive_projects ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_inactive_projects()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count   INTEGER := 0;
  v_project RECORD;
BEGIN
  FOR v_project IN
    SELECT p.id, p.nombre
    FROM projects p
    WHERE p.deleted_at IS NULL
      AND p.onboarding_completed = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM obvs o
        WHERE o.project_id = p.id
          AND o.created_at > NOW() - INTERVAL '14 days'
      )
  LOOP
    v_count := v_count + notify_all_project_members(
      v_project.id,
      'project_inactive',
      'medium',
      'Proyecto sin actividad',
      format('"%s" no tiene OBVs registrados en 14+ días',
        v_project.nombre
      ),
      format('/proyecto/%s', v_project.id),
      'Ver proyecto',
      jsonb_build_object('project_nombre', v_project.nombre),
      7   -- dedup 7 días
    );
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── 7. Trigger: nuevo miembro ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_welcome_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_notification(
    NEW.id,
    'welcome',
    'low',
    '¡Bienvenido a Nova Hub!',
    format('Hola %s, completa tu perfil para empezar', NEW.nombre),
    '/settings',
    'Completar perfil',
    jsonb_build_object('profile_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_welcome_member ON profiles;
CREATE TRIGGER trigger_welcome_member
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_welcome_member();

-- ── 8. Trigger: proyecto eliminado ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_project_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    PERFORM notify_all_project_members(
      NEW.id,
      'project_deleted',
      'medium',
      'Proyecto eliminado',
      format('El proyecto "%s" ha sido eliminado. Puedes restaurarlo desde el historial.',
        NEW.nombre
      ),
      '/proyectos',
      'Ver historial',
      jsonb_build_object(
        'project_nombre', NEW.nombre,
        'deleted_by',     NEW.deleted_by
      ),
      0   -- sin dedup (evento one-shot)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_project_deleted ON projects;
CREATE TRIGGER trigger_project_deleted
  AFTER UPDATE OF deleted_at ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_deleted();

-- ── 9. Trigger: rol aceptado ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_role_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_name TEXT;
BEGIN
  IF NEW.role_accepted = TRUE AND (OLD.role_accepted = FALSE OR OLD.role_accepted IS NULL) THEN
    SELECT nombre INTO v_project_name
    FROM projects WHERE id = NEW.project_id;

    PERFORM create_notification(
      NEW.member_id,
      'role_accepted',
      'low',
      'Rol confirmado',
      format('Tu rol en "%s" ha sido confirmado', v_project_name),
      format('/proyecto/%s', NEW.project_id),
      'Ver proyecto',
      jsonb_build_object(
        'project_id',   NEW.project_id,
        'project_name', v_project_name,
        'role',         NEW.role
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_role_accepted ON project_members;
CREATE TRIGGER trigger_role_accepted
  AFTER UPDATE OF role_accepted ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_role_accepted();

-- ── 10. Trigger: lead ganado ──────────────────────────────────────────────────
-- Dispara cuando obvs.pipeline_status cambia a 'cerrado_ganado'.

CREATE OR REPLACE FUNCTION notify_lead_won()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_name TEXT;
  v_responsable  TEXT;
BEGIN
  IF NEW.pipeline_status = 'cerrado_ganado' AND OLD.pipeline_status != 'cerrado_ganado' THEN
    SELECT nombre INTO v_project_name FROM projects WHERE id = NEW.project_id;
    SELECT nombre INTO v_responsable  FROM profiles  WHERE id = NEW.responsable_id;

    PERFORM notify_all_project_members(
      NEW.project_id,
      'lead_won',
      'low',
      '¡Lead ganado!',
      format('%s cerró el lead "%s" en %s',
        COALESCE(v_responsable, 'Un miembro'),
        NEW.titulo,
        COALESCE(v_project_name, 'el proyecto')
      ),
      format('/proyecto/%s?tab=crm', NEW.project_id),
      'Ver detalles',
      jsonb_build_object(
        'lead_id',     NEW.id,
        'lead_titulo', NEW.titulo,
        'valor',       NEW.valor_potencial
      ),
      0   -- sin dedup (evento one-shot)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_lead_won ON obvs;
CREATE TRIGGER trigger_lead_won
  AFTER UPDATE OF pipeline_status ON obvs
  FOR EACH ROW
  EXECUTE FUNCTION notify_lead_won();

-- ── 11. Trigger: OBV validado ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_obv_validated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'validated' AND OLD.status != 'validated' THEN
    PERFORM create_notification(
      NEW.owner_id,
      'obv_validated',
      'low',
      'OBV validado',
      format('Tu OBV "%s" ha sido validado', NEW.titulo),
      format('/obvs?obv=%s', NEW.id),
      'Ver OBV',
      jsonb_build_object(
        'obv_id',     NEW.id,
        'obv_titulo', NEW.titulo,
        'project_id', NEW.project_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_obv_validated ON obvs;
CREATE TRIGGER trigger_obv_validated
  AFTER UPDATE OF status ON obvs
  FOR EACH ROW
  EXECUTE FUNCTION notify_obv_validated();

-- ── 12. run_notification_batch ────────────────────────────────────────────────
-- Wrapper que ejecuta todas las funciones cron de notificaciones.
-- Llamado por pg_cron cada 6 horas.

CREATE OR REPLACE FUNCTION run_notification_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Layer 1: actividad
  PERFORM notify_inactive_leads();
  PERFORM notify_overdue_tasks();
  PERFORM notify_expiring_validations();
  PERFORM notify_inactive_projects();
  -- Layer 2–5 se añaden en migración 00036
END;
$$;

COMMENT ON FUNCTION run_notification_batch() IS
  'Batch de notificaciones. Ejecutado por pg_cron cada 6 horas.';

-- ── 13. pg_cron: cada 6 horas ────────────────────────────────────────────────

SELECT cron.unschedule('notification-batch')
FROM cron.job
WHERE jobname = 'notification-batch';

SELECT cron.schedule(
  'notification-batch',
  '0 */6 * * *',
  $$ SELECT run_notification_batch() $$
);
