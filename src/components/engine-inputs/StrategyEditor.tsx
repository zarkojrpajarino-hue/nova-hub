import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, GitBranch, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCloseCycleForPivot } from '@/hooks/useNovaDataOptimized';

import { useTranslation } from 'react-i18next';
interface StrategyEditorProps {
  projectId: string;
}

const MIN_CHARS = 10;

function fieldStatus(value: string) {
  if (!value.trim()) return 'empty';
  if (value.trim().length < MIN_CHARS) return 'short';
  return 'ok';
}

export function StrategyEditor({ projectId }: StrategyEditorProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [showPivotPrompt, setShowPivotPrompt] = useState(false);
  const { mutate: closeForPivot, isPending: isArchivingCycle } = useCloseCycleForPivot();

  const [form, setForm] = useState({
    segment: '',
    problem: '',
    valueProp: '',
  });
  const [initialized, setInitialized] = useState(false);

  // Fetch current strategy
  const { data: current, isLoading } = useQuery({
    queryKey: ['strategy', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_strategy_current')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch version count (pivot counter)
  const { data: versionCount } = useQuery({
    queryKey: ['strategy_versions_count', projectId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('strategic_model_versions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Populate form once data loads (useEffect avoids setState-during-render)
  useEffect(() => {
    if (current && !initialized) {
      setForm({
        segment: current.segment_text ?? '',
        problem: current.problem_text ?? '',
        valueProp: current.value_prop_text ?? '',
      });
      setInitialized(true);
    }
  }, [current, initialized]);

  const handleSave = async () => {
    const s = form.segment.trim();
    const p = form.problem.trim();
    const v = form.valueProp.trim();

    if (!s || !p || !v) {
      toast.error(t('engineInputs.losTresCamposSon'));
      return;
    }
    if (s.length < MIN_CHARS || p.length < MIN_CHARS || v.length < MIN_CHARS) {
      toast.error(`Cada campo necesita al menos ${MIN_CHARS} caracteres para contar en el motor de datos`);
      return;
    }

    setIsSaving(true);
    try {
      const nextVersion = (current?.version_number ?? 0) + 1;

      // Compute changed fields
      const changedFields: Record<string, { old: string | null; new: string }> = {};
      if ((current?.segment_text ?? '') !== s) changedFields.segment_text = { old: current?.segment_text ?? null, new: s };
      if ((current?.problem_text ?? '') !== p) changedFields.problem_text = { old: current?.problem_text ?? null, new: p };
      if ((current?.value_prop_text ?? '') !== v) changedFields.value_prop_text = { old: current?.value_prop_text ?? null, new: v };

      if (Object.keys(changedFields).length === 0) {
        toast.info(t('engineInputs.sinCambiosParaGuardar'));
        setIsSaving(false);
        return;
      }

      // 1. UPSERT project_strategy_current
      const { error: upsertError } = await supabase
        .from('project_strategy_current')
        .upsert({
          project_id: projectId,
          segment_text: s,
          problem_text: p,
          value_prop_text: v,
          version_number: nextVersion,
          last_updated_at: new Date().toISOString(),
          updated_by: profile?.id ?? null,
        }, { onConflict: 'project_id' });

      if (upsertError) throw upsertError;

      // 2. INSERT version snapshot
      const { error: versionError } = await supabase
        .from('strategic_model_versions')
        .insert({
          project_id: projectId,
          version_number: nextVersion,
          segment_text: s,
          problem_text: p,
          value_prop_text: v,
          created_by: profile?.id ?? null,
          changed_fields: changedFields,
        });

      if (versionError) throw versionError;

      toast.success(t('engineInputs.estrategiaGuardada'));
      queryClient.invalidateQueries({ queryKey: ['strategy', projectId] });
      queryClient.invalidateQueries({ queryKey: ['strategy_versions_count', projectId] });

      // EC13.4: Detectar pivot total — los 3 pilares cambian desde una hipótesis completa
      const wasFullHypothesis =
        (current?.segment_text?.trim().length ?? 0) >= MIN_CHARS &&
        (current?.problem_text?.trim().length ?? 0) >= MIN_CHARS &&
        (current?.value_prop_text?.trim().length ?? 0) >= MIN_CHARS;
      if (Object.keys(changedFields).length === 3 && wasFullHypothesis) {
        setShowPivotPrompt(true);
      }
    } catch {
      toast.error(t('engineInputs.errorAlGuardarLa'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveCycle = () => {
    closeForPivot(projectId, {
      onSuccess: () => {
        toast.success(t('engineInputs.cicloCerradoElSiguiente'));
        setShowPivotPrompt(false);
      },
      onError: () => {
        toast.error(t('engineInputs.errorAlCerrarEl'));
      },
    });
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

  const fields = [
    {
      key: 'segment' as const,
      label: t('engineInputs.segmentoObjetivo'),
      placeholder: t('engineInputs.ejFundadoresDeStartups'),
      description: 'El cliente específico al que te diriges (quién, dónde, qué características)',
    },
    {
      key: 'problem' as const,
      label: t('engineInputs.problemaQueResuelves'),
      placeholder: t('engineInputs.ejLosFundadoresPierden'),
      description: t('engineInputs.elDolorConcretoY'),
    },
    {
      key: 'valueProp' as const,
      label: t('engineInputs.propuestaDeValor'),
      placeholder: t('engineInputs.ejMetodologíaHerramientasPara'),
      description: t('engineInputs.cómoResuelvesElProblema'),
    },
  ];

  const allOk = fields.every((f) => fieldStatus(form[f.key]) === 'ok');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{t('engineInputs.modeloEstratégicoActual')}</CardTitle>
            <CardDescription>{t('engineInputs.segmentoProblemaYPropuesta')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {typeof versionCount === 'number' && versionCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <GitBranch className="w-3 h-3" />
                v{current?.version_number ?? versionCount} · {versionCount} {versionCount === 1 ? 'iteración' : 'iteraciones'}
              </Badge>
            )}
            {allOk && (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                <CheckCircle2 className="w-3 h-3" />{t('engineInputs.d5Activo')}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const status = fieldStatus(form[field.key]);
          const charCount = form[field.key].trim().length;
          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{field.label} *</Label>
                <span className={cn(
                  'text-xs',
                  status === 'ok' ? 'text-green-600' : status === 'short' ? 'text-amber-500' : 'text-muted-foreground'
                )}>
                  {charCount < MIN_CHARS ? `${charCount}/${MIN_CHARS}` : `${charCount} chars`}
                </span>
              </div>
              <Textarea
                value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                rows={3}
                className={cn(
                  'resize-none transition-colors',
                  status === 'short' && 'border-amber-400 focus-visible:ring-amber-400',
                  status === 'ok' && 'border-green-400 focus-visible:ring-green-400',
                )}
              />
              <p className="text-xs text-muted-foreground">{field.description}</p>
              {status === 'short' && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="w-3 h-3" />
                  Necesita al menos {MIN_CHARS} caracteres para activar D5
                </div>
              )}
            </div>
          );
        })}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar estrategia
          </Button>
        </div>

        {/* EC13.4 — Pivot total detectado: ofrecer archivar el ciclo actual */}
        {showPivotPrompt && (
          <div className="mt-1 p-4 bg-warning/10 border border-warning/30 rounded-xl space-y-3">
            <div className="flex items-start gap-2">
              <GitBranch className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t('engineInputs.pivotCompletoDetectado')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Has cambiado los tres pilares de tu modelo de negocio. El ciclo estratégico
                  actual se construyó sobre la hipótesis anterior. ¿Quieres cerrarlo y comenzar
                  uno nuevo desde este modelo?
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPivotPrompt(false)}
                disabled={isArchivingCycle}
              >{t('engineInputs.mantenerCiclo')}</Button>
              <Button
                size="sm"
                onClick={handleArchiveCycle}
                disabled={isArchivingCycle}
              >
                {isArchivingCycle && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Cerrar ciclo actual
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
