import { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2, Lightbulb, TrendingUp, AlertTriangle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    titulo: string;
    descripcion: string | null;
    playbook?: unknown;
    metadata?: unknown;
  };
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
  onComplete 
}: TaskCompletionDialogProps) {
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    } catch (err) {
      console.error('Error generating questions:', err);
      // Use fallback questions if AI fails
      setAiQuestions([]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Generate questions when dialog opens
  useState(() => {
    if (open && aiQuestions.length === 0) {
      generateAIQuestions();
    }
  });

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
      
      // Reset form
      setResultado('exito');
      setInsights('');
      setAprendizaje('');
      setSiguienteAccion('');
      setDificultad(3);
      setAiQuestions([]);
      setAnswers({});
      
      onOpenChange(false);
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Error al completar la tarea');
    } finally {
      setIsSubmitting(false);
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
      </DialogContent>
    </Dialog>
  );
}
