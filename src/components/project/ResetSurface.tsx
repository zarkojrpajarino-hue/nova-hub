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
import { useAuth } from '@/hooks/useAuth';
import { OptimusFeedback } from '@/components/project/OptimusFeedback';

import { useTranslation } from 'react-i18next';
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
  /** SR10.V2.2 — opcional: decisiones de reuniones en este ciclo */
  key_meeting_decisions: string;
}

/** F31 v1 — Commitment for the next cycle */
interface CycleCommitment {
  text: string;
  /** Mapping: 'team' in commitments = 'support' in tasks.function_type */
  category: 'demand' | 'delivery' | 'cash' | 'team';
  measurable_target?: string;
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
  key_meeting_decisions: '',  // SR10.V2.2 — opcional
};

// Campos obligatorios para habilitar el submit — key_meeting_decisions es opcional
const REQUIRED_RITUAL_FIELDS: ReadonlyArray<keyof RitualResponses> = [
  'evidence_progress', 'broken_hypothesis', 'main_bottleneck',
  'stop_doing', 'next_bet', 'success_signal', 'invalidation_condition',
] as const;

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
  const { t } = useTranslation();
  switch (evaluation) {
    case 'progress':
      return { label: t('project.cicloDeAvance'), color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: TrendingUp };
    case 'regression':
      return { label: t('project.cicloEnRegresión'), color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle };
    default: // stagnation
      return { label: t('project.cicloEstancado'), color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: RefreshCw };
  }
}

function confidenceLabel(confidence: string) {
  switch (confidence) {
    case 'high':   return { label: t('project.altaConfianza'),  color: 'text-green-600' };
    case 'low':    return { label: t('project.bajaConfianza'),  color: 'text-amber-600' };
    default:       return { label: t('project.confianzaMedia'), color: 'text-muted-foreground' };
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
  const allFilled = REQUIRED_RITUAL_FIELDS.every(f => responses[f].trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <RefreshCw size={15} />
          <span>{t('project.ritualDeCierreDe')}</span>
        </div>
        <h2 className="text-2xl font-bold leading-snug">{t('project.revisiónEstratégicaDelCiclo')}</h2>
        <p className="text-sm text-muted-foreground">{t('project.elCicloHaCerrado')}</p>
      </div>

      {/* Q1 — evidence_progress */}
      <FieldBlock
        label={t('project.quéSeñalObservableMejoró')}
        sublabel="O 'ninguna' si no hay evidencia de avance."
      >
        <Textarea
          value={responses.evidence_progress}
          onChange={e => onChange('evidence_progress', e.target.value)}
          placeholder={t('project.ejConseguimos3Entrevistas')}
          rows={3}
          disabled={isSubmitting}
        />
      </FieldBlock>

      {/* Q2 — broken_hypothesis */}
      <FieldBlock
        label={t('project.quéHipótesisResultóFalsa')}
        sublabel={t('project.laSuposiciónEnLa')}
      >
        <Textarea
          value={responses.broken_hypothesis}
          onChange={e => onChange('broken_hypothesis', e.target.value)}
          placeholder={t('project.ejCreíamosQueLos')}
          rows={3}
          disabled={isSubmitting}
        />
      </FieldBlock>

      {/* Q3 — main_bottleneck */}
      <FieldBlock
        label={t('project.cuálFueElCuello')}
        sublabel={t('project.elÚnicoFactorQue')}
      >
        <Textarea
          value={responses.main_bottleneck}
          onChange={e => onChange('main_bottleneck', e.target.value)}
          placeholder={t('project.ejFaltaDeCanal')}
          rows={3}
          disabled={isSubmitting}
        />
      </FieldBlock>

      {/* Q4 — stop_doing */}
      <FieldBlock
        label={t('project.quéDejáisDeHacer')}
        sublabel={t('project.unaActividadConcretaNo')}
      >
        <Textarea
          value={responses.stop_doing}
          onChange={e => onChange('stop_doing', e.target.value)}
          placeholder={t('project.ejDejarDeIterar')}
          rows={2}
          disabled={isSubmitting}
        />
      </FieldBlock>

      {/* Q5 — three-part block */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div>
          <p className="text-sm font-semibold">{t('project.laApuestaDelPróximo')}</p>
          <p className="text-xs text-muted-foreground">{t('project.defineLaDirecciónY')}</p>
        </div>

        <FieldBlock
          label={t('project.cuálEsLaApuesta')}
          sublabel={t('project.unaSolaApuestaEspecífica')}
        >
          <Textarea
            value={responses.next_bet}
            onChange={e => onChange('next_bet', e.target.value)}
            placeholder={t('project.ejConseguir5Clientes')}
            rows={2}
            disabled={isSubmitting}
          />
        </FieldBlock>

        <FieldBlock
          label={t('project.quéSeñalDelEngine')}
          sublabel={t('project.referenciaAUnaMétrica')}
        >
          <Input
            value={responses.success_signal}
            onChange={e => onChange('success_signal', e.target.value)}
            placeholder={t('project.ejProbabilidad050O')}
            disabled={isSubmitting}
          />
        </FieldBlock>

        <FieldBlock
          label={t('project.cuándoDescartaríaisEstaApuesta')}
          sublabel={t('project.condiciónMedibleConPlazo')}
        >
          <Input
            value={responses.invalidation_condition}
            onChange={e => onChange('invalidation_condition', e.target.value)}
            placeholder={t('project.ejSiEn2')}
            disabled={isSubmitting}
          />
        </FieldBlock>
      </div>

      {/* Q6 — key_meeting_decisions (SR10.V2.2 — opcional) */}
      <FieldBlock
        label={t('project.quéDecisionesClaveTomasteis')}
        sublabel={t('project.opcionalSoloSiRegistráis')}
      >
        <Textarea
          value={responses.key_meeting_decisions}
          onChange={e => onChange('key_meeting_decisions', e.target.value)}
          placeholder={t('project.ejDecidimosPausarEl')}
          rows={2}
          disabled={isSubmitting}
        />
      </FieldBlock>

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
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground text-xs">{t('project.volverAlEstadoActual')}</Button>
        )}
        <div className="ml-auto">
          <Button
            onClick={onSubmit}
            disabled={!allFilled || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />{t('project.procesando')}</>
            ) : (
              <>{t('project.completarRitual')}<ArrowRight size={15} />
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
      <p className="text-sm text-muted-foreground">{t('project.cerrandoElCicloE')}</p>
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
  projectId,
  userId,
}: {
  cycleEval: 'progress' | 'stagnation' | 'regression';
  optimus: OptimusOutput | null;
  onComplete: () => void;
  projectId: string;
  userId: string;
}) {
  const evalCfg = cycleEvalConfig(cycleEval);
  const EvalIcon = evalCfg.icon;
  const conf = optimus ? confidenceLabel(optimus.confidence) : null;

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      {/* Header — cycle_evaluation badge */}
      <div className="flex items-center gap-2">
        <RefreshCw size={15} className="text-muted-foreground" />
        <span className="text-muted-foreground text-sm">{t('project.cicloCerrado')}</span>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('project.laApuestaDelPróximo')}</p>
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
              <Lightbulb size={12} />{t('project.aprendizajePrincipal')}</div>
            <p className="text-sm leading-relaxed">{optimus.main_learning}</p>
          </div>

          {/* ④ key_bottleneck */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldAlert size={12} />{t('project.bloqueoPrincipalDelPróximo')}</div>
            <p className="text-sm leading-relaxed">{optimus.key_bottleneck}</p>
          </div>

          {/* ⑤ recommended_action + confidence */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Target size={12} />{t('project.acciónRecomendada')}</div>
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
            <p className="text-sm font-medium">{t('project.cicloCompletado')}</p>
          </div>
          <p className="text-sm text-muted-foreground">{t('project.elCicloHaSido')}</p>
        </div>
      )}

      {/* P8.V2.3 — Feedback sobre el output de Optimus */}
      {optimus && (
        <div className="border-t border-border pt-4">
          <OptimusFeedback
            projectId={projectId}
            userId={userId}
            primaryAction={optimus.recommended_action}
            confidence={optimus.confidence}
          />
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
// Phase: Commitments (F31 v1 — captured before starting next cycle)
// =============================================================================

const CATEGORY_OPTIONS: { value: CycleCommitment['category']; label: string; color: string }[] = [
  { value: 'demand', label: 'Demand', color: 'bg-amber-500' },
  { value: 'delivery', label: 'Delivery', color: 'bg-blue-500' },
  { value: 'cash', label: 'Cash', color: 'bg-green-500' },
  // 'team' in commitments maps to 'support' in tasks.function_type
  { value: 'team', label: 'Team', color: 'bg-purple-500' },
];

function CommitmentsForm({
  onComplete,
  projectId,
}: {
  onComplete: (commitments: CycleCommitment[]) => void;
  projectId: string;
}) {
  const { t } = useTranslation();
  const [commitments, setCommitments] = useState<CycleCommitment[]>([
    { text: '', category: 'demand' },
  ]);
  const [saving, setSaving] = useState(false);

  const addCommitment = () => {
    if (commitments.length >= 5) return;
    setCommitments([...commitments, { text: '', category: 'delivery' }]);
  };

  const removeCommitment = (idx: number) => {
    if (commitments.length <= 1) return;
    setCommitments(commitments.filter((_, i) => i !== idx));
  };

  const updateCommitment = (idx: number, field: keyof CycleCommitment, value: string) => {
    setCommitments(commitments.map((c, i) =>
      i === idx ? { ...c, [field]: value } : c
    ));
  };

  const validCommitments = commitments.filter(c => c.text.trim().length > 0);
  const canSubmit = validCommitments.length >= 1 && !saving;

  const handleSubmit = async () => {
    setSaving(true);
    onComplete(validCommitments);
  };

  const handleSkip = () => {
    onComplete([]);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Target size={15} />
          <span>{t('project.nuevosCiclo')}</span>
        </div>
        <h2 className="text-2xl font-bold leading-snug">
          {t('project.quéTeComprometes')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('project.defineEntre1Y')}
        </p>
      </div>

      <div className="space-y-4">
        {commitments.map((c, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t('project.compromiso')} {idx + 1}
              </span>
              {commitments.length > 1 && (
                <button
                  onClick={() => removeCommitment(idx)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  {t('common.delete')}
                </button>
              )}
            </div>

            <Textarea
              value={c.text}
              onChange={e => updateCommitment(idx, 'text', e.target.value)}
              placeholder={t('project.commitmentPlaceholder')}
              rows={2}
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('project.categoría')}:</span>
              <div className="flex gap-1.5">
                {CATEGORY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateCommitment(idx, 'category', opt.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                      c.category === opt.value
                        ? `${opt.color} text-white`
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              value={c.measurable_target || ''}
              onChange={e => updateCommitment(idx, 'measurable_target', e.target.value)}
              placeholder={t('project.metaMedibleOpcional')}
              className="text-sm"
            />
          </div>
        ))}
      </div>

      {commitments.length < 5 && (
        <button
          onClick={addCommitment}
          className="text-sm text-primary hover:underline"
        >
          + {t('project.añadirCompromiso')}
        </button>
      )}

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handleSkip}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t('project.saltarPorAhora')}
        </button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="gap-2"
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" />{t('project.creandoCiclo')}</>
          ) : (
            <>{t('project.comenzarCiclo')} <ArrowRight size={15} /></>
          )}
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Main component
// =============================================================================

export function ResetSurface({ projectId, onComplete, onSkip }: ResetSurfaceProps) {
  const [phase, setPhase] = useState<'form' | 'loading' | 'output' | 'commitments'>('form');
  const [responses, setResponses] = useState<RitualResponses>(EMPTY_RESPONSES);
  const [cycleEval, setCycleEval] = useState<'progress' | 'stagnation' | 'regression' | null>(null);
  const [optimusOutput, setOptimusOutput] = useState<OptimusOutput | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // EC13.1d — doble submit desde otra pestaña: el ciclo ya está cerrado, el usuario puede continuar.
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const { profile } = useAuth();
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
      // EC13.1d — doble submit desde otra pestaña: el guard SQL emite t('project.noCycleAvailable').
      // El ciclo ya está cerrado correctamente — el usuario puede continuar sin bloqueo.
      if (msg.includes(t('project.noCycleAvailable')) || msg.includes('ritual already submitted') || msg.includes('cycle already closed')) {
        setAlreadyCompleted(true);
        setPhase('form'); // vuelve al form pero muestra el banner de "ya completado"
      } else {
        setSubmitError(msg || t('project.errorAlCompletarEl'));
        setPhase('form');
      }
    }
  }

  if (phase === 'loading' || isPending) {
    return <RitualLoading />;
  }

  // F31 v1: commitments phase — capture what the founder commits to for the next cycle
  const handleCommitmentsComplete = async (commitments: CycleCommitment[]) => {
    // Save commitments to the NEXT cycle (the one about to be created)
    // The cycle creation is handled by onComplete() which triggers the cycle generation.
    // We store commitments temporarily and pass them via the cycle creation flow.
    if (commitments.length > 0) {
      try {
        // Get the latest cycle for this project (the one just closed)
        const { data: latestCycle } = await supabase
          .from('strategic_cycles')
          .select('id, cycle_index')
          .eq('project_id', projectId)
          .order('cycle_index', { ascending: false })
          .limit(1)
          .single();

        if (latestCycle) {
          // Store commitments on the closed cycle for now — they represent
          // what the founder committed to AFTER seeing the results.
          // When the next cycle is created, compute_cycle_delta will read these.
          await supabase
            .from('strategic_cycles')
            .update({ commitments_json: commitments as unknown as Record<string, unknown>[] })
            .eq('id', latestCycle.id);
        }
      } catch {
        // Non-blocking — cycle creation proceeds even if commitments fail to save
      }
    }
    onComplete();
  };

  if (phase === 'commitments') {
    return (
      <CommitmentsForm
        onComplete={handleCommitmentsComplete}
        projectId={projectId}
      />
    );
  }

  if (phase === 'output' && cycleEval) {
    return (
      <RitualOutput
        cycleEval={cycleEval}
        optimus={optimusOutput}
        onComplete={() => setPhase('commitments')}
        projectId={projectId}
        userId={profile?.id ?? ''}
      />
    );
  }

  // EC13.1d — el ritual ya se completó en otra pestaña / sesión
  if (alreadyCompleted) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <CheckCircle size={32} className="mx-auto text-green-500" />
        <h2 className="text-xl font-bold">{t('project.elRitualYaFue')}</h2>
        <p className="text-sm text-muted-foreground">{t('project.elCicloSeCerró')}</p>
        <Button onClick={onComplete} className="gap-2">{t('project.irAlNuevoCiclo')}<ArrowRight size={15} />
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
