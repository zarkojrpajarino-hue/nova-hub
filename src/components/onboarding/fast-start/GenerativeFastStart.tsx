/**
 * GENERATIVE FAST START
 *
 * Para usuarios SIN IDEA que quieren emprender.
 * Metodología: Business Model Generation.
 *
 * Fases internas:
 *   form       → formulario (industria, skills, inversión, tiempo)
 *   generating → spinner mientras se generan las ideas
 *   selecting  → 3 tarjetas de idea con doble filtro (O5.7)
 *
 * O5.3b: cada idea incluye nombre, descripción, cliente objetivo, monetización,
 *         perfil económico, riesgos, experimento de 7 días.
 * O5.7:
 *   Nivel 1 (hard, pre-display): ideas cuya inversión mínima supera la
 *     capacidad declarada se descartan en el generador antes de llegar aquí.
 *   Nivel 2 (warning, at-selection): avisos mostrados en la tarjeta.
 *     No bloquean la selección — el usuario los ve antes de elegir.
 *
 * Persistencia de tanda: después de generar se guarda en
 *   projects.onboarding_data.generative_ideas_tanda para que, si el usuario
 *   refresca, FastStartWizard pase savedTanda y se salte el form.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  Loader2,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateBusinessIdeas, type BusinessIdea } from '@/lib/ai-generators';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { FaseAAnswers } from './FaseACommon';

import { useTranslation } from 'react-i18next';
interface GenerativeFastStartProps {
  projectId: string;
  faseAAnswers: FaseAAnswers;
  onComplete: (data: Record<string, unknown>) => void;
  /** Tanda guardada en sesión anterior (rehydration). Si presente, salta el form. */
  savedTanda?: BusinessIdea[];
}

type GenPhase = 'form' | 'generating' | 'selecting';

// ── Viability badge ───────────────────────────────────────────────────────────

function ViabilityBadge({ score }: { score: number }) {
  const { t: _t } = useTranslation();
  if (score >= 80) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Recomendada · {score}%
      </Badge>
    );
  }
  if (score >= 65) {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
        Viable · {score}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Riesgo alto · {score}%
    </Badge>
  );
}

// ── Idea card ─────────────────────────────────────────────────────────────────

function IdeaCard({
  idea,
  onSelect,
}: {
  idea: BusinessIdea;
  onSelect: (idea: BusinessIdea) => void;
}) {
  const hasWarnings = idea.filter.nivel_2_flags.length > 0;
  const borderColor = hasWarnings ? 'border-amber-200' : 'border-gray-200 hover:border-amber-300';

  return (
    <Card className={`flex flex-col border-2 ${borderColor} transition-colors`}>
      <CardContent className="pt-5 pb-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900 leading-snug">{idea.nombre}</h3>
            <ViabilityBadge score={idea.filter.viability_score} />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{idea.descripcion_corta}</p>
        </div>

        {/* Cliente + Monetización */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{idea.cliente_objetivo}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{idea.monetizacion}</span>
          </div>
        </div>

        {/* Perfil económico */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <TrendingUp className="h-3.5 w-3.5" />{t('onboarding.perfilEconómico')}</div>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{t('onboarding.inversiónInicial')}</span>
              <span className="font-medium text-gray-800">{idea.perfil_economico.inversion_inicial_estimada}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">MRR potencial (6m)</span>
              <span className="font-medium text-gray-800">{idea.perfil_economico.mrr_potencial_6m}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">1er ingreso estimado</span>
              <span className="font-medium text-gray-800">{idea.perfil_economico.tiempo_primer_ingreso}</span>
            </div>
          </div>
        </div>

        {/* Riesgos */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('onboarding.riesgosATenerEn')}</div>
          <ul className="space-y-1">
            {idea.riesgos_principales.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                <span className="text-amber-400 flex-shrink-0 mt-0.5">·</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Experimento 7 días */}
        <div className="bg-blue-50 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <FlaskConical className="h-3.5 w-3.5" />{t('onboarding.experimentoEstaSemana')}</div>
          <p className="text-xs text-blue-800 leading-relaxed">{idea.experimento_7_dias}</p>
        </div>

        {/* Nivel 2 flags */}
        {hasWarnings && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />{t('onboarding.avisosParaTuPerfil')}</div>
            <ul className="space-y-1">
              {idea.filter.nivel_2_flags.map((flag, i) => (
                <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                  <span className="flex-shrink-0 mt-0.5">·</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={() => onSelect(idea)}
          className="w-full mt-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          size="sm"
        >{t('onboarding.elegirEstaIdea')}<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GenerativeFastStart({
  projectId,
  faseAAnswers,
  onComplete,
  savedTanda,
}: GenerativeFastStartProps) {
  const [genPhase, setGenPhase] = useState<GenPhase>(
    savedTanda && savedTanda.length > 0 ? 'selecting' : 'form',
  );
  const [ideas, setIdeas] = useState<BusinessIdea[]>(savedTanda ?? []);
  const [formData, setFormData] = useState({
    industry: '',
    skills: '',
    investment_capacity: '',
    time_commitment: '',
  });

  // If savedTanda arrives after initial render (async rehydration), switch to selecting
  useEffect(() => {
    if (savedTanda && savedTanda.length > 0 && genPhase === 'form') {
      setIdeas(savedTanda);
      setGenPhase('selecting');
    }
  }, [savedTanda, genPhase]);

  const canGenerate = () => !!formData.industry;

  // ── Persist tanda (best effort) ──────────────────────────────────────────
  const persistTanda = async (generatedIdeas: BusinessIdea[]) => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('onboarding_data')
        .eq('id', projectId)
        .single();
      const existing = ((data?.onboarding_data ?? {}) as Record<string, unknown>);
      await supabase.from('projects').update({
        onboarding_data: {
          ...existing,
          generative_ideas_tanda: generatedIdeas as unknown as Json,
        } as Json,
      }).eq('id', projectId);
    } catch {
      // Non-critical — user can re-generate if they refresh
    }
  };

  // ── Generate ideas ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate()) return;
    setGenPhase('generating');

    try {
      const generated = await generateBusinessIdeas({
        project_id: projectId,
        industry: formData.industry,
        skills: formData.skills || undefined,
        investment_capacity: formData.investment_capacity || undefined,
        time_commitment: formData.time_commitment || undefined,
        location: faseAAnswers.location_country,
        market_scope: faseAAnswers.market_scope,
        team_size: faseAAnswers.team_size,
        goal_90d: faseAAnswers.goal_90d,
      });

      if (generated.length === 0) {
        toast.error(t('onboarding.noPudimosGenerarIdeas'), {
          description: t('onboarding.pruebaConOtraIndustria'),
        });
        setGenPhase('form');
        return;
      }

      setIdeas(generated);
      // Persist before showing — best effort
      await persistTanda(generated);
      setGenPhase('selecting');
    } catch {
      toast.error(t('onboarding.errorAlGenerarIdeas'), {
        description: t('onboarding.inténtaloDeNuevo'),
      });
      setGenPhase('form');
    }
  };

  // ── Select idea ───────────────────────────────────────────────────────────
  const handleSelectIdea = (idea: BusinessIdea) => {
    onComplete({
      project_name: idea.nombre,
      business_description: idea.descripcion_corta,
      selected_industry: formData.industry,
      ai_generated_artifacts: {
        selected_idea: idea,
        generative_ideas_tanda: ideas,
      },
      fast_start_type: 'generative',
      completed_at: new Date().toISOString(),
      fase_a: faseAAnswers,
    });
  };

  // ── Render: generating ────────────────────────────────────────────────────
  if (genPhase === 'generating') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{t('onboarding.generandoTus3Ideas')}</h3>
                <p className="text-muted-foreground max-w-md">{t('onboarding.analizandoTuPerfilIndustria')}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: selecting ─────────────────────────────────────────────────────
  if (genPhase === 'selecting') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('onboarding.eligeTuIdeaDe')}</h2>
          <p className="text-gray-600 mt-1">
            {t('onboarding.threeOptionsForYourProfile')}
          </p>
        </div>

        {/* OB.G.1: Geo-intelligence context banner */}
        {faseAAnswers.location_country && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 text-sm">
              {t('onboarding.geoContextHint', { country: faseAAnswers.location_country, industry: formData.industry || t('onboarding.yourIndustry') })}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onSelect={handleSelectIdea} />
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={async () => {
              // Clear stale tanda and any previous selection from DB so rehydration
              // doesn't restore an abandoned tanda
              try {
                const { data } = await supabase
                  .from('projects')
                  .select('onboarding_data')
                  .eq('id', projectId)
                  .single();
                const existing = ((data?.onboarding_data ?? {}) as Record<string, unknown>);
                const { generative_ideas_tanda: _t, selected_idea: _s, ...rest } = existing;
                await supabase.from('projects').update({
                  onboarding_data: rest as Json,
                }).eq('id', projectId);
              } catch {
                // Non-critical — local reset proceeds regardless
              }
              setIdeas([]);
              setGenPhase('form');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >{t('onboarding.volverAGenerarCon')}</button>
        </div>
      </div>
    );
  }

  // ── Render: form ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <Lightbulb className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl">
                Genera ideas de negocio con IA
              </CardTitle>
              <CardDescription className="text-base mt-1">
                3 preguntas rápidas y generamos 3 opciones personalizadas para ti
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="bg-amber-50 border-amber-200">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>Fast Start:</strong>{t('onboarding.generamos3IdeasAdaptadas')}</AlertDescription>
          </Alert>

          {/* Q1: Industry (required) */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <Label htmlFor="industry" className="text-base font-bold text-gray-900">
                1. ¿En qué industria te interesa emprender? <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">{t('onboarding.seleccionaElSectorDonde')}</p>
            <Select
              value={formData.industry}
              onValueChange={(v) => setFormData({ ...formData, industry: v })}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder={t('onboarding.seleccionaUnaIndustria')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saas">{t('onboarding.saasSoftware')}</SelectItem>
                <SelectItem value="ecommerce">{t('onboarding.ecommerceRetail')}</SelectItem>
                <SelectItem value="health">{t('onboarding.saludYBienestar')}</SelectItem>
                <SelectItem value="education">{t('onboarding.educaciónEdtech')}</SelectItem>
                <SelectItem value="fintech">{t('onboarding.fintech')}</SelectItem>
                <SelectItem value="marketplace">{t('onboarding.marketplacePlataforma')}</SelectItem>
                <SelectItem value="food">{t('onboarding.alimentaciónYRestauración')}</SelectItem>
                <SelectItem value="services">{t('onboarding.serviciosProfesionales')}</SelectItem>
                <SelectItem value="other">{t('onboarding.otraIndustria')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Q2: Skills (optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-500" />
              <Label htmlFor="skills" className="text-base font-medium text-gray-900">
                2. Tu experiencia o habilidades principales{' '}
                <span className="text-gray-500 text-sm font-normal">(opcional)</span>
              </Label>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              Ej: t('onboarding.marketing'), t('onboarding.ingenieríaDeSoftware'), "Ventas B2B", t('onboarding.diseño')
            </p>
            <Input
              id="skills"
              type="text"
              placeholder={t('onboarding.tuBackgroundProfesional')}
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="ml-7"
            />
          </div>

          {/* Q3: Investment capacity (optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <Label htmlFor="investment" className="text-base font-medium text-gray-900">
                3. Capacidad de inversión inicial{' '}
                <span className="text-gray-500 text-sm font-normal">(opcional)</span>
              </Label>
            </div>
            <Select
              value={formData.investment_capacity}
              onValueChange={(v) => setFormData({ ...formData, investment_capacity: v })}
            >
              <SelectTrigger className="w-full ml-7">
                <SelectValue placeholder={t('onboarding.seleccionaTuRangoDe')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-5k">€0 – €5.000 (Bootstrap)</SelectItem>
                <SelectItem value="5k-25k">€5.000 – €25.000</SelectItem>
                <SelectItem value="25k-100k">€25.000 – €100.000</SelectItem>
                <SelectItem value="100k+">Más de €100.000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Q4: Time commitment (optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <Label htmlFor="time" className="text-base font-medium text-gray-900">
                4. Tiempo que puedes dedicar{' '}
                <span className="text-gray-500 text-sm font-normal">(opcional)</span>
              </Label>
            </div>
            <Select
              value={formData.time_commitment}
              onValueChange={(v) => setFormData({ ...formData, time_commitment: v })}
            >
              <SelectTrigger className="w-full ml-7">
                <SelectValue placeholder={t('onboarding.seleccionaTuDisponibilidad')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="side-project">Proyecto lateral (5–10 h/semana)</SelectItem>
                <SelectItem value="part-time">Media jornada (10–20 h/semana)</SelectItem>
                <SelectItem value="full-time">Dedicación completa (40+ h/semana)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CTA */}
          <div className="pt-6 border-t">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate()}
              className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Generar 3 ideas de negocio con IA
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {!canGenerate() && (
              <div className="flex items-center gap-2 text-sm text-amber-700 mt-3 justify-center bg-amber-50 py-2 px-4 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{t('onboarding.seleccionaUnaIndustriaPara')}</span>
              </div>
            )}

            <p className="text-xs text-center text-gray-500 mt-4">{t('onboarding.cadaIdeaIncluyeValidación')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
