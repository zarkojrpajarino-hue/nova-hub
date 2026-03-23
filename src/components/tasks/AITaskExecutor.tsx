/**
 * AI TASK EXECUTOR
 *
 * Herramienta para ejecutar tareas automáticamente con IA
 * Conecta con edge function: ai-task-executor
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Sparkles, CheckCircle2, Save, Copy, Download, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

import { useTranslation } from 'react-i18next';
interface AIExecutionCallbackResult {
  error?: string;
  content?: TaskResult;
}

interface TaskResult {
  task: string;
  output: string;
  steps: Array<{
    step_number: number;
    description: string;
    result: string;
    status: 'completed' | 'failed';
  }>;
  execution_time: number;
  tokens_used: number;
}

export function AITaskExecutor() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { currentProject } = useCurrentProject();
  const [isSaving, setIsSaving] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [detailLevel, setDetailLevel] = useState('normal');
  const [outputFormat, setOutputFormat] = useState('texto');
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);

  const handleExecutionComplete = (result: AIExecutionCallbackResult) => {
    if (result.error) {
      toast.error('Error al ejecutar tarea: ' + result.error);
      return;
    }

    setTaskResult(result.content);
    toast.success(t('tasks.tareaEjecutadaExitosamente'));
  };

  const handleExecutionError = (error: Error) => {
    toast.error('Error al ejecutar tarea: ' + error.message);
  };

  const handleCopyResult = () => {
    if (!taskResult) return;
    navigator.clipboard.writeText(taskResult.output);
    toast.success(t('tasks.resultadoCopiadoAlPortapapeles'));
  };

  const handleDownloadResult = () => {
    if (!taskResult) return;
    const blob = new Blob([taskResult.output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-task-result-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('tasks.resultadoDescargado'));
  };

  const handleSaveAsOBV = async () => {
    if (!taskResult || !profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('obvs').insert({
        titulo: taskResult.task.substring(0, 100),
        descripcion: taskResult.output,
        estado: 'completado',
        creator_id: profile.id,
        tipo: 'tarea',
        metadata: {
          generatedByAI: true,
          executionTime: taskResult.execution_time,
          steps: taskResult.steps,
        },
      });

      if (error) throw error;

      toast.success('Resultado guardado como OBV');
    } catch (_error) {
      toast.error('Error al guardar: ' + (error instanceof Error ? error.message : t('tasks.errorDesconocido')));
    } finally {
      setIsSaving(false);
    }
  };

  const exampleTasks = [
    'Analizar las tendencias de mercado en IA para 2026',
    'Generar un plan de marketing para lanzar un producto SaaS',
    t('tasks.crearUnChecklistDe'),
    t('tasks.investigarCompetidoresEnEl'),
    t('tasks.redactar10HeadlinesPara'),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl optimus-gradient flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>{t('tasks.aiTaskExecutor')}</CardTitle>
              <CardDescription>{t('tasks.ejecutaTareasComplejasAutomáticamente')}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('tasks.describeLaTarea')}</CardTitle>
          <CardDescription>{t('tasks.explicaQuéQuieresQue')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Input */}
          <div className="space-y-2">
            <Label htmlFor="taskInput">Tarea a ejecutar *</Label>
            <Textarea
              id="taskInput"
              placeholder={t('tasks.ejAnalizarLas5')}
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Sé específico sobre qué información necesitas, formato deseado, y cualquier
              restricción.
            </p>
          </div>

          {/* Example Tasks */}
          {!taskInput && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">EJEMPLOS DE TAREAS:</p>
              <div className="grid grid-cols-1 gap-2">
                {exampleTasks.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTaskInput(example)}
                    className="text-left text-sm p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="detailLevel">{t('tasks.nivelDeDetalle')}</Label>
              <Select
                value={detailLevel}
                onValueChange={setDetailLevel}
              >
                <SelectTrigger id="detailLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conciso">Conciso (resumen ejecutivo)</SelectItem>
                  <SelectItem value="normal">Normal (balanceado)</SelectItem>
                  <SelectItem value="detallado">Detallado (análisis profundo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputFormat">{t('tasks.formatoDeSalida')}</Label>
              <Select
                value={outputFormat}
                onValueChange={setOutputFormat}
              >
                <SelectTrigger id="outputFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">{t('tasks.textoPlano')}</SelectItem>
                  <SelectItem value="markdown">{t('tasks.markdown')}</SelectItem>
                  <SelectItem value="lista">{t('tasks.listaConBullets')}</SelectItem>
                  <SelectItem value="tabla">{t('tasks.tablaComparativa')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Execute Button */}
          <EvidenceAIGenerator
            functionName="ai-task-executor"
            evidenceProfile="tasks"
            projectId={currentProject?.id || ''}
            userId={user?.id || ''}
            buttonLabel={t('tasks.ejecutarTarea')}
            buttonSize="lg"
            buttonClassName="w-full"
            additionalParams={{
              task: taskInput,
              config: {
                detailLevel,
                outputFormat,
              },
            }}
            onGenerationComplete={handleExecutionComplete}
            onError={handleExecutionError}
          />
        </CardContent>
      </Card>

      {/* Results */}
      {taskResult && (
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <CardTitle className="text-base">{t('tasks.resultadoDeLaTarea')}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleCopyResult} variant="outline" size="sm" className="gap-2">
                  <Copy size={14} />{t('tasks.copiar')}</Button>
                <Button
                  onClick={handleDownloadResult}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download size={14} />{t('tasks.descargar')}</Button>
                <Button
                  onClick={handleSaveAsOBV}
                  disabled={isSaving}
                  size="sm"
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Guardar como OBV
                </Button>
              </div>
            </div>
            <CardDescription>
              Tarea: <strong>{taskResult.task}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Execution Stats */}
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="gap-1">
                {taskResult.execution_time}s
              </Badge>
              <Badge variant="outline" className="gap-1">
                {taskResult.tokens_used} tokens
              </Badge>
              <Badge variant="outline" className="gap-1">
                {taskResult.steps.filter((s) => s.status === 'completed').length}/
                {taskResult.steps.length} pasos
              </Badge>
            </div>

            <Separator />

            {/* Steps */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Pasos ejecutados:</p>
              {taskResult.steps.map((step) => (
                <div
                  key={step.step_number}
                  className={`p-3 rounded-lg border ${
                    step.status === 'completed'
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        step.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{step.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{step.result}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Output */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Resultado final:</p>
              <div className="p-4 rounded-lg bg-background border">
                <pre className="whitespace-pre-wrap text-sm font-mono">{taskResult.output}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
