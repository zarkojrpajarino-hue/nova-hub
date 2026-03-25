/**
 * M18.G.1 — MEETING REVIEW PAGE
 *
 * Pantalla full-screen de revisión de insights post-reunión.
 * Layout 3 columnas:
 *   Left  (30%): transcript completo
 *   Center(45%): insights por nivel de impacto (3→2→1), fricción proporcional
 *   Right (25%): resumen ejecutivo en vivo
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, XCircle, FileText, Target, Briefcase, AlertTriangle, BarChart3, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMeetingInsights, useMeeting, useApplyMeetingInsights } from '@/hooks/useMeetings';
import { classifyInsightImpact, type MeetingInsightRow, type MeetingInsightWithImpact } from '@/lib/meeting-agent';
import { MeetingCompletionSummary } from '@/components/meetings/MeetingCompletionSummary';
import type { ApplyResults } from '@/components/meetings/MeetingInsightsReview';
import type { AlignmentData } from '@/components/meetings/MeetingCompletionSummary';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { runMeetingAgent } from '@/services/meetingAgentService';

import { useTranslation } from 'react-i18next';
// ── Types ─────────────────────────────────────────────────────────────────────

interface InsightLocal {
  id:            string;
  insight_type:  string;
  content:       Record<string, unknown>;
  review_status: 'pending_review' | 'approved' | 'rejected';
  applied:       boolean;
}

interface MeetingTask {
  id:          string;
  titulo:      string;
  status:      string;
  fecha_limite: string | null;
}

// ── Insight Icon ──────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  task:       Target,
  decision:   CheckCircle2,
  lead:       Briefcase,
  obv_update: Target,
  blocker:    AlertTriangle,
  metric:     BarChart3,
};

function getLevelLabels(t: (k: string) => string): Record<string, string> {
  return {
    high:   t('meetingReview.estratégico'),
    medium: t('meetingReview.operativo'),
    low:    t('meetingReview.informativo'),
  };
}

const LEVEL_BADGE: Record<string, string> = {
  high:   'bg-purple-100 text-purple-700',
  medium: 'bg-blue-100 text-blue-700',
  low:    'bg-gray-100 text-gray-600',
};

// ── Insight Card ──────────────────────────────────────────────────────────────

function InsightCard({
  insight,
  classified,
  onApprove,
  onReject,
}: {
  insight:    InsightLocal;
  classified: MeetingInsightWithImpact;
  onApprove:  (id: string) => void;
  onReject:   (id: string) => void;
}) {
  const { t } = useTranslation();
  const LEVEL_LABEL = getLevelLabels(t);
  const [confirmed, setConfirmed] = useState(false);
  const Icon  = TYPE_ICON[insight.insight_type] ?? Target;
  const title = (insight.content.title ?? insight.content.name ?? t('meetingReview.sinTítulo')) as string;
  const desc  = (insight.content.description ?? insight.content.rationale ?? '') as string;
  const level = classified.impact_level;

  const isApproved = insight.review_status === 'approved';
  const isRejected = insight.review_status === 'rejected';

  const borderClass =
    isApproved ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' :
    isRejected ? 'border-gray-200 bg-gray-50/50 opacity-50 dark:bg-gray-900/20' :
    level === 'high' ? 'border-purple-200 bg-purple-50/30 dark:bg-purple-950/20' :
    'border-border';

  return (
    <Card className={`transition-all ${borderClass}`}>
      <CardContent className="p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon size={13} className="shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium leading-snug line-clamp-2">{title}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {classified.auto_degraded && (
              <Badge className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0">↓ rebajado</Badge>
            )}
            <Badge className={`text-xs px-1.5 py-0 ${LEVEL_BADGE[level]}`}>
              {LEVEL_LABEL[level]}
            </Badge>
          </div>
        </div>

        {/* Description */}
        {desc && <p className="text-xs text-muted-foreground line-clamp-2 pl-5">{desc}</p>}

        {/* Reliability bar (Level 3 y 2) */}
        {level !== 'low' && (
          <div className="flex items-center gap-2 pl-5">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  classified.combined_reliability >= 0.7 ? 'bg-green-500' :
                  classified.combined_reliability >= 0.4 ? 'bg-amber-500' : 'bg-red-400'
                }`}
                style={{ width: `${Math.round(classified.combined_reliability * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {Math.round(classified.combined_reliability * 100)}% fiabilidad
            </span>
          </div>
        )}

        {/* Actions */}
        {!isApproved && !isRejected && (
          <div className="pl-5 pt-1">
            {/* Level 3: requires confirmation checkbox */}
            {level === 'high' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={v => setConfirmed(!!v)}
                  />
                  <span className="text-xs text-muted-foreground">{t('meetingReview.confirmoQueEstaDecisión')}</span>
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!confirmed}
                    onClick={() => onApprove(insight.id)}
                    className="h-7 text-xs px-3"
                  >{t('meetingReview.aplicarDecisión')}</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onReject(insight.id)}
                    className="h-7 text-xs px-2 text-muted-foreground"
                  >{t('meetingReview.descartar')}</Button>
                </div>
              </div>
            )}

            {/* Level 2: normal approve/reject */}
            {level === 'medium' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(insight.id)}
                  className="h-7 text-xs px-3"
                >
                  <CheckCircle2 size={11} className="mr-1" />{t('meetingReview.aprobar')}</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(insight.id)}
                  className="h-7 text-xs px-2"
                >
                  <XCircle size={11} className="mr-1" />{t('meetingReview.rechazar')}</Button>
              </div>
            )}

            {/* Level 1: pre-selected, only dismiss */}
            {level === 'low' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground italic">{t('meetingReview.autoincluido')}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReject(insight.id)}
                  className="h-6 text-xs px-2 text-muted-foreground"
                >{t('meetingReview.descartar')}</Button>
              </div>
            )}
          </div>
        )}

        {/* Status badge */}
        {isApproved && (
          <div className="pl-5 flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 size={11} />{t('meetingReview.aprobado')}</div>
        )}
        {isRejected && (
          <div className="pl-5 flex items-center gap-1 text-xs text-muted-foreground">
            <XCircle size={11} />{t('meetingReview.descartado')}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Right panel: live summary ─────────────────────────────────────────────────

function LiveSummaryPanel({ insights }: { insights: InsightLocal[] }) {
  const { t } = useTranslation();
  const approved = insights.filter(i => i.review_status === 'approved');

  const counts = useMemo(() => ({
    tasks:      approved.filter(i => i.insight_type === 'task').length,
    decisions:  approved.filter(i => i.insight_type === 'decision').length,
    leads:      approved.filter(i => i.insight_type === 'lead').length,
    blockers:   approved.filter(i => i.insight_type === 'blocker').length,
    metrics:    approved.filter(i => i.insight_type === 'metric').length,
    obv_update: approved.filter(i => i.insight_type === 'obv_update').length,
  }), [approved]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pending = insights.filter(i => i.review_status === 'pending_review').length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />{t('meetingReview.resumenEnVivo')}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t('meetingReview.seActualizaAlAprobar')}</p>
      </div>

      {/* Approved counts */}
      <div className="space-y-2">
        {[
          { label: t('meetingReview.tareas'),       val: counts.tasks,      color: 'text-blue-600' },
          { label: t('meetingReview.decisiones'),   val: counts.decisions,  color: 'text-green-600' },
          { label: t('meetingReview.leads'),        val: counts.leads,      color: 'text-purple-600' },
          { label: t('meetingReview.blockers'),     val: counts.blockers,   color: 'text-red-600' },
          { label: t('meetingReview.métricas'),     val: counts.metrics,    color: 'text-indigo-600' },
          { label: t('meetingReview.obvUpdates'),  val: counts.obv_update, color: 'text-orange-600' },
        ].filter(item => item.val > 0 || total === 0).map(item => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-semibold ${item.val > 0 ? item.color : 'text-muted-foreground'}`}>
              {item.val}
            </span>
          </div>
        ))}
      </div>

      {/* Status line */}
      <div className="border-t border-border pt-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t('meetingReview.aprobados')}</span>
          <span className="font-medium text-green-600">{approved.length}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t('meetingReview.pendientes')}</span>
          <span className="font-medium text-amber-600">{pending}</span>
        </div>
      </div>

      {/* Progress bar */}
      {insights.length > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((approved.length / insights.length) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {Math.round((approved.length / insights.length) * 100)}% revisados
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function MeetingReviewPage() {
  const { t } = useTranslation();
  const LEVEL_LABEL = getLevelLabels(t);
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate      = useNavigate();
  const { currentProject } = useCurrentProject();

  const [localInsights, setLocalInsights]       = useState<InsightLocal[]>([]);
  const [isApplying, setIsApplying]             = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{ results: ApplyResults } | null>(null);
  const [tasksSheetOpen, setTasksSheetOpen]     = useState(false);

  const { data: insights, isLoading: insightsLoading } = useMeetingInsights(meetingId ?? '');
  const { data: meeting,  isLoading: meetingLoading  } = useMeeting(meetingId ?? '');
  const applyInsights = useApplyMeetingInsights();

  // Tasks created for this meeting (for post-apply Sheet)
  const { data: meetingTasks = [] } = useQuery<MeetingTask[]>({
    queryKey:  ['meeting_tasks_created', meetingId],
    enabled:   !!meetingId && !!completedSummary,
    staleTime: 60_000,
    queryFn:   async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, titulo, status, fecha_limite')
        .eq('meeting_id', meetingId!)
        .order('created_at', { ascending: true });
      return (data ?? []) as MeetingTask[];
    },
  });

  // Sync insights to local state
  useEffect(() => {
    if (insights && localInsights.length === 0) {
      setLocalInsights(insights as InsightLocal[]);
    }
  }, [insights, localInsights.length]);

  // Auto-approve Level 1 (low) insights — local + DB (DEUDA.6 fix)
  useEffect(() => {
    if (localInsights.length === 0) return;
    const confidence = meeting?.ai_confidence_score ?? 0.6;
    const toApprove = localInsights.filter(i => {
      if (i.review_status !== 'pending_review') return false;
      const c = classifyInsightImpact(i as unknown as MeetingInsightRow, confidence);
      return c.impact_level === 'low';
    });
    if (toApprove.length === 0) return;
    // Optimistic update
    setLocalInsights(prev =>
      prev.map(i => toApprove.find(t => t.id === i.id) ? { ...i, review_status: 'approved' } : i)
    );
    // Persist to DB (non-blocking)
    const ids = toApprove.map(i => i.id);
    void supabase
      .from('meeting_insights')
      .update({ review_status: 'approved' })
      .in('id', ids)
      .then(({ error }) => {
        if (error) { /* Auto-approve Level 1 persist failed — non-critical */ }
      });
  }, [localInsights.length, meeting?.ai_confidence_score]); // eslint-disable-line react-hooks/exhaustive-deps

  const transcriptionConfidence = meeting?.ai_confidence_score ?? 0.6;

  const classifiedMap = useMemo(() =>
    new Map<string, MeetingInsightWithImpact>(
      localInsights.map(i => [
        i.id,
        classifyInsightImpact(i as unknown as MeetingInsightRow, transcriptionConfidence),
      ])
    ),
    [localInsights, transcriptionConfidence]
  );

  // Group by level: high first, then medium, then low
  const byLevel = useMemo(() => {
    const groups: Record<'high' | 'medium' | 'low', InsightLocal[]> = { high: [], medium: [], low: [] };
    for (const i of localInsights) {
      const level = classifiedMap.get(i.id)?.impact_level ?? 'low';
      groups[level].push(i);
    }
    return groups;
  }, [localInsights, classifiedMap]);

  const handleApprove = async (id: string) => {
    try {
      await supabase.from('meeting_insights').update({ review_status: 'approved' }).eq('id', id);
      setLocalInsights(prev => prev.map(i => i.id === id ? { ...i, review_status: 'approved' } : i));
    } catch {
      toast.error(t('meetingReview.errorAlAprobarInsight'));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await supabase.from('meeting_insights').update({ review_status: 'rejected' }).eq('id', id);
      setLocalInsights(prev => prev.map(i => i.id === id ? { ...i, review_status: 'rejected' } : i));
    } catch {
      toast.error(t('meetingReview.errorAlRechazarInsight'));
    }
  };

  const handleApply = async () => {
    if (!meetingId) return;
    setIsApplying(true);
    try {
      const result = await applyInsights.mutateAsync(meetingId) as { results: ApplyResults };
      setCompletedSummary({ results: result.results });
      // M18.A — Meeting Agent: genera integration_insights desde insights aprobados (fire-and-forget)
      if (currentProject) {
        void runMeetingAgent(currentProject.id, meetingId)
          .catch(_e => { /* Meeting Agent failed — non-fatal */ });
      }
    } catch {
      toast.error(t('meetingReview.errorAlAplicarInsights'));
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    if (currentProject) {
      navigate(`/proyecto/${currentProject.id}/meetings`);
    } else {
      navigate(-1);
    }
  };

  const isLoading = insightsLoading || meetingLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Post-apply: show completion summary ──────────────────────────────────────
  if (completedSummary) {
    const alignment = (meeting as Record<string, unknown> | undefined)?.alignment_data as AlignmentData | null ?? null;
    return (
      <div className="container max-w-3xl mx-auto py-8">
        <MeetingCompletionSummary
          meetingTitle={meeting?.title ?? t('meetingReview.reuniónCompletada')}
          meetingSummary={meeting?.summary ?? undefined}
          keyPoints={(meeting?.key_points as string[] | undefined) ?? []}
          results={completedSummary.results}
          meetingDuration={meeting?.estimated_duration_min ?? undefined}
          transcriptionConfidence={meeting?.ai_confidence_score ?? undefined}
          alignmentData={alignment}
          onViewDetails={() => setTasksSheetOpen(true)}
          onClose={handleClose}
        />

        {/* Sheet: tasks created for this meeting */}
        <Sheet open={tasksSheetOpen} onOpenChange={setTasksSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Target size={16} />{t('meetingReview.tareasGeneradas')}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              {meetingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('meetingReview.noHayTareasRegistradas')}</p>
              ) : (
                meetingTasks.map(task => (
                  <div key={task.id} className="flex items-start justify-between gap-2 rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{task.titulo}</p>
                      {task.fecha_limite && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Límite: {new Date(task.fecha_limite).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                    <Badge className={
                      task.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }>
                      {task.status === 'done' ? 'Completada': task.status === 'in_progress' ? 'En progreso': t('meetingReview.pendiente')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  const approvedCount = localInsights.filter(i => i.review_status === 'approved').length;

  // ── Main 3-column layout ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleClose} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={15} />{t('meetingReview.volver')}</button>
          <span className="text-muted-foreground/50">·</span>
          <h1 className="text-sm font-semibold">{meeting?.title ?? t('meetingReview.revisiónDeInsights')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {approvedCount} de {localInsights.length} aprobados
          </span>
          <Button
            onClick={handleApply}
            disabled={isApplying || approvedCount === 0}
            className="gap-2"
          >
            {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Aplicar insights aprobados
          </Button>
          <Button variant="outline" size="sm" onClick={handleClose}>{t('meetingReview.revisarMásTarde')}</Button>
        </div>
      </div>

      {/* 3-column body */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* LEFT — Transcript */}
        <div className="hidden lg:flex flex-col w-[30%] border-r border-border overflow-y-auto p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 sticky top-0 bg-background pb-2">
            <FileText size={14} className="text-muted-foreground" />{t('meetingReview.transcripción')}</h3>
          {meeting?.transcript ? (
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {meeting.transcript}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">{t('meetingReview.transcripciónNoDisponible')}</p>
          )}
        </div>

        {/* CENTER — Insights by level */}
        <div className="flex-1 lg:w-[45%] overflow-y-auto p-4 space-y-6">
          {(['high', 'medium', 'low'] as const).map(level => {
            const group = byLevel[level];
            if (group.length === 0) return null;
            return (
              <div key={level} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`${LEVEL_BADGE[level]} text-xs`}>
                    Nivel {level === 'high' ? 3 : level === 'medium' ? 2 : 1} — {LEVEL_LABEL[level]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{group.length} insight{group.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {group.map(insight => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      classified={classifiedMap.get(insight.id)!}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {localInsights.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 size={24} className="animate-spin mb-3" />
              <p className="text-sm">{t('meetingReview.cargandoInsights')}</p>
            </div>
          )}
        </div>

        {/* RIGHT — Live summary */}
        <div className="hidden lg:block w-[25%] border-l border-border overflow-y-auto p-4">
          <LiveSummaryPanel insights={localInsights} />
        </div>
      </div>
    </div>
  );
}
