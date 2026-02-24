-- =====================================================
-- FASE 1.1: UNIFICAR TABLA LEADS CON OBVS
-- =====================================================
-- Fecha: 26 Enero 2026
-- Objetivo: Eliminar duplicidad entre leads y obvs
-- Leads y OBVs de exploración/validación son la misma cosa
-- =====================================================

-- PASO 1: Añadir campos de pipeline a tabla obvs
-- ----------------------------------------------------
DO $$
BEGIN
  -- Campos de contacto
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='nombre_contacto') THEN
    ALTER TABLE obvs ADD COLUMN nombre_contacto TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='empresa') THEN
    ALTER TABLE obvs ADD COLUMN empresa TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='email_contacto') THEN
    ALTER TABLE obvs ADD COLUMN email_contacto TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='telefono_contacto') THEN
    ALTER TABLE obvs ADD COLUMN telefono_contacto TEXT;
  END IF;

  -- Estado del pipeline CRM
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='pipeline_status') THEN
    ALTER TABLE obvs ADD COLUMN pipeline_status lead_status DEFAULT 'frio';
  END IF;

  -- Valor potencial estimado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='valor_potencial') THEN
    ALTER TABLE obvs ADD COLUMN valor_potencial DECIMAL(12,2);
  END IF;

  -- Notas del pipeline
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='notas') THEN
    ALTER TABLE obvs ADD COLUMN notas TEXT;
  END IF;

  -- Próxima acción
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='proxima_accion') THEN
    ALTER TABLE obvs ADD COLUMN proxima_accion TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='proxima_accion_fecha') THEN
    ALTER TABLE obvs ADD COLUMN proxima_accion_fecha DATE;
  END IF;

  -- Responsable del seguimiento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='responsable_id') THEN
    ALTER TABLE obvs ADD COLUMN responsable_id UUID REFERENCES members(id);
  END IF;
END $$;

-- PASO 2: Crear tabla para historial del pipeline
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS obv_pipeline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  old_status lead_status,
  new_status lead_status NOT NULL,
  changed_by UUID REFERENCES members(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_obv_pipeline_history_obv_id ON obv_pipeline_history(obv_id);
CREATE INDEX IF NOT EXISTS idx_obv_pipeline_history_created_at ON obv_pipeline_history(created_at DESC);

-- RLS para historial de pipeline
ALTER TABLE obv_pipeline_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "All authenticated can view pipeline history"
  ON obv_pipeline_history FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "All authenticated can create pipeline history"
  ON obv_pipeline_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- PASO 3: Migrar datos de tabla leads a obvs
-- ----------------------------------------------------
-- Solo migrar si la tabla leads existe y tiene datos
DO $$
DECLARE
  leads_count INTEGER;
BEGIN
  -- Verificar si tabla leads existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    -- Contar leads existentes
    SELECT COUNT(*) INTO leads_count FROM leads;

    IF leads_count > 0 THEN
      RAISE NOTICE 'Migrando % leads a tabla obvs...', leads_count;

      -- Migrar leads a obvs
      INSERT INTO obvs (
        owner_id,
        project_id,
        titulo,
        tipo,
        status,
        nombre_contacto,
        empresa,
        email_contacto,
        telefono_contacto,
        pipeline_status,
        valor_potencial,
        notas,
        responsable_id,
        created_at,
        updated_at
      )
      SELECT
        COALESCE(l.responsable_id, l.created_by, (SELECT id FROM members LIMIT 1)) as owner_id,
        l.project_id,
        l.nombre as titulo,
        -- Determinar tipo según estado del lead
        CASE
          WHEN l.status = 'cerrado_ganado' THEN 'venta'::obv_type
          ELSE 'exploracion'::obv_type
        END as tipo,
        -- Determinar status de validación
        CASE
          WHEN l.status = 'cerrado_ganado' THEN 'validated'::kpi_status
          ELSE 'pending'::kpi_status
        END as status,
        l.nombre as nombre_contacto,
        l.empresa,
        l.email as email_contacto,
        l.telefono as telefono_contacto,
        l.status as pipeline_status,
        l.valor_potencial,
        l.notas,
        l.responsable_id,
        l.created_at,
        l.updated_at
      FROM leads l
      WHERE NOT EXISTS (
        -- Evitar duplicados si ya se migró antes
        SELECT 1 FROM obvs o
        WHERE o.nombre_contacto = l.nombre
        AND o.empresa = l.empresa
        AND o.project_id = l.project_id
      );

      RAISE NOTICE 'Migración de leads completada';
    ELSE
      RAISE NOTICE 'No hay leads para migrar';
    END IF;
  ELSE
    RAISE NOTICE 'Tabla leads no existe, saltando migración';
  END IF;
END $$;

-- PASO 4: Migrar historial de leads al historial de pipeline
-- ----------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_history') THEN
    RAISE NOTICE 'Migrando historial de leads...';

    INSERT INTO obv_pipeline_history (obv_id, old_status, new_status, changed_by, notas, created_at)
    SELECT
      o.id as obv_id,
      lh.old_status,
      lh.new_status,
      lh.changed_by,
      lh.notas,
      lh.created_at
    FROM lead_history lh
    JOIN leads l ON l.id = lh.lead_id
    JOIN obvs o ON o.nombre_contacto = l.nombre
      AND o.empresa = l.empresa
      AND o.project_id = l.project_id
    WHERE NOT EXISTS (
      -- Evitar duplicados
      SELECT 1 FROM obv_pipeline_history oph
      WHERE oph.obv_id = o.id
      AND oph.created_at = lh.created_at
    );

    RAISE NOTICE 'Migración de historial completada';
  ELSE
    RAISE NOTICE 'Tabla lead_history no existe, saltando migración';
  END IF;
END $$;

-- PASO 5: Eliminar columna lead_id de obvs (ya no es necesaria)
-- ----------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='obvs' AND column_name='lead_id') THEN
    ALTER TABLE obvs DROP COLUMN lead_id CASCADE;
    RAISE NOTICE 'Columna lead_id eliminada de tabla obvs';
  END IF;
END $$;

-- PASO 6: Eliminar tablas leads (SOLO después de verificar migración)
-- ----------------------------------------------------
-- IMPORTANTE: Comentado por seguridad
-- Descomentar SOLO después de verificar que la migración fue exitosa

-- DROP TABLE IF EXISTS lead_history CASCADE;
-- DROP TABLE IF EXISTS leads CASCADE;

-- Para eliminar, ejecuta manualmente:
-- DROP TABLE IF EXISTS lead_history CASCADE;
-- DROP TABLE IF EXISTS leads CASCADE;

-- PASO 7: Trigger para registrar cambios de estado en pipeline
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION registrar_cambio_pipeline()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si cambió el pipeline_status
  IF OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status THEN
    INSERT INTO obv_pipeline_history (
      obv_id,
      old_status,
      new_status,
      changed_by,
      created_at
    ) VALUES (
      NEW.id,
      OLD.pipeline_status,
      NEW.pipeline_status,
      (SELECT id FROM members WHERE auth_id = auth.uid() LIMIT 1),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_registrar_cambio_pipeline ON obvs;
CREATE TRIGGER trigger_registrar_cambio_pipeline
AFTER UPDATE ON obvs
FOR EACH ROW
WHEN (OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status)
EXECUTE FUNCTION registrar_cambio_pipeline();

-- PASO 8: Función para obtener estadísticas del pipeline
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION get_pipeline_stats(p_project_id UUID DEFAULT NULL)
RETURNS TABLE (
  status lead_status,
  count BIGINT,
  valor_total DECIMAL,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.pipeline_status as status,
    COUNT(o.id) as count,
    SUM(COALESCE(o.valor_potencial, 0)) as valor_total,
    CASE
      WHEN o.pipeline_status = 'cerrado_ganado' THEN 100.0
      ELSE (
        SELECT COUNT(*)::DECIMAL * 100.0 / NULLIF(COUNT(*) OVER(), 0)
        FROM obvs
        WHERE pipeline_status = 'cerrado_ganado'
        AND (p_project_id IS NULL OR project_id = p_project_id)
      )
    END as conversion_rate
  FROM obvs o
  WHERE o.tipo IN ('exploracion', 'validacion')
    AND (p_project_id IS NULL OR o.project_id = p_project_id)
  GROUP BY o.pipeline_status
  ORDER BY
    CASE o.pipeline_status
      WHEN 'frio' THEN 1
      WHEN 'tibio' THEN 2
      WHEN 'hot' THEN 3
      WHEN 'propuesta' THEN 4
      WHEN 'negociacion' THEN 5
      WHEN 'cerrado_ganado' THEN 6
      WHEN 'cerrado_perdido' THEN 7
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecuta estas queries para verificar la migración:

-- 1. Ver OBVs que vienen de leads migrados:
-- SELECT id, titulo, tipo, pipeline_status, nombre_contacto, empresa
-- FROM obvs
-- WHERE nombre_contacto IS NOT NULL
-- LIMIT 10;

-- 2. Contar OBVs por tipo:
-- SELECT tipo, COUNT(*) FROM obvs GROUP BY tipo;

-- 3. Ver historial de pipeline:
-- SELECT * FROM obv_pipeline_history ORDER BY created_at DESC LIMIT 10;

-- 4. Ver estadísticas del pipeline por proyecto:
-- SELECT * FROM get_pipeline_stats('id-del-proyecto');

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Las tablas leads y lead_history NO se eliminan automáticamente
-- 2. Verifica que todos los datos migraron correctamente antes de eliminar
-- 3. Para eliminar manualmente después de verificar:
--    DROP TABLE IF EXISTS lead_history CASCADE;
--    DROP TABLE IF EXISTS leads CASCADE;
-- 4. Haz backup de la BD antes de eliminar las tablas
