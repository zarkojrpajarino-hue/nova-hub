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
  LucideIcon,
} from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onComplete: () => void;
}

interface WelcomeStep {
  title: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

export function WelcomeModal({ open, onComplete }: WelcomeModalProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: WelcomeStep[] = [
    {
      title: t('onboarding.welcomeTitle'),
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            <strong>NOVA</strong> {t('onboarding.welcomeDesc')}
          </p>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-semibold mb-2">{t('onboarding.keyConcept')}</h4>
            <ul className="space-y-2 text-sm">
              <li>{t('onboarding.noHayJefes')}</li>
              <li>{t('onboarding.todosExploranRoles')}</li>
              <li>{t('onboarding.meritoConDatos')}</li>
              <li>{t('onboarding.puedesDesafiarMaster')}</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: t('onboarding.threePhasesTitle'),
      icon: Rocket,
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-semibold">{t('onboarding.phase1Title')}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('onboarding.phase1Desc')}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-semibold">{t('onboarding.phase2Title')}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('onboarding.teEnfocasEnTus')} <strong>{t('onboarding.top2Roles')}</strong> {t('onboarding.phase2Desc')}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-semibold">{t('onboarding.phase3Title')}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('onboarding.eligesTu')} <strong>{t('onboarding.rolEstrella')}</strong> {t('onboarding.phase3Desc')}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: t('onboarding.fitScoreTitle'),
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <p>
            {t('onboarding.fitScoreIntro', { score: '0 a 5.0' })}
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold">50%</span>
              </div>
              <div>
                <h5 className="font-semibold">{t('onboarding.metricasObjetivas')}</h5>
                <p className="text-sm text-muted-foreground">{t('onboarding.tareasCompletadasATiempo')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold">30%</span>
              </div>
              <div>
                <h5 className="font-semibold">{t('onboarding.feedbackDeCompaneros')}</h5>
                <p className="text-sm text-muted-foreground">{t('onboarding.evaluacionesQueTusCompañeros')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold">20%</span>
              </div>
              <div>
                <h5 className="font-semibold">{t('onboarding.autoevaluacion')}</h5>
                <p className="text-sm text-muted-foreground">{t('onboarding.tuPropiaReflexiónSobre')}</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm">
              <strong>{t('onboarding.tip')}:</strong> {t('onboarding.fitScoreTip')}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: t('onboarding.challengesTitle'),
      icon: Trophy,
      content: (
        <div className="space-y-4">
          <p>{t('onboarding.cualquieraPuedeDesafiarA')} <strong>{t('onboarding.todos')}</strong> {t('onboarding.estosRequisitos')}:</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-semibold text-sm mb-1">{t('onboarding.fitScore')}</p>
              <p className="text-2xl font-bold text-primary">&ge; 4.2</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-semibold text-sm mb-1">{t('onboarding.experiencia')}</p>
              <p className="text-2xl font-bold text-primary">&ge; 4 {t('onboarding.semanas')}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-semibold text-sm mb-1">{t('onboarding.ranking')}</p>
              <p className="text-2xl font-bold text-primary">Top 3</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-semibold text-sm mb-1">{t('onboarding.tareas')}</p>
              <p className="text-2xl font-bold text-primary">&ge; 80%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-semibold text-sm mb-1">{t('onboarding.feedback')}</p>
              <p className="text-2xl font-bold text-primary">&ge; 3</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-semibold text-sm mb-1">{t('onboarding.obvs')}</p>
              <p className="text-2xl font-bold text-primary">&ge; 2</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <h5 className="font-semibold mb-2">{t('onboarding.challengeTypesTitle')}:</h5>
            <ul className="text-sm space-y-1">
              <li>
                <strong>{t('onboarding.performanceBattle')}:</strong> {t('onboarding.performanceBattleDesc')}
              </li>
              <li>
                <strong>{t('onboarding.projectShowdown')}:</strong> {t('onboarding.projectShowdownDesc')}
              </li>
              <li>
                <strong>{t('onboarding.peerVote')}:</strong> {t('onboarding.peerVoteDesc')}
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: t('onboarding.gamificationTitle'),
      icon: Target,
      content: (
        <div className="space-y-4">
          <p>{t('onboarding.ganaBadges')}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-gradient-to-br from-blue-500/10 to-blue-600/10">
              <p className="text-2xl mb-1">&#x1F5FA;&#xFE0F;</p>
              <p className="font-semibold text-sm">{t('onboarding.explorador')}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.completaFase1')}</p>
            </div>

            <div className="p-3 rounded-lg border bg-gradient-to-br from-purple-500/10 to-purple-600/10">
              <p className="text-2xl mb-1">&#x1F451;</p>
              <p className="font-semibold text-sm">{t('onboarding.master')}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.alcanzaFase3')}</p>
            </div>

            <div className="p-3 rounded-lg border bg-gradient-to-br from-amber-500/10 to-amber-600/10">
              <p className="text-2xl mb-1">&#x1F525;</p>
              <p className="font-semibold text-sm">{t('onboarding.enRacha')}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.diasConsecutivos')}</p>
            </div>

            <div className="p-3 rounded-lg border bg-gradient-to-br from-green-500/10 to-green-600/10">
              <p className="text-2xl mb-1">&#x1F48E;</p>
              <p className="font-semibold text-sm">{t('onboarding.invencible')}</p>
              <p className="text-xs text-muted-foreground">{t('onboarding.defiende3Veces')}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('onboarding.hay')} <strong>{t('onboarding.totalBadges')}</strong> {t('onboarding.enTotal')} <strong>{t('onboarding.miDesarrolloLogros')}</strong>
          </p>
        </div>
      ),
    },
    {
      title: t('onboarding.readyTitle'),
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <p className="text-lg">{t('onboarding.yaTienesTodoLo')}</p>

          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
            <h4 className="font-semibold mb-3">{t('onboarding.nextSteps')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{t('onboarding.uneteAUnProyecto')}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{t('onboarding.comienzaExploracion')}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{t('onboarding.completaTareasCreaObvs')}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{t('onboarding.subeFitScore')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Users size={20} className="text-blue-500 flex-shrink-0" />
            <p className="text-sm">
              <strong>{t('onboarding.recuerda')}:</strong> {t('onboarding.todoEsPublico')}
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Clock size={20} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm">
              <strong>{t('onboarding.tip')}:</strong> {t('onboarding.rotacionesAutomaticas')}
            </p>
          </div>
        </div>
      ),
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
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

  const StepIcon = steps[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <StepIcon className="text-white" size={24} />
            </div>
            <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2 mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('onboarding.pasoNDeM', { current: currentStep + 1, total: steps.length })}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="py-4">{steps[currentStep].content}</div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip} size="sm">{t('onboarding.saltarTutorial')}</Button>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft size={16} className="mr-2" />{t('onboarding.anterior')}
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                <>{t('onboarding.comenzar')}<Rocket size={16} className="ml-2" /></>
              ) : (
                <>{t('onboarding.siguiente')}<ArrowRight size={16} className="ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
