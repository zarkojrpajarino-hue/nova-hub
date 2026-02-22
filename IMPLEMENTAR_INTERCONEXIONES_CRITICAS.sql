-- ============================================================================
-- IMPLEMENTAR INTERCONEXIONES CRÍTICAS NOVA HUB
-- ============================================================================
-- Este SQL crea las conexiones automáticas entre secciones para maximizar
-- el valor de los datos y eliminar trabajo manual
-- ============================================================================

-- ============================================================================
-- 1. CRM → FINANCIAL: Auto-crear transacción cuando lead se gana
-- ============================================================================

-- Función para crear revenue automáticamente
CREATE OR REPLACE FUNCTION auto_create_revenue_from_won_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_organization_id UUID;
  v_responsable_name TEXT;
BEGIN
  -- Solo ejecutar cuando lead cambia a cerrado_ganado
  IF NEW.estado = 'cerrado_ganado' AND (OLD IS NULL OR OLD.estado != 'cerrado_ganado') THEN

    -- Obtener organization_id del proyecto si existe
    IF NEW.project_id IS NOT NULL THEN
      SELECT organization_id INTO v_organization_id
      FROM projects
      WHERE id = NEW.project_id;
    END IF;

    -- Obtener nombre del responsable
    SELECT nombre INTO v_responsable_name
    FROM members
    WHERE id = NEW.responsable_id;

    -- Crear transacción de revenue
    INSERT INTO transactions (
      organization_id,
      project_id,
      amount,
      type,
      category,
      description,
      transaction_date,
      source_type,
      source_id,
      created_by,
      notes
    ) VALUES (
      COALESCE(v_organization_id, NEW.organization_id),
      NEW.project_id,
      COALESCE(NEW.valor_estimado, 0),
      'income',
      'revenue',
      '💰 Revenue from won lead: ' || COALESCE(NEW.empresa, 'Unknown'),
      CURRENT_DATE,
      'lead',
      NEW.id,
      NEW.responsable_id,
      'Auto-generated from lead ID: ' || NEW.id || ' | Responsible: ' || COALESCE(v_responsable_name, 'Unknown')
    );

    -- Log en consola (visible en Supabase logs)
    RAISE NOTICE 'Auto-created revenue transaction for lead % (%) - Amount: %',
      NEW.id, COALESCE(NEW.empresa, 'Unknown'), COALESCE(NEW.valor_estimado, 0);

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_auto_revenue_from_won_lead ON leads;

-- Crear trigger
CREATE TRIGGER trigger_auto_revenue_from_won_lead
AFTER INSERT OR UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION auto_create_revenue_from_won_lead();

COMMENT ON TRIGGER trigger_auto_revenue_from_won_lead ON leads IS
'Auto-creates revenue transaction when lead status changes to cerrado_ganado';


-- ============================================================================
-- 2. FINANCIAL → ALERTS: Auto-alertar gastos grandes
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_alert_large_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_threshold NUMERIC := 5000; -- Alerta si gasto > $5000
BEGIN
  -- Solo para gastos (expenses)
  IF NEW.type = 'expense' AND NEW.amount > v_threshold THEN

    -- Crear notificación
    INSERT INTO notifications (
      user_id,
      organization_id,
      type,
      title,
      message,
      priority,
      category,
      metadata
    ) VALUES (
      NEW.created_by,
      NEW.organization_id,
      'financial_alert',
      '🚨 Large Expense Detected',
      'A large expense of $' || NEW.amount || ' was recorded: ' || COALESCE(NEW.description, 'No description'),
      'high',
      'financial',
      jsonb_build_object(
        'transaction_id', NEW.id,
        'amount', NEW.amount,
        'category', NEW.category,
        'threshold', v_threshold
      )
    );

    RAISE NOTICE 'Alert created for large expense: % - Amount: %', NEW.id, NEW.amount;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_auto_alert_large_expense ON transactions;

-- Crear trigger
CREATE TRIGGER trigger_auto_alert_large_expense
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION auto_alert_large_expense();


-- ============================================================================
-- 3. TASKS → GAMIFICATION: Auto-dar puntos al completar tareas
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_award_points_for_task()
RETURNS TRIGGER AS $$
DECLARE
  v_points INTEGER := 10; -- Puntos base por tarea
  v_bonus_points INTEGER := 0;
  v_user_id UUID;
BEGIN
  -- Solo cuando tarea pasa a completada
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN

    -- Obtener user_id del assignee
    v_user_id := NEW.assigned_to;

    -- Bonus por prioridad
    IF NEW.priority = 'high' THEN
      v_bonus_points := 5;
    ELSIF NEW.priority = 'urgent' THEN
      v_bonus_points := 10;
    END IF;

    -- Bonus por completar antes de deadline
    IF NEW.due_date IS NOT NULL AND NEW.completed_at <= NEW.due_date THEN
      v_bonus_points := v_bonus_points + 5;
    END IF;

    -- Dar puntos
    IF v_user_id IS NOT NULL THEN
      INSERT INTO points (
        user_id,
        organization_id,
        points,
        reason,
        source_type,
        source_id,
        metadata
      ) VALUES (
        v_user_id,
        NEW.organization_id,
        v_points + v_bonus_points,
        'Task completed: ' || COALESCE(NEW.title, 'Untitled'),
        'task',
        NEW.id,
        jsonb_build_object(
          'base_points', v_points,
          'bonus_points', v_bonus_points,
          'priority', NEW.priority,
          'completed_early', (NEW.due_date IS NOT NULL AND NEW.completed_at <= NEW.due_date)
        )
      );

      RAISE NOTICE 'Awarded % points to user % for task %',
        (v_points + v_bonus_points), v_user_id, NEW.id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_auto_award_points_for_task ON tasks;

-- Crear trigger
CREATE TRIGGER trigger_auto_award_points_for_task
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION auto_award_points_for_task();


-- ============================================================================
-- 4. OKRS → NOTIFICATIONS: Alertar OKRs en riesgo
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_alert_at_risk_okrs()
RETURNS TRIGGER AS $$
DECLARE
  v_progress_rate NUMERIC;
  v_time_elapsed NUMERIC;
  v_owner_id UUID;
BEGIN
  -- Solo para OKRs activos
  IF NEW.status = 'active' THEN

    -- Calcular % de tiempo transcurrido
    v_time_elapsed := EXTRACT(EPOCH FROM (CURRENT_DATE - NEW.start_date)) /
                      EXTRACT(EPOCH FROM (NEW.end_date - NEW.start_date));

    -- OKR en riesgo si progreso < 50% del tiempo transcurrido
    IF NEW.progress < (v_time_elapsed * 50) AND v_time_elapsed > 0.3 THEN

      -- Obtener owner
      SELECT owner_id INTO v_owner_id FROM objectives WHERE id = NEW.objective_id;

      -- Crear alerta
      INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        message,
        priority,
        category,
        metadata
      ) VALUES (
        v_owner_id,
        NEW.organization_id,
        'okr_at_risk',
        '⚠️ OKR At Risk',
        'Key Result "' || NEW.description || '" is behind schedule. Progress: ' || NEW.progress || '%',
        'high',
        'okr',
        jsonb_build_object(
          'kr_id', NEW.id,
          'progress', NEW.progress,
          'time_elapsed_pct', ROUND(v_time_elapsed * 100, 1),
          'expected_progress', ROUND(v_time_elapsed * 100, 1)
        )
      );

      RAISE NOTICE 'At-risk alert created for KR %', NEW.id;

    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe (en key_results)
DROP TRIGGER IF EXISTS trigger_auto_alert_at_risk_okrs ON key_results;

-- Crear trigger
CREATE TRIGGER trigger_auto_alert_at_risk_okrs
AFTER UPDATE ON key_results
FOR EACH ROW
EXECUTE FUNCTION auto_alert_at_risk_okrs();


-- ============================================================================
-- 5. CRM → TASKS: Auto-crear follow-up task si lead sin contacto >5 días
-- ============================================================================

-- Función para chequear leads sin contacto
CREATE OR REPLACE FUNCTION check_leads_without_contact()
RETURNS void AS $$
DECLARE
  v_lead RECORD;
  v_days_threshold INTEGER := 5;
BEGIN
  -- Buscar leads activos sin contacto reciente
  FOR v_lead IN
    SELECT l.*
    FROM leads l
    WHERE l.estado NOT IN ('cerrado_ganado', 'cerrado_perdido')
      AND (
        l.last_contact_date IS NULL
        OR l.last_contact_date < CURRENT_DATE - INTERVAL '5 days'
      )
      AND NOT EXISTS (
        -- No crear tarea si ya existe una pendiente para este lead
        SELECT 1 FROM tasks t
        WHERE t.source_type = 'lead'
          AND t.source_id = l.id
          AND t.status != 'completed'
      )
  LOOP

    -- Crear tarea de follow-up
    INSERT INTO tasks (
      organization_id,
      project_id,
      title,
      description,
      assigned_to,
      priority,
      status,
      due_date,
      source_type,
      source_id,
      created_by
    ) VALUES (
      v_lead.organization_id,
      v_lead.project_id,
      '📞 Follow-up: ' || COALESCE(v_lead.empresa, 'Lead'),
      'This lead has not been contacted in ' || v_days_threshold || ' days. Please follow up.\n\n' ||
      'Lead: ' || COALESCE(v_lead.empresa, 'Unknown') || '\n' ||
      'Contact: ' || COALESCE(v_lead.contacto, 'N/A') || '\n' ||
      'Value: $' || COALESCE(v_lead.valor_estimado::TEXT, 'N/A'),
      v_lead.responsable_id,
      'high',
      'pending',
      CURRENT_DATE + INTERVAL '2 days',
      'lead',
      v_lead.id,
      v_lead.responsable_id
    );

    -- Notificar
    INSERT INTO notifications (
      user_id,
      organization_id,
      type,
      title,
      message,
      priority,
      category,
      metadata
    ) VALUES (
      v_lead.responsable_id,
      v_lead.organization_id,
      'follow_up_reminder',
      '📞 Follow-up Needed',
      'Lead "' || COALESCE(v_lead.empresa, 'Unknown') || '" needs follow-up',
      'medium',
      'crm',
      jsonb_build_object('lead_id', v_lead.id, 'days_since_contact', v_days_threshold)
    );

    RAISE NOTICE 'Created follow-up task for lead %', v_lead.id;

  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Esta función se puede ejecutar con pg_cron (si está disponible) o manualmente
-- Para ejecutar manualmente: SELECT check_leads_without_contact();
-- Para setup con pg_cron:
-- SELECT cron.schedule('check-leads-daily', '0 9 * * *', 'SELECT check_leads_without_contact()');


-- ============================================================================
-- 6. FINANCIAL → METRICS: Auto-actualizar métricas financieras
-- ============================================================================

CREATE OR REPLACE FUNCTION update_financial_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_monthly_revenue NUMERIC;
  v_monthly_expenses NUMERIC;
  v_profit NUMERIC;
  v_margin NUMERIC;
  v_current_month TEXT;
BEGIN
  v_current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  -- Calcular revenue del mes
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_revenue
  FROM transactions
  WHERE organization_id = NEW.organization_id
    AND type = 'income'
    AND category = 'revenue'
    AND TO_CHAR(transaction_date, 'YYYY-MM') = v_current_month;

  -- Calcular expenses del mes
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_expenses
  FROM transactions
  WHERE organization_id = NEW.organization_id
    AND type = 'expense'
    AND TO_CHAR(transaction_date, 'YYYY-MM') = v_current_month;

  -- Calcular profit y margin
  v_profit := v_monthly_revenue - v_monthly_expenses;
  v_margin := CASE
    WHEN v_monthly_revenue > 0 THEN (v_profit / v_monthly_revenue) * 100
    ELSE 0
  END;

  -- Actualizar o crear métricas
  INSERT INTO business_metrics (
    organization_id,
    user_id,
    metric_name,
    metric_value,
    metric_unit,
    period,
    recorded_at,
    metadata
  ) VALUES
    (NEW.organization_id, NEW.created_by, 'monthly_revenue', v_monthly_revenue, 'currency', v_current_month, NOW(),
     jsonb_build_object('auto_calculated', true)),
    (NEW.organization_id, NEW.created_by, 'monthly_expenses', v_monthly_expenses, 'currency', v_current_month, NOW(),
     jsonb_build_object('auto_calculated', true)),
    (NEW.organization_id, NEW.created_by, 'monthly_profit', v_profit, 'currency', v_current_month, NOW(),
     jsonb_build_object('auto_calculated', true)),
    (NEW.organization_id, NEW.created_by, 'profit_margin', v_margin, 'percentage', v_current_month, NOW(),
     jsonb_build_object('auto_calculated', true))
  ON CONFLICT (organization_id, metric_name, period)
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    recorded_at = EXCLUDED.recorded_at,
    metadata = EXCLUDED.metadata;

  RAISE NOTICE 'Updated financial metrics for org % - Revenue: %, Expenses: %, Profit: %, Margin: %%',
    NEW.organization_id, v_monthly_revenue, v_monthly_expenses, v_profit, v_margin;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_update_financial_metrics ON transactions;

-- Crear trigger
CREATE TRIGGER trigger_update_financial_metrics
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_financial_metrics();


-- ============================================================================
-- 7. Función helper para enviar notificaciones Slack desde SQL
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_slack(
  p_project_id UUID,
  p_notification_type TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  v_webhook RECORD;
  v_slack_payload JSONB;
BEGIN
  -- Obtener webhooks activos
  FOR v_webhook IN
    SELECT webhook_url
    FROM slack_webhooks
    WHERE enabled = true
      AND (project_id = p_project_id OR project_id IS NULL)
      AND notification_types @> ARRAY[p_notification_type]
  LOOP
    -- Construir payload
    v_slack_payload := jsonb_build_object(
      'text', p_message,
      'blocks', jsonb_build_array(
        jsonb_build_object(
          'type', 'section',
          'text', jsonb_build_object(
            'type', 'mrkdwn',
            'text', p_message
          )
        )
      )
    );

    -- Llamar edge function (esto requiere pg_net extension o http extension)
    -- Por ahora, solo log
    RAISE NOTICE 'Would send Slack notification: %', p_message;

  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejemplo de uso:
-- SELECT notify_slack(
--   'project-uuid',
--   'lead_won',
--   '🎉 Lead ganado: Acme Corp - $50,000',
--   '{"lead_id": "xxx", "amount": 50000}'::jsonb
-- );


-- ============================================================================
-- 8. Vista para dashboard de interconexiones
-- ============================================================================

CREATE OR REPLACE VIEW dashboard_interconnections AS
SELECT
  'CRM → Financial' as connection_name,
  COUNT(*) as auto_created_count,
  COALESCE(SUM(amount), 0) as total_value
FROM transactions
WHERE source_type = 'lead'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT
  'Tasks → Points' as connection_name,
  COUNT(*) as auto_created_count,
  COALESCE(SUM(points), 0) as total_value
FROM points
WHERE source_type = 'task'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT
  'Alerts → OKRs' as connection_name,
  COUNT(*) as auto_created_count,
  0 as total_value
FROM notifications
WHERE category = 'okr'
  AND type = 'okr_at_risk'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW dashboard_interconnections IS
'Shows automatic interconnections working in the system over last 30 days';


-- ============================================================================
-- GRANTS (asegurar permisos)
-- ============================================================================

-- Dar permisos para ejecutar funciones
GRANT EXECUTE ON FUNCTION auto_create_revenue_from_won_lead() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_alert_large_expense() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_award_points_for_task() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_alert_at_risk_okrs() TO authenticated;
GRANT EXECUTE ON FUNCTION check_leads_without_contact() TO authenticated;
GRANT EXECUTE ON FUNCTION update_financial_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_slack(UUID, TEXT, TEXT, JSONB) TO authenticated;

-- Vista
GRANT SELECT ON dashboard_interconnections TO authenticated;


-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver triggers activos
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trigger_auto%'
ORDER BY event_object_table, trigger_name;

-- Mostrar interconexiones últimos 30 días
SELECT * FROM dashboard_interconnections;


-- ============================================================================
-- TESTING (comentado, descomentar para probar)
-- ============================================================================

-- Test 1: Simular lead ganado
-- UPDATE leads SET estado = 'cerrado_ganado', valor_estimado = 10000 WHERE id = 'algún-id';
-- Verificar: SELECT * FROM transactions WHERE source_type = 'lead' ORDER BY created_at DESC LIMIT 1;

-- Test 2: Verificar seguimiento de leads
-- SELECT check_leads_without_contact();
-- Verificar: SELECT * FROM tasks WHERE source_type = 'lead' ORDER BY created_at DESC;

-- Test 3: Ver puntos auto-otorgados
-- SELECT * FROM points WHERE source_type = 'task' ORDER BY created_at DESC LIMIT 10;

-- ============================================================================
-- FIN
-- ============================================================================

-- Log final
DO $$
BEGIN
  RAISE NOTICE '✅ Interconexiones críticas implementadas exitosamente';
  RAISE NOTICE '✅ Triggers activos: CRM→Financial, Tasks→Points, OKRs→Alerts, Financial→Metrics';
  RAISE NOTICE '✅ Función programable creada: check_leads_without_contact()';
  RAISE NOTICE '✅ Vista dashboard_interconnections creada';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Ejecuta: SELECT * FROM dashboard_interconnections;';
  RAISE NOTICE '📊 Para ver interconexiones funcionando';
END $$;
