-- =====================================================
-- AGREGAR COLUMNAS FALTANTES PARA TRACKING
-- =====================================================

-- Agregar columnas que faltan en role_exploration_periods
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_exploration_periods' AND column_name='tasks_on_time') THEN
    ALTER TABLE role_exploration_periods ADD COLUMN tasks_on_time INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_exploration_periods' AND column_name='obvs_validated') THEN
    ALTER TABLE role_exploration_periods ADD COLUMN obvs_validated INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_exploration_periods' AND column_name='initiative_obvs') THEN
    ALTER TABLE role_exploration_periods ADD COLUMN initiative_obvs INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='role_exploration_periods' AND column_name='duration_days') THEN
    ALTER TABLE role_exploration_periods ADD COLUMN duration_days INTEGER DEFAULT 21;
  END IF;
END $$;

-- ✅ COLUMNAS AGREGADAS
