import { useState } from 'react';
import { Zap, Loader2, MessageCircle, Target, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MeetingQuestionViewer } from '@/components/meetings/MeetingQuestionViewer';

interface SimpleQuestion {
  pregunta: string;
  objetivo: string;
}

interface DetailedQuestion {
  pregunta: string;
  subtitulo: string;
  categoria: 'resultados' | 'aprendizajes' | 'desafios' | 'colaboracion' | 'mejora_continua';
  prioridad: 1 | 2 | 3;
  tiempo_sugerido_minutos: number;
  por_que_esta_pregunta: string;
  basada_en: string;
  guia: {
    objetivo_de_la_pregunta: string;
    como_introducirla: string;
    preguntas_de_seguimiento: string[];
    dinamica_sugerida: {
      formato: string;
      descripcion: string;
      pasos: string[];
    };
    que_buscar_en_respuestas: string[];
    red_flags: string[];
    como_cerrar: string;
    accion_resultante: string;
  };
  relacionada_con_miembros: string[];
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
  const [simpleQuestions, setSimpleQuestions] = useState<SimpleQuestion[]>([]);
  const [detailedQuestions, setDetailedQuestions] = useState<DetailedQuestion[]>([]);
  const [agendaSugerida, setAgendaSugerida] = useState<{ apertura: string; desarrollo: string; cierre: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'simple' | 'detailed'>('detailed');

  const handleGenerate = async (version: 'simple' | 'detailed' = 'detailed') => {
    if (!role) return;

    setIsGenerating(true);
    setError(null);
    setSimpleQuestions([]);
    setDetailedQuestions([]);
    setAgendaSugerida(null);

    try {
      const endpoint = version === 'detailed' ? 'generate-role-questions-v2' : 'generate-role-questions';
      const body = version === 'detailed'
        ? { role: role.role, meetingType: 'Reunión mensual de rol', duracionMinutos: 60 }
        : { role };

      const { data, error: funcError } = await supabase.functions.invoke(endpoint, { body });

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

      if (version === 'detailed') {
        setDetailedQuestions(data?.questions || []);
        setAgendaSugerida(data?.agenda_sugerida || null);
        setActiveTab('detailed');
      } else {
        setSimpleQuestions(data?.questions || []);
        setActiveTab('simple');
      }

      if ((data?.questions || []).length === 0) {
        setError('No se pudieron generar preguntas. Inténtalo de nuevo.');
      }
    } catch (err) {
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
      setSimpleQuestions([]);
      setDetailedQuestions([]);
      setAgendaSugerida(null);
      setError(null);
    }
  };

  // Trigger generation when role changes
  if (role && detailedQuestions.length === 0 && simpleQuestions.length === 0 && !isGenerating && !error) {
    handleGenerate('detailed');
  }

  return (
    <Dialog open={!!role} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'simple' | 'detailed')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detailed">Con Guías de Facilitación</TabsTrigger>
            <TabsTrigger value="simple">Preguntas Simples</TabsTrigger>
          </TabsList>

          <TabsContent value="detailed" className="flex-1 overflow-y-auto mt-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-indigo-500" />
                  </div>
                  <Loader2 className="w-6 h-6 absolute -bottom-1 -right-1 animate-spin text-indigo-500" />
                </div>
                <p className="mt-4 font-medium">Generando preguntas con guías...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Analizando contexto y creando facilitación detallada
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-destructive" />
                </div>
                <p className="mt-4 font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => handleGenerate('detailed')}>
                  Reintentar
                </Button>
              </div>
            ) : detailedQuestions.length > 0 ? (
              <MeetingQuestionViewer
                questions={detailedQuestions}
                roleLabel={role?.roleLabel || ''}
                agendaSugerida={agendaSugerida}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="simple" className="flex-1 overflow-y-auto mt-4">
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
                <Button variant="outline" className="mt-4" onClick={() => handleGenerate('simple')}>
                  Reintentar
                </Button>
              </div>
            ) : simpleQuestions.length > 0 ? (
              <div className="space-y-4">
                {simpleQuestions.map((q, index) => (
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
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">No hay preguntas simples generadas</p>
                <Button onClick={() => handleGenerate('simple')}>
                  <Zap className="w-4 h-4 mr-2" />
                  Generar preguntas simples
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {(detailedQuestions.length > 0 || simpleQuestions.length > 0) && !isGenerating && (
          <div className="flex items-center gap-3 pt-4 border-t mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleGenerate(activeTab)}
            >
              <Zap className="w-4 h-4 mr-2" />
              Regenerar
            </Button>
            {activeTab === 'simple' && simpleQuestions.length > 0 && (
              <Button
                className="flex-1"
                onClick={handleCopyAll}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Todas
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
