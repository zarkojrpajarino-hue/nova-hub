/**
 * 🤖 AI QUESTIONS PANEL
 *
 * Panel de preguntas inteligentes durante la reunión
 * La IA hace preguntas contextuales para obtener más información
 * Las preguntas se generan basadas en:
 * - Tipo de reunión
 * - Objetivos
 * - Contexto estratégico
 * - Tiempo transcurrido
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';
interface AIQuestionsPanelProps {
  meetingId: string;
  meetingType: string;
  objectives?: string;
  strategicContext?: Record<string, unknown>;
  recordingTime: number;
  isMinimized?: boolean;
}

interface AIQuestion {
  id: string;
  question: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
  answer?: string;
  status: 'pending' | 'answered' | 'dismissed';
  asked_at: string;
}

export function AIQuestionsPanel({
  meetingId,
  meetingType,
  objectives,
  strategicContext,
  recordingTime,
  isMinimized = false,
}: AIQuestionsPanelProps) {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [minimized, setMinimized] = useState(isMinimized);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  // Generar preguntas inteligentes al inicio
  useEffect(() => {
    if (!questionsGenerated && recordingTime > 5) {
      generateSmartQuestions();
      setQuestionsGenerated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingTime, questionsGenerated]);

  // Cargar preguntas existentes de la BD
  useEffect(() => {
    loadExistingQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  /**
   * Carga preguntas existentes de la BD
   */
  const loadExistingQuestions = async () => {
    const { data, error } = await supabase
      .from('meeting_ai_questions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('asked_at', { ascending: true });

    if (!error && data) {
      setQuestions(data as unknown as AIQuestion[]);
    }
  };

  /**
   * Genera preguntas inteligentes basadas en el contexto
   */
  const generateSmartQuestions = async () => {
    const smartQuestions = getSmartQuestions(
      meetingType,
      objectives,
      strategicContext
    );

    // Guardar en BD
    const questionsToInsert = smartQuestions.map((q) => ({
      meeting_id: meetingId,
      question: q.question,
      context: q.context,
      priority: q.priority,
      status: 'pending',
      asked_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('meeting_ai_questions')
      .insert(questionsToInsert)
      .select();

    if (!error && data) {
      setQuestions(data as unknown as AIQuestion[]);
    }
  };

  /**
   * Responde una pregunta
   */
  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) {
      toast.error(t('meetings.escribeUnaRespuesta'));
      return;
    }

    const { error } = await supabase
      .from('meeting_ai_questions')
      .update({
        answer: answerText,
        status: 'answered',
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId);

    if (!error) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answer: answerText, status: 'answered' }
            : q
        )
      );
      setAnsweringId(null);
      setAnswerText('');
      toast.success(t('meetings.respuestaGuardada'));
    }
  };

  /**
   * Descarta una pregunta
   */
  const handleDismiss = async (questionId: string) => {
    const { error } = await supabase
      .from('meeting_ai_questions')
      .update({ status: 'dismissed' })
      .eq('id', questionId);

    if (!error) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, status: 'dismissed' } : q))
      );
      toast.info(t('meetings.preguntaDescartada'));
    }
  };

  const pendingQuestions = questions.filter((q) => q.status === 'pending');
  const answeredQuestions = questions.filter((q) => q.status === 'answered');

  if (questions.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            Preguntas de la IA
            {pendingQuestions.length > 0 && (
              <Badge variant="secondary">{pendingQuestions.length} pendientes</Badge>
            )}
          </CardTitle>
          {minimized ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </CardHeader>

      {!minimized && (
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {/* Preguntas pendientes */}
          {pendingQuestions.map((question) => (
            <div
              key={question.id}
              className="border rounded-lg p-3 bg-blue-50 border-blue-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{question.question}</p>
                  {question.context && (
                    <p className="text-xs text-gray-600 mt-1">{question.context}</p>
                  )}
                </div>
                <Badge
                  variant={
                    question.priority === 'high'
                      ? 'destructive'
                      : question.priority === 'medium'
                      ? 'default'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {question.priority}
                </Badge>
              </div>

              {answeringId === question.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder={t('meetings.escribeTuRespuesta')}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAnswer(question.id)}
                      className="gap-1"
                    >
                      <Check className="h-3 w-3" />{t('meetings.guardar')}</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAnsweringId(null);
                        setAnswerText('');
                      }}
                    >{t('meetings.cancelar')}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAnsweringId(question.id)}
                    className="flex-1"
                  >{t('meetings.responder')}</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(question.id)}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />{t('meetings.descartar')}</Button>
                </div>
              )}
            </div>
          ))}

          {/* Preguntas respondidas */}
          {answeredQuestions.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Respondidas ({answeredQuestions.length})
              </p>
              {answeredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="border rounded-lg p-2 mb-2 bg-green-50 border-green-200"
                >
                  <p className="text-sm font-semibold">{question.question}</p>
                  <p className="text-xs text-gray-700 mt-1">
                    <strong>Respuesta:</strong> {question.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Genera preguntas inteligentes según el contexto
 */
function getSmartQuestions(
  meetingType: string,
  objectives?: string,
  strategicContext?: Record<string, unknown>
): Array<{
  question: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const questions: Array<{
    question: string;
    context: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  // Preguntas según tipo de reunión
  const questionsByType: Record<string, Array<{ question: string; context: string; priority: 'high' | 'medium' | 'low' }>> = {
    sprint_planning: [
      {
        question: t('meetings.hayDependenciasTécnicasQue'),
        context: t('meetings.importanteParaPriorización'),
        priority: 'high',
      },
      {
        question: t('meetings.elEquipoTieneCapacidad'),
        context: t('meetings.verificarDisponibilidad'),
        priority: 'medium',
      },
    ],
    quarterly_planning: [
      {
        question: t('meetings.quéMétricasClaveDefinen'),
        context: t('meetings.paraAlinearOkrs'),
        priority: 'high',
      },
      {
        question: t('meetings.hayRiesgosIdentificadosQue'),
        context: t('meetings.gestiónDeRiesgos'),
        priority: 'medium',
      },
    ],
    one_on_one: [
      {
        question: t('meetings.hayAlgúnBlockerPersonal'),
        context: t('meetings.bienestarDelEquipo'),
        priority: 'high',
      },
      {
        question: t('meetings.quéObjetivosDeCrecimiento'),
        context: t('meetings.desarrolloProfesional'),
        priority: 'medium',
      },
    ],
    retrospective: [
      {
        question: t('meetings.quéProcesoEspecíficoMejoraremos'),
        context: t('meetings.acciónConcretaDeMejora'),
        priority: 'high',
      },
      {
        question: t('meetings.quéCelebramosDeEste'),
        context: t('meetings.reconocerÉxitos'),
        priority: 'low',
      },
    ],
    client_demo: [
      {
        question: t('meetings.quéFeedbackEspecíficoDio'),
        context: t('meetings.capturarFeedbackDetallado'),
        priority: 'high',
      },
      {
        question: t('meetings.hayNuevosRequisitosO'),
        context: t('meetings.scopeChanges'),
        priority: 'high',
      },
    ],
  };

  // Añadir preguntas específicas del tipo
  const typeQuestions = questionsByType[meetingType] || [];
  questions.push(...typeQuestions);

  // Preguntas según contexto estratégico
  if (strategicContext?.has_critical_decisions) {
    questions.push({
      question: t('meetings.seTomaronTodasLas'),
      context: t('meetings.verificarCompletitud'),
      priority: 'high',
    });
  }

  if (strategicContext?.current_blockers) {
    questions.push({
      question: t('meetings.seResolvieronLosBlockers'),
      context: t('meetings.seguimientoDeBlockers'),
      priority: 'high',
    });
  }

  if (strategicContext?.obvs_to_discuss?.length > 0) {
    questions.push({
      question: t('meetings.seRevisóElProgreso'),
      context: t('meetings.alineaciónEstratégica'),
      priority: 'medium',
    });
  }

  // Preguntas generales si no hay suficientes
  if (questions.length < 2) {
    questions.push(
      {
        question: t('meetings.hayAlgúnTemaImportante'),
        context: t('meetings.completitudDeLaReunión'),
        priority: 'medium',
      },
      {
        question: t('meetings.quedaronClarosLosPróximos'),
        context: t('meetings.accionablesClaros'),
        priority: 'high',
      }
    );
  }

  return questions.slice(0, 5); // Máximo 5 preguntas
}
