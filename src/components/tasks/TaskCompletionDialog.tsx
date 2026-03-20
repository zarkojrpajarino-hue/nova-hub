import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, CheckCircle2, Lightbulb, TrendingUp, AlertTriangle, Send, Layers, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// AUD.B.4 — validación semántica mínima para siguiente_accion
// Reglas: ≥15 chars + no todo mayúsculas (evita "LLAMAR LLAMAR LLAMAR")
function isValidSiguienteAccion(text: string): boolean {
  const t = text.trim();
  if (t.length < 15) return false;
  if (/[A-ZÁÉÍÓÚÑ]/.test(t) && t === t.toUpperCase()) return false;
  return true;
}

const FUNCTION_TYPE_OPTIONS = [
  { value: 'demand',   label: 'Demanda',  color: '#F59E0B', description: 'Generación de leads, ventas, marketing' },
  { value: 'delivery', label: 'Delivery', color: '#3B82F6', description: 'Producto, desarrollo, entrega al cliente' },
  { value: 'cash',     label: 'Cash',     color: '#22C55E', description: 'Facturación, cobros, gestión financiera' },
  { value: 'support',  label: 'Soporte',  color: '#A855F7', description: 'Operaciones, atención al cliente, admin' },
] as const;

interface TaskCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    titulo: string;
    descripcion: string | null;
    playbook?: unknown;
    metadata?: unknown;
    function_type?: string | null;
    prioridad?: number | null;
    assignee_id?: string | null;
  };
  projectId?: string;
  onComplete: (taskId: string, feedback: TaskFeedback) => void;
}

interface TaskFeedback {
  resultado: 'exito' | 'parcial' | 'fallido';
  insights: string;
  aprendizaje: string;
  siguiente_accion: string;
  dificultad: number;
}

interface AIQuestion {
  pregunta: string;
  tipo: 'texto' | 'escala' | 'opciones';
  opciones?: string[];
  placeholder?: string;
}

export function TaskCompletionDialog({
  open,
  onOpenChange,
  task,
  projectId,
  onComplete
}: TaskCompletionDialogProps) {
  const navigate = useNavigate();
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Classify step (shown when task.function_type is null)
  const [step, setStep] = useState<'classify' | 'feedback' | 'followup'>(
    task.function_type ? 'feedback' : 'classify'
  );
  const [isSavingFunctionType, setIsSavingFunctionType] = useState(false);

  // Follow-up step state (F19.B.1 + F19.B.3)
  const [completedFeedback, setCompletedFeedback] = useState<TaskFeedback | null>(null);
  const [isCreatingFollowUpTask, setIsCreatingFollowUpTask] = useState(false);
  const [resolvedFunctionType, setResolvedFunctionType] = useState<string | null>(
    task.function_type ?? null
  );

  // Reset step when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep(task.function_type ? 'feedback' : 'classify');
      setCompletedFeedback(null);
      setResolvedFunctionType(task.function_type ?? null);
    }
  }, [open, task.function_type]);

  // Basic feedback fields
  const [resultado, setResultado] = useState<'exito' | 'parcial' | 'fallido'>('exito');
  const [insights, setInsights] = useState('');
  const [aprendizaje, setAprendizaje] = useState('');
  const [siguienteAccion, setSiguienteAccion] = useState('');
  const [dificultad, setDificultad] = useState(3);

  const generateAIQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-task-completion-questions', {
        body: {
          task: {
            titulo: task.titulo,
            descripcion: task.descripcion,
            playbook: task.playbook,
            metadata: task.metadata,
          }
        }
      });

      if (error) throw error;
      
      if (data?.questions) {
        setAiQuestions(data.questions);
      }
    } catch (_err) {
      // Use fallback questions if AI fails
      setAiQuestions([]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleFunctionTypeSelect = async (ft: string) => {
    setIsSavingFunctionType(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ function_type: ft })
        .eq('id', task.id);
      if (error) throw error;
      setResolvedFunctionType(ft);
      setStep('feedback');
    } catch {
      toast.error('Error al guardar la función. Intenta de nuevo.');
    } finally {
      setIsSavingFunctionType(false);
    }
  };

  // Generate questions when dialog opens (or reopens for a different task)
  useEffect(() => {
    if (open) {
      setAiQuestions([]);
      generateAIQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task.id]);

  const handleSubmit = async () => {
    if (!insights.trim() || !aprendizaje.trim()) {
      toast.error('Por favor completa los campos de insights y aprendizaje');
      return;
    }

    setIsSubmitting(true);

    const feedback: TaskFeedback = {
      resultado,
      insights,
      aprendizaje,
      siguiente_accion: siguienteAccion,
      dificultad,
    };

    try {
      await onComplete(task.id, feedback);

      // F19.B.1: si hay siguiente_accion, mostrar paso follow-up
      const hasSiguiente = isValidSiguienteAccion(siguienteAccion);
      const isDemandSuccess = resolvedFunctionType === 'demand' && resultado === 'exito';

      if (hasSiguiente || isDemandSuccess) {
        setCompletedFeedback(feedback);
        setStep('followup');
      } else {
        // Reset form + cerrar
        setResultado('exito');
        setInsights('');
        setAprendizaje('');
        setSiguienteAccion('');
        setDificultad(3);
        setAiQuestions([]);
        setAnswers({});
        onOpenChange(false);
      }
    } catch (_err) {
      toast.error('Error al completar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFollowUpTask = async () => {
    if (!completedFeedback?.siguiente_accion || !projectId) return;
    setIsCreatingFollowUpTask(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        project_id:    projectId,
        titulo:        completedFeedback.siguiente_accion.slice(0, 80),
        prioridad:     task.prioridad ?? 3,
        function_type: resolvedFunctionType,
        assignee_id:   task.assignee_id ?? null,
        ai_generated:  false,
        metadata:      { origin: 'task_feedback', source_task_id: task.id },
      });
      if (error) throw error;
      toast.success(`Tarea creada · ${completedFeedback.siguiente_accion.slice(0, 40)}`);
    } catch {
      toast.error('Error al crear la tarea');
    } finally {
      setIsCreatingFollowUpTask(false);
    }
  };

  const handleCloseFollowUp = () => {
    setResultado('exito');
    setInsights('');
    setAprendizaje('');
    setSiguienteAccion('');
    setDificultad(3);
    setAiQuestions([]);
    setAnswers({});
    setCompletedFeedback(null);
    onOpenChange(false);
  };

  const handleNavigateToOBVs = () => {
    handleCloseFollowUp();
    if (projectId) {
      // Navigate with prefill param so ProjectOBVsTab can open CreateOBVDialog
      navigate(`?tab=obvs&prefill=${encodeURIComponent(task.titulo)}`);
    }
  };

  const RESULTADO_OPTIONS = [
    { value: 'exito', label: 'Éxito total', icon: CheckCircle2, color: 'text-green-500' },
    { value: 'parcial', label: 'Éxito parcial', icon: TrendingUp, color: 'text-amber-500' },
    { value: 'fallido', label: 'No completada', icon: AlertTriangle, color: 'text-red-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            Completar Tarea
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            {task.titulo}
          </DialogDescription>
        </DialogHeader>

        {/* Step: classify — function_type was null */}
        {step === 'classify' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="w-4 h-4 text-primary" />
              <span>Antes de completar, asigna la función de esta tarea en el negocio</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FUNCTION_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isSavingFunctionType}
                  onClick={() => handleFunctionTypeSelect(opt.value)}
                  className="p-4 rounded-xl border-2 border-border hover:border-primary/60 transition-all text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="font-medium text-sm">{opt.label}</span>
                    {isSavingFunctionType && (
                      <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{opt.description}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Step: feedback */}
        {step === 'feedback' && (
        <>
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Resultado */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">¿Cómo fue el resultado?</Label>
            <div className="grid grid-cols-3 gap-2">
              {RESULTADO_OPTIONS.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setResultado(option.value as typeof resultado)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-center",
                      resultado === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn("w-6 h-6 mx-auto mb-1", option.color)} />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dificultad */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">¿Qué tan difícil fue?</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDificultad(n)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    dificultad === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Muy fácil</span>
              <span>Muy difícil</span>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              ¿Qué insights obtuviste?
            </Label>
            <Textarea
              value={insights}
              onChange={e => setInsights(e.target.value)}
              placeholder="Descubrimientos sobre el cliente, mercado, producto..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Aprendizaje */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              ¿Qué aprendizaje te llevas?
            </Label>
            <Textarea
              value={aprendizaje}
              onChange={e => setAprendizaje(e.target.value)}
              placeholder="Qué harías diferente, qué funcionó bien..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Siguiente acción */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Cuál es el siguiente paso? (opcional)</Label>
            <Textarea
              value={siguienteAccion}
              onChange={e => setSiguienteAccion(e.target.value)}
              placeholder="Próxima acción a tomar..."
              className="min-h-[60px] resize-none"
            />
            {siguienteAccion.trim().length > 0 && !isValidSiguienteAccion(siguienteAccion) && (
              <p className="text-xs text-muted-foreground">
                {siguienteAccion.trim().length < 15
                  ? `Describe un poco más para crear tarea (${siguienteAccion.trim().length}/15 chars)`
                  : 'Evita escribir todo en mayúsculas'}
              </p>
            )}
          </div>

          {/* AI Generated Questions */}
          {isGeneratingQuestions && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Generando preguntas personalizadas...</span>
            </div>
          )}

          {aiQuestions.length > 0 && (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Preguntas adicionales (IA)</span>
              </div>
              {aiQuestions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <Label className="text-sm">{q.pregunta}</Label>
                  {q.tipo === 'texto' && (
                    <Textarea
                      value={answers[`q${i}`] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [`q${i}`]: e.target.value }))}
                      placeholder={q.placeholder || 'Tu respuesta...'}
                      className="min-h-[60px] resize-none"
                    />
                  )}
                  {q.tipo === 'opciones' && q.opciones && (
                    <RadioGroup
                      value={answers[`q${i}`] || ''}
                      onValueChange={v => setAnswers(prev => ({ ...prev, [`q${i}`]: v }))}
                    >
                      {q.opciones.map((opt, j) => (
                        <div key={j} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`q${i}-${j}`} />
                          <Label htmlFor={`q${i}-${j}`} className="text-sm font-normal">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting || !insights.trim() || !aprendizaje.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Completar tarea
          </Button>
        </div>
        </>
        )}

        {/* F19.B.1 + F19.B.3 — Follow-up step */}
        {step === 'followup' && completedFeedback && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Tarea completada
            </div>

            {/* B.1: Siguiente acción detectada */}
            {isValidSiguienteAccion(completedFeedback.siguiente_accion) && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs text-muted-foreground font-medium">Siguiente paso detectado:</p>
                <p className="text-sm">"{completedFeedback.siguiente_accion.slice(0, 80)}"</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isCreatingFollowUpTask}
                    onClick={async () => {
                      await handleCreateFollowUpTask();
                      handleCloseFollowUp();
                    }}
                  >
                    {isCreatingFollowUpTask
                      ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      : <ArrowRight className="w-3 h-3 mr-1" />
                    }
                    Crear tarea
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCloseFollowUp}>
                    Ignorar
                  </Button>
                </div>
              </div>
            )}

            {/* B.3: demand + exito → sugerencia de OBV */}
            {resolvedFunctionType === 'demand' && completedFeedback.resultado === 'exito' && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs text-muted-foreground font-medium">¿Fue una validación con un cliente?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleNavigateToOBVs}
                  >
                    Registrar como OBV →
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCloseFollowUp}>
                    No por ahora
                  </Button>
                </div>
              </div>
            )}

            {/* Cierre sin acción extra */}
            {!isValidSiguienteAccion(completedFeedback.siguiente_accion) &&
              resolvedFunctionType !== 'demand' && (
              <Button className="w-full" onClick={handleCloseFollowUp}>
                Cerrar
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
