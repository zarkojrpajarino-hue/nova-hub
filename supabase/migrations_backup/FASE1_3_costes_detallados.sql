-- =====================================================
-- FASE 1.3: COSTES DETALLADOS CON DESGLOSE POR CATEGORÍA
-- =====================================================
-- Fecha: 26 Enero 2026
-- Objetivo: Análisis profundo de estructura de costes
-- Categorías: materiales, subcontratacion, herramientas,
--             marketing, logistica, comisiones, otros
-- =====================================================

-- PASO 1: Añadir columna JSONB para desglose de costes
-- ----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='costes_detalle') THEN
    ALTER TABLE obvs ADD COLUMN costes_detalle JSONB;
    COMMENT ON COLUMN obvs.costes_detalle IS 'Desglose de costes: {materiales, subcontratacion, herramientas, marketing, logistica, comisiones, otros}';
  END IF;
END $$;

-- Índice GIN para consultas JSON rápidas
CREATE INDEX IF NOT EXISTS idx_obvs_costes_detalle ON obvs USING gin(costes_detalle);

-- PASO 2: Función para validar estructura de costes_detalle
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION validar_estructura_costes(costes JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validar que solo tenga las claves permitidas
  IF costes IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Verificar que todas las claves sean válidas
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(costes) AS key
    WHERE key NOT IN (
      'materiales',
      'subcontratacion',
      'herramientas',
      'marketing',
      'logistica',
      'comisiones',
      'otros'
    )
  ) THEN
    RAISE EXCEPTION 'Categoría de coste inválida. Permitidas: materiales, subcontratacion, herramientas, marketing, logistica, comisiones, otros';
  END IF;

  -- Verificar que todos los valores sean numéricos no negativos
  IF EXISTS (
    SELECT 1 FROM jsonb_each(costes) AS entry
    WHERE NOT (entry.value::text ~ '^\d+(\.\d+)?$' AND (entry.value::text)::decimal >= 0)
  ) THEN
    RAISE EXCEPTION 'Todos los valores de costes deben ser números positivos';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASO 3: Función para calcular costes totales desde detalle
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION calcular_costes_desde_detalle(costes JSONB)
RETURNS DECIMAL AS $$
BEGIN
  IF costes IS NULL THEN
    RETURN 0;
  END IF;

  RETURN (
    COALESCE((costes->>'materiales')::DECIMAL, 0) +
    COALESCE((costes->>'subcontratacion')::DECIMAL, 0) +
    COALESCE((costes->>'herramientas')::DECIMAL, 0) +
    COALESCE((costes->>'marketing')::DECIMAL, 0) +
    COALESCE((costes->>'logistica')::DECIMAL, 0) +
    COALESCE((costes->>'comisiones')::DECIMAL, 0) +
    COALESCE((costes->>'otros')::DECIMAL, 0)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASO 4: Trigger para auto-calcular costes y margen
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION auto_calcular_costes_y_margen()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar estructura de costes_detalle si se proporciona
  IF NEW.costes_detalle IS NOT NULL THEN
    PERFORM validar_estructura_costes(NEW.costes_detalle);

    -- Calcular costes totales desde el detalle
    NEW.costes := calcular_costes_desde_detalle(NEW.costes_detalle);
  END IF;

  -- Si no hay detalle pero hay costes, crear detalle con todo en "otros"
  IF NEW.costes_detalle IS NULL AND NEW.costes IS NOT NULL AND NEW.costes > 0 THEN
    NEW.costes_detalle := jsonb_build_object('otros', NEW.costes);
  END IF;

  -- Recalcular margen si es una venta
  IF NEW.es_venta = TRUE AND NEW.facturacion IS NOT NULL THEN
    NEW.margen := NEW.facturacion - COALESCE(NEW.costes, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_calcular_costes ON obvs;
CREATE TRIGGER trigger_auto_calcular_costes
BEFORE INSERT OR UPDATE ON obvs
FOR EACH ROW
WHEN (NEW.es_venta = TRUE)
EXECUTE FUNCTION auto_calcular_costes_y_margen();

-- PASO 5: View para análisis de costes por categoría (global)
-- ----------------------------------------------------
CREATE OR REPLACE VIEW analisis_costes_global AS
SELECT
  COUNT(*) as num_ventas,
  SUM(COALESCE((costes_detalle->>'materiales')::DECIMAL, 0)) as total_materiales,
  SUM(COALESCE((costes_detalle->>'subcontratacion')::DECIMAL, 0)) as total_subcontratacion,
  SUM(COALESCE((costes_detalle->>'herramientas')::DECIMAL, 0)) as total_herramientas,
  SUM(COALESCE((costes_detalle->>'marketing')::DECIMAL, 0)) as total_marketing,
  SUM(COALESCE((costes_detalle->>'logistica')::DECIMAL, 0)) as total_logistica,
  SUM(COALESCE((costes_detalle->>'comisiones')::DECIMAL, 0)) as total_comisiones,
  SUM(COALESCE((costes_detalle->>'otros')::DECIMAL, 0)) as total_otros,
  SUM(COALESCE(costes, 0)) as total_costes,

  -- Porcentajes
  ROUND(
    SUM(COALESCE((costes_detalle->>'materiales')::DECIMAL, 0)) * 100.0 /
    NULLIF(SUM(COALESCE(costes, 0)), 0),
    1
  ) as pct_materiales,
  ROUND(
    SUM(COALESCE((costes_detalle->>'subcontratacion')::DECIMAL, 0)) * 100.0 /
    NULLIF(SUM(COALESCE(costes, 0)), 0),
    1
  ) as pct_subcontratacion,
  ROUND(
    SUM(COALESCE((costes_detalle->>'herramientas')::DECIMAL, 0)) * 100.0 /
    NULLIF(SUM(COALESCE(costes, 0)), 0),
    1
  ) as pct_herramientas,
  ROUND(
    SUM(COALESCE((costes_detalle->>'marketing')::DECIMAL, 0)) * 100.0 /
    NULLIF(SUM(COALESCE(costes, 0)), 0),
    1
  ) as pct_marketing,
  ROUND(
    SUM(COALESCE((costes_detalle->>'logistica')::DECIMAL, 0)) * 100.0 /
    NULLIF(SUM(COALESCE(costes, 0)), 0),
    1
  ) as pct_logistica,
  ROUND(
    SUM(COALESCE((costes_detalle->>'comisiones')::DECIMAL, 0)) * 100.0 /
    NULLIF(SUM(COALESCE(costes, 0)), 0),
    1
  ) as pct_comisiones,
  ROUND(
    SUM(COALESCE((costes_detalle->>'otros')::DECIMAL, 0)) * 100.0 /
    NULLIF(SUM(COALESCE(costes, 0)), 0),
    1
  ) as pct_otros

FROM obvs
WHERE es_venta = TRUE
  AND status = 'validated'
  AND costes_detalle IS NOT NULL;

-- View para análisis de costes por proyecto
CREATE OR REPLACE VIEW analisis_costes_por_proyecto AS
SELECT
  p.id as project_id,
  p.nombre as proyecto,
  p.color as proyecto_color,

  COUNT(*) as num_ventas,
  SUM(COALESCE((o.costes_detalle->>'materiales')::DECIMAL, 0)) as total_materiales,
  SUM(COALESCE((o.costes_detalle->>'subcontratacion')::DECIMAL, 0)) as total_subcontratacion,
  SUM(COALESCE((o.costes_detalle->>'herramientas')::DECIMAL, 0)) as total_herramientas,
  SUM(COALESCE((o.costes_detalle->>'marketing')::DECIMAL, 0)) as total_marketing,
  SUM(COALESCE((o.costes_detalle->>'logistica')::DECIMAL, 0)) as total_logistica,
  SUM(COALESCE((o.costes_detalle->>'comisiones')::DECIMAL, 0)) as total_comisiones,
  SUM(COALESCE((o.costes_detalle->>'otros')::DECIMAL, 0)) as total_otros,
  SUM(COALESCE(o.costes, 0)) as total_costes,

  -- Facturación y margen para contexto
  SUM(o.facturacion) as facturacion,
  SUM(o.margen) as margen,

  -- % de costes sobre facturación
  ROUND(
    SUM(COALESCE(o.costes, 0)) * 100.0 /
    NULLIF(SUM(o.facturacion), 0),
    1
  ) as pct_costes_sobre_facturacion

FROM projects p
LEFT JOIN obvs o ON o.project_id = p.id
  AND o.es_venta = TRUE
  AND o.status = 'validated'
  AND o.costes_detalle IS NOT NULL
GROUP BY p.id, p.nombre, p.color;

-- View para identificar categorías más costosas por proyecto
CREATE OR REPLACE VIEW top_categorias_costes AS
SELECT
  p.nombre as proyecto,
  categoria,
  total,
  ROUND(porcentaje, 1) as porcentaje
FROM (
  SELECT
    p.id as project_id,
    p.nombre,
    'Materiales' as categoria,
    SUM(COALESCE((o.costes_detalle->>'materiales')::DECIMAL, 0)) as total,
    SUM(COALESCE((o.costes_detalle->>'materiales')::DECIMAL, 0)) * 100.0 /
      NULLIF(SUM(COALESCE(o.costes, 0)), 0) as porcentaje
  FROM projects p
  LEFT JOIN obvs o ON o.project_id = p.id AND o.es_venta = TRUE AND o.status = 'validated'
  GROUP BY p.id, p.nombre

  UNION ALL

  SELECT
    p.id,
    p.nombre,
    'Subcontratación',
    SUM(COALESCE((o.costes_detalle->>'subcontratacion')::DECIMAL, 0)),
    SUM(COALESCE((o.costes_detalle->>'subcontratacion')::DECIMAL, 0)) * 100.0 /
      NULLIF(SUM(COALESCE(o.costes, 0)), 0)
  FROM projects p
  LEFT JOIN obvs o ON o.project_id = p.id AND o.es_venta = TRUE AND o.status = 'validated'
  GROUP BY p.id, p.nombre

  UNION ALL

  SELECT
    p.id,
    p.nombre,
    'Herramientas',
    SUM(COALESCE((o.costes_detalle->>'herramientas')::DECIMAL, 0)),
    SUM(COALESCE((o.costes_detalle->>'herramientas')::DECIMAL, 0)) * 100.0 /
      NULLIF(SUM(COALESCE(o.costes, 0)), 0)
  FROM projects p
  LEFT JOIN obvs o ON o.project_id = p.id AND o.es_venta = TRUE AND o.status = 'validated'
  GROUP BY p.id, p.nombre

  UNION ALL

  SELECT
    p.id,
    p.nombre,
    'Marketing',
    SUM(COALESCE((o.costes_detalle->>'marketing')::DECIMAL, 0)),
    SUM(COALESCE((o.costes_detalle->>'marketing')::DECIMAL, 0)) * 100.0 /
      NULLIF(SUM(COALESCE(o.costes, 0)), 0)
  FROM projects p
  LEFT JOIN obvs o ON o.project_id = p.id AND o.es_venta = TRUE AND o.status = 'validated'
  GROUP BY p.id, p.nombre

  UNION ALL

  SELECT
    p.id,
    p.nombre,
    'Logística',
    SUM(COALESCE((o.costes_detalle->>'logistica')::DECIMAL, 0)),
    SUM(COALESCE((o.costes_detalle->>'logistica')::DECIMAL, 0)) * 100.0 /
      NULLIF(SUM(COALESCE(o.costes, 0)), 0)
  FROM projects p
  LEFT JOIN obvs o ON o.project_id = p.id AND o.es_venta = TRUE AND o.status = 'validated'
  GROUP BY p.id, p.nombre

  UNION ALL

  SELECT
    p.id,
    p.nombre,
    'Comisiones',
    SUM(COALESCE((o.costes_detalle->>'comisiones')::DECIMAL, 0)),
    SUM(COALESCE((o.costes_detalle->>'comisiones')::DECIMAL, 0)) * 100.0 /
      NULLIF(SUM(COALESCE(o.costes, 0)), 0)
  FROM projects p
  LEFT JOIN obvs o ON o.project_id = p.id AND o.es_venta = TRUE AND o.status = 'validated'
  GROUP BY p.id, p.nombre

  UNION ALL

  SELECT
    p.id,
    p.nombre,
    'Otros',
    SUM(COALESCE((o.costes_detalle->>'otros')::DECIMAL, 0)),
    SUM(COALESCE((o.costes_detalle->>'otros')::DECIMAL, 0)) * 100.0 /
      NULLIF(SUM(COALESCE(o.costes, 0)), 0)
  FROM projects p
  LEFT JOIN obvs o ON o.project_id = p.id AND o.es_venta = TRUE AND o.status = 'validated'
  GROUP BY p.id, p.nombre
) subquery
WHERE total > 0
ORDER BY proyecto, porcentaje DESC;

-- PASO 6: Función helper para crear estructura de costes
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION crear_costes_detalle(
  p_materiales DECIMAL DEFAULT 0,
  p_subcontratacion DECIMAL DEFAULT 0,
  p_herramientas DECIMAL DEFAULT 0,
  p_marketing DECIMAL DEFAULT 0,
  p_logistica DECIMAL DEFAULT 0,
  p_comisiones DECIMAL DEFAULT 0,
  p_otros DECIMAL DEFAULT 0
)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'materiales', COALESCE(p_materiales, 0),
    'subcontratacion', COALESCE(p_subcontratacion, 0),
    'herramientas', COALESCE(p_herramientas, 0),
    'marketing', COALESCE(p_marketing, 0),
    'logistica', COALESCE(p_logistica, 0),
    'comisiones', COALESCE(p_comisiones, 0),
    'otros', COALESCE(p_otros, 0)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASO 7: Migrar costes existentes a estructura detallada
-- ----------------------------------------------------
DO $$
BEGIN
  -- Solo para OBVs de venta que tienen costes pero no tienen detalle
  UPDATE obvs
  SET costes_detalle = jsonb_build_object('otros', costes)
  WHERE es_venta = TRUE
    AND costes > 0
    AND costes_detalle IS NULL;

  RAISE NOTICE 'Costes existentes migrados a estructura detallada';
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecuta estas queries para verificar el sistema:

-- 1. Ver análisis de costes global:
-- SELECT * FROM analisis_costes_global;

-- 2. Ver análisis de costes por proyecto:
-- SELECT * FROM analisis_costes_por_proyecto;

-- 3. Ver top categorías de costes por proyecto:
-- SELECT * FROM top_categorias_costes;

-- 4. Crear costes detallados para una OBV:
-- UPDATE obvs
-- SET costes_detalle = crear_costes_detalle(
--   p_materiales := 450.00,
--   p_subcontratacion := 800.00,
--   p_herramientas := 120.00,
--   p_marketing := 230.00,
--   p_logistica := 50.00,
--   p_comisiones := 150.00,
--   p_otros := 100.00
-- )
-- WHERE id = 'tu-obv-id';

-- 5. Ver una OBV con costes detallados:
-- SELECT
--   titulo,
--   facturacion,
--   costes,
--   margen,
--   costes_detalle,
--   costes_detalle->>'materiales' as materiales,
--   costes_detalle->>'subcontratacion' as subcontratacion
-- FROM obvs
-- WHERE costes_detalle IS NOT NULL
-- LIMIT 1;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. El campo costes_detalle es opcional
-- 2. Si se proporciona costes_detalle, el campo costes se calcula automáticamente
-- 3. Si solo se proporciona costes sin detalle, se crea detalle con todo en "otros"
-- 4. El margen se recalcula automáticamente cuando cambian costes o facturación
-- 5. Categorías permitidas: materiales, subcontratacion, herramientas,
--    marketing, logistica, comisiones, otros
