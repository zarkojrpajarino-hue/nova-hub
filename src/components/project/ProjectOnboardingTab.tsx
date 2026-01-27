import { useState } from 'react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { OnboardingSummary } from '@/components/onboarding/OnboardingSummary';
import type { OnboardingData } from '@/components/onboarding/types';

interface ProjectOnboardingTabProps {
  project: {
    id: string;
    nombre: string;
    tipo: string;
    color: string;
    icon: string;
    onboarding_completed: boolean;
    onboarding_data?: OnboardingData | null;
  };
  isCompleted: boolean;
}

export function ProjectOnboardingTab({ project, isCompleted }: ProjectOnboardingTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  // If completed and not editing, show summary
  if (isCompleted && !isEditing && project.onboarding_data) {
    return (
      <div className="animate-fade-in">
        <OnboardingSummary 
          data={project.onboarding_data as OnboardingData}
          projectColor={project.color}
          onEdit={() => setIsEditing(true)}
        />
      </div>
    );
  }

  // Show wizard for new onboarding or editing
  return (
    <div className="animate-fade-in">
      <OnboardingWizard
        project={project}
        onComplete={() => setIsEditing(false)}
        onCancel={isEditing ? () => setIsEditing(false) : undefined}
        editMode={isEditing}
      />
    </div>
  );
}
