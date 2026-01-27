-- =====================================================
-- FASE 1.2: SISTEMA COMPLETO DE TRACKING DE COBROS
-- =====================================================
-- Fecha: 26 Enero 2026
-- Objetivo: Control total de cash flow y pagos
-- Estados: pendiente, cobrado_parcial, cobrado_total, atrasado
-- =====================================================

-- PASO 1: Añadir campos de tracking de cobros a tabla obvs
-- ----------------------------------------------------
DO $$
BEGIN
  -- Estado del cobro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='cobro_estado') THEN
    ALTER TABLE obvs ADD COLUMN cobro_estado TEXT DEFAULT 'pendiente';
    COMMENT ON COLUMN obvs.cobro_estado IS 'Estados: pendiente, cobrado_parcial, cobrado_total, atrasado';
  END IF;

  -- Fecha esperada de cobro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='cobro_fecha_esperada') THEN
    ALTER TABLE obvs ADD COLUMN cobro_fecha_esperada DATE;
    COMMENT ON COLUMN obvs.cobro_fecha_esperada IS 'Fecha en la que se espera recibir el pago';
  END IF;

  -- Fecha real de cobro completo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='cobro_fecha_real') THEN
    ALTER TABLE obvs ADD COLUMN cobro_fecha_real DATE;
    COMMENT ON COLUMN obvs.cobro_fecha_real IS 'Fecha en la que se completó el cobro total';
  END IF;

  -- Método de pago
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='cobro_metodo') THEN
    ALTER TABLE obvs ADD COLUMN cobro_metodo TEXT;
    COMMENT ON COLUMN obvs.cobro_metodo IS 'Método: transferencia, tarjeta, efectivo, paypal, stripe, bizum, etc.';
  END IF;

  -- Días de retraso (calculado)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='cobro_dias_retraso') THEN
    ALTER TABLE obvs ADD COLUMN cobro_dias_retraso INTEGER GENERATED ALWAYS AS (
      CASE
        WHEN cobro_estado IN ('pendiente', 'cobrado_parcial') AND cobro_fecha_esperada IS NOT NULL
        THEN GREATEST(0, EXTRACT(DAY FROM (CURRENT_DATE - cobro_fecha_esperada))::INTEGER)
        ELSE 0
      END
    ) STORED;
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_obvs_cobro_estado ON obvs(cobro_estado);
CREATE INDEX IF NOT EXISTS idx_obvs_cobro_fecha_esperada ON obvs(cobro_fecha_esperada) WHERE cobro_estado != 'cobrado_total';

-- PASO 2: Crear tabla para cobros parciales (pagos en cuotas)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS cobros_parciales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  fecha_cobro DATE NOT NULL,
  metodo TEXT,
  notas TEXT,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cobros_parciales_obv_id ON cobros_parciales(obv_id);
CREATE INDEX IF NOT EXISTS idx_cobros_parciales_fecha ON cobros_parciales(fecha_cobro DESC);

-- RLS para cobros parciales
ALTER TABLE cobros_parciales ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "All authenticated can view cobros parciales"
  ON cobros_parciales FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "All authenticated can create cobros parciales"
  ON cobros_parciales FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Creator can update cobro parcial"
  ON cobros_parciales FOR UPDATE TO authenticated
  USING (created_by = (SELECT id FROM members WHERE auth_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Creator can delete cobro parcial"
  ON cobros_parciales FOR DELETE TO authenticated
  USING (created_by = (SELECT id FROM members WHERE auth_id = auth.uid()));

-- PASO 3: Trigger para actualizar estado de cobro automáticamente
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_estado_cobro()
RETURNS TRIGGER AS $$
DECLARE
  total_cobrado DECIMAL(12,2);
  facturacion_total DECIMAL(12,2);
  obv_record RECORD;
BEGIN
  -- Obtener datos de la OBV
  SELECT facturacion, es_venta INTO obv_record
  FROM obvs WHERE id = NEW.obv_id;

  -- Solo procesar si es una venta
  IF NOT obv_record.es_venta THEN
    RETURN NEW;
  END IF;

  facturacion_total := COALESCE(obv_record.facturacion, 0);

  -- Sumar todos los cobros parciales de esta OBV
  SELECT COALESCE(SUM(monto), 0) INTO total_cobrado
  FROM cobros_parciales WHERE obv_id = NEW.obv_id;

  -- Actualizar estado según lo cobrado
  IF total_cobrado >= facturacion_total AND facturacion_total > 0 THEN
    -- Cobro completo
    UPDATE obvs SET
      cobro_estado = 'cobrado_total',
      cobrado = TRUE,
      cobrado_parcial = total_cobrado,
      cobro_fecha_real = NEW.fecha_cobro
    WHERE id = NEW.obv_id;

  ELSIF total_cobrado > 0 THEN
    -- Cobro parcial
    UPDATE obvs SET
      cobro_estado = 'cobrado_parcial',
      cobrado = FALSE,
      cobrado_parcial = total_cobrado
    WHERE id = NEW.obv_id;

  ELSE
    -- Sin cobros aún
    UPDATE obvs SET
      cobro_estado = 'pendiente',
      cobrado = FALSE,
      cobrado_parcial = 0
    WHERE id = NEW.obv_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_actualizar_estado_cobro ON cobros_parciales;
CREATE TRIGGER trigger_actualizar_estado_cobro
AFTER INSERT OR UPDATE OR DELETE ON cobros_parciales
FOR EACH ROW EXECUTE FUNCTION actualizar_estado_cobro();

-- PASO 4: Función para marcar cobros atrasados automáticamente
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION marcar_cobros_atrasados()
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  -- Marcar como atrasado si:
  -- 1. Estado es pendiente o cobrado_parcial
  -- 2. Es una venta validada
  -- 3. Fecha esperada pasó hace más de 30 días
  UPDATE obvs
  SET cobro_estado = 'atrasado'
  WHERE cobro_estado IN ('pendiente', 'cobrado_parcial')
    AND es_venta = TRUE
    AND status = 'validated'
    AND cobro_fecha_esperada IS NOT NULL
    AND cobro_fecha_esperada < CURRENT_DATE - INTERVAL '30 days';

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  -- Log de ejecución
  RAISE NOTICE 'Cobros marcados como atrasados: %', rows_updated;

  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar función inmediatamente
SELECT marcar_cobros_atrasados();

-- Nota: Configurar pg_cron o edge function para ejecutar diariamente:
-- SELECT cron.schedule('marcar-cobros-atrasados', '0 6 * * *', 'SELECT marcar_cobros_atrasados()');

-- PASO 5: View para dashboard de cobros
-- ----------------------------------------------------
CREATE OR REPLACE VIEW dashboard_cobros AS
SELECT
  -- Totales globales
  COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated') as total_ventas,
  SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated') as total_facturado,
  SUM(COALESCE(o.cobrado_parcial, 0)) FILTER (WHERE o.es_venta AND o.status = 'validated') as total_cobrado,
  SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado = 'pendiente') as total_pendiente,
  SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado = 'atrasado') as total_atrasado,

  -- Contadores por estado
  COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado = 'pendiente') as num_pendientes,
  COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado = 'cobrado_parcial') as num_parciales,
  COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado = 'cobrado_total') as num_cobrados,
  COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado = 'atrasado') as num_atrasados,

  -- Métricas
  ROUND(AVG(o.cobro_dias_retraso) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado = 'cobrado_total'), 1) as dias_promedio_cobro,
  ROUND(
    COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado = 'atrasado')::DECIMAL * 100.0 /
    NULLIF(COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0),
    2
  ) as tasa_morosidad_porcentaje

FROM obvs o;

-- View para cobros por proyecto
CREATE OR REPLACE VIEW cobros_por_proyecto AS
SELECT
  p.id as project_id,
  p.nombre as proyecto,
  p.color as proyecto_color,
  p.icon as proyecto_icon,

  -- Totales
  COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated') as num_ventas,
  SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated') as facturado,
  SUM(COALESCE(o.cobrado_parcial, 0)) FILTER (WHERE o.es_venta AND o.status = 'validated') as cobrado,
  SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado IN ('pendiente', 'cobrado_parcial')) as pendiente,

  -- Métricas
  ROUND(
    SUM(COALESCE(o.cobrado_parcial, 0))::DECIMAL * 100.0 /
    NULLIF(SUM(o.facturacion) FILTER (WHERE o.es_venta AND o.status = 'validated'), 0),
    1
  ) as porcentaje_cobrado,

  COUNT(*) FILTER (WHERE o.es_venta AND o.status = 'validated' AND o.cobro_estado = 'atrasado') as num_atrasados

FROM projects p
LEFT JOIN obvs o ON o.project_id = p.id
GROUP BY p.id, p.nombre, p.color, p.icon;

-- View para timeline de cobros esperados
CREATE OR REPLACE VIEW timeline_cobros_esperados AS
SELECT
  o.id as obv_id,
  o.titulo,
  o.empresa,
  o.facturacion,
  COALESCE(o.cobrado_parcial, 0) as cobrado,
  o.facturacion - COALESCE(o.cobrado_parcial, 0) as pendiente,
  o.cobro_fecha_esperada,
  o.cobro_estado,
  o.cobro_dias_retraso,
  p.nombre as proyecto,
  p.color as proyecto_color,
  owner.nombre as responsable,
  owner.color as responsable_color
FROM obvs o
JOIN projects p ON o.project_id = p.id
JOIN members owner ON o.owner_id = owner.id
WHERE o.es_venta = TRUE
  AND o.status = 'validated'
  AND o.cobro_estado IN ('pendiente', 'cobrado_parcial', 'atrasado')
  AND o.cobro_fecha_esperada IS NOT NULL
ORDER BY o.cobro_fecha_esperada ASC;

-- View para alertas de cobros atrasados
CREATE OR REPLACE VIEW alertas_cobros_atrasados AS
SELECT
  o.id as obv_id,
  o.titulo,
  o.empresa,
  o.email_contacto,
  o.telefono_contacto,
  o.facturacion - COALESCE(o.cobrado_parcial, 0) as monto_pendiente,
  o.cobro_fecha_esperada,
  o.cobro_dias_retraso,
  p.nombre as proyecto,
  owner.nombre as responsable,
  owner.id as responsable_id
FROM obvs o
JOIN projects p ON o.project_id = p.id
JOIN members owner ON o.owner_id = owner.id
WHERE o.es_venta = TRUE
  AND o.status = 'validated'
  AND o.cobro_estado = 'atrasado'
ORDER BY o.cobro_dias_retraso DESC;

-- PASO 6: Función para registrar cobro parcial
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION registrar_cobro_parcial(
  p_obv_id UUID,
  p_monto DECIMAL,
  p_fecha_cobro DATE,
  p_metodo TEXT DEFAULT NULL,
  p_notas TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  nuevo_cobro_id UUID;
  current_user_id UUID;
BEGIN
  -- Obtener ID del usuario actual
  SELECT id INTO current_user_id FROM members WHERE auth_id = auth.uid() LIMIT 1;

  -- Validar que la OBV existe y es una venta
  IF NOT EXISTS (
    SELECT 1 FROM obvs
    WHERE id = p_obv_id
      AND es_venta = TRUE
      AND status = 'validated'
  ) THEN
    RAISE EXCEPTION 'OBV no encontrada o no es una venta validada';
  END IF;

  -- Insertar cobro parcial
  INSERT INTO cobros_parciales (
    obv_id,
    monto,
    fecha_cobro,
    metodo,
    notas,
    created_by
  ) VALUES (
    p_obv_id,
    p_monto,
    p_fecha_cobro,
    p_metodo,
    p_notas,
    current_user_id
  )
  RETURNING id INTO nuevo_cobro_id;

  -- El trigger actualizar_estado_cobro se ejecuta automáticamente

  RETURN nuevo_cobro_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 7: Inicializar estado de cobros para OBVs existentes
-- ----------------------------------------------------
DO $$
BEGIN
  -- Actualizar OBVs de venta que no tienen estado de cobro
  UPDATE obvs
  SET
    cobro_estado = CASE
      WHEN cobrado = TRUE THEN 'cobrado_total'
      WHEN cobrado_parcial > 0 THEN 'cobrado_parcial'
      ELSE 'pendiente'
    END,
    cobro_fecha_real = CASE WHEN cobrado = TRUE THEN validated_at::DATE END
  WHERE es_venta = TRUE
    AND status = 'validated'
    AND cobro_estado IS NULL;

  RAISE NOTICE 'Estados de cobro inicializados';
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecuta estas queries para verificar el sistema:

-- 1. Ver dashboard de cobros global:
-- SELECT * FROM dashboard_cobros;

-- 2. Ver cobros por proyecto:
-- SELECT * FROM cobros_por_proyecto;

-- 3. Ver timeline de cobros esperados:
-- SELECT * FROM timeline_cobros_esperados LIMIT 10;

-- 4. Ver alertas de cobros atrasados:
-- SELECT * FROM alertas_cobros_atrasados;

-- 5. Registrar un cobro parcial de prueba:
-- SELECT registrar_cobro_parcial(
--   'id-de-una-obv',
--   1000.00,
--   CURRENT_DATE,
--   'transferencia',
--   'Primer pago de 3 cuotas'
-- );

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Configurar cron job para ejecutar marcar_cobros_atrasados() diariamente
-- 2. Los cobros parciales actualizan automáticamente el estado de la OBV
-- 3. Una OBV se marca como atrasada a los 30 días de la fecha esperada
-- 4. Días promedio de cobro se calcula solo para ventas cobradas completamente
