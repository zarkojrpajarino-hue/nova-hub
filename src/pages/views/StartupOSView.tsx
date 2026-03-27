/**
 * STARTUP OS VIEW
 *
 * Wrapper view para el Startup OS Dashboard
 */

import { useParams } from 'react-router-dom';
import { StartupOSDashboard } from '@/components/startup-os/StartupOSDashboard';
import { useProjectEngineData } from '@/hooks/useNovaDataOptimized';

import { useTranslation } from 'react-i18next';
export function StartupOSView() {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const { data: engineData } = useProjectEngineData(projectId);
  const currentPhase = engineData?.phaseState?.current_phase ?? 0;

  if (currentPhase < 1) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold mb-2">{t('startupOS.notAvailableYet')}</h2>
          <p className="text-sm text-muted-foreground">{t('startupOS.availableFromPhase1')}</p>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">{t('startupOS.noProjectSelected')}</p>
      </div>
    );
  }

  return <StartupOSDashboard projectId={projectId} />;
}
