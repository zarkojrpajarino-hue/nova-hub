import { useState, useEffect } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ViabilityStateData } from '@/hooks/useNovaDataOptimized';
import { SourceBadge } from '@/components/shared/SourceBadge';

import { useTranslation } from 'react-i18next';
// ── Copy por trigger_type ─────────────────────────────────────────────────────

const YELLOW_COPY_KEYS: Record<string, { title: string; body: string }> = {
  stagnation:      { title: 'project.proyectoSinAvance',          body: 'project.elProyectoLlevaVarios' },
  margin_risk:     { title: 'project.señalDeRiesgoFinanciero',   body: 'project.elFlujoDeCaja' },
  overload:        { title: 'project.sobrecargaOperativa',         body: 'project.laCargaDeTareas' },
  weak_validation: { title: 'project.validaciónExternaDébil',     body: 'project.elProyectoTienePocas' },
};

const RED_COPY_KEYS: Record<string, { title: string; body: string }> = {
  stagnation:      { title: 'project.bloqueoCrítico',              body: 'project.elProyectoLlevaDemasiados' },
  margin_risk:     { title: 'project.riesgoDeCajaCrítico',       body: 'project.elFlujoDeCaja0' },
  overload:        { title: 'project.sobrecargaCrítica',           body: 'project.laCargaOperativaImpide' },
  weak_validation: { title: 'project.validaciónCríticamenteDébil', body: 'project.sinSeñalDelMercado' },
};

const T2_COPY_KEYS = {
  title: 'project.flujoDeCajaNegativo',
  body:  'project.elFlujoDeCaja1',
};

function getFallbackYellow(t: (k: string) => string) { return { title: t('project.señalesDeAlertaActivas'), body: t('project.elProyectoMuestraSeñales') }; }
function getFallbackRed(t: (k: string) => string) { return { title: t('project.estadoCrítico'),            body: t('project.elProyectoEstáEn') }; }

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
  const { t } = useTranslation();
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

  const rawKeys = isRed
    ? (t2 ? T2_COPY_KEYS : RED_COPY_KEYS[trigger ?? ''])
    : YELLOW_COPY_KEYS[trigger ?? ''];
  const copy = rawKeys
    ? { title: t(rawKeys.title), body: t(rawKeys.body) }
    : (isRed ? getFallbackRed(t) : getFallbackYellow(t));

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
        <SourceBadge type="estimated" source={t('transparency.motorDeViabilidad')} reliability={0.5} size="sm" />
        </div>
        <button
          onClick={handleDismiss}
          aria-label={t('project.cerrarAlerta')}
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
          aria-label={t('project.expandirAlertaCrítica')}
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
        aria-label={t('project.colapsarAlertaCrítica')}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </div>
  );
}
