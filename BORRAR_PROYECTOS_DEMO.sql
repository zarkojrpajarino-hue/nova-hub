-- =====================================================
-- BORRAR PROYECTOS DE DEMO/SEED
-- =====================================================
-- Limpia la base de datos para empezar desde cero
-- =====================================================

-- PASO 1: Ver qué proyectos existen (antes de borrar)
SELECT
  id,
  nombre,
  tipo,
  fase,
  created_at,
  (SELECT COUNT(*) FROM project_members WHERE project_id = projects.id) as members_count
FROM projects
ORDER BY created_at DESC;

-- PASO 2: BORRAR PROYECTOS DE SEED/DEMO
-- Estos son los proyectos que vienen en seed-projects
DELETE FROM projects
WHERE nombre IN (
  'Sushi Payo',
  'Experea',
  'Apadrina tu Olivo',
  'Experiencia Selecta',
  'Web y SaaS',
  'Souvenirs Online',
  'Academia Financiera'
);

-- PASO 3: Si quieres borrar TODO (opcional, cuidado!)
-- Descomenta la línea de abajo solo si estás seguro
-- DELETE FROM projects;

-- PASO 4: Verificar que quedó limpio
SELECT
  'projects' as tabla,
  COUNT(*) as total
FROM projects

UNION ALL

SELECT
  'role_exploration_periods' as tabla,
  COUNT(*) as total
FROM role_exploration_periods

UNION ALL

SELECT
  'peer_feedback' as tabla,
  COUNT(*) as total
FROM peer_feedback

UNION ALL

SELECT
  'tasks' as tabla,
  COUNT(*) as total
FROM tasks

UNION ALL

SELECT
  'obvs' as tabla,
  COUNT(*) as total
FROM obvs;

-- ✅ RESULTADO ESPERADO: Todo en 0 (o pocos registros si tenías datos reales)
