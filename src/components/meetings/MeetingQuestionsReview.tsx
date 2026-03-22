/**
 * 📋 MEETING QUESTIONS REVIEW
 *
 * Pantalla de revisión de preguntas de IA pre-insights
 * Se muestra ANTES del MeetingInsightsReview
 * Permite:
 * - Ver todas las preguntas formuladas durante la reunión
 * - Revisar y editar respuestas
 * - Ver preguntas sin responder
 * - Continuar al análisis de insights
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  Save,
  ArrowRight,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';
interface MeetingQuestionsReviewProps {
  meetingId: string;
  meetingTitle: string;
  onContinueToInsights: () => void;
  onBack?: () => void;
}

interface AIQuestion {
  id: string;
  question: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
  answer?: string;
  status: 'pending' | 'answered' | 'dismissed';
  asked_at: string;
  answered_at?: string;
}

export function MeetingQuestionsReview({
  meetingId,
  meetingTitle,
  onContinueToInsights,
  onBack,
}: MeetingQuestionsReviewProps) {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  /**
   * Carga las preguntas de la reunión
   */
  const loadQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('meeting_ai_questions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('asked_at', { ascending: true });

    if (!error && data) {
      setQuestions(data as unknown as AIQuestion[]);
    }
    setLoading(false);
  };

  /**
   * Guarda una respuesta editada
   */
  const saveAnswer = async (questionId: string) => {
    if (!editText.trim()) {
      toast.error(t('meetings.laRespuestaNoPuede'));
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('meeting_ai_questions')
      .update({
        answer: editText,
        status: 'answered',
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId);

    if (!error) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answer: editText, status: 'answered', answered_at: new Date().toISOString() }
            : q
        )
      );
      setEditingId(null);
      setEditText('');
      toast.success(t('meetings.respuestaGuardada'));
    } else {
      toast.error(t('meetings.errorAlGuardarLa'));
    }

    setSaving(false);
  };

  /**
   * Inicia la edición de una respuesta
   */
  const startEditing = (question: AIQuestion) => {
    setEditingId(question.id);
    setEditText(question.answer || '');
  };

  const answeredQuestions = questions.filter((q) => q.status === 'answered');
  const pendingQuestions = questions.filter((q) => q.status === 'pending');
  const dismissedQuestions = questions.filter((q) => q.status === 'dismissed');

  const allAnswered = pendingQuestions.length === 0 && questions.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 nova-gradient rounded-xl flex items-center justify-center font-bold text-xl text-primary-foreground animate-pulse mx-auto mb-3">
            N
          </div>
          <p className="text-gray-600">{t('meetings.cargandoPreguntas')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />{t('meetings.revisiónDePreguntas')}</h2>
        <p className="text-gray-600 mt-1">{meetingTitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{questions.length}</div>
              <div className="text-sm text-gray-600 mt-1">{t('meetings.totalPreguntas')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700">{answeredQuestions.length}</div>
              <div className="text-sm text-green-700 mt-1">{t('meetings.respondidas')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-700">{pendingQuestions.length}</div>
              <div className="text-sm text-orange-700 mt-1">{t('meetings.pendientes')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No questions message */}
      {questions.length === 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <HelpCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">{t('meetings.noSeGeneraronPreguntas')}<br />{t('meetings.puedesContinuarDirectamenteA')}</AlertDescription>
        </Alert>
      )}

      {/* Pending Questions Alert */}
      {pendingQuestions.length > 0 && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            Tienes {pendingQuestions.length} pregunta(s) sin responder.
            <br />{t('meetings.puedesResponderlasAhoraO')}</AlertDescription>
        </Alert>
      )}

      {/* All Answered Success */}
      {allAnswered && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>{t('meetings.excelente')}</strong>{t('meetings.todasLasPreguntasHan')}<br />{t('meetings.continúaParaRevisarLos')}</AlertDescription>
        </Alert>
      )}

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="space-y-4">
          {/* Answered Questions */}
          {answeredQuestions.length > 0 && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Preguntas Respondidas ({answeredQuestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {answeredQuestions.map((q) => (
                  <div key={q.id} className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{q.question}</p>
                        {q.context && (
                          <p className="text-xs text-gray-600 mt-1">{q.context}</p>
                        )}
                      </div>
                      <Badge
                        variant={
                          q.priority === 'high'
                            ? 'destructive'
                            : q.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs ml-2"
                      >
                        {q.priority}
                      </Badge>
                    </div>

                    {editingId === q.id ? (
                      <div className="space-y-2 mt-3">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveAnswer(q.id)}
                            disabled={saving}
                            className="gap-1"
                          >
                            <Save className="h-3 w-3" />
                            {saving ? 'Guardando...': t('meetings.guardar')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setEditText('');
                            }}
                            disabled={saving}
                          >{t('meetings.cancelar')}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 bg-white border border-green-200 rounded p-3">
                        <p className="text-sm text-gray-700">
                          <strong className="text-green-700">Respuesta:</strong> {q.answer}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(q)}
                          className="mt-2 gap-1 h-7 text-xs"
                        >
                          <Edit3 className="h-3 w-3" />{t('meetings.editar')}</Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pending Questions */}
          {pendingQuestions.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Preguntas Pendientes ({pendingQuestions.length})
                </CardTitle>
                <CardDescription>{t('meetings.estasPreguntasNoFueron')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingQuestions.map((q) => (
                  <div key={q.id} className="border rounded-lg p-4 bg-orange-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{q.question}</p>
                        {q.context && (
                          <p className="text-xs text-gray-600 mt-1">{q.context}</p>
                        )}
                      </div>
                      <Badge
                        variant={
                          q.priority === 'high'
                            ? 'destructive'
                            : q.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs ml-2"
                      >
                        {q.priority}
                      </Badge>
                    </div>

                    {editingId === q.id ? (
                      <div className="space-y-2 mt-3">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder={t('meetings.escribeLaRespuestaAhora')}
                          rows={3}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveAnswer(q.id)}
                            disabled={saving}
                            className="gap-1"
                          >
                            <Save className="h-3 w-3" />
                            {saving ? 'Guardando...': t('meetings.guardar')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setEditText('');
                            }}
                            disabled={saving}
                          >{t('meetings.cancelar')}</Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(q)}
                        className="mt-2 gap-1"
                      >
                        <Edit3 className="h-3 w-3" />{t('meetings.responderAhora')}</Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dismissed Questions */}
          {dismissedQuestions.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <XCircle className="h-5 w-5 text-gray-600" />
                  Preguntas Descartadas ({dismissedQuestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dismissedQuestions.map((q) => (
                  <div key={q.id} className="border rounded p-3 bg-gray-50">
                    <p className="text-sm text-gray-700">{q.question}</p>
                    {q.context && (
                      <p className="text-xs text-gray-500 mt-1">{q.context}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-between pt-4 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack}>{t('meetings.volver')}</Button>
        )}

        <div className="flex gap-3 ml-auto">
          <Button onClick={onContinueToInsights} size="lg" className="gap-2">Continuar a Insights<ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Badge */}
      <div className="text-center pt-2">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />{t('meetings.preguntasGeneradasPorIa')}</Badge>
      </div>
    </div>
  );
}
