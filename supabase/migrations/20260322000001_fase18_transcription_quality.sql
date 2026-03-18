-- FASE 18 — M18.11 + M18.13: calidad de transcripción y segmentos estructurados
--
-- transcription_confidence: EXP(avg(avg_logprob)) de los segmentos Whisper verbose_json.
--   < 0.2 → audio no procesable (rechazado en transcribe-meeting)
--   0.2–0.4 → baja calidad (aviso al usuario, análisis opcional)
--   ≥ 0.4 → calidad aceptable para análisis automático
--
-- transcript_segments: array de bloques de speaker diarization básica.
--   Schema: [{ speaker_hint, text, start_time, end_time }]

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS transcription_confidence NUMERIC
    CHECK (transcription_confidence IS NULL OR (transcription_confidence >= 0 AND transcription_confidence <= 1));

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS transcript_segments JSONB;

COMMENT ON COLUMN meetings.transcription_confidence IS
  'M18.11: EXP(avg(avg_logprob)) de segmentos Whisper. NULL si no calculado. 0=ilegible, 1=perfecto.';

COMMENT ON COLUMN meetings.transcript_segments IS
  'M18.13: Diarización básica por pausas. Array de {speaker_hint, text, start_time, end_time}.';
