/**
 * FEEDBACK RECEIVED MODAL
 *
 * Muestra todo el feedback recibido de compañeros
 * - Promedios por categoría
 * - Comentarios individuales
 * - Estadísticas generales
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Star, TrendingUp, Users, MessageSquare, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackReceivedModalProps {
  open: boolean;
  onClose: () => void;
  explorationPeriodId: string;
  role: string;
}

interface PeerFeedback {
  id: string;
  from_member: {
    nombre: string;
  } | null;
  collaboration_rating: number;
  quality_rating: number;
  communication_rating: number;
  initiative_rating: number;
  technical_skills_rating: number;
  strengths: string;
  improvements: string;
  would_work_again: boolean;
  is_anonymous: boolean;
  created_at: string;
}

export function FeedbackReceivedModal({
  open,
  onClose,
  explorationPeriodId,
  role,
}: FeedbackReceivedModalProps) {
  const [feedback, setFeedback] = useState<PeerFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, explorationPeriodId]);

  const loadFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('peer_feedback')
        .select(`
          *,
          from_member:from_member_id(nombre)
        `)
        .eq('exploration_period_id', explorationPeriodId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedback(data || []);
    } catch (_error) {
      toast.error('Error al cargar el feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverages = () => {
    if (feedback.length === 0) return null;

    const totals = feedback.reduce(
      (acc, f) => ({
        collaboration: acc.collaboration + f.collaboration_rating,
        quality: acc.quality + f.quality_rating,
        communication: acc.communication + f.communication_rating,
        initiative: acc.initiative + f.initiative_rating,
        technical: acc.technical + f.technical_skills_rating,
      }),
      { collaboration: 0, quality: 0, communication: 0, initiative: 0, technical: 0 }
    );

    const count = feedback.length;

    return {
      collaboration: totals.collaboration / count,
      quality: totals.quality / count,
      communication: totals.communication / count,
      initiative: totals.initiative / count,
      technical: totals.technical / count,
      overall: (totals.collaboration + totals.quality + totals.communication + totals.initiative + totals.technical) / (count * 5),
    };
  };

  const averages = calculateAverages();
  const wouldWorkAgainCount = feedback.filter((f) => f.would_work_again).length;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <MessageSquare className="text-primary" />
            Feedback Recibido
          </DialogTitle>
          <DialogDescription className="capitalize">
            {role} • {feedback.length} evaluaciones
          </DialogDescription>
        </DialogHeader>

        {feedback.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin feedback aún</h3>
            <p className="text-muted-foreground">
              Tus compañeros aún no han enviado evaluaciones
            </p>
          </div>
        ) : (
          <Tabs defaultValue="summary" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Resumen</TabsTrigger>
              <TabsTrigger value="individual">Comentarios Individuales</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-primary" />
                    Puntuación General
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Promedio Total</span>
                    <span className="text-4xl font-bold text-primary">
                      {averages!.overall.toFixed(1)}/5.0
                    </span>
                  </div>
                  <Progress value={averages!.overall * 20} className="h-3" />
                </CardContent>
              </Card>

              {/* Category Averages */}
              <Card>
                <CardHeader>
                  <CardTitle>Promedios por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'collaboration', label: 'Colaboración', value: averages!.collaboration },
                    { key: 'quality', label: 'Calidad de Trabajo', value: averages!.quality },
                    { key: 'communication', label: 'Comunicación', value: averages!.communication },
                    { key: 'initiative', label: 'Iniciativa/Liderazgo', value: averages!.initiative },
                    { key: 'technical', label: 'Habilidades Técnicas', value: averages!.technical },
                  ].map((category) => (
                    <div key={category.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={
                                  star <= Math.round(category.value)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }
                              />
                            ))}
                          </div>
                          <span className="text-sm font-bold w-12 text-right">
                            {category.value.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <Progress value={(category.value / 5) * 100} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users size={32} className="mx-auto text-primary mb-2" />
                      <div className="text-3xl font-bold">{feedback.length}</div>
                      <div className="text-sm text-muted-foreground">Evaluaciones</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <ThumbsUp size={32} className="mx-auto text-green-600 mb-2" />
                      <div className="text-3xl font-bold">{wouldWorkAgainCount}</div>
                      <div className="text-sm text-muted-foreground">
                        Trabajarían contigo otra vez
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Individual Comments Tab */}
            <TabsContent value="individual" className="space-y-4">
              {feedback.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {item.is_anonymous ? '🎭 Anónimo' : item.from_member?.nombre || 'Usuario'}
                      </CardTitle>
                      <Badge variant={item.would_work_again ? 'default' : 'secondary'}>
                        {item.would_work_again ? '✅ Trabajaría otra vez' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Ratings Grid */}
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[
                        { label: 'Col', value: item.collaboration_rating },
                        { label: 'Cal', value: item.quality_rating },
                        { label: 'Com', value: item.communication_rating },
                        { label: 'Ini', value: item.initiative_rating },
                        { label: 'Tec', value: item.technical_skills_rating },
                      ].map((r, i) => (
                        <div key={i} className="p-2 bg-muted/50 rounded">
                          <div className="text-xs text-muted-foreground">{r.label}</div>
                          <div className="text-lg font-bold">{r.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Comments */}
                    {item.strengths && (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-green-600">💪 Fortalezas:</div>
                        <p className="text-sm text-muted-foreground">{item.strengths}</p>
                      </div>
                    )}

                    {item.improvements && (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-yellow-600">
                          📈 Áreas de mejora:
                        </div>
                        <p className="text-sm text-muted-foreground">{item.improvements}</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground text-right">
                      {new Date(item.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
