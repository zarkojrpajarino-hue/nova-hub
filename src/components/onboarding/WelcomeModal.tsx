/**
 * WELCOME MODAL - ONBOARDING
 *
 * Modal de bienvenida que explica el sistema completo
 * Se muestra la primera vez que un usuario accede
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import {
  Rocket,
  Target,
  Trophy,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    title: '¡Bienvenido a NOVA! 🎉',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-lg">
          <strong>NOVA</strong> es una plataforma donde{' '}
          <strong>aprendes haciendo</strong> y te conviertes en Master de cualquier rol.
        </p>
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <h4 className="font-semibold mb-2">💡 Concepto clave:</h4>
          <ul className="space-y-2 text-sm">
            <li>✅ No hay jefes - organización horizontal</li>
            <li>✅ Todos exploran roles mediante experiencia práctica</li>
            <li>✅ El mérito se mide con datos objetivos (Fit Score)</li>
            <li>✅ Puedes desafiar a cualquier Master si cumples requisitos</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: 'Las 3 Fases del Camino 🚀',
    icon: Rocket,
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-semibold">Fase 1: Exploración (4 semanas)</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Pruebas 4 roles diferentes (1 semana cada uno). Descubres qué se te da mejor.
            La rotación es <strong>automática</strong> cada semana.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-semibold">Fase 2: Especialización (2 semanas)</h4>
          </div>
          <p className="text-sm text-muted-foreground">{t('onboarding.teEnfocasEnTus')}<strong>{t('onboarding.top2Roles')}</strong> (1 semana cada uno). Subes tu Fit
            Score completando tareas, OBVs y recibiendo feedback.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-semibold">Fase 3: Master (permanente)</h4>
          </div>
          <p className="text-sm text-muted-foreground">{t('onboarding.eligesTu')}<strong>rol estrella</strong> y un rol secundario. Te conviertes en
            referente del equipo. Otros pueden desafiarte si cumplen requisitos.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: '📊 ¿Qué es el Fit Score?',
    icon: TrendingUp,
    content: (
      <div className="space-y-4">
        <p>
          El <strong>{t('onboarding.fitScore')}</strong> es tu puntuación de desempeño en cada rol (de 0 a 5.0).
          Se calcula automáticamente con:
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold">50%</span>
            </div>
            <div>
              <h5 className="font-semibold">{t('onboarding.métricasObjetivas')}</h5>
              <p className="text-sm text-muted-foreground">{t('onboarding.tareasCompletadasATiempo')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold">30%</span>
            </div>
            <div>
              <h5 className="font-semibold">{t('onboarding.feedbackDeCompañeros')}</h5>
              <p className="text-sm text-muted-foreground">{t('onboarding.evaluacionesQueTusCompañeros')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold">20%</span>
            </div>
            <div>
              <h5 className="font-semibold">{t('onboarding.autoevaluación')}</h5>
              <p className="text-sm text-muted-foreground">{t('onboarding.tuPropiaReflexiónSobre')}</p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-sm">
            <strong>💡 Tip:</strong> Para obtener Fit Score alto, enfócate en completar tareas
            a tiempo, validar OBVs, y pedir feedback a tus compañeros.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: '🏆 Desafíos a Masters',
    icon: Trophy,
    content: (
      <div className="space-y-4">
        <p>{t('onboarding.cualquieraPuedeDesafiarA')}<strong>TODOS</strong> estos
          requisitos:
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-semibold text-sm mb-1">{t('onboarding.fitScore')}</p>
            <p className="text-2xl font-bold text-primary">≥ 4.2</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-semibold text-sm mb-1">{t('onboarding.experiencia')}</p>
            <p className="text-2xl font-bold text-primary">≥ 4 sem</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-semibold text-sm mb-1">{t('onboarding.ranking')}</p>
            <p className="text-2xl font-bold text-primary">Top 3</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-semibold text-sm mb-1">{t('onboarding.tareas')}</p>
            <p className="text-2xl font-bold text-primary">≥ 80%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-semibold text-sm mb-1">{t('onboarding.feedback')}</p>
            <p className="text-2xl font-bold text-primary">≥ 3</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-semibold text-sm mb-1">{t('onboarding.obvs')}</p>
            <p className="text-2xl font-bold text-primary">≥ 2</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <h5 className="font-semibold mb-2">3 Tipos de Desafío:</h5>
          <ul className="text-sm space-y-1">
            <li>
              <strong>Performance Battle:</strong> Competencia directa en métricas (2 semanas)
            </li>
            <li>
              <strong>Project Showdown:</strong> Ambos lideran un proyecto y el equipo vota (3
              semanas)
            </li>
            <li>
              <strong>Peer Vote:</strong> El equipo vota directamente (1 semana)
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: '✨ Gamificación y Badges',
    icon: Target,
    content: (
      <div className="space-y-4">
        <p>Gana badges completando logros y desafíos:</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-gradient-to-br from-blue-500/10 to-blue-600/10">
            <p className="text-2xl mb-1">🗺️</p>
            <p className="font-semibold text-sm">{t('onboarding.explorador')}</p>
            <p className="text-xs text-muted-foreground">Completa Fase 1</p>
          </div>

          <div className="p-3 rounded-lg border bg-gradient-to-br from-purple-500/10 to-purple-600/10">
            <p className="text-2xl mb-1">👑</p>
            <p className="font-semibold text-sm">{t('onboarding.master')}</p>
            <p className="text-xs text-muted-foreground">Alcanza Fase 3</p>
          </div>

          <div className="p-3 rounded-lg border bg-gradient-to-br from-amber-500/10 to-amber-600/10">
            <p className="text-2xl mb-1">🔥</p>
            <p className="font-semibold text-sm">{t('onboarding.enRacha')}</p>
            <p className="text-xs text-muted-foreground">7 días consecutivos</p>
          </div>

          <div className="p-3 rounded-lg border bg-gradient-to-br from-green-500/10 to-green-600/10">
            <p className="text-2xl mb-1">💎</p>
            <p className="font-semibold text-sm">{t('onboarding.invencible')}</p>
            <p className="text-xs text-muted-foreground">{t('onboarding.defiende3Veces')}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{t('onboarding.hay')}<strong>15 badges</strong> en total. Los encuentras en{' '}
          <strong>{t('onboarding.miDesarrolloLogros')}</strong>
        </p>
      </div>
    ),
  },
  {
    title: '🎯 ¡Estás listo para empezar!',
    icon: CheckCircle2,
    content: (
      <div className="space-y-4">
        <p className="text-lg">{t('onboarding.yaTienesTodoLo')}</p>

        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
          <h4 className="font-semibold mb-3">📍 Próximos pasos:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>{t('onboarding.úneteAUnProyecto')}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Comienza tu primera exploración de rol (1 semana)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>{t('onboarding.completaTareasCreaObvs')}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Sube tu Fit Score y avanza hacia Fase 3 (Master)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Users size={20} className="text-blue-500 flex-shrink-0" />
          <p className="text-sm">
            <strong>Recuerda:</strong> Todo es público y transparente. Puedes ver el progreso
            de cualquier persona.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Clock size={20} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm">
            <strong>Tip:</strong> Las rotaciones son automáticas cada semana. No necesitas
            hacer nada, el sistema te asignará el siguiente rol.
          </p>
        </div>
      </div>
    ),
  },
];

export function WelcomeModal({ open, onComplete }: WelcomeModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    onComplete();
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <StepIcon className="text-white" size={24} />
            </div>
            <DialogTitle className="text-2xl">{STEPS[currentStep].title}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2 mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Paso {currentStep + 1} de {STEPS.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="py-4">{STEPS[currentStep].content}</div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip} size="sm">{t('onboarding.saltarTutorial')}</Button>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft size={16} className="mr-2" />{t('onboarding.anterior')}</Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                <>{t('onboarding.comenzar')}<Rocket size={16} className="ml-2" />
                </>
              ) : (
                <>{t('onboarding.siguiente')}<ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
