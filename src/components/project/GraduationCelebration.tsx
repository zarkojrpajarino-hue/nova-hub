/**
 * G8.6 — Graduation Celebration
 *
 * Shown once when graduated transitions to true.
 * Offers share buttons (Twitter/LinkedIn) for viral growth.
 * Dismissable — persists dismissal in localStorage.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GraduationCelebrationProps {
  projectName: string;
  projectId: string;
}

export function GraduationCelebration({ projectName, projectId }: GraduationCelebrationProps) {
  const { t } = useTranslation();
  const storageKey = `graduation_celebrated_${projectId}`;
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === 'true');

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  const tweetText = encodeURIComponent(
    `Mi startup "${projectName}" acaba de graduarse del bootcamp de Nova Hub — 4 fases de validación completadas. Ahora empieza la etapa de ciclos estratégicos de 90 días.`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const linkedInText = encodeURIComponent(
    `Mi startup "${projectName}" completó las 4 fases de validación en Nova Hub y se gradúa a ciclos estratégicos. De la idea a la tracción, con datos reales.`
  );
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://novahub.app')}&summary=${linkedInText}`;

  return (
    <div className="relative bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-amber-400 hover:text-amber-600 transition-colors"
        aria-label={t('project.cerrar')}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="bg-amber-100 rounded-full p-3 shrink-0">
          <GraduationCap className="h-8 w-8 text-amber-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 mb-1">
            {t('graduation.title')}
          </h3>
          <p className="text-sm text-amber-700 mb-4">
            {t('graduation.message', { name: projectName })}
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={() => window.open(tweetUrl, '_blank', 'width=550,height=420')}
            >
              <Share2 className="h-3.5 w-3.5" />
              {t('graduation.twitter')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={() => window.open(linkedInUrl, '_blank', 'width=550,height=420')}
            >
              <Share2 className="h-3.5 w-3.5" />
              {t('graduation.linkedin')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-amber-600"
              onClick={handleDismiss}
            >
              {t('graduation.notNow')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
