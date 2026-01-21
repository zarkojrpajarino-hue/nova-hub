import { useState } from 'react';
import { Zap, Loader2, MessageCircle, Target, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GeneratedQuestion {
  pregunta: string;
  objetivo: string;
}

interface RoleContext {
  role: string;
  roleLabel: string;
  roleDescription: string;
  members: Array<{ nombre: string; projectName: string }>;
}

interface AIRoleQuestionsGeneratorProps {
  role: RoleContext | null;
  onClose: () => void;
}

export function AIRoleQuestionsGenerator({ role, onClose }: AIRoleQuestionsGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!role) return;
    
    setIsGenerating(true);
    setError(null);
    setQuestions([]);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('generate-role-questions', {
        body: { role }
      });

      if (funcError) {
        const errorMessage = funcError.message || '';
        if (errorMessage.includes('429') || funcError.context?.status === 429) {
          setError('Has excedido el límite de solicitudes. Espera unos minutos.');
          return;
        }
        if (errorMessage.includes('402') || funcError.context?.status === 402) {
          setError('Créditos de IA agotados. Contacta al administrador.');
          return;
        }
        throw funcError;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      setQuestions(data?.questions || []);
      
      if ((data?.questions || []).length === 0) {
        setError('No se pudieron generar preguntas. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      setError('Error al conectar con el servicio de IA. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Pregunta copiada');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = async () => {
    const allQuestions = questions.map((q, i) => `${i + 1}. ${q.pregunta}`).join('\n\n');
    await navigator.clipboard.writeText(allQuestions);
    toast.success('Todas las preguntas copiadas');
  };

  // Auto-generate when opened
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setQuestions([]);
      setError(null);
    }
  };

  // Trigger generation when role changes
  if (role && questions.length === 0 && !isGenerating && !error) {
    handleGenerate();
  }

  return (
    <Dialog open={!!role} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Preguntas para {role?.roleLabel}
          </DialogTitle>
          <DialogDescription>
            Preguntas generadas por IA para facilitar la reunión de rol
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-indigo-500" />
                </div>
                <Loader2 className="w-6 h-6 absolute -bottom-1 -right-1 animate-spin text-indigo-500" />
              </div>
              <p className="mt-4 font-medium">Generando preguntas...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Analizando el contexto del rol
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-destructive" />
              </div>
              <p className="mt-4 font-medium text-destructive">Error</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleGenerate}>
                Reintentar
              </Button>
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm leading-relaxed">{q.pregunta}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                          <Target className="w-3 h-3" />
                          <span>{q.objetivo}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                        copiedIndex === index && "opacity-100"
                      )}
                      onClick={() => handleCopy(q.pregunta, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {questions.length > 0 && !isGenerating && (
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGenerate}
            >
              <Zap className="w-4 h-4 mr-2" />
              Regenerar
            </Button>
            <Button
              className="flex-1"
              onClick={handleCopyAll}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Todas
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
