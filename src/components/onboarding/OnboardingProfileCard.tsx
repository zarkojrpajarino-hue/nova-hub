/**
 * ONBOARDING PROFILE CARD
 *
 * O5.8 — Tarjeta t('onboarding.perfilOperativoDetectado') al terminar onboarding.
 *
 * Display only — no escribe en project_economic_profile.
 * (La escritura corresponde al EconomicProfileForm o al weekly engine.)
 *
 * Señal: FaseAAnswers.monetization_type (detectada en Q7).
 * Presentación: t('onboarding.estimaciónInicial0') — no diagnóstico definitivo.
 * El usuario ve las 3 expectativas operativas que el engine va a rastrear.
 */

import { Repeat, TrendingUp, Briefcase, FileSignature, Compass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FaseAAnswers } from './fast-start/FaseACommon';

import { useTranslation } from 'react-i18next';
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

function getProfiles(t: (k: string) => string): Record<ProfileType, ProfileConfig> {
  return {
    subscription: {
      name: t('onboarding.modeloDeSuscripción'),
      Icon: Repeat,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      description: t('onboarding.ingresosRecurrentesElMrr'),
      expectations: [
        t('onboarding.elEngineRastrearáTu'),
        t('onboarding.laRetenciónPesaMás'),
        t('onboarding.cadaClienteQuePierdes'),
      ],
    },
    transactional: {
      name: t('onboarding.modeloTransaccional'),
      Icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      description: t('onboarding.ingresosPorOperaciónVolumen'),
      expectations: [
        t('onboarding.elEngineRastrearáTu1'),
        t('onboarding.elTicketPromedioDetermina'),
        t('onboarding.laAdquisiciónConstanteEs'),
      ],
    },
    high_ticket: {
      name: t('onboarding.servicioDeAltoValor'),
      Icon: Briefcase,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      description: t('onboarding.ventasDeAltoTicket'),
      expectations: [
        t('onboarding.pocasVentasConAlto'),
        t('onboarding.elEngineAlertaráSi'),
        t('onboarding.concentraciónDeClienteEs'),
      ],
    },
    contract: {
      name: t('onboarding.modeloPorContrato'),
      Icon: FileSignature,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      description: t('onboarding.ingresosPorContratosO'),
      expectations: [
        t('onboarding.laPrevisibilidadDeIngresos'),
        t('onboarding.elEngineVigilaráConcentración'),
        t('onboarding.expansiónDeCuentasExistentes'),
      ],
    },
    exploring: {
      name: t('onboarding.modeloEnExploración'),
      Icon: Compass,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      description: t('onboarding.todavíaNoHayUn'),
      expectations: [
        t('onboarding.elEngineTrabajaráCon'),
        t('onboarding.sinModeloClaroSe'),
        t('onboarding.defineTuTipoDe'),
      ],
    },
  };
}

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
  const { t } = useTranslation();
  const PROFILES = getProfiles(t);
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
              <Badge variant="secondary" className="text-xs font-normal shrink-0">{t('onboarding.estimaciónInicial')}</Badge>
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
          <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{t('onboarding.completaTuPerfilOperativo')}</p>
        )}
      </CardContent>
    </Card>
  );
}
