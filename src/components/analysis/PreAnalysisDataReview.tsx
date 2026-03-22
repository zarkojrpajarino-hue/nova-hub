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
  onGenerate: (additionalContext?: string) => void;
  onClose: () => void;
}

const LEVEL_LABELS: Record<number, string> = {
  1: t('analysis.nivel1DiagnósticoInicial'),
  2: t('analysis.nivel2ConDatos'),
  3: t('analysis.nivel3AnálisisCompleto'),
};

export function PreAnalysisDataReview({
  open,
  level,
  dataRows,
  isGenerating,
  onGenerate,
  onClose,
}: PreAnalysisDataReviewProps) {
  const { t } = useTranslation();
  const [additionalContext, setAdditionalContext] = useState('');
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const handleGenerate = () => {
    onGenerate(additionalContext.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisión de datos — {LEVEL_LABELS[level]}</DialogTitle>
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

        {/* Contexto adicional */}
        <div className="space-y-2">
          <Label htmlFor="additional-context" className="text-sm font-medium">Contexto adicional<span className="font-normal text-gray-500">(opcional)</span>
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
              <>Generar análisis →</>
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
  }
): DataRow[] {
  const rows: DataRow[] = [
    {
      label: t('analysis.proyecto'),
      value: projectData?.nombre ?? '—',
      source: { name: t('analysis.onboarding'), type: 'declared', updated_at: null },
    },
    {
      label: t('analysis.faseActualDelMotor'),
      value: projectData?.fase ? `Fase ${projectData.fase}` : '—',
      source: { name: t('analysis.motorDeFases'), type: 'estimated', updated_at: null },
    },
    {
      label: t('analysis.nivelDeRiesgo'),
      value: projectData?.riskLevel ?? '—',
      source: { name: t('analysis.motorDeRiesgo'), type: 'estimated', updated_at: null },
    },
    {
      label: t('analysis.probabilidadDeÉxito'),
      value: projectData?.probability !== undefined ? `${projectData.probability}%` : '—',
      source: { name: t('analysis.motorDeProbabilidad'), type: 'estimated', updated_at: null },
    },
    {
      label: t('analysis.decisionesEstratégicas'),
      value: projectData?.decisions !== undefined ? `${projectData.decisions} registradas` : '—',
      source: { name: t('analysis.decisiones'), type: 'observed', updated_at: null },
    },
  ];

  if (level >= 2) {
    rows.push({
      label: t('analysis.mrrActual'),
      value: projectData?.mrr !== null && projectData?.mrr !== undefined
        ? `€${projectData.mrr.toLocaleString('es')}`
        : t('analysis.sinDatosDeIntegración'),
      source: { name: t('analysis.stripeMétricas'), type: projectData?.mrr ? 'observed' : 'declared', updated_at: null },
    });
    rows.push({
      label: t('analysis.runwayEstimado'),
      value: projectData?.runway !== null && projectData?.runway !== undefined
        ? `${projectData.runway} meses`
        : '—',
      source: { name: t('analysis.métricasFinancieras'), type: 'declared', updated_at: null },
    });
    for (const conn of (projectData?.connections ?? [])) {
      rows.push({
        label: `Integración ${conn.provider}`,
        value: t('analysis.activa'),
        source: { name: conn.provider, type: 'observed', updated_at: conn.last_sync_at },
      });
    }
  }

  return rows;
}
