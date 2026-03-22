/**
 * STARTUP OS VIEW
 *
 * Wrapper view para el Startup OS Dashboard
 */

import { useParams } from 'react-router-dom';
import { StartupOSDashboard } from '@/components/startup-os/StartupOSDashboard';

import { useTranslation } from 'react-i18next';
export function StartupOSView() {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('startupOS.noProjectSelected')}</p>
      </div>
    );
  }

  return <StartupOSDashboard projectId={projectId} />;
}
