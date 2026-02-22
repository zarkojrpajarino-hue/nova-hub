-- Verificar el esquema real de role_exploration_periods
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'role_exploration_periods'
ORDER BY ordinal_position;
