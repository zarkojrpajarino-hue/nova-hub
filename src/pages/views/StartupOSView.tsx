/**
 * STARTUP OS VIEW
 *
 * Wrapper view para el Startup OS Dashboard
 */

import { useParams } from 'react-router-dom';
import { StartupOSDashboard } from '@/components/startup-os/StartupOSDashboard';

export function StartupOSView() {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  return <StartupOSDashboard projectId={projectId} />;
}
