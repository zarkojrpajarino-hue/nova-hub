import { Dialog, DialogContent } from '@/components/ui/dialog';
import { OnboardingWizard } from './OnboardingWizard';
import type { OnboardingData } from './types';

interface EditOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    nombre: string;
    tipo: string;
    color: string;
    icon: string;
    onboarding_data?: OnboardingData | null;
  };
}

export function EditOnboardingDialog({
  open,
  onOpenChange,
  project,
}: EditOnboardingDialogProps) {
  const handleComplete = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <OnboardingWizard
          project={project}
          onComplete={handleComplete}
          onCancel={handleCancel}
          editMode={true}
        />
      </DialogContent>
    </Dialog>
  );
}
