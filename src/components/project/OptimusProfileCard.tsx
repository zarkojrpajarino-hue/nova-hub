/**
 * OP28.5 — OptimusProfileCard
 *
 * Muestra perfil personalizado de Optimus al founder.
 * Si no hay perfil: "Da feedback para personalizar."
 * Si hay: muestra preferencias derivadas.
 */

import { Brain, ThumbsUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OptimusProfileCardProps {
  projectId: string;
}

const DEPTH_LABELS: Record<string, string> = {
  conciso: 'Respuestas concisas y directas',
  equilibrado: 'Balance entre detalle y brevedad',
  detallado: 'Respuestas detalladas con contexto',
};

const RISK_LABELS: Record<string, string> = {
  conservador: 'Conservador — prefiere seguridad',
  moderado: 'Moderado — equilibra riesgo y oportunidad',
  agresivo: 'Agresivo — abierto a apuestas fuertes',
};

const STYLE_LABELS: Record<string, string> = {
  default: 'Estándar',
  'más específico': 'Específico — quiere pasos concretos',
  'más estratégico': 'Estratégico — quiere visión de alto nivel',
  'más motivacional': 'Motivacional — quiere empuje y energía',
};

export function OptimusProfileCard({ projectId }: OptimusProfileCardProps) {
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
        <p className="text-xs font-medium">Optimus está aprendiendo</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Da feedback (👍/👎) en las recomendaciones para personalizar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-blue-500" />
        <span className="text-xs font-semibold">Optimus te conoce</span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {profile.total_feedbacks} feedbacks
        </span>
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
