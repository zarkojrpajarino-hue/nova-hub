-- =============================================================================
-- MIGRACIÓN 00032 — CHECK leader_id ≠ assignee_id en tasks
--
-- Contexto:
--   C3.6 (FASE 3) añadió validación frontend en TaskForm.tsx:
--     if (leaderId && assigneeId && leaderId === assigneeId) → toast.error
--
--   Sin constraint DB, esa validación es consistencia débil: cualquier INSERT
--   directo (edge function, admin, otro form) puede violar la invariante
--   silenciosamente.
--
--   leader_id y assignee_id son roles distintos por definición de dominio:
--     - assignee_id: quien ejecuta la tarea
--     - leader_id: quien responde por el resultado (puede ser nulo)
--   Asignar la misma persona en ambos roles no tiene sentido semántico y
--   contradice el contrato establecido en UI.
--
-- Estado previo a aplicar:
--   SELECT id FROM tasks WHERE leader_id IS NOT NULL
--     AND assignee_id IS NOT NULL
--     AND leader_id = assignee_id;
--   → debe devolver 0 filas. Si devuelve filas, corregirlas antes de aplicar.
--   (verificado 2026-03-11 — tabla en entorno dev sin filas conflictivas)
--
-- Cambios:
--   1. ADD CONSTRAINT chk_leader_not_assignee
--      Cubre los 3 casos válidos:
--        - solo executor (leader_id IS NULL)     → pasa
--        - solo leader   (assignee_id IS NULL)   → pasa
--        - ambos distintos                        → pasa
--      Bloquea:
--        - leader_id = assignee_id (ambos NOT NULL e iguales) → falla
-- =============================================================================

ALTER TABLE tasks
  ADD CONSTRAINT chk_leader_not_assignee
  CHECK (leader_id IS NULL OR assignee_id IS NULL OR leader_id != assignee_id);

COMMENT ON CONSTRAINT chk_leader_not_assignee ON tasks IS
  'Invariante de dominio: el responsable (leader_id) y el ejecutor (assignee_id) no pueden ser la misma persona. Enforced también en frontend (TaskForm.tsx C3.6, 2026-03-11).';
