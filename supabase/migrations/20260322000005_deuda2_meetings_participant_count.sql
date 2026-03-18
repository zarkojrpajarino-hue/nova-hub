-- DEUDA.2 — Añadir participant_count a meetings
--
-- buildTranscriptSegments() en transcribe-meeting usa participantCount para
-- etiquetar speakers (Participante A, B, C...). Si no viene en el body del request,
-- cae a 1 y todo el transcript se etiqueta como "Participante A".
--
-- Fix parte 1 (DB): añadir la columna para que transcribe-meeting pueda leerla.
-- Fix parte 2 (edge function): leer de meetings.participant_count si no viene en body.
-- Fix parte 3: StartMeetingModal ya recibe participants[] — al crear la reunión,
--   poblar participant_count = participants.length (fix en la mutación de createMeeting).

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS participant_count SMALLINT
  CHECK (participant_count IS NULL OR participant_count >= 1);

COMMENT ON COLUMN meetings.participant_count IS
  'DEUDA.2: número de participantes de la reunión. '
  'Usado por transcribe-meeting para diarización básica (Participante A/B/C). '
  'Poblado por createMeeting() con participants.length.';
