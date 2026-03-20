import type { ProjectEngineData, ViabilityStateData } from '@/hooks/useNovaDataOptimized';

// ── Derivation (exported — reusable if other components need mode awareness) ──

export type ProjectMode = 'build' | 'rescue';

// eslint-disable-next-line react-refresh/only-export-components
export function deriveProjectMode(
  risk: ProjectEngineData['risk'],
  viability: ViabilityStateData | null | undefined,
): ProjectMode {
  const riskLevel       = risk?.risk_level        ?? 'low';
  const viabilityStatus = viability?.viability_status ?? 'healthy';

  if (riskLevel === 'high' || riskLevel === 'critical' || viabilityStatus === 'critical') {
    return 'rescue';
  }
  return 'build';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ProjectModeBadgeProps {
  engineData: ProjectEngineData | null | undefined;
  viabilityData: ViabilityStateData | null | undefined;
}

export function ProjectModeBadge({ engineData, viabilityData }: ProjectModeBadgeProps) {
  const mode = deriveProjectMode(engineData?.risk, viabilityData);

  if (mode === 'rescue') {
    return (
      <div className="flex flex-col items-end bg-destructive/10 border border-destructive/20 rounded-lg px-2.5 py-1.5 shrink-0">
        <p className="text-xs font-semibold text-destructive leading-none">Rescue Mode</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Prioriza estabilizar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end bg-success/10 border border-success/20 rounded-lg px-2.5 py-1.5 shrink-0">
      <p className="text-xs font-semibold text-success leading-none">Build Mode</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Construcción normal</p>
    </div>
  );
}
