/**
 * ONBOARDING PROFILE CARD
 *
 * O5.8 — Tarjeta "Perfil Operativo Detectado" al terminar onboarding.
 *
 * Display only — no escribe en project_economic_profile.
 * (La escritura corresponde al EconomicProfileForm o al weekly engine.)
 *
 * Señal: FaseAAnswers.monetization_type (detectada en Q7).
 * Presentación: "Estimación inicial" — no diagnóstico definitivo.
 * El usuario ve las 3 expectativas operativas que el engine va a rastrear.
 */

import { Repeat, TrendingUp, Briefcase, FileSignature, Compass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FaseAAnswers } from './fast-start/FaseACommon';

type ProfileType = 'subscription' | 'transactional' | 'high_ticket' | 'contract' | 'exploring';

interface ProfileConfig {
  name: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  description: string;
  expectations: string[];
}

const PROFILES: Record<ProfileType, ProfileConfig> = {
  subscription: {
    name: 'Modelo de Suscripción',
    Icon: Repeat,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: 'Ingresos recurrentes. El MRR y la retención son tus métricas clave.',
    expectations: [
      'El engine rastreará tu MRR y tasa de churn',
      'La retención pesa más que la adquisición en tu fase actual',
      'Cada cliente que pierdes tiene coste compuesto — el churn debe medirse',
    ],
  },
  transactional: {
    name: 'Modelo Transaccional',
    Icon: TrendingUp,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    description: 'Ingresos por operación. Volumen y conversión son tu motor.',
    expectations: [
      'El engine rastreará tu pipeline y tasa de conversión',
      'El ticket promedio determina cuántas operaciones necesitas para cubrir costes',
      'La adquisición constante es crítica — sin ella los ingresos se detienen',
    ],
  },
  high_ticket: {
    name: 'Servicio de Alto Valor',
    Icon: Briefcase,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    description: 'Ventas de alto ticket, ciclo largo. Las referencias y la confianza son tu canal.',
    expectations: [
      'Pocas ventas con alto impacto — cada operación cerrada es crítica',
      'El engine alertará si tu pipeline de propuestas activas se vacía',
      'Concentración de cliente es tu principal riesgo estructural',
    ],
  },
  contract: {
    name: 'Modelo por Contrato',
    Icon: FileSignature,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    description: 'Ingresos por contratos o proyectos. Renovación y expansión de cuentas son clave.',
    expectations: [
      'La previsibilidad de ingresos es tu ventaja estructural',
      'El engine vigilará concentración de cliente y tasa de renovación',
      'Expansión de cuentas existentes suele ser más eficiente que adquisición nueva',
    ],
  },
  exploring: {
    name: 'Modelo en Exploración',
    Icon: Compass,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    description: 'Todavía no hay un modelo de monetización definido. Es el momento de explorarlo.',
    expectations: [
      'El engine trabajará con señales de actividad mientras defines tu modelo',
      'Sin modelo claro, se aplican métricas genéricas de fase — menos precisas',
      'Define tu tipo de monetización en el panel de perfil operativo',
    ],
  },
};

function detectProfile(faseA: FaseAAnswers): ProfileType {
  switch (faseA.monetization_type) {
    case 'suscripcion':   return 'subscription';
    case 'transaccional': return 'transactional';
    case 'ticket_alto':   return 'high_ticket';
    case 'contrato':      return 'contract';
    default:              return 'exploring';
  }
}

interface OnboardingProfileCardProps {
  faseAAnswers: FaseAAnswers;
}

export function OnboardingProfileCard({ faseAAnswers }: OnboardingProfileCardProps) {
  const profileType = detectProfile(faseAAnswers);
  const { name, Icon, color, bg, border, description, expectations } = PROFILES[profileType];

  return (
    <Card className={`border-2 ${border} w-full`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{name}</CardTitle>
              <Badge variant="secondary" className="text-xs font-normal shrink-0">
                Estimación inicial
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="space-y-1.5">
          {expectations.map((exp, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
              <span className={`mt-0.5 shrink-0 font-bold ${color}`}>·</span>
              <span>{exp}</span>
            </div>
          ))}
        </div>
        {profileType === 'exploring' && (
          <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
            Completa tu perfil operativo en el panel de configuración para análisis más precisos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
