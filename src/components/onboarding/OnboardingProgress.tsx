import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingStep } from './types';

interface OnboardingProgressProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function OnboardingProgress({ steps, currentStep, onStepClick }: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick?.(index)}
              disabled={index > currentStep}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm",
                isCompleted && "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                isCurrent && "bg-primary/10 text-primary",
                !isCompleted && !isCurrent && "text-muted-foreground opacity-50",
                index <= currentStep && "cursor-pointer"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                isCompleted && "bg-green-500 text-white",
                isCurrent && "bg-primary text-primary-foreground",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? <Check size={14} /> : step.icon}
              </div>
              <span className="font-medium hidden sm:inline">{step.title}</span>
            </button>
            
            {index < steps.length - 1 && (
              <ChevronRight size={14} className="text-muted-foreground/40 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
