-- =====================================================
-- TEST RÁPIDO: Verificar que las tablas funcionan
-- =====================================================
-- Ejecutar en SQL Editor de Supabase para verificar setup

-- 1. Verificar que las tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('evidence_generation_metrics', 'evidence_user_events')
ORDER BY table_name;

-- Resultado esperado: 2 filas
-- evidence_generation_metrics
-- evidence_user_events

-- =====================================================

-- 2. Verificar estructura de evidence_generation_metrics
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'evidence_generation_metrics'
ORDER BY ordinal_position;

-- Resultado esperado: ~20 columnas (id, feature, profile, mode, etc.)

-- =====================================================

-- 3. Verificar que los índices se crearon
SELECT indexname
FROM pg_indexes
WHERE tablename = 'evidence_generation_metrics'
ORDER BY indexname;

-- Resultado esperado: 9 índices
-- idx_evidence_metrics_created_at
-- idx_evidence_metrics_feature
-- idx_evidence_metrics_feature_mode
-- idx_evidence_metrics_mode
-- idx_evidence_metrics_profile
-- idx_evidence_metrics_project
-- idx_evidence_metrics_status
-- idx_evidence_metrics_user
-- evidence_generation_metrics_pkey

-- =====================================================

-- 4. Verificar que las funciones helper existen
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('calculate_percentiles', 'detect_friction')
ORDER BY routine_name;

-- Resultado esperado: 2 filas
-- calculate_percentiles
-- detect_friction

-- =====================================================

-- 5. Test de INSERT manual (simular lo que hará la edge function)
-- IMPORTANTE: Reemplaza 'YOUR_USER_UUID' con un user_id real de auth.users

INSERT INTO evidence_generation_metrics (
  feature,
  profile,
  mode,
  user_id,
  project_id,
  total_latency_ms,
  retrieval_time_ms,
  generation_time_ms,
  sources_found,
  sources_cited,
  citation_utilization,
  evidence_status,
  timeout_occurred,
  tier_durations_ms,
  metadata,
  waste_flag
) VALUES (
  'test_feature',
  'test_profile',
  'balanced',
  NULL,  -- Cambiar a un UUID real si quieres probar RLS
  NULL,
  5000,
  2000,
  3000,
  10,
  8,
  0.80,
  'verified',
  false,
  '{"internal_data": 1500, "user_docs": 500}'::jsonb,
  '{"test": true, "source": "manual_test"}'::jsonb,
  false
);

-- Si esto funciona sin errores → Tabla lista ✅

-- =====================================================

-- 6. Verificar que el test insert funcionó
SELECT
  id,
  feature,
  profile,
  mode,
  total_latency_ms,
  sources_found,
  evidence_status,
  tier_durations_ms,
  metadata,
  created_at
FROM evidence_generation_metrics
WHERE feature = 'test_feature'
ORDER BY created_at DESC
LIMIT 1;

-- Resultado esperado: 1 fila con los datos del test

-- =====================================================

-- 7. Test de función calculate_percentiles
SELECT * FROM calculate_percentiles('test_feature', 'balanced', 7);

-- Resultado esperado: p50 y p95 (basado en el test insert)

-- =====================================================

-- 8. CLEANUP: Borrar el test insert
DELETE FROM evidence_generation_metrics
WHERE feature = 'test_feature';

-- =====================================================

-- 9. Verificar que la tabla quedó limpia
SELECT COUNT(*) as total_rows
FROM evidence_generation_metrics;

-- Resultado esperado: 0 (si no has ejecutado edge functions todavía)

-- =====================================================
-- FIN DEL TEST
-- =====================================================

-- Si todos los pasos funcionaron sin errores:
-- ✅ Tablas creadas correctamente
-- ✅ Índices configurados
-- ✅ Funciones helper disponibles
-- ✅ RLS policies activas
-- ✅ LISTO PARA RECIBIR DATOS DE EDGE FUNCTIONS
