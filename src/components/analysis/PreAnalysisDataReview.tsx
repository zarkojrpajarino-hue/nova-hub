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
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { SourceBadge } from '@/components/shared/SourceBadge';
import { useNavigate, useParams } from 'react-router-dom';
import type { AnalysisDataSource } from '@/hooks/useProjectAnalysis';

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
  1: 'Nivel 1 — Diagnóstico inicial',
  2: 'Nivel 2 — Con datos financieros y pipeline',
  3: 'Nivel 3 — Análisis completo con señales cruzadas',
};

export function PreAnalysisDataReview({
  open,
  level,
  dataRows,
  isGenerating,
  onGenerate,
  onClose,
}: PreAnalysisDataReviewProps) {
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
          <DialogDescription>
            La IA usará exactamente estos datos para generar tu análisis. Revísalos antes de continuar.
          </DialogDescription>
        </DialogHeader>

        {/* Tabla de datos */}
        <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:bg-gray-900">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Dato</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Valor actual</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Fiabilidad</th>
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
            <span>¿Los datos de integración están desactualizados?</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-sm"
              onClick={() => {
                onClose();
                navigate(`/proyecto/${projectId}/integrations`);
              }}
            >
              Actualizar datos <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Contexto adicional */}
        <div className="space-y-2">
          <Label htmlFor="additional-context" className="text-sm font-medium">
            Contexto adicional <span className="font-normal text-gray-500">(opcional)</span>
          </Label>
          <Textarea
            id="additional-context"
            placeholder="Añade urgencias, preguntas específicas o cambios recientes que la IA no conoce... (máx. 300 caracteres)"
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value.slice(0, 300))}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-gray-400 text-right">{additionalContext.length}/300</p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando análisis...
              </>
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
      label: 'Proyecto',
      value: projectData?.nombre ?? '—',
      source: { name: 'Onboarding', type: 'declared', updated_at: null },
    },
    {
      label: 'Fase actual del motor',
      value: projectData?.fase ? `Fase ${projectData.fase}` : '—',
      source: { name: 'Motor de fases', type: 'estimated', updated_at: null },
    },
    {
      label: 'Nivel de riesgo',
      value: projectData?.riskLevel ?? '—',
      source: { name: 'Motor de riesgo', type: 'estimated', updated_at: null },
    },
    {
      label: 'Probabilidad de éxito',
      value: projectData?.probability !== undefined ? `${projectData.probability}%` : '—',
      source: { name: 'Motor de probabilidad', type: 'estimated', updated_at: null },
    },
    {
      label: 'Decisiones estratégicas',
      value: projectData?.decisions !== undefined ? `${projectData.decisions} registradas` : '—',
      source: { name: 'Decisiones', type: 'observed', updated_at: null },
    },
  ];

  if (level >= 2) {
    rows.push({
      label: 'MRR actual',
      value: projectData?.mrr !== null && projectData?.mrr !== undefined
        ? `€${projectData.mrr.toLocaleString('es')}`
        : 'Sin datos de integración',
      source: { name: 'Stripe / métricas', type: projectData?.mrr ? 'observed' : 'declared', updated_at: null },
    });
    rows.push({
      label: 'Runway estimado',
      value: projectData?.runway !== null && projectData?.runway !== undefined
        ? `${projectData.runway} meses`
        : '—',
      source: { name: 'Métricas financieras', type: 'declared', updated_at: null },
    });
    for (const conn of (projectData?.connections ?? [])) {
      rows.push({
        label: `Integración ${conn.provider}`,
        value: 'Activa',
        source: { name: conn.provider, type: 'observed', updated_at: conn.last_sync_at },
      });
    }
  }

  return rows;
}
