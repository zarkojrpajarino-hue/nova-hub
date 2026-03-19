/**
 * Level1Sections — F20.6
 *
 * ExecutiveSummarySection + PhaseFitSection + UrgentDecisionsSection
 * Siempre visibles cuando level >= 1 desbloqueado.
 */

import { Gauge, Target, AlertTriangle, ArrowRight, CheckCircle2, XCircle, MinusCircle, GitCompareArrows } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/shared/SourceBadge';
import { useNavigate, useParams } from 'react-router-dom';
import type { AnalysisSection } from '@/hooks/useProjectAnalysis';

// ── Executive Summary ─────────────────────────────────────────────────────────

export function ExecutiveSummarySection({ data }: { data: NonNullable<AnalysisSection['executive_summary']> }) {
  const score = data.momentum_score ?? 0;
  const scoreColor = score >= 7 ? 'text-green-600' : score >= 4 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = score >= 7 ? 'bg-green-50 border-green-200' : score >= 4 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-5 w-5 text-gray-500" />
            Resumen ejecutivo
          </CardTitle>
          {/* Momentum score */}
          <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${scoreBg}`}>
            <span className={`text-lg font-bold ${scoreColor}`}>{score}</span>
            <span className="text-xs text-gray-500">/10 momentum</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {data.paragraph}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fortalezas */}
          <div>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1.5">
              Fortalezas
            </p>
            <ul className="space-y-1">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          {/* Riesgos */}
          <div>
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1.5">
              Riesgos inmediatos
            </p>
            <ul className="space-y-1">
              {data.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Phase Fit ─────────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  'Sí':          { icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  'No':          { icon: <XCircle className="h-5 w-5" />,      color: 'text-red-600',   bg: 'bg-red-50 border-red-200'   },
  'Parcialmente':{ icon: <MinusCircle className="h-5 w-5" />,   color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
};

export function PhaseFitSection({ data }: { data: NonNullable<AnalysisSection['phase_fit']> }) {
  const cfg = VERDICT_CONFIG[data.verdict] ?? VERDICT_CONFIG['Parcialmente'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-gray-500" />
          Fit de fase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Veredicto */}
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 w-fit ${cfg.bg} ${cfg.color}`}>
          {cfg.icon}
          <span className="font-semibold">¿Haciendo lo correcto para su fase? {data.verdict}</span>
        </div>

        {/* Razones */}
        <ul className="space-y-2">
          {data.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <SourceBadge
                type={r.reliability >= 0.7 ? 'observed' : r.reliability >= 0.4 ? 'declared' : 'estimated'}
                reliability={r.reliability}
                size="sm"
                className="mt-0.5 shrink-0"
              />
              <span className="text-gray-700 dark:text-gray-300">{r.text}</span>
            </li>
          ))}
        </ul>

        {/* Recomendación */}
        <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 dark:bg-blue-950/30 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-0.5">
            Foco recomendado esta semana
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300">{data.recommendation}</p>
        </div>

        {/* Benchmark */}
        {data.benchmark_note && (
          <p className="text-xs text-gray-500 italic">{data.benchmark_note}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Contradictions ────────────────────────────────────────────────────────────

export function ContradictionsSection({ data }: { data: NonNullable<AnalysisSection['contradictions']> }) {
  if (!data.length) return null;

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompareArrows className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          Contradicciones detectadas
        </CardTitle>
        <p className="text-xs text-orange-600 dark:text-orange-500">
          Decisiones pasadas que chocan con el estado actual del proyecto
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800 p-3 space-y-2"
          >
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-[10px] shrink-0 border-orange-300 text-orange-700">
                Decisión pasada
              </Badge>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {item.past_decision}
                {item.decided_at && (
                  <span className="text-gray-400 ml-1">
                    ({new Date(item.decided_at).toLocaleDateString('es', { month: 'short', year: 'numeric' })})
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-[10px] shrink-0 border-blue-300 text-blue-700">
                Hoy
              </Badge>
              <p className="text-xs text-gray-700 dark:text-gray-300">{item.current_reality}</p>
            </div>
            <div className="rounded-md bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1.5">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                <span className="font-medium">Tensión: </span>{item.tension}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Urgent Decisions ──────────────────────────────────────────────────────────

export function UrgentDecisionsSection({ data }: { data: NonNullable<AnalysisSection['urgent_decisions']> }) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Decisiones urgentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((decision, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white dark:bg-gray-900 p-3 space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{decision.title}</p>
              <Badge variant="outline" className="shrink-0 text-xs text-gray-500">
                #{i + 1}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{decision.context}</p>
            <p className="text-xs text-red-600 dark:text-red-400">
              <span className="font-medium">Si no decides: </span>{decision.consequence}
            </p>
            {decision.cta?.label && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs gap-1 mt-1"
                onClick={() => navigate(`/proyecto/${projectId}/${decision.cta.view}`)}
              >
                {decision.cta.label}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
