/**
 * FASE A — Preguntas comunes obligatorias (Q2-Q10)
 *
 * Tronco común de FastStartWizard. Se ejecuta antes del path-specific.
 * Q1 ya fue respondida (selección de tipo en SelectOnboardingTypePage).
 * Progreso visible: "Pregunta 2 de 10" … "Pregunta 10 de 10".
 *
 * No persiste por paso — FastStartWizard hace el save intermedio al completar.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface FaseAAnswers {
  generates_revenue: boolean;
  mrr_monthly: number | null;
  active_customers: number | null;
  team_size: number;
  avg_ticket: number | null;
  sales_cycle: 'days' | 'weeks' | 'months' | 'quarters' | null;
  monetization_type: 'transaccional' | 'suscripcion' | 'ticket_alto' | 'contrato' | null;
  location_country: string;
  market_scope: 'local' | 'nacional' | 'global';
  goal_90d: string;
}

interface FaseACommonProps {
  onComplete: (answers: FaseAAnswers) => void;
}

const TOTAL_QUESTIONS = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Radio option component
// ─────────────────────────────────────────────────────────────────────────────
function RadioOption({
  value,
  selected,
  label,
  onSelect,
}: {
  value: string;
  selected: boolean;
  label: string;
  onSelect: (v: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
        ${selected
          ? 'border-blue-500 bg-blue-50 text-blue-900'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
        }`}
    >
      <span className="flex items-center gap-2">
        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
          ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
          {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
        </span>
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function FaseACommon({ onComplete }: FaseACommonProps) {
  // step 1 = Q2, step 9 = Q10
  const [currentStep, setCurrentStep] = useState(1);
  const [goalIsOther, setGoalIsOther] = useState(false);
  const [goalOtroText, setGoalOtroText] = useState('');

  const [answers, setAnswers] = useState<FaseAAnswers>({
    generates_revenue: false,
    mrr_monthly: null,
    active_customers: null,
    team_size: 1,
    avg_ticket: null,
    sales_cycle: null,
    monetization_type: null,
    location_country: '',
    market_scope: 'local',
    goal_90d: '',
  });

  const set = <K extends keyof FaseAAnswers>(key: K, value: FaseAAnswers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  // ───────────────────────────── Validation per step ──────────────────────────
  const canAdvance = (): boolean => {
    switch (currentStep) {
      case 1: // Q2: revenue — always valid (has default false)
        return true;
      case 2: // Q3: customers — number field, default null; allow null (0 is valid)
        return answers.active_customers !== null && answers.active_customers >= 0;
      case 3: // Q4: team_size
        return answers.team_size >= 1;
      case 4: // Q5: avg_ticket — null allowed ("no lo sé")
        return true;
      case 5: // Q6: sales_cycle — null allowed
        return true;
      case 6: // Q7: monetization_type — null allowed
        return true;
      case 7: // Q8: country — required
        return answers.location_country.trim().length >= 2;
      case 8: // Q9: market_scope — always has a value (default 'local')
        return true;
      case 9: // Q10: goal_90d — required
        return answers.goal_90d.trim().length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    if (currentStep === 9) {
      onComplete(answers);
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // ───────────────────────────── Render helpers ───────────────────────────────
  const questionNumber = currentStep + 1; // Q2 = step 1 → display "2"
  const progressPct = (questionNumber / TOTAL_QUESTIONS) * 100;

  const renderStep = () => {
    switch (currentStep) {
      // ── Q2: ¿Generas ingresos? ────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿Generas ingresos hoy?
            </h2>
            <div className="space-y-2">
              <RadioOption
                value="yes"
                selected={answers.generates_revenue === true}
                label="Sí, tengo ingresos"
                onSelect={() => set('generates_revenue', true)}
              />
              <RadioOption
                value="no"
                selected={answers.generates_revenue === false}
                label="No, aún no genero ingresos"
                onSelect={() => {
                  set('generates_revenue', false);
                  set('mrr_monthly', null);
                }}
              />
            </div>
            {answers.generates_revenue && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium text-gray-700">
                  ¿Cuánto al mes? (MRR aproximado)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="ej. 2000"
                    className="pl-7"
                    value={answers.mrr_monthly ?? ''}
                    onChange={(e) =>
                      set('mrr_monthly', e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        );

      // ── Q3: Clientes activos ───────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿Cuántos clientes activos tienes?
            </h2>
            <p className="text-sm text-gray-500">Pon 0 si aún no tienes clientes.</p>
            <Input
              type="number"
              min={0}
              placeholder="ej. 12"
              value={answers.active_customers ?? ''}
              onChange={(e) =>
                set('active_customers', e.target.value !== '' ? Number(e.target.value) : null)
              }
            />
          </div>
        );

      // ── Q4: Tamaño de equipo ───────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿Cuántas personas trabajan en esto contigo?
            </h2>
            <p className="text-sm text-gray-500">Inclúyete a ti mismo. Solo tú = 1.</p>
            <Input
              type="number"
              min={1}
              placeholder="ej. 3"
              value={answers.team_size}
              onChange={(e) =>
                set('team_size', Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>
        );

      // ── Q5: Ticket promedio ────────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿Cuál es tu ticket promedio por cliente?
            </h2>
            <div className="space-y-2">
              {([
                { label: 'Menos de €50', value: 25 },
                { label: '€50 – €500', value: 200 },
                { label: '€500 – €5.000', value: 2000 },
                { label: 'Más de €5.000', value: 10000 },
              ] as const).map(({ label, value }) => (
                <RadioOption
                  key={value}
                  value={String(value)}
                  selected={answers.avg_ticket === value}
                  label={label}
                  onSelect={() => set('avg_ticket', value)}
                />
              ))}
              <RadioOption
                value="unknown"
                selected={answers.avg_ticket === null && currentStep === 4}
                label="No lo sé aún"
                onSelect={() => set('avg_ticket', null)}
              />
            </div>
          </div>
        );

      // ── Q6: Sales cycle ────────────────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿Cuánto tiempo pasa entre tu primer contacto y el pago?
            </h2>
            <div className="space-y-2">
              {([
                { label: 'Menos de 1 semana', value: 'days' as const },
                { label: '1–4 semanas', value: 'weeks' as const },
                { label: '1–3 meses', value: 'months' as const },
                { label: 'Más de 3 meses', value: 'quarters' as const },
              ]).map(({ label, value }) => (
                <RadioOption
                  key={value}
                  value={value}
                  selected={answers.sales_cycle === value}
                  label={label}
                  onSelect={() => set('sales_cycle', value)}
                />
              ))}
              <RadioOption
                value="unknown"
                selected={answers.sales_cycle === null}
                label="No lo sé aún"
                onSelect={() => set('sales_cycle', null)}
              />
            </div>
          </div>
        );

      // ── Q7: Monetización ───────────────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿Cómo monetizas?
            </h2>
            <div className="space-y-2">
              {([
                { label: 'Venta única (transaccional)', value: 'transaccional' as const },
                { label: 'Suscripción recurrente', value: 'suscripcion' as const },
                { label: 'Ticket alto / servicio profesional', value: 'ticket_alto' as const },
                { label: 'Contrato / proyecto largo', value: 'contrato' as const },
              ]).map(({ label, value }) => (
                <RadioOption
                  key={value}
                  value={value}
                  selected={answers.monetization_type === value}
                  label={label}
                  onSelect={() => set('monetization_type', value)}
                />
              ))}
              <RadioOption
                value="unknown"
                selected={answers.monetization_type === null}
                label="No lo sé aún"
                onSelect={() => set('monetization_type', null)}
              />
            </div>
          </div>
        );

      // ── Q8: País ───────────────────────────────────────────────────────────
      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿En qué país operas principalmente?
            </h2>
            <Input
              type="text"
              placeholder="ej. España, México, USA"
              value={answers.location_country}
              onChange={(e) => set('location_country', e.target.value)}
            />
            {answers.location_country.trim().length >= 2 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>{answers.location_country}</span>
              </div>
            )}
          </div>
        );

      // ── Q9: Alcance de mercado ─────────────────────────────────────────────
      case 8:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿Tu mercado es local o global?
            </h2>
            <div className="space-y-2">
              <RadioOption
                value="local"
                selected={answers.market_scope === 'local'}
                label="Local (mi ciudad o región)"
                onSelect={() => set('market_scope', 'local')}
              />
              <RadioOption
                value="nacional"
                selected={answers.market_scope === 'nacional'}
                label="Nacional (mi país)"
                onSelect={() => set('market_scope', 'nacional')}
              />
              <RadioOption
                value="global"
                selected={answers.market_scope === 'global'}
                label="Global (varios países)"
                onSelect={() => set('market_scope', 'global')}
              />
            </div>
          </div>
        );

      // ── Q10: Objetivo 90 días ──────────────────────────────────────────────
      case 9:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿Cuál es tu objetivo principal en los próximos 90 días?
            </h2>
            <div className="space-y-2">
              {([
                'Validar que hay mercado',
                'Conseguir los primeros clientes',
                'Crecer el revenue existente',
                'Levantar inversión',
              ]).map((label) => (
                <RadioOption
                  key={label}
                  value={label}
                  selected={answers.goal_90d === label && !goalIsOther}
                  label={label}
                  onSelect={() => {
                    setGoalIsOther(false);
                    setGoalOtroText('');
                    set('goal_90d', label);
                  }}
                />
              ))}
              <RadioOption
                value="otro"
                selected={goalIsOther}
                label="Otro"
                onSelect={() => {
                  setGoalIsOther(true);
                  set('goal_90d', goalOtroText);
                }}
              />
              {goalIsOther && (
                <Input
                  type="text"
                  placeholder="Describe tu objetivo"
                  value={goalOtroText}
                  autoFocus
                  onChange={(e) => {
                    setGoalOtroText(e.target.value);
                    set('goal_90d', e.target.value);
                  }}
                  className="mt-1"
                />
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Pregunta {questionNumber} de {TOTAL_QUESTIONS}
          </span>
          <span className="text-sm text-gray-400">{Math.round(progressPct)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <Card>
        <CardContent className="pt-8 pb-8 px-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3 mt-4">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>
        )}
        <Button
          className="flex-1 gap-2"
          onClick={handleNext}
          disabled={!canAdvance()}
        >
          {currentStep === 9 ? 'Completar' : 'Continuar'}
          {currentStep < 9 && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
