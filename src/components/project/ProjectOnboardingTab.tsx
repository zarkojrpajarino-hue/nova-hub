import { useState } from 'react';
import { Rocket, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ONBOARDING_STEPS = [
  { id: 'vision', title: '¿Cuál es la visión del proyecto?', placeholder: 'Describe la visión a largo plazo...' },
  { id: 'problema', title: '¿Qué problema resuelve?', placeholder: 'Describe el problema que abordáis...' },
  { id: 'cliente', title: '¿Quién es vuestro cliente ideal?', placeholder: 'Perfil del cliente objetivo...' },
  { id: 'propuesta', title: '¿Cuál es vuestra propuesta de valor?', placeholder: 'Lo que os hace únicos...' },
  { id: 'objetivos', title: 'Objetivos para este semestre', placeholder: 'Facturación, leads, OBVs...' },
];

interface ProjectOnboardingTabProps {
  project: any;
  isCompleted: boolean;
}

export function ProjectOnboardingTab({ project, isCompleted }: ProjectOnboardingTabProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          onboarding_completed: true,
          onboarding_data: answers,
        })
        .eq('id', project.id);

      if (error) throw error;

      toast.success('¡Onboarding completado!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-success" />
          </div>
          <h3 className="font-bold text-xl mb-2">Onboarding Completado</h3>
          <p className="text-muted-foreground mb-6">
            El equipo ya ha definido la visión y objetivos del proyecto
          </p>

          {/* Show saved data if available */}
          {project.onboarding_data && (
            <div className="text-left max-w-lg mx-auto space-y-4">
              {ONBOARDING_STEPS.map(step => (
                <div key={step.id} className="p-4 bg-background rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">{step.title}</p>
                  <p className="font-medium">{project.onboarding_data[step.id] || '-'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = ONBOARDING_STEPS[currentStep];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <Rocket size={18} className="text-primary" />
          <h3 className="font-semibold">Onboarding del Proyecto</h3>
        </div>

        <div className="p-8">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {ONBOARDING_STEPS.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-all",
                  i === currentStep ? "bg-primary text-primary-foreground" :
                  i < currentStep ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {i < currentStep ? <Check size={16} /> : i + 1}
                </div>
                {i < ONBOARDING_STEPS.length - 1 && (
                  <div className={cn("w-8 h-0.5", i < currentStep ? "bg-success" : "bg-border")} />
                )}
              </div>
            ))}
          </div>

          {/* Question */}
          <div className="max-w-lg mx-auto">
            <h4 className="text-lg font-semibold text-center mb-6">
              {currentQuestion.title}
            </h4>
            
            <Textarea
              value={answers[currentQuestion.id] || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
              placeholder={currentQuestion.placeholder}
              rows={5}
              className="mb-8"
            />

            {/* Actions */}
            <div className="flex justify-center gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  Atrás
                </Button>
              )}
              
              {currentStep < ONBOARDING_STEPS.length - 1 ? (
                <Button 
                  className="nova-gradient" 
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                >
                  Siguiente <ChevronRight size={16} className="ml-1" />
                </Button>
              ) : (
                <Button 
                  className="nova-gradient" 
                  onClick={handleComplete}
                  disabled={isSubmitting || !answers[currentQuestion.id]}
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Guardando...</>
                  ) : (
                    <>Completar <Check size={16} className="ml-1" /></>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
