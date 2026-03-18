import { useState, useEffect } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ViabilityStateData } from '@/hooks/useNovaDataOptimized';

// ── Copy por trigger_type ─────────────────────────────────────────────────────

const YELLOW_COPY: Record<string, { title: string; body: string }> = {
  stagnation:      { title: 'Proyecto sin avance',          body: 'El proyecto lleva varios ciclos sin progresar. Revisa si hay bloqueos activos o tareas sin completar.' },
  margin_risk:     { title: 'Señal de riesgo financiero',   body: 'El flujo de caja muestra señales de alerta. Revisa tus métricas financieras.' },
  overload:        { title: 'Sobrecarga operativa',         body: 'La carga de tareas puede estar limitando el avance. Considera redistribuir o priorizar.' },
  weak_validation: { title: 'Validación externa débil',     body: 'El proyecto tiene pocas señales del mercado. Busca más feedback externo.' },
};

const RED_COPY: Record<string, { title: string; body: string }> = {
  stagnation:      { title: 'Bloqueo crítico',              body: 'El proyecto lleva demasiados ciclos sin avanzar. Se necesita acción inmediata.' },
  margin_risk:     { title: 'Riesgo de caja crítico',       body: 'El flujo de caja en negativo puede comprometer la continuidad del proyecto.' },
  overload:        { title: 'Sobrecarga crítica',           body: 'La carga operativa impide el avance. Prioriza desbloquear los cuellos de botella.' },
  weak_validation: { title: 'Validación críticamente débil', body: 'Sin señal del mercado, el proyecto no puede avanzar a la siguiente fase.' },
};

const T2_COPY = {
  title: 'Flujo de caja negativo',
  body:  'El flujo de caja ha estado en negativo más de 2 meses con alta confianza. Prioridad máxima.',
};

const FALLBACK_YELLOW = { title: 'Señales de alerta activas', body: 'El proyecto muestra señales de alerta. Revisa el estado general.' };
const FALLBACK_RED    = { title: 'Estado crítico',            body: 'El proyecto está en estado crítico. Se requiere acción inmediata.' };

// ── sessionStorage helpers ────────────────────────────────────────────────────

function dismissKey(projectId: string, status: string, trigger: string | null) {
  return `viability:${projectId}:${status}:${trigger ?? 'none'}:dismissed`;
}

function collapseKey(projectId: string) {
  return `viability:${projectId}:collapsed`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ViabilityBannerProps {
  viabilityData: ViabilityStateData | null | undefined;
  projectId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ViabilityBanner({ viabilityData, projectId }: ViabilityBannerProps) {
  const status  = viabilityData?.viability_status ?? null;
  const trigger = viabilityData?.top_trigger_type  ?? null;
  const t2      = viabilityData?.t2_cash_flow_active ?? false;

  const dKey = dismissKey(projectId, status ?? '', trigger);
  const cKey = collapseKey(projectId);

  const [dismissed, setDismissed] = useState(() =>
    typeof sessionStorage !== 'undefined' ? !!sessionStorage.getItem(dKey) : false
  );
  const [collapsed, setCollapsed] = useState(() =>
    typeof sessionStorage !== 'undefined' ? !!sessionStorage.getItem(cKey) : false
  );

  // Sincronizar estado si status/trigger cambian entre renders
  useEffect(() => {
    setDismissed(!!sessionStorage.getItem(dKey));
  }, [dKey]);

  // Sin datos o healthy → no renderizar
  if (!status || status === 'healthy') return null;

  const isYellow = status === 'monitoring' || status === 'stagnation';
  const isRed    = status === 'critical';

  // Yellow: si está dismissed, no renderizar
  if (isYellow && dismissed) return null;

  const copy = isRed
    ? (t2 ? T2_COPY : (RED_COPY[trigger ?? ''] ?? FALLBACK_RED))
    : (YELLOW_COPY[trigger ?? ''] ?? FALLBACK_YELLOW);

  function handleDismiss() {
    sessionStorage.setItem(dKey, '1');
    setDismissed(true);
  }

  function handleToggleCollapse() {
    const next = !collapsed;
    if (next) {
      sessionStorage.setItem(cKey, '1');
    } else {
      sessionStorage.removeItem(cKey);
    }
    setCollapsed(next);
  }

  if (isYellow) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-warning">{copy.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{copy.body}</p>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Cerrar alerta"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Red — collapsible but persistent
  if (collapsed) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        <p className="flex-1 text-sm font-semibold text-destructive">{copy.title}</p>
        <button
          onClick={handleToggleCollapse}
          aria-label="Expandir alerta crítica"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-destructive">{copy.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{copy.body}</p>
      </div>
      <button
        onClick={handleToggleCollapse}
        aria-label="Colapsar alerta crítica"
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </div>
  );
}
