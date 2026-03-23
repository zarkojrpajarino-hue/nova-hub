/**
 * INSTANT DIAGNOSTIC — Post-onboarding card
 *
 * Muestra 3 insights estáticos basados en las respuestas del onboarding.
 * No requiere llamada IA — los insights son hardcoded por industry/stage/team_size.
 * Se muestra entre el onboarding y el dashboard.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InstantDiagnosticProps {
  industry?: string;
  teamSize: number;
  generatesRevenue: boolean;
  onGoDashboard: () => void;
  onConnectTools: () => void;
}

// ── Static insight data ─────────────────────────────────────────────────────

function getIndustryInsight(industry: string | undefined): { pct: number; reason: string } {
  const normalized = (industry || '').toLowerCase();
  if (normalized.includes('saas') || normalized.includes('software'))
    return { pct: 70, reason: 'falta de product-market fit' };
  if (normalized.includes('ecommerce') || normalized.includes('retail'))
    return { pct: 65, reason: 'altos costos de adquisicion de clientes' };
  if (normalized.includes('fintech') || normalized.includes('finance'))
    return { pct: 75, reason: 'regulacion y compliance' };
  if (normalized.includes('health') || normalized.includes('salud'))
    return { pct: 72, reason: 'ciclos de venta largos y regulacion' };
  if (normalized.includes('edtech') || normalized.includes('educacion'))
    return { pct: 68, reason: 'dificultad para monetizar' };
  if (normalized.includes('market') || normalized.includes('marketplace'))
    return { pct: 73, reason: 'el problema del chicken-and-egg' };
  // default
  return { pct: 67, reason: 'falta de traccion inicial' };
}

function getTeamRisk(teamSize: number): string {
  if (teamSize === 1) return 'burnout y falta de feedback externo';
  if (teamSize <= 3) return 'distribucion ineficiente de responsabilidades';
  if (teamSize <= 7) return 'comunicacion desalineada entre roles';
  return 'coordinacion y prioridades difusas';
}

function getStagePriority(generatesRevenue: boolean): string {
  if (generatesRevenue) return 'retener clientes existentes y aumentar LTV';
  return 'validar demanda real antes de construir';
}

// ── Component ───────────────────────────────────────────────────────────────

export function InstantDiagnostic({
  industry,
  teamSize,
  generatesRevenue,
  onGoDashboard,
  onConnectTools,
}: InstantDiagnosticProps) {
  const { t } = useTranslation();

  const industryInsight = getIndustryInsight(industry);
  const teamRisk = getTeamRisk(teamSize);
  const stagePriority = getStagePriority(generatesRevenue);

  const insights = [
    {
      label: t('onboarding.basadoEnTuIndustria'),
      text: t('onboarding.enTuSectorEl', { pct: industryInsight.pct, reason: industryInsight.reason }),
    },
    {
      label: t('onboarding.basadoEnTuEquipo'),
      text: t('onboarding.conEquipoDe', { size: teamSize, risk: teamRisk }),
    },
    {
      label: t('onboarding.basadoEnTuFase'),
      text: t('onboarding.enTuFasePrioriza', { priority: stagePriority }),
    },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Lightbulb className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">
          {t('onboarding.diagnosticoInstantaneo')}
        </h2>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <Card key={idx} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-4 px-5">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                {insight.label}
              </p>
              <p className="text-sm text-gray-700">{insight.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={onGoDashboard} className="flex-1 gap-2">
          {t('onboarding.irAlDashboard')}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onConnectTools} className="gap-2">
          <Link2 className="h-4 w-4" />
          {t('onboarding.conectarHerramientas')}
        </Button>
      </div>
    </div>
  );
}
