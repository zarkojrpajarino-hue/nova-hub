/**
 * RESET SURFACE — V11.3 / B1
 *
 * Surface 3: Strategic Reset Ritual (full page, semana 4 / urgencia).
 * Reemplaza Surface 1 completamente — Rule 2 (1 surface = 1 time context).
 *
 * Flujo (Rule 3 — ritual ends in decision):
 *   form → loading → output → "Comenzar ciclo N+1"
 *
 * Fases:
 *   'form'    — Q1–Q5 (7 campos). Validación frontend + backend.
 *   'loading' — submit_strategic_reset() + ritual-optimus Edge Function.
 *   'output'  — Resultado de Optimus. next_bet arriba (decisión visible primero).
 *               Botón "Comenzar ciclo N+1" solo aparece aquí.
 *
 * Fallback Optimus: si la Edge Function falla, se muestra cycle_evaluation
 * del submit + mensaje neutral. El botón de salida siempre está disponible.
 */

import { useState } from 'react';
import { RefreshCw, ArrowRight, Loader2, AlertTriangle, CheckCircle, Target, Lightbulb, ShieldAlert, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSubmitRitual, useProjectEngineData } from '@/hooks/useNovaDataOptimized';
import { getNextAction } from '@/lib/next-action';
import { trackRitualCompleted } from '@/lib/analytics';

// =============================================================================
// Types
// =============================================================================

interface RitualResponses {
  evidence_progress: string;
  broken_hypothesis: string;
  main_bottleneck: string;
  stop_doing: string;
  next_bet: string;
  success_signal: string;
  invalidation_condition: string;
}

interface OptimusOutput {
  cycle_evaluation: 'progress' | 'stagnation' | 'regression';
  summary: string;
  main_learning: string;
  key_bottleneck: string;
  recommended_action: string;
  next_bet: string;
  success_signal: string;
  invalidation_condition: string;
  confidence: 'high' | 'medium' | 'low';
}

const EMPTY_RESPONSES: RitualResponses = {
  evidence_progress: '',
  broken_hypothesis: '',
  main_bottleneck: '',
  stop_doing: '',
  next_bet: '',
  success_signal: '',
  invalidation_condition: '',
};

// =============================================================================
// Props
// =============================================================================

interface ResetSurfaceProps {
  projectId: string;
  onComplete: () => void; // llama a invalidateQueries → surface cambia a 'engine'
  onSkip?: () => void;    // escape hatch temporal (sesión local, no completa el ritual)
}

// =============================================================================
// Helpers
// =============================================================================

function cycleEvalConfig(evaluation: string) {
  switch (evaluation) {
    case 'progress':
      return { label: 'Ciclo de avance', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: TrendingUp };
    case 'regression':
      return { label: 'Ciclo en regresión', color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle };
    default: // stagnation
      return { label: 'Ciclo estancado', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: RefreshCw };
  }
}

function confidenceLabel(confidence: string) {
  switch (confidence) {
    case 'high':   return { label: 'Alta confianza',  color: 'text-green-600' };
    case 'low':    return { label: 'Baja confianza',  color: 'text-amber-600' };
    default:       return { label: 'Confianza media', color: 'text-muted-foreground' };
  }
}

// =============================================================================
// Sub-components
// =============================================================================

function FieldBlock({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
      {children}
    </div>
  );
}

// =============================================================================
// Phase: Form
// =============================================================================

function RitualForm({
  responses,
  onChange,
  onSubmit,
  isSubmitting,
  submitError,
  onSkip,
}: {
  responses: RitualResponses;
  onChange: (field: keyof RitualResponses, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  onSkip?: () => void;
}) {
  const allFilled = Object.values(responses).every(v => v.trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <RefreshCw size={15} />
          <span>Ritual de cierre de ciclo</span>
        </div>
        <h2 className="text-2xl font-bold leading-snug">Revisión estratégica del ciclo</h2>
        <p className="text-sm text-muted-foreground">
          El ciclo ha cerrado. Antes de continuar, evalúa lo que pasó y define la apuesta del próximo ciclo.
        </p>
      </div>

      {/* Q1 — evidence_progress */}
      <FieldBlock
        label="¿Qué señal observable mejoró este ciclo?"
        sublabel="O 'ninguna' si no hay evidencia de avance."
      >
        <Textarea
          value={responses.evidence_progress}
          onChange={e => onChange('evidence_progress', e.target.value)}
          placeholder="Ej: Conseguimos 3 entrevistas cualitativas y 1 cliente de pago"
          rows={3}
          disabled={isSubmitting}
        />
      </FieldBlock>

      {/* Q2 — broken_hypothesis */}
      <FieldBlock
        label="¿Qué hipótesis resultó falsa?"
        sublabel="La suposición en la que más confiabais y que los datos no confirmaron."
      >
        <Textarea
          value={responses.broken_hypothesis}
          onChange={e => onChange('broken_hypothesis', e.target.value)}
          placeholder="Ej: Creíamos que los usuarios pagarían por X, pero el bloqueo era Y"
          rows={3}
          disabled={isSubmitting}
        />
      </FieldBlock>

      {/* Q3 — main_bottleneck */}
      <FieldBlock
        label="¿Cuál fue el cuello de botella principal?"
        sublabel="El único factor que más frenó el ciclo."
      >
        <Textarea
          value={responses.main_bottleneck}
          onChange={e => onChange('main_bottleneck', e.target.value)}
          placeholder="Ej: Falta de canal de distribución validado"
          rows={3}
          disabled={isSubmitting}
        />
      </FieldBlock>

      {/* Q4 — stop_doing */}
      <FieldBlock
        label="¿Qué dejáis de hacer en el próximo ciclo?"
        sublabel="Una actividad concreta, no una intención genérica."
      >
        <Textarea
          value={responses.stop_doing}
          onChange={e => onChange('stop_doing', e.target.value)}
          placeholder="Ej: Dejar de iterar sobre el producto sin validación externa"
          rows={2}
          disabled={isSubmitting}
        />
      </FieldBlock>

      {/* Q5 — three-part block */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div>
          <p className="text-sm font-semibold">La apuesta del próximo ciclo</p>
          <p className="text-xs text-muted-foreground">Define la dirección y sus condiciones de validación.</p>
        </div>

        <FieldBlock
          label="¿Cuál es la apuesta?"
          sublabel="Una sola apuesta, específica."
        >
          <Textarea
            value={responses.next_bet}
            onChange={e => onChange('next_bet', e.target.value)}
            placeholder="Ej: Conseguir 5 clientes de pago antes de semana 4"
            rows={2}
            disabled={isSubmitting}
          />
        </FieldBlock>

        <FieldBlock
          label="¿Qué señal del engine confirmaría éxito?"
          sublabel="Referencia a una métrica observable del sistema."
        >
          <Input
            value={responses.success_signal}
            onChange={e => onChange('success_signal', e.target.value)}
            placeholder="Ej: Probabilidad > 0.50 o al menos 2 OBVs de cliente de pago"
            disabled={isSubmitting}
          />
        </FieldBlock>

        <FieldBlock
          label="¿Cuándo descartaríais esta apuesta antes de 4 semanas?"
          sublabel="Condición medible con plazo."
        >
          <Input
            value={responses.invalidation_condition}
            onChange={e => onChange('invalidation_condition', e.target.value)}
            placeholder="Ej: Si en 2 semanas no hay ningún pago, la apuesta es falsa"
            disabled={isSubmitting}
          />
        </FieldBlock>
      </div>

      {/* Error */}
      {submitError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertTriangle size={15} className="shrink-0" />
          {submitError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground text-xs">
            Volver al estado actual
          </Button>
        )}
        <div className="ml-auto">
          <Button
            onClick={onSubmit}
            disabled={!allFilled || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Completar ritual
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Phase: Loading
// =============================================================================

function RitualLoading() {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
      <Loader2 size={32} className="mx-auto animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        Cerrando el ciclo e interpretando los resultados...
      </p>
    </div>
  );
}

// =============================================================================
// Phase: Output
// =============================================================================

function RitualOutput({
  cycleEval,
  optimus,
  onComplete,
}: {
  cycleEval: 'progress' | 'stagnation' | 'regression';
  optimus: OptimusOutput | null;
  onComplete: () => void;
}) {
  const evalCfg = cycleEvalConfig(cycleEval);
  const EvalIcon = evalCfg.icon;
  const conf = optimus ? confidenceLabel(optimus.confidence) : null;

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      {/* Header — cycle_evaluation badge */}
      <div className="flex items-center gap-2">
        <RefreshCw size={15} className="text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Ciclo cerrado</span>
        <Badge
          variant="outline"
          className={cn('gap-1 ml-1', evalCfg.bg, evalCfg.color, evalCfg.border)}
        >
          <EvalIcon size={11} />
          {evalCfg.label}
        </Badge>
      </div>

      {optimus ? (
        <>
          {/* ① next_bet — la decisión, arriba */}
          <div className={cn('rounded-2xl border p-5 space-y-2', evalCfg.bg, evalCfg.border)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              La apuesta del próximo ciclo
            </p>
            <p className="text-lg font-bold leading-snug">{optimus.next_bet}</p>
            <div className="pt-1 space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Señal de éxito:</span>{' '}
                {optimus.success_signal}
              </p>
              <p>
                <span className="font-medium text-foreground">Invalidación:</span>{' '}
                {optimus.invalidation_condition}
              </p>
            </div>
          </div>

          {/* ② summary */}
          <p className="text-base leading-relaxed text-foreground">{optimus.summary}</p>

          {/* ③ main_learning */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Lightbulb size={12} />
              Aprendizaje principal
            </div>
            <p className="text-sm leading-relaxed">{optimus.main_learning}</p>
          </div>

          {/* ④ key_bottleneck */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldAlert size={12} />
              Bloqueo principal del próximo ciclo
            </div>
            <p className="text-sm leading-relaxed">{optimus.key_bottleneck}</p>
          </div>

          {/* ⑤ recommended_action + confidence */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Target size={12} />
                Acción recomendada
              </div>
              {conf && (
                <span className={cn('text-xs', conf.color)}>{conf.label}</span>
              )}
            </div>
            <p className="text-sm font-medium">{optimus.recommended_action}</p>
          </div>
        </>
      ) : (
        /* Fallback si Optimus falló — mostrar evaluación sin interpretación */
        <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-muted-foreground" />
            <p className="text-sm font-medium">Ciclo completado</p>
          </div>
          <p className="text-sm text-muted-foreground">
            El ciclo ha sido cerrado correctamente. La interpretación de Optimus no está disponible en este momento.
          </p>
        </div>
      )}

      {/* Exit button — solo aparece tras output completo */}
      <div className="pt-2 flex justify-end">
        <Button onClick={onComplete} className="gap-2">
          Comenzar ciclo N+1
          <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Main component
// =============================================================================

export function ResetSurface({ projectId, onComplete, onSkip }: ResetSurfaceProps) {
  const [phase, setPhase] = useState<'form' | 'loading' | 'output'>('form');
  const [responses, setResponses] = useState<RitualResponses>(EMPTY_RESPONSES);
  const [cycleEval, setCycleEval] = useState<'progress' | 'stagnation' | 'regression' | null>(null);
  const [optimusOutput, setOptimusOutput] = useState<OptimusOutput | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // EC13.1d — doble submit desde otra pestaña: el ciclo ya está cerrado, el usuario puede continuar.
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const { mutateAsync: submitRitual, isPending } = useSubmitRitual();
  // nextAction alimenta recommended_action en Optimus §8.
  // Capturable aquí porque ResetSurface solo se muestra cuando surface='reset',
  // lo que implica que engineData ya está disponible en caché de React Query.
  const { data: engineData } = useProjectEngineData(projectId);
  const nextActionTitle = getNextAction(engineData)?.title ?? '';

  function handleChange(field: keyof RitualResponses, value: string) {
    setResponses(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitError(null);
    setPhase('loading');

    try {
      // 1. Submit ritual — cierra el ciclo y devuelve cycle_evaluation
      const evaluation = await submitRitual({ projectId, responses });
      setCycleEval(evaluation);
      trackRitualCompleted({
        project_id: projectId,
        evaluation,
        phase: engineData?.phaseState?.current_phase ?? undefined,
      });

      // 2. Llamar a Optimus para la interpretación (non-blocking — fallo no bloquea salida)
      // Timeout de 30s: si la Edge Function cuelga, el spinner no bloquea indefinidamente.
      try {
        const { data, error } = await supabase.functions.invoke<OptimusOutput>('ritual-optimus', {
          body: { projectId, nextAction: nextActionTitle },
          signal: AbortSignal.timeout(30_000),
        });
        if (!error && data) {
          setOptimusOutput(data);
        }
      } catch {
        // Optimus failure / timeout is non-blocking — output phase shows fallback
      }

      setPhase('output');
    } catch (err) {
      const msg = (err as Error).message ?? '';
      // EC13.1d — doble submit desde otra pestaña: el guard SQL emite "No cycle available".
      // El ciclo ya está cerrado correctamente — el usuario puede continuar sin bloqueo.
      if (msg.includes('No cycle available') || msg.includes('ritual already submitted') || msg.includes('cycle already closed')) {
        setAlreadyCompleted(true);
        setPhase('form'); // vuelve al form pero muestra el banner de "ya completado"
      } else {
        setSubmitError(msg || 'Error al completar el ritual');
        setPhase('form');
      }
    }
  }

  if (phase === 'loading' || isPending) {
    return <RitualLoading />;
  }

  if (phase === 'output' && cycleEval) {
    return (
      <RitualOutput
        cycleEval={cycleEval}
        optimus={optimusOutput}
        onComplete={onComplete}
      />
    );
  }

  // EC13.1d — el ritual ya se completó en otra pestaña / sesión
  if (alreadyCompleted) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <CheckCircle size={32} className="mx-auto text-green-500" />
        <h2 className="text-xl font-bold">El ritual ya fue completado</h2>
        <p className="text-sm text-muted-foreground">
          El ciclo se cerró correctamente en otra sesión. Puedes continuar al nuevo ciclo.
        </p>
        <Button onClick={onComplete} className="gap-2">
          Ir al nuevo ciclo
          <ArrowRight size={15} />
        </Button>
      </div>
    );
  }

  return (
    <RitualForm
      responses={responses}
      onChange={handleChange}
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      submitError={submitError}
      onSkip={onSkip}
    />
  );
}
