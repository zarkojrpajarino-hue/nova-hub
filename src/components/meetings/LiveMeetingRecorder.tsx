/**
 * 🎙️ LIVE MEETING RECORDER
 *
 * Componente para grabar reuniones en vivo o subir archivos de audio/video
 * Funcionalidades:
 * - Grabación en vivo con MediaRecorder API
 * - Upload manual de archivos
 * - Visualización de forma de onda
 * - Controles: pause, resume, stop
 * - Upload a Supabase Storage
 * - Estados de la reunión: configuring → recording → processing_audio → transcribing
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateMeetingStatus, useTranscribeMeeting, useAnalyzeMeeting, useMeeting } from '@/hooks/useMeetings';
import { AIQuestionsPanel } from './AIQuestionsPanel';
import { AIFacilitator } from './AIFacilitator';
import {
  Mic,
  Square,
  Pause,
  Play,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  FileAudio,
} from 'lucide-react';
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';
interface LiveMeetingRecorderProps {
  meetingId: string;
  projectId: string;
  meetingTitle: string;
  estimatedDurationMin: number;
  onRecordingComplete: (audioUrl: string) => void;
  onCancel: () => void;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading' | 'transcribing' | 'low_quality_confirm' | 'analyzing';

export function LiveMeetingRecorder({
  meetingId,
  projectId,
  meetingTitle,
  estimatedDurationMin,
  onRecordingComplete,
  onCancel,
}: LiveMeetingRecorderProps) {
  const { t } = useTranslation();
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mode, setMode] = useState<'live' | 'upload'>('live');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // DEUDA.1: estado de baja calidad para confirmación
  const [lowQualityConfidence, setLowQualityConfidence] = useState<number | null>(null);
  const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const updateMeetingStatus = useUpdateMeetingStatus();
  const transcribeMeeting = useTranscribeMeeting();
  const analyzeMeeting = useAnalyzeMeeting();
  const { data: meeting } = useMeeting(meetingId);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  /**
   * Inicia la grabación en vivo
   */
  const startRecording = async () => {
    try {
      // Solicitar permisos de micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Event listeners
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await handleRecordingStopped();
      };

      // Iniciar grabación
      mediaRecorder.start(1000); // Capturar chunks cada segundo
      setRecordingState('recording');
      setRecordingTime(0);

      // Actualizar estado de la reunión en BD
      await updateMeetingStatus.mutateAsync({
        meetingId,
        status: 'recording',
        additionalData: {
          started_at: new Date().toISOString(),
        },
      });

      toast.success(t('meetings.grabaciónIniciada'));
    } catch (error) {
      if (error instanceof Error && error.name === t('meetings.notallowederror')) {
        toast.error(t('meetings.permisoDeMicrófonoDenegado'));
      } else if (error instanceof Error && error.name === t('meetings.notfounderror')) {
        toast.error(t('meetings.noSeEncontróNingún'));
      } else {
        toast.error('Error al iniciar la grabación: ' + (error instanceof Error ? error.message : t('meetings.errorDesconocido')));
      }
    }
  };

  /**
   * Pausa la grabación
   */
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      toast.info(t('meetings.grabaciónPausada'));
    }
  };

  /**
   * Reanuda la grabación
   */
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      toast.info(t('meetings.grabaciónReanudada'));
    }
  };

  /**
   * Detiene la grabación
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');

      // Detener el stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      toast.success(t('meetings.grabaciónFinalizada'));
    }
  };

  /**
   * Maneja el evento de grabación detenida
   */
  const handleRecordingStopped = async () => {
    try {
      // Crear blob de audio
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Upload a Supabase Storage
      await uploadAudioToStorage(audioBlob, 'recording.webm');
    } catch (_error) {
      toast.error(t('meetings.errorAlProcesarLa'));
    }
  };

  /**
   * Maneja la selección de archivo
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (!validTypes.includes(file.type)) {
      toast.error(t('meetings.tipoDeArchivoNo'));
      return;
    }

    // Validar tamaño (máx 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Tamaño máximo: 100MB');
      return;
    }

    setSelectedFile(file);
    toast.success(`Archivo seleccionado: ${file.name}`);
  };

  /**
   * Sube el archivo seleccionado
   */
  const uploadSelectedFile = async () => {
    if (!selectedFile) return;

    setRecordingState('uploading');

    try {
      await uploadAudioToStorage(selectedFile, selectedFile.name);
    } catch (_error) {
      toast.error(t('meetings.errorAlSubirEl'));
      setRecordingState('idle');
    }
  };

  /**
   * Sube audio a Supabase Storage
   */
  const uploadAudioToStorage = async (audioBlob: Blob, fileName: string) => {
    setRecordingState('uploading');
    setUploadProgress(0);

    try {
      // Actualizar estado de la reunión
      await updateMeetingStatus.mutateAsync({
        meetingId,
        status: 'processing_audio',
        additionalData: {
          ended_at: new Date().toISOString(),
          duration_actual_min: Math.round(recordingTime / 60),
        },
      });

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const extension = fileName.split('.').pop();
      const storagePath = `${projectId}/meetings/${meetingId}/${timestamp}.${extension}`;

      // Simular progreso (Supabase no da progreso real en uploads pequeños)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload a Supabase Storage
      const { data: _data, error } = await supabase.storage
        .from('meeting-recordings')
        .upload(storagePath, audioBlob, {
          contentType: audioBlob.type,
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('meeting-recordings')
        .getPublicUrl(storagePath);

      const audioUrl = urlData.publicUrl;

      // Actualizar reunión con URL del audio
      await updateMeetingStatus.mutateAsync({
        meetingId,
        status: 'transcribing',
        additionalData: {
          audio_url: audioUrl,
        },
      });

      toast.success(t('meetings.audioSubidoCorrectamente'));

      // Iniciar transcripción automáticamente
      setRecordingState('transcribing');
      toast.info(t('meetings.iniciandoTranscripciónConWhisper'));

      try {
        const transcribeResult = await transcribeMeeting.mutateAsync(meetingId);

        // DEUDA.1: si la transcripción es de baja calidad, pedir confirmación antes de analizar
        if (transcribeResult?.low_quality) {
          setLowQualityConfidence(transcribeResult.confidence ?? null);
          setPendingAudioUrl(audioUrl);
          setRecordingState('low_quality_confirm');
          return;  // no continuar — el usuario decide desde la UI de confirmación
        }

        // Calidad ≥ 0.4 → analizar automáticamente
        setRecordingState('analyzing');
        toast.info(t('meetings.analizandoReuniónConClaude'));
        await analyzeMeeting.mutateAsync({ meetingId });
      } catch (_transcriptionError) {
        // El toast de error lo muestran los hooks
      }

      // Notificar al componente padre
      onRecordingComplete(audioUrl);
    } catch (error) {
      toast.error('Error al subir el audio: ' + (error instanceof Error ? error.message : t('meetings.errorDesconocido')));
      setRecordingState('stopped');
    }
  };

  /**
   * DEUDA.1: el usuario confirma analizar con baja calidad
   */
  const handleContinueWithLowQuality = async () => {
    setRecordingState('analyzing');
    toast.info(t('meetings.analizandoReuniónConClaude'));
    try {
      await analyzeMeeting.mutateAsync({ meetingId, lowQuality: true });
    } catch {
      // toast de error lo muestra el hook
    }
    onRecordingComplete(pendingAudioUrl ?? '');
    setPendingAudioUrl(null);
    setLowQualityConfidence(null);
  };

  /**
   * DEUDA.1: el usuario decide subir de nuevo → reset a idle
   */
  const handleRetryAudio = () => {
    setRecordingState('idle');
    setLowQualityConfidence(null);
    setPendingAudioUrl(null);
    setSelectedFile(null);
    toast.info(t('meetings.subeUnNuevoArchivo'));
  };

  /**
   * Formatea el tiempo en formato MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Calcula el progreso de tiempo vs duración estimada
   */
  const getTimeProgress = (): number => {
    const estimatedSeconds = estimatedDurationMin * 60;
    return Math.min((recordingTime / estimatedSeconds) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{meetingTitle}</h2>
        <p className="text-gray-600 mt-1">
          Duración estimada: {estimatedDurationMin} minutos
        </p>
      </div>

      {/* Mode Selector */}
      {recordingState === 'idle' && (
        <div className="flex gap-4">
          <Button
            variant={mode === 'live' ? 'default' : 'outline'}
            onClick={() => setMode('live')}
            className="flex-1"
          >
            <Mic className="h-4 w-4 mr-2" />{t('meetings.grabarEnVivo')}</Button>
          <Button
            variant={mode === 'upload' ? 'default' : 'outline'}
            onClick={() => setMode('upload')}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />{t('meetings.subirArchivo')}</Button>
        </div>
      )}

      {/* Live Recording Mode */}
      {mode === 'live' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />{t('meetings.grabaciónEnVivo')}</CardTitle>
            <CardDescription>{t('meetings.grabaLaReuniónUsando')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timer and Progress */}
            {recordingState !== 'idle' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="text-3xl font-bold font-mono">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Estimado: {formatTime(estimatedDurationMin * 60)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Progress value={getTimeProgress()} className="h-2" />
                  <p className="text-xs text-gray-500 text-center">
                    {Math.round(getTimeProgress())}% del tiempo estimado
                  </p>
                </div>

                {/* Recording Indicator */}
                {recordingState === 'recording' && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-700 font-semibold">{t('meetings.grabando')}</span>
                  </div>
                )}

                {recordingState === 'paused' && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Pause className="h-4 w-4 text-yellow-700" />
                    <span className="text-yellow-700 font-semibold">{t('meetings.pausado')}</span>
                  </div>
                )}

                {recordingState === 'stopped' && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900">{t('meetings.grabaciónFinalizadaProcesandoAudio')}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {recordingState === 'idle' && (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="flex-1 gap-2"
                >
                  <Mic className="h-5 w-5" />{t('meetings.iniciarGrabación')}</Button>
              )}

              {recordingState === 'recording' && (
                <>
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    size="lg"
                    className="flex-1 gap-2"
                  >
                    <Pause className="h-5 w-5" />{t('meetings.pausar')}</Button>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                    className="flex-1 gap-2"
                  >
                    <Square className="h-5 w-5" />{t('meetings.finalizar')}</Button>
                </>
              )}

              {recordingState === 'paused' && (
                <>
                  <Button
                    onClick={resumeRecording}
                    size="lg"
                    className="flex-1 gap-2"
                  >
                    <Play className="h-5 w-5" />{t('meetings.reanudar')}</Button>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                    className="flex-1 gap-2"
                  >
                    <Square className="h-5 w-5" />{t('meetings.finalizar')}</Button>
                </>
              )}
            </div>

            {/* Permission Alert */}
            {recordingState === 'idle' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('meetings.seSolicitaráPermisoPara')}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Facilitator - Recomendaciones proactivas durante la grabación */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <AIFacilitator
          meetingType={meeting?.meeting_type || 'general'}
          objectives={meeting?.objectives}
          estimatedDurationMin={estimatedDurationMin}
          recordingTime={recordingTime}
          isMinimized={recordingState === 'paused'}
        />
      )}

      {/* AI Questions Panel - Durante la grabación */}
      {(recordingState === 'recording' || recordingState === 'paused') && meeting && (
        <AIQuestionsPanel
          meetingId={meetingId}
          meetingType={meeting.meeting_type || 'general'}
          objectives={meeting.objectives}
          strategicContext={meeting.strategic_context}
          recordingTime={recordingTime}
          isMinimized={recordingState === 'paused'}
        />
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />{t('meetings.subirArchivoDeAudiovideo')}</CardTitle>
            <CardDescription>{t('meetings.subeUnaGrabaciónExistente')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Input */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-semibold mb-1">{t('meetings.clickParaSeleccionarArchivo')}</p>
              <p className="text-xs text-gray-500">
                MP3, WAV, WEBM, OGG, MP4, MOV (máx. 100MB)
              </p>
            </div>

            {/* Selected File */}
            {selectedFile && (
              <Alert className="bg-blue-50 border-blue-200">
                <FileAudio className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Archivo seleccionado:</strong> {selectedFile.name}
                  <br />
                  <span className="text-sm">
                    Tamaño: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <Button
              onClick={uploadSelectedFile}
              disabled={!selectedFile || recordingState === 'uploading'}
              size="lg"
              className="w-full gap-2"
            >
              {recordingState === 'uploading' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />{t('meetings.subiendo')}</>
              ) : (
                <>
                  <Upload className="h-5 w-5" />{t('meetings.subirYProcesar')}</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {recordingState === 'uploading' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t('meetings.subiendoAudio')}</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">{t('meetings.estoPuedeTardarUnos')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcription Progress */}
      {recordingState === 'transcribing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-semibold">{t('meetings.transcribiendoConWhisperAi')}</span>
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-xs">
                  <strong>Whisper AI</strong> está procesando el audio para generar la transcripción.
                  Esto puede tardar 1-3 minutos dependiendo de la duración de la reunión.
                </AlertDescription>
              </Alert>
              <p className="text-xs text-gray-500 text-center">{t('meetings.porFavorEsperaMientras')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DEUDA.1 — Low Quality Confirmation */}
      {recordingState === 'low_quality_confirm' && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Audio de calidad baja ({lowQualityConfidence !== null ? Math.round(lowQualityConfidence * 100) : '—'}%)
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  La transcripción puede tener errores. El análisis será más conservador,
                  pero algunos insights pueden ser imprecisos.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleContinueWithLowQuality}
                variant="outline"
                className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
              >{t('meetings.continuarDeTodasFormas')}</Button>
              <Button
                onClick={handleRetryAudio}
                className="flex-1"
              >{t('meetings.subirDeNuevo')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Progress */}
      {recordingState === 'analyzing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-semibold">{t('meetings.analizandoConClaude')}</span>
              </div>
              <Alert className="bg-purple-50 border-purple-200">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-900 text-xs">
                  <strong>{t('meetings.claude')}</strong> está analizando la transcripción para extraer insights:
                  tareas, decisiones, leads, OBVs mencionados, blockers y métricas.
                </AlertDescription>
              </Alert>
              <p className="text-xs text-gray-500 text-center">{t('meetings.porFavorEsperaMientras1')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Button */}
      {recordingState === 'idle' && (
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full"
        >{t('meetings.cancelar')}</Button>
      )}
    </div>
  );
}
