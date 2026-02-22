/**
 * 🎙️ MEETING INTELLIGENCE PAGE
 *
 * Página principal del sistema Meeting Intelligence
 * Muestra historial de reuniones con búsqueda, filtros y acciones
 */

import { useState } from 'react';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  StartMeetingModal,
  LiveMeetingRecorder,
  MeetingQuestionsReview,
  MeetingInsightsReview,
  MeetingHistory,
} from '@/components/meetings';
import { useCreateMeeting, Meeting } from '@/hooks/useMeetings';
import { toast } from 'sonner';

export default function MeetingIntelligencePage() {
  // State
  const [showModal, setShowModal] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [questionsReviewMeeting, setQuestionsReviewMeeting] = useState<string | null>(null);
  const [questionsReviewMeetingTitle, setQuestionsReviewMeetingTitle] = useState<string>('');
  const [reviewingMeeting, setReviewingMeeting] = useState<string | null>(null);

  // Context
  const { currentProject } = useCurrentProject();
  const createMeeting = useCreateMeeting();

  // Mock data (en producción vendría de la BD)
  const mockParticipants = [
    {
      id: '1',
      name: 'Juan Pérez',
      role: 'Product Manager',
      email: 'juan@example.com',
    },
    {
      id: '2',
      name: 'María García',
      role: 'CTO',
      email: 'maria@example.com',
    },
    {
      id: '3',
      name: 'Carlos López',
      role: 'CMO',
      email: 'carlos@example.com',
    },
    {
      id: '4',
      name: 'Ana Martínez',
      role: 'CFO',
      email: 'ana@example.com',
    },
    {
      id: '5',
      name: 'Pedro Ruiz',
      role: 'Backend Developer',
      email: 'pedro@example.com',
    },
  ];

  const mockOBVs = [
    { id: 'obv-1', title: 'Lanzar Beta Q1 2024' },
    { id: 'obv-2', title: 'Alcanzar €50K MRR' },
    { id: 'obv-3', title: '1000 usuarios activos' },
  ];

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
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  /**
   * Handler para completar grabación
   */
  const handleRecordingComplete = (audioUrl: string) => {
    console.log('🎙️ Audio uploaded:', audioUrl);
    // Transición a revisión de preguntas primero
    if (currentMeeting) {
      setQuestionsReviewMeeting(currentMeeting.id);
      setQuestionsReviewMeetingTitle(currentMeeting.title);
    }
    setCurrentMeeting(null);
  };

  /**
   * Handler para continuar de preguntas a insights
   */
  const handleContinueToInsights = () => {
    if (questionsReviewMeeting) {
      setReviewingMeeting(questionsReviewMeeting);
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

  /**
   * Handler para aplicar insights
   */
  const handleApplyInsights = () => {
    setReviewingMeeting(null);
    toast.success('Insights aplicados correctamente');
  };

  /**
   * Handler para cancelar revisión
   */
  const handleCancelReview = () => {
    setReviewingMeeting(null);
    toast.info('Revisión cancelada');
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

  // Si hay una reunión en revisión de insights, mostrar insights review
  if (reviewingMeeting) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <MeetingInsightsReview
          meetingId={reviewingMeeting}
          onApplyInsights={handleApplyInsights}
          onCancel={handleCancelReview}
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
      <MeetingHistory
        projectId={currentProject.id}
        onStartNewMeeting={() => setShowModal(true)}
        onReviewInsights={setReviewingMeeting}
      />

      {/* Modal de configuración */}
      <StartMeetingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStart={handleStartMeeting}
        projectId={currentProject.id}
        projectMembers={mockParticipants}
        currentOBVs={mockOBVs}
      />
    </div>
  );
}
