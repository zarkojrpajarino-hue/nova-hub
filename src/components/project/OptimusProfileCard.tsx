/**
 * OP28.5 — OptimusProfileCard
 *
 * Muestra perfil personalizado de Optimus al founder.
 * Si no hay perfil: t('project.daFeedbackParaPersonalizar')
 * Si hay: muestra preferencias derivadas.
 */

import { Brain, ThumbsUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SourceBadge } from '@/components/shared/SourceBadge';

import { useTranslation } from 'react-i18next';
interface OptimusProfileCardProps {
  projectId: string;
}

const DEPTH_LABELS: Record<string, string> = {
  conciso: t('project.respuestasConcisasYDirectas'),
  equilibrado: t('project.balanceEntreDetalleY'),
  detallado: t('project.respuestasDetalladasConContexto'),
};

const RISK_LABELS: Record<string, string> = {
  conservador: t('project.conservadorPrefiereSeguridad'),
  moderado: t('project.moderadoEquilibraRiesgoY'),
  agresivo: t('project.agresivoAbiertoAApuestas'),
};

const STYLE_LABELS: Record<string, string> = {
  default: t('project.estándar'),
  'más específico': t('project.específicoQuierePasosConcretos'),
  'más estratégico': t('project.estratégicoQuiereVisiónDe'),
  'más motivacional': t('project.motivacionalQuiereEmpujeY'),
};

export function OptimusProfileCard({ projectId }: OptimusProfileCardProps) {
  const { t } = useTranslation();
  const { data: profile } = useQuery({
    queryKey: ['optimus-profile', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('optimus_profile')
        .select('preferred_depth, risk_tolerance, response_style, total_feedbacks, updated_at')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!profile) {
    return (
      <div className="bg-muted/30 rounded-lg p-3 text-center">
        <Brain className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
        <p className="text-xs font-medium">{t('project.optimusEstáAprendiendo')}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{t('project.daFeedbackEnLas')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-blue-500" />
        <span className="text-xs font-semibold">{t('project.optimusTeConoce')}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {profile.total_feedbacks} feedbacks
        </span>
        <SourceBadge type="inferred" source={t('transparency.optimusIA')} reliability={0.4} size="sm" />
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ThumbsUp className="h-3 w-3 shrink-0" />
          <span>{DEPTH_LABELS[profile.preferred_depth] ?? profile.preferred_depth}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThumbsUp className="h-3 w-3 shrink-0" />
          <span>{RISK_LABELS[profile.risk_tolerance] ?? profile.risk_tolerance}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThumbsUp className="h-3 w-3 shrink-0" />
          <span>{STYLE_LABELS[profile.response_style] ?? profile.response_style}</span>
        </div>
      </div>
    </div>
  );
}
