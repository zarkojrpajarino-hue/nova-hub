-- ============================================================================
-- VERIFICAR Y PREPARAR TABLAS PARA INTERCONEXIONES
-- ============================================================================
-- Este SQL verifica que existan todas las columnas necesarias para los
-- triggers de interconexiones y las crea si faltan
-- ============================================================================

-- ============================================================================
-- 1. Verificar y agregar columnas a transactions
-- ============================================================================

-- Agregar source_type y source_id si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE transactions ADD COLUMN source_type TEXT;
    RAISE NOTICE 'Added column source_type to transactions';
  ELSE
    RAISE NOTICE 'Column source_type already exists in transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN source_id UUID;
    RAISE NOTICE 'Added column source_id to transactions';
  ELSE
    RAISE NOTICE 'Column source_id already exists in transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE transactions ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added column notes to transactions';
  ELSE
    RAISE NOTICE 'Column notes already exists in transactions';
  END IF;
END $$;

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source_type, source_id)
WHERE source_type IS NOT NULL;

-- ============================================================================
-- 2. Verificar y agregar columnas a tasks
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE tasks ADD COLUMN source_type TEXT;
    RAISE NOTICE 'Added column source_type to tasks';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN source_id UUID;
    RAISE NOTICE 'Added column source_id to tasks';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ;
    RAISE NOTICE 'Added column completed_at to tasks';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source_type, source_id)
WHERE source_type IS NOT NULL;

-- ============================================================================
-- 3. Verificar y agregar columnas a leads
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'last_contact_date'
  ) THEN
    ALTER TABLE leads ADD COLUMN last_contact_date DATE;
    RAISE NOTICE 'Added column last_contact_date to leads';
  END IF;
END $$;

-- ============================================================================
-- 4. Verificar tabla points existe (para gamificación)
-- ============================================================================

CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  organization_id UUID,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  source_type TEXT,
  source_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_points_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_source ON points(source_type, source_id) WHERE source_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_points_created ON points(created_at DESC);

-- RLS
ALTER TABLE points ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own points"
  ON points FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System can insert points"
  ON points FOR INSERT
  TO authenticated
  WITH CHECK (true);

RAISE NOTICE 'Points table verified/created';

-- ============================================================================
-- 5. Verificar tabla business_metrics existe
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'business_metrics'
  ) THEN
    CREATE TABLE business_metrics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID NOT NULL,
      user_id UUID,
      metric_name TEXT NOT NULL,
      metric_value NUMERIC NOT NULL,
      metric_unit TEXT,
      period TEXT, -- YYYY-MM for monthly, YYYY-Qn for quarterly
      recorded_at TIMESTAMPTZ DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),

      UNIQUE(organization_id, metric_name, period)
    );

    CREATE INDEX idx_business_metrics_org ON business_metrics(organization_id);
    CREATE INDEX idx_business_metrics_name ON business_metrics(metric_name);
    CREATE INDEX idx_business_metrics_period ON business_metrics(period);

    ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view org metrics"
      ON business_metrics FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Users can insert metrics"
      ON business_metrics FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Users can update metrics"
      ON business_metrics FOR UPDATE
      TO authenticated
      USING (true);

    RAISE NOTICE 'Created business_metrics table';
  ELSE
    RAISE NOTICE 'business_metrics table already exists';
  END IF;
END $$;

-- ============================================================================
-- 6. Verificar columnas en notifications
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'category'
  ) THEN
    ALTER TABLE notifications ADD COLUMN category TEXT;
    RAISE NOTICE 'Added column category to notifications';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added column metadata to notifications';
  END IF;
END $$;

-- ============================================================================
-- 7. Verificar estructura de key_results (para trigger de OKRs)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'key_results'
  ) THEN
    RAISE NOTICE 'key_results table exists';

    -- Verificar columnas necesarias
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'key_results' AND column_name = 'progress'
    ) THEN
      ALTER TABLE key_results ADD COLUMN progress NUMERIC DEFAULT 0;
      RAISE NOTICE 'Added column progress to key_results';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'key_results' AND column_name = 'status'
    ) THEN
      ALTER TABLE key_results ADD COLUMN status TEXT DEFAULT 'active';
      RAISE NOTICE 'Added column status to key_results';
    END IF;
  ELSE
    RAISE NOTICE 'key_results table does not exist - OKR trigger will not work';
  END IF;
END $$;

-- ============================================================================
-- 8. Función helper para actualizar last_contact_date en leads
-- ============================================================================

CREATE OR REPLACE FUNCTION update_lead_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se crea una actividad o nota en el lead
  IF TG_TABLE_NAME IN ('lead_activities', 'lead_notes') THEN
    UPDATE leads
    SET last_contact_date = CURRENT_DATE
    WHERE id = NEW.lead_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para lead_activities (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_activities') THEN
    DROP TRIGGER IF EXISTS trigger_update_lead_contact ON lead_activities;
    CREATE TRIGGER trigger_update_lead_contact
    AFTER INSERT ON lead_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_contact();

    RAISE NOTICE 'Created trigger for lead_activities';
  END IF;
END $$;

-- Trigger para lead_notes (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_notes') THEN
    DROP TRIGGER IF EXISTS trigger_update_lead_contact_notes ON lead_notes;
    CREATE TRIGGER trigger_update_lead_contact_notes
    AFTER INSERT ON lead_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_contact();

    RAISE NOTICE 'Created trigger for lead_notes';
  END IF;
END $$;

-- ============================================================================
-- 9. Verificar estructura mínima de todas las tablas críticas
-- ============================================================================

DO $$
DECLARE
  v_tables TEXT[] := ARRAY['leads', 'tasks', 'transactions', 'notifications',
                           'objectives', 'projects', 'members', 'organizations'];
  v_table TEXT;
  v_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICACIÓN DE TABLAS CRÍTICAS ===';
  RAISE NOTICE '';

  FOREACH v_table IN ARRAY v_tables
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table
    ) INTO v_exists;

    IF v_exists THEN
      RAISE NOTICE '✅ Tabla % existe', v_table;
    ELSE
      RAISE WARNING '❌ Tabla % NO existe', v_table;
    END IF;
  END LOOP;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 10. Resumen final
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VERIFICACIÓN COMPLETADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Columnas agregadas/verificadas:';
  RAISE NOTICE '  - transactions: source_type, source_id, notes';
  RAISE NOTICE '  - tasks: source_type, source_id, completed_at';
  RAISE NOTICE '  - leads: last_contact_date';
  RAISE NOTICE '  - notifications: category, metadata';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas verificadas/creadas:';
  RAISE NOTICE '  - points (gamificación)';
  RAISE NOTICE '  - business_metrics';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximo paso:';
  RAISE NOTICE '  Ejecutar: IMPLEMENTAR_INTERCONEXIONES_CRITICAS.sql';
  RAISE NOTICE '';
END $$;
