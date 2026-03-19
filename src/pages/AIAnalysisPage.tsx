/**
 * AIAnalysisPage — F20.11
 *
 * Página full de análisis estratégico IA.
 * Nivel desbloqueado calculado por useProjectAnalysis.
 * PostHog: trackAnalysisUnlockLevel, trackAnalysisGenerated (en hook).
 */

import { useParams } from 'react-router-dom';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { useProjectAnalysis } from '@/hooks/useProjectAnalysis';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AIAnalysisDashboard } from '@/components/analysis/AIAnalysisDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function AIAnalysisPage() {
  const { currentProject } = useCurrentProject();
  const projectId = currentProject?.id;

  // Nivel activo — por ahora siempre renderizamos el máximo disponible
  // El hook internamente decide qué nivel está desbloqueado
  const analysisState = useProjectAnalysis(projectId, 3);

  // Datos de contexto para PreAnalysisDataReview y header
  const { data: contextData, isLoading } = useQuery({
    queryKey: ['analysis-context', projectId],
    enabled: !!projectId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [
        { data: phaseState },
        { data: riskScore },
        { data: probability },
        { data: connections },
        { count: decisionCount },
        { data: latestMetric },
      ] = await Promise.all([
        supabase.from('project_phase_state').select('current_phase').eq('project_id', projectId!).maybeSingle(),
        supabase.from('project_risk_score').select('risk_level').eq('project_id', projectId!).maybeSingle(),
        supabase.from('project_probability').select('probability').eq('project_id', projectId!).maybeSingle(),
        supabase.from('integration_connections').select('provider, last_sync_at').eq('project_id', projectId!).eq('status', 'active'),
        supabase.from('decision_events').select('id', { count: 'exact', head: true }).eq('project_id', projectId!),
        supabase.from('key_metrics').select('mrr, runway_months').eq('project_id', projectId!).order('date', { ascending: false }).limit(1).maybeSingle(),
      ]);

      return {
        currentPhase: phaseState?.current_phase,
        riskLevel: riskScore?.risk_level,
        probability: probability?.probability,
        activeConnections: (connections ?? []).map(c => ({
          provider: c.provider,
          last_sync_at: c.last_sync_at ?? '',
        })),
        decisionCount: decisionCount ?? 0,
        mrr: latestMetric?.mrr ?? null,
        runway: latestMetric?.runway_months ?? null,
      };
    },
  });

  if (!currentProject) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecciona un proyecto desde el selector en el header
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Análisis estratégico IA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Diagnóstico en 3 niveles que se desbloquean progresivamente según actividad e integraciones
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <AIAnalysisDashboard
          projectId={currentProject.id}
          projectName={currentProject.nombre}
          analysisState={analysisState}
          currentPhase={contextData?.currentPhase}
          riskLevel={contextData?.riskLevel}
          probability={contextData?.probability}
          mrr={contextData?.mrr}
          runway={contextData?.runway}
          activeConnections={contextData?.activeConnections}
          decisionCount={contextData?.decisionCount}
        />
      )}
    </div>
  );
}
