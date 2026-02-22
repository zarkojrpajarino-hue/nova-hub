-- Recrear la vista pipeline_global sin la columna color que no existe
DROP VIEW IF EXISTS pipeline_global;

CREATE OR REPLACE VIEW pipeline_global AS
SELECT 
  l.*,
  p.nombre as proyecto_nombre,
  m.nombre as responsable_nombre
FROM leads l
JOIN projects p ON l.project_id = p.id
LEFT JOIN members m ON l.responsable_id = m.id;

-- Verificar que ahora devuelve 0 registros
SELECT COUNT(*) as pipeline_count FROM pipeline_global;
