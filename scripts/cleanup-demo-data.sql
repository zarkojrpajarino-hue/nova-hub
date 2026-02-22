-- ============================================
-- SCRIPT DE LIMPIEZA DE DATOS DEMO
-- ============================================
-- Este script elimina los 9 miembros de prueba que quedaron
-- guardados en Supabase durante el desarrollo.
--
-- ⚠️ IMPORTANTE: Ejecutar esto en el SQL Editor de Supabase
-- ⚠️ ADVERTENCIA: Esto eliminará PERMANENTEMENTE estos datos
--
-- Miembros a eliminar:
-- - ZARKO
-- - FERNANDO S
-- - ÁNGEL
-- - MIGUEL ÁNGEL
-- - MANUEL
-- - FERNANDO G
-- - CARLA
-- - DIEGO
-- - LUIS
-- ============================================

BEGIN;

-- 1. Primero, encontrar los IDs de estos miembros
CREATE TEMP TABLE demo_members_to_delete AS
SELECT id, nombre, email
FROM profiles
WHERE UPPER(nombre) IN (
  'ZARKO',
  'FERNANDO S',
  'ÁNGEL',
  'MIGUEL ÁNGEL',
  'MANUEL',
  'FERNANDO G',
  'CARLA',
  'DIEGO',
  'LUIS'
);

-- 2. Mostrar qué se va a eliminar (para verificar)
SELECT
  'Se eliminarán ' || COUNT(*) || ' miembros:' AS mensaje
FROM demo_members_to_delete;

SELECT id, nombre, email FROM demo_members_to_delete;

-- 3. Eliminar referencias en otras tablas (CASCADE)
-- Esto eliminará automáticamente:
-- - project_members
-- - obvs creados por estos usuarios
-- - tareas asignadas
-- - leads
-- - validaciones
-- - role_exploration_periods
-- - etc.

DELETE FROM profiles
WHERE id IN (SELECT id FROM demo_members_to_delete);

-- 4. Verificar eliminación
SELECT
  'Miembros eliminados: ' || COUNT(*) AS resultado
FROM profiles
WHERE UPPER(nombre) IN (
  'ZARKO',
  'FERNANDO S',
  'ÁNGEL',
  'MIGUEL ÁNGEL',
  'MANUEL',
  'FERNANDO G',
  'CARLA',
  'DIEGO',
  'LUIS'
);
-- Debería retornar 0

COMMIT;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Ejecutar esto para asegurarte de que no hay residuos:

SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_projects FROM projects;
SELECT COUNT(*) as total_obvs FROM obvs;
SELECT COUNT(*) as total_tasks FROM tasks;
SELECT COUNT(*) as total_leads FROM leads;

-- ============================================
-- ROLLBACK (si algo salió mal)
-- ============================================
-- Si ejecutaste BEGIN pero necesitas cancelar:
-- ROLLBACK;
