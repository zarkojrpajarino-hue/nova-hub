/**
 * SELF EVALUATION MODAL
 *
 * Modal para auto-evaluación al finalizar período de exploración
 * - Ratings de confianza y disfrute
 * - Comentarios sobre la experiencia
 * - ¿Quiere continuar en el rol?
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FeedbackStarRating } from './FeedbackStarRating';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';

import { useTranslation } from 'react-i18next';
interface SelfEvaluationModalProps {
  open: boolean;
  onClose: () => void;
  exploration: {
    id: string;
    role: string;
    member_id: string;
  };
  projectName: string;
}

export function SelfEvaluationModal({
  open,
  onClose,
  exploration,
  projectName,
}: SelfEvaluationModalProps) {
  const { t } = useTranslation();
  const [confidence, setConfidence] = useState(0);
  const [enjoyment, setEnjoyment] = useState(0);
  const [strengths, setStrengths] = useState('');
  const [challenges, setChallenges] = useState('');
  const [wantsToContinue, setWantsToContinue] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = confidence > 0 && enjoyment > 0 && strengths.trim().length >= 20;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(t('feedback.porFavorCompletaTodos'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Calcular self rating promedio
      const selfRating = (confidence + enjoyment) / 2;

      // Actualizar el período de exploración
      const { error } = await supabase
        .from('role_exploration_periods')
        .update({
          self_rating: selfRating,
          wants_to_continue: wantsToContinue,
          notes: JSON.stringify({
            confidence,
            enjoyment,
            strengths,
            challenges,
            wantsToContinue,
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', exploration.id);

      if (error) throw error;

      toast.success(t('feedback.autoevaluaciónCompletada'));

      // Llamar a la edge function para calcular fit score
      try {
        await supabase.functions.invoke('calculate-fit-score', {
          body: { exploration_period_id: exploration.id },
        });
      } catch (_err) {
        // No bloqueamos el submit si falla el cálculo
      }

      onClose();
    } catch (_error) {
      toast.error(t('feedback.errorAlGuardarLa'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl capitalize">
            Auto-Evaluación: {exploration.role}
          </DialogTitle>
          <DialogDescription>{projectName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Confidence Rating */}
          <FeedbackStarRating
            label={t('feedback.quéTanSeguroTe')}
            description={t('feedback.tuNivelDeConfianza')}
            value={confidence}
            onChange={setConfidence}
            required
          />

          {/* Enjoyment Rating */}
          <FeedbackStarRating
            label={t('feedback.cuántoDisfrutasteEsteRol')}
            description={t('feedback.quéTanSatisfechoEstás')}
            value={enjoyment}
            onChange={setEnjoyment}
            required
          />

          {/* Strengths */}
          <div className="space-y-2">
            <Label htmlFor="strengths">
              ¿Qué hiciste bien? ¿Cuáles son tus fortalezas en este rol?{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="strengths"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder={t('feedback.ejemploMeSentíMuy')}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              {strengths.length}/20 caracteres mínimo
            </p>
          </div>

          {/* Challenges */}
          <div className="space-y-2">
            <Label htmlFor="challenges">{t('feedback.quéTeResultóDifícil')}</Label>
            <Textarea
              id="challenges"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder={t('feedback.ejemploMeCostóOrganizar')}
              rows={4}
            />
          </div>

          {/* Wants to continue */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
            <Checkbox
              id="continue"
              checked={wantsToContinue}
              onCheckedChange={(checked) => setWantsToContinue(checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="continue" className="text-base font-medium cursor-pointer">
                {wantsToContinue ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={20} />{t('feedback.quieroContinuarEnEste')}</span>
                ) : (
                  <span className="flex items-center gap-2 text-red-600">
                    <XCircle size={20} />{t('feedback.prefieroProbarOtroRol')}</span>
                )}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {wantsToContinue
                  ? t('feedback.serásConsideradoParaEste')
                  : t('feedback.teAyudaremosAEncontrar')}
              </p>
            </div>
          </div>

          {/* Promedio */}
          {confidence > 0 && enjoyment > 0 && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tu Promedio de Auto-Evaluación:</span>
                <span className="text-2xl font-bold text-primary">
                  {((confidence + enjoyment) / 2).toFixed(1)}/5.0
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>{t('feedback.cancelar')}</Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Guardando...': t('feedback.completarEvaluación')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
