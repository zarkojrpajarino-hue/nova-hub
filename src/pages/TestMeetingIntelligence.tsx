/**
 * 🧪 TEST PAGE - MEETING INTELLIGENCE
 *
 * Página de prueba temporal para probar el sistema Meeting Intelligence
 * ELIMINAR cuando el sistema esté integrado en producción
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StartMeetingModal, LiveMeetingRecorder, MeetingInsightsReview, MeetingHistory } from '@/components/meetings';
import { useCreateMeeting, useProjectMeetings, Meeting } from '@/hooks/useMeetings';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { Mic, CheckCircle2, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function TestMeetingIntelligence() {
  const [showModal, setShowModal] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [reviewingMeeting, setReviewingMeeting] = useState<Meeting | null>(null);
  const { currentProject } = useCurrentProject();
  const createMeeting = useCreateMeeting();

  // Solo cargar meetings si hay proyecto seleccionado
  const { data: meetings = [], isLoading } = useProjectMeetings(
    currentProject?.id
  );

  // Mock data de participantes (en producción vendría de la BD)
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

  // Mock OBVs (en producción vendría de la BD)
  const mockOBVs = [
    { id: 'obv-1', title: 'Lanzar Beta Q1 2024' },
    { id: 'obv-2', title: 'Alcanzar €50K MRR' },
    { id: 'obv-3', title: '1000 usuarios activos' },
  ];

  const handleStartMeeting = async (config: Record<string, unknown> & { title: string; meeting_type: string; description?: string; objectives?: string; estimated_duration_min?: number; strategic_context?: Record<string, unknown>; participants: string[]; assignable_members?: string[]; ai_config: { enable_questions: boolean; enable_proactive_guidance: boolean; enable_context_detection: boolean; enable_time_alerts: boolean } }) => {
    if (!currentProject) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    console.log('📋 Configuración de reunión:', config);

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

  const handleRecordingComplete = (audioUrl: string) => {
    console.log('🎙️ Audio uploaded:', audioUrl);
    // Transición a revisión de insights
    if (currentMeeting) {
      setReviewingMeeting(currentMeeting);
    }
    setCurrentMeeting(null);
  };

  const handleCancelRecording = () => {
    setCurrentMeeting(null);
    toast.info('Grabación cancelada');
  };

  const handleApplyInsights = () => {
    toast.success('Insights aplicados al sistema (Task #50 - próximamente)');
    setReviewingMeeting(null);
  };

  const handleCancelReview = () => {
    setReviewingMeeting(null);
    toast.info('Revisión cancelada');
  };

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

  // Si hay una reunión en revisión, mostrar insights review
  if (reviewingMeeting) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <MeetingInsightsReview
          meetingId={reviewingMeeting.id}
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

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <MeetingHistory
        projectId={currentProject.id}
        onStartNewMeeting={() => setShowModal(true)}
        onReviewInsights={setReviewingMeeting}
      />

      {/* Main Test Card */}
      <Card>
        <CardHeader>
          <CardTitle>Probar Modal de Configuración</CardTitle>
          <CardDescription>
            Click en el botón para abrir el modal de configuración pre-reunión y probar todas las funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setShowModal(true)}
            size="lg"
            className="w-full gap-2"
          >
            <Mic className="h-5 w-5" />
            Iniciar Nueva Reunión
          </Button>

          <div className="pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Funcionalidades a probar:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Modal en 3 pasos con progress indicator
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                20+ tipos de reunión organizados por categoría
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Tipo de reunión personalizado
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Selección de participantes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Miembros asignables (no presentes)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Preguntas estratégicas de contexto
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Configuración de funcionalidades IA
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Validaciones y resumen final
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reuniones Creadas
          </CardTitle>
          <CardDescription>
            Reuniones que has creado en este proyecto (guardadas en la base de datos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : meetings && meetings.length > 0 ? (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{meeting.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="capitalize">{meeting.meeting_type.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{meeting.estimated_duration_min} min</span>
                        <span>•</span>
                        <span className="capitalize">{meeting.status}</span>
                      </div>
                      {meeting.objectives && (
                        <p className="text-sm text-gray-600 mt-2">{meeting.objectives}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        meeting.status === 'completed' ? 'bg-green-100 text-green-700' :
                        meeting.status === 'ready_for_review' ? 'bg-purple-100 text-purple-700' :
                        meeting.status === 'recording' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {meeting.status}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(meeting.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      {meeting.status === 'ready_for_review' && (
                        <Button
                          size="sm"
                          onClick={() => setReviewingMeeting(meeting)}
                          className="mt-2"
                        >
                          Revisar Insights
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay reuniones creadas aún</p>
              <p className="text-sm mt-1">Crea tu primera reunión usando el botón de arriba</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
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
