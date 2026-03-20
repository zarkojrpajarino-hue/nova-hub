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
import { Loader2, ArrowLeft, CheckCircle, Siren } from 'lucide-react';

// ── Tipos de crisis y sus 3 tareas por defecto ───────────────────────────────

const CRISIS_TYPES = [
  {
    id:       'cash_crisis',
    label:    'Crisis de caja',
    emoji:    '💸',
    subtitle: 'Me quedo sin dinero pronto',
    tasks: [
      'Calcular runway real: cuántos meses quedan a burn actual',
      'Listar los 3 mayores gastos y evaluar cuáles pueden cortarse esta semana',
      'Contactar a los 3 clientes más cercanos a cerrar para acelerar el pago',
    ],
  },
  {
    id:       'sales_stalled',
    label:    'Ventas paradas',
    emoji:    '📉',
    subtitle: 'No estamos generando nuevos clientes',
    tasks: [
      'Analizar por qué fallaron los últimos 3 deals — patrón común',
      'Identificar el segmento de cliente donde más rápido se cierra',
      'Planificar 5 conversaciones de venta esta semana (no demos — ventas)',
    ],
  },
  {
    id:       'runway_risk',
    label:    'Riesgo de runway',
    emoji:    '⏱',
    subtitle: 'Menos de 3 meses para sobrevivir',
    tasks: [
      'Preparar un plan de reducción de costes urgente (objetivo: -30% burn)',
      'Evaluar opciones de financiación de emergencia (inversores, préstamos, revenue-based)',
      'Definir el "default alive" plan: qué se necesita para llegar a breakeven',
    ],
  },
  {
    id:       'product_pivot',
    label:    'Pivote urgente',
    emoji:    '🔄',
    subtitle: 'El producto no está funcionando',
    tasks: [
      'Hacer 5 entrevistas con clientes actuales esta semana: ¿qué valorarían más?',
      'Definir la hipótesis del pivote en 1 frase y cómo validarla en 2 semanas',
      'Decidir qué eliminar del producto actual para liberar capacidad',
    ],
  },
  {
    id:       'team_conflict',
    label:    'Conflicto de equipo',
    emoji:    '🤝',
    subtitle: 'Problemas graves con co-founders o equipo',
    tasks: [
      'Programar una conversación directa y honesta con la(s) persona(s) involucrada(s)',
      'Revisar el acuerdo de co-founders o contratos — qué dice exactamente',
      'Consultar con un advisor o mentor externo antes de tomar decisiones irreversibles',
    ],
  },
] as const;

type CrisisId = typeof CRISIS_TYPES[number]['id'];

// ── Componente ────────────────────────────────────────────────────────────────

export function EmergencyOnboardingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate     = useNavigate();

  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [crisisId, setCrisisId]   = useState<CrisisId | null>(null);
  const [context, setContext]     = useState('');
  const [saving, setSaving]       = useState(false);

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
      toast.error('Error al configurar el proyecto');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/20 border border-red-400/30 px-4 py-1.5 text-sm text-red-300 font-semibold mb-4">
            <Siren className="h-4 w-4" />
            Modo Emergencia
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 && '¿Cuál es tu crisis más urgente?'}
            {step === 2 && '¿Algo más que debamos saber?'}
            {step === 3 && '¡Listo!'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 1 && 'Toca el tipo de crisis — eso es todo por ahora'}
            {step === 2 && 'Opcional. Cuéntanos brevemente el contexto.'}
            {step === 3 && 'Creando tus 3 tareas urgentes...'}
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
                <span className="text-2xl">{crisis.emoji}</span>
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
              <ArrowLeft className="h-3 w-3" />
              Volver a elegir tipo de onboarding
            </button>
          </div>
        )}

        {/* ── Paso 2: Contexto opcional + confirmación ── */}
        {step === 2 && selectedCrisis && (
          <div className="space-y-6">
            {/* Crisis seleccionada */}
            <div className="flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3">
              <span className="text-2xl">{selectedCrisis.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-red-200">{selectedCrisis.label}</p>
                <p className="text-xs text-red-400">{selectedCrisis.subtitle}</p>
              </div>
            </div>

            {/* Contexto */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contexto adicional <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <Textarea
                placeholder="Ej: llevamos 2 meses sin cerrar ningún deal a pesar de tener demos..."
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
                <ArrowLeft className="h-4 w-4 mr-1" />
                Cambiar
              </Button>
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
              3 tareas urgentes creadas. Redirigiendo al dashboard...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-slate-500 mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
