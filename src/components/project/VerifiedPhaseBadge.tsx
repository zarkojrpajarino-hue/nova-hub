/**
 * V4.8.7 — VerifiedPhaseBadge
 *
 * Exportable badge showing "Verified Phase N" with Optimus-K branding.
 * Includes an export-to-image button using html-to-image.
 */

import { useRef, useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface VerifiedPhaseBadgeProps {
  phase: number;
  score: number;
  projectName?: string;
  /** If false, hide the export button (e.g. when embedded inline) */
  showExport?: boolean;
}

export function VerifiedPhaseBadge({
  phase,
  score,
  projectName,
  showExport = true,
}: VerifiedPhaseBadgeProps) {
  const { t } = useTranslation();
  const badgeRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!badgeRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(badgeRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#000000',
      });
      const link = document.createElement('a');
      link.download = `optimus-k-phase-${phase}-verified.png`;
      link.href = dataUrl;
      link.click();
      toast.success(t('project.badgeExported'));
    } catch {
      toast.error(t('project.badgeExportFailed'));
    } finally {
      setExporting(false);
    }
  }, [phase, t]);

  const phaseLabel = `${t('project.badgePhase')} ${phase}`;

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        ref={badgeRef}
        className="relative flex items-center gap-3 rounded-xl border-2 border-[#5CE1E6]/60 bg-black px-5 py-3 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          minWidth: 220,
        }}
      >
        {/* Optimus-K logo mark */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            background: 'linear-gradient(135deg, #5CE1E6, #7C3AED)',
          }}
        >
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-widest text-[#5CE1E6]/80">
            Optimus-K
          </span>
          <span className="text-sm font-bold text-white">
            {t('project.badgeVerified')} {phaseLabel}
          </span>
          {projectName && (
            <span className="text-[10px] text-white/50 truncate max-w-[160px]">
              {projectName}
            </span>
          )}
          <span className="text-[10px] text-white/40">
            Score: {Math.round(score)}%
          </span>
        </div>
      </div>

      {showExport && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="gap-1.5 text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          {t('project.badgeExportBtn')}
        </Button>
      )}
    </div>
  );
}
