/**
 * 🎯 ONBOARDING STEPPER - Visual Progress Indicator
 * Stepper horizontal profesional para el onboarding
 */

import { CheckCircle2 } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  icon: any;
}

interface Props {
  steps: Step[];
  currentStepIndex: number;
}

export function OnboardingStepper({ steps, currentStepIndex }: Props) {
  return (
    <div className="w-full bg-white/80 backdrop-blur rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Icon */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${isActive ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white scale-110 shadow-lg' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-300 text-gray-600' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <div className="mt-2 text-center min-w-[80px]">
                  <p
                    className={`
                      text-xs font-medium transition-colors
                      ${isActive ? 'text-purple-600 font-bold' : ''}
                      ${isCompleted ? 'text-green-600 font-semibold' : ''}
                      ${!isActive && !isCompleted ? 'text-gray-600 font-medium' : ''}
                    `}
                  >
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative">
                  <div className="absolute inset-0 bg-gray-200" />
                  <div
                    className={`
                      absolute inset-0 transition-all duration-500
                      ${isCompleted ? 'bg-green-500' : 'bg-transparent'}
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
