-- ============================================================
-- 20260312000054_fase11_urgent_reset_requested.sql
--
-- V11.0 / Surface 3 navegación: urgent_reset_requested
--
-- Qué hace:
--   ADD COLUMN urgent_reset_requested BOOLEAN NOT NULL DEFAULT FALSE
--   a strategic_cycles.
--
-- Para qué sirve:
--   Permite al Rescue Playbook UI activar un ritual estratégico
--   urgente antes de la semana 4 normal del ciclo.
--
--   ritual_pending = cycle_due OR urgent_reset_requested
--
--   cycle_due = CURRENT_DATE >= end_date - 6 (semana 4 normal)
--   urgent_reset_requested = este flag = TRUE
--
-- Cómo se usa:
--   1. Rescue Playbook detecta crisis (viability=critical o similar).
--   2. La UI hace UPDATE strategic_cycles SET urgent_reset_requested = TRUE
--      WHERE project_id = ? AND closed_at IS NULL AND ritual_responses IS NULL.
--   3. El frontend detecta ritual_pending = TRUE aunque sea semana 1 o 2.
--   4. Surface 3 se activa.
--   5. Founder completa el ritual → submit_strategic_reset() → close_strategic_cycle().
--   6. El ciclo cierra (closed_at NOT NULL) → ritual_pending ya es FALSE
--      independientemente de urgent_reset_requested (condición usa closed_at IS NULL).
--
-- Nota importante: close_reason NO sirve para este propósito.
--   close_reason se escribe DENTRO de close_strategic_cycle() — es el resultado
--   del cierre, no el trigger previo. El flag debe existir ANTES del ritual.
--
-- Sin efectos sobre otras tablas ni funciones existentes.
-- ============================================================

ALTER TABLE strategic_cycles
  ADD COLUMN urgent_reset_requested BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN strategic_cycles.urgent_reset_requested IS
  'Flag de reset urgente antes de semana 4. '
  'Set a TRUE por el Rescue Playbook UI cuando el proyecto necesita un '
  'reset estratégico inmediato (viability=critical o crisis operativa). '
  'ritual_pending = (cycle_due OR urgent_reset_requested) AND closed_at IS NULL AND ritual_responses IS NULL. '
  'No necesita resetearse a FALSE tras el cierre: la condición usa closed_at IS NULL '
  'como guard, por lo que un ciclo cerrado no puede disparar ritual_pending aunque '
  'este flag sea TRUE. '
  'DEFAULT FALSE — no afecta ciclos existentes.';
