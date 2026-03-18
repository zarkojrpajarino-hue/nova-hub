/**
 * DISCOVERY THINKING FORM
 *
 * O5.5 — sub-estado "Sin hipótesis" dentro del path idea.
 * Recibe hypothesis_maturity ('none' | 'partial') desde IdeaFastStart.
 *
 * 5 pasos guiados (Design Thinking mínimo):
 *   1. Usuario/segmento  — ¿quién tiene el problema?
 *   2. Problema          — ¿qué dolor o necesidad tiene?
 *   3. Contexto actual   — ¿cómo lo resuelven hoy?
 *   4. Idea solución     — ¿qué construirías?
 *   5. Síntesis          — hipótesis auto-formateada + riskiest_assumption + nombre proyecto
 *
 * Output → onComplete({
 *   project_name, business_description,
 *   hypothesis_maturity,        // propagado desde IdeaFastStart
 *   riskiest_assumption,        // asunción más crítica para validar
 *   dt_answers, fast_start_type, completed_at
 * })
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  User,
  AlertCircle,
  HelpCircle,
  Wrench,
  FileText,
  CheckCircle2,
  TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DTAnswers {
  usuario_segmento: string;
  problema: string;
  contexto_actual: string;
  idea_solucion: string;
}

type HypothesisMaturity = 'none' | 'partial';

interface DiscoveryThinkingFormProps {
  hypothesisMaturity: HypothesisMaturity;
  onComplete: (data: Record<string, unknown>) => void;
}

const STEPS = [
  {
    field: 'usuario_segmento' as keyof DTAnswers,
    icon: User,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'Usuario / Segmento',
    question: '¿Quién tiene el problema que quieres resolver?',
    hint: 'Sé específico: freelancers de diseño, padres de niños menores de 5 años, dueños de pequeños restaurantes...',
    placeholder: 'Ej: Pequeñas empresas de e-commerce que gestionan inventario manualmente',
    minLength: 20,
  },
  {
    field: 'problema' as keyof DTAnswers,
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    title: 'Problema',
    question: '¿Qué dolor o necesidad tiene ese usuario?',
    hint: 'Describe la frustración real, no la solución. ¿Qué les cuesta tiempo, dinero o estrés?',
    placeholder: 'Ej: Pierden horas actualizando stock en múltiples canales y cometen errores de inventario frecuentes',
    minLength: 30,
  },
  {
    field: 'contexto_actual' as keyof DTAnswers,
    icon: HelpCircle,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    title: 'Contexto actual',
    question: '¿Cómo lo resuelven hoy?',
    hint: 'Hojas de cálculo, procesos manuales, herramientas inadecuadas, o simplemente no lo resuelven.',
    placeholder: 'Ej: Usan hojas de Excel y actualizan manualmente cada plataforma (Shopify, Amazon, Instagram)',
    minLength: 20,
  },
  {
    field: 'idea_solucion' as keyof DTAnswers,
    icon: Wrench,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    title: 'Idea de solución',
    question: '¿Qué podrías construir para resolverlo?',
    hint: 'No tiene que ser perfecta. ¿Cuál es la idea central? Puede ser un producto, servicio o proceso.',
    placeholder: 'Ej: Una herramienta que sincroniza el inventario en tiempo real entre todos sus canales automáticamente',
    minLength: 20,
  },
] as const;

function formatHypothesis(a: DTAnswers): string {
  return `Creemos que ${a.usuario_segmento} tiene el problema: "${a.problema}". Actualmente lo resuelven: ${a.contexto_actual}. Una solución posible sería: ${a.idea_solucion}.`;
}

export function DiscoveryThinkingForm({ hypothesisMaturity, onComplete }: DiscoveryThinkingFormProps) {
  const [step, setStep] = useState(0); // 0–3: pasos DT, 4: síntesis
  const [answers, setAnswers] = useState<DTAnswers>({
    usuario_segmento: '',
    problema: '',
    contexto_actual: '',
    idea_solucion: '',
  });
  const [projectName, setProjectName] = useState('');
  const [riskiestAssumption, setRiskiestAssumption] = useState('');

  const isStepValid =
    step < STEPS.length
      ? answers[STEPS[step].field].trim().length >= STEPS[step].minLength
      : projectName.trim().length >= 3 && riskiestAssumption.trim().length >= 15;

  const handleComplete = () => {
    if (!isStepValid) return;
    onComplete({
      project_name: projectName.trim(),
      business_description: formatHypothesis(answers),
      fast_start_type: 'idea_discovery',
      hypothesis_maturity: hypothesisMaturity,
      riskiest_assumption: riskiestAssumption.trim(),
      dt_answers: { ...answers },
      completed_at: new Date().toISOString(),
    });
  };

  // ── Paso 4: Síntesis — hipótesis + riskiest_assumption + nombre ───────────
  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Síntesis</CardTitle>
                <p className="text-sm text-muted-foreground">Paso 5 de 5 — Hipótesis inicial</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Hipótesis auto-formateada */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm font-semibold text-green-800">Hipótesis formulada</p>
              </div>
              <p className="text-sm text-green-900 leading-relaxed italic">
                {formatHypothesis(answers)}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Esta es tu hipótesis de partida. Podrás refinarla a medida que valides con usuarios reales.
            </p>

            {/* Asunción más arriesgada */}
            <div className="space-y-2">
              <Label htmlFor="riskiest_assumption" className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-amber-500" />
                ¿Cuál es la asunción más arriesgada? <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                ¿Qué tendría que ser verdad para que tu solución tenga valor? Si esto falla, todo falla.
              </p>
              <Input
                id="riskiest_assumption"
                placeholder="Ej: Que el dolor sea suficientemente frecuente como para pagar por una solución"
                value={riskiestAssumption}
                onChange={(e) => setRiskiestAssumption(e.target.value)}
              />
              {riskiestAssumption.trim().length > 0 && riskiestAssumption.trim().length < 15 && (
                <p className="text-xs text-destructive">Sé más específico (mínimo 15 caracteres)</p>
              )}
            </div>

            {/* Nombre del proyecto */}
            <div className="space-y-2">
              <Label htmlFor="project_name" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                ¿Cómo vas a llamar a tu proyecto? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project_name"
                placeholder="Ej: SyncStock, IdeaFlow, PetCare Pro..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              {projectName.trim().length > 0 && projectName.trim().length < 3 && (
                <p className="text-xs text-destructive">Mínimo 3 caracteres</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!isStepValid}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Empezar a validar
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Pasos 0–3: preguntas DT ────────────────────────────────────────────────
  const current = STEPS[step];
  const Icon = current.icon;
  const currentValue = answers[current.field];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Barra de progreso */}
      <div className="flex items-center gap-1.5 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all',
              i <= step ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
          {step + 1} / 5
        </span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', current.bg)}>
              <Icon className={cn('h-6 w-6', current.color)} />
            </div>
            <div>
              <CardTitle className="text-xl">{current.title}</CardTitle>
              <p className="text-sm text-muted-foreground">Paso {step + 1} de 5 — Design Thinking</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn('rounded-lg p-4 border', current.bg, current.border)}>
            <p className="font-semibold mb-1">{current.question}</p>
            <p className="text-sm text-muted-foreground">{current.hint}</p>
          </div>

          <Textarea
            placeholder={current.placeholder}
            rows={4}
            value={currentValue}
            onChange={(e) => setAnswers({ ...answers, [current.field]: e.target.value })}
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{currentValue.length} / {current.minLength} caracteres mínimo</span>
            {isStepValid && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Suficiente
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
            )}
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid}
              className="flex-1"
            >
              {step === 3 ? 'Ver hipótesis' : 'Siguiente'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
