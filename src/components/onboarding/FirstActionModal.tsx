/**
 * FirstActionModal — V4.8.2
 * Shows the user's first priority action immediately after onboarding.
 * Increases D1 activation rate by surfacing the aha moment before dashboard overwhelm.
 */
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FirstActionModalProps {
  actionTitle: string;
  actionDescription: string;
  onAction: () => void;
  onDismiss: () => void;
}

export function FirstActionModal({ actionTitle, actionDescription, onAction, onDismiss }: FirstActionModalProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
        <button onClick={onDismiss} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-xl font-bold mb-2">{t('onboarding.firstActionTitle')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('onboarding.firstActionSubtitle')}</p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{actionTitle}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{actionDescription}</p>
        </div>

        <Button onClick={onAction} className="w-full gap-2" size="lg">
          {t('onboarding.doItNow')}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <button onClick={onDismiss} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
          {t('onboarding.laterOnDashboard')}
        </button>
      </div>
    </div>
  );
}
