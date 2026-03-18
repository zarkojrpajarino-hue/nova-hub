-- FASE 18 — M18.14: trazabilidad de tasks creadas desde reuniones
--
-- Añade meeting_id y source a tasks para saber qué reunión generó cada task.
-- `applyTask` en apply-meeting-insights ya intentaba insertar estos campos
-- (meeting_id y source) — esta migración los formaliza con FK + constraint.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON tasks(meeting_id)
  WHERE meeting_id IS NOT NULL;

COMMENT ON COLUMN tasks.meeting_id IS
  'M18.14: UUID de la reunión que generó esta task (NULL si no viene de reunión).';

COMMENT ON COLUMN tasks.source IS
  'M18.14: origen de la task. meeting_intelligence | ai_executor | manual | playbook';
