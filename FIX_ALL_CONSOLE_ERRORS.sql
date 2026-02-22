-- =============================================
-- ARREGLAR TODOS LOS ERRORES DE CONSOLA
-- =============================================

-- 1. Recrear members_public con security_invoker
DROP VIEW IF EXISTS members_public CASCADE;

CREATE VIEW members_public
WITH (security_invoker = true) AS
SELECT
  id,
  auth_id,
  email,
  nombre,
  avatar,
  color,
  especialization,
  created_at,
  updated_at
FROM members;

-- 2. Asegurar que path_to_master_active existe y tiene las columnas correctas
CREATE OR REPLACE VIEW path_to_master_active AS
SELECT
  rep.id,
  rep.member_id,
  rep.role,
  rep.project_id,
  rep.start_date,
  rep.end_date,
  rep.status,
  rep.fit_score,
  rep.current_ranking,
  EXTRACT(EPOCH FROM (rep.end_date - rep.start_date)) / (24 * 60 * 60) AS duration_days,
  COALESCE(rep.tasks_completed, 0) AS tasks_completed,
  COALESCE(rep.tasks_on_time, 0) AS tasks_on_time,
  COALESCE(rep.obvs_completed, 0) AS obvs_validated,
  COALESCE(rep.peer_feedback_count, 0) AS peer_feedback_count
FROM role_exploration_periods rep
WHERE rep.status = 'active';

-- Verificar que las vistas funcionen
SELECT COUNT(*) as members_public_count FROM members_public;
SELECT COUNT(*) as path_to_master_active_count FROM path_to_master_active;
