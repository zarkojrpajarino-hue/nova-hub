-- FASE 18 — M18.21: meetings.alignment_data
--
-- Columna JSONB para guardar el output de evaluate-meeting-alignment.
-- Schema del objeto:
--   alignment_score:      number   (0–1)
--   aligned_insights:     string[]
--   distraction_insights: string[]
--   summary:              string
--   evaluated_at:         ISO timestamp

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS alignment_data JSONB;

COMMENT ON COLUMN meetings.alignment_data IS
  'M18.21: output de evaluate-meeting-alignment. '
  'alignment_score=0–1, aligned_insights[], distraction_insights[], summary. '
  'NULL hasta que la edge function se ejecute (fire-and-forget post-apply).';
