/**
 * 🎙️ TRANSCRIBE MEETING - SUPABASE EDGE FUNCTION
 *
 * Transcribe audio de reuniones usando OpenAI Whisper API.
 * M18.11: calcula transcription_confidence desde avg_logprob de segmentos.
 * M18.12: gate de calidad — rechaza < 0.2, avisa 0.2–0.4.
 * M18.13: diarización básica por pausas > 2s → transcript_segments JSONB.
 *
 * Flow: audio_url → download → Whisper verbose_json → confidence + segments → save
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse } from '../_shared/rate-limiter-persistent.ts';
import { logAICall } from '../_shared/aiLogger.ts';

// ── M18.11: Tipos de Whisper verbose_json ─────────────────────────────────────

interface WhisperSegment {
  id:          number
  start:       number   // segundos
  end:         number
  text:        string
  avg_logprob: number   // log-prob media del segmento — proxy de calidad
}

interface WhisperVerboseResponse {
  text:      string
  segments?: WhisperSegment[]
  language?: string
}

// ── M18.13: Tipo de segmento estructurado ─────────────────────────────────────

interface TranscriptSegment {
  speaker_hint: string   // "Participante A", "Participante B", …
  text:         string
  start_time:   number   // segundos
  end_time:     number
}

// ── M18.11: Calcular confidence desde avg_logprob ─────────────────────────────
//
// Whisper devuelve avg_logprob por segmento (típicamente –0.1 a –1.5).
// confidence = exp(media de avg_logprob de todos los segmentos).
//   exp(–0.1) ≈ 0.90 → audio limpio
//   exp(–0.5) ≈ 0.61 → calidad media
//   exp(–1.0) ≈ 0.37 → baja calidad
//   exp(–1.6) ≈ 0.20 → límite de procesabilidad

function computeTranscriptionConfidence(segments: WhisperSegment[]): number {
  if (!segments || segments.length === 0) return 0.6   // fallback conservador
  const valid = segments.filter(s => typeof s.avg_logprob === 'number')
  if (valid.length === 0) return 0.6
  const avg = valid.reduce((sum, s) => sum + s.avg_logprob, 0) / valid.length
  return Math.min(1.0, Math.max(0.0, Math.exp(avg)))
}

// ── M18.13: Diarización básica por pausas > 2s ────────────────────────────────
//
// Estrategia: nuevo bloque de speaker cuando la pausa desde el segmento anterior > 2s.
// Rotación de etiquetas: A → B → C … cíclico hasta participantCount.
// Sin identificación por voz — es una heurística de separación temporal.

function buildTranscriptSegments(
  whisperSegments: WhisperSegment[],
  participantCount: number,
): TranscriptSegment[] {
  const n = Math.max(1, Math.min(participantCount, 8))   // máx 8 etiquetas
  const labels = Array.from({ length: n }, (_, i) =>
    `Participante ${String.fromCharCode(65 + i)}`         // A, B, C, …
  )

  const blocks: TranscriptSegment[] = []
  let current: TranscriptSegment | null = null
  let speakerIdx = 0

  for (const seg of whisperSegments) {
    const text = seg.text.trim()
    if (!text) continue

    const gap = current ? seg.start - current.end_time : 0

    if (!current || gap > 2.0) {
      if (current) {
        blocks.push(current)
        speakerIdx = (speakerIdx + 1) % labels.length
      }
      current = {
        speaker_hint: labels[speakerIdx],
        text,
        start_time: seg.start,
        end_time:   seg.end,
      }
    } else {
      current.text     += ' ' + text
      current.end_time  = seg.end
    }
  }

  if (current) blocks.push(current)
  return blocks
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);

  const corsHeaders = getCorsHeaders(origin)
  const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders }

  try {
    const { meetingId, language, participantCount: bodyParticipantCount } = await req.json();

    if (!meetingId) {
      return new Response(
        JSON.stringify({ error: 'meetingId is required' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    console.log('🎙️ Starting transcription for meeting:', meetingId);

    const { user, serviceClient: supabase } = await validateAuth(req);

    const rateLimitResult = await checkRateLimit(user.id, 'transcribe-meeting', { maxRequests: 3, windowMs: 60000 });
    if (!rateLimitResult.allowed) return createRateLimitResponse(rateLimitResult, corsHeaders);

    // 1. Obtener meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return new Response(
        JSON.stringify({ error: 'Meeting not found' }),
        { status: 404, headers: jsonHeaders },
      );
    }

    if (!meeting.audio_url) {
      return new Response(
        JSON.stringify({ error: 'Meeting has no audio_url' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    console.log('📥 Downloading audio from:', meeting.audio_url);

    // 2. Descargar audio
    const audioResponse = await fetch(meeting.audio_url);
    if (!audioResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to download audio' }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const audioBlob = await audioResponse.blob();
    console.log('✅ Audio downloaded, size:', audioBlob.size, 'bytes');

    // 3. API key OpenAI (Whisper sigue siendo OpenAI — solo analyze-meeting migra a Claude)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: jsonHeaders },
      );
    }

    // 4. Llamar Whisper con verbose_json
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    if (language) formData.append('language', language);
    formData.append('response_format', 'verbose_json');

    console.log('🤖 Calling Whisper API...');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Whisper API failed', details: errorText }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const transcriptionData = await whisperResponse.json() as WhisperVerboseResponse;
    const segments = transcriptionData.segments ?? []

    console.log('✅ Transcription received, length:', transcriptionData.text?.length ?? 0,
      'segments:', segments.length);

    // ── M18.11: Calcular transcription_confidence ──────────────────────────────
    const transcriptionConfidence = computeTranscriptionConfidence(segments)
    console.log(`📊 transcription_confidence: ${transcriptionConfidence.toFixed(3)}`)

    // ── M18.12: Gate de calidad ────────────────────────────────────────────────
    //
    // < 0.2 → audio no procesable → rechazar sin guardar
    if (transcriptionConfidence < 0.2) {
      return new Response(
        JSON.stringify({
          error:       'audio_not_processable',
          confidence:  transcriptionConfidence,
          message:     'Audio no procesable. La calidad es demasiado baja para extraer texto. Sube un archivo de mayor calidad.',
        }),
        { status: 422, headers: jsonHeaders },
      )
    }

    // ── DEUDA.2: participantCount — body → meetings.participant_count → fallback 1 ──
    // Prioridad: (1) body del request, (2) meetings.participant_count (DB), (3) 1
    const participantCount: number = (() => {
      if (typeof bodyParticipantCount === 'number' && bodyParticipantCount > 0) {
        return bodyParticipantCount
      }
      const pc = (meeting as Record<string, unknown>).participant_count
      return typeof pc === 'number' && pc > 0 ? pc : 1
    })()

    const transcriptSegments = buildTranscriptSegments(segments, participantCount)
    console.log(`🎭 transcript_segments: ${transcriptSegments.length} bloques`)

    // 5. Guardar transcript + confidence + segments
    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        transcript:               transcriptionData.text,
        transcription_confidence: transcriptionConfidence,
        transcript_segments:      transcriptSegments,
        // M18.12: si baja calidad (0.2–0.4) → dejar en 'transcribed' en lugar de 'analyzing'
        // así el frontend puede pedir confirmación antes de disparar analyze-meeting
        status: transcriptionConfidence < 0.4 ? 'transcribed' : 'analyzing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Error updating meeting:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update meeting', details: updateError }),
        { status: 500, headers: jsonHeaders },
      );
    }

    console.log('✅ Meeting updated with transcript, confidence:', transcriptionConfidence.toFixed(3));

    // ── M18.12: Si calidad baja (0.2–0.4) → devolver low_quality=true ──────────
    if (transcriptionConfidence < 0.4) {
      return new Response(
        JSON.stringify({
          success:     true,
          meetingId,
          low_quality: true,
          confidence:  transcriptionConfidence,
          message:     `Calidad de audio baja (${Math.round(transcriptionConfidence * 100)}%). La transcripción puede tener errores. ¿Continuar con el análisis o subir de nuevo?`,
          status:      'transcribed',
          transcriptLength: transcriptionData.text?.length ?? 0,
          segments_count:   transcriptSegments.length,
        }),
        { status: 200, headers: jsonHeaders },
      )
    }

    // 6. Respuesta estándar (calidad ≥ 0.4)
    return new Response(
      JSON.stringify({
        success:          true,
        meetingId,
        low_quality:      false,
        confidence:       transcriptionConfidence,
        transcriptLength: transcriptionData.text?.length ?? 0,
        segments_count:   transcriptSegments.length,
        status:           'analyzing',
        message:          'Transcription completed successfully',
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (err as Error).message }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
