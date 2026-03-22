/**
 * FAST START WIZARD
 *
 * Orquestador principal de onboarding.
 *
 * Fases:
 *   loading       → carga + rehidratación
 *   fase-a        → FaseACommon (Q2-Q10, preguntas comunes obligatorias)
 *   path-specific → GenerativeFastStart | IdeaFastStart | ExistingFastStart
 *   complete      → pantalla de celebración + redirect
 *
 * Rehidratación: al montar lee projects.onboarding_data y detecta en qué
 * fase retomar si el usuario ya había avanzado.
 *
 * Merge: todas las escrituras sobre onboarding_data hacen merge con el JSON
 * existente para no perder campos previos.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles, Rocket, ArrowRight, TrendingUp, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from '@/lib/confetti';
import type { Json } from '@/integrations/supabase/types';
import { trackOnboardingStarted, trackOnboardingCompleted } from '@/lib/analytics';

import { FaseACommon, type FaseAAnswers } from './fast-start/FaseACommon';
import { GenerativeFastStart } from './fast-start/GenerativeFastStart';
import { IdeaFastStart } from './fast-start/IdeaFastStart';
import { ExistingFastStart } from './fast-start/ExistingFastStart';
import { OnboardingProfileCard } from './OnboardingProfileCard';
import type { BusinessIdea } from '@/lib/ai-generators';
import { PHASE_LABELS } from '@/lib/engine';

import { useTranslation } from 'react-i18next';
type OnboardingType = 'generative' | 'idea' | 'existing';
type WizardPhase = 'loading' | 'fase-a' | 'path-specific' | 'complete';

interface FastStartWizardProps {
  projectId: string;
  onComplete: () => void;
}

// market_scope DB CHECK: 'local' | 'national' | 'international'
function mapMarketScope(scope: FaseAAnswers['market_scope']): string {
  if (scope === 'nacional') return 'national';
  if (scope === 'global') return 'international';
  return 'local';
}

export function FastStartWizard({ projectId, onComplete }: FastStartWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<WizardPhase>('loading');
  const [onboardingType, setOnboardingType] = useState<OnboardingType>('idea');
  const [faseAAnswers, setFaseAAnswers] = useState<FaseAAnswers | null>(null);
  // [P4.2] Fase detectada por fast-track para mostrar feedback al usuario
  const [detectedPhase, setDetectedPhase] = useState<number | null>(null);
  // Cache del onboarding_data actual para writes con merge
  const [cachedOD, setCachedOD] = useState<Record<string, unknown>>({});
  // Tanda de ideas generativas guardada (para rehydración si el usuario refresca)
  const [savedTanda, setSavedTanda] = useState<BusinessIdea[] | undefined>(undefined);

  // ─────────────────────────────────────────────────────────────────────────
  // Mount: cargar proyecto + rehidratación de fase
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: project, error } = await supabase
        .from('projects')
        .select('onboarding_data')
        .eq('id', projectId)
        .single();

      if (error) {
        toast.error(t('onboarding.errorAlCargarEl'));
        setPhase('fase-a');
        return;
      }

      const od = (project?.onboarding_data ?? {}) as Record<string, unknown>;
      const savedType = (od.onboarding_type as OnboardingType | undefined) ?? 'idea';
      setCachedOD(od);
      setOnboardingType(savedType);

      // Rehydrate tanda de ideas generativas si existe
      if (Array.isArray(od.generative_ideas_tanda) && od.generative_ideas_tanda.length > 0) {
        setSavedTanda(od.generative_ideas_tanda as BusinessIdea[]);
      }

      // Detectar en qué fase retomar
      if (od.fast_start_completed === true) {
        navigate(`/proyecto/${projectId}`, { replace: true });
        return;
      }
      if (od.fase_a_completed === true && od.fase_a_answers) {
        setFaseAAnswers(od.fase_a_answers as FaseAAnswers);
        setPhase('path-specific');
      } else {
        setPhase('fase-a');
      }
      trackOnboardingStarted({ project_id: projectId });
    };

    load();
  }, [projectId, navigate]);

  // ─────────────────────────────────────────────────────────────────────────
  // Merge helper
  // ─────────────────────────────────────────────────────────────────────────
  const mergeOD = (patch: Record<string, unknown>) => ({ ...cachedOD, ...patch });

  // ─────────────────────────────────────────────────────────────────────────
  // Fase A completa → save intermedio + transición
  // ─────────────────────────────────────────────────────────────────────────
  const handleFaseAComplete = async (answers: FaseAAnswers) => {
    setFaseAAnswers(answers);

    try {
      // onboarding_sessions: guardar respuestas de Fase A
      const { error: sessErr } = await supabase.from('onboarding_sessions').upsert({
        project_id: projectId,
        onboarding_type: onboardingType,
        phase: 'essentials',
        location_country: answers.location_country,
        answers: answers as unknown as Json,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'project_id' });
      if (sessErr) throw sessErr;

      // projects: columnas top-level + merge onboarding_data
      const newOD = mergeOD({
        onboarding_type: onboardingType,
        fase_a_completed: true,
        fase_a_answers: answers,
        fase_a_completed_at: new Date().toISOString(),
      });

      const { error } = await supabase.from('projects').update({
        country: answers.location_country,
        market_scope: mapMarketScope(answers.market_scope),
        onboarding_data: newOD as Json,
      }).eq('id', projectId);

      if (error) throw error;

      setCachedOD(newOD);
      setPhase('path-specific');
    } catch (_err) {
      toast.error(t('onboarding.errorAlGuardarLas'), {
        description: t('onboarding.revisaTuConexiónE'),
      });
      // No transicionar: el usuario puede reintentar
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Path-specific completo → save final + celebración
  // ─────────────────────────────────────────────────────────────────────────
  const handlePathComplete = async (data: Record<string, unknown>) => {
    try {
      const now = new Date().toISOString();

      // For the generative path: extract selected_idea from ai_generated_artifacts
      // so it can be promoted to a top-level field in onboarding_data.
      const artifacts = (data.ai_generated_artifacts ?? null) as Record<string, unknown> | null;
      const selectedIdea = (artifacts?.selected_idea as BusinessIdea | undefined) ?? null;
      const selectedIndustry = (data.selected_industry as string | undefined) ?? null;

      const newOD = mergeOD({
        fast_start_completed: true,
        fast_start_completed_at: now,
        // Keep for backward compatibility
        ai_generated_artifacts: artifacts,
        // Top-level source of truth for downstream features
        ...(selectedIdea ? { selected_idea: selectedIdea } : {}),
        ...(selectedIndustry ? { selected_industry: selectedIndustry } : {}),
      });

      // projects: update final
      const { error: projErr } = await supabase.from('projects').update({
        nombre: (data.project_name as string) || t('onboarding.miProyecto'),
        descripcion: (data.business_description as string) || '',
        onboarding_completed: true,
        onboarding_data: newOD as Json,
      }).eq('id', projectId);

      if (projErr) throw projErr;

      // [F23] P23.2 — Mapeo onboarding_type → phase inicial + entry_mode
      // generative → Phase 0 (pre-idea, exploración)
      // idea → Phase 1 (tiene idea, validar problema)
      // existing → Phase 1 (base; fast-track RPC ajustará después en P23.6)
      const initialPhase = onboardingType === 'generative' ? 0 : 1;
      const entryMode = onboardingType === 'existing' ? 'fast_track' : 'bootcamp';

      const { error: phaseErr } = await supabase
        .from('project_phase_state')
        .upsert({
          project_id: projectId,
          current_phase: initialPhase,
          phase_score: 0,
          hard_signal_met: false,
          phase_status: 'critical',
          phase_entered_at: now,
          phase_last_changed_at: now,
          last_calculated_at: now,
          engine_version: 'phase_v1.0',
          consecutive_low_score: 0,
          entry_mode: entryMode,
          graduation_eligible_since: null,
          graduated: false,
        }, { onConflict: 'project_id' });
      if (phaseErr) void phaseErr; // Silent — phase will be recalculated by engine

      // [F23] P23.5 — Seedeo datos existing: MRR → key_metrics
      // key_metrics schema: project_id, date, mrr, total_customers, etc.
      if (onboardingType === 'existing' && faseAAnswers?.generates_revenue && faseAAnswers.mrr_monthly) {
        const { error: metricErr } = await supabase.from('key_metrics').insert({
          project_id: projectId,
          date: new Date().toISOString().split('T')[0],  // DATE type
          mrr: faseAAnswers.mrr_monthly,
          total_customers: faseAAnswers.active_customers ?? 0,
        });
        if (metricErr) void metricErr; // Silent — metric is supplementary
      }

      // [F23] P23.6 — Fast-track: llamar run_phase_engine con onboarding_fast_track
      // para que el motor evalúe en cascada y coloque al proyecto en la fase correcta.
      if (onboardingType === 'existing') {
        const { error: ftErr } = await supabase.rpc('run_phase_engine', {
          p_project_id: projectId,
          p_trigger_source: 'onboarding_fast_track',
        });
        if (ftErr) void ftErr; // Silent — engine will recalculate on next cron

        // [P4.2] Retroactive Phase Detection — leer la fase que asignó el fast-track
        const { data: phaseResult } = await supabase
          .from('project_phase_state')
          .select('current_phase')
          .eq('project_id', projectId)
          .single();
        if (phaseResult) setDetectedPhase(phaseResult.current_phase);
      }

      // onboarding_sessions: update final con completion_percentage=100
      const { ai_generated_artifacts: _ai, ...pathSpecificData } = data;
      // For the generative path, surface cliente_objetivo and monetizacion so the
      // session is self-contained without needing to read onboarding_data.
      const ideaContextForAnswers = selectedIdea
        ? { cliente_objetivo: selectedIdea.cliente_objetivo, monetizacion: selectedIdea.monetizacion }
        : {};
      const { error: sessErrFinal } = await supabase.from('onboarding_sessions').upsert({
        project_id: projectId,
        onboarding_type: onboardingType,
        phase: 'essentials',
        completion_percentage: 100,
        location_country: faseAAnswers?.location_country ?? '',
        answers: { ...(faseAAnswers ?? {}), ...pathSpecificData, ...ideaContextForAnswers } as unknown as Json,
        completed_at: now,
        updated_at: now,
      }, { onConflict: 'project_id' });
      if (sessErrFinal) throw sessErrFinal;

      setCachedOD(newOD);
      setPhase('complete');

      trackOnboardingCompleted({ project_id: projectId });

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(t('onboarding.onboardingCompletado'));

      // 8s para que el usuario pueda leer el Perfil Operativo Detectado (O5.8)
      setTimeout(() => onComplete(), 8000);
    } catch (_err) {
      toast.error(t('onboarding.errorAlGuardarEl'), {
        description: t('onboarding.inténtaloDeNuevo'),
      });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-md border-2 border-blue-200">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900">{t('onboarding.cargandoOnboarding')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'fase-a') {
    return <FaseACommon onComplete={handleFaseAComplete} />;
  }

  if (phase === 'path-specific') {
    return (
      <>
        {onboardingType === 'generative' && (
          <GenerativeFastStart
            projectId={projectId}
            faseAAnswers={faseAAnswers!}
            onComplete={handlePathComplete}
            savedTanda={savedTanda}
          />
        )}
        {onboardingType === 'idea' && (
          <IdeaFastStart
            projectId={projectId}
            faseAAnswers={faseAAnswers!}
            onComplete={handlePathComplete}
          />
        )}
        {onboardingType === 'existing' && (
          <ExistingFastStart
            projectId={projectId}
            faseAAnswers={faseAAnswers!}
            onComplete={handlePathComplete}
          />
        )}
      </>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
              <div className="relative bg-green-500 rounded-full p-6">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('onboarding.listo')}</h2>
            <p className="text-lg text-gray-700 mb-8">{t('onboarding.tuProyectoEstáConfigurado')}</p>

            <div className="bg-white rounded-lg p-6 max-w-md mx-auto mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  <span className="text-gray-900 font-semibold">{t('onboarding.configuraciónInicial')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-green-600">100%</div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* [P4.2] Retroactive Phase Detection — mostrar fase detectada por fast-track */}
            {detectedPhase !== null && detectedPhase > 1 && onboardingType === 'existing' && (
              <div className="max-w-md mx-auto mb-6 w-full">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">{t('onboarding.fasttrackActivado')}</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Basándonos en tus datos, hemos detectado que tu proyecto está en{' '}
                    <strong>Fase {detectedPhase} — {PHASE_LABELS[detectedPhase] ?? ''}</strong>.
                    {detectedPhase >= 3 && ' Has saltado las fases iniciales de validación.'}
                  </p>
                </div>
              </div>
            )}

            {/* O5.8 — Perfil Operativo Detectado */}
            {faseAAnswers && (
              <div className="max-w-md mx-auto mb-8 w-full">
                <p className="text-sm font-medium text-gray-700 mb-3 text-left">{t('onboarding.perfilOperativoDetectado')}</p>
                <OnboardingProfileCard faseAAnswers={faseAAnswers} />
              </div>
            )}

            <Button
              size="lg"
              onClick={onComplete}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Rocket className="h-5 w-5" />Ir al dashboard<ArrowRight className="h-5 w-5" />
            </Button>

            <p className="text-sm text-gray-500 mt-6">{t('onboarding.redirigiendoAutomáticamenteEn8')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
