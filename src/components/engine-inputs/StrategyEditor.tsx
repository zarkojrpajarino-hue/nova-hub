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
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

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
      toast.error('Los tres campos son obligatorios');
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
        toast.info('Sin cambios para guardar');
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

      toast.success('Estrategia guardada');
      queryClient.invalidateQueries({ queryKey: ['strategy', projectId] });
      queryClient.invalidateQueries({ queryKey: ['strategy_versions_count', projectId] });
    } catch {
      toast.error('Error al guardar la estrategia');
    } finally {
      setIsSaving(false);
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

  const fields = [
    {
      key: 'segment' as const,
      label: 'Segmento objetivo',
      placeholder: 'Ej: Fundadores de startups B2B en etapa early con 1–5 empleados...',
      description: 'El cliente específico al que te diriges (quién, dónde, qué características)',
    },
    {
      key: 'problem' as const,
      label: 'Problema que resuelves',
      placeholder: 'Ej: Los fundadores pierden semanas construyendo features que nadie usa por no validar antes...',
      description: 'El dolor concreto y cuantificable que experimentan',
    },
    {
      key: 'valueProp' as const,
      label: 'Propuesta de valor',
      placeholder: 'Ej: Metodología + herramientas para validar en 48h con clientes reales, sin código...',
      description: 'Cómo resuelves el problema mejor que las alternativas',
    },
  ];

  const allOk = fields.every((f) => fieldStatus(form[f.key]) === 'ok');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Modelo estratégico actual</CardTitle>
            <CardDescription>
              Segmento, problema y propuesta de valor. Alimenta el motor de completitud de datos (D5).
            </CardDescription>
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
                <CheckCircle2 className="w-3 h-3" />
                D5 activo
              </Badge>
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
      </CardContent>
    </Card>
  );
}
