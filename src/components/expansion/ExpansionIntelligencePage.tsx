/**
 * F22.5 — ExpansionIntelligencePage
 *
 * Página principal de Expansion Intelligence.
 * Si !isReady: muestra ExpansionReadinessTeaser.
 * Si isReady: muestra análisis con 3 market cards + transparency panel.
 */

import { useState } from 'react';
import { Globe, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExpansionReadiness } from '@/hooks/useExpansionReadiness';
import { ExpansionReadinessTeaser } from './ExpansionReadinessTeaser';
import { ExpansionMarketCard, type ExpansionMarket } from './ExpansionMarketCard';

import { useTranslation } from 'react-i18next';
interface ExpansionIntelligencePageProps {
  projectId: string;
}

export function ExpansionIntelligencePage({ projectId }: ExpansionIntelligencePageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: readiness, isLoading: readinessLoading } = useExpansionReadiness(projectId);
  const [showTransparency, setShowTransparency] = useState(false);

  // Fetch cached analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['expansion-analysis', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expansion_analysis_cache')
        .select('*')
        .eq('project_id', projectId)
        .gt('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!readiness?.isReady,
  });

  // Generate analysis
  const generateAnalysis = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('analyze-expansion-v1', {
        body: { projectId },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expansion-analysis', projectId] });
      toast.success(t('expansion.análisisDeExpansiónGenerado'));
    },
    onError: () => {
      toast.error(t('expansion.errorAlGenerarAnálisis'));
    },
  });

  if (readinessLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not ready → show teaser
  if (!readiness?.isReady) {
    return (
      <div className="max-w-md mx-auto py-8">
        <ExpansionReadinessTeaser projectId={projectId} />
      </div>
    );
  }

  // Ready but no analysis yet
  const markets = (analysis?.markets ?? []) as ExpansionMarket[];
  const output = (analysis?.output ?? {}) as Record<string, unknown>;
  const runnerUps = (output.runner_ups ?? []) as Array<{ country: string; overall_score: number; excluded_reason: string }>;
  const inputSnapshot = (analysis?.input_snapshot ?? {}) as Record<string, unknown>;

  if (!analysis && !analysisLoading) {
    return (
      <div className="max-w-md mx-auto py-8">
        <ExpansionReadinessTeaser
          projectId={projectId}
          onAnalyze={() => generateAnalysis.mutate()}
        />
        {generateAnalysis.isPending && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analizando mercados... (30-60 segundos)
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-lg font-semibold">{t('expansion.expansionIntelligence')}</h2>
            <p className="text-xs text-muted-foreground">
              {analysis ? `Generado: ${new Date(analysis.generated_at).toLocaleDateString()}` : t('expansion.cargando')}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generateAnalysis.mutate()}
          disabled={generateAnalysis.isPending}
          className="gap-1"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${generateAnalysis.isPending ? 'animate-spin' : ''}`} />{t('expansion.regenerar')}</Button>
      </div>

      {/* F22.9 — Transparency Panel */}
      <button
        type="button"
        onClick={() => setShowTransparency(!showTransparency)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showTransparency ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        ¿Por qué estos mercados?
      </button>

      {showTransparency && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
          <div>
            <p className="font-medium text-xs mb-1">{t('expansion.datosDelNegocioUsados')}</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>País actual: {String(inputSnapshot.country ?? 'N/A')}</li>
              <li>Sector: {String(inputSnapshot.sector ?? 'N/A')}</li>
              <li>MRR: €{String(inputSnapshot.mrr ?? 0)}/mes</li>
              <li>Modelo: {String(inputSnapshot.business_model ?? 'N/A')}</li>
            </ul>
          </div>
          {runnerUps.length > 0 && (
            <div>
              <p className="font-medium text-xs mb-1">Mercados descartados (posiciones 4-5)</p>
              {runnerUps.map((ru, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  #{i + 4}: {ru.country} (score {Math.round(ru.overall_score)}) — {ru.excluded_reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Market cards */}
      {analysisLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {markets.map((market, i) => (
            <ExpansionMarketCard key={`${market.country}-${i}`} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
