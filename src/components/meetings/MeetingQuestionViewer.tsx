import { useState } from 'react';
import { 
  MessageCircle, Users, Clock, Target, AlertCircle,
  ChevronDown, ChevronRight, Lightbulb, Flag, CheckCircle2,
  ArrowRight, Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface MeetingQuestion {
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

interface MeetingQuestionViewerProps {
  questions: MeetingQuestion[];
  roleLabel: string;
  agendaSugerida?: {
    apertura: string;
    desarrollo: string;
    cierre: string;
  };
}

const CATEGORIA_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  resultados: { label: 'Resultados', color: 'bg-green-500/10 text-green-700 border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> },
  aprendizajes: { label: 'Aprendizajes', color: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: <Lightbulb className="w-4 h-4" /> },
  desafios: { label: 'Desafíos', color: 'bg-red-500/10 text-red-700 border-red-200', icon: <AlertCircle className="w-4 h-4" /> },
  colaboracion: { label: 'Colaboración', color: 'bg-purple-500/10 text-purple-700 border-purple-200', icon: <Users className="w-4 h-4" /> },
  mejora_continua: { label: 'Mejora Continua', color: 'bg-amber-500/10 text-amber-700 border-amber-200', icon: <Target className="w-4 h-4" /> },
};

const FORMATO_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  ronda: { label: 'Ronda', icon: <Users className="w-4 h-4" /> },
  debate: { label: 'Debate', icon: <MessageCircle className="w-4 h-4" /> },
  brainstorm: { label: 'Brainstorm', icon: <Lightbulb className="w-4 h-4" /> },
  caso_estudio: { label: 'Caso de Estudio', icon: <Target className="w-4 h-4" /> },
  role_play: { label: 'Role Play', icon: <Play className="w-4 h-4" /> },
};

export function MeetingQuestionViewer({ questions, roleLabel, agendaSugerida }: MeetingQuestionViewerProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);

  const totalTime = questions.reduce((sum, q) => sum + q.tiempo_sugerido_minutos, 0);

  const toggleCompleted = (index: number) => {
    setCompletedQuestions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Reunión de {roleLabel}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {questions.length} preguntas · {totalTime} minutos estimados
              </p>
            </div>
            <Badge variant="outline">
              {completedQuestions.length}/{questions.length} completadas
            </Badge>
          </div>
        </CardHeader>

        {agendaSugerida && (
          <CardContent className="pt-0">
            <div className="grid gap-2 md:grid-cols-3">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Apertura</p>
                <p className="text-xs text-muted-foreground">{agendaSugerida.apertura}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Desarrollo</p>
                <p className="text-xs text-muted-foreground">{agendaSugerida.desarrollo}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">Cierre</p>
                <p className="text-xs text-muted-foreground">{agendaSugerida.cierre}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const categoria = CATEGORIA_CONFIG[question.categoria] || CATEGORIA_CONFIG.resultados;
          const formato = FORMATO_CONFIG[question.guia.dinamica_sugerida.formato] || FORMATO_CONFIG.ronda;
          const isExpanded = expandedQuestion === index;
          const isCompleted = completedQuestions.includes(index);

          return (
            <Card 
              key={index} 
              className={cn(
                "transition-all",
                isCompleted && "opacity-60"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  {/* Priority indicator */}
                  <button
                    type="button"
                    onClick={() => toggleCompleted(index)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      isCompleted
                        ? "bg-green-500 text-white"
                        : question.prioridad === 1 
                          ? "bg-red-100 text-red-700"
                          : question.prioridad === 2
                            ? "bg-amber-100 text-amber-700"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={cn("text-xs", categoria.color)}>
                        {categoria.icon}
                        <span className="ml-1">{categoria.label}</span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {question.tiempo_sugerido_minutos} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formato.icon}
                        <span className="ml-1">{formato.label}</span>
                      </Badge>
                    </div>

                    <h3 className="font-medium text-sm leading-snug">
                      {question.pregunta}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {question.subtitulo}
                    </p>

                    {question.relacionada_con_miembros.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {question.relacionada_con_miembros.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-2 border-t">
                  <div className="space-y-4">
                    {/* Contexto */}
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium mb-1">¿Por qué esta pregunta?</p>
                        <p className="text-xs text-muted-foreground">{question.por_que_esta_pregunta}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium mb-1">Basada en</p>
                        <p className="text-xs text-muted-foreground">{question.basada_en}</p>
                      </div>
                    </div>

                    {/* Guía de facilitación */}
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="intro">
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-green-500" />
                            Cómo introducirla
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm italic bg-muted/50 p-3 rounded-lg">
                            "{question.guia.como_introducirla}"
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="dinamica">
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            Dinámica sugerida
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            {question.guia.dinamica_sugerida.descripcion}
                          </p>
                          <ol className="space-y-1">
                            {question.guia.dinamica_sugerida.pasos.map((paso, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs">
                                  {i + 1}
                                </span>
                                {paso}
                              </li>
                            ))}
                          </ol>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="seguimiento">
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-purple-500" />
                            Preguntas de seguimiento
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1">
                            {question.guia.preguntas_de_seguimiento.map((p, i) => (
                              <li key={i} className="text-xs flex items-start gap-2">
                                <span className="text-primary">→</span>
                                {p}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="buscar">
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-amber-500" />
                            Qué buscar en respuestas
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-medium text-green-600 mb-1">✓ Buscar</p>
                              <ul className="space-y-1">
                                {question.guia.que_buscar_en_respuestas.map((item, i) => (
                                  <li key={i} className="text-xs text-muted-foreground">• {item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-red-600 mb-1">⚠ Red Flags</p>
                              <ul className="space-y-1">
                                {question.guia.red_flags.map((item, i) => (
                                  <li key={i} className="text-xs text-muted-foreground">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="cierre">
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center gap-2">
                            <Flag className="w-4 h-4 text-green-500" />
                            Cómo cerrar
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm italic bg-muted/50 p-3 rounded-lg mb-2">
                            "{question.guia.como_cerrar}"
                          </p>
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs font-medium text-primary mb-1">Acción resultante:</p>
                            <p className="text-xs">{question.guia.accion_resultante}</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
