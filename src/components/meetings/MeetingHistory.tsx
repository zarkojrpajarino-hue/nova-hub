/**
 * 📚 MEETING HISTORY
 *
 * Componente para ver historial completo de reuniones
 * Funcionalidades:
 * - Lista de todas las reuniones del proyecto
 * - Filtros por estado, tipo, fecha
 * - Búsqueda por texto
 * - Vista detallada de cada reunión
 * - Acceso a transcripción e insights
 * - Acciones según estado
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectMeetings, useMeeting, useMeetingInsights, Meeting } from '@/hooks/useMeetings';
import {
  Search,
  Calendar,
  Clock,
  Users,
  FileText,
  Eye,
  Loader2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Mic,
  Target,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

interface MeetingHistoryProps {
  projectId: string;
  onStartNewMeeting: () => void;
  onReviewInsights: (meetingId: string) => void;
}

const STATUS_CONFIG = {
  configuring: { label: 'Configurando', color: 'gray', icon: Calendar },
  recording: { label: 'Grabando', color: 'red', icon: Mic },
  processing_audio: { label: 'Procesando', color: 'blue', icon: Loader2 },
  transcribing: { label: 'Transcribiendo', color: 'blue', icon: FileText },
  analyzing: { label: 'Analizando', color: 'purple', icon: Target },
  ready_for_review: { label: 'Listo para revisar', color: 'orange', icon: AlertCircle },
  completed: { label: 'Completado', color: 'green', icon: CheckCircle2 },
};

export function MeetingHistory({
  projectId,
  onStartNewMeeting,
  onReviewInsights,
}: MeetingHistoryProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);

  // Hooks
  const { data: meetings = [], isLoading } = useProjectMeetings(projectId);

  // Filtros y búsqueda
  const filteredMeetings = useMemo(() => {
    let filtered = [...meetings];

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(term) ||
          m.objectives?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term)
      );
    }

    // Filtro de estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    // Filtro de tipo
    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.meeting_type === filterType);
    }

    return filtered;
  }, [meetings, searchTerm, filterStatus, filterType]);

  // Tipos únicos de reuniones
  const meetingTypes = useMemo(() => {
    const types = new Set(meetings.map((m) => m.meeting_type));
    return Array.from(types);
  }, [meetings]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: meetings.length,
      completed: meetings.filter((m) => m.status === 'completed').length,
      pending: meetings.filter((m) => m.status === 'ready_for_review').length,
      inProgress: meetings.filter((m) =>
        ['recording', 'processing_audio', 'transcribing', 'analyzing'].includes(m.status)
      ).length,
    };
  }, [meetings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Reuniones</h2>
          <p className="text-gray-600 mt-1">
            Todas las reuniones de este proyecto
          </p>
        </div>
        <Button onClick={onStartNewMeeting} className="gap-2">
          <Mic className="h-4 w-4" />
          Nueva Reunión
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendientes Revisión</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">En Proceso</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar reuniones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por estado */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="ready_for_review">Listo para revisar</SelectItem>
                <SelectItem value="analyzing">Analizando</SelectItem>
                <SelectItem value="transcribing">Transcribiendo</SelectItem>
                <SelectItem value="recording">Grabando</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por tipo */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {meetingTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de reuniones */}
      {filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'No se encontraron reuniones con esos filtros'
                : 'No hay reuniones aún'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
              <Button onClick={onStartNewMeeting} className="mt-4 gap-2">
                <Mic className="h-4 w-4" />
                Crear Primera Reunión
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onViewDetails={setSelectedMeeting}
              onReviewInsights={onReviewInsights}
            />
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedMeeting && (
        <MeetingDetailsModal
          meetingId={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onReviewInsights={onReviewInsights}
        />
      )}
    </div>
  );
}

/**
 * Card individual de reunión
 */
interface MeetingInsightEntry {
  id: string;
  insight_type: string;
  content: { title?: string; name?: string };
  applied?: boolean;
}

interface MeetingCardProps {
  meeting: Meeting;
  onViewDetails: (id: string) => void;
  onReviewInsights: (id: string) => void;
}

function MeetingCard({ meeting, onViewDetails, onReviewInsights }: MeetingCardProps) {
  const statusConfig = STATUS_CONFIG[meeting.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.configuring;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{meeting.title}</h3>
              <Badge className={`bg-${statusConfig.color}-100 text-${statusConfig.color}-700`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(meeting.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="capitalize">{meeting.meeting_type.replace(/_/g, ' ')}</span>
              {meeting.estimated_duration_min && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {meeting.estimated_duration_min} min
                </span>
              )}
            </div>

            {meeting.objectives && (
              <p className="text-sm text-gray-700 line-clamp-2">{meeting.objectives}</p>
            )}

            {meeting.summary && (
              <p className="text-sm text-gray-600 italic mt-2 line-clamp-2">
                "{meeting.summary}"
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(meeting.id)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver Detalles
            </Button>

            {meeting.status === 'ready_for_review' && (
              <Button
                size="sm"
                onClick={() => onReviewInsights(meeting.id)}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Revisar Insights
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Modal de detalles de reunión
 */
interface MeetingDetailsModalProps {
  meetingId: string;
  onClose: () => void;
  onReviewInsights: (id: string) => void;
}

function MeetingDetailsModal({ meetingId, onClose, onReviewInsights }: MeetingDetailsModalProps) {
  const { data: meeting, isLoading } = useMeeting(meetingId);
  const { data: insights = [] } = useMeetingInsights(meetingId);

  if (isLoading || !meeting) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusConfig = STATUS_CONFIG[meeting.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.configuring;
  const StatusIcon = statusConfig.icon;

  // Agrupar insights por tipo
  const insightsByType = insights.reduce((acc: Record<string, MeetingInsightEntry[]>, insight: MeetingInsightEntry) => {
    if (!acc[insight.insight_type]) {
      acc[insight.insight_type] = [];
    }
    acc[insight.insight_type].push(insight);
    return acc;
  }, {});

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {meeting.title}
            <Badge className={`bg-${statusConfig.color}-100 text-${statusConfig.color}-700`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Fecha:</span>{' '}
              {new Date(meeting.created_at).toLocaleDateString('es-ES')}
            </div>
            <div>
              <span className="font-semibold">Tipo:</span>{' '}
              {meeting.meeting_type.replace(/_/g, ' ')}
            </div>
            <div>
              <span className="font-semibold">Duración estimada:</span>{' '}
              {meeting.estimated_duration_min} min
            </div>
            {meeting.duration_actual_min && (
              <div>
                <span className="font-semibold">Duración real:</span>{' '}
                {meeting.duration_actual_min} min
              </div>
            )}
          </div>

          {/* Objetivos */}
          {meeting.objectives && (
            <div>
              <h4 className="font-semibold mb-2">Objetivos</h4>
              <p className="text-sm text-gray-700">{meeting.objectives}</p>
            </div>
          )}

          {/* Resumen */}
          {meeting.summary && (
            <div>
              <h4 className="font-semibold mb-2">Resumen</h4>
              <p className="text-sm text-gray-700">{meeting.summary}</p>
            </div>
          )}

          {/* Key Points */}
          {meeting.key_points && meeting.key_points.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Puntos Clave</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {meeting.key_points.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcripción */}
          {meeting.transcript && (
            <div>
              <h4 className="font-semibold mb-2">Transcripción Completa</h4>
              <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {meeting.transcript}
                </p>
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Insights Extraídos ({insights.length})</h4>
              <div className="space-y-3">
                {Object.entries(insightsByType).map(([type, typeInsights]: [string, MeetingInsightEntry[]]) => (
                  <div key={type} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {type === 'task' && <Target className="h-4 w-4 text-blue-600" />}
                      {type === 'decision' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {type === 'lead' && <Briefcase className="h-4 w-4 text-purple-600" />}
                      {type === 'blocker' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      <span className="font-semibold capitalize">
                        {type.replace(/_/g, ' ')} ({typeInsights.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {typeInsights.slice(0, 3).map((insight: MeetingInsightEntry) => (
                        <div key={insight.id} className="text-sm text-gray-700 pl-6">
                          • {insight.content.title || insight.content.name || 'Sin título'}
                          {insight.applied && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Aplicado
                            </Badge>
                          )}
                        </div>
                      ))}
                      {typeInsights.length > 3 && (
                        <div className="text-xs text-gray-500 pl-6">
                          Y {typeInsights.length - 3} más...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {meeting.status === 'ready_for_review' && (
                <Button
                  onClick={() => {
                    onClose();
                    onReviewInsights(meetingId);
                  }}
                  className="w-full mt-4 gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Revisar y Aprobar Insights
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
