import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, CheckCircle2, Clock, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
interface ProcessArtifactEditorProps {
  projectId: string;
}

const FUNCTION_TYPES = [
  { value: 'demand',   label: t('engineInputs.demanda'),  color: '#F59E0B', description: t('engineInputs.generaciónDeLeadsVentas') },
  { value: 'delivery', label: t('engineInputs.delivery'), color: '#3B82F6', description: t('engineInputs.productoDesarrolloEntregaAl') },
  { value: 'cash',     label: t('engineInputs.cash'),     color: '#22C55E', description: t('engineInputs.facturaciónCobrosGestiónFinanciera') },
] as const;

type FunctionType = typeof FUNCTION_TYPES[number]['value'];

interface ProcessArtifact {
  id: string;
  function_type: string;
  title: string;
  checklist_items_count: number;
  last_used_at: string | null;
  link_or_doc_id: string | null;
  created_at: string;
}

interface NewArtifactForm {
  title: string;
  checklistCount: string;
  linkOrDocId: string;
}

const EMPTY_FORM: NewArtifactForm = { title: '', checklistCount: '0', linkOrDocId: '' };
const CHECKLIST_THRESHOLD = 5;

function isUsedRecently(lastUsedAt: string | null): boolean {
  if (!lastUsedAt) return false;
  const daysSince = (Date.now() - new Date(lastUsedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= 60;
}

export function ProcessArtifactEditor({ projectId }: ProcessArtifactEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [addingFor, setAddingFor] = useState<FunctionType | null>(null);
  const [newForm, setNewForm] = useState<NewArtifactForm>(EMPTY_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: artifacts = [], isLoading } = useQuery({
    queryKey: ['process_artifacts', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_artifacts')
        .select('*')
        .eq('project_id', projectId)
        .order('function_type')
        .order('created_at');
      if (error) throw error;
      return data as ProcessArtifact[];
    },
  });

  const handleCreate = async (ft: FunctionType) => {
    if (!newForm.title.trim()) {
      toast.error(t('engineInputs.elTítuloEsObligatorio'));
      return;
    }
    setIsCreating(true);
    try {
      const { error } = await supabase.from('process_artifacts').insert({
        project_id: projectId,
        function_type: ft,
        title: newForm.title.trim(),
        checklist_items_count: parseInt(newForm.checklistCount || '0', 10),
        link_or_doc_id: newForm.linkOrDocId.trim() || null,
      });
      if (error) throw error;
      toast.success(t('engineInputs.procesoCreado'));
      setAddingFor(null);
      setNewForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['process_artifacts', projectId] });
    } catch {
      toast.error(t('engineInputs.errorAlCrearEl'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleMarkUsed = async (id: string) => {
    setMarkingId(id);
    try {
      const { error } = await supabase
        .from('process_artifacts')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success(t('engineInputs.marcadoComoUsadoHoy'));
      queryClient.invalidateQueries({ queryKey: ['process_artifacts', projectId] });
    } catch {
      toast.error(t('engineInputs.errorAlMarcarEl'));
    } finally {
      setMarkingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('process_artifacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success(t('engineInputs.procesoEliminado'));
      queryClient.invalidateQueries({ queryKey: ['process_artifacts', projectId] });
    } catch {
      toast.error(t('engineInputs.errorAlEliminarEl'));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('engineInputs.procesosDocumentados')}</CardTitle>
        <CardDescription>
          Un proceso activo por función = documented_process_exists. Requiere ≥{CHECKLIST_THRESHOLD} ítems de checklist y marcado de uso en ≤60 días.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {FUNCTION_TYPES.map((ft) => {
          const ftArtifacts = artifacts.filter((a) => a.function_type === ft.value);
          const hasActiveProcess = ftArtifacts.some(
            (a) => a.checklist_items_count >= CHECKLIST_THRESHOLD && isUsedRecently(a.last_used_at)
          );

          return (
            <div key={ft.value} className="space-y-3">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ft.color }} />
                  <span className="font-medium text-sm">{ft.label}</span>
                  <span className="text-xs text-muted-foreground">— {ft.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveProcess ? (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-600 text-xs">
                      <CheckCircle2 className="w-3 h-3" />{t('engineInputs.procesoActivo')}</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600 text-xs">
                      <AlertCircle className="w-3 h-3" />{t('engineInputs.sinProcesoActivo')}</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setAddingFor(ft.value as FunctionType);
                      setNewForm(EMPTY_FORM);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />{t('engineInputs.añadir')}</Button>
                </div>
              </div>

              {/* Artifact list */}
              {ftArtifacts.length > 0 && (
                <div className="space-y-2 pl-5">
                  {ftArtifacts.map((artifact) => {
                    const usedRecently = isUsedRecently(artifact.last_used_at);
                    const meetsChecklist = artifact.checklist_items_count >= CHECKLIST_THRESHOLD;

                    return (
                      <div
                        key={artifact.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{artifact.title}</p>
                            {artifact.link_or_doc_id && (
                              <a
                                href={artifact.link_or_doc_id.startsWith('http') ? artifact.link_or_doc_id : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={cn(
                              'text-xs',
                              meetsChecklist ? 'text-green-600' : 'text-amber-600'
                            )}>
                              {artifact.checklist_items_count} ítems {!meetsChecklist && `(necesita ${CHECKLIST_THRESHOLD})`}
                            </span>
                            <span className={cn(
                              'flex items-center gap-1 text-xs',
                              usedRecently ? 'text-green-600' : 'text-muted-foreground'
                            )}>
                              <Clock className="w-3 h-3" />
                              {artifact.last_used_at
                                ? `Usado ${new Date(artifact.last_used_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                                : t('engineInputs.nuncaUsado')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={markingId === artifact.id}
                            onClick={() => handleMarkUsed(artifact.id)}
                          >
                            {markingId === artifact.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            )}
                            Usado hoy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            disabled={deletingId === artifact.id}
                            onClick={() => handleDelete(artifact.id)}
                          >
                            {deletingId === artifact.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inline create form */}
              {addingFor === ft.value && (
                <div className="pl-5 p-3 rounded-lg border bg-muted/30 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Nuevo proceso — {ft.label}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Nombre del proceso *</Label>
                      <Input
                        value={newForm.title}
                        onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                        placeholder={t('engineInputs.ejPipelineDeLeads')}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('engineInputs.ítemsDeChecklist')}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={newForm.checklistCount}
                        onChange={(e) => setNewForm({ ...newForm, checklistCount: e.target.value })}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Link / Doc ID (opcional)</Label>
                      <Input
                        value={newForm.linkOrDocId}
                        onChange={(e) => setNewForm({ ...newForm, linkOrDocId: e.target.value })}
                        placeholder={t('engineInputs.https')}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => { setAddingFor(null); setNewForm(EMPTY_FORM); }}
                    >{t('engineInputs.cancelar')}</Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={isCreating || !newForm.title.trim()}
                      onClick={() => handleCreate(ft.value as FunctionType)}
                    >
                      {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : t('engineInputs.crear')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
