/**
 * PEER FEEDBACK FORM - SISTEMA 360°
 *
 * Formulario completo para evaluar a un compañero de equipo
 * Basado en metodologías de Google Project Oxygen y Netflix Culture
 *
 * Métricas evaluadas:
 * - Colaboración (teamwork)
 * - Calidad de trabajo (quality)
 * - Comunicación (communication)
 * - Iniciativa/Liderazgo (initiative)
 * - Habilidades técnicas (technical skills)
 */

import { useState } from 'react';
import { MessageSquare, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeedbackStarRating } from './FeedbackStarRating';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PeerFeedbackFormProps {
  toMember: {
    id: string;
    nombre: string;
    email: string;
  };
  explorationPeriod: {
    id: string;
    role: string;
    project_id: string;
  };
  currentUserId: string;
  onSuccess?: () => void;
}

interface Ratings {
  collaboration: number;
  quality: number;
  communication: number;
  initiative: number;
  technical: number;
}

const RATING_LABELS = {
  collaboration: {
    title: 'Colaboración',
    description: '¿Qué tan bien trabaja en equipo?',
  },
  quality: {
    title: 'Calidad de Trabajo',
    description: '¿Su trabajo cumple con los estándares?',
  },
  communication: {
    title: 'Comunicación',
    description: '¿Se comunica claramente y a tiempo?',
  },
  initiative: {
    title: 'Iniciativa/Liderazgo',
    description: '¿Propone ideas y toma ownership?',
  },
  technical: {
    title: 'Habilidades Técnicas',
    description: '¿Tiene las skills necesarias para el rol?',
  },
};

export function PeerFeedbackForm({
  toMember,
  explorationPeriod,
  currentUserId,
  onSuccess,
}: PeerFeedbackFormProps) {
  const [ratings, setRatings] = useState<Ratings>({
    collaboration: 0,
    quality: 0,
    communication: 0,
    initiative: 0,
    technical: 0,
  });

  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [wouldWorkAgain, setWouldWorkAgain] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const allRatingsComplete = Object.values(ratings).every((r) => r > 0);
  const canSubmit = allRatingsComplete && strengths.trim().length > 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toast.error('Por favor completa todos los ratings y escribe al menos 10 caracteres en fortalezas');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('peer_feedback').insert({
        from_member_id: currentUserId,
        to_member_id: toMember.id,
        project_id: explorationPeriod.project_id,
        role_evaluated: explorationPeriod.role,
        exploration_period_id: explorationPeriod.id,
        collaboration_rating: ratings.collaboration,
        quality_rating: ratings.quality,
        communication_rating: ratings.communication,
        initiative_rating: ratings.initiative,
        technical_skills_rating: ratings.technical,
        strengths,
        improvements: improvements.trim() || null,
        would_work_again: wouldWorkAgain,
        is_anonymous: isAnonymous,
        feedback_type: 'end_exploration',
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success(
        isAnonymous
          ? 'Feedback enviado de forma anónima'
          : `Feedback enviado a ${toMember.nombre}`
      );

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error enviando feedback:', error);

      if (error.code === '23505') {
        toast.error('Ya enviaste feedback a esta persona en este período');
      } else {
        toast.error('Error al enviar el feedback. Intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">¡Feedback Enviado!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tu evaluación de {toMember.nombre} ha sido registrada
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare size={24} className="text-primary" />
          Evalúa a {toMember.nombre}
        </CardTitle>
        <CardDescription>
          Rol: <span className="font-semibold capitalize">{explorationPeriod.role}</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ratings */}
          <div className="space-y-6 pb-6 border-b">
            <h3 className="text-sm font-semibold">Evaluación (1-5 estrellas)</h3>

            {(Object.keys(RATING_LABELS) as Array<keyof typeof RATING_LABELS>).map((key) => (
              <FeedbackStarRating
                key={key}
                label={RATING_LABELS[key].title}
                description={RATING_LABELS[key].description}
                value={ratings[key]}
                onChange={(value) => setRatings({ ...ratings, [key]: value })}
                required
              />
            ))}
          </div>

          {/* Comentarios */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strengths">
                ¿Qué hace bien? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="strengths"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Ejemplo: Excelente colaboración, siempre dispuesto a ayudar, muy proactivo..."
                rows={3}
                required
                className={cn(
                  strengths.trim().length > 0 && strengths.trim().length < 10 && 'border-red-500'
                )}
              />
              <p className="text-xs text-muted-foreground">
                {strengths.trim().length}/10 caracteres mínimo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvements">¿Qué puede mejorar? (opcional)</Label>
              <Textarea
                id="improvements"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Ejemplo: Podría mejorar la organización de tareas, comunicar más frecuentemente..."
                rows={3}
              />
            </div>
          </div>

          {/* Would work again */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="would-work-again"
              checked={wouldWorkAgain}
              onCheckedChange={(checked) => setWouldWorkAgain(checked as boolean)}
            />
            <Label
              htmlFor="would-work-again"
              className="text-sm font-normal cursor-pointer"
            >
              ✅ Trabajaría con {toMember.nombre} otra vez
            </Label>
          </div>

          {/* Anonymous */}
          <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
              🎭 Enviar feedback de forma anónima
            </Label>
          </div>

          {/* Warning si no completó todo */}
          {!allRatingsComplete && (
            <Alert variant="default" className="border-yellow-500">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                Por favor completa todos los ratings antes de enviar
              </AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full gap-2"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send size={16} />
                Enviar Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
