/**
 * M2.7 — Investor Summary (Paywall Premium)
 *
 * Genera un resumen ejecutivo para inversores con datos reales del proyecto.
 * Gated por advanced_analytics (plan Pro+).
 *
 * Contenido:
 *   - Business snapshot (fase, score, MRR, equipo)
 *   - Traction metrics (OBVs validadas, leads convertidos)
 *   - Growth trajectory (MRR últimos 3 meses)
 *   - Risk assessment (nivel de riesgo, viabilidad)
 *   - Exportable como texto (copiar al portapapeles)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Copy, Check, Lock, TrendingUp, Users, Target, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PHASE_LABELS } from '@/lib/engine';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import type { ProjectEngineData } from '@/hooks/useNovaDataOptimized';

interface InvestorSummaryProps {
  projectId: string;
  projectName: string;
  engineData: ProjectEngineData | null | undefined;
}

function InvestorSummaryContent({ projectId, projectName, engineData }: InvestorSummaryProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Fetch metrics for summary
  const { data: metrics } = useQuery({
    queryKey: ['investor-metrics', projectId],
    queryFn: async () => {
      const [metricsRes, obvsRes, membersRes] = await Promise.all([
        supabase
          .from('key_metrics')
          .select('mrr, total_customers, date')
          .eq('project_id', projectId)
          .order('date', { ascending: false })
          .limit(3),
        supabase
          .from('obvs')
          .select('id', { count: 'exact' })
          .eq('project_id', projectId)
          .eq('obv_outcome', 'success'),
        supabase
          .from('project_members')
          .select('id', { count: 'exact' })
          .eq('project_id', projectId),
      ]);
      return {
        mrrHistory: metricsRes.data ?? [],
        validatedObvs: obvsRes.count ?? 0,
        teamSize: membersRes.count ?? 0,
      };
    },
    staleTime: 5 * 60_000,
  });

  const phase = engineData?.phase?.current_phase ?? 0;
  const score = Math.round(engineData?.phase?.phase_score ?? 0);
  const riskLevel = engineData?.risk?.risk_level ?? 'unknown';
  const currentMrr = metrics?.mrrHistory?.[0]?.mrr ?? 0;
  const customers = metrics?.mrrHistory?.[0]?.total_customers ?? 0;

  const summaryText = `
INVESTOR SUMMARY — ${projectName}
Generated: ${new Date().toISOString().split('T')[0]}

━━ BUSINESS SNAPSHOT ━━
Phase: ${phase} — ${PHASE_LABELS[phase] ?? t('project.unknown')} (Score: ${score}%)
MRR: €${Math.round(currentMrr).toLocaleString()}
Customers: ${customers}
Team: ${metrics?.teamSize ?? 1} members
Validated experiments: ${metrics?.validatedObvs ?? 0}

━━ TRACTION ━━
${metrics?.mrrHistory?.map((m: { mrr?: number; date?: string }) =>
  `${m.date}: €${Math.round(m.mrr ?? 0).toLocaleString()} MRR`
).join('\n') || t('project.noMrrDataYet')}

━━ RISK ━━
Risk Level: ${riskLevel}
Phase Progress: ${score >= 75 ? 'Ready to advance': score >= 50 ? 'On track': t('project.needsAttention')}

━━ METHODOLOGY ━━
Nova Hub Phase Engine — data-driven startup validation across 5 phases.
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('investor.title')}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">{t('project.pro')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Snapshot grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              {t('investor.phase')}
            </div>
            <div className="font-semibold text-sm">
              {phase} — {PHASE_LABELS[phase]}
            </div>
            <div className="text-xs text-muted-foreground">Score: {score}%</div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              {t('investor.mrr')}
            </div>
            <div className="font-semibold text-sm">€{Math.round(currentMrr).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{customers} {t('investor.customers')}</div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              {t('investor.team')}
            </div>
            <div className="font-semibold text-sm">{metrics?.teamSize ?? 1}</div>
            <div className="text-xs text-muted-foreground">{metrics?.validatedObvs ?? 0} {t('investor.validatedObvs')}</div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3 w-3" />
              {t('investor.risk')}
            </div>
            <div className="font-semibold text-sm capitalize">{riskLevel}</div>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'copied': t('investor.copyForInvestors')}
        </Button>
      </CardContent>
    </Card>
  );
}

export function InvestorSummary(props: InvestorSummaryProps) {
  return (
    <FeatureGate
      feature="advanced_analytics"
      projectId={props.projectId}
      featureName={t('project.investorSummary')}
      mode="replace"
    >
      <InvestorSummaryContent {...props} />
    </FeatureGate>
  );
}
