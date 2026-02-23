/**
 * 🎙️ TRANSCRIBE MEETING - SUPABASE EDGE FUNCTION
 *
 * Transcribe audio de reuniones usando OpenAI Whisper API
 * Flow: audio_url → download → Whisper API → save transcript → update status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';


serve(async (req) => {
  const origin = req.headers.get('Origin');
  // Handle CORS preflight
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  try {
    // 1. Validar request
    const { meetingId } = await req.json();

    if (!meetingId) {
      return new Response(
        JSON.stringify({ error: 'meetingId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log('🎙️ Starting transcription for meeting:', meetingId);

    // 2. Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const { serviceClient: supabase } = await validateAuth(req);

    // 3. Obtener datos de la reunión
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      console.error('Error fetching meeting:', meetingError);
      return new Response(
        JSON.stringify({ error: 'Meeting not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    if (!meeting.audio_url) {
      return new Response(
        JSON.stringify({ error: 'Meeting has no audio_url' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log('📥 Downloading audio from:', meeting.audio_url);

    // 4. Descargar el audio desde Supabase Storage
    const audioResponse = await fetch(meeting.audio_url);
    if (!audioResponse.ok) {
      console.error('Error downloading audio:', audioResponse.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to download audio' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const audioBlob = await audioResponse.blob();
    console.log('✅ Audio downloaded, size:', audioBlob.size, 'bytes');

    // 5. Obtener API key de OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    // 6. Preparar FormData para Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'es'); // Español (cambiar si es necesario)
    formData.append('response_format', 'verbose_json'); // Incluye timestamps

    console.log('🤖 Calling Whisper API...');

    // 7. Llamar a OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Whisper API failed', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    const transcriptionData = await whisperResponse.json();
    console.log('✅ Transcription received, length:', transcriptionData.text?.length || 0);

    // 8. Guardar transcript en la base de datos
    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        transcript: transcriptionData.text,
        status: 'analyzing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Error updating meeting:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update meeting', details: updateError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    console.log('✅ Meeting updated with transcript');

    // 9. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        meetingId,
        transcriptLength: transcriptionData.text?.length || 0,
        status: 'analyzing',
        message: 'Transcription completed successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});
