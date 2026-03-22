/**
 * FIRST STEPS PANEL
 *
 * O5.9 — Bridge onboarding → primer valor.
 *
 * Aparece una sola vez en el proyecto después de completar el onboarding.
 * Se descarta vía botón X → escribe `first_15_shown: true` en onboarding_data.
 *
 * 3 acciones priorizadas:
 *   1. Referencia al Next Action del motor (sin duplicar el botón del panel lateral)
 *   2. Acción de validación — según hypothesis_maturity + riskiest_assumption (O5.5)
 *   3. Acción operativa — según monetization_type (FaseA Q7)
 *
 * Fuentes:
 *   - onboarding_data.fast_start_completed     — condición de aparición
 *   - onboarding_data.first_15_shown           — flag de descarte
 *   - onboarding_data.hypothesis_maturity      — 'none'|'partial'|'structured'
 *   - onboarding_data.riskiest_assumption      — string libre
 *   - onboarding_data.fase_a_answers.monetization_type
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Zap, FlaskConical, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

type HypothesisMaturity = 'none' | 'partial' | 'structured' | null;
type MonetizationType = 'transaccional' | 'suscripcion' | 'ticket_alto' | 'contrato' | null;

interface PanelData {
  hypothesisMaturity: HypothesisMaturity;
  riskiestAssumption: string | null;
  monetizationType: MonetizationType;
}

// ── Action 2 — Validación ────────────────────────────────────────────────────
function getValidationAction(maturity: HypothesisMaturity, riskiest: string | null, t: (key: string, opts?: Record<string, unknown>) => string) {
  switch (maturity) {
    case 'none':
      return {
        title: t('project.defineTuHipótesisAntes'),
        body: t('project.tienesUnaDirecciónPero'),
        highlight: riskiest ? t('firstSteps.riskiestAssumption', { assumption: riskiest }) : null,
      };
    case 'partial':
      return {
        title: t('project.refinaTuHipótesisEn'),
        body: t('project.tuHipótesisEstáEn'),
        highlight: riskiest ? t('firstSteps.assumptionToValidate', { assumption: riskiest }) : null,
      };
    case 'structured':
      return {
        title: t('project.validaTuHipótesisCon'),
        body: t('project.tuHipótesisEstáFormada'),
        highlight: null,
      };
    default:
      return {
        title: t('project.defineTuHipótesisDe'),
        body: t('project.antesDeCrearObvs'),
        highlight: null,
      };
  }
}

// ── Action 3 — Operativa ─────────────────────────────────────────────────────
function getOperationalAction(monetization: MonetizationType) {
  switch (monetization) {
    case 'suscripcion':
      return {
        title: t('project.consigueTuPrimerUsuario'),
        body: t('project.aunqueSeaGratisEs'),
      };
    case 'transaccional':
      return {
        title: 'Registra tu primer contacto en el CRM',
        body: t('project.identificaYAñadeTu'),
      };
    case 'ticket_alto':
      return {
        title: t('project.identifica23ClientesDe'),
        body: t('project.lasVentasDeAlto'),
      };
    case 'contrato':
      return {
        title: t('project.documentaElProblemaDe'),
        body: t('project.unContratoEmpiezaCon'),
      };
    default:
      return {
        title: t('project.completaTuPerfilOperativo'),
        body: t('project.sinModeloDeMonetización'),
      };
  }
}

interface FirstStepsPanelProps {
  projectId: string;
  onNavigateToTab?: (tab: string) => void;
}

export function FirstStepsPanel({ projectId, onNavigateToTab }: FirstStepsPanelProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState<boolean | null>(null); // null = cargando
  const [data, setData] = useState<PanelData | null>(null);

  useEffect(() => {
    supabase
      .from('projects')
      .select('onboarding_data')
      .eq('id', projectId)
      .single()
      .then(({ data: row }) => {
        const od = (row?.onboarding_data ?? {}) as Record<string, unknown>;

        // Solo mostrar si Fast Start completado y no descartado
        if (od.fast_start_completed !== true || od.first_15_shown === true) {
          setVisible(false);
          return;
        }

        const faseA = (od.fase_a_answers ?? {}) as Record<string, unknown>;
        setData({
          hypothesisMaturity: (od.hypothesis_maturity as HypothesisMaturity) ?? null,
          riskiestAssumption: (od.riskiest_assumption as string) ?? null,
          monetizationType: (faseA.monetization_type as MonetizationType) ?? null,
        });
        setVisible(true);
      });
  }, [projectId]);

  const dismiss = async () => {
    setVisible(false); // UI inmediato
    try {
      const { data: row } = await supabase
        .from('projects')
        .select('onboarding_data')
        .eq('id', projectId)
        .single();
      const od = (row?.onboarding_data ?? {}) as Record<string, unknown>;
      await supabase
        .from('projects')
        .update({ onboarding_data: { ...od, first_15_shown: true } as unknown as Json })
        .eq('id', projectId);
    } catch {
      // Silent fail: el dismiss ya está en UI; si falla el write, el panel
      // puede reaparecer en el siguiente reload — aceptable.
    }
  };

  if (!visible || !data) return null;

  const validationAction = getValidationAction(data.hypothesisMaturity, data.riskiestAssumption, t);
  const operationalAction = getOperationalAction(data.monetizationType);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base">{t('firstSteps.title')}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={dismiss}
          aria-label={t('project.marcarComoVisto')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 3 acciones */}
      <div className="grid grid-cols-3 gap-4">
        {/* Acción 1 — Referencia al motor */}
        <ActionBlock
          number={1}
          icon={Zap}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          title={t('firstSteps.nextAction')}
          body={t('firstSteps.nextActionDesc')}
          highlight={null}
          ctaLabel={t('firstSteps.viewTasks')}
          onCTA={onNavigateToTab ? () => onNavigateToTab('tareas') : undefined}
        />

        {/* Acción 2 — Validación por hipótesis */}
        <ActionBlock
          number={2}
          icon={FlaskConical}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          title={validationAction.title}
          body={validationAction.body}
          highlight={validationAction.highlight}
          ctaLabel={t('firstSteps.createValidation')}
          onCTA={onNavigateToTab ? () => onNavigateToTab('obvs') : undefined}
        />

        {/* Acción 3 — Operativa por monetización */}
        <ActionBlock
          number={3}
          icon={Target}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          title={operationalAction.title}
          body={operationalAction.body}
          highlight={null}
          ctaLabel={t('firstSteps.viewCRM')}
          onCTA={onNavigateToTab ? () => onNavigateToTab('crm') : undefined}
        />
      </div>
    </div>
  );
}

// ── Sub-componente reutilizable ───────────────────────────────────────────────
interface ActionBlockProps {
  number: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  highlight: string | null;
  ctaLabel?: string;
  onCTA?: () => void;
}

function ActionBlock({ number, icon: Icon, iconColor, iconBg, title, body, highlight, ctaLabel, onCTA }: ActionBlockProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2.5 p-4 bg-background rounded-xl">
      <div className="flex items-center gap-2">
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{t('firstSteps.step', { number })}</span>
      </div>
      <p className="text-sm font-semibold leading-snug">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
      {highlight && (
        <p className={cn('text-xs px-2.5 py-1.5 rounded-md italic', 'bg-blue-50 text-blue-800')}>
          {highlight}
        </p>
      )}
      {ctaLabel && onCTA && (
        <Button size="sm" variant="outline" className="mt-1 text-xs h-7" onClick={onCTA}>
          {ctaLabel} →
        </Button>
      )}
    </div>
  );
}
