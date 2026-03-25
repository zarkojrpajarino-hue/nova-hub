import { useState } from 'react';
import { Loader2, AlertTriangle, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EvidenceUrlInput } from '@/components/evidence/EvidenceUrlInput';
import { useCanUpload } from '@/hooks/useValidationSystem';

import { useTranslation } from 'react-i18next';
interface KPIUploadFormProps {
  type: 'lp' | 'bp' | 'cp';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_LABEL_KEYS = {
  lp: 'kpi.learningPath',
  bp: 'kpi.bookPoint',
  cp: 'kpi.communityPoint',
};

const TYPE_PLACEHOLDER_KEYS = {
  lp: {
    titulo: '',  // literal: 'Ej: Design Thinking - IDEO'
    descripcion: 'kpi.describeQuéAprendisteY',
  },
  bp: {
    titulo: 'kpi.ejLeanStartupEric',
    descripcion: 'kpi.resumeLosPuntosClave',
  },
  cp: {
    titulo: 'kpi.ejMentoringConJuan',
    descripcion: 'kpi.describeBrevementeLaActividad',
  },
};

const TYPE_LITERAL_TITLES: Record<string, string> = {
  lp: 'Ej: Design Thinking - IDEO',
};

export function KPIUploadForm({ type, open, onOpenChange }: KPIUploadFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { isBlocked } = useCanUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    evidenceUrl: '',
    bpPoints: 1, // Número de book points
  });

  // CP no necesita validación ni evidencia
  // BP necesita número de puntos + evidencia + validación
  // LP necesita evidencia + validación (siempre 1 punto)
  const needsValidation = type !== 'cp';
  const needsEvidence = type !== 'cp';

  const handleSubmit = async () => {
    if (!profile?.id) {
      toast.error(t('kpi.debesIniciarSesión'));
      return;
    }

    if (!formData.titulo.trim()) {
      toast.error(t('kpi.elTítuloEsObligatorio'));
      return;
    }

    // Para BP, validar que los puntos sean al menos 1
    if (type === 'bp' && formData.bpPoints < 1) {
      toast.error('Los Book Points deben ser al menos 1');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determinar puntos y status según el tipo
      let points = 1;
      const status: 'pending' | 'validated' = needsValidation ? 'pending' : 'validated';

      if (type === 'bp') {
        points = formData.bpPoints;
      } else if (type === 'cp') {
        points = 1; // CP siempre 1 punto
      }

      const { error } = await supabase.from('kpis').insert({
        owner_id: profile.id,
        type,
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        evidence_url: needsEvidence ? (formData.evidenceUrl || null) : null,
        cp_points: points,
        status,
        validated_at: !needsValidation ? new Date().toISOString() : null,
      });

      if (error) throw error;

      if (needsValidation) {
        toast.success(`${t(TYPE_LABEL_KEYS[type])} enviado a validación`);
      } else {
        toast.success(`${t(TYPE_LABEL_KEYS[type])} registrado (+${points} punto${points > 1 ? 's' : ''})`);
      }

      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['my_kpis'] });
      queryClient.invalidateQueries({ queryKey: ['pending_kpis'] });
      queryClient.invalidateQueries({ queryKey: ['member_stats'] });
      
      setFormData({ titulo: '', descripcion: '', evidenceUrl: '', bpPoints: 1 });
      onOpenChange(false);
    } catch (_error) {
      toast.error('Error al crear el KPI');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'bp': return <BookOpen className="w-5 h-5 text-success" />;
      case 'cp': return <Users className="w-5 h-5 text-pink-500" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            Nuevo {t(TYPE_LABEL_KEYS[type])}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Bloqueo solo aplica a tipos que necesitan validación */}
          {isBlocked && needsValidation && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('kpi.estásBloqueado')}</AlertTitle>
              <AlertDescription>{t('kpi.noPuedesSubirKpis')}</AlertDescription>
            </Alert>
          )}

          {/* Info especial para CP */}
          {type === 'cp' && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertTitle>{t('kpi.communityPoints')}</AlertTitle>
              <AlertDescription>{t('kpi.losCpSeSuman')}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="kpi-titulo">Título *</Label>
            <Input
              id="kpi-titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder={TYPE_LITERAL_TITLES[type] ?? t(TYPE_PLACEHOLDER_KEYS[type].titulo)}
              disabled={isBlocked && needsValidation}
            />
          </div>

          <div>
            <Label htmlFor="kpi-descripcion">{t('kpi.descripción')}</Label>
            <Textarea
              id="kpi-descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder={t(TYPE_PLACEHOLDER_KEYS[type].descripcion)}
              rows={3}
            />
          </div>

          {/* Campo de Book Points (solo para BP) */}
          {type === 'bp' && (
            <div>
              <Label htmlFor="kpi-bp-points">Número de Book Points *</Label>
              <Input
                id="kpi-bp-points"
                type="number"
                min={1}
                max={10}
                value={formData.bpPoints}
                onChange={(e) => setFormData({ ...formData, bpPoints: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground mt-1">{t('kpi.esteLibroOtorgará')}<span className="font-semibold text-success">{formData.bpPoints} BP</span> al ser validado
              </p>
            </div>
          )}

          {/* Evidencia solo para LP y BP */}
          {needsEvidence && (
            <EvidenceUrlInput
              value={formData.evidenceUrl}
              onChange={(value) => setFormData({ ...formData, evidenceUrl: value })}
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >{t('kpi.cancelar')}</Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || (isBlocked && needsValidation)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {needsValidation ? 'Enviando...': t('kpi.guardando')}
                </>
              ) : (isBlocked && needsValidation) ? (
                t('kpi.bloqueado')
              ) : needsValidation ? (
                t('kpi.enviarAValidación')
              ) : (
                `Registrar (+1 CP)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
