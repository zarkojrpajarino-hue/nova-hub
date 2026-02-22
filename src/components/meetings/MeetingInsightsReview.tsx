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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMeetingInsights, useMeeting, useApplyMeetingInsights } from '@/hooks/useMeetings';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  AlertCircle,
  Loader2,
  Target,
  Users,
  Briefcase,
  AlertTriangle,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MeetingInsightsReviewProps {
  meetingId: string;
  onApplyInsights: () => void;
  onCancel: () => void;
}

interface Insight {
  id: string;
  insight_type: string;
  content: any;
  review_status: string;
  created_at: string;
}

const INSIGHT_TYPES = {
  task: { label: 'Tareas', icon: Target, color: 'blue' },
  decision: { label: 'Decisiones', icon: CheckCircle2, color: 'green' },
  lead: { label: 'Leads', icon: Briefcase, color: 'purple' },
  obv_update: { label: 'OBVs Mencionados', icon: Target, color: 'orange' },
  blocker: { label: 'Blockers', icon: AlertTriangle, color: 'red' },
  metric: { label: 'Métricas', icon: BarChart3, color: 'indigo' },
};

export function MeetingInsightsReview({
  meetingId,
  onApplyInsights,
  onCancel,
}: MeetingInsightsReviewProps) {
  // State
  const [localInsights, setLocalInsights] = useState<Insight[]>([]);
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
  const [editedContent, setEditedContent] = useState<any>({});
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['task', 'decision']));
  const [isApplying, setIsApplying] = useState(false);

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

      toast.success('Insight aprobado');
    } catch (error) {
      console.error('Error approving insight:', error);
      toast.error('Error al aprobar');
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

      toast.success('Insight rechazado');
    } catch (error) {
      console.error('Error rejecting insight:', error);
      toast.error('Error al rechazar');
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

      toast.success('Insight actualizado');
      setEditingInsight(null);
    } catch (error) {
      console.error('Error updating insight:', error);
      toast.error('Error al actualizar');
    }
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
   * Aplicar insights aprobados
   */
  const handleApplyApproved = async () => {
    const approvedCount = localInsights.filter(i => i.review_status === 'approved').length;

    if (approvedCount === 0) {
      toast.error('No hay insights aprobados para aplicar');
      return;
    }

    setIsApplying(true);
    try {
      await applyInsights.mutateAsync(meetingId);
      // Después de aplicar con éxito, notificar al padre
      onApplyInsights();
    } catch (error) {
      console.error('Error applying insights:', error);
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

  // Calcular stats
  const stats = {
    total: localInsights.length,
    approved: localInsights.filter(i => i.review_status === 'approved').length,
    rejected: localInsights.filter(i => i.review_status === 'rejected').length,
    pending: localInsights.filter(i => i.review_status === 'pending_review').length,
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
        <p className="text-gray-600">No hay insights para revisar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{meeting?.title}</h2>
        <p className="text-gray-600 mt-1">
          Revisa y aprueba los insights extraídos por GPT-4
        </p>
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
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Aprobados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rechazados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Revisa cada insight antes de aplicarlo al sistema. Los insights aprobados se convertirán en tareas, leads, decisiones, etc. reales en tu proyecto.
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
                    <CardTitle>{config.label}</CardTitle>
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
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onEdit={handleEdit}
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
        <Button onClick={onCancel} variant="outline">
          Cancelar
        </Button>
        <Button
          onClick={handleApplyApproved}
          disabled={stats.approved === 0 || isApplying}
          className="gap-2"
        >
          {isApplying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Aplicando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Aplicar {stats.approved} Insight{stats.approved !== 1 ? 's' : ''}
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
  );
}

/**
 * Card individual de insight
 */
interface InsightCardProps {
  insight: Insight;
  type: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (insight: Insight) => void;
}

function InsightCard({ insight, type, onApprove, onReject, onEdit }: InsightCardProps) {
  const { content, review_status } = insight;

  const getBgColor = () => {
    if (review_status === 'approved') return 'bg-green-50 border-green-200';
    if (review_status === 'rejected') return 'bg-red-50 border-red-200';
    return 'bg-white';
  };

  return (
    <div className={`border rounded-lg p-4 ${getBgColor()}`}>
      {/* Título */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold">{content.title || content.name || 'Sin título'}</h4>
        <div className="flex gap-2">
          {review_status === 'pending_review' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(insight)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onApprove(insight.id)}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
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
          {review_status === 'approved' && (
            <Badge className="bg-green-100 text-green-700">Aprobado</Badge>
          )}
          {review_status === 'rejected' && (
            <Badge className="bg-red-100 text-red-700">Rechazado</Badge>
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
    </div>
  );
}

/**
 * Modal de edición
 */
interface EditInsightModalProps {
  insight: Insight;
  editedContent: any;
  setEditedContent: (content: any) => void;
  onSave: () => void;
  onClose: () => void;
}

function EditInsightModal({
  insight,
  editedContent,
  setEditedContent,
  onSave,
  onClose,
}: EditInsightModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Insight</DialogTitle>
          <DialogDescription>
            Modifica los campos que necesites antes de aprobar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <Label>Título</Label>
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
              <Label>Descripción</Label>
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
              <Label>Asignado a</Label>
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
              <Label>Prioridad</Label>
              <select
                value={editedContent.priority || 'media'}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, priority: e.target.value })
                }
                className="w-full border rounded-md p-2"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
