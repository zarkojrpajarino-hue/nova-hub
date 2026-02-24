-- ============================================
-- SLACK INTEGRATION
-- Almacena webhooks de Slack por proyecto
-- Permite enviar notificaciones automáticas
-- ============================================

-- 1. Tabla de configuración de Slack
CREATE TABLE IF NOT EXISTS public.slack_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  team_id UUID, -- NULL = notificaciones globales
  webhook_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  notification_types TEXT[] DEFAULT ARRAY[
    'lead_won',
    'obv_validated',
    'objective_reached',
    'project_milestone'
  ]::TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  CONSTRAINT valid_webhook_url CHECK (webhook_url LIKE 'https://hooks.slack.com/%')
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_slack_webhooks_project ON public.slack_webhooks(project_id) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_slack_webhooks_team ON public.slack_webhooks(team_id) WHERE enabled = TRUE;

-- 3. RLS Policies
ALTER TABLE public.slack_webhooks ENABLE ROW LEVEL SECURITY;

-- Ver webhooks del proyecto donde soy miembro
CREATE POLICY "Users can view webhooks of their projects"
  ON public.slack_webhooks
  FOR SELECT
  USING (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = slack_webhooks.project_id
        AND pm.member_id = auth.uid()
    )
  );

-- Crear webhooks solo si soy miembro del proyecto
CREATE POLICY "Users can create webhooks for their projects"
  ON public.slack_webhooks
  FOR INSERT
  WITH CHECK (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = slack_webhooks.project_id
        AND pm.member_id = auth.uid()
    )
  );

-- Actualizar solo los propios
CREATE POLICY "Users can update their own webhooks"
  ON public.slack_webhooks
  FOR UPDATE
  USING (created_by = auth.uid());

-- Eliminar solo los propios
CREATE POLICY "Users can delete their own webhooks"
  ON public.slack_webhooks
  FOR DELETE
  USING (created_by = auth.uid());

-- 4. Función para enviar notificación a Slack
CREATE OR REPLACE FUNCTION send_slack_notification(
  p_project_id UUID,
  p_notification_type TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find active webhooks for this project and notification type
  FOR v_webhook IN
    SELECT
      id,
      webhook_url,
      notification_types
    FROM public.slack_webhooks
    WHERE enabled = TRUE
      AND (project_id = p_project_id OR project_id IS NULL)
      AND p_notification_type = ANY(notification_types)
  LOOP
    -- Call Edge Function to send to Slack
    -- (This would be implemented via HTTP request from Edge Function)
    -- For now, just log
    RAISE NOTICE 'Slack notification: % to webhook %', p_notification_type, v_webhook.id;

    -- Update last_used_at
    UPDATE public.slack_webhooks
    SET last_used_at = NOW()
    WHERE id = v_webhook.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 5. Trigger: Enviar a Slack cuando lead se cierra como ganado
CREATE OR REPLACE FUNCTION trigger_slack_lead_won()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_name TEXT;
  v_responsable_name TEXT;
  v_message TEXT;
BEGIN
  IF NEW.status = 'cerrado_ganado' AND OLD.status != 'cerrado_ganado' THEN

    SELECT nombre INTO v_project_name
    FROM public.projects
    WHERE id = NEW.project_id;

    SELECT nombre INTO v_responsable_name
    FROM public.profiles
    WHERE id = NEW.responsable_id;

    v_message := format(
      ':tada: *Lead Ganado!*\n*Proyecto:* %s\n*Lead:* %s\n*Valor:* €%s\n*Responsable:* %s',
      v_project_name,
      NEW.nombre,
      COALESCE(NEW.valor_potencial::TEXT, 'N/A'),
      v_responsable_name
    );

    PERFORM send_slack_notification(
      NEW.project_id,
      'lead_won',
      v_message,
      jsonb_build_object(
        'lead_id', NEW.id,
        'lead_name', NEW.nombre,
        'value', NEW.valor_potencial
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_slack_lead_won ON public.leads;
CREATE TRIGGER trigger_slack_lead_won
AFTER UPDATE OF status ON public.leads
FOR EACH ROW
EXECUTE FUNCTION trigger_slack_lead_won();

-- 6. Trigger: Enviar a Slack cuando OBV se valida
CREATE OR REPLACE FUNCTION trigger_slack_obv_validated()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_name TEXT;
  v_owner_name TEXT;
  v_message TEXT;
BEGIN
  IF NEW.status = 'validated' AND OLD.status != 'validated' THEN

    SELECT nombre INTO v_project_name
    FROM public.projects
    WHERE id = NEW.project_id;

    SELECT nombre INTO v_owner_name
    FROM public.profiles
    WHERE id = NEW.owner_id;

    v_message := format(
      ':white_check_mark: *OBV Validado*\n*Proyecto:* %s\n*OBV:* %s\n*Autor:* %s',
      v_project_name,
      NEW.titulo,
      v_owner_name
    );

    PERFORM send_slack_notification(
      NEW.project_id,
      'obv_validated',
      v_message,
      jsonb_build_object(
        'obv_id', NEW.id,
        'obv_title', NEW.titulo
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_slack_obv_validated ON public.obvs;
CREATE TRIGGER trigger_slack_obv_validated
AFTER UPDATE OF status ON public.obvs
FOR EACH ROW
EXECUTE FUNCTION trigger_slack_obv_validated();

-- Comentarios
COMMENT ON TABLE public.slack_webhooks IS 'Webhooks de Slack por proyecto para notificaciones automáticas';
COMMENT ON FUNCTION send_slack_notification IS 'Envía notificación a Slack para un proyecto';
