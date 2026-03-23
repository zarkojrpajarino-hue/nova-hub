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
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectMeetings, useMeeting, useMeetingInsights, Meeting } from '@/hooks/useMeetings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Calendar,
  Clock,
  FileText,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mic,
  Target,
  Briefcase,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RepeatIcon,
  ListTodo,
  TrendingUp,
  GitBranch,
} from 'lucide-react';
import { getMeetingPatterns } from '@/services/meetingAgentService';
import { MeetingDecisionTimeline } from './MeetingDecisionTimeline';
import { MeetingSuggestionBanner } from './MeetingSuggestionBanner';

import { useTranslation } from 'react-i18next';
// ── M18.24: useMeetingKPIs ────────────────────────────────────────────────────

function useMeetingKPIs(projectId: string, meetings: Meeting[]) {
  const { t: _t } = useTranslation();
  // Tasks from meetings (generated + completed)
  const { data: taskData } = useQuery({
    queryKey:  ['meeting_tasks_kpi', projectId],
    enabled:   !!projectId,
    staleTime: 3 * 60_000,
    queryFn:   async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('project_id', projectId)
        .not('meeting_id', 'is', null);
      return {
        total:     data?.length ?? 0,
        completed: data?.filter(t => t.status === 'done').length ?? 0,
      };
    },
  });

  // Avg alignment score last 5 completed meetings
  const { data: avgAlignment } = useQuery<number | null>({
    queryKey:  ['meeting_alignment_kpi', projectId],
    enabled:   !!projectId,
    staleTime: 5 * 60_000,
    queryFn:   async () => {
      const { data } = await supabase
        .from('meetings')
        .select('alignment_data')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .not('alignment_data', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
      const scores = (data ?? [])
        .map(m => (m.alignment_data as { alignment_score?: number } | null)?.alignment_score)
        .filter((s): s is number => typeof s === 'number');
      if (scores.length === 0) return null;
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100);
    },
  });

  // Computed from existing meetings array (no extra query)
  const thisMonth = useMemo(() => {
    const now = new Date();
    return meetings.filter(m => {
      const d = new Date(m.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [meetings]);

  const totalHours = useMemo(() => {
    const mins = meetings
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + (m.estimated_duration_min ?? 0), 0);
    return Math.round(mins / 6) / 10; // 1 decimal
  }, [meetings]);

  return {
    thisMonth,
    totalHours,
    tasksGenerated: taskData?.total ?? 0,
    tasksCompleted: taskData?.completed ?? 0,
    avgAlignment:   avgAlignment ?? null,
  };
}

// ── M18.16: useMeetingFulfillment ─────────────────────────────────────────────

interface MeetingFulfillment {
  total_tasks:      number
  completed_tasks:  number
  overdue_tasks:    number
  fulfillment_rate: number | null
}

function useMeetingFulfillment(meetingId: string) {
  return useQuery({
    queryKey:  ['meeting_fulfillment', meetingId],
    staleTime: 120_000,
    enabled:   !!meetingId,
    queryFn:   async (): Promise<MeetingFulfillment | null> => {
      const { data, error } = await supabase
        .rpc('get_meeting_fulfillment', { p_meeting_id: meetingId })
      if (error || !data) return null
      return data as MeetingFulfillment
    },
  })
}

// ── M18.16: FulfillmentBadge ──────────────────────────────────────────────────

function FulfillmentBadge({ meetingId }: { meetingId: string }) {
  const { data } = useMeetingFulfillment(meetingId)
  if (!data || data.total_tasks === 0) return null

  const rate    = data.fulfillment_rate ?? 0
  const pct     = Math.round(rate * 100)
  const overdue = data.overdue_tasks

  const color = rate >= 0.8
    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
    : rate >= 0.5
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
      : 'bg-red-500/10 text-red-700 dark:text-red-400'

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${color}`}>
      <CheckCircle2 size={11} />
      {pct}% compromisos
      {overdue > 0 && (
        <span className="ml-1 text-red-600 dark:text-red-400">· {overdue} vencidos</span>
      )}
    </span>
  )
}

// ── F19.V2.2: useOverdueMeetingTasks ─────────────────────────────────────────
// Tareas generadas desde reuniones que llevan >30 días sin resolverse.
// Se muestran como alerta en Meeting Intelligence para cerrar el loop estratégico.

interface OverdueMeetingTask {
  id:         string
  titulo:     string   // columna real en tasks
  created_at: string
  meeting_id: string
}

function useOverdueMeetingTasks(projectId: string) {
  return useQuery({
    queryKey:  ['overdue_meeting_tasks', projectId],
    enabled:   !!projectId,
    staleTime: 5 * 60_000,
    queryFn:   async (): Promise<OverdueMeetingTask[]> => {
      const threshold = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data } = await supabase
        .from('tasks')
        .select('id, titulo, created_at, meeting_id')
        .eq('project_id', projectId)
        .not('meeting_id', 'is', null)
        .not('status', 'eq', 'done')
        .lt('created_at', threshold)
        .order('created_at', { ascending: true })
        .limit(20);
      return (data ?? []) as OverdueMeetingTask[];
    },
  });
}

// ── F19.V2.2: OverdueTasksBanner ──────────────────────────────────────────────

function OverdueTasksBanner({ projectId }: { projectId: string }) {
  const { data: overdueTasks } = useOverdueMeetingTasks(projectId);
  if (!overdueTasks || overdueTasks.length === 0) return null;

  const count = overdueTasks.length;
  const oldest = overdueTasks[0];
  const daysSince = Math.floor(
    (Date.now() - new Date(oldest.created_at).getTime()) / 86_400_000,
  );

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/30">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-900 dark:text-red-200">
            {count} {count === 1 ? 'compromiso de reunión lleva' : 'compromisos de reunión llevan'} más de 30 días sin resolverse
          </p>
          <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
            El más antiguo: <span className="font-medium">"{oldest.titulo}"</span> — {daysSince} días pendiente.
            Estos compromisos deberían discutirse en la próxima reunión.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── M18.20: useMeetingPatterns + RecurringPatternsPanel ───────────────────────

interface RecurringTopic {
  blocker_title: string
  meeting_count: number
  first_seen_at: string
  last_seen_at:  string
}

interface MeetingPatternsData {
  recurring_topics:      RecurringTopic[]
  avg_fulfillment_rate:  number | null
  blocker_threshold_met: boolean
}

function useMeetingPatterns(projectId: string, completedCount: number) {
  return useQuery({
    queryKey:  ['meeting_patterns', projectId],
    enabled:   !!projectId && completedCount >= 3,
    staleTime: 5 * 60_000,
    queryFn:   async (): Promise<MeetingPatternsData | null> => {
      const data = await getMeetingPatterns(projectId)
      if (!data) return null
      return {
        recurring_topics:      data.recurring_topics ?? [],
        avg_fulfillment_rate:  data.avg_fulfillment_rate,
        blocker_threshold_met: data.blocker_threshold_met,
      }
    },
  })
}

function RecurringPatternsPanel({
  projectId,
  completedCount,
}: {
  projectId:      string
  completedCount: number
}) {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useMeetingPatterns(projectId, completedCount)

  // Solo mostrar con ≥ 3 reuniones completadas y al menos 1 tema recurrente o bajo fulfillment
  if (completedCount < 3) return null
  if (isLoading) return null
  if (!data) return null

  const hasRecurring    = data.recurring_topics.length > 0
  const lowFulfillment  = data.avg_fulfillment_rate !== null && data.avg_fulfillment_rate < 0.5
  if (!hasRecurring && !lowFulfillment) return null

  const pct = data.avg_fulfillment_rate !== null
    ? Math.round(data.avg_fulfillment_rate * 100)
    : null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
      {/* Header colapsable */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <RepeatIcon className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Temas sin resolver
            {data.recurring_topics.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 text-xs">
                {data.recurring_topics.length}
              </span>
            )}
          </span>
        </div>
        {open
          ? <ChevronUp  className="h-4 w-4 text-amber-600" />
          : <ChevronDown className="h-4 w-4 text-amber-600" />
        }
      </button>

      {open && (
        <div className="border-t border-amber-200 dark:border-amber-800 px-4 pb-4 pt-3 space-y-3">
          {/* Banner bajo fulfillment */}
          {lowFulfillment && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">
                Tus reuniones generan compromisos que no se cumplen.
                Fulfillment medio últimas 5 reuniones: <strong>{pct}%</strong>.
              </p>
            </div>
          )}

          {/* Lista de blockers recurrentes */}
          {data.recurring_topics.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 uppercase tracking-wide">{t('meetings.blockersRecurrentes')}</p>
              <ul className="space-y-1.5">
                {data.recurring_topics.map((topic, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-amber-900 dark:text-amber-100 capitalize">
                      {topic.blocker_title}
                    </span>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-300 text-amber-700 dark:text-amber-300 text-xs"
                    >
                      {topic.meeting_count} reuniones
                    </Badge>
                  </li>
                ))}
              </ul>
              {data.blocker_threshold_met && (
                <p className="text-xs text-amber-600 dark:text-amber-400">{t('meetings.bloqueadoresDetectadosEn3')}</p>
              )}
            </div>
          )}

          {/* Fulfillment (solo si hay valor y no hay warning de bajo) */}
          {pct !== null && !lowFulfillment && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Fulfillment medio últimas 5 reuniones: <strong>{pct}%</strong>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface MeetingHistoryProps {
  projectId: string;
  onStartNewMeeting: () => void;
}

const STATUS_CONFIG = {
  configuring: { label: t('meetings.configurando'), color: 'gray', icon: Calendar },
  recording: { label: t('meetings.grabando0'), color: 'red', icon: Mic },
  processing_audio: { label: t('meetings.procesando'), color: 'blue', icon: Loader2 },
  transcribing: { label: t('meetings.transcribiendo1'), color: 'blue', icon: FileText },
  analyzing: { label: t('meetings.analizando2'), color: 'purple', icon: Target },
  ready_for_review: { label: t('meetings.listoParaRevisar3'), color: 'orange', icon: AlertCircle },
  completed: { label: t('meetings.completado'), color: 'green', icon: CheckCircle2 },
};

export function MeetingHistory({
  projectId,
  onStartNewMeeting,
}: MeetingHistoryProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();

  // Navigate to full-screen review page (M18.G.1)
  const handleReviewInsights = (meetingId: string) => {
    navigate(`/proyecto/${routeProjectId}/meeting-review/${meetingId}`);
  };

  // Hooks
  const { data: meetings = [], isLoading } = useProjectMeetings(projectId);
  const kpis = useMeetingKPIs(projectId, meetings);

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
      {/* M18.I — Suggestion banner (shown when ≥3 signals detected) */}
      <MeetingSuggestionBanner
        projectId={projectId}
        onStartMeeting={onStartNewMeeting}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('meetings.historialDeReuniones')}</h2>
          <p className="text-gray-600 mt-1">{t('meetings.todasLasReunionesDe')}</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.completed >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTimeline(true)}
              className="gap-2"
            >
              <GitBranch className="h-4 w-4" />{t('meetings.timeline')}</Button>
          )}
          <Button onClick={onStartNewMeeting} className="gap-2">
            <Mic className="h-4 w-4" />{t('meetings.nuevaReunión')}</Button>
        </div>
      </div>

      {/* M18.24 — KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Este mes */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{t('meetings.esteMes')}</span>
            </div>
            <div className="text-2xl font-bold">{kpis.thisMonth}</div>
            <div className="text-xs text-muted-foreground">{stats.completed} completadas</div>
          </CardContent>
        </Card>

        {/* Tiempo en reuniones */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{t('meetings.horasEnReuniones')}</span>
            </div>
            <div className="text-2xl font-bold">{kpis.totalHours}</div>
            <div className="text-xs text-muted-foreground">de reuniones completadas</div>
          </CardContent>
        </Card>

        {/* Compromisos */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{t('meetings.compromisos')}</span>
            </div>
            <div className="text-2xl font-bold">
              {kpis.tasksCompleted}
              <span className="text-sm font-normal text-muted-foreground">/{kpis.tasksGenerated}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {kpis.tasksGenerated > 0
                ? `${Math.round(kpis.tasksCompleted / kpis.tasksGenerated * 100)}% cumplidos`
                : 'sin compromisos'}
            </div>
          </CardContent>
        </Card>

        {/* Alignment medio */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{t('meetings.alignmentMedio')}</span>
            </div>
            <div className={`text-2xl font-bold ${
              kpis.avgAlignment === null ? 'text-muted-foreground' :
              kpis.avgAlignment >= 70 ? 'text-green-600' :
              kpis.avgAlignment >= 45 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {kpis.avgAlignment !== null ? `${kpis.avgAlignment}%` : '—'}
            </div>
            <div className="text-xs text-muted-foreground">últimas 5 reuniones</div>
          </CardContent>
        </Card>
      </div>

      {/* F19.V2.2 — Compromisos de reunión vencidos >30 días */}
      <OverdueTasksBanner projectId={projectId} />

      {/* M18.20 — Temas sin resolver (solo ≥ 3 reuniones completadas) */}
      <RecurringPatternsPanel
        projectId={projectId}
        completedCount={stats.completed}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('meetings.buscarReuniones')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por estado */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('meetings.filtrarPorEstado')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('meetings.todosLosEstados')}</SelectItem>
                <SelectItem value="completed">{t('meetings.completadas')}</SelectItem>
                <SelectItem value="ready_for_review">{t('meetings.listoParaRevisar')}</SelectItem>
                <SelectItem value="analyzing">{t('meetings.analizando')}</SelectItem>
                <SelectItem value="transcribing">{t('meetings.transcribiendo')}</SelectItem>
                <SelectItem value="recording">{t('meetings.grabando')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por tipo */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder={t('meetings.filtrarPorTipo')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('meetings.todosLosTipos')}</SelectItem>
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
                ? 'No se encontraron reuniones con esos filtros': t('meetings.noHayReunionesAún')}
            </p>
            {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
              <Button onClick={onStartNewMeeting} className="mt-4 gap-2">
                <Mic className="h-4 w-4" />{t('meetings.crearPrimeraReunión')}</Button>
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
              onReviewInsights={handleReviewInsights}
            />
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedMeeting && (
        <MeetingDetailsModal
          meetingId={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onReviewInsights={handleReviewInsights}
        />
      )}

      {/* M18.25 — Timeline de decisiones */}
      {showTimeline && (
        <Dialog open={showTimeline} onOpenChange={setShowTimeline}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">{t('meetings.timelineDeDecisiones')}</DialogTitle>
            </DialogHeader>
            <MeetingDecisionTimeline
              projectId={projectId}
              onClose={() => setShowTimeline(false)}
            />
          </DialogContent>
        </Dialog>
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

            {/* M18.16 — fulfillment rate, solo en reuniones completadas */}
            {meeting.status === 'completed' && (
              <div className="mt-1">
                <FulfillmentBadge meetingId={meeting.id} />
              </div>
            )}

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
              <Eye className="h-4 w-4" />{t('meetings.verDetalles')}</Button>

            {meeting.status === 'ready_for_review' && (
              <Button
                size="sm"
                onClick={() => onReviewInsights(meeting.id)}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />{t('meetings.revisarInsights')}</Button>
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
              <h4 className="font-semibold mb-2">{t('meetings.objetivos')}</h4>
              <p className="text-sm text-gray-700">{meeting.objectives}</p>
            </div>
          )}

          {/* Resumen */}
          {meeting.summary && (
            <div>
              <h4 className="font-semibold mb-2">{t('meetings.resumen')}</h4>
              <p className="text-sm text-gray-700">{meeting.summary}</p>
            </div>
          )}

          {/* Key Points */}
          {meeting.key_points && meeting.key_points.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">{t('meetings.puntosClave')}</h4>
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
              <h4 className="font-semibold mb-2">{t('meetings.transcripciónCompleta')}</h4>
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
                          • {insight.content.title || insight.content.name || t('meetings.sinTítulo')}
                          {insight.applied && (
                            <Badge variant="secondary" className="ml-2 text-xs">{t('meetings.aplicado')}</Badge>
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
                  <AlertCircle className="h-4 w-4" />{t('meetings.revisarYAprobarInsights')}</Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
