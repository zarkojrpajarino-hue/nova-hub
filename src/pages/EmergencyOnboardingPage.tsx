/**
 * 🚨 EMERGENCY ONBOARDING PAGE — O5.V2.3
 *
 * 3er path de onboarding: problema urgente → diagnóstico → 3 tareas en ≤3min.
 *
 * Flujo:
 *   Paso 1: Selecciona el tipo de crisis (tap → selección inmediata)
 *   Paso 2: Contexto opcional (1 campo de texto, max 2 líneas)
 *   Paso 3: Confirmación → 3 tareas auto-creadas → ir al dashboard
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle, Siren, Wallet, TrendingDown, Timer, RefreshCw, Handshake, type LucideIcon } from 'lucide-react';

import { useTranslation } from 'react-i18next';
// ── Tipos de crisis y sus 3 tareas por defecto ───────────────────────────────

const CRISIS_IDS = ['cash_crisis', 'sales_stalled', 'runway_risk', 'product_pivot', 'team_conflict'] as const;
type CrisisId = typeof CRISIS_IDS[number];

function getCrisisTypes(t: (k: string) => string) {
  return [
    {
      id:       'cash_crisis' as const,
      label:    t('emergencyOnboarding.crisisDeCaja'),
      Icon:     Wallet,
      subtitle: t('emergencyOnboarding.meQuedoSinDinero'),
      tasks: [
        t('emergencyOnboarding.calcularRunwayRealCuántos'),
        t('emergencyOnboarding.listarLos3Mayores'),
        t('emergencyOnboarding.contactarALos3'),
      ],
    },
    {
      id:       'sales_stalled' as const,
      label:    t('emergencyOnboarding.ventasParadas'),
      Icon:     TrendingDown,
      subtitle: t('emergencyOnboarding.noEstamosGenerandoNuevos'),
      tasks: [
        t('emergencyOnboarding.analizarPorQuéFallaron'),
        t('emergencyOnboarding.identificarElSegmentoDe'),
        'Planificar 5 conversaciones de venta esta semana (no demos — ventas)',
      ],
    },
    {
      id:       'runway_risk' as const,
      label:    t('emergencyOnboarding.riesgoDeRunway'),
      Icon:     Timer,
      subtitle: t('emergencyOnboarding.menosDe3Meses'),
      tasks: [
        'Preparar un plan de reducción de costes urgente (objetivo: -30% burn)',
        'Evaluar opciones de financiación de emergencia (inversores, préstamos, revenue-based)',
        'Definir el "default alive" plan: qué se necesita para llegar a breakeven',
      ],
    },
    {
      id:       'product_pivot' as const,
      label:    t('emergencyOnboarding.pivoteUrgente'),
      Icon:     RefreshCw,
      subtitle: t('emergencyOnboarding.elProductoNoEstá'),
      tasks: [
        t('emergencyOnboarding.hacer5EntrevistasCon'),
        t('emergencyOnboarding.definirLaHipótesisDel'),
        t('emergencyOnboarding.decidirQuéEliminarDel'),
      ],
    },
    {
      id:       'team_conflict' as const,
      label:    t('emergencyOnboarding.conflictoDeEquipo'),
      Icon:     Handshake,
      subtitle: t('emergencyOnboarding.problemasGravesConCofounders'),
      tasks: [
        'Programar una conversación directa y honesta con la(s) persona(s) involucrada(s)',
        t('emergencyOnboarding.revisarElAcuerdoDe'),
        t('emergencyOnboarding.consultarConUnAdvisor'),
      ],
    },
  ];
}

// ── Componente ────────────────────────────────────────────────────────────────

export function EmergencyOnboardingPage() {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate     = useNavigate();

  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [crisisId, setCrisisId]   = useState<CrisisId | null>(null);
  const [context, setContext]     = useState('');
  const [saving, setSaving]       = useState(false);

  const CRISIS_TYPES = getCrisisTypes(t);
  const selectedCrisis = CRISIS_TYPES.find(c => c.id === crisisId);

  // ── Paso 1: Selección de crisis ──────────────────────────────────────────

  const handleSelectCrisis = (id: CrisisId) => {
    setCrisisId(id);
    setStep(2);
  };

  // ── Paso 3: Crear tareas y navegar ───────────────────────────────────────

  const handleConfirm = async () => {
    if (!projectId || !selectedCrisis) return;
    setSaving(true);

    try {
      // Actualizar onboarding_data con el tipo de crisis y contexto
      await supabase
        .from('projects')
        .update({
          onboarding_data: {
            onboarding_type:  'emergency',
            crisis_type:      crisisId,
            crisis_context:   context || null,
            emergency_started_at: new Date().toISOString(),
          },
        })
        .eq('id', projectId);

      // Crear las 3 tareas de emergencia
      const tasksToInsert = selectedCrisis.tasks.map(task => ({
        project_id:   projectId,
        titulo:       task,
        descripcion:  `Crisis: ${selectedCrisis.label}${context ? `. Contexto: ${context}` : ''}`,
        status:       'todo' as const,
        prioridad:    1,  // máxima prioridad
        ai_generated: true,
        source:       'emergency_onboarding',
      }));

      const { error } = await supabase.from('tasks').insert(tasksToInsert);
      if (error) throw error;

      setStep(3);
      // Esperar 1.5s mostrando confirmación, luego ir al dashboard
      setTimeout(() => {
        navigate(`/proyecto/${projectId}`);
      }, 1500);

    } catch (_err) {
      toast.error(t('emergencyOnboarding.errorAlConfigurarEl'));
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 border border-red-400/30 px-4 py-1.5 text-sm text-red-300 font-semibold mb-4">
            <Siren className="h-4 w-4" />{t('emergencyOnboarding.modoEmergencia')}</div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 && t('emergencyOnboarding.cuálEsTuCrisis')}
            {step === 2 && t('emergencyOnboarding.algoMásQueDebamos')}
            {step === 3 && t('emergencyOnboarding.listo')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 1 && t('emergencyOnboarding.tocaElTipoDe')}
            {step === 2 && t('emergencyOnboarding.opcionalCuéntanosBrevementeEl')}
            {step === 3 && t('emergencyOnboarding.creandoTus3Tareas')}
          </p>
        </div>

        {/* ── Paso 1: Crisis selector ── */}
        {step === 1 && (
          <div className="space-y-3">
            {CRISIS_TYPES.map(crisis => (
              <button
                key={crisis.id}
                onClick={() => handleSelectCrisis(crisis.id)}
                className="w-full flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-left transition-all hover:bg-white/10 hover:border-red-400/40 group"
              >
                <crisis.Icon size={24} />
                <div>
                  <p className="text-sm font-semibold text-white">{crisis.label}</p>
                  <p className="text-xs text-slate-400">{crisis.subtitle}</p>
                </div>
              </button>
            ))}
            <button
              onClick={() => navigate('/select-onboarding-type')}
              className="mt-4 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300"
            >
              <ArrowLeft className="h-3 w-3" />{t('emergencyOnboarding.volverAElegirTipo')}</button>
          </div>
        )}

        {/* ── Paso 2: Contexto opcional + confirmación ── */}
        {step === 2 && selectedCrisis && (
          <div className="space-y-6">
            {/* Crisis seleccionada */}
            <div className="flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3">
              <selectedCrisis.Icon size={24} />
              <div>
                <p className="text-sm font-semibold text-red-200">{selectedCrisis.label}</p>
                <p className="text-xs text-red-400">{selectedCrisis.subtitle}</p>
              </div>
            </div>

            {/* Contexto */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contexto adicional<span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <Textarea
                placeholder={t('emergencyOnboarding.ejLlevamos2Meses')}
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={2}
                className="resize-none bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm"
                maxLength={300}
              />
            </div>

            {/* Preview de tareas */}
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Se crearán estas 3 tareas urgentes:
              </p>
              {selectedCrisis.tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold shrink-0">
                    {i + 1}
                  </span>
                  {task}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-white/10 text-slate-300 hover:bg-white/5"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />{t('emergencyOnboarding.cambiar')}</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Crear tareas urgentes →
              </Button>
            </div>
          </div>
        )}

        {/* ── Paso 3: Confirmación ── */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-400/30">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-slate-300 text-sm">
              {t('emergencyOnboarding.tareasCreadas')}
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => navigate(`/proyecto/${projectId}`)}
                className="text-sm text-primary hover:text-primary/80 underline underline-offset-2"
              >
                {t('emergencyOnboarding.generarAnalisisCompleto')}
              </button>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-slate-500 mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
