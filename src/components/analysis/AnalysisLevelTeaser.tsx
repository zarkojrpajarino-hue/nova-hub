/**
 * AnalysisLevelTeaser — F20.10
 *
 * Muestra los requisitos para desbloquear el siguiente nivel de análisis.
 * Aparece dentro del dashboard donde estaría el nivel bloqueado.
 * No es un overlay bloqueante — el nivel actual es completamente visible.
 */

import { CheckCircle2, Clock, Plug, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import type { NextLevelRequirements } from '@/hooks/useProjectAnalysis';

import { useTranslation } from 'react-i18next';
interface AnalysisLevelTeaserProps {
  targetLevel: 2 | 3;
  requirements: NextLevelRequirements;
}

interface Requirement {
  label: string;
  met: boolean;
  icon: React.ReactNode;
  cta?: { label: string; action: () => void };
}

export function AnalysisLevelTeaser({ targetLevel, requirements }: AnalysisLevelTeaserProps) {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const reqs: Requirement[] = [];

  if (requirements.days_needed !== undefined && requirements.days_needed > 0) {
    reqs.push({
      label: `${requirements.days_needed} día${requirements.days_needed !== 1 ? 's' : ''} más de actividad`,
      met: false,
      icon: <Clock className="h-4 w-4" />,
    });
  }

  if (requirements.needs_integration) {
    reqs.push({
      label: 'Conectar al menos 1 integración (Stripe o HubSpot)',
      met: false,
      icon: <Plug className="h-4 w-4" />,
      cta: {
        label: t('analysis.conectarIntegración'),
        action: () => navigate(`/proyecto/${projectId}/integrations`),
      },
    });
  }

  if (requirements.needs_more_integrations) {
    reqs.push({
      label: '2 integraciones activas',
      met: false,
      icon: <Plug className="h-4 w-4" />,
      cta: {
        label: t('analysis.conectarOtraIntegración'),
        action: () => navigate(`/proyecto/${projectId}/integrations`),
      },
    });
  }

  if (requirements.needs_decisions !== undefined && requirements.needs_decisions > 0) {
    reqs.push({
      label: `${requirements.needs_decisions} decisión${requirements.needs_decisions !== 1 ? 'es' : ''} estratégica${requirements.needs_decisions !== 1 ? 's' : ''} más registradas`,
      met: false,
      icon: <TrendingUp className="h-4 w-4" />,
    });
  }

  const levelLabels: Record<number, string> = {
    2: t('analysis.nivel2PulsoFinanciero'),
    3: t('analysis.nivel3SeñalesCruzadas'),
  };

  return (
    <Card className="border-dashed border-gray-200 bg-gray-50/50 dark:bg-gray-900/30">
      <CardContent className="py-6">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <span className="text-sm font-bold text-gray-400">{targetLevel}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              {levelLabels[targetLevel]}
            </p>
            <ul className="space-y-2">
              {reqs.map((req, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <span className={req.met ? 'text-green-500' : 'text-gray-400'}>
                    {req.met ? <CheckCircle2 className="h-4 w-4" /> : req.icon}
                  </span>
                  <span className={req.met ? 'text-gray-500 line-through' : 'text-gray-600'}>
                    {req.label}
                  </span>
                  {req.cta && !req.met && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs ml-auto"
                      onClick={req.cta.action}
                    >
                      {req.cta.label}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
