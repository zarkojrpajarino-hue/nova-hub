-- =============================================================================
-- MIGRACIÓN 00021 — Fix E4.23: corregir día del cron de Viability Engine
--
-- Problema:
--   weekly-viability-engine estaba configurado en lunes 02:00 UTC ('0 2 * * 1').
--   Esto rompía el pipeline semanal porque Viability evaluaba datos de Phase y
--   Probability con una semana de antigüedad en vez del mismo ciclo.
--
-- Fix:
--   Mover Viability a domingo 01:30 UTC ('30 1 * * 0').
--   Phase, Probability y Risk no se tocan.
--
-- Orden resultante (domingo UTC):
--   00:00 — Phase Engine        (weekly-phase-engine)
--   00:30 — Probability Engine  (weekly-probability-engine)
--   01:00 — Risk Engine         (weekly-risk-engine)
--   01:30 — Viability Engine    (weekly-viability-engine)  ← este fix
--
-- Dependencias verificadas:
--   Viability lee project_phase_state y project_probability (escritas por los
--   engines anteriores en el mismo ciclo), y compute_capacity_health /
--   compute_iteration_velocity (funciones en vivo, sin cron propio).
--   No depende de Org Engine ni Economic Profile Engine como outputs precomputados.
--
-- Nota de spec:
--   F1.10 decía "cron semanal cada lunes" para Viability.
--   TASK_LIST E4.23 (referencia vigente) dice "domingo 23:00" para toda la cadena.
--   Se toma E4.23 como fuente autoritativa.
-- =============================================================================

-- 1. Eliminar el job del lunes
SELECT cron.unschedule('weekly-viability-engine');

-- 2. Registrar en domingo 01:30 UTC, después de Risk Engine (domingo 01:00)
SELECT cron.schedule(
  'weekly-viability-engine',
  '30 1 * * 0',
  $$
    SELECT run_viability_engine(id)
    FROM   projects
    WHERE  deleted_at IS NULL
  $$
);
