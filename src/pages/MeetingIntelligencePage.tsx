/**
 * 🎙️ MEETING INTELLIGENCE PAGE
 *
 * Página principal del sistema Meeting Intelligence
 * Muestra historial de reuniones con búsqueda, filtros y acciones
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users } from 'lucide-react';
import {
  StartMeetingModal,
  LiveMeetingRecorder,
  MeetingQuestionsReview,
  MeetingHistory,
} from '@/components/meetings';
import { useCreateMeeting, Meeting } from '@/hooks/useMeetings';
import { useProjectTeamMembers } from '@/hooks/useNovaDataOptimized';
import { useMeetingMode } from '@/hooks/useMeetingMode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function MeetingIntelligencePage() {
  // State
  const [showModal, setShowModal] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [questionsReviewMeeting, setQuestionsReviewMeeting] = useState<string | null>(null);
  const [questionsReviewMeetingTitle, setQuestionsReviewMeetingTitle] = useState<string>('');

  // Context
  const { currentProject } = useCurrentProject();
  const createMeeting = useCreateMeeting();
  const navigate = useNavigate();

  // M18.0.3 — datos reales de proyecto (hooks siempre al top, antes de returns condicionales)
  const { data: teamMembers = [] } = useProjectTeamMembers(currentProject?.id);
  const { data: projectOBVs = [] } = useQuery({
    queryKey: ['meeting-obvs', currentProject?.id],
    enabled:  !!currentProject?.id,
    staleTime: 2 * 60_000,
    queryFn:  async () => {
      const { data } = await supabase
        .from('obvs')
        .select('id, titulo')
        .eq('proyecto_id', currentProject!.id)
        .eq('activo', true);
      return (data ?? []).map(o => ({ id: o.id, title: o.titulo as string }));
    },
  });
  // M18.0.6 — modo solo/equipo
  const { data: meetingMode } = useMeetingMode(currentProject?.id);

  // Mapeo team members → shape que espera StartMeetingModal
  const projectParticipants = meetingMode?.mode === 'solo'
    ? []  // solo mode: founder es el único participante implícito
    : teamMembers.map(pm => ({
        id:    pm.member_id,
        name:  (pm.member as { nombre?: string } | null)?.nombre ?? '',
        role:  pm.role ?? '',
        email: (pm.member as { email?: string } | null)?.email ?? '',
      }));

  /**
   * Handler para crear reunión
   */
  const handleStartMeeting = async (config: Record<string, unknown> & { title: string; meeting_type: string; description?: string; objectives?: string; estimated_duration_min?: number; strategic_context?: Record<string, unknown>; participants: string[]; assignable_members?: string[]; ai_config: { enable_questions: boolean; enable_proactive_guidance: boolean; enable_context_detection: boolean; enable_time_alerts: boolean } }) => {
    if (!currentProject) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    try {
      const meeting = await createMeeting.mutateAsync({
        project_id: currentProject.id,
        title: config.title,
        meeting_type: config.meeting_type,
        description: config.description,
        objectives: config.objectives,
        estimated_duration_min: config.estimated_duration_min,
        strategic_context: config.strategic_context,
        participants: config.participants,
        assignable_members: config.assignable_members,
        ai_config: config.ai_config,
      });

      setShowModal(false);
      setCurrentMeeting(meeting);
      toast.success('¡Reunión creada! Ahora puedes grabar o subir el audio');
    } catch (_error) {
      // intentionally empty
    }
  };

  /**
   * Handler para completar grabación — transición a revisión de preguntas
   */
  const handleRecordingComplete = (_audioUrl: string) => {
    if (currentMeeting) {
      setQuestionsReviewMeeting(currentMeeting.id);
      setQuestionsReviewMeetingTitle(currentMeeting.title);
    }
    setCurrentMeeting(null);
  };

  /**
   * Handler para continuar de preguntas a insights — M18.G.1: navega a review page full-screen
   */
  const handleContinueToInsights = () => {
    if (questionsReviewMeeting && currentProject) {
      navigate(`/proyecto/${currentProject.id}/meeting-review/${questionsReviewMeeting}`);
    }
    setQuestionsReviewMeeting(null);
  };

  /**
   * Handler para cancelar revisión de preguntas
   */
  const handleCancelQuestionsReview = () => {
    setQuestionsReviewMeeting(null);
    toast.info('Revisión de preguntas cancelada');
  };

  /**
   * Handler para cancelar grabación
   */
  const handleCancelRecording = () => {
    setCurrentMeeting(null);
    toast.info('Grabación cancelada');
  };

  // Validación de proyecto
  if (!currentProject) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Por favor selecciona un proyecto desde el selector en el header
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Si hay una reunión en revisión de preguntas, mostrar questions review
  if (questionsReviewMeeting) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <MeetingQuestionsReview
          meetingId={questionsReviewMeeting}
          meetingTitle={questionsReviewMeetingTitle}
          onContinueToInsights={handleContinueToInsights}
          onBack={handleCancelQuestionsReview}
        />
      </div>
    );
  }

  // Si hay una reunión en proceso, mostrar el recorder
  if (currentMeeting) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <LiveMeetingRecorder
          meetingId={currentMeeting.id}
          projectId={currentProject.id}
          meetingTitle={currentMeeting.title}
          estimatedDurationMin={currentMeeting.estimated_duration_min || 60}
          onRecordingComplete={handleRecordingComplete}
          onCancel={handleCancelRecording}
        />
      </div>
    );
  }

  // Vista principal: Historial
  return (
    <div className="container max-w-6xl mx-auto py-8">
      {/* M18.0.6 — Banner solo mode */}
      {meetingMode?.mode === 'solo' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          <Users className="h-4 w-4 shrink-0" />
          Invita a tu equipo para activar colaboración en reuniones — asignación automática de tareas y seguimiento de compromisos.
        </div>
      )}

      <MeetingHistory
        projectId={currentProject.id}
        onStartNewMeeting={() => setShowModal(true)}
      />

      {/* Modal de configuración */}
      <StartMeetingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStart={handleStartMeeting}
        projectId={currentProject.id}
        projectMembers={projectParticipants}
        currentOBVs={projectOBVs}
      />
    </div>
  );
}
