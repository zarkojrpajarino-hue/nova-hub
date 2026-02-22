-- =============================================
-- MIGRACIÓN 001 — Sincronizar tabla `obvs`
-- Añade columnas CRM + ventas + facturación + cobros
-- SEGURA: solo ADD COLUMN IF NOT EXISTS (no destructiva)
-- =============================================

-- ---------------------------------------------
-- PASO 1: Crear ENUMs faltantes
-- ---------------------------------------------

DO $$ BEGIN
  CREATE TYPE obv_type AS ENUM ('exploracion', 'validacion', 'venta');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM (
    'frio', 'tibio', 'hot',
    'propuesta', 'negociacion',
    'cerrado_ganado', 'cerrado_perdido'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------
-- PASO 2: Columnas base
-- ---------------------------------------------

ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS fecha DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS tipo obv_type;  -- NULL para filas existentes

-- ---------------------------------------------
-- PASO 3: CRM — Contacto + Pipeline
-- ---------------------------------------------

ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS nombre_contacto TEXT,
  ADD COLUMN IF NOT EXISTS empresa TEXT,
  ADD COLUMN IF NOT EXISTS email_contacto TEXT,
  ADD COLUMN IF NOT EXISTS telefono_contacto TEXT,
  ADD COLUMN IF NOT EXISTS pipeline_status lead_status DEFAULT 'frio',
  ADD COLUMN IF NOT EXISTS valor_potencial DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS notas TEXT,
  ADD COLUMN IF NOT EXISTS proxima_accion TEXT,
  ADD COLUMN IF NOT EXISTS proxima_accion_fecha DATE,
  ADD COLUMN IF NOT EXISTS responsable_id UUID REFERENCES members(id) ON DELETE SET NULL;

-- ---------------------------------------------
-- PASO 4: Ventas
-- ---------------------------------------------

ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS es_venta BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS producto TEXT,
  ADD COLUMN IF NOT EXISTS cantidad INT,
  ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS facturacion DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS costes DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS costes_detalle JSONB,
  ADD COLUMN IF NOT EXISTS margen DECIMAL(12,2);

-- ---------------------------------------------
-- PASO 5: Facturación
-- ---------------------------------------------

ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS iva_porcentaje NUMERIC DEFAULT 21,
  ADD COLUMN IF NOT EXISTS iva_importe NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_factura NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forma_pago TEXT DEFAULT 'transferencia',
  ADD COLUMN IF NOT EXISTS numero_factura TEXT,
  ADD COLUMN IF NOT EXISTS numero_presupuesto TEXT;

-- ---------------------------------------------
-- PASO 6: Cobros
-- ---------------------------------------------

ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS cobro_estado TEXT DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS cobro_fecha_esperada DATE,
  ADD COLUMN IF NOT EXISTS cobro_fecha_real DATE,
  ADD COLUMN IF NOT EXISTS cobro_metodo TEXT,
  ADD COLUMN IF NOT EXISTS cobrado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cobrado_parcial DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS estado_cobro TEXT DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS importe_cobrado NUMERIC DEFAULT 0;

-- cobro_dias_retraso: columna generada (calculada automáticamente)
ALTER TABLE obvs
  ADD COLUMN IF NOT EXISTS cobro_dias_retraso INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN cobro_estado IN ('pendiente', 'cobrado_parcial')
       AND cobro_fecha_esperada IS NOT NULL
      THEN GREATEST(0, EXTRACT(DAY FROM (CURRENT_DATE - cobro_fecha_esperada))::INTEGER)
      ELSE 0
    END
  ) STORED;

-- ---------------------------------------------
-- PASO 7: Tablas relacionadas (si no existen)
-- ---------------------------------------------

CREATE TABLE IF NOT EXISTS obv_participantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  porcentaje DECIMAL(5,2),
  UNIQUE(obv_id, member_id)
);

CREATE TABLE IF NOT EXISTS obv_pipeline_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obv_id UUID REFERENCES obvs(id) ON DELETE CASCADE NOT NULL,
  old_status lead_status,
  new_status lead_status NOT NULL,
  changed_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------
-- VERIFICACIÓN FINAL
-- ---------------------------------------------
-- Ejecuta esto para confirmar columnas añadidas:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'obvs'
-- ORDER BY ordinal_position;
