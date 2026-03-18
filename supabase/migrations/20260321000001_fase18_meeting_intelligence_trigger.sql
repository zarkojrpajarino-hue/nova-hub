-- FASE 18 — M18.4: añadir 'meeting_intelligence' al CHECK constraint de trigger_source
--
-- run_phase_engine() escribe en project_phase_history con trigger_source=p_trigger_source.
-- La tabla project_phase_history tiene CHECK (trigger_source IN ('weekly_job','acceleration','regression')).
-- La tabla project_probability_history ya tiene 'integration' (20260315000006).
-- Aquí añadimos 'meeting_intelligence' para que apply-meeting-insights pueda
-- llamar run_phase_engine con trigger_source='meeting_intelligence'.

-- project_phase_history
ALTER TABLE project_phase_history
  DROP CONSTRAINT IF EXISTS project_phase_history_trigger_source_check;

ALTER TABLE project_phase_history
  ADD CONSTRAINT project_phase_history_trigger_source_check
  CHECK (trigger_source IN ('weekly_job', 'acceleration', 'regression', 'meeting_intelligence'));

-- project_probability_history (ya tenía 'integration' — añadir 'meeting_intelligence')
ALTER TABLE project_probability_history
  DROP CONSTRAINT IF EXISTS project_probability_history_trigger_source_check;

ALTER TABLE project_probability_history
  ADD CONSTRAINT project_probability_history_trigger_source_check
  CHECK (trigger_source IN ('weekly_job', 'acceleration', 'regression', 'integration', 'meeting_intelligence'));
