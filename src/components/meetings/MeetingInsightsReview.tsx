/**
 * 🔍 MEETING INSIGHTS REVIEW
 *
 * Componente para revisar y aprobar insights extraídos por GPT-4
 * El usuario puede:
 * - Ver todos los insights agrupados por tipo
 * - Aprobar o rechazar cada insight
 * - Editar insights antes de aprobar
 * - Aplicar todos los insights aprobados al sistema
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMeetingInsights, useMeeting, useApplyMeetingInsights } from '@/hooks/useMeetings';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  AlertCircle,
  Loader2,
  Target,
  Briefcase,
  AlertTriangle,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  Quote,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { classifyInsightImpact, type MeetingInsightRow, type MeetingInsightWithImpact } from '@/lib/meeting-agent';
import { runMeetingAgent } from '@/services/meetingAgentService';

import { useTranslation } from 'react-i18next';
export interface ApplyResults {
  tasks:              number;
  decisions:          number;
  leads:              number;
  obv_updates:        number;
  blockers:           number;
  metrics:            number;
  insights_degraded?: number;
  engine_writes_blocked?: number;
}

interface MeetingInsightsReviewProps {
  meetingId: string;
  projectId?: string;
  onApplyInsights: (results: ApplyResults) => void;
  onCancel: () => void;
}

interface Insight {
  id: string;
  insight_type: string;
  content: Record<string, unknown>;
  review_status: string;
  created_at: string;
}

const INSIGHT_TYPES = {
  task: { labelKey: 'meetings.tareas', icon: Target, color: 'blue' },
  decision: { labelKey: 'meetings.decisiones', icon: CheckCircle2, color: 'green' },
  lead: { labelKey: 'meetings.leads', icon: Briefcase, color: 'purple' },
  obv_update: { labelKey: 'meetings.obvsMencionados', icon: Target, color: 'orange' },
  blocker: { labelKey: 'meetings.blockers', icon: AlertTriangle, color: 'red' },
  metric: { labelKey: 'meetings.métricas', icon: BarChart3, color: 'indigo' },
};

export function MeetingInsightsReview({
  meetingId,
  projectId,
  onApplyInsights,
  onCancel,
}: MeetingInsightsReviewProps) {
  const { t } = useTranslation();
  // State
  const [localInsights, setLocalInsights] = useState<Insight[]>([]);
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, unknown>>({});
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['decision', 'blocker']));
  const [isApplying, setIsApplying] = useState(false);
  // Medium insights: preseleccionados por defecto, el usuario puede des-seleccionar antes de aplicar
  const [excludedMedium, setExcludedMedium] = useState<Set<string>>(new Set());

  // Hooks
  const { data: insights, isLoading } = useMeetingInsights(meetingId);
  const { data: meeting } = useMeeting(meetingId);
  const applyInsights = useApplyMeetingInsights();

  // Inicializar insights locales
  useState(() => {
    if (insights && localInsights.length === 0) {
      setLocalInsights(insights as Insight[]);
    }
  });

  // Sincronizar cuando cambien los insights
  if (insights && localInsights.length === 0) {
    setLocalInsights(insights as Insight[]);
  }

  // Clasificar todos los insights por nivel de impacto (Bloque X gate)
  const transcriptionConfidence = meeting?.ai_confidence_score ?? 0.6;
  const classifiedMap = new Map<string, MeetingInsightWithImpact>(
    localInsights.map(i => [
      i.id,
      classifyInsightImpact(
        i as unknown as MeetingInsightRow,
        transcriptionConfidence,
      ),
    ])
  );

  /**
   * Aprobar insight
   */
  const handleApprove = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('meeting_insights')
        .update({ review_status: 'approved' })
        .eq('id', insightId);

      if (error) throw error;

      setLocalInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, review_status: 'approved' } : i)
      );

      toast.success(t('meetings.insightAprobado'));
    } catch (_error) {
      toast.error(t('meetings.errorAlAprobar'));
    }
  };

  /**
   * Rechazar insight
   */
  const handleReject = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('meeting_insights')
        .update({ review_status: 'rejected' })
        .eq('id', insightId);

      if (error) throw error;

      setLocalInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, review_status: 'rejected' } : i)
      );

      toast.success(t('meetings.insightRechazado'));
    } catch (_error) {
      toast.error(t('meetings.errorAlRechazar'));
    }
  };

  /**
   * Abrir modal de edición
   */
  const handleEdit = (insight: Insight) => {
    setEditingInsight(insight);
    setEditedContent({ ...insight.content });
  };

  /**
   * Guardar edición
   */
  const handleSaveEdit = async () => {
    if (!editingInsight) return;

    try {
      const { error } = await supabase
        .from('meeting_insights')
        .update({ content: editedContent })
        .eq('id', editingInsight.id);

      if (error) throw error;

      setLocalInsights(prev =>
        prev.map(i => i.id === editingInsight.id ? { ...i, content: editedContent } : i)
      );

      toast.success(t('meetings.insightActualizado'));
      setEditingInsight(null);
    } catch (_error) {
      toast.error(t('meetings.errorAlActualizar'));
    }
  };

  /**
   * Toggle preselección de medium insight
   */
  const toggleMediumExclusion = (id: string) => {
    setExcludedMedium(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /**
   * Toggle expansion de tipo
   */
  const toggleType = (type: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  /**
   * Aplicar insights aprobados.
   * Medium insights preseleccionados se confirman al pulsar t('meetings.aplicar')
   * (solo los que el usuario no ha des-seleccionado explícitamente).
   */
  const handleApplyApproved = async () => {
    // Confirmar medium pending que el usuario NO ha excluido
    const pendingMedium = localInsights.filter(i => {
      const c = classifiedMap.get(i.id);
      return (
        i.review_status === 'pending_review' &&
        c?.impact_level === 'medium' &&
        !excludedMedium.has(i.id)
      );
    });

    if (pendingMedium.length > 0) {
      const ids = pendingMedium.map(i => i.id);
      await supabase
        .from('meeting_insights')
        .update({ review_status: 'approved' })
        .in('id', ids);

      setLocalInsights(prev =>
        prev.map(i => ids.includes(i.id) ? { ...i, review_status: 'approved' } : i)
      );
    }

    // Verificar que hay algo aprobado
    const approvedNow = localInsights.filter(i =>
      i.review_status === 'approved' ||
      pendingMedium.some(m => m.id === i.id)
    ).length;

    if (approvedNow === 0) {
      toast.error(t('meetings.noHayInsightsAprobados'));
      return;
    }

    setIsApplying(true);
    try {
      const result = await applyInsights.mutateAsync(meetingId);
      // M18.A — Meeting Agent: fire-and-forget (si hay projectId disponible)
      if (projectId) {
        void runMeetingAgent(projectId, meetingId)
          .catch(_e => { /* Meeting Agent failed — non-fatal */ });
      }
      onApplyInsights(result?.results ?? { tasks: 0, decisions: 0, leads: 0, obv_updates: 0, blockers: 0, metrics: 0 });
    } catch (_error) {
      // El error ya se muestra por el hook
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * Agrupar insights por tipo
   */
  const groupedInsights = localInsights.reduce((acc, insight) => {
    if (!acc[insight.insight_type]) {
      acc[insight.insight_type] = [];
    }
    acc[insight.insight_type].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  // Calcular stats por nivel de impacto
  const impactStats = {
    high:   localInsights.filter(i => classifiedMap.get(i.id)?.impact_level === 'high').length,
    medium: localInsights.filter(i => classifiedMap.get(i.id)?.impact_level === 'medium').length,
    low:    localInsights.filter(i => classifiedMap.get(i.id)?.impact_level === 'low').length,
  };

  // Cuántos high siguen pendientes de confirmación
  const pendingHighCount = localInsights.filter(
    i => classifiedMap.get(i.id)?.impact_level === 'high' && i.review_status === 'pending_review'
  ).length;

  // Calcular stats de estado (para el Apply button)
  const stats = {
    total:    localInsights.length,
    approved: localInsights.filter(i => i.review_status === 'approved').length,
    rejected: localInsights.filter(i => i.review_status === 'rejected').length,
    pending:  localInsights.filter(i => i.review_status === 'pending_review').length,
    // Medium pending preseleccionados (no excluidos) + ya aprobados
    applicable: localInsights.filter(i => {
      if (i.review_status === 'rejected') return false;
      if (i.review_status === 'approved') return true;
      const level = classifiedMap.get(i.id)?.impact_level;
      return level === 'medium' && !excludedMedium.has(i.id);
    }).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (localInsights.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">{t('meetings.noHayInsightsPara')}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Sticky indicator — Level 3 pendientes */}
      {pendingHighCount > 0 && (
        <div className="sticky top-2 z-10 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 shadow dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {pendingHighCount} decision{pendingHighCount !== 1 ? 'es' : ''} estrategica{pendingHighCount !== 1 ? 's' : ''} pendiente{pendingHighCount !== 1 ? 's' : ''} de confirmacion
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{meeting?.title}</h2>
        <p className="text-gray-600 mt-1">
          {impactStats.high > 0 && (
            <span className="text-red-600 font-medium">{impactStats.high} estratégico{impactStats.high !== 1 ? 's' : ''} requieren tu confirmación</span>
          )}
          {impactStats.high > 0 && impactStats.medium > 0 && ' · '}
          {impactStats.medium > 0 && (
            <span className="text-amber-600">{impactStats.medium} operativo{impactStats.medium !== 1 ? 's' : ''}</span>
          )}
          {(impactStats.high > 0 || impactStats.medium > 0) && impactStats.low > 0 && ' · '}
          {impactStats.low > 0 && (
            <span className="text-gray-500">{impactStats.low} informativo{impactStats.low !== 1 ? 's' : ''}</span>
          )}
          {impactStats.high === 0 && impactStats.medium === 0 && impactStats.low === 0 && (
            t('meetings.revisaYApruebaLos')
          )}
        </p>
      </div>

      {/* Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('meetings.losInsights')}<strong>estratégicos</strong> requieren confirmación explícita. Los <strong>operativos</strong> están preseleccionados — des-selecciona los que no correspondan antes de pulsar t('meetings.aplicar'). Los <strong>informativos</strong> quedan registrados pero no generan acciones.
        </AlertDescription>
      </Alert>

      {/* Insights por tipo */}
      <div className="space-y-4">
        {Object.entries(groupedInsights).map(([type, typeInsights]) => {
          const config = INSIGHT_TYPES[type as keyof typeof INSIGHT_TYPES] || {
            label: type,
            icon: FileText,
            color: 'gray',
          };
          const Icon = config.icon;
          const isExpanded = expandedTypes.has(type);

          return (
            <Card key={type}>
              <CardHeader className="cursor-pointer" onClick={() => toggleType(type)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 text-${config.color}-600`} />
                    <CardTitle>{t(config.labelKey)}</CardTitle>
                    <Badge variant="secondary">{typeInsights.length}</Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-3">
                  {typeInsights.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      type={type}
                      classified={classifiedMap.get(insight.id)}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onEdit={handleEdit}
                      isPreselected={!excludedMedium.has(insight.id)}
                      onTogglePreselect={toggleMediumExclusion}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button onClick={onCancel} variant="outline">{t('meetings.cancelar')}</Button>
        <Button
          onClick={handleApplyApproved}
          disabled={stats.applicable === 0 || isApplying}
          className="gap-2"
        >
          {isApplying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />{t('meetings.aplicando')}</>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Aplicar {stats.applicable} insight{stats.applicable !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>

      {/* Edit Modal */}
      {editingInsight && (
        <EditInsightModal
          insight={editingInsight}
          editedContent={editedContent}
          setEditedContent={setEditedContent}
          onSave={handleSaveEdit}
          onClose={() => setEditingInsight(null)}
        />
      )}
    </div>
    </TooltipProvider>
  );
}

/**
 * Card individual de insight
 */
interface InsightCardProps {
  insight: Insight;
  type: string;
  classified?: MeetingInsightWithImpact;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (insight: Insight) => void;
  // Medium preselección
  isPreselected?: boolean;
  onTogglePreselect?: (id: string) => void;
}

function InsightCard({ insight, type, classified, onApprove, onReject, onEdit, isPreselected = true, onTogglePreselect }: InsightCardProps) {
  const [showContext, setShowContext] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const { content, review_status } = insight;
  const impactLevel = classified?.impact_level ?? 'medium';

  const getBgColor = () => {
    if (review_status === 'approved') return 'bg-green-50 border-green-200';
    if (review_status === 'rejected') return 'bg-red-50 border-red-200';
    if (impactLevel === 'high') return 'bg-red-50/30 border-red-200';
    if (impactLevel === 'medium' && !isPreselected) return 'bg-gray-50 border-gray-200 opacity-60';
    if (impactLevel === 'medium') return 'bg-amber-50/40 border-amber-200';
    if (impactLevel === 'low') return 'bg-gray-50 border-gray-200';
    return 'bg-white';
  };

  // Level 1 (low): collapsed by default, no action buttons
  if (impactLevel === 'low' && !showContext) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="secondary" className="shrink-0 text-xs text-gray-500">{t('meetings.informativo')}</Badge>
          <span className="text-sm text-gray-600 truncate">{content.title || content.name || t('meetings.sinTítulo')}</span>
        </div>
        <Button size="sm" variant="ghost" className="shrink-0 h-7 px-2 text-xs" onClick={() => setShowContext(true)}>{t('meetings.verContexto')}</Button>
      </div>
    );
  }

  // Impact badge
  const ImpactBadge = () => {
    if (impactLevel === 'high' && !classified?.auto_degraded) {
      return <Badge className="shrink-0 bg-red-100 text-red-700 border-red-200">{t('meetings.estratégicoRequiereAprobación')}</Badge>;
    }
    if (classified?.auto_degraded) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="shrink-0 bg-amber-100 text-amber-700 border-amber-200 cursor-help gap-1">{t('meetings.estratégicoDegradadoAOperativo')}<Info className="h-3 w-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{classified.degradation_reason}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    if (impactLevel === 'medium') {
      return isPreselected
        ? <Badge className="shrink-0 bg-amber-50 text-amber-700 border-amber-200">{t('meetings.operativoPreseleccionado')}</Badge>
        : <Badge className="shrink-0 bg-gray-100 text-gray-500 border-gray-200">{t('meetings.operativoExcluido')}</Badge>;
    }
    return <Badge variant="secondary" className="shrink-0 text-xs text-gray-500">{t('meetings.informativo')}</Badge>;
  };

  return (
    <div className={`border rounded-lg p-4 ${getBgColor()}`}>
      {/* Impact badge + status */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <ImpactBadge />
        {review_status === 'approved' && (
          <Badge className="bg-green-100 text-green-700">{t('meetings.confirmado')}</Badge>
        )}
        {review_status === 'rejected' && (
          <Badge className="bg-red-100 text-red-700">{t('meetings.rechazado')}</Badge>
        )}
        {impactLevel === 'low' && showContext && (
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs ml-auto" onClick={() => setShowContext(false)}>{t('meetings.ocultar')}</Button>
        )}
      </div>

      {/* Título + acciones */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold">{content.title || content.name || t('meetings.sinTítulo')}</h4>
        <div className="flex gap-2 shrink-0 ml-2">
          {review_status === 'pending_review' && impactLevel !== 'low' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(insight)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              {/* High: explicit t('meetings.confirmar') button; medium: toggle preselección + Rechazar */}
              {impactLevel === 'high' && !classified?.auto_degraded ? (
                <Button
                  size="sm"
                  onClick={() => onApprove(insight.id)}
                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white text-xs"
                >{t('meetings.confirmarDecisiónEstratégica')}</Button>
              ) : impactLevel === 'medium' && onTogglePreselect ? (
                <Button
                  size="sm"
                  variant={isPreselected ? 'outline' : 'ghost'}
                  onClick={() => onTogglePreselect(insight.id)}
                  className={`h-8 px-2 text-xs ${isPreselected ? 'border-amber-300 text-amber-700' : 'text-gray-400'}`}
                >
                  {isPreselected ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onReject(insight.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {review_status === 'approved' && impactLevel === 'high' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReject(insight.id)}
              className="h-7 px-2 text-xs text-gray-500"
            >{t('meetings.revertir')}</Button>
          )}
        </div>
      </div>

      {/* Contenido según tipo */}
      <div className="text-sm text-gray-700 space-y-1">
        {type === 'task' && (
          <>
            <p>{content.description}</p>
            {content.assigned_to_name && (
              <p className="text-xs">
                <strong>Asignado a:</strong> {content.assigned_to_name}
              </p>
            )}
            {content.priority && (
              <Badge variant="outline" className="text-xs">
                {content.priority}
              </Badge>
            )}
          </>
        )}

        {type === 'decision' && (
          <>
            <p>{content.description}</p>
            {content.rationale && (
              <p className="text-xs italic">Razón: {content.rationale}</p>
            )}
          </>
        )}

        {type === 'lead' && (
          <>
            <p>{content.opportunity}</p>
            {content.contact_name && (
              <p className="text-xs">
                <strong>Contacto:</strong> {content.contact_name}
                {content.contact_email && ` (${content.contact_email})`}
              </p>
            )}
            {content.estimated_value && (
              <p className="text-xs">
                <strong>Valor:</strong> €{content.estimated_value.toLocaleString()}
              </p>
            )}
          </>
        )}

        {type === 'obv_update' && (
          <>
            <p>{content.description}</p>
            {content.obv_title && (
              <p className="text-xs">
                <strong>OBV:</strong> {content.obv_title}
              </p>
            )}
          </>
        )}

        {type === 'blocker' && (
          <>
            <p>{content.description}</p>
            {content.severity && (
              <Badge variant="destructive" className="text-xs">
                {content.severity}
              </Badge>
            )}
          </>
        )}

        {type === 'metric' && (
          <>
            <p>
              <strong>{content.name}:</strong> {content.value} {content.unit}
            </p>
            {content.trend && (
              <Badge variant="outline" className="text-xs">
                {content.trend}
              </Badge>
            )}
          </>
        )}

        {/* Contexto */}
        {content.context && (
          <p className="text-xs text-gray-500 italic mt-2 pt-2 border-t">
            "{content.context}"
          </p>
        )}
      </div>

      {/* Reliability bar — M18.X.6 */}
      {classified && (
        <ReliabilityBar classified={classified} />
      )}

      {/* Ver fuentes — M18.28: transcript_fragment / transcript_timestamp */}
      {(content.transcript_fragment || content.transcript_timestamp) && (
        <div className="mt-2">
          <button
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowSources(v => !v)}
          >
            <Quote className="h-3 w-3" />
            Ver fuente en transcripción
            {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showSources && (
            <div className="mt-1.5 rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600">
              {content.transcript_timestamp && (
                <span className="inline-block mb-1 font-mono text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                  {content.transcript_timestamp as string}
                </span>
              )}
              {content.transcript_fragment && (
                <p className="italic text-gray-500">"{content.transcript_fragment as string}"</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Barra de fiabilidad combinada para un insight. */
function ReliabilityBar({ classified }: { classified: MeetingInsightWithImpact }) {
  const pct = Math.round(classified.combined_reliability * 100);
  const barColor =
    pct >= 70 ? 'bg-green-500' :
    pct >= 45 ? 'bg-amber-400' :
    'bg-red-400';
  const certaintyLabel: Record<string, string> = {
    definitive: t('meetings.definitivo'),
    conditional: t('meetings.condicional'),
    speculative: t('meetings.especulativo'),
  };

  return (
    <div className="mt-3 pt-2 border-t border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{t('meetings.fiabilidad')}</span>
        <span className={`text-xs font-medium ${pct >= 70 ? 'text-green-600' : pct >= 45 ? 'text-amber-600' : 'text-red-600'}`}>
          {pct}%{classified.auto_degraded ? ' · Degradado' : ''}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-gray-400 mt-1">
        Claridad {Math.round(classified.clarity_score * 100)}% · Certeza: {certaintyLabel[classified.speaker_certainty] ?? classified.speaker_certainty}
      </p>
    </div>
  );
}

/**
 * Modal de edición
 */
interface EditInsightModalProps {
  insight: Insight;
  editedContent: Record<string, unknown>;
  setEditedContent: (content: Record<string, unknown>) => void;
  onSave: () => void;
  onClose: () => void;
}

function EditInsightModal({
  insight: _insight,
  editedContent,
  setEditedContent,
  onSave,
  onClose,
}: EditInsightModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('meetings.editarInsight')}</DialogTitle>
          <DialogDescription>{t('meetings.modificaLosCamposQue')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <Label>{t('meetings.título')}</Label>
            <Input
              value={editedContent.title || editedContent.name || ''}
              onChange={(e) =>
                setEditedContent({
                  ...editedContent,
                  ...(editedContent.title !== undefined
                    ? { title: e.target.value }
                    : { name: e.target.value }),
                })
              }
            />
          </div>

          {/* Descripción */}
          {editedContent.description !== undefined && (
            <div>
              <Label>{t('meetings.descripción')}</Label>
              <Textarea
                value={editedContent.description || ''}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, description: e.target.value })
                }
                rows={3}
              />
            </div>
          )}

          {/* Otros campos según tipo */}
          {editedContent.assigned_to_name && (
            <div>
              <Label>{t('meetings.asignadoA')}</Label>
              <Input
                value={editedContent.assigned_to_name || ''}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, assigned_to_name: e.target.value })
                }
              />
            </div>
          )}

          {editedContent.priority && (
            <div>
              <Label>{t('meetings.prioridad')}</Label>
              <select
                value={editedContent.priority || 'media'}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, priority: e.target.value })
                }
                className="w-full border rounded-md p-2"
              >
                <option value="baja">{t('meetings.baja')}</option>
                <option value="media">{t('meetings.media')}</option>
                <option value="alta">{t('meetings.alta')}</option>
              </select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('meetings.cancelar')}</Button>
          <Button onClick={onSave}>{t('meetings.guardarCambios')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
