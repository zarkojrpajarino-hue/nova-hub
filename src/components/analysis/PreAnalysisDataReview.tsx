/**
 * PreAnalysisDataReview — F20.4
 *
 * Modal obligatorio antes de llamar a la edge function.
 * El usuario ve exactamente qué datos usará la IA antes de generar.
 * Sin este modal no se genera el análisis — no hay bypass.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { SourceBadge } from '@/components/shared/SourceBadge';
import { useNavigate, useParams } from 'react-router-dom';
import type { AnalysisDataSource } from '@/hooks/useProjectAnalysis';

import { useTranslation } from 'react-i18next';
interface DataRow {
  label: string;
  value: string;
  source: AnalysisDataSource;
}

interface PreAnalysisDataReviewProps {
  open: boolean;
  level: 1 | 2 | 3;
  dataRows: DataRow[];
  isGenerating: boolean;
  onGenerate: (additionalContext?: string, focusArea?: string) => void;
  onClose: () => void;
}

function getLevelLabels(t: (k: string) => string): Record<number, string> {
  return {
    1: t('analysis.nivel1DiagnósticoInicial'),
    2: t('analysis.nivel2ConDatos'),
    3: t('analysis.nivel3AnálisisCompleto'),
  };
}

export function PreAnalysisDataReview({
  open,
  level,
  dataRows,
  isGenerating,
  onGenerate,
  onClose,
}: PreAnalysisDataReviewProps) {
  const { t } = useTranslation();
  const LEVEL_LABELS = getLevelLabels(t);
  const [additionalContext, setAdditionalContext] = useState('');
  const [focusArea, setFocusArea] = useState('general');
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const handleGenerate = () => {
    onGenerate(
      additionalContext.trim() || undefined,
      focusArea !== 'general' ? focusArea : undefined,
    );
  };

  const FOCUS_OPTIONS = [
    { value: 'general', label: t('analysis.focusGeneral') },
    { value: 'finanzas', label: t('analysis.focusFinanzas') },
    { value: 'equipo', label: t('analysis.focusEquipo') },
    { value: 'producto', label: t('analysis.focusProducto') },
    { value: 'ventas', label: t('analysis.focusVentas') },
    { value: 'ejecucion', label: t('analysis.focusEjecucion') },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('analysis.revisiónDeDatos')} — {LEVEL_LABELS[level]}</DialogTitle>
          <DialogDescription>{t('analysis.laIaUsaráExactamente')}</DialogDescription>
        </DialogHeader>

        {/* Tabla de datos */}
        <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:bg-gray-900">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{t('analysis.dato')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{t('analysis.valorActual')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{t('analysis.fiabilidad')}</th>
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-900/20'}`}
                >
                  <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">{row.label}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 max-w-xs">
                    <span className="line-clamp-2">{row.value || '—'}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <SourceBadge
                      type={row.source.type}
                      source={row.source.name}
                      timestamp={row.source.updated_at ?? undefined}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botón actualizar datos (integraciones) */}
        {level >= 2 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t('analysis.losDatosDeIntegración')}</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-sm"
              onClick={() => {
                onClose();
                navigate(`/proyecto/${projectId}/integrations`);
              }}
            >{t('analysis.actualizarDatos')}<ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Focus area selector — Upgrade 4 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('analysis.focusAreaLabel')}</Label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFocusArea(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  focusArea === opt.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contexto adicional */}
        <div className="space-y-2">
          <Label htmlFor="additional-context" className="text-sm font-medium">{t('analysis.contextoAdicional')}<span className="font-normal text-gray-500">({t('analysis.opcional')})</span>
          </Label>
          <Textarea
            id="additional-context"
            placeholder={t('analysis.añadeUrgenciasPreguntasEspecíficas')}
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value.slice(0, 300))}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-gray-400 text-right">{additionalContext.length}/300</p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>{t('analysis.cancelar')}</Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />{t('analysis.generandoAnálisis')}</>
            ) : (
              <>{t('analysis.generarAnálisis')} →</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Helper para construir filas desde datos del proyecto ──────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function buildDataRows(
  level: number,
  projectData?: {
    nombre?: string;
    fase?: number;
    riskLevel?: string;
    probability?: number;
    mrr?: number | null;
    runway?: number | null;
    connections?: Array<{ provider: string; last_sync_at: string }>;
    decisions?: number;
  },
  t?: (k: string) => string,
): DataRow[] {
  const tr = t ?? ((k: string) => k);
  const rows: DataRow[] = [
    {
      label: tr('analysis.proyecto'),
      value: projectData?.nombre ?? '—',
      source: { name: tr('analysis.onboarding'), type: 'declared', updated_at: null },
    },
    {
      label: tr('analysis.faseActualDelMotor'),
      value: projectData?.fase ? `Fase ${projectData.fase}` : '—',
      source: { name: tr('analysis.motorDeFases'), type: 'estimated', updated_at: null },
    },
    {
      label: tr('analysis.nivelDeRiesgo'),
      value: projectData?.riskLevel ?? '—',
      source: { name: tr('analysis.motorDeRiesgo'), type: 'estimated', updated_at: null },
    },
    {
      label: tr('analysis.probabilidadDeÉxito'),
      value: projectData?.probability !== undefined ? `${projectData.probability}%` : '—',
      source: { name: tr('analysis.motorDeProbabilidad'), type: 'estimated', updated_at: null },
    },
    {
      label: tr('analysis.decisionesEstratégicas'),
      value: projectData?.decisions !== undefined ? `${projectData.decisions} ${tr('analysis.registradas')}` : '—',
      source: { name: tr('analysis.decisiones'), type: 'observed', updated_at: null },
    },
  ];

  if (level >= 2) {
    rows.push({
      label: tr('analysis.mrrActual'),
      value: projectData?.mrr !== null && projectData?.mrr !== undefined
        ? `€${projectData.mrr.toLocaleString('es')}`
        : tr('analysis.sinDatosDeIntegración'),
      source: { name: tr('analysis.stripeMétricas'), type: projectData?.mrr ? 'observed' : 'declared', updated_at: null },
    });
    rows.push({
      label: tr('analysis.runwayEstimado'),
      value: projectData?.runway !== null && projectData?.runway !== undefined
        ? `${projectData.runway} ${tr('analysis.meses')}`
        : '—',
      source: { name: tr('analysis.métricasFinancieras'), type: 'declared', updated_at: null },
    });
    for (const conn of (projectData?.connections ?? [])) {
      rows.push({
        label: `${tr('analysis.integración')} ${conn.provider}`,
        value: tr('analysis.activa'),
        source: { name: conn.provider, type: 'observed', updated_at: conn.last_sync_at },
      });
    }
  }

  return rows;
}
