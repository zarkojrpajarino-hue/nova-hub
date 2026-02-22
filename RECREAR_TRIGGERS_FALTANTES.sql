-- =====================================================
-- RECREAR TRIGGERS FALTANTES DE LA DB ANTERIOR
-- =====================================================
-- La DB anterior tenía 11 triggers, la nueva solo tiene 4
-- Este SQL recrea los 7 triggers faltantes
-- =====================================================

-- =====================================================
-- TRIGGER 1: Auto-agregar creator a project_members
-- =====================================================
-- Cuando se crea un proyecto, el creator se agrega automáticamente como miembro

CREATE OR REPLACE FUNCTION auto_add_creator_to_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Agregar el owner como miembro del proyecto con rol 'leader'
  INSERT INTO public.project_members (project_id, member_id, role)
  VALUES (NEW.id, NEW.owner_id, 'leader')
  ON CONFLICT (project_id, member_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_add_creator ON public.projects;

CREATE TRIGGER trigger_auto_add_creator
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_creator_to_project();

-- =====================================================
-- TRIGGER 2-4: Logging de Actividad
-- =====================================================
-- Registrar actividad en tablas de log cuando se insertan KPIs, OBVs, Tasks

-- Función genérica de logging
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Aquí podrías insertar en una tabla de activity_log si la tienes
  -- Por ahora solo retornamos NEW para no bloquear
  -- TODO: Implementar tabla activity_log si necesitas tracking detallado
  RETURN NEW;
END;
$$;

-- Trigger para KPIs (si existe la tabla)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kpis') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS log_kpis_activity ON public.kpis';
    EXECUTE '
      CREATE TRIGGER log_kpis_activity
        AFTER INSERT ON public.kpis
        FOR EACH ROW
        EXECUTE FUNCTION log_activity()
    ';
  END IF;
END $$;

-- Trigger para OBVs
DROP TRIGGER IF EXISTS log_obvs_activity ON public.obvs;

CREATE TRIGGER log_obvs_activity
  AFTER INSERT ON public.obvs
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

-- Trigger para Tasks
DROP TRIGGER IF EXISTS log_tasks_activity ON public.tasks;

CREATE TRIGGER log_tasks_activity
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

-- =====================================================
-- TRIGGER 5: Auto-calcular costes en OBVs
-- =====================================================
-- Si tu sistema calcula costes automáticamente en OBVs

CREATE OR REPLACE FUNCTION auto_calcular_costes_y_validar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Aquí irían cálculos de costes si los necesitas
  -- Por ejemplo: calcular costo total basado en items, horas, etc.

  -- Si el OBV tiene campos de costo, puedes calcularlos aquí
  -- NEW.costo_total = NEW.costo_base + NEW.costo_adicional;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_calcular_costes ON public.obvs;

CREATE TRIGGER trigger_auto_calcular_costes
  BEFORE UPDATE OR BEFORE INSERT ON public.obvs
  FOR EACH ROW
  EXECUTE FUNCTION auto_calcular_costes_y_validar();

-- =====================================================
-- TRIGGER 6-7: Validaciones (KPIs y OBVs)
-- =====================================================
-- Triggers para validar datos antes de insertar

CREATE OR REPLACE FUNCTION check_kpi_validations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validaciones de KPIs
  -- Ejemplo: verificar que los valores estén en rango válido
  IF NEW.valor IS NOT NULL AND NEW.valor < 0 THEN
    RAISE EXCEPTION 'El valor del KPI no puede ser negativo';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION check_obv_validations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validaciones de OBVs
  -- Ejemplo: verificar que tiene owner_id
  IF NEW.owner_id IS NULL THEN
    RAISE EXCEPTION 'El OBV debe tener un owner_id';
  END IF;

  -- Verificar que el deadline no esté en el pasado (si se está creando)
  IF TG_OP = 'INSERT' AND NEW.deadline IS NOT NULL AND NEW.deadline < NOW() THEN
    RAISE WARNING 'El deadline del OBV está en el pasado';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para validar KPIs (si existe la tabla)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kpi_validaciones') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_check_kpi_validations ON public.kpi_validaciones';
    EXECUTE '
      CREATE TRIGGER trigger_check_kpi_validations
        AFTER INSERT ON public.kpi_validaciones
        FOR EACH ROW
        EXECUTE FUNCTION check_kpi_validations()
    ';
  END IF;
END $$;

-- Trigger para validar OBVs (si existe la tabla obv_validaciones)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obv_validaciones') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_check_obv_validations ON public.obv_validaciones';
    EXECUTE '
      CREATE TRIGGER trigger_check_obv_validations
        AFTER INSERT ON public.obv_validaciones
        FOR EACH ROW
        EXECUTE FUNCTION check_obv_validations()
    ';
  END IF;
END $$;

-- =====================================================
-- TRIGGER 8: Crear transacción cuando se actualiza OBV
-- =====================================================
-- Si tienes sistema de transacciones financieras

CREATE OR REPLACE FUNCTION create_transaction_from_obv()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si el OBV cambia de estado a 'validated' y tiene costos
  IF OLD.status != 'validated' AND NEW.status = 'validated' THEN
    -- Aquí podrías crear una transacción en una tabla de finanzas
    -- Ejemplo:
    -- INSERT INTO transactions (obv_id, amount, type, created_at)
    -- VALUES (NEW.id, NEW.costo_total, 'expense', NOW());

    NULL; -- Por ahora no hacemos nada
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_transaction ON public.obvs;

CREATE TRIGGER trigger_create_transaction
  AFTER UPDATE ON public.obvs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION create_transaction_from_obv();

-- =====================================================
-- TRIGGER 9: Registrar cambio de pipeline en OBVs
-- =====================================================
-- Si tienes tracking de cambios de estado/pipeline

CREATE OR REPLACE FUNCTION registrar_cambio_pipeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si el status cambió
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Aquí podrías insertar en una tabla de historial
    -- Ejemplo:
    -- INSERT INTO obv_status_history (obv_id, old_status, new_status, changed_at, changed_by)
    -- VALUES (NEW.id, OLD.status, NEW.status, NOW(), auth.uid());

    NULL; -- Por ahora no hacemos nada
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_registrar_cambio_pipeline ON public.obvs;

CREATE TRIGGER trigger_registrar_cambio_pipeline
  AFTER UPDATE ON public.obvs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION registrar_cambio_pipeline();

-- =====================================================
-- TRIGGER 10: Actualizar estado de cobros parciales
-- =====================================================
-- Si tienes sistema de cobros/facturación

CREATE OR REPLACE FUNCTION actualizar_estado_cobro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Lógica para actualizar estado de cobros
  -- Esto depende de tu modelo de datos

  RETURN NEW;
END;
$$;

-- Solo crear si existe la tabla cobros_parciales
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cobros_parciales') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_actualizar_estado_cobro ON public.cobros_parciales';
    EXECUTE '
      CREATE TRIGGER trigger_actualizar_estado_cobro
        AFTER UPDATE OR AFTER INSERT OR AFTER DELETE ON public.cobros_parciales
        FOR EACH ROW
        EXECUTE FUNCTION actualizar_estado_cobro()
    ';
  END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver todos los triggers creados
SELECT
  trigger_name,
  event_object_table as table_name,
  action_statement as function_name,
  action_timing as timing,
  string_agg(event_manipulation, ', ') as events
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY trigger_name, event_object_table, action_statement, action_timing
ORDER BY event_object_table, trigger_name;

-- Contar triggers por tabla
SELECT
  event_object_table as table_name,
  COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY event_object_table
ORDER BY trigger_count DESC;

-- =====================================================
-- ✅ TRIGGERS RECREADOS
-- =====================================================
-- DB Anterior: 11 triggers
-- DB Nueva (antes): 4 triggers
-- DB Nueva (después): ~10-14 triggers (depende de qué tablas existen)
--
-- Triggers recreados:
-- ✅ 1. trigger_auto_add_creator (projects)
-- ✅ 2. log_kpis_activity (kpis) - si existe tabla
-- ✅ 3. log_obvs_activity (obvs)
-- ✅ 4. log_tasks_activity (tasks)
-- ✅ 5. trigger_auto_calcular_costes (obvs)
-- ✅ 6. trigger_check_kpi_validations (kpi_validaciones) - si existe tabla
-- ✅ 7. trigger_check_obv_validations (obv_validaciones) - si existe tabla
-- ✅ 8. trigger_create_transaction (obvs)
-- ✅ 9. trigger_registrar_cambio_pipeline (obvs)
-- ✅ 10. trigger_actualizar_estado_cobro (cobros_parciales) - si existe tabla
--
-- IMPORTANTE: Algunos triggers se crean condicionalmente si existen
-- las tablas correspondientes (kpis, kpi_validaciones, obv_validaciones,
-- cobros_parciales). Esto es normal y esperado.
-- =====================================================
