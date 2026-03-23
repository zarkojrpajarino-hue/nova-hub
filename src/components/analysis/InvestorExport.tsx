/**
 * InvestorExport -- F20 Upgrade 5 + F20.V2.2
 *
 * Exporta un resumen limpio del analisis para inversores.
 * Genera markdown y lo copia al clipboard. No incluye Hard Truths.
 * F20.V2.2: PDF export via window.print() con stylesheet dedicado.
 */

import { useState, useRef, useCallback } from 'react';
import { FileText, Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { AnalysisSection } from '@/hooks/useProjectAnalysis';

interface InvestorExportProps {
  projectId: string;
  analysis: {
    sections: AnalysisSection;
    confidence_overall: number;
    generated_at: string;
  };
  projectName: string;
  currentPhase?: number;
  probability?: number;
  mrr?: number | null;
  runway?: number | null;
}

function buildInvestorMarkdown(
  props: InvestorExportProps,
  t: (k: string) => string,
): string {
  const { analysis, projectName, currentPhase, probability, mrr, runway } = props;
  const { sections } = analysis;
  const lines: string[] = [];

  lines.push(`# ${projectName} -- ${t('analysis.investorReportTitle')}`);
  lines.push('');

  // Header info
  lines.push(`**${t('analysis.investorPhase')}:** ${currentPhase ?? '—'}`);
  if (probability !== undefined) {
    lines.push(`**${t('analysis.investorProbability')}:** ${probability}%`);
  }
  lines.push(`**${t('analysis.investorDate')}:** ${new Date(analysis.generated_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  lines.push('');

  // Executive Summary
  if (sections.executive_summary) {
    lines.push(`## ${t('analysis.resumenEjecutivo')}`);
    lines.push('');
    lines.push(sections.executive_summary.paragraph);
    lines.push('');
    lines.push(`**Momentum Score:** ${sections.executive_summary.momentum_score}/10`);
    lines.push('');

    if (sections.executive_summary.strengths.length > 0) {
      lines.push(`### ${t('analysis.fortalezas')}`);
      for (const s of sections.executive_summary.strengths) {
        lines.push(`- ${s}`);
      }
      lines.push('');
    }
  }

  // Key Metrics
  if (mrr !== undefined && mrr !== null || runway !== undefined && runway !== null) {
    lines.push(`## ${t('analysis.investorKeyMetrics')}`);
    lines.push('');
    if (mrr !== null && mrr !== undefined) {
      lines.push(`- **MRR:** EUR${mrr.toLocaleString('es')}`);
    }
    if (runway !== null && runway !== undefined) {
      lines.push(`- **Runway:** ${runway} ${t('analysis.meses')}`);
    }
    if (sections.financial_pulse?.mrr_trend) {
      lines.push(`- **${t('analysis.investorMRRTrend')}:** ${sections.financial_pulse.mrr_trend}`);
    }
    lines.push('');
  }

  // Financial Pulse
  if (sections.financial_pulse) {
    lines.push(`## ${t('analysis.pulsoFinanciero')}`);
    lines.push('');
    if (sections.financial_pulse.burn_signal) {
      lines.push(sections.financial_pulse.burn_signal);
    }
    if (sections.financial_pulse.data_freshness_note) {
      lines.push(`> ${sections.financial_pulse.data_freshness_note}`);
    }
    lines.push('');
  }

  // Phase Fit
  if (sections.phase_fit) {
    lines.push(`## ${t('analysis.fitDeFase')}`);
    lines.push('');
    lines.push(`**${t('analysis.investorVerdict')}:** ${sections.phase_fit.verdict}`);
    lines.push('');
    lines.push(sections.phase_fit.recommendation);
    lines.push('');
  }

  // Pipeline (if available)
  if (sections.pipeline_traction) {
    lines.push(`## ${t('analysis.pipelineYTracción')}`);
    lines.push('');
    if (sections.pipeline_traction.deals_count !== null) {
      lines.push(`- **${t('analysis.dealsActivos')}:** ${sections.pipeline_traction.deals_count}`);
    }
    if (sections.pipeline_traction.revenue_potential !== null && sections.pipeline_traction.revenue_potential !== undefined) {
      lines.push(`- **${t('analysis.revenuePotencial')}:** EUR${sections.pipeline_traction.revenue_potential.toLocaleString('es')}`);
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*${t('analysis.investorFooter')}*`);

  return lines.join('\n');
}

/**
 * F20.V2.2 — Builds structured HTML for the print-based PDF export.
 * Includes Optimus-K branding, analysis date, all investor-safe sections, data sources.
 */
function buildInvestorHTML(
  props: InvestorExportProps,
  t: (k: string) => string,
): string {
  const { analysis, projectName, currentPhase, probability, mrr, runway } = props;
  const { sections } = analysis;
  const date = new Date(analysis.generated_at).toLocaleDateString('es', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const lines: string[] = [];

  // Header with branding
  lines.push('<div style="border-bottom:2px solid #7C3AED;padding-bottom:16px;margin-bottom:24px">');
  lines.push(`<h1 style="font-size:24px;font-weight:700;color:#0D0A1A;margin:0">${projectName}</h1>`);
  lines.push(`<p style="font-size:14px;color:#6b7280;margin:4px 0 0">${t('analysis.investorReportTitle')} &mdash; Optimus-K</p>`);
  lines.push('</div>');

  // Meta info
  lines.push('<table style="width:100%;font-size:13px;margin-bottom:20px;border-collapse:collapse">');
  lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${t('analysis.investorPhase')}</td><td style="font-weight:600">${currentPhase ?? '\u2014'}</td></tr>`);
  if (probability !== undefined) {
    lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${t('analysis.investorProbability')}</td><td style="font-weight:600">${probability}%</td></tr>`);
  }
  lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${t('analysis.investorDate')}</td><td style="font-weight:600">${date}</td></tr>`);
  lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${t('analysis.investorKeyMetrics')} &mdash; ${t('analysis.confidenceLabel')}</td><td style="font-weight:600">${Math.round(analysis.confidence_overall * 100)}%</td></tr>`);
  lines.push('</table>');

  // Executive Summary
  if (sections.executive_summary) {
    lines.push(`<h2 style="font-size:18px;font-weight:600;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:20px 0 10px">${t('analysis.resumenEjecutivo')}</h2>`);
    lines.push(`<p style="font-size:13px;line-height:1.6">${sections.executive_summary.paragraph}</p>`);
    lines.push(`<p style="font-size:13px;font-weight:600;margin-top:8px">Momentum Score: ${sections.executive_summary.momentum_score}/10</p>`);
    if (sections.executive_summary.strengths.length > 0) {
      lines.push(`<h3 style="font-size:14px;font-weight:600;margin:12px 0 6px">${t('analysis.fortalezas')}</h3>`);
      lines.push('<ul style="padding-left:20px;font-size:13px;line-height:1.6">');
      for (const s of sections.executive_summary.strengths) {
        lines.push(`<li>${s}</li>`);
      }
      lines.push('</ul>');
    }
  }

  // Key Metrics
  if ((mrr !== undefined && mrr !== null) || (runway !== undefined && runway !== null)) {
    lines.push(`<h2 style="font-size:18px;font-weight:600;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:20px 0 10px">${t('analysis.investorKeyMetrics')}</h2>`);
    lines.push('<ul style="padding-left:20px;font-size:13px;line-height:1.6">');
    if (mrr !== null && mrr !== undefined) {
      lines.push(`<li><strong>MRR:</strong> EUR${mrr.toLocaleString('es')}</li>`);
    }
    if (runway !== null && runway !== undefined) {
      lines.push(`<li><strong>Runway:</strong> ${runway} ${t('analysis.meses')}</li>`);
    }
    if (sections.financial_pulse?.mrr_trend) {
      lines.push(`<li><strong>${t('analysis.investorMRRTrend')}:</strong> ${sections.financial_pulse.mrr_trend}</li>`);
    }
    lines.push('</ul>');
  }

  // Financial Pulse
  if (sections.financial_pulse) {
    lines.push(`<h2 style="font-size:18px;font-weight:600;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:20px 0 10px">${t('analysis.pulsoFinanciero')}</h2>`);
    if (sections.financial_pulse.burn_signal) {
      lines.push(`<p style="font-size:13px;line-height:1.6">${sections.financial_pulse.burn_signal}</p>`);
    }
    if (sections.financial_pulse.data_freshness_note) {
      lines.push(`<p style="font-size:12px;color:#6b7280;font-style:italic;margin-top:6px">${sections.financial_pulse.data_freshness_note}</p>`);
    }
  }

  // Phase Fit
  if (sections.phase_fit) {
    lines.push(`<h2 style="font-size:18px;font-weight:600;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:20px 0 10px">${t('analysis.fitDeFase')}</h2>`);
    lines.push(`<p style="font-size:13px;line-height:1.6"><strong>${t('analysis.investorVerdict')}:</strong> ${sections.phase_fit.verdict}</p>`);
    lines.push(`<p style="font-size:13px;line-height:1.6">${sections.phase_fit.recommendation}</p>`);
  }

  // Pipeline
  if (sections.pipeline_traction) {
    lines.push(`<h2 style="font-size:18px;font-weight:600;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:20px 0 10px">${t('analysis.pipelineYTracción')}</h2>`);
    lines.push('<ul style="padding-left:20px;font-size:13px;line-height:1.6">');
    if (sections.pipeline_traction.deals_count !== null) {
      lines.push(`<li><strong>${t('analysis.dealsActivos')}:</strong> ${sections.pipeline_traction.deals_count}</li>`);
    }
    if (sections.pipeline_traction.revenue_potential !== null && sections.pipeline_traction.revenue_potential !== undefined) {
      lines.push(`<li><strong>${t('analysis.revenuePotencial')}:</strong> EUR${sections.pipeline_traction.revenue_potential.toLocaleString('es')}</li>`);
    }
    lines.push('</ul>');
  }

  // Data sources
  lines.push('<div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:12px;font-size:11px;color:#9ca3af">');
  const sources: string[] = [];
  if (sections.pipeline_traction?.source) sources.push(sections.pipeline_traction.source);
  if (sections.financial_pulse?.mrr_current !== null && sections.financial_pulse?.mrr_current !== undefined) sources.push('key_metrics');
  if (sources.length > 0) {
    lines.push(`<p>${t('analysis.investorDataSources')}: ${sources.join(', ')}</p>`);
  }
  lines.push(`<p>${t('analysis.investorFooter')}</p>`);
  lines.push('</div>');

  return lines.join('\n');
}

export function InvestorExport(props: InvestorExportProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const markdown = buildInvestorMarkdown(props, t);
  const investorHTML = buildInvestorHTML(props, t);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success(t('analysis.investorCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('analysis.investorCopyError'));
    }
  };

  const handlePrintPDF = useCallback(() => {
    if (!printRef.current) return;
    // Show the hidden print div, trigger print, then hide again
    printRef.current.style.display = 'block';
    window.print();
    // After print dialog closes, hide it again (sync in most browsers)
    printRef.current.style.display = 'none';
    toast.success(t('analysis.investorPDFReady'));
  }, [t]);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <FileText className="h-3.5 w-3.5" />
        {t('analysis.investorExportBtn')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('analysis.investorExportTitle')}</DialogTitle>
            <DialogDescription>{t('analysis.investorExportDesc')}</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-900 p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {markdown}
            </pre>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('analysis.cancelar')}
            </Button>
            <Button variant="outline" onClick={handlePrintPDF} className="gap-2">
              <Download className="h-4 w-4" />
              {t('analysis.investorDownloadPDF')}
            </Button>
            <Button onClick={handleCopy} className="gap-2">
              {copied ? (
                <><Check className="h-4 w-4" />{t('analysis.investorCopiedBtn')}</>
              ) : (
                <><Copy className="h-4 w-4" />{t('analysis.investorCopyBtn')}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* F20.V2.2 — Hidden print container. Visible only during window.print() via @media print */}
      <div
        ref={printRef}
        id="investor-export-print"
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: investorHTML }}
      />
    </>
  );
}
