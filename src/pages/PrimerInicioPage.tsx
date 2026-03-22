/**
 * PRIMER INICIO — Activación post-onboarding
 *
 * Se muestra UNA sola vez después de completar el Fast Start.
 * Navegación: OnboardingPage.handleComplete → /proyecto/:id/primer-inicio
 *
 * Secciones:
 *   1. Modelo Estratégico v1 — resumen de lo que el usuario configuró
 *   2. Primera sugerencia de Optimus basada en la fase detectada
 *   3. CTAs: crear primer OBV | ir al dashboard
 *
 * Al pulsar cualquier CTA escribe first_steps_completed=true en
 * onboarding_data y no vuelve a mostrarse.
 *
 * Guard: si first_steps_completed ya es true al montar → redirect directo al dashboard.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Sparkles,
  ArrowRight,
  Target,
  Users,
  DollarSign,
  Globe,
  MapPin,
  Rocket,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';
import type { BusinessIdea } from '@/lib/ai-generators';
import type { FaseAAnswers } from '@/components/onboarding/fast-start/FaseACommon';

import { useTranslation } from 'react-i18next';
// ── Types ─────────────────────────────────────────────────────────────────────

type OnboardingType = 'generative' | 'idea' | 'existing';

interface PageData {
  projectName: string;
  projectDescription: string | null;
  onboardingType: OnboardingType;
  selectedIdea: BusinessIdea | null;
  selectedIndustry: string | null;
  faseAAnswers: FaseAAnswers | null;
  currentPhase: number;
}

// ── Label maps ────────────────────────────────────────────────────────────────

const MARKET_SCOPE_LABELS: Record<string, string> = {
  local: 'Local (ciudad / región)',
  nacional: t('primerInicio.nacional'),
  national: t('primerInicio.nacional'),
  global: 'Global (varios países)',
  international: 'Global (varios países)',
};

const MONETIZATION_LABELS: Record<string, string> = {
  transaccional: t('primerInicio.ventaÚnica'),
  suscripcion: t('primerInicio.suscripciónRecurrente'),
  ticket_alto: t('primerInicio.ticketAltoServicio'),
  contrato: t('primerInicio.contratoProyecto'),
};

// ── Optimus suggestion ────────────────────────────────────────────────────────

interface OptimusSuggestion {
  emoji: string;
  titulo: string;
  detalle: string;
  obvLabel: string;
}

function getOptimusSuggestion(phase: number): OptimusSuggestion {
  if (phase <= 1) {
    return {
      emoji: '🔍',
      titulo: t('primerInicio.tePropongoTuPrimera'),
      detalle:
        t('primerInicio.hablaCon5Personas'),
      obvLabel: t('primerInicio.crearObvDeExploración'),
    };
  }
  if (phase === 2) {
    return {
      emoji: '💰',
      titulo: t('primerInicio.veoQueTienesClientes'),
      detalle:
        t('primerInicio.registraUnaConversaciónDe'),
      obvLabel: t('primerInicio.crearObvDeValidación'),
    };
  }
  return {
    emoji: '⚙️',
    titulo: t('primerInicio.empecemosConTuPrimera'),
    detalle:
      t('primerInicio.defineElProcesoMás'),
    obvLabel: t('primerInicio.crearObvDeSistema'),
  };
}

// ── Info card component ───────────────────────────────────────────────────────

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PrimerInicioPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PageData | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Load project data ───────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      const { data: project, error } = await supabase
        .from('projects')
        .select('nombre, descripcion, onboarding_data, phase_state:project_phase_state!project_id(current_phase)')
        .eq('id', projectId)
        .single();

      if (error || !project) {
        // Can't load → go straight to dashboard
        navigate(`/proyecto/${projectId}`, { replace: true });
        return;
      }

      const od = (project.onboarding_data ?? {}) as Record<string, unknown>;

      // Guard: already completed
      if (od.first_steps_completed === true) {
        navigate(`/proyecto/${projectId}`, { replace: true });
        return;
      }

      // Extract phase — default 1 if engine hasn't run yet
      const phaseState = project.phase_state as { current_phase: number } | null;
      const currentPhase = phaseState?.current_phase ?? 1;

      setData({
        projectName: project.nombre ?? t('primerInicio.miProyecto'),
        projectDescription: project.descripcion ?? null,
        onboardingType: (od.onboarding_type as OnboardingType | undefined) ?? 'idea',
        selectedIdea: (od.selected_idea as BusinessIdea | undefined) ?? null,
        selectedIndustry: (od.selected_industry as string | undefined) ?? null,
        faseAAnswers: (od.fase_a_answers as FaseAAnswers | undefined) ?? null,
        currentPhase,
      });
      setLoading(false);
    };

    load();
  }, [projectId, navigate]);

  // ── Mark first steps completed + navigate ───────────────────────────────
  const handleCTA = async (destination: string) => {
    if (!projectId || saving) return;
    setSaving(true);

    try {
      const { data: project } = await supabase
        .from('projects')
        .select('onboarding_data')
        .eq('id', projectId)
        .single();

      const existing = ((project?.onboarding_data ?? {}) as Record<string, unknown>);
      await supabase.from('projects').update({
        onboarding_data: { ...existing, first_steps_completed: true } as Json,
      }).eq('id', projectId);
    } catch {
      // Non-critical — navigate anyway
    }

    navigate(destination);
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) return null;

  const suggestion = getOptimusSuggestion(data.currentPhase);
  const fa = data.faseAAnswers;

  // ── Build info cards for Modelo Estratégico v1 ──────────────────────────
  interface CardDef { icon: React.ElementType; label: string; value: string }
  const cards: CardDef[] = [];

  if (data.selectedIdea) {
    // Generative path — rich data from idea selection
    cards.push({ icon: Sparkles, label: t('primerInicio.tuIdeaDeNegocio'), value: data.selectedIdea.nombre });
    cards.push({ icon: Users, label: t('primerInicio.clienteObjetivo'), value: data.selectedIdea.cliente_objetivo });
    cards.push({ icon: DollarSign, label: t('primerInicio.modeloDeMonetización'), value: data.selectedIdea.monetizacion });
    cards.push({
      icon: TrendingUp,
      label: 'MRR potencial (6 meses)',
      value: data.selectedIdea.perfil_economico.mrr_potencial_6m,
    });
    cards.push({
      icon: Rocket,
      label: t('primerInicio.tiempoAlPrimerIngreso'),
      value: data.selectedIdea.perfil_economico.tiempo_primer_ingreso,
    });
  } else {
    // Idea / existing path — use project name + fase_a data
    cards.push({ icon: Sparkles, label: t('primerInicio.tuProyecto'), value: data.projectName });
    if (data.projectDescription) {
      cards.push({ icon: MessageSquare, label: t('primerInicio.descripción'), value: data.projectDescription });
    }
    if (fa?.monetization_type) {
      cards.push({
        icon: DollarSign,
        label: t('primerInicio.modeloDeMonetización'),
        value: MONETIZATION_LABELS[fa.monetization_type] ?? fa.monetization_type,
      });
    }
    if (fa?.active_customers != null && fa.active_customers > 0) {
      cards.push({ icon: Users, label: t('primerInicio.clientesActuales'), value: String(fa.active_customers) });
    }
    if (fa?.mrr_monthly != null && fa.mrr_monthly > 0) {
      cards.push({ icon: TrendingUp, label: t('primerInicio.mrrActual'), value: `€${fa.mrr_monthly.toLocaleString()}/mes` });
    }
  }

  // Common fields from Fase A (all paths)
  if (fa?.market_scope) {
    cards.push({
      icon: Globe,
      label: t('primerInicio.alcanceDeMercado'),
      value: MARKET_SCOPE_LABELS[fa.market_scope] ?? fa.market_scope,
    });
  }
  if (fa?.location_country) {
    cards.push({ icon: MapPin, label: t('primerInicio.paísDeOperación'), value: fa.location_country });
  }
  if (fa?.goal_90d) {
    cards.push({ icon: Target, label: t('primerInicio.objetivo90Días'), value: fa.goal_90d });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 py-5 px-8 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md">
            O
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                OPTIMUS-K
              </span>
            </h1>
            <p className="text-xs text-gray-500">{t('primerInicio.primerInicioConfiguraciónCompletada')}</p>
          </div>
          <div className="ml-auto">
            <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Fase {data.currentPhase}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">{t('primerInicio.tuPerfilEstáListo')}</h2>
          <p className="text-lg text-gray-600">{t('primerInicio.estoEsLoQue')}</p>
        </div>

        {/* Sección 1: Modelo Estratégico v1 */}
        <Card className="border-2 border-blue-200 shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">Modelo Estratégico v1</h3>
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 ml-auto">{t('primerInicio.generadoDesdeTuOnboarding')}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.map((card, i) => (
                <InfoCard key={i} icon={card.icon} label={card.label} value={card.value} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Primera sugerencia de Optimus */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">{suggestion.emoji}</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">{t('primerInicio.optimusSugiere')}</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                    Fase {data.currentPhase}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{suggestion.titulo}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{suggestion.detalle}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección 3: CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => handleCTA(`/proyecto/${projectId}/obvs`)}
            disabled={saving}
            className="flex-1 h-13 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Rocket className="h-5 w-5" />
            )}
            {suggestion.obvLabel}
            <ArrowRight className="h-5 w-5 ml-auto" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => handleCTA(`/proyecto/${projectId}`)}
            disabled={saving}
            className="sm:w-auto gap-2 h-13"
          >{t('primerInicio.irAlDashboard')}<ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-center text-gray-400">{t('primerInicio.puedesVolverATu')}</p>
      </div>
    </div>
  );
}
